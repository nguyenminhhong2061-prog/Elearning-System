package com.example.datn.modules.auth.controller;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.auth.dto.request.ChangePasswordRequest;
import com.example.datn.modules.auth.dto.request.LoginRequest;
import com.example.datn.modules.auth.dto.request.RegisterRequest;
import com.example.datn.modules.auth.dto.response.AuthTokenResponse;
import com.example.datn.modules.auth.service.AuthService;
import com.example.datn.modules.user.dto.response.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Logging out is done by the client discarding its token: tokens are stateless and simply expire.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;
    private final CurrentUser currentUser;

    public AuthController(AuthService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public AuthTokenResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(currentUser.id(), request);
    }
}
