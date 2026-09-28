package com.example.datn.modules.exercise.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import jakarta.persistence.Converter;

@Converter
public class ExerciseSkillConverter extends LowercaseEnumConverter<ExerciseSkill> {
    public ExerciseSkillConverter() {
        super(ExerciseSkill.class);
    }
}
