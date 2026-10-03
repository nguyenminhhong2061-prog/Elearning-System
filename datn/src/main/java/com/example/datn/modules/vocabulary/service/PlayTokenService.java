package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.exception.InvalidPlayTokenException;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
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
 * Issues and checks the playToken of docs/api/games.md: the whole round, the right answers included, encrypted with
 * AES-GCM. The browser holds the round between requests but can neither read the answers nor change anything, since
 * GCM also authenticates what it encrypts.
 *
 * The key is random and generated at startup, on purpose separate from the JWT secret (a play token must never be
 * usable as an access token). Restarting the server invalidates the rounds being played, which last a minute or two.
 * Rounds already handed in are remembered in memory until their token expires, which is enough for a single instance.
 */
@Component
public class PlayTokenService {

    /** A round older than this cannot be checked or handed in any more. */
    static final Duration MAX_AGE = Duration.ofHours(1);

    private static final String CIPHER = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final SecureRandom random = new SecureRandom();
    private final SecretKey key;
    private final StudyCalendar calendar;
    // nonce -> issuedAt of every round handed in and not yet expired
    private final Map<String, Instant> handedIn = new ConcurrentHashMap<>();

    public PlayTokenService(StudyCalendar calendar) {
        this.calendar = calendar;
        byte[] secret = new byte[32];
        random.nextBytes(secret);
        this.key = new SecretKeySpec(secret, "AES");
    }

    /** A new round starting now. */
    public PlayRound newRound(
            Long gameId,
            Long userId,
            Long topicId,
            Long listId,
            List<PlayRound.Question> questions,
            List<Long> matchVocabularyIds) {
        byte[] nonce = new byte[12];
        random.nextBytes(nonce);
        return new PlayRound(
                gameId,
                userId,
                calendar.now(),
                ENCODER.encodeToString(nonce),
                topicId,
                listId,
                List.copyOf(questions),
                List.copyOf(matchVocabularyIds));
    }

    /** The round as an opaque token for the browser. */
    public String seal(PlayRound round) {
        byte[] payload = String.join(":",
                        String.valueOf(round.gameId()),
                        String.valueOf(round.userId()),
                        String.valueOf(round.issuedAt().toEpochMilli()),
                        round.nonce(),
                        round.topicId() == null ? "" : String.valueOf(round.topicId()),
                        round.listId() == null ? "" : String.valueOf(round.listId()),
                        round.questions().stream().map(PlayTokenService::encode).collect(Collectors.joining(";")),
                        joined(round.matchVocabularyIds()))
                .getBytes(StandardCharsets.UTF_8);
        byte[] iv = new byte[IV_BYTES];
        random.nextBytes(iv);
        try {
            return ENCODER.encodeToString(iv) + "." + ENCODER.encodeToString(cipher(Cipher.ENCRYPT_MODE, iv, payload));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("AES-GCM is not available", exception);
        }
    }

    /** The round of a token sealed by this server, not expired, and issued to this player for this game. */
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
                throw new IllegalArgumentException("no ciphertext");
            }
            byte[] iv = DECODER.decode(token.substring(0, dot));
            byte[] payload = cipher(Cipher.DECRYPT_MODE, iv, DECODER.decode(token.substring(dot + 1)));
            String[] parts = new String(payload, StandardCharsets.UTF_8).split(":", -1);
            if (parts.length != 8) {
                throw new IllegalArgumentException("unexpected payload");
            }
            List<PlayRound.Question> questions = parts[6].isEmpty()
                    ? List.of()
                    : Arrays.stream(parts[6].split(";")).map(PlayTokenService::decodeQuestion).toList();
            return new PlayRound(
                    Long.valueOf(parts[0]),
                    Long.valueOf(parts[1]),
                    Instant.ofEpochMilli(Long.parseLong(parts[2])),
                    parts[3],
                    parts[4].isEmpty() ? null : Long.valueOf(parts[4]),
                    parts[5].isEmpty() ? null : Long.valueOf(parts[5]),
                    questions,
                    ids(parts[7]));
        } catch (IllegalArgumentException | GeneralSecurityException exception) {
            // Malformed, or changed: GCM refuses a ciphertext that was not produced with this key.
            throw new InvalidPlayTokenException("The playToken is not valid");
        }
    }

    /** "word,option1,option2,…" (the asked word first). */
    private static String encode(PlayRound.Question question) {
        return question.vocabularyId() + (question.optionVocabularyIds().isEmpty() ? "" : "," + joined(question.optionVocabularyIds()));
    }

    private static PlayRound.Question decodeQuestion(String text) {
        List<Long> numbers = ids(text);
        if (numbers.isEmpty()) {
            throw new IllegalArgumentException("empty question");
        }
        return new PlayRound.Question(numbers.getFirst(), numbers.subList(1, numbers.size()));
    }

    private static String joined(List<Long> ids) {
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private static List<Long> ids(String text) {
        return text.isEmpty() ? List.of() : Arrays.stream(text.split(",")).map(Long::valueOf).toList();
    }

    // A Cipher instance is not thread-safe, so every call gets its own.
    private byte[] cipher(int mode, byte[] iv, byte[] input) throws GeneralSecurityException {
        if (iv.length != IV_BYTES) {
            throw new IllegalArgumentException("bad iv");
        }
        Cipher cipher = Cipher.getInstance(CIPHER);
        cipher.init(mode, key, new GCMParameterSpec(TAG_BITS, iv));
        return cipher.doFinal(input);
    }
}
