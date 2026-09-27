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
 * @property {number} questionCount
 * @property {TestProgress} progress
 */

/**
 * @typedef {object} TestOption
 * @property {number} id
 * @property {string} content
 */

/**
 * @typedef {object} TestQuestion
 * @property {number} id
 * @property {TestQuestionType} type
 * @property {TestSkill | null} skill
 * @property {string} content
 * @property {number} points
 * @property {string | null} audioUrl
 * @property {TestOption[]} options
 */

/**
 * @typedef {object} TestDetail
 * @property {number} id
 * @property {string} title
 * @property {TestType} type
 * @property {TestSkill | null} skill
 * @property {string | null} startDate
 * @property {string | null} endDate
 * @property {TestQuestion[]} questions
 * @property {boolean} hasInProgress
 */

/**
 * A saved answer of an attempt, used to resume it.
 * @typedef {object} SavedAnswer
 * @property {number} questionId
 * @property {number | null} optionId
 * @property {string | null} text
 */

/**
 * @typedef {object} SkillScore
 * @property {number | null} score 0-100, null while still being AI-graded
 * @property {import('@/api/types').CefrLevel | null} level
 */

/**
 * @typedef {object} ReviewItem
 * @property {number} questionId
 * @property {TestQuestionType} type
 * @property {boolean | null} correct null for AI-graded questions
 * @property {number | null} selectedOptionId
 * @property {string | null} answerText
 * @property {number | null} correctOptionId
 * @property {string | null} correctAnswer
 * @property {number} points
 * @property {number} scoreEarned
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
 * @property {ReviewItem[]} review
 */

export {}
