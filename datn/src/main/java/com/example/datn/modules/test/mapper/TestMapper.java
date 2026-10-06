package com.example.datn.modules.test.mapper;

import com.example.datn.modules.test.dto.response.OptionResponse;
import com.example.datn.modules.test.dto.response.PassageResponse;
import com.example.datn.modules.test.dto.response.QuestionResponse;
import com.example.datn.modules.test.dto.response.TestDetailResponse;
import com.example.datn.modules.test.dto.response.TestListResponse;
import com.example.datn.modules.test.dto.response.TestProgressResponse;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestPassage;
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
                question.getPassageId(),
                question.getQuestionType(),
                question.getSkill(),
                question.getContent(),
                question.getPoints(),
                question.getAudioUrl(),
                question.getReferenceText(),
                question.isReadAloud() ? TestQuestion.MAX_RECORDING_SECONDS : null,
                options.stream().map(this::toOption).toList());
    }

    /** The passage as the learner sees it while taking the test: without the transcript of its recording. */
    public PassageResponse toPassage(TestPassage passage) {
        return new PassageResponse(
                passage.getId(),
                passage.getTitle(),
                passage.getContent(),
                passage.getAudioUrl(),
                passage.hasAudio() ? TestPassage.MAX_PLAYS : null);
    }

    public TestDetailResponse toDetail(
            Test test,
            List<PassageResponse> passages,
            List<QuestionResponse> questions,
            boolean hasInProgress,
            Long lastAttemptId) {
        return new TestDetailResponse(
                test.getId(),
                test.getTitle(),
                test.getType(),
                test.getSkill(),
                test.getStartDate(),
                test.getEndDate(),
                test.getType().retakeAllowed(),
                passages,
                questions,
                hasInProgress,
                lastAttemptId);
    }

    public TestListResponse toListItem(Test test, int questionCount, TestProgressResponse progress) {
        return new TestListResponse(
                test.getId(),
                test.getTitle(),
                test.getType(),
                test.getSkill(),
                test.getStartDate(),
                test.getEndDate(),
                test.getType().retakeAllowed(),
                questionCount,
                progress);
    }

    private OptionResponse toOption(TestQuestionOption option) {
        return new OptionResponse(option.getId(), option.getContent());
    }
}
