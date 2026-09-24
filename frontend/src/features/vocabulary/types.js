// JSON shapes of the vocabulary API, as agreed in docs/api/vocabulary.md. No runtime code.

/**
 * @typedef {object} Topic
 * @property {number} id
 * @property {string} name
 * @property {string | null} description
 * @property {string | null} imageUrl
 * @property {number} wordCount words in the topic visible to the current user
 * @property {number} learnedCount of those, words the current user has learned (learning or mastered)
 */

/**
 * @typedef {object} VocabularyItem
 * @property {number} id
 * @property {number | null} topicId
 * @property {number | null} createdBy
 * @property {string} word
 * @property {string} meaning
 * @property {string | null} exampleSentence
 * @property {string | null} phonetic
 * @property {string | null} audioUrl
 * @property {string | null} imageUrl
 * @property {import('@/api/types').CefrLevel} difficultyLevel
 * @property {'NEW' | 'LEARNING' | 'MASTERED'} learningStatus for the current user
 */

export {}
