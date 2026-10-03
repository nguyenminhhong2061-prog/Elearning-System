import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { nextPageParam } from '@/api/pagination'
import { TOPIC_WORDS_PAGE_SIZE, WORD_SEARCH_LIMIT, WORD_SEARCH_MIN_LENGTH } from '../constants'
import { vocabularyKeys } from './keys'
import { getTopic, getTopics, getVocabularyPage } from './vocabularyApi'

// Hooks that read topics and words. Pages and components call these, never vocabularyApi.js directly.

export function useTopics() {
  return useQuery({ queryKey: vocabularyKeys.topics(), queryFn: getTopics })
}

/** @param {number | null} id null when the id in the URL is not valid: nothing is fetched */
export function useTopic(id) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: vocabularyKeys.topic(id),
    queryFn: () => getTopic(id),
    enabled: id !== null,
    // Coming from the topics page, show the card's data immediately while the topic itself loads.
    placeholderData: () => queryClient.getQueryData(vocabularyKeys.topics())?.find((topic) => topic.id === id),
  })
}

/** Words of a topic, one page at a time ("Xem thêm từ" loads the next one). */
export function useTopicWords(topicId) {
  return useInfiniteQuery({
    queryKey: vocabularyKeys.topicWords(topicId),
    queryFn: ({ pageParam }) => getVocabularyPage({ topicId, page: pageParam, size: TOPIC_WORDS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: topicId !== null,
  })
}

/**
 * Words whose text or meaning contains `term`. Nothing is fetched below WORD_SEARCH_MIN_LENGTH characters. While the
 * next term loads, the previous results stay on screen (isPlaceholderData is true) instead of flashing empty.
 */
export function useWordSearch(term) {
  return useQuery({
    queryKey: vocabularyKeys.search(term),
    queryFn: () => getVocabularyPage({ q: term, size: WORD_SEARCH_LIMIT }),
    enabled: term.length >= WORD_SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
  })
}
