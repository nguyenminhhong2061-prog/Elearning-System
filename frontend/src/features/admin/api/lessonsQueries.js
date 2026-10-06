import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys, FRESH_ON_OPEN } from './keys'
import { createLesson, deleteLesson, getLesson, getLessons, updateLesson } from './lessonsApi'

// Hooks of the admin exercise pages (scenario 23).

export function useAdminLessons() {
  return useQuery({ queryKey: adminKeys.lessons, queryFn: getLessons, ...FRESH_ON_OPEN })
}

export function useAdminLesson(id) {
  return useQuery({ queryKey: adminKeys.lesson(id), queryFn: () => getLesson(id), enabled: id !== null, ...FRESH_ON_OPEN })
}

export function useSaveLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...lesson }) => (id ? updateLesson(id, lesson) : createLesson(lesson)),
    onSuccess: (lesson) => {
      queryClient.setQueryData(adminKeys.lesson(lesson.id), lesson)
      return queryClient.invalidateQueries({ queryKey: adminKeys.lessons, exact: true })
    },
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLesson,
    // Only the list: the editor still shows the deleted lesson until it navigates away, and refetching it would 404.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.lessons, exact: true }),
  })
}
