package com.example.datn.modules.user.mapper;

import com.example.datn.modules.user.dto.response.UserResponse;
import com.example.datn.modules.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCurrentLevel(),
                user.getCreatedAt());
    }
}
