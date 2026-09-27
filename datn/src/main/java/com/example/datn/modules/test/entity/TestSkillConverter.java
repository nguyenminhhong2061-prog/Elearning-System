package com.example.datn.modules.test.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.test.enums.TestSkill;
import jakarta.persistence.Converter;

@Converter
public class TestSkillConverter extends LowercaseEnumConverter<TestSkill> {

    public TestSkillConverter() {
        super(TestSkill.class);
    }
}
