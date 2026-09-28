package com.example.datn.modules.exercise.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.exercise.enums.ExerciseDifficulty;
import jakarta.persistence.Converter;

@Converter
public class ExerciseDifficultyConverter extends LowercaseEnumConverter<ExerciseDifficulty> {
    public ExerciseDifficultyConverter() {
        super(ExerciseDifficulty.class);
    }
}
