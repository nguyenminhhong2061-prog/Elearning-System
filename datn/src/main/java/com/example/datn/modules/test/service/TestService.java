package com.example.datn.modules.test.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.test.dto.response.InProgressResponse;
import com.example.datn.modules.test.dto.response.PassageResponse;
import com.example.datn.modules.test.dto.response.QuestionResponse;
import com.example.datn.modules.test.dto.response.TestDetailResponse;
import com.example.datn.modules.test.dto.response.TestListResponse;
import com.example.datn.modules.test.dto.response.TestProgressResponse;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.exception.TestNotFoundException;
import com.example.datn.modules.test.mapper.TestMapper;
import com.example.datn.modules.test.repository.TestAttemptAnswerRepository;
import com.example.datn.modules.test.repository.TestAttemptRepository;
import com.example.datn.modules.test.repository.TestPassageRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Reads tests and their content for the current learner (docs/api/tests.md). */
@Service
@Transactional(readOnly = true)
public class TestService {

    private static final List<TestAttemptStatus> COMPLETED = List.of(TestAttemptStatus.SUBMITTED, TestAttemptStatus.GRADED);

    private final TestRepository testRepository;
    private final TestPassageRepository passageRepository;
    private final TestQuestionRepository questionRepository;
    private final TestQuestionOptionRepository optionRepository;
    private final TestAttemptRepository attemptRepository;
    private final TestAttemptAnswerRepository answerRepository;
    private final TestMapper mapper;
    private final CurrentUser currentUser;
    private final TestCalendar calendar;

    public TestService(
            TestRepository testRepository,
            TestPassageRepository passageRepository,
            TestQuestionRepository questionRepository,
            TestQuestionOptionRepository optionRepository,
            TestAttemptRepository attemptRepository,
            TestAttemptAnswerRepository answerRepository,
            TestMapper mapper,
            CurrentUser currentUser,
            TestCalendar calendar) {
        this.testRepository = testRepository;
        this.passageRepository = passageRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.mapper = mapper;
        this.currentUser = currentUser;
        this.calendar = calendar;
    }

    public List<TestListResponse> list() {
        List<Test> tests = testRepository.findOpen(calendar.now());
        List<Long> testIds = tests.stream().map(Test::getId).toList();
        Long userId = currentUser.id();

        Map<Long, Long> questionCounts = questionRepository.findByTestIdIn(testIds).stream()
                .collect(Collectors.groupingBy(TestQuestion::getTestId, Collectors.counting()));

        Map<Long, TestAttempt> inProgress = attemptRepository
                .findByUserIdAndStatusAndTestIdIn(userId, TestAttemptStatus.IN_PROGRESS, testIds).stream()
                .collect(Collectors.toMap(TestAttempt::getTestId, Function.identity(), (first, second) -> first));

        Map<Long, List<TestAttempt>> completed = attemptRepository
                .findByUserIdAndStatusInAndTestIdIn(userId, COMPLETED, testIds).stream()
                .collect(Collectors.groupingBy(TestAttempt::getTestId));

        return tests.stream()
                .map(test -> mapper.toListItem(
                        test,
                        questionCounts.getOrDefault(test.getId(), 0L).intValue(),
                        progress(test.getId(), inProgress.get(test.getId()), completed.get(test.getId()))))
                .toList();
    }

    public TestDetailResponse detail(Long testId) {
        Test test = findOpen(testId);
        List<TestQuestion> questions = questionRepository.findByTestIdOrderByIdAsc(testId);

        List<Long> questionIds = questions.stream().map(TestQuestion::getId).toList();
        Map<Long, List<TestQuestionOption>> options = questionIds.isEmpty()
                ? Map.of()
                : optionRepository.findByQuestionIdInOrderByIdAsc(questionIds).stream()
                        .collect(Collectors.groupingBy(TestQuestionOption::getQuestionId));

        List<QuestionResponse> questionResponses = questions.stream()
                .map(question -> mapper.toQuestion(question, options.getOrDefault(question.getId(), List.of())))
                .toList();

        List<PassageResponse> passages = passageRepository.findByTestIdOrderByIdAsc(testId).stream()
                .map(mapper::toPassage)
                .toList();

        boolean hasInProgress = attemptRepository
                .findFirstByTestIdAndUserIdAndStatusOrderByIdDesc(testId, currentUser.id(), TestAttemptStatus.IN_PROGRESS)
                .isPresent();
        Long lastAttemptId = attemptRepository
                .findFirstByTestIdAndUserIdAndStatusInOrderByIdDesc(testId, currentUser.id(), COMPLETED)
                .map(TestAttempt::getId)
                .orElse(null);

        return mapper.toDetail(test, passages, questionResponses, hasInProgress, lastAttemptId);
    }

    Test findOpen(Long testId) {
        Test test = testRepository.findById(testId).orElseThrow(() -> new TestNotFoundException(testId));
        if (!isOpen(test, calendar.now())) {
            throw new TestNotFoundException(testId);
        }
        return test;
    }

    static boolean isOpen(Test test, Instant now) {
        return (test.getStartDate() == null || !test.getStartDate().isAfter(now))
                && (test.getEndDate() == null || !test.getEndDate().isBefore(now));
    }

    private TestProgressResponse progress(Long testId, TestAttempt inProgress, List<TestAttempt> completed) {
        InProgressResponse inProgressResponse = null;
        if (inProgress != null) {
            int answeredCount = answerRepository.findByAttemptId(inProgress.getId()).size();
            inProgressResponse = new InProgressResponse(
                    inProgress.getId(), answeredCount, inProgress.getStartTime());
        }

        if (completed == null || completed.isEmpty()) {
            return new TestProgressResponse(0, null, null, null, inProgressResponse);
        }

        Integer best = completed.stream()
                .filter(attempt -> attempt.getStatus() == TestAttemptStatus.GRADED)
                .map(attempt -> attempt.getTotalScore().intValue())
                .max(Integer::compareTo)
                .orElse(null);

        Instant last = completed.stream()
                .map(TestAttempt::getSubmittedAt)
                .filter(Objects::nonNull)
                .max(Instant::compareTo)
                .orElse(null);

        Long lastAttemptId = completed.stream().map(TestAttempt::getId).max(Long::compareTo).orElse(null);

        return new TestProgressResponse(completed.size(), best, last, lastAttemptId, inProgressResponse);
    }
}
