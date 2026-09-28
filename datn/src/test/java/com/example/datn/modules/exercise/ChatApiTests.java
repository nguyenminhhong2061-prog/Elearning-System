package com.example.datn.modules.exercise;

import com.example.datn.modules.exercise.service.ChatProvider;
import com.example.datn.modules.exercise.exception.AiServiceUnavailableException;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.mockito.ArgumentCaptor;
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
        mvc.perform(get("/api/chat/sessions").with(TestAuth.learner(42)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id))
                .andExpect(jsonPath("$.content[0].lessonId").doesNotExist());
        mvc.perform(get("/api/chat/sessions").with(TestAuth.learner(43)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(42)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].content").value("Giải thích mẫu"))
                .andExpect(jsonPath("$.content[1].content").value("Giải thích hiện tại đơn"));
        mvc.perform(get("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(43)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/chat/sessions?page=-1").with(TestAuth.learner(42)))
                .andExpect(status().isBadRequest());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<java.util.List<ChatProvider.PromptMessage>> promptCaptor = ArgumentCaptor.forClass(java.util.List.class);
        verify(provider).reply(promptCaptor.capture());
        org.junit.jupiter.api.Assertions.assertTrue(promptCaptor.getValue().getFirst().content().contains("HTML fragment"));
        mvc.perform(post("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(43))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Hello\"}"))
                .andExpect(status().isNotFound());
        when(provider.reply(anyList())).thenThrow(new AiServiceUnavailableException("Unavailable"));
        mvc.perform(post("/api/chat/sessions/{id}/messages", id).with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Hello\"}"))
                .andExpect(status().isServiceUnavailable());
    }
}
