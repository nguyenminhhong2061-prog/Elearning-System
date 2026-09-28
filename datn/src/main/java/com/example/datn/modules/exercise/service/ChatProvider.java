package com.example.datn.modules.exercise.service;

import java.util.List;

public interface ChatProvider {
    Reply reply(List<PromptMessage> messages);

    record PromptMessage(String role, String content) {}
    record Reply(String content, String provider, String model, Integer promptTokens, Integer completionTokens) {}
}
