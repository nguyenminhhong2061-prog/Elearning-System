import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { loadedItems, totalItems } from '@/api/pagination'
import { formatCount } from '@/lib/format'
import { useTopicWords } from '../../api/vocabularyQueries'
import { LoadMoreButton } from '../LoadMoreButton'
import { WordList, WordListSkeleton } from '../WordList'

/**
 * The words of a topic, 20 at a time ("Xem thêm từ"), easiest first.
 * @param {{ topicId: number }} props
 */
export function TopicWords({ topicId }) {
  const query = useTopicWords(topicId)

  if (query.isPending) return <WordListSkeleton />
  if (query.isError) {
    return (
      <LoadError error={query.error} onRetry={() => query.refetch()} message="Không tải được danh sách từ. Vui lòng thử lại." />
    )
  }

  const words = loadedItems(query.data)
  const total = totalItems(query.data)
  if (total === 0) return <EmptyState>Chủ đề này chưa có từ nào.</EmptyState>

  return (
    <>
      <WordList words={words} />
      <LoadMoreButton query={query} label={`Xem thêm từ (còn ${formatCount(total - words.length)})`} />
    </>
  )
}
