// JSON shapes of the progress API (docs/api/progress.md). No runtime code.

/**
 * @typedef {'DAY' | 'WEEK' | 'MONTH'} Period
 *
 * @typedef {object} ProgressSummary
 * @property {{ current: number, activeToday: boolean }} streak
 * @property {{ exercisesCompleted: number, testsCompleted: number, studyMinutes: number, averageTestScore: number | null }} totals
 *
 * @typedef {object} ActivityCounts
 * @property {number} wordsLearned
 * @property {number} exercisesCompleted
 * @property {number} testsCompleted
 * @property {number} studyMinutes
 * @property {number | null} averageTestScore null when no test was submitted (not 0)
 *
 * @typedef {ActivityCounts & { start: string, end: string }} ActivityBucket dates are "YYYY-MM-DD", Vietnam time
 *
 * @typedef {object} Activity
 * @property {Period} period
 * @property {string} from first day of the first bucket
 * @property {string} to today, or the last day of the chosen range
 * @property {ActivityBucket[]} items 7, 12 or 6 buckets, or up to 31 for a chosen range, oldest first
 * @property {ActivityCounts} totals over from..to
 *
 * @typedef {{ score: number | null, level: import('@/api/types').CefrLevel | null }} SkillScore null while the AI grades it
 *
 * @typedef {object} SkillResult latest comprehensive test
 * @property {number} attemptId
 * @property {string} testTitle
 * @property {string} takenAt
 * @property {'SUBMITTED' | 'GRADED'} status SUBMITTED: speaking and writing are still being graded
 * @property {number | null} overallScore
 * @property {number | null} [previousOverallScore] of the graded comprehensive test before this one (plan page)
 * @property {import('@/api/types').CefrLevel | null} level
 * @property {{ listening: SkillScore, speaking: SkillScore, reading: SkillScore, writing: SkillScore }} skills
 *
 * @typedef {'STREAK_DAYS' | 'WORDS_LEARNED' | 'PERFECT_SCORE'} BadgeCondition
 *
 * @typedef {object} Badge
 * @property {number} id
 * @property {string} name
 * @property {string | null} description
 * @property {string | null} iconUrl
 * @property {{ type: BadgeCondition, value: number }} condition
 * @property {number} progress the learner's value, at most condition.value
 * @property {string | null} earnedAt
 */

export {}
