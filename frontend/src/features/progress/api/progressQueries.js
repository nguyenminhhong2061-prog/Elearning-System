import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getActivity, getBadges, getProgressSummary, getSkills } from './progressApi'

export const progressKeys = {
  all: ['progress'],
  summary: ['progress', 'summary'],
  activity: (period) => ['progress', 'activity', period],
  skills: ['progress', 'skills'],
  badges: ['progress', 'badges'],
}

// Progress changes with whatever the learner did elsewhere (flashcards, exercises, tests), and those screens do not
// know about this cache, so the home page always asks again when it opens.
const FRESH_ON_OPEN = { staleTime: 0 }

export function useProgressSummary() {
  return useQuery({ queryKey: progressKeys.summary, queryFn: getProgressSummary, ...FRESH_ON_OPEN })
}

/** Switching the period keeps the previous bars on screen until the new ones arrive. */
export function useActivity(period) {
  return useQuery({ queryKey: progressKeys.activity(period), queryFn: () => getActivity(period), placeholderData: keepPreviousData, ...FRESH_ON_OPEN })
}

export function useSkills() {
  return useQuery({ queryKey: progressKeys.skills, queryFn: getSkills, ...FRESH_ON_OPEN })
}

export function useBadges() {
  return useQuery({ queryKey: progressKeys.badges, queryFn: getBadges, ...FRESH_ON_OPEN })
}
