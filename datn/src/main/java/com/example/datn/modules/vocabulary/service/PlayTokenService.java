package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.exception.InvalidPlayTokenException;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Issues and checks the playToken of docs/api/games.md: the round's content signed with HMAC-SHA256, so the browser
 * can hold it without being able to change it.
 *
 * The key is random and generated at startup, on purpose separate from the JWT secret (a play token must never be
 * usable as an access token). Restarting the server invalidates the rounds being played, which last a minute or two.
 * Rounds already handed in are remembered in memory until their token expires, which is enough for a single instance.
 */
@Component
public class PlayTokenService {

    /** A round older than this cannot be checked or handed in any more. */
    static final Duration MAX_AGE = Duration.ofHours(1);

    private static final String ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final SecureRandom random = new SecureRandom();
    private final SecretKeySpec key;
    private final StudyCalendar calendar;
    // nonce -> issuedAt of every round handed in and not yet expired
    private final Map<String, Instant> handedIn = new ConcurrentHashMap<>();

    public PlayTokenService(StudyCalendar calendar) {
        this.calendar = calendar;
        byte[] secret = new byte[32];
        random.nextBytes(secret);
        this.key = new SecretKeySpec(secret, ALGORITHM);
    }

    /** A new round starting now. */
    public PlayRound newRound(Long gameId, Long userId, List<Long> questionIds) {
        byte[] nonce = new byte[12];
        random.nextBytes(nonce);
        return new PlayRound(gameId, userId, calendar.now(), ENCODER.encodeToString(nonce), List.copyOf(questionIds));
    }

    public String sign(PlayRound round) {
        String ids = round.questionIds().stream().map(String::valueOf).collect(Collectors.joining(","));
        byte[] payload = String.join(":",
                        String.valueOf(round.gameId()),
                        String.valueOf(round.userId()),
                        String.valueOf(round.issuedAt().toEpochMilli()),
                        round.nonce(),
                        ids)
                .getBytes(StandardCharsets.UTF_8);
        return ENCODER.encodeToString(payload) + "." + ENCODER.encodeToString(hmac(payload));
    }

    /** The round of a token signed by this server, not expired, and issued to this player for this game. */
    public PlayRound verify(String token, Long gameId, Long userId) {
        PlayRound round = decode(token);
        if (!round.gameId().equals(gameId) || !round.userId().equals(userId)) {
            throw new InvalidPlayTokenException("The playToken belongs to another game or player");
        }
        if (round.issuedAt().plus(MAX_AGE).isBefore(calendar.now())) {
            throw new InvalidPlayTokenException("The playToken has expired");
        }
        return round;
    }

    /** Records that the round was handed in; false when it already was (atomic, so two parallel requests cannot both win). */
    public boolean markHandedIn(PlayRound round) {
        Instant oldestValid = calendar.now().minus(MAX_AGE);
        handedIn.values().removeIf(issuedAt -> issuedAt.isBefore(oldestValid));
        return handedIn.putIfAbsent(round.nonce(), round.issuedAt()) == null;
    }

    private PlayRound decode(String token) {
        try {
            int dot = token.indexOf('.');
            if (dot < 0) {
                throw new IllegalArgumentException("no signature");
            }
            byte[] payload = DECODER.decode(token.substring(0, dot));
            byte[] signature = DECODER.decode(token.substring(dot + 1));
            // Constant-time comparison: the time taken must not reveal how much of a forged signature is right.
            if (!MessageDigest.isEqual(hmac(payload), signature)) {
                throw new InvalidPlayTokenException("The playToken is not valid");
            }
            String[] parts = new String(payload, StandardCharsets.UTF_8).split(":", -1);
            if (parts.length != 5) {
                throw new IllegalArgumentException("unexpected payload");
            }
            List<Long> questionIds = parts[4].isEmpty()
                    ? List.of()
                    : Arrays.stream(parts[4].split(",")).map(Long::valueOf).toList();
            return new PlayRound(
                    Long.valueOf(parts[0]),
                    Long.valueOf(parts[1]),
                    Instant.ofEpochMilli(Long.parseLong(parts[2])),
                    parts[3],
                    questionIds);
        } catch (IllegalArgumentException exception) {
            throw new InvalidPlayTokenException("The playToken is not valid");
        }
    }

    // A Mac instance is not thread-safe, so every call gets its own.
    private byte[] hmac(byte[] payload) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return mac.doFinal(payload);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HmacSHA256 is not available", exception);
        }
    }
}
