package com.example.datn.modules.exercise.controller;

import com.example.datn.modules.exercise.dto.response.AttemptStartResponse;
import com.example.datn.modules.exercise.dto.response.ExerciseDetailResponse;
import com.example.datn.modules.exercise.dto.response.ExerciseSummaryResponse;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.service.ExerciseAttemptService;
import com.example.datn.modules.exercise.service.ExerciseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {
    private final ExerciseService service;
    private final ExerciseAttemptService attemptService;

    public ExerciseController(ExerciseService service, ExerciseAttemptService attemptService) {
        this.service = service;
        this.attemptService = attemptService;
    }

    @GetMapping
    public List<ExerciseSummaryResponse> findAll(@RequestParam ExerciseSkill skill) {
        return service.findAll(skill);
    }

    @GetMapping("/{lessonId}")
    public ExerciseDetailResponse findById(@PathVariable Long lessonId) {
        return service.findById(lessonId);
    }

    @PostMapping("/{lessonId}/attempts")
    public ResponseEntity<AttemptStartResponse> start(
            @PathVariable Long lessonId,
            @RequestParam(defaultValue = "false") boolean restart) {
        ExerciseAttemptService.Started result = attemptService.start(lessonId, restart);
        return ResponseEntity.status(result.status()).body(result.body());
    }
}
