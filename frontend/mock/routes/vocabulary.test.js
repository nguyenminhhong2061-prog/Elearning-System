import { describe, expect, it } from 'vitest'
import { CEFR_LEVELS } from '../../src/api/constants.js'
import { sessionCards, userState, visibleWords } from '../store.js'
import { vocabularyRoutes } from './vocabulary.js'

// Word order of docs/api/vocabulary.md: easiest level first (A1 to C2), then alphabetically.

const TODAY = '2026-09-25'
const listWordsRoute = vocabularyRoutes.find((route) => route.pattern.test('/api/vocabulary'))

function topicPage(topicId, page) {
  return listWordsRoute.handle({
    user: userState('word-order', TODAY),
    searchParams: new URLSearchParams({ topicId, page, size: 20 }),
  })
}

/** Every word is at the same level as the one before it, or harder; within a level, in alphabetical order. */
function expectEasiestFirst(words) {
  const rank = (word) => CEFR_LEVELS.indexOf(word.difficultyLevel)
  words.slice(1).forEach((word, index) => {
    const before = words[index]
    expect(rank(word)).toBeGreaterThanOrEqual(rank(before))
    if (rank(word) === rank(before)) expect(word.word.localeCompare(before.word, 'en')).toBeGreaterThan(0)
  })
}

describe('word order', () => {
  it('lists the words of a topic from A1 to C2, across pages', () => {
    const words = [...topicPage('1', 0).items, ...topicPage('1', 1).items]

    expect(words).toHaveLength(26)
    expect(words[0].difficultyLevel).toBe('A2')
    expect(words.at(-1).difficultyLevel).toBe('C1')
    expectEasiestFirst(words)
  })

  it('gives the new words of a study session easiest first', () => {
    const newcomer = { learning: new Map(), customWords: [], lists: [], gameSessions: [] }
    const pool = visibleWords(newcomer).filter((word) => word.topicId === 5)

    const cards = sessionCards(newcomer, pool, TODAY, { size: 20, dueOnly: false })

    expect(cards.map((card) => card.difficultyLevel).slice(0, 3)).toEqual(['A1', 'A1', 'A2'])
    expectEasiestFirst(cards)
  })
})
