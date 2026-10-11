package com.example.datn.modules.exercise.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.exercise.enums.ExerciseDifficulty;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.enums.QuestionType;

import java.math.BigDecimal;
import java.util.List;

public record ExerciseDetailResponse(
        Long id,
        ExerciseSkill skill,
        String title,
        String description,
        String topic,
        CefrLevel cefrLevel,
        ExerciseDifficulty difficulty,
        Integer estimatedMinutes,
        List<Question> questions,
        Passage passage,
        List<PronunciationItem> pronunciationItems) {

    public record Question(Long id, QuestionType type, String prompt, String hint, BigDecimal points, String starter,
                           List<Option> options) {}
    public record Option(Long id, String key, String text) {}
    public record Passage(String title, String audioUrl, int durationMs, List<Segment> segments) {}
    public record Segment(Long id, int order, int startMs, int endMs, String speaker, String transcript) {}
    public record PronunciationItem(Long id, String text, String ipa, String audioUrl, String notes) {}
}
