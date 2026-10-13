// JSON shapes of the tests API, as agreed in docs/api/tests.md. No runtime code.

/**
 * @typedef {'PERIODIC' | 'COMPREHENSIVE'} TestType
 * @typedef {'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING'} TestQuestionType
 * @typedef {'IN_PROGRESS' | 'SUBMITTED' | 'GRADED'} TestAttemptStatus
 * @typedef {'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING'} TestSkill
 */

/**
 * @typedef {object} TestProgress
 * @property {number} attemptCount
 * @property {number | null} bestScorePercent
 * @property {string | null} lastCompletedAt
 * @property {number | null} lastAttemptId the latest submitted attempt, to open its result
 * @property {{ attemptId: number, answeredCount: number, lastActivityAt: string } | null} inProgress
 */

/**
 * One test in the list (GET /api/tests).
 * @typedef {object} TestSummary
 * @property {number} id
 * @property {string} title
 * @property {TestType} type
 * @property {TestSkill | null} skill
 * @property {string | null} startDate
 * @property {string | null} endDate
 * @property {boolean} retakeAllowed false for a test taken only once (a comprehensive test)
 * @property {number} questionCount
 * @property {TestProgress} progress
 */

/**
 * One submitted attempt in the history of a test (GET /api/tests/{id}/attempts).
 * @typedef {object} AttemptSummary
 * @property {number} attemptId
 * @property {TestAttemptStatus} status SUBMITTED while the AI is still grading, else GRADED
 * @property {string | null} submittedAt
 * @property {number | null} scorePercent null while still being graded
 * @property {import('@/api/types').CefrLevel | null} suggestedLevel null while still being graded
 */

/**
 * @typedef {object} TestOption
 * @property {number} id
 * @property {string} content
 */

/**
 * What several questions are asked about: a recording to listen to (audioUrl, maxPlays) or a text to read (content).
 * @typedef {object} TestPassage
 * @property {number} id
 * @property {string | null} title
 * @property {string | null} content
 * @property {string | null} audioUrl
 * @property {number | null} maxPlays how many times the recording may be played in one attempt
 */

/**
 * How many times a recording has been played in an attempt.
 * @typedef {object} PassagePlay
 * @property {number} passageId
 * @property {number} playCount
 * @property {number} maxPlays
 */

/**
 * @typedef {object} TestQuestion
 * @property {number} id
 * @property {number | null} passageId the passage the question is about, null when it stands alone
 * @property {TestQuestionType} type
 * @property {TestSkill | null} skill
 * @property {string} content
 * @property {number} points
 * @property {string | null} audioUrl
 * @property {string | null} referenceText the sentence of a read-aloud question, answered with a recording
 * @property {number | null} maxRecordingSeconds how long that recording may be
 * @property {TestOption[]} options
 */

/**
 * @typedef {object} TestDetail
 * @property {number} id
 * @property {string} title
 * @property {TestType} type
 * @property {TestSkill | null} skill
 * @property {string | null} [skillText] what the test covers, in the admin's words ("Từ vựng và ngữ pháp")
 * @property {string | null} [instruction] how to take the test, in the admin's words
 * @property {string | null} startDate
 * @property {string | null} endDate
 * @property {boolean} retakeAllowed
 * @property {TestPassage[]} passages
 * @property {TestQuestion[]} questions
 * @property {boolean} hasInProgress
 * @property {number | null} lastAttemptId the learner's latest submitted attempt
 */

/**
 * A saved answer of an attempt, used to resume it.
 * @typedef {object} SavedAnswer
 * @property {number} questionId
 * @property {number | null} optionId
 * @property {string | null} text
 * @property {boolean} recorded a recorded answer: only its existence is known until the attempt is submitted
 */

/**
 * @typedef {object} SkillScore
 * @property {number | null} score 0-100, null while still being AI-graded
 * @property {import('@/api/types').CefrLevel | null} level
 */

/**
 * @typedef {object} ReviewItem
 * @property {number} questionId
 * @property {number | null} passageId
 * @property {TestQuestionType} type
 * @property {import('@/api/types').CefrLevel | null} level the level the question tests
 * @property {boolean | null} correct null for AI-graded questions
 * @property {number | null} selectedOptionId
 * @property {string | null} answerText
 * @property {number | null} correctOptionId
 * @property {string | null} correctAnswer
 * @property {number} points
 * @property {number} scoreEarned
 * @property {Record<'task' | 'coherence' | 'vocabulary' | 'grammar', number> | null} aiCriteria the AI's band 0-6 per
 *   criterion (1 = A1 ... 6 = C2), null for auto-graded questions and while the AI has not graded yet
 * @property {string | null} aiComment
 * @property {PronunciationReview | null} pronunciation how a read-aloud answer was pronounced
 */

/**
 * @typedef {object} PronunciationReview
 * @property {number} score 0-100
 * @property {number | null} phonemeAccuracy the share of sounds that match the sentence, 0-100
 * @property {number | null} wordAccuracy the share of words that match, 0-100
 * @property {Array<{ word: string, expectedIpa: string, heardIpa: string }>} errors heardIpa is empty for a word that
 *   was left out
 */

/**
 * @typedef {object} TestResult
 * @property {number} attemptId
 * @property {number} testId
 * @property {string} title
 * @property {TestType} type
 * @property {TestAttemptStatus} status
 * @property {string | null} submittedAt
 * @property {number} correctCount
 * @property {number} questionCount
 * @property {number} totalPoints
 * @property {number} earnedPoints
 * @property {number | null} scorePercent null while a skill is still being AI-graded
 * @property {number | null} bestScorePercent
 * @property {boolean} isPersonalBest
 * @property {import('@/api/types').CefrLevel | null} suggestedLevel
 * @property {string | null} suggestedRoadmap
 * @property {Record<'listening' | 'reading' | 'writing' | 'speaking', SkillScore>} skills
 * @property {Array<Omit<TestPassage, 'maxPlays'> & { transcript: string | null }>} passages with the transcripts
 * @property {ReviewItem[]} review
 */

export {}
