package com.example.datn.modules.user.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.user.enums.UserStatus;
import jakarta.persistence.Converter;

@Converter
public class UserStatusConverter extends LowercaseEnumConverter<UserStatus> {

    public UserStatusConverter() {
        super(UserStatus.class);
    }
}
