package com.example.datn.modules.test.mapper;

import com.example.datn.modules.test.dto.response.OptionResponse;
import com.example.datn.modules.test.dto.response.QuestionResponse;
import com.example.datn.modules.test.dto.response.TestDetailResponse;
import com.example.datn.modules.test.dto.response.TestListResponse;
import com.example.datn.modules.test.dto.response.TestProgressResponse;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionOption;
import org.springframework.stereotype.Component;

import java.util.List;

/** Maps test entities to response DTOs. */
@Component
public class TestMapper {

    public QuestionResponse toQuestion(TestQuestion question, List<TestQuestionOption> options) {
        return new QuestionResponse(
                question.getId(),
                question.getQuestionType(),
                question.getSkill(),
                question.getContent(),
                question.getPoints(),
                question.getAudioUrl(),
                options.stream().map(this::toOption).toList());
    }

    public TestDetailResponse toDetail(Test test, List<QuestionResponse> questions, boolean hasInProgress) {
        return new TestDetailResponse(
                test.getId(),
                test.getTitle(),
                test.getType(),
                test.getSkill(),
                test.getStartDate(),
                test.getEndDate(),
                questions,
                hasInProgress);
    }

    public TestListResponse toListItem(Test test, int questionCount, TestProgressResponse progress) {
        return new TestListResponse(
                test.getId(),
                test.getTitle(),
                test.getType(),
                test.getSkill(),
                test.getStartDate(),
                test.getEndDate(),
                questionCount,
                progress);
    }

    private OptionResponse toOption(TestQuestionOption option) {
        return new OptionResponse(option.getId(), option.getContent());
    }
}
