package com.example.datn.modules.vocabulary.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import jakarta.persistence.Converter;

@Converter
public class ReviewResultConverter extends LowercaseEnumConverter<ReviewResult> {

    public ReviewResultConverter() {
        super(ReviewResult.class);
    }
}
