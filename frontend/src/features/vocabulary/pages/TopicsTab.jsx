import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { SearchField } from '@/components/ui/SearchField'
import { paths } from '@/config/paths'
import { matchesSearch } from '@/lib/searchText'
import { useTopics } from '../api/vocabularyQueries'
import { CreateListDialog } from '../components/lists/CreateListDialog'
import { NoResults } from '../components/topics/NoResults'
import { CreateListCard, TopicCard, TopicCardSkeleton, TopicGrid } from '../components/topics/TopicCard'
import { WordSearchResults } from '../components/topics/WordSearchResults'
import { VocabularyShell } from '../components/VocabularyShell'
import { useTopicSearch } from '../hooks/useTopicSearch'

/** The topic grid, or while searching the matching topics and words. */
function TopicsContent({ term, debouncedTerm, onCreateList }) {
  const topicsQuery = useTopics()

  if (topicsQuery.isPending) {
    return (
      <TopicGrid>
        {Array.from({ length: 6 }, (_, index) => (
          <TopicCardSkeleton key={index} />
        ))}
      </TopicGrid>
    )
  }
  if (topicsQuery.isError) {
    return (
      <LoadError
        error={topicsQuery.error}
        onRetry={() => topicsQuery.refetch()}
        message="Không tải được danh sách chủ đề. Vui lòng thử lại."
      />
    )
  }

  const topics = topicsQuery.data
  if (topics.length === 0) return <EmptyState>Chưa có chủ đề nào. Quản trị viên sẽ sớm bổ sung.</EmptyState>

  const backTo = paths.vocabularySearch(term)
  const visibleTopics = term ? topics.filter((topic) => matchesSearch(topic.name, term)) : topics

  return (
    <>
      <section aria-labelledby={term ? 'topic-results' : undefined} className="flex flex-col gap-3">
        {term && (
          <h2 id="topic-results" className="text-base font-semibold text-ink">
            Chủ đề
          </h2>
        )}
        {visibleTopics.length > 0 ? (
          <TopicGrid>
            {visibleTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} backTo={backTo} />
            ))}
            {!term && <CreateListCard onClick={onCreateList} />}
          </TopicGrid>
        ) : (
          <NoResults>Không tìm thấy chủ đề phù hợp.</NoResults>
        )}
      </section>
      {term && <WordSearchResults term={debouncedTerm} topics={topics} backTo={backTo} />}
    </>
  )
}

/** "Chủ đề có sẵn" tab of /vocabulary: the topic grid, with topic and word search. */
export function TopicsTab() {
  const { query, setQuery, term, debouncedTerm } = useTopicSearch()
  const [creatingList, setCreatingList] = useState(false)

  return (
    <VocabularyShell
      tab="topics"
      title="Từ vựng"
      showReminder
      headerAside={
        <SearchField
          label="Tìm chủ đề hoặc từ"
          placeholder="Tìm chủ đề hoặc từ…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          className="w-full sm:max-w-72.5"
        />
      }
    >
      <TopicsContent term={term} debouncedTerm={debouncedTerm} onCreateList={() => setCreatingList(true)} />
      <CreateListDialog open={creatingList} onClose={() => setCreatingList(false)} />
    </VocabularyShell>
  )
}
