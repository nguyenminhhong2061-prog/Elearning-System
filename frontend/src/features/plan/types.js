// Shapes of docs/api/plans.md, for editor hints only.

/**
 * @typedef {'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'} CefrLevel
 * @typedef {{ min: number, max: number }} DailyMinutes
 * @typedef {{ targetLevel: CefrLevel, description: string }} Goal the dates are the plan's own startDate and endDate
 */

/**
 * What "Gợi ý lộ trình" sends (POST /api/study-plan/preview).
 * @typedef {object} GoalRequest
 * @property {CefrLevel} targetLevel
 * @property {string} startDate YYYY-MM-DD, not before today
 * @property {string} endDate YYYY-MM-DD, after startDate, at most a year later
 * @property {string} description required, at most 255 characters
 * @property {number} [fromAttemptId] the comprehensive test whose roadmap the AI should follow (scenario 17, 2a)
 */

/**
 * @typedef {object} PlanWeek
 * @property {number} weekNumber
 * @property {string} startDate YYYY-MM-DD
 * @property {string} endDate YYYY-MM-DD
 * @property {string} description
 * @property {number} targetWords
 * @property {number} targetExercises
 * @property {number} [wordsDone] absent in a preview
 * @property {number} [exercisesDone] absent in a preview
 * @property {'PENDING' | 'IN_PROGRESS' | 'DONE'} [status] absent in a preview
 * @property {boolean | null} [achieved] only for DONE weeks
 */

/**
 * @typedef {object} StudyPlan
 * @property {number} id
 * @property {Goal} goal
 * @property {CefrLevel | null} startLevel
 * @property {string} startDate
 * @property {string} endDate
 * @property {'ACTIVE' | 'PAUSED' | 'COMPLETED'} status
 * @property {DailyMinutes | null} dailyMinutes null for a plan the learner wrote themselves
 * @property {string | null} summary
 * @property {number | null} currentWeek
 * @property {PlanWeek[]} weeks
 */

/**
 * @typedef {object} GoalOption
 * @property {CefrLevel} targetLevel
 * @property {number} months
 * @property {DailyMinutes} dailyMinutes
 * @property {boolean} recommended
 */

/**
 * A preview of POST /api/study-plan/preview: a plan not saved yet (no id, status or progress).
 * @typedef {Omit<StudyPlan, 'id' | 'status' | 'currentWeek'>} PlanDraft
 */

/**
 * @typedef {object} Suggestion
 * @property {'PRACTICE_SKILL' | 'LEARN_TOPIC' | 'REVIEW_WORDS' | 'TAKE_TEST'} type
 * @property {string} title
 * @property {string} reason
 * @property {'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING'} [skill]
 * @property {number} [topicId]
 * @property {number} [count]
 * @property {number} [testId]
 */

export {}
