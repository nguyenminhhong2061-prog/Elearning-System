import { describeApiError } from '@/api/errorMessages'
import { loadedItems } from '@/api/pagination'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { useListWords, useRemoveWordFromList } from '../../api/listsQueries'
import { LoadMoreButton } from '../LoadMoreButton'
import { WordList, WordListSkeleton } from '../WordList'

/**
 * The words of a personal list, each with a ✕ that takes it out of the list.
 * @param {{ listId: number }} props
 */
export function ListWords({ listId }) {
  const query = useListWords(listId)
  const removeWord = useRemoveWordFromList(listId)

  if (query.isPending) return <WordListSkeleton rows={4} />
  if (query.isError) {
    return <LoadError error={query.error} onRetry={() => query.refetch()} message="Không tải được các từ của danh sách." />
  }

  const words = loadedItems(query.data)
  if (words.length === 0) {
    return <EmptyState>Danh sách chưa có từ nào. Hãy thêm từ trong khung “Thêm từ vào danh sách”.</EmptyState>
  }

  return (
    <>
      <WordList
        words={words}
        aside={(word) => (
          <button
            type="button"
            aria-label={`Bỏ “${word.word}” khỏi danh sách`}
            title="Bỏ khỏi danh sách"
            disabled={removeWord.isPending}
            onClick={() => removeWord.mutate(word.id)}
            className="flex size-7 flex-none cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          >
            ✕
          </button>
        )}
      />
      {removeWord.isError && (
        <Alert variant="error">{describeApiError(removeWord.error, 'Chưa bỏ được từ. Vui lòng thử lại.')}</Alert>
      )}
      <LoadMoreButton query={query} label="Xem thêm từ" />
    </>
  )
}
