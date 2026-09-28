package com.example.datn.modules.exercise.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.exercise.enums.AttemptStatus;
import jakarta.persistence.Converter;

@Converter
public class AttemptStatusConverter extends LowercaseEnumConverter<AttemptStatus> {
    public AttemptStatusConverter() {
        super(AttemptStatus.class);
    }
}
