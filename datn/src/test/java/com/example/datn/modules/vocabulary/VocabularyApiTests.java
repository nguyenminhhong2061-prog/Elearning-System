package com.example.datn.modules.vocabulary;

import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class VocabularyApiTests {

    @Autowired
    private MockMvc mockMvc;

    // Every API except register/login needs an authenticated user; these tests call the write endpoints as an admin.
    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin()));
    }

    @Test
    void createsVocabularyInTopicAndFiltersByTopic() throws Exception {
        long topicId = createTopic("Travel");
        createVocabulary(topicId, "airport", "B1");
        createVocabulary(null, "hello", "A1");

        perform(get("/api/vocabulary").param("topicId", String.valueOf(topicId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].word").value("airport"))
                .andExpect(jsonPath("$[0].topicId").value(topicId))
                .andExpect(jsonPath("$[0].difficultyLevel").value("B1"));

        perform(get("/api/vocabulary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void rejectsVocabularyWithUnknownTopic() throws Exception {
        perform(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(999_999L, "airport", "B1")))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsVocabularyWithBlankWordOrMissingLevel() throws Exception {
        perform(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"word": " ", "meaning": "sân bay", "difficultyLevel": "B1"}
                                """))
                .andExpect(status().isBadRequest());

        perform(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"word": "airport", "meaning": "sân bay"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updatesAndDeletesVocabulary() throws Exception {
        long id = createVocabulary(null, "airport", "B1");

        perform(put("/api/vocabulary/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(null, "airplane", "A2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.word").value("airplane"))
                .andExpect(jsonPath("$.difficultyLevel").value("A2"));

        perform(delete("/api/vocabulary/{id}", id))
                .andExpect(status().isNoContent());

        perform(get("/api/vocabulary/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void managesTopics() throws Exception {
        long id = createTopic("Business");

        perform(put("/api/topics/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Business English", "description": "Office vocabulary"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Business English"));

        perform(delete("/api/topics/{id}", id))
                .andExpect(status().isNoContent());

        perform(get("/api/topics/{id}", id))
                .andExpect(status().isNotFound());
    }

    private long createTopic(String name) throws Exception {
        String body = perform(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createVocabulary(Long topicId, String word, String level) throws Exception {
        String body = perform(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(topicId, word, level)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private String vocabularyJson(Long topicId, String word, String level) {
        String topic = topicId == null ? "null" : String.valueOf(topicId);
        return "{\"topicId\": " + topic + ", \"word\": \"" + word + "\", \"meaning\": \"nghĩa\", "
                + "\"difficultyLevel\": \"" + level + "\"}";
    }
}
