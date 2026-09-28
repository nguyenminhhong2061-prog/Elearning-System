package com.example.datn.modules.test.controller;

import com.example.datn.modules.test.dto.response.StartAttemptResponse;
import com.example.datn.modules.test.dto.response.TestDetailResponse;
import com.example.datn.modules.test.dto.response.TestListResponse;
import com.example.datn.modules.test.service.TestAttemptService;
import com.example.datn.modules.test.service.TestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Lists tests and starts an attempt (docs/api/tests.md). */
@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestService service;
    private final TestAttemptService attemptService;

    public TestController(TestService service, TestAttemptService attemptService) {
        this.service = service;
        this.attemptService = attemptService;
    }

    @GetMapping
    public List<TestListResponse> list() {
        return service.list();
    }

    @GetMapping("/{testId}")
    public TestDetailResponse detail(@PathVariable Long testId) {
        return service.detail(testId);
    }

    /** 200 when resuming an existing in-progress attempt, 201 when a new attempt is created. */
    @PostMapping("/{testId}/attempts")
    public ResponseEntity<StartAttemptResponse> start(
            @PathVariable Long testId,
            @RequestParam(defaultValue = "false") boolean restart) {
        StartAttemptResponse response = attemptService.start(testId, restart);
        return ResponseEntity.status(response.resumed() ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }
}
