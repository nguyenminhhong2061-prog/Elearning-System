import { httpClient } from '@/api/httpClient'

// Calls of the game API (A4). The contract is in docs/api/games.md.

/** @returns {Promise<import('../types').Game[]>} */
export async function getGames() {
  const { data } = await httpClient.get('/api/games')
  return data
}

/** Starts a round: questions without their answers, and the token that identifies the round. */
export async function playGame(gameId) {
  const { data } = await httpClient.get(`/api/games/${gameId}/play`)
  return data
}

/** Whether one choice is right. Nothing is saved. @returns {Promise<{ correct: boolean, correctOptionId: number | null }>} */
export async function checkAnswer(gameId, { playToken, questionId, optionId }) {
  const { data } = await httpClient.post(`/api/games/${gameId}/check`, { playToken, questionId, optionId })
  return data
}

/** Hands the finished round in; the server scores it and saves it. */
export async function submitRound(gameId, { playToken, answers }) {
  const { data } = await httpClient.post(`/api/games/${gameId}/sessions`, { playToken, answers })
  return data
}

/** @param {'WEEK' | 'MONTH'} period */
export async function getLeaderboard(period) {
  const { data } = await httpClient.get('/api/games/leaderboard', { params: { period } })
  return data
}
