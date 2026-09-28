package com.example.datn.modules.exercise.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.exercise.enums.QuestionType;
import jakarta.persistence.Converter;

@Converter
public class QuestionTypeConverter extends LowercaseEnumConverter<QuestionType> {
    public QuestionTypeConverter() {
        super(QuestionType.class);
    }
}
