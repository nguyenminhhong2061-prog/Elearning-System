package com.example.datn.modules.user.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.user.enums.UserRole;
import jakarta.persistence.Converter;

@Converter
public class UserRoleConverter extends LowercaseEnumConverter<UserRole> {

    public UserRoleConverter() {
        super(UserRole.class);
    }
}
