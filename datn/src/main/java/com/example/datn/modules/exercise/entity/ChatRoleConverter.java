package com.example.datn.modules.exercise.entity;

import com.example.datn.common.persistence.LowercaseEnumConverter;
import com.example.datn.modules.exercise.enums.ChatRole;
import jakarta.persistence.Converter;

@Converter
public class ChatRoleConverter extends LowercaseEnumConverter<ChatRole> {
    public ChatRoleConverter() { super(ChatRole.class); }
}
