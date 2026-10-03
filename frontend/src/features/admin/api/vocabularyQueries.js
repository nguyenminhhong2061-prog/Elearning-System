import { useCallback } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vocabularyKeys } from '@/features/vocabulary/api/keys'
import { adminKeys, FRESH_ON_OPEN } from './keys'
import { createTopic, createWord, deleteTopic, deleteWord, getTopics, getWords, updateTopic, updateWord, uploadMedia } from './vocabularyApi'

// Hooks of the admin vocabulary pages (scenarios 19–22).

export function useAdminTopics() {
  return useQuery({ queryKey: adminKeys.topics, queryFn: getTopics, ...FRESH_ON_OPEN })
}

export function useAdminWords(filters, { enabled = true } = {}) {
  return useQuery({
    queryKey: adminKeys.wordPage(filters),
    queryFn: () => getWords(filters),
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
  return useVocabularyMutation(({ id, ...topic }) => (id ? updateTopic(id, topic) : createTopic(topic)))
}

export function useDeleteTopic() {
  return useVocabularyMutation(deleteTopic)
}

export function useSaveWord() {
  return useVocabularyMutation(({ id, ...word }) => (id ? updateWord(id, word) : createWord(word)))
}

export function useDeleteWord() {
  return useVocabularyMutation(deleteWord)
}

export function useUploadMedia() {
  return useMutation({ mutationFn: ({ file, kind }) => uploadMedia(file, kind) })
}

/** Reads one page of words on demand (the duplicate check before saving a word), through the query cache. */
export function useWordLookup() {
  const queryClient = useQueryClient()
  return useCallback(
    (filters) => queryClient.fetchQuery({ queryKey: adminKeys.wordPage(filters), queryFn: () => getWords(filters), staleTime: 0 }),
    [queryClient],
  )
}
