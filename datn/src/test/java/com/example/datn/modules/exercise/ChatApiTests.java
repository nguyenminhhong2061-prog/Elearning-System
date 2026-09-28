package com.example.datn.modules.exercise;

import com.example.datn.modules.exercise.service.ChatProvider;
import com.example.datn.modules.exercise.exception.AiServiceUnavailableException;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ChatApiTests {
    @Autowired MockMvc mvc;
    @MockitoBean ChatProvider provider;

    @Test
    void persistsConversationAndProtectsSessionOwnership() throws Exception {
        when(provider.reply(anyList())).thenReturn(new ChatProvider.Reply("Giải thích mẫu", "groq", "test", 10, 5));
        String body = mvc.perform(post("/api/chat/sessions").with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(body, "$.id")).longValue();
        mvc.perform(post("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Giải thích hiện tại đơn\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("ASSISTANT"))
                .andExpect(jsonPath("$.content").value("Giải thích mẫu"));
        mvc.perform(post("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(43))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Hello\"}"))
                .andExpect(status().isNotFound());
        when(provider.reply(anyList())).thenThrow(new AiServiceUnavailableException("Unavailable"));
        mvc.perform(post("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Hello\"}"))
                .andExpect(status().isServiceUnavailable());
    }
}
