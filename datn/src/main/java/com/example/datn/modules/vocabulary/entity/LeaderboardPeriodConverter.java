package com.example.datn.modules.vocabulary.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import jakarta.persistence.Converter;

@Converter
public class LeaderboardPeriodConverter extends LowercaseEnumConverter<LeaderboardPeriod> {

    public LeaderboardPeriodConverter() {
        super(LeaderboardPeriod.class);
    }
}
