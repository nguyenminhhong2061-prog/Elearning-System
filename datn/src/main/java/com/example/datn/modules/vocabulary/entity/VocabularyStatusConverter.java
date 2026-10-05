package com.example.datn.modules.vocabulary.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.vocabulary.enums.VocabularyStatus;
import jakarta.persistence.Converter;

@Converter
public class VocabularyStatusConverter extends LowercaseEnumConverter<VocabularyStatus> {

    public VocabularyStatusConverter() {
        super(VocabularyStatus.class);
    }
}
