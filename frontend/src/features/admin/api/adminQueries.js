import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vocabularyKeys } from '@/features/vocabulary/api/keys'
import * as api from './adminApi'

// Cache keys of the admin area, nested under ['admin'] so one invalidation can refresh a whole section.
export const adminKeys = {
  all: ['admin'],
  stats: (period) => ['admin', 'stats', period],
  topics: ['admin', 'topics'],
  words: ['admin', 'words'],
  wordPage: (filters) => ['admin', 'words', filters],
  lessons: ['admin', 'lessons'],
  lesson: (id) => ['admin', 'lessons', id],
  tests: ['admin', 'tests'],
  test: (id) => ['admin', 'tests', id],
  users: ['admin', 'users'],
  userPage: (filters) => ['admin', 'users', 'page', filters],
  usersSummary: ['admin', 'users', 'summary'],
  user: (id) => ['admin', 'users', 'detail', id],
}

// Admin numbers change with what other admins and every learner do: ask again each time a page opens.
const FRESH_ON_OPEN = { staleTime: 0 }

export function useStats(period) {
  return useQuery({ queryKey: adminKeys.stats(period), queryFn: () => api.getStats(period), ...FRESH_ON_OPEN })
}

// --- Vocabulary --------------------------------------------------------------------------------------------------------

export function useAdminTopics() {
  return useQuery({ queryKey: adminKeys.topics, queryFn: api.getTopics, ...FRESH_ON_OPEN })
}

export function useAdminWords(filters, { enabled = true } = {}) {
  return useQuery({
    queryKey: adminKeys.wordPage(filters),
    queryFn: () => api.getWords(filters),
    // Keep the current page on screen while the next one (or a new filter) loads, so the table does not jump.
    placeholderData: keepPreviousData,
    enabled,
    ...FRESH_ON_OPEN,
  })
}

/**
 * Topics and words feed the learner screens too (and the admin's own counts), so every change refreshes both caches.
 */
function useVocabularyMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.topics }),
        queryClient.invalidateQueries({ queryKey: adminKeys.words }),
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
      ]),
  })
}

export function useSaveTopic() {
  return useVocabularyMutation(({ id, ...topic }) => (id ? api.updateTopic(id, topic) : api.createTopic(topic)))
}

export function useDeleteTopic() {
  return useVocabularyMutation(api.deleteTopic)
}

export function useSaveWord() {
  return useVocabularyMutation(({ id, ...word }) => (id ? api.updateWord(id, word) : api.createWord(word)))
}

export function useDeleteWord() {
  return useVocabularyMutation(api.deleteWord)
}

export function useUploadMedia() {
  return useMutation({ mutationFn: ({ file, kind }) => api.uploadMedia(file, kind) })
}

// --- Lessons -----------------------------------------------------------------------------------------------------------

export function useAdminLessons() {
  return useQuery({ queryKey: adminKeys.lessons, queryFn: api.getLessons, ...FRESH_ON_OPEN })
}

export function useAdminLesson(id) {
  return useQuery({ queryKey: adminKeys.lesson(id), queryFn: () => api.getLesson(id), enabled: id !== null, ...FRESH_ON_OPEN })
}

export function useSaveLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...lesson }) => (id ? api.updateLesson(id, lesson) : api.createLesson(lesson)),
    onSuccess: (lesson) => {
      queryClient.setQueryData(adminKeys.lesson(lesson.id), lesson)
      return queryClient.invalidateQueries({ queryKey: adminKeys.lessons, exact: true })
    },
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteLesson,
    // Only the list: the editor still shows the deleted lesson until it navigates away, and refetching it would 404.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.lessons, exact: true }),
  })
}

// --- Tests -------------------------------------------------------------------------------------------------------------

export function useAdminTests() {
  return useQuery({ queryKey: adminKeys.tests, queryFn: api.getTests, ...FRESH_ON_OPEN })
}

export function useAdminTest(id) {
  return useQuery({ queryKey: adminKeys.test(id), queryFn: () => api.getTest(id), enabled: id !== null, ...FRESH_ON_OPEN })
}

function useTestMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (test) => {
      queryClient.setQueryData(adminKeys.test(test.id), test)
      return queryClient.invalidateQueries({ queryKey: adminKeys.tests, exact: true })
    },
  })
}

export function useSaveTest() {
  return useTestMutation(({ id, ...test }) => (id ? api.updateTest(id, test) : api.createTest(test)))
}

export function useDuplicateTest() {
  return useTestMutation(({ id, ...copy }) => api.duplicateTest(id, copy))
}

// --- Users -------------------------------------------------------------------------------------------------------------

export function useAdminUsers(filters) {
  return useQuery({
    queryKey: adminKeys.userPage(filters),
    queryFn: () => api.getUsers(filters),
    placeholderData: keepPreviousData,
    ...FRESH_ON_OPEN,
  })
}

export function useUsersSummary() {
  return useQuery({ queryKey: adminKeys.usersSummary, queryFn: api.getUsersSummary, ...FRESH_ON_OPEN })
}

export function useAdminUser(id) {
  return useQuery({ queryKey: adminKeys.user(id), queryFn: () => api.getUser(id), ...FRESH_ON_OPEN })
}

export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => api.setUserStatus(id, status),
    onSuccess: (user) => {
      queryClient.setQueryData(adminKeys.user(user.id), user)
      // Lists, counters and the overview's "locked accounts" line change too.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'page'] }),
        queryClient.invalidateQueries({ queryKey: adminKeys.usersSummary }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
      ])
    },
  })
}
