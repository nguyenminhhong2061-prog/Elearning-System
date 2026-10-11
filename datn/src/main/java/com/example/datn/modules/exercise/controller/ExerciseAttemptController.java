package com.example.datn.modules.exercise.controller;

import com.example.datn.modules.exercise.dto.request.AnswerQuestionRequest;
import com.example.datn.modules.exercise.dto.request.CompleteAttemptRequest;
import com.example.datn.modules.exercise.dto.response.AnswerResultResponse;
import com.example.datn.modules.exercise.dto.response.AttemptResultResponse;
import com.example.datn.modules.exercise.dto.response.CurrentAttemptResponse;
import com.example.datn.modules.exercise.dto.response.PronunciationAssessmentResponse;
import com.example.datn.modules.exercise.service.ExerciseAttemptService;
import com.example.datn.modules.exercise.service.PronunciationAssessmentService;
import com.example.datn.modules.exercise.exception.InvalidExerciseRequestException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/exercise-attempts")
public class ExerciseAttemptController {
    private final ExerciseAttemptService service;
    private final PronunciationAssessmentService pronunciationAssessmentService;

    public ExerciseAttemptController(
            ExerciseAttemptService service,
            PronunciationAssessmentService pronunciationAssessmentService) {
        this.service = service;
        this.pronunciationAssessmentService = pronunciationAssessmentService;
    }

    @GetMapping("/current")
    public CurrentAttemptResponse current() {
        return service.current();
    }

    @PostMapping("/{attemptId}/responses")
    public AnswerResultResponse answer(
            @PathVariable Long attemptId,
            @Valid @RequestBody AnswerQuestionRequest request) {
        return service.answer(attemptId, request);
    }

    @PostMapping("/{attemptId}/responses/{questionId}/grade")
    public AnswerResultResponse regrade(@PathVariable Long attemptId, @PathVariable Long questionId) {
        return service.regrade(attemptId, questionId);
    }

    @PostMapping("/{attemptId}/complete")
    public AttemptResultResponse complete(
            @PathVariable Long attemptId,
            @Valid @RequestBody CompleteAttemptRequest request) {
        return service.complete(attemptId, request);
    }

    @PostMapping(value = "/{attemptId}/pronunciation/{itemId}", consumes = "audio/wav")
    @ResponseStatus(HttpStatus.CREATED)
    public PronunciationAssessmentResponse assessPronunciation(
            @PathVariable Long attemptId,
            @PathVariable Long itemId,
            @RequestBody byte[] audio) {
        if (audio.length > 1_000_000) {
            throw new InvalidExerciseRequestException("Audio file must not exceed 1 MB");
        }
        if (audio.length < 44 || audio[0] != 'R' || audio[1] != 'I' || audio[2] != 'F' || audio[3] != 'F') {
            throw new InvalidExerciseRequestException("A valid WAV recording is required");
        }
        return pronunciationAssessmentService.assess(attemptId, itemId, audio);
    }
}
