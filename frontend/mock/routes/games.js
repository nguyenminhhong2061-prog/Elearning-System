import { addDays, todayInVietnam } from '../../src/lib/dates.js'
import { HttpError } from '../http.js'
import { allUsers, findWord, notHidden, topics, visibleWords } from '../store.js'
import { findList } from './lists.js'

// docs/api/games.md (version 2, scenario 8): a round is dealt when it starts from the words of the topic or personal
// list the player chose. Question and option ids are positions in the round (from 1).

const GAMES = [
  { id: 1, name: 'Đoán nghĩa', gameType: 'GUESS_MEANING', timeLimitSeconds: 90 },
  { id: 2, name: 'Trắc nghiệm nhanh', gameType: 'QUICK_QUIZ', timeLimitSeconds: 60 },
  { id: 3, name: 'Ghép từ', gameType: 'WORD_MATCH', timeLimitSeconds: 60 },
]
/** Questions (pairs for WORD_MATCH) of a full round. */
const QUESTIONS_PER_ROUND = { GUESS_MEANING: 5, QUICK_QUIZ: 10, WORD_MATCH: 8 }
/** Fewest words with different meanings a source needs: one right meaning and three wrong ones. */
const MIN_WORDS = 4
const GRACE_SECONDS = 3
const POINTS_PER_UNIT = 10

// Other learners on the leaderboard, so it is never empty. [displayName, week score, month score]
const FAKE_PLAYERS = [
  ['Minh', 420, 1260], ['Lan', 365, 1105], ['Huy', 310, 980], ['Trang', 198, 760], ['An', 175, 640],
  ['Bình', 150, 530], ['Châu', 120, 470], ['Dũng', 95, 390], ['Giang', 60, 250],
]

const rounds = new Map() // playToken -> round the server handed out
let nextSessionId = 1

function shuffle(items) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

function requireGame(match) {
  const game = GAMES.find((candidate) => candidate.id === Number(match[1]))
  if (!game) throw new HttpError(404, 'Game not found')
  return game
}

function requireRound(userId, game, token) {
  const round = rounds.get(token)
  if (!round || round.userId !== userId || round.gameId !== game.id) throw new HttpError(400, 'Unknown playToken')
  return round
}

/** One word per meaning (two words sharing a meaning would make two right options), lowest id first. */
function distinctMeanings(words) {
  const seen = new Set()
  return [...words]
    .sort((a, b) => a.id - b.id)
    .filter((word) => {
      const meaning = word.meaning.trim().toLowerCase()
      if (seen.has(meaning)) return false
      seen.add(meaning)
      return true
    })
}

/** The words a round is dealt from: a topic, a personal list of the player, or (neither) every system word. */
function wordSource(user, searchParams) {
  const topicId = searchParams.get('topicId')
  const listId = searchParams.get('listId')
  if (topicId && listId) throw new HttpError(400, 'Send topicId or listId, not both')
  if (topicId) {
    if (!topics.some((topic) => String(topic.id) === topicId)) throw new HttpError(404, 'Topic not found')
    const words = visibleWords(user).filter((word) => String(word.topicId) === topicId)
    return { topicId: Number(topicId), listId: null, pool: distinctMeanings(words) }
  }
  if (listId) {
    const list = findList(user, Number(listId))
    if (!list) throw new HttpError(404, 'List not found')
    const words = list.wordIds.map((id) => findWord(user, id)).filter(notHidden)
    return { topicId: null, listId: list.id, pool: distinctMeanings(words) }
  }
  const words = visibleWords(user).filter((word) => word.createdBy === null && word.topicId !== null)
  return { topicId: null, listId: null, pool: distinctMeanings(words) }
}

/** The words a question may ask about: those with an example sentence for GUESS_MEANING. */
const candidates = (pool, gameType) =>
  gameType === 'GUESS_MEANING' ? pool.filter((word) => word.exampleSentence?.trim()) : pool

function unavailableReason(pool, gameType) {
  if (pool.length < MIN_WORDS) return 'NOT_ENOUGH_WORDS'
  return candidates(pool, gameType).length === 0 ? 'NO_EXAMPLES' : null
}

const questionCount = (pool, gameType) => Math.min(QUESTIONS_PER_ROUND[gameType], candidates(pool, gameType).length)

function buildRound(game, userId, { topicId, listId, pool }) {
  const reason = unavailableReason(pool, game.gameType)
  if (reason) throw new HttpError(400, reason === 'NO_EXAMPLES' ? 'No word has an example sentence' : 'Not enough words')

  const asked = shuffle(candidates(pool, game.gameType)).slice(0, questionCount(pool, game.gameType))
  const choiceGame = game.gameType !== 'WORD_MATCH'
  const dealt = asked.map((word) => ({
    word,
    offered: choiceGame
      ? shuffle([word, ...shuffle(pool.filter((other) => other.id !== word.id)).slice(0, MIN_WORDS - 1)])
      : [],
  }))
  const matchWords = choiceGame ? [] : shuffle(asked)
  const options = (words) => words.map((word, position) => ({ id: position + 1, content: word.meaning }))

  const playToken = Buffer.from(JSON.stringify({ gameId: game.id, userId, nonce: Math.random() })).toString('base64url')
  rounds.set(playToken, { gameId: game.id, userId, issuedAt: Date.now(), topicId, listId, dealt, matchWords, used: false })
  return {
    gameId: game.id,
    gameType: game.gameType,
    timeLimitSeconds: game.timeLimitSeconds,
    topicId,
    listId,
    playToken,
    questions: dealt.map(({ word, offered }, index) => ({
      id: index + 1,
      prompt: word.word,
      phonetic: word.phonetic,
      example: game.gameType === 'GUESS_MEANING' ? word.exampleSentence : null,
      points: 1,
      options: options(offered),
    })),
    matchOptions: choiceGame ? null : options(matchWords),
  }
}

/** The question of a round and the word an option id stands for (undefined when it was not offered). */
function lookUp(round, game, questionId, optionId) {
  const question = round.dealt[questionId - 1]
  if (!question) throw new HttpError(400, `Question ${questionId} is not part of this round`)
  const offered = game.gameType === 'WORD_MATCH' ? round.matchWords : question.offered
  return { question, offered, chosen: optionId == null ? null : offered[optionId - 1] }
}

function bestScore(user, gameId) {
  const scores = user.gameSessions.filter((session) => session.gameId === gameId).map((session) => session.score)
  return scores.length ? Math.max(...scores) : null
}

/** Monday of this week, or the 1st of this month, in Vietnam time. */
function periodStart(period, today) {
  if (period === 'MONTH') return `${today.slice(0, 8)}01`
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return addDays(today, -((weekday + 6) % 7))
}

export const gameRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/games$/,
    handle: ({ user, searchParams }) => {
      const { pool } = wordSource(user, searchParams)
      return GAMES.map((game) => {
        const reason = unavailableReason(pool, game.gameType)
        return {
          ...game,
          questionCount: reason ? 0 : questionCount(pool, game.gameType),
          myBestScore: bestScore(user, game.id),
          available: reason === null,
          unavailableReason: reason,
        }
      })
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/games\/(\d+)\/play$/,
    handle: ({ user, userId, match, searchParams }) => buildRound(requireGame(match), userId, wordSource(user, searchParams)),
  },
  {
    method: 'POST',
    pattern: /^\/api\/games\/(\d+)\/check$/,
    handle: ({ userId, match, body }) => {
      const game = requireGame(match)
      const round = requireRound(userId, game, body.playToken)
      const { question, offered, chosen } = lookUp(round, game, body.questionId, body.optionId)
      if (!chosen) throw new HttpError(400, 'The option was not offered for this question')
      return {
        correct: chosen.id === question.word.id,
        correctOptionId: game.gameType === 'WORD_MATCH' ? null : offered.indexOf(question.word) + 1,
      }
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/games\/(\d+)\/sessions$/,
    status: 201,
    handle: ({ user, userId, match, body }) => {
      const game = requireGame(match)
      const round = requireRound(userId, game, body.playToken)
      // Answers are checked before the round counts as handed in, so a malformed request does not cost it.
      const chosenByQuestion = new Map()
      for (const answer of body.answers ?? []) {
        if (chosenByQuestion.has(answer.questionId)) throw new HttpError(400, 'A question is answered twice')
        const { chosen } = lookUp(round, game, answer.questionId, answer.optionId)
        if (answer.optionId != null && !chosen) throw new HttpError(400, 'The option was not offered for this question')
        chosenByQuestion.set(answer.questionId, chosen)
      }
      if (round.used) throw new HttpError(400, 'This round was already handed in')
      round.used = true

      const elapsedSeconds = (Date.now() - round.issuedAt) / 1000
      const inTime = game.timeLimitSeconds === null || elapsedSeconds <= game.timeLimitSeconds + GRACE_SECONDS
      const wrongAnswers = []
      let correctCount = 0
      round.dealt.forEach(({ word }, index) => {
        const chosen = chosenByQuestion.get(index + 1) ?? null
        if (inTime && chosen?.id === word.id) correctCount += 1
        else wrongAnswers.push({ questionId: index + 1, word: word.word, chosen: chosen?.meaning ?? null, correct: word.meaning })
      })
      const score = correctCount * POINTS_PER_UNIT
      const durationSeconds = Math.min(game.timeLimitSeconds ?? Infinity, Math.round(elapsedSeconds))

      const previousBest = bestScore(user, game.id)
      user.gameSessions.push({
        id: nextSessionId++,
        gameId: game.id,
        topicId: round.topicId,
        listId: round.listId,
        score,
        playedAt: new Date().toISOString(),
      })
      return {
        sessionId: nextSessionId - 1,
        score,
        correctCount,
        questionCount: round.dealt.length,
        durationSeconds,
        timeBonus: 0,
        bestScore: Math.max(score, previousBest ?? 0),
        isPersonalBest: previousBest === null ? score > 0 : score > previousBest,
        wrongAnswers,
      }
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/games\/leaderboard$/,
    handle: ({ userId, searchParams }) => {
      const period = searchParams.get('period') ?? 'WEEK'
      if (period !== 'WEEK' && period !== 'MONTH') throw new HttpError(400, 'period must be WEEK or MONTH')
      const today = todayInVietnam()
      const start = periodStart(period, today)

      const players = FAKE_PLAYERS.map(([displayName, week, month], index) => ({
        userId: 900 + index,
        displayName,
        totalScore: period === 'WEEK' ? week : month,
      }))
      for (const [id, state] of allUsers()) {
        const total = state.gameSessions
          .filter((session) => todayInVietnam(new Date(session.playedAt)) >= start)
          .reduce((sum, session) => sum + session.score, 0)
        if (total > 0) players.push({ userId: Number(id), displayName: `Học viên ${id}`, totalScore: total })
      }
      const ranked = players.sort((a, b) => b.totalScore - a.totalScore).map((player, index) => ({ rank: index + 1, ...player }))
      const mine = ranked.find((player) => String(player.userId) === String(userId))

      // The real table is a cache refreshed by a batch job; the mock pretends it ran at the last full 5 minutes.
      const updatedAt = new Date(Math.floor(Date.now() / 300_000) * 300_000).toISOString()
      return {
        periodType: period,
        periodStart: start,
        updatedAt,
        entries: ranked.slice(0, 10),
        me: mine ? { rank: mine.rank, totalScore: mine.totalScore } : null,
      }
    },
  },
]
