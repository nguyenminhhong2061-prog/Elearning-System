import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completeAttempt, getCurrentAttempt, getLesson, getLessons } from './exercisesApi'

export const exerciseKeys = {
  all: ['exercises'],
  lessons: (skill) => [...exerciseKeys.all, 'lessons', skill],
  lesson: (id) => [...exerciseKeys.all, 'lesson', id],
  current: ['exercises', 'current'],
}

/**
 * Opening a lesson, answering or recording changes what is unfinished ("Đang làm dở" in the lists, "Tiếp tục" on the
 * home page). Those are only marked stale, not fetched again now: the lesson screen does not show them.
 */
export function markAttemptsStale(queryClient) {
  queryClient.invalidateQueries({ queryKey: [...exerciseKeys.all, 'lessons'], refetchType: 'none' })
  queryClient.invalidateQueries({ queryKey: exerciseKeys.current, refetchType: 'none' })
}

/** Lessons of one skill with the learner's progress. Pass null to wait (the skill is not known yet). */
export function useLessons(skill) {
  return useQuery({ queryKey: exerciseKeys.lessons(skill), queryFn: () => getLessons(skill), enabled: Boolean(skill) })
}

export function useLesson(lessonId) {
  return useQuery({ queryKey: exerciseKeys.lesson(lessonId), queryFn: () => getLesson(lessonId) })
}

/** The unfinished attempt the learner worked on last, or null. */
export function useCurrentAttempt() {
  return useQuery({ queryKey: exerciseKeys.current, queryFn: getCurrentAttempt })
}

/** Ends an attempt; the lesson lists are refreshed because their best scores may have changed, and it is no longer unfinished. */
export function useCompleteAttempt(attemptId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => completeAttempt(attemptId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...exerciseKeys.all, 'lessons'] })
      queryClient.invalidateQueries({ queryKey: exerciseKeys.current })
    },
  })
}
