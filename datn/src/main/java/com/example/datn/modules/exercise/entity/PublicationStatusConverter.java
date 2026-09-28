package com.example.datn.modules.exercise.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.exercise.enums.PublicationStatus;
import jakarta.persistence.Converter;

@Converter
public class PublicationStatusConverter extends LowercaseEnumConverter<PublicationStatus> {
    public PublicationStatusConverter() {
        super(PublicationStatus.class);
    }
}
