import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGames, getLeaderboard, submitRound } from './gamesApi'

export const gameKeys = {
  all: ['games'],
  list: () => [...gameKeys.all, 'list'],
  leaderboard: (period) => [...gameKeys.all, 'leaderboard', period],
}

export function useGames() {
  return useQuery({ queryKey: gameKeys.list(), queryFn: getGames })
}

export function useLeaderboard(period) {
  return useQuery({ queryKey: gameKeys.leaderboard(period), queryFn: () => getLeaderboard(period) })
}

/** Hands a finished round in; best scores and the leaderboard are then refreshed. */
export function useSubmitRound(gameId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (round) => submitRound(gameId, round),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.all }),
  })
}
