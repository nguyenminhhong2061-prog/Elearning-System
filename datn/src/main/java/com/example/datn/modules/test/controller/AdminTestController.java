package com.example.datn.modules.test.controller;

import com.example.datn.modules.test.dto.request.AdminTestRequest;
import com.example.datn.modules.test.dto.request.DuplicateTestRequest;
import com.example.datn.modules.test.dto.response.AdminTestResponse;
import com.example.datn.modules.test.dto.response.AdminTestSummaryResponse;
import com.example.datn.modules.test.dto.response.TestDeleteResponse;
import com.example.datn.modules.test.service.AdminTestService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The admin test pages (docs/api/admin.md, "Đề kiểm tra"; scenario 24). */
@RestController
@RequestMapping("/api/admin/tests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTestController {

    private final AdminTestService service;

    public AdminTestController(AdminTestService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminTestSummaryResponse> list() {
        return service.list();
    }

    @GetMapping("/{testId}")
    public AdminTestResponse detail(@PathVariable Long testId) {
        return service.detail(testId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminTestResponse create(@RequestBody AdminTestRequest request) {
        return service.create(request);
    }

    @PutMapping("/{testId}")
    public AdminTestResponse update(@PathVariable Long testId, @RequestBody AdminTestRequest request) {
        return service.update(testId, request);
    }

    /** Hides a test learners have submitted, deletes any other; the body says which. */
    @DeleteMapping("/{testId}")
    public TestDeleteResponse delete(@PathVariable Long testId) {
        return service.delete(testId);
    }

    @PostMapping("/{testId}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminTestResponse duplicate(@PathVariable Long testId, @RequestBody DuplicateTestRequest request) {
        return service.duplicate(testId, request);
    }
}
