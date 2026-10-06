package com.example.datn.modules.test.controller;

import com.example.datn.modules.test.dto.request.SaveAnswerRequest;
import com.example.datn.modules.test.dto.response.PassagePlayResponse;
import com.example.datn.modules.test.dto.response.TestResultResponse;
import com.example.datn.modules.test.service.TestAttemptService;
import com.example.datn.modules.test.service.TestRecordingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Saves answers (typed, picked or recorded), counts plays of recordings, submits and reads the result of a test
 * attempt (docs/api/tests.md).
 */
@RestController
@RequestMapping("/api/test-attempts")
public class TestAttemptController {

    private final TestAttemptService service;
    private final TestRecordingService recordingService;

    public TestAttemptController(TestAttemptService service, TestRecordingService recordingService) {
        this.service = service;
        this.recordingService = recordingService;
    }

    @PutMapping("/{attemptId}/answers/{questionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveAnswer(
            @PathVariable Long attemptId,
            @PathVariable Long questionId,
            @Valid @RequestBody SaveAnswerRequest request) {
        service.saveAnswer(attemptId, questionId, request);
    }

    /** The recorded answer of a read-aloud question, as a WAV file in the body. */
    @PutMapping(value = "/{attemptId}/answers/{questionId}/recording", consumes = "audio/wav")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveRecording(
            @PathVariable Long attemptId,
            @PathVariable Long questionId,
            @RequestBody byte[] audio) {
        recordingService.saveRecording(attemptId, questionId, audio);
    }

    @PostMapping("/{attemptId}/passages/{passageId}/plays")
    public PassagePlayResponse recordPlay(@PathVariable Long attemptId, @PathVariable Long passageId) {
        return service.recordPlay(attemptId, passageId);
    }

    @PostMapping("/{attemptId}/submit")
    public TestResultResponse submit(@PathVariable Long attemptId) {
        return service.submit(attemptId);
    }

    @GetMapping("/{attemptId}")
    public TestResultResponse result(@PathVariable Long attemptId) {
        return service.getResult(attemptId);
    }
}
