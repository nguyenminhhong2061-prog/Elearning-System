import { addDays, todayInVietnam } from '../../src/lib/dates.js'
import { HttpError } from '../http.js'
import { allUsers, gameWords } from '../store.js'

// docs/api/games.md

// The admin page (routes/admin.js) changes `timeLimitSeconds` and `enabled`; a switched-off game is hidden from learners.
export const GAMES = [
  { id: 1, name: 'Đoán nghĩa', gameType: 'GUESS_MEANING', timeLimitSeconds: 90, questionCount: 10, enabled: true },
  { id: 2, name: 'Trắc nghiệm nhanh', gameType: 'QUICK_QUIZ', timeLimitSeconds: 60, questionCount: 12, enabled: true },
  { id: 3, name: 'Ghép từ', gameType: 'WORD_MATCH', timeLimitSeconds: 60, questionCount: 6, enabled: true },
]
const GRACE_SECONDS = 3
const POINTS_PER_UNIT = 10

// Other learners on the leaderboard, so it is never empty. [displayName, week score, month score]
const FAKE_PLAYERS = [
  ['Minh', 420, 1260], ['Lan', 365, 1105], ['Huy', 310, 980], ['Trang', 198, 760], ['An', 175, 640],
  ['Bình', 150, 530], ['Châu', 120, 470], ['Dũng', 95, 390], ['Giang', 60, 250],
]

const rounds = new Map() // playToken -> round the server handed out
let nextQuestionId = 1
let nextOptionId = 1
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
  const game = GAMES.find((candidate) => candidate.id === Number(match[1]) && candidate.enabled)
  if (!game) throw new HttpError(404, 'Game not found')
  return game
}

function requireRound(userId, game, token) {
  const round = rounds.get(token)
  if (!round || round.userId !== userId || round.gameId !== game.id) throw new HttpError(400, 'Unknown playToken')
  return round
}

function buildRound(game, userId) {
  const pool = gameWords()
  const words = shuffle(pool).slice(0, game.questionCount)
  const answers = new Map()
  const questions = words.map((word) => {
    const id = nextQuestionId++
    const correctOptionId = nextOptionId++
    answers.set(id, { correctOptionId, points: 1 })
    const prompt = game.gameType === 'QUICK_QUIZ' ? word.meaning : word.word
    const answerText = game.gameType === 'QUICK_QUIZ' ? word.word : word.meaning
    let options = []
    if (game.gameType !== 'WORD_MATCH') {
      const distractors = shuffle(pool.filter((other) => other.id !== word.id))
        .slice(0, 3)
        .map((other) => ({ id: nextOptionId++, content: game.gameType === 'QUICK_QUIZ' ? other.word : other.meaning }))
      options = shuffle([{ id: correctOptionId, content: answerText }, ...distractors])
    }
    return {
      id,
      prompt,
      phonetic: game.gameType === 'GUESS_MEANING' ? word.phonetic : null,
      points: 1,
      options,
      matchMeaning: { id: correctOptionId, content: word.meaning },
    }
  })

  const playToken = Buffer.from(JSON.stringify({ gameId: game.id, userId, nonce: Math.random() })).toString('base64url')
  rounds.set(playToken, { gameId: game.id, userId, issuedAt: Date.now(), answers, used: false })
  return {
    gameId: game.id,
    gameType: game.gameType,
    timeLimitSeconds: game.timeLimitSeconds,
    playToken,
    questions: questions.map(({ matchMeaning: _answer, ...question }) => question),
    matchOptions: game.gameType === 'WORD_MATCH' ? shuffle(questions.map((question) => question.matchMeaning)) : null,
  }
}

/**
 * Remaining seconds, scaled by the share of right answers: answering at random as fast as possible earns nothing.
 * docs/api/games.md: floor(remaining × correct / total).
 */
export function scoreTimeBonus(limitSeconds, elapsedSeconds, correctCount, questionCount) {
  if (limitSeconds === null || questionCount === 0) return 0
  const remaining = Math.max(0, limitSeconds - elapsedSeconds)
  return Math.floor((remaining * correctCount) / questionCount)
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
    handle: ({ user }) =>
      GAMES.filter((game) => game.enabled).map(({ enabled: _enabled, ...game }) => ({ ...game, myBestScore: bestScore(user, game.id) })),
  },
  {
    method: 'GET',
    pattern: /^\/api\/games\/(\d+)\/play$/,
    handle: ({ userId, match }) => buildRound(requireGame(match), userId),
  },
  {
    method: 'POST',
    pattern: /^\/api\/games\/(\d+)\/check$/,
    handle: ({ userId, match, body }) => {
      const game = requireGame(match)
      const answer = requireRound(userId, game, body.playToken).answers.get(body.questionId)
      if (!answer) throw new HttpError(400, 'The question is not part of this round')
      return {
        correct: answer.correctOptionId === body.optionId,
        correctOptionId: game.gameType === 'WORD_MATCH' ? null : answer.correctOptionId,
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
      if (round.used) throw new HttpError(400, 'This round was already handed in')
      round.used = true

      const elapsedSeconds = (Date.now() - round.issuedAt) / 1000
      const inTime = game.timeLimitSeconds === null || elapsedSeconds <= game.timeLimitSeconds + GRACE_SECONDS
      const given = new Map((body.answers ?? []).map((answer) => [answer.questionId, answer.optionId]))
      let correctCount = 0
      let score = 0
      for (const [questionId, answer] of round.answers) {
        if (inTime && given.get(questionId) === answer.correctOptionId) {
          correctCount += 1
          score += answer.points * POINTS_PER_UNIT
        }
      }
      const allAnswered = [...round.answers.keys()].every((id) => given.get(id) != null)
      const timeBonus = inTime && allAnswered ? scoreTimeBonus(game.timeLimitSeconds, elapsedSeconds, correctCount, round.answers.size) : 0
      score += timeBonus

      const previousBest = bestScore(user, game.id)
      user.gameSessions.push({ id: nextSessionId++, gameId: game.id, score, playedAt: new Date().toISOString() })
      return {
        sessionId: nextSessionId - 1,
        score,
        correctCount,
        questionCount: round.answers.size,
        timeBonus,
        bestScore: Math.max(score, previousBest ?? 0),
        isPersonalBest: previousBest === null ? score > 0 : score > previousBest,
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
