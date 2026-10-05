package com.example.datn.modules.exercise.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.exercise.dto.response.PronunciationAssessmentResponse;
import com.example.datn.modules.exercise.dto.response.PronunciationAssessmentResponse.PhoneDifference;
import com.example.datn.modules.exercise.dto.response.PronunciationAssessmentResponse.WordError;
import com.example.datn.modules.exercise.entity.ExerciseAttempt;
import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.entity.PronunciationAttempt;
import com.example.datn.modules.exercise.entity.PronunciationItem;
import com.example.datn.modules.exercise.enums.AttemptStatus;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.exception.AttemptConflictException;
import com.example.datn.modules.exercise.exception.AttemptNotFoundException;
import com.example.datn.modules.exercise.exception.AiServiceUnavailableException;
import com.example.datn.modules.exercise.exception.InvalidExerciseRequestException;
import com.example.datn.modules.exercise.repository.ExerciseAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class PronunciationAssessmentService {
    private final ExerciseAttemptRepository attempts;
    private final PronunciationItemRepository items;
    private final PronunciationAttemptRepository pronunciationAttempts;
    private final ExerciseService exerciseService;
    private final CurrentUser currentUser;
    private final OpenPronounceClient provider;

    public PronunciationAssessmentService(
            ExerciseAttemptRepository attempts,
            PronunciationItemRepository items,
            PronunciationAttemptRepository pronunciationAttempts,
            ExerciseService exerciseService,
            CurrentUser currentUser,
            OpenPronounceClient provider) {
        this.attempts = attempts;
        this.items = items;
        this.pronunciationAttempts = pronunciationAttempts;
        this.exerciseService = exerciseService;
        this.currentUser = currentUser;
        this.provider = provider;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public PronunciationAssessmentResponse assess(Long attemptId, Long itemId, byte[] wav) {
        ExerciseAttempt attempt = attempts.findById(attemptId)
                .filter(candidate -> candidate.getUserId().equals(currentUser.id()))
                .orElseThrow(() -> new AttemptNotFoundException(attemptId));
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new AttemptConflictException("Exercise attempt is no longer in progress");
        }

        ExerciseLesson lesson = exerciseService.published(attempt.getLessonId());
        if (lesson.getSkill() != ExerciseSkill.PRONUNCIATION) {
            throw new InvalidExerciseRequestException("This attempt is not a pronunciation lesson");
        }
        PronunciationItem item = items.findById(itemId)
                .filter(candidate -> candidate.getLessonId().equals(lesson.getId()))
                .orElseThrow(() -> new InvalidExerciseRequestException("Pronunciation item does not belong to this lesson"));

        int tryNumber = Math.toIntExact(
                pronunciationAttempts.countByAttemptIdAndPronunciationItemId(attemptId, itemId) + 1);
        JsonNode result = provider.assess(wav, item.getReferenceText());
        JsonNode differences = result.path("differences");
        BigDecimal overallScore = result.path("score").decimalValue().setScale(2, RoundingMode.HALF_UP);
        BigDecimal phonemeAccuracy = accuracyScore(differences.path("phoneme_error_rate"));
        BigDecimal wordAccuracy = accuracyScore(differences.path("word_error_rate"));
        String recognizedText = result.path("transcribe").asText("");
        List<WordError> errors = mapErrors(differences.path("errors"));
        List<String> tips = makeTips(errors);

        pronunciationAttempts.save(new PronunciationAttempt(
                attemptId,
                lesson.getId(),
                itemId,
                tryNumber,
                "OpenPronounce",
                recognizedText,
                phonemeAccuracy,
                null,
                null,
                overallScore,
                result,
                Instant.now()));

        return new PronunciationAssessmentResponse(
                itemId, tryNumber, overallScore, phonemeAccuracy, wordAccuracy, recognizedText, errors, tips);
    }

    private static BigDecimal accuracyScore(JsonNode errorRate) {
        double rate = errorRate.isNumber() ? errorRate.asDouble() : 1.0;
        double score = Math.max(0.0, Math.min(100.0, (1.0 - rate) * 100.0));
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }

    private static List<WordError> mapErrors(JsonNode errorNodes) {
        List<WordError> errors = new ArrayList<>();
        if (!errorNodes.isArray()) {
            return errors;
        }
        for (JsonNode error : errorNodes) {
            String heardIpa = error.path("actual").asText("");
            List<PhoneDifference> phones = new ArrayList<>();
            JsonNode phoneNodes = error.path("phones");
            if (phoneNodes.isArray()) {
                for (JsonNode phone : phoneNodes) {
                    phones.add(new PhoneDifference(
                            phone.path("expected").asText(""),
                            phone.path("heard").asText(""),
                            BigDecimal.valueOf(phone.path("confidence").asDouble(0.0) * 100)
                                    .setScale(1, RoundingMode.HALF_UP)));
                }
            }
            errors.add(new WordError(
                    error.path("word").asText(""),
                    error.path("expected").asText(""),
                    heardIpa,
                    BigDecimal.valueOf(error.path("confidence").asDouble(0.0) * 100)
                            .setScale(1, RoundingMode.HALF_UP),
                    heardIpa.isBlank() ? "OMISSION" : "MISPRONUNCIATION",
                    List.copyOf(phones)));
        }
        return List.copyOf(errors);
    }

    private static List<String> makeTips(List<WordError> errors) {
        if (errors.isEmpty()) {
            return List.of("Không phát hiện lỗi âm vị nổi bật trong bản ghi này.");
        }
        return errors.stream().limit(5).map(error -> error.heardIpa().isBlank()
                ? "Thử đọc rõ từ “" + error.word() + "” và phát đủ các âm trong từ."
                : "Kiểm tra từ “" + error.word() + "”: mong đợi /" + error.expectedIpa()
                        + "/, hệ thống nghe /" + error.heardIpa() + "/.")
                .toList();
    }
}
