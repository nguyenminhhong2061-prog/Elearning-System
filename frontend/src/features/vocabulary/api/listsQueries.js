import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { learningKeys, listKeys, vocabularyKeys } from './keys'
import {
  addNewWordToList,
  addWordToList,
  createCustomList,
  deleteCustomList,
  getCustomList,
  getCustomLists,
  getListWords,
  removeWordFromList,
  renameCustomList,
} from './listsApi'

export const LIST_WORDS_PAGE_SIZE = 50

export function useCustomLists() {
  return useQuery({ queryKey: listKeys.all, queryFn: getCustomLists })
}

/** @param {number | null} id null when the id in the URL is not valid: nothing is fetched */
export function useCustomList(id) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: listKeys.detail(id),
    queryFn: () => getCustomList(id),
    enabled: id !== null,
    placeholderData: () => queryClient.getQueryData(listKeys.all)?.find((list) => list.id === id),
  })
}

export function useListWords(id) {
  return useInfiniteQuery({
    queryKey: listKeys.words(id),
    queryFn: ({ pageParam }) => getListWords(id, { page: pageParam, size: LIST_WORDS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    enabled: id !== null,
  })
}

/**
 * Lists, their counts and their words change together, and the learner's own new words appear in word searches and
 * study sessions, so every list mutation refreshes all three areas.
 */
function useListMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all })
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.all })
      queryClient.invalidateQueries({ queryKey: learningKeys.all })
    },
  })
}

export const useCreateList = () => useListMutation(createCustomList)
export const useRenameList = (id) => useListMutation((name) => renameCustomList(id, name))
export const useAddWordToList = (id) => useListMutation((vocabularyId) => addWordToList(id, vocabularyId))
export const useAddNewWordToList = (id) => useListMutation((newWord) => addNewWordToList(id, newWord))
export const useRemoveWordFromList = (id) => useListMutation((vocabularyId) => removeWordFromList(id, vocabularyId))

/** Deleting also drops the list's own cache entries, so nothing tries to refetch a list that no longer exists. */
export function useDeleteList(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteCustomList(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: listKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: listKeys.all })
      queryClient.invalidateQueries({ queryKey: learningKeys.all })
    },
  })
}
