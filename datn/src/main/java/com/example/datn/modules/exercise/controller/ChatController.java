package com.example.datn.modules.exercise.controller;

import com.example.datn.modules.exercise.dto.request.CreateChatSessionRequest;
import com.example.datn.modules.exercise.dto.request.SendChatMessageRequest;
import com.example.datn.modules.exercise.dto.response.ChatMessageResponse;
import com.example.datn.modules.exercise.dto.response.ChatSessionResponse;
import com.example.datn.modules.exercise.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat/sessions")
public class ChatController {
    private final ChatService service;

    public ChatController(ChatService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatSessionResponse create(@RequestBody(required = false) CreateChatSessionRequest request) {
        return service.create(request);
    }

    @PostMapping("/{sessionId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse send(
            @PathVariable Long sessionId,
            @Valid @RequestBody SendChatMessageRequest request) {
        return service.send(sessionId, request);
    }
}
