package com.example.datn.modules.test.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.entity.TestAttemptAnswer;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.exception.InvalidTestAnswerException;
import com.example.datn.modules.test.exception.TestAttemptNotFoundException;
import com.example.datn.modules.test.exception.TestAttemptNotInProgressException;
import com.example.datn.modules.test.repository.TestAttemptAnswerRepository;
import com.example.datn.modules.test.repository.TestAttemptRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import org.springframework.stereotype.Service;

/**
 * Saves the recorded answer of a read-aloud question (docs/api/tests.md): the recording is assessed at once and only
 * its outcome is kept, never the audio. The outcome stays hidden until the attempt is submitted, when
 * {@link TestGradingService} turns it into points.
 *
 * Not transactional on purpose: the assessment can take minutes while the service loads its models, and no database
 * transaction is held open across it.
 */
@Service
public class TestRecordingService {

    /** About 30 seconds of 16 kHz mono WAV: twice the longest recording the screen makes. */
    static final int MAX_RECORDING_BYTES = 1_000_000;

    private static final int WAV_HEADER_BYTES = 44;

    private final TestAttemptRepository attemptRepository;
    private final TestQuestionRepository questionRepository;
    private final TestAttemptAnswerRepository answerRepository;
    private final CurrentUser currentUser;
    private final PronunciationAssessor assessor;

    public TestRecordingService(
            TestAttemptRepository attemptRepository,
            TestQuestionRepository questionRepository,
            TestAttemptAnswerRepository answerRepository,
            CurrentUser currentUser,
            PronunciationAssessor assessor) {
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.currentUser = currentUser;
        this.assessor = assessor;
    }

    /** Assesses the recording and makes it the answer, replacing an earlier recording of the same question. */
    public void saveRecording(Long attemptId, Long questionId, byte[] wav) {
        TestAttempt attempt = inProgressOwnedAttempt(attemptId);
        TestQuestion question = questionRepository.findById(questionId)
                .filter(candidate -> candidate.getTestId().equals(attempt.getTestId()))
                .orElseThrow(() -> new InvalidTestAnswerException("Question does not belong to this test"));
        if (!question.isReadAloud()) {
            throw new InvalidTestAnswerException("This question is not answered with a recording");
        }
        if (wav.length > MAX_RECORDING_BYTES) {
            throw new InvalidTestAnswerException("Recording must not exceed 1 MB");
        }
        if (!isWav(wav)) {
            throw new InvalidTestAnswerException("A valid WAV recording is required");
        }

        PronunciationAssessor.Assessment assessment = assessor.assess(wav, question.getReferenceText());

        // The assessment took a while: the attempt may have been submitted in the meantime.
        inProgressOwnedAttempt(attemptId);
        TestAttemptAnswer answer = answerRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
                .orElseGet(() -> new TestAttemptAnswer(attemptId, questionId));
        answer.setRecording(assessment.recognizedText(), assessment.score(), assessment.details());
        answerRepository.save(answer);
    }

    private static boolean isWav(byte[] audio) {
        return audio.length > WAV_HEADER_BYTES
                && audio[0] == 'R' && audio[1] == 'I' && audio[2] == 'F' && audio[3] == 'F'
                && audio[8] == 'W' && audio[9] == 'A' && audio[10] == 'V' && audio[11] == 'E';
    }

    private TestAttempt inProgressOwnedAttempt(Long attemptId) {
        TestAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, currentUser.id())
                .orElseThrow(() -> new TestAttemptNotFoundException(attemptId));
        if (attempt.getStatus() != TestAttemptStatus.IN_PROGRESS) {
            throw new TestAttemptNotInProgressException(attemptId);
        }
        return attempt;
    }
}
