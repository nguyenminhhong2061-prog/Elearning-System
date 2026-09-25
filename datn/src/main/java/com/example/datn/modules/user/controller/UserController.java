package com.example.datn.modules.user.controller;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.user.dto.response.UserResponse;
import com.example.datn.modules.user.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;
    private final CurrentUser currentUser;

    public UserController(UserService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    public UserResponse me() {
        return service.getProfile(currentUser.id());
    }
}
