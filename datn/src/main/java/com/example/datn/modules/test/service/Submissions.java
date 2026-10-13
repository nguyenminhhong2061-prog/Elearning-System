package com.example.datn.modules.test.service;

import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.repository.AttemptTally;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The attempts every learner submitted at one test: how many, and how many of them are graded with the sum of their
 * scores. An attempt still waiting for the examiner has no score yet, so it counts as submitted but not in the
 * average.
 */
record Submissions(long count, long gradedCount, BigDecimal gradedScoreSum) {

    static final Submissions NONE = new Submissions(0, 0, BigDecimal.ZERO);

    static Submissions of(AttemptTally tally) {
        boolean graded = tally.status() == TestAttemptStatus.GRADED;
        return new Submissions(tally.count(), graded ? tally.count() : 0, graded ? tally.scoreSum() : BigDecimal.ZERO);
    }

    Submissions plus(Submissions other) {
        return new Submissions(count + other.count, gradedCount + other.gradedCount,
                gradedScoreSum.add(other.gradedScoreSum));
    }

    /** The average score (0-100) of the graded attempts, null when there is none. */
    Integer averageScore() {
        return gradedCount == 0
                ? null
                : gradedScoreSum.divide(BigDecimal.valueOf(gradedCount), 0, RoundingMode.HALF_UP).intValue();
    }
}
