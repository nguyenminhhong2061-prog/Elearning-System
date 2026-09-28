package com.example.datn.modules.test.controller;

import com.example.datn.modules.test.dto.request.SaveAnswerRequest;
import com.example.datn.modules.test.dto.response.TestResultResponse;
import com.example.datn.modules.test.service.TestAttemptService;
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

/** Saves answers, submits and reads the result of a test attempt (docs/api/tests.md). */
@RestController
@RequestMapping("/api/test-attempts")
public class TestAttemptController {

    private final TestAttemptService service;

    public TestAttemptController(TestAttemptService service) {
        this.service = service;
    }

    @PutMapping("/{attemptId}/answers/{questionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveAnswer(
            @PathVariable Long attemptId,
            @PathVariable Long questionId,
            @Valid @RequestBody SaveAnswerRequest request) {
        service.saveAnswer(attemptId, questionId, request);
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
