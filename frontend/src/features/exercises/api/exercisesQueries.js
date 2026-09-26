import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completeAttempt, getLesson, getLessons } from './exercisesApi'

export const exerciseKeys = {
  all: ['exercises'],
  lessons: (skill) => [...exerciseKeys.all, 'lessons', skill],
  lesson: (id) => [...exerciseKeys.all, 'lesson', id],
}

/** Lessons of one skill with the learner's progress. Pass null to wait (the skill is not known yet). */
export function useLessons(skill) {
  return useQuery({ queryKey: exerciseKeys.lessons(skill), queryFn: () => getLessons(skill), enabled: Boolean(skill) })
}

export function useLesson(lessonId) {
  return useQuery({ queryKey: exerciseKeys.lesson(lessonId), queryFn: () => getLesson(lessonId) })
}

/** Ends an attempt; the lesson lists are refreshed because their best scores may have changed. */
export function useCompleteAttempt(attemptId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => completeAttempt(attemptId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...exerciseKeys.all, 'lessons'] }),
  })
}
