package com.example.datn.modules.exercise;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.exercise.dto.response.PronunciationAssessmentResponse;
import com.example.datn.modules.exercise.entity.ExerciseAttempt;
import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.entity.PronunciationAttempt;
import com.example.datn.modules.exercise.entity.PronunciationItem;
import com.example.datn.modules.exercise.enums.AttemptStatus;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.exception.AttemptNotFoundException;
import com.example.datn.modules.exercise.repository.ExerciseAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationItemRepository;
import com.example.datn.modules.exercise.service.ExerciseService;
import com.example.datn.modules.exercise.service.OpenPronounceClient;
import com.example.datn.modules.exercise.service.PronunciationAssessmentService;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PronunciationAssessmentServiceTests {
    private final ExerciseAttemptRepository attempts = mock(ExerciseAttemptRepository.class);
    private final PronunciationItemRepository items = mock(PronunciationItemRepository.class);
    private final PronunciationAttemptRepository pronunciationAttempts = mock(PronunciationAttemptRepository.class);
    private final ExerciseService exerciseService = mock(ExerciseService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final OpenPronounceClient provider = mock(OpenPronounceClient.class);
    private final PronunciationAssessmentService service = new PronunciationAssessmentService(
            attempts, items, pronunciationAttempts, exerciseService, currentUser, provider);

    @Test
    void mapsOpenPronounceIpaAnalysisAndPersistsTheAttempt() throws Exception {
        ExerciseAttempt attempt = mock(ExerciseAttempt.class);
        ExerciseLesson lesson = mock(ExerciseLesson.class);
        PronunciationItem item = mock(PronunciationItem.class);
        byte[] wav = new byte[] {1, 2, 3};
        when(currentUser.id()).thenReturn(7L);
        when(attempts.findById(51L)).thenReturn(Optional.of(attempt));
        when(attempt.getUserId()).thenReturn(7L);
        when(attempt.getStatus()).thenReturn(AttemptStatus.IN_PROGRESS);
        when(attempt.getLessonId()).thenReturn(4L);
        when(exerciseService.published(4L)).thenReturn(lesson);
        when(lesson.getId()).thenReturn(4L);
        when(lesson.getSkill()).thenReturn(ExerciseSkill.PRONUNCIATION);
        when(items.findById(801L)).thenReturn(Optional.of(item));
        when(item.getLessonId()).thenReturn(4L);
        when(item.getReferenceText()).thenReturn("We need to reach an agreement.");
        when(pronunciationAttempts.countByAttemptIdAndPronunciationItemId(51L, 801L)).thenReturn(2L);
        when(provider.assess(wav, item.getReferenceText())).thenReturn(new ObjectMapper().readTree("""
                {
                  "score": 81.25,
                  "transcribe": "We need to reach an agreement",
                  "differences": {
                    "phoneme_error_rate": 0.25,
                    "word_error_rate": 0.20,
                    "errors": [{
                      "word": "reach",
                      "expected": "riːtʃ",
                      "actual": "riːs",
                      "confidence": 0.76,
                      "phones": [{"expected": "tʃ", "heard": "s", "confidence": 0.82}]
                    }]
                  }
                }
                """));

        PronunciationAssessmentResponse response = service.assess(51L, 801L, wav);

        assertThat(response.tryNumber()).isEqualTo(3);
        assertThat(response.overallScore()).isEqualByComparingTo("81.25");
        assertThat(response.phonemeAccuracyScore()).isEqualByComparingTo("75.00");
        assertThat(response.wordAccuracyScore()).isEqualByComparingTo("80.00");
        assertThat(response.recognizedText()).isEqualTo("We need to reach an agreement");
        assertThat(response.errors()).singleElement().satisfies(error -> {
            assertThat(error.word()).isEqualTo("reach");
            assertThat(error.expectedIpa()).isEqualTo("riːtʃ");
            assertThat(error.heardIpa()).isEqualTo("riːs");
            assertThat(error.confidence()).isEqualByComparingTo("76.0");
            assertThat(error.phones()).singleElement().satisfies(phone -> {
                assertThat(phone.expected()).isEqualTo("tʃ");
                assertThat(phone.heard()).isEqualTo("s");
            });
        });
        verify(pronunciationAttempts).save(any(PronunciationAttempt.class));
    }

    @Test
    void hidesAttemptsOwnedByAnotherLearner() {
        ExerciseAttempt attempt = mock(ExerciseAttempt.class);
        when(currentUser.id()).thenReturn(9L);
        when(attempts.findById(51L)).thenReturn(Optional.of(attempt));
        when(attempt.getUserId()).thenReturn(7L);

        assertThatThrownBy(() -> service.assess(51L, 801L, new byte[] {1}))
                .isInstanceOf(AttemptNotFoundException.class);
    }
}
