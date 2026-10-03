import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkAnswer, getGames, getLeaderboard, playGame, submitRound } from './gamesApi'

// Hooks for the games (A4). Pages and components use these, never gamesApi.js directly.

export const gameKeys = {
  all: ['games'],
  list: () => [...gameKeys.all, 'list'],
  leaderboard: (period) => [...gameKeys.all, 'leaderboard', period],
}

export function useGames() {
  return useQuery({ queryKey: gameKeys.list(), queryFn: getGames })
}

/** @param {'WEEK' | 'MONTH'} period */
export function useLeaderboard(period) {
  return useQuery({ queryKey: gameKeys.leaderboard(period), queryFn: () => getLeaderboard(period) })
}

/** Starts a round: its questions without the answers, and the token that identifies it. Nothing is cached. */
export function useStartRound(gameId) {
  return useMutation({ mutationFn: () => playGame(gameId) })
}

/** Whether one choice (or one word-meaning pair) is right. Nothing is saved on the server. */
export function useCheckAnswer(gameId) {
  return useMutation({ mutationFn: (answer) => checkAnswer(gameId, answer) })
}

/** Hands a finished round in; best scores and the leaderboard are then refreshed. */
export function useSubmitRound(gameId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (round) => submitRound(gameId, round),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.all }),
  })
}
