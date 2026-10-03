import { describe, expect, it } from 'vitest'
import { HttpError } from '../http.js'
import { MOCK_TOPICS, MOCK_WORDS } from '../vocabularyFixtures.js'
import { gameRoutes } from './games.js'

// The mock's rounds follow docs/api/games.md version 2 (scenario 8), like the backend's GameService.

const EMPTY_TOPIC = MOCK_TOPICS.find((topic) => !MOCK_WORDS.some((word) => word.topicId === topic.id))
const learner = () => ({ learning: new Map(), reviews: [], customWords: [], lists: [], gameSessions: [] })

function call(user, method, path, { query = {}, body } = {}) {
  const route = gameRoutes.find((candidate) => candidate.method === method && candidate.pattern.test(path))
  return route.handle({
    user,
    userId: 7,
    match: path.match(route.pattern),
    searchParams: new URLSearchParams(query),
    body,
  })
}

const meaningOf = (word) => MOCK_WORDS.find((candidate) => candidate.word === word).meaning

describe('games dealt from a topic', () => {
  it('lists the games with their question count and availability for the topic chosen', () => {
    const games = call(learner(), 'GET', '/api/games', { query: { topicId: '1' } })

    expect(games.map((game) => [game.gameType, game.questionCount, game.available])).toEqual([
      ['GUESS_MEANING', 5, true],
      ['QUICK_QUIZ', 10, true],
      ['WORD_MATCH', 8, true],
    ])
    expect(call(learner(), 'GET', '/api/games', { query: { topicId: String(EMPTY_TOPIC.id) } })[0]).toMatchObject({
      available: false,
      unavailableReason: 'NOT_ENOUGH_WORDS',
      questionCount: 0,
    })
  })

  it('asks the words of the topic with four meanings of the topic, numbered from 1', () => {
    const round = call(learner(), 'GET', '/api/games/2/play', { query: { topicId: '1' } })
    const topicWords = MOCK_WORDS.filter((word) => word.topicId === 1)

    expect(round.topicId).toBe(1)
    expect(round.questions.map((question) => question.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const question of round.questions) {
      expect(topicWords.map((word) => word.word)).toContain(question.prompt)
      expect(question.options.map((option) => option.id)).toEqual([1, 2, 3, 4])
      expect(question.options.map((option) => option.content)).toContain(meaningOf(question.prompt))
    }
    expect(() => call(learner(), 'GET', '/api/games/2/play', { query: { topicId: String(EMPTY_TOPIC.id) } })).toThrow(
      HttpError,
    )
  })

  it('shows the example sentence in "Đoán nghĩa"', () => {
    const round = call(learner(), 'GET', '/api/games/1/play', { query: { topicId: '1' } })

    expect(round.questions).toHaveLength(5)
    round.questions.forEach((question) => expect(question.example).toBeTruthy())
  })

  it('scores 10 points a right answer, without a time bonus, and lists the wrong ones', () => {
    const user = learner()
    const round = call(user, 'GET', '/api/games/2/play', { query: { topicId: '1' } })
    const rightOption = (question) =>
      question.options.find((option) => option.content === meaningOf(question.prompt)).id
    const wrongOption = (question) =>
      question.options.find((option) => option.content !== meaningOf(question.prompt)).id
    const answers = round.questions.map((question, index) => ({
      questionId: question.id,
      // The first question is answered wrong, the last one left unanswered.
      optionId: index === 0 ? wrongOption(question) : index === 9 ? null : rightOption(question),
    }))

    const result = call(user, 'POST', '/api/games/2/sessions', { body: { playToken: round.playToken, answers } })

    expect(result).toMatchObject({ score: 80, correctCount: 8, questionCount: 10, timeBonus: 0, isPersonalBest: true })
    expect(result.durationSeconds).toBe(0)
    expect(result.wrongAnswers.map((wrong) => [wrong.questionId, wrong.word, wrong.correct])).toEqual([
      [1, round.questions[0].prompt, meaningOf(round.questions[0].prompt)],
      [10, round.questions[9].prompt, meaningOf(round.questions[9].prompt)],
    ])
    expect(result.wrongAnswers[1].chosen).toBeNull()
    expect(() => call(user, 'POST', '/api/games/2/sessions', { body: { playToken: round.playToken, answers } })).toThrow(
      HttpError,
    )
  })

  it('never reveals the right pair of a "Ghép từ" round', () => {
    const user = learner()
    const round = call(user, 'GET', '/api/games/3/play', { query: { topicId: '1' } })
    const question = round.questions[0]
    const right = round.matchOptions.find((option) => option.content === meaningOf(question.prompt))

    expect(round.questions).toHaveLength(8)
    expect(call(user, 'POST', '/api/games/3/check', { body: { playToken: round.playToken, questionId: 1, optionId: right.id } }))
      .toEqual({ correct: true, correctOptionId: null })
  })
})
