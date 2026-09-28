package com.example.datn.modules.exercise;

import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExerciseApiTests {
    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    long lessonId;
    long questionId;
    long correctOptionId;

    @BeforeEach
    void seed() {
        Instant now = Instant.now();
        jdbc.update("""
                insert into exercise_lessons
                  (slug, skill, title, cefr_level, difficulty, publication_status, sort_order, created_at, updated_at)
                values (?, 'grammar', 'Present simple', 'A1', 'easy', 'published', 1, ?, ?)
                """, "test-present-simple-" + System.nanoTime(), now, now);
        lessonId = jdbc.queryForObject("select max(id) from exercise_lessons", Long.class);
        jdbc.update("""
                insert into exercise_questions
                  (lesson_id, code, question_type, prompt, explanation, points, sort_order, created_at)
                values (?, 'q1', 'multiple_choice', 'She ___ to school.', 'Use goes.', 1, 1, ?)
                """, lessonId, now);
        questionId = jdbc.queryForObject("select max(id) from exercise_questions", Long.class);
        jdbc.update("""
                insert into question_options (question_id, option_key, option_text, is_correct, sort_order)
                values (?, 'A', 'go', false, 1), (?, 'B', 'goes', true, 2)
                """, questionId, questionId);
        correctOptionId = jdbc.queryForObject(
                "select id from question_options where question_id = ? and is_correct = true", Long.class, questionId);
    }

    @Test
    void learnerCanListOpenAnswerAndCompleteGrammarLesson() throws Exception {
        mockMvc.perform(get("/api/exercises").param("skill", "GRAMMAR").with(TestAuth.learner(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(lessonId))
                .andExpect(jsonPath("$[0].itemCount").value(1));

        mockMvc.perform(get("/api/exercises/{id}", lessonId).with(TestAuth.learner(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].options[1].text").value("goes"))
                .andExpect(jsonPath("$.questions[0].explanation").doesNotExist());

        String started = mockMvc.perform(post("/api/exercises/{id}/attempts", lessonId)
                        .with(TestAuth.learner(42)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long attemptId = ((Number) JsonPath.read(started, "$.attemptId")).longValue();

        mockMvc.perform(post("/api/exercise-attempts/{id}/responses", attemptId)
                        .with(TestAuth.learner(42)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"questionId\":" + questionId + ",\"optionId\":" + correctOptionId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.explanation").value("Use goes."));

        mockMvc.perform(post("/api/exercise-attempts/{id}/complete", attemptId)
                        .with(TestAuth.learner(42)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"responses\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scorePercent").value(100))
                .andExpect(jsonPath("$.correctCount").value(1));
    }
}
