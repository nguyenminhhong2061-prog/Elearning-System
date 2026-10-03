// Shapes of docs/api/admin.md, for editor hints only.

/**
 * @typedef {'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'} CefrLevel
 * @typedef {'GRAMMAR' | 'READING' | 'WRITING' | 'LISTENING' | 'PRONUNCIATION'} LessonSkill
 * @typedef {'DRAFT' | 'PUBLISHED' | 'HIDDEN'} LessonStatus
 * @typedef {'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'} TestSkill
 */

/**
 * One row of "Nội dung được học nhiều nhất" (ContentStat of the design). `skill` is only set for lessons.
 *
 * @typedef {object} ContentStat
 * @property {'TOPIC' | 'EXERCISE' | 'TEST'} type
 * @property {number} id
 * @property {string} name
 * @property {LessonSkill | null} skill
 * @property {number} attemptCount
 * @property {number} learnerCount
 */

/**
 * @typedef {object} AdminStats
 * @property {string} from
 * @property {string} to
 * @property {string} generatedAt
 * @property {{ total: number, newInPeriod: number }} learners
 * @property {number} activeLearners learners with at least one study day in the period
 * @property {number} reviews
 * @property {number} exerciseAttempts
 * @property {number} testsSubmitted
 * @property {{ date: string, count: number }[]} dailyActive
 * @property {Record<CefrLevel | 'NONE', number>} levels
 * @property {ContentStat[]} topContent
 * @property {{ wordsMissingAudio: number, wordsMissingExample: number, lessonsWithIssues: { lessonId: number, title: string, issue: string }[], periodicTestGap: { weekStart: string, weekEnd: string } | null, lockedUsers: number }} attention
 */

/**
 * @typedef {object} AdminTopic
 * @property {number} id
 * @property {string} name
 * @property {string | null} description
 * @property {string | null} imageUrl
 * @property {number} wordCount
 * @property {CefrLevel | null} minLevel
 * @property {CefrLevel | null} maxLevel
 * @property {number} missingAudioCount
 * @property {number} missingExampleCount
 * @property {number} learnerCount
 * @property {string | null} updatedAt
 */

/**
 * @typedef {object} WordInput
 * @property {number | null} topicId
 * @property {string} word
 * @property {string | null} phonetic
 * @property {string} meaning
 * @property {string | null} exampleSentence
 * @property {string | null} audioUrl
 * @property {string | null} imageUrl
 * @property {CefrLevel} difficultyLevel
 */

/**
 * @typedef {WordInput & { id: number, learnerCount: number, listCount: number, updatedAt: string | null }} AdminWord
 */

/**
 * @typedef {object} AdminLessonSummary
 * @property {number} id
 * @property {string} title
 * @property {LessonSkill} skill
 * @property {CefrLevel} cefrLevel
 * @property {'EASY' | 'MEDIUM' | 'HARD'} difficulty
 * @property {LessonStatus} status
 * @property {number} questionCount
 * @property {number} segmentCount
 * @property {number} itemCount
 * @property {number} attempts
 * @property {string | null} updatedAt
 * @property {('MISSING_AUDIO' | 'NO_QUESTIONS')[]} issues
 */

/**
 * @typedef {object} EditableQuestion
 * @property {number} [id] absent for a new question
 * @property {'MULTIPLE_CHOICE' | 'FILL_BLANK'} type
 * @property {string} prompt
 * @property {string | null} hint
 * @property {string | null} explanation
 * @property {number} points
 * @property {{ id?: number, text: string, correct: boolean }[]} options
 * @property {string[]} acceptedAnswers
 */

/**
 * @typedef {object} AdminLesson
 * @property {number} id
 * @property {string} title
 * @property {string | null} description
 * @property {string | null} topic
 * @property {LessonSkill} skill
 * @property {CefrLevel} cefrLevel
 * @property {'EASY' | 'MEDIUM' | 'HARD'} difficulty
 * @property {number | null} estimatedMinutes
 * @property {LessonStatus} status
 * @property {number} attempts
 * @property {string | null} updatedAt
 * @property {string[]} issues
 * @property {EditableQuestion[]} questions
 * @property {{ audioUrl: string | null, audioMissing: boolean, durationMs: number | null, transcript: string, translation: string, segments: { id?: number, startMs: number, endMs: number, speaker: string | null, text: string, translation: string | null }[] } | null} passage
 * @property {{ id?: number, text: string, ipa: string | null, audioUrl: string | null, notes: string | null }[]} pronunciationItems
 */

/**
 * @typedef {object} AdminTestSummary
 * @property {number} id
 * @property {string} title
 * @property {'PERIODIC' | 'COMPREHENSIVE'} type
 * @property {string | null} startDate
 * @property {string | null} endDate
 * @property {'DRAFT' | 'UPCOMING' | 'OPEN' | 'CLOSED'} status
 * @property {number} questionCount
 * @property {TestSkill[]} skills
 * @property {number} submissions
 * @property {number | null} averageScore
 */

/**
 * @typedef {object} AdminTestQuestion
 * @property {number} [id]
 * @property {TestSkill} skill
 * @property {'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'LISTENING' | 'READING' | 'SPEAKING' | 'WRITING'} type
 * @property {number} points
 * @property {string | null} audioUrl
 * @property {string} content
 * @property {{ id?: number, text: string, correct: boolean }[]} options
 * @property {string[]} acceptedAnswers
 */

/**
 * @typedef {AdminTestSummary & { questions: AdminTestQuestion[], duplicatedFrom: { id: number, title: string } | null }} AdminTest
 */

/**
 * @typedef {object} AdminUserRow
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {CefrLevel | null} currentLevel
 * @property {'ACTIVE' | 'LOCKED'} status
 * @property {string} createdAt
 * @property {string | null} lastActiveAt
 */

/**
 * @typedef {AdminUserRow & {
 *   stats: { wordsLearned: number, wordsMastered: number, streakDays: number, lastStudyDate: string | null, exercisesCompleted: number, exerciseAverageScore: number | null, testsSubmitted: number, lastTestDate: string | null, chatSessions: number, lastChatDate: string | null },
 *   recentActivity: { at: string, type: 'REVIEW' | 'EXERCISE' | 'TEST' | 'GAME' | 'CHAT', title: string, detail: string | null }[],
 *   levelHistory: { level: CefrLevel | null, changedAt: string, source: string }[],
 *   plan: { title: string, currentWeek: number, weekCount: number, status: string } | null,
 * }} AdminUserDetail
 */

export {}
