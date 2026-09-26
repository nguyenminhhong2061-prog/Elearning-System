// JSON shapes of the exercise and chatbot APIs (docs/api/exercises.md, docs/api/chatbot.md). No runtime code.

/**
 * @typedef {'GRAMMAR' | 'LISTENING' | 'PRONUNCIATION'} Skill
 * @typedef {'EASY' | 'MEDIUM' | 'HARD'} Difficulty
 * @typedef {'MULTIPLE_CHOICE' | 'FILL_BLANK'} QuestionType
 *
 * @typedef {object} LessonProgress
 * @property {number} attemptCount completed attempts only
 * @property {number | null} bestScorePercent
 * @property {string | null} lastCompletedAt
 * @property {{ attemptId: number, doneCount: number, lastActivityAt: string } | null} [inProgress] an attempt that can
 *   be picked up; doneCount = questions answered or items recorded
 *
 * @typedef {object} LessonSummary
 * @property {number} id
 * @property {Skill} skill
 * @property {string} title
 * @property {string | null} description
 * @property {string | null} topic
 * @property {import('@/api/types').CefrLevel} cefrLevel
 * @property {Difficulty} difficulty
 * @property {number | null} estimatedMinutes
 * @property {number} itemCount questions (grammar, listening) or items to say (pronunciation)
 * @property {LessonProgress} progress
 *
 * @typedef {object} Question
 * @property {number} id
 * @property {QuestionType} type
 * @property {string} prompt
 * @property {string | null} hint
 * @property {number} points
 * @property {Array<{ id: number, key: string, text: string }>} options empty for FILL_BLANK
 *
 * @typedef {object} Segment
 * @property {number} id
 * @property {number} order
 * @property {number} startMs
 * @property {number} endMs
 * @property {string | null} speaker
 * @property {string} transcript
 *
 * @typedef {object} Passage
 * @property {string} title
 * @property {string} audioUrl
 * @property {number} durationMs
 * @property {Segment[]} segments
 *
 * @typedef {object} PronunciationItem
 * @property {number} id
 * @property {string} text
 * @property {string | null} ipa
 * @property {string | null} audioUrl null: the browser reads the text aloud
 * @property {string | null} notes
 *
 * @typedef {Omit<LessonSummary, 'itemCount' | 'progress'> & {
 *   questions: Question[], passage: Passage | null, pronunciationItems: PronunciationItem[]
 * }} Lesson
 *
 * @typedef {{ questionId: number, optionId?: number, answer?: string }} ResponseInput
 *
 * @typedef {object} ResponseResult
 * @property {number} questionId
 * @property {boolean} correct
 * @property {number | null} correctOptionId null for FILL_BLANK
 * @property {string} correctAnswer
 * @property {string | null} explanation
 * @property {number} awardedPoints
 *
 * @typedef {object} ReviewItem
 * @property {number} questionId
 * @property {boolean} correct
 * @property {number | null} optionId
 * @property {string | null} answer
 * @property {number | null} correctOptionId
 * @property {string} correctAnswer
 * @property {string | null} explanation
 *
 * @typedef {object} AttemptResult
 * @property {number} attemptId
 * @property {number} lessonId
 * @property {number} correctCount
 * @property {number} questionCount
 * @property {number} earnedPoints
 * @property {number} totalPoints
 * @property {number} scorePercent
 * @property {number} bestScorePercent
 * @property {boolean} isPersonalBest
 * @property {ReviewItem[]} review
 * @property {Array<{ segmentId: number, translation: string }>} translations
 * @property {{ averageScore: number, practicedCount: number, itemCount: number } | null} pronunciation
 *
 * @typedef {'NONE' | 'MISPRONUNCIATION' | 'OMISSION' | 'INSERTION'} WordErrorType
 *
 * @typedef {object} PronunciationAssessment
 * @property {number} itemId
 * @property {number} tryNumber
 * @property {number} overallScore
 * @property {number} accuracyScore
 * @property {number} fluencyScore
 * @property {number} completenessScore
 * @property {string} recognizedText
 * @property {Array<{ word: string, accuracyScore: number, errorType: WordErrorType }>} words
 * @property {string[]} tips
 *
 * @typedef {object} AttemptProgress what was already done in an attempt when the lesson was opened
 * @property {boolean} resumed true when an unfinished attempt was picked up
 * @property {ReviewItem[]} responses questions answered (grammar)
 * @property {Array<{ itemId: number, tryCount: number, bestScore: number }>} pronunciation items recorded
 *
 * @typedef {AttemptProgress & { attemptId: number, startedAt: string }} AttemptStart
 *
 * @typedef {object} CurrentAttempt
 * @property {number} attemptId
 * @property {{ id: number, skill: Skill, title: string, cefrLevel: import('@/api/types').CefrLevel, itemCount: number }} lesson
 * @property {number} doneCount
 * @property {string} lastActivityAt
 *
 * @typedef {object} ChatReply
 * @property {number} id
 * @property {'ASSISTANT'} role
 * @property {string} content simple Markdown, never HTML
 * @property {string} createdAt
 * @property {Array<{ title: string }>} sources
 */

export {}
