package com.example.datn.modules.vocabulary.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import jakarta.persistence.Converter;

@Converter
public class LearningStatusConverter extends LowercaseEnumConverter<LearningStatus> {

    public LearningStatusConverter() {
        super(LearningStatus.class);
    }
}
