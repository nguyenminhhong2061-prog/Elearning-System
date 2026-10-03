// JSON shapes of the game API (docs/api/games.md). No runtime code.

/**
 * @typedef {'GUESS_MEANING' | 'QUICK_QUIZ' | 'WORD_MATCH'} GameType
 *
 * @typedef {object} Game
 * @property {number} id
 * @property {string} name
 * @property {GameType} gameType
 * @property {number | null} timeLimitSeconds
 * @property {number} questionCount
 * @property {number | null} myBestScore
 *
 * @typedef {object} GameQuestion
 * @property {number} id
 * @property {string} prompt the English word
 * @property {string | null} phonetic
 * @property {number} points
 * @property {Array<{ id: number, content: string }>} options empty for WORD_MATCH
 *
 * @typedef {object} GameRound
 * @property {number} gameId
 * @property {GameType} gameType
 * @property {number | null} timeLimitSeconds
 * @property {string} playToken
 * @property {GameQuestion[]} questions
 * @property {Array<{ id: number, content: string }> | null} matchOptions WORD_MATCH only: the meanings, shuffled
 */

export {}
