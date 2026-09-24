import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { SearchField } from '@/components/ui/SearchField'
import { cx } from '@/lib/cx'
import { matchesSearch } from '@/lib/searchText'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useTopics, useWordSearch, WORD_SEARCH_MIN_LENGTH } from '../api/queries'
import { TopicCard, TopicCardSkeleton, TopicGrid } from '../components/TopicCard'
import { WordList, WordListSkeleton } from '../components/WordList'
import { formatCount, summarizeTopics } from '../topicProgress'

const SEARCH_DELAY_MS = 300

function NoResults({ children }) {
  return <p className="py-5 text-center text-label text-muted-light">{children}</p>
}

/** Words matching the search, fetched from the server (topics are filtered in the browser, words cannot be). */
function WordSearchResults({ term, topics, backTo }) {
  const search = useWordSearch(term)
  const topicNames = useMemo(() => new Map(topics.map((topic) => [topic.id, topic.name])), [topics])

  let content
  if (term.length < WORD_SEARCH_MIN_LENGTH) {
    content = <NoResults>Gõ ít nhất {WORD_SEARCH_MIN_LENGTH} ký tự để tìm từ.</NoResults>
  } else if (search.isPending) {
    content = <WordListSkeleton rows={3} />
  } else if (search.isError) {
    content = (
      <LoadError error={search.error} onRetry={() => search.refetch()} message="Không tìm được từ. Vui lòng thử lại." />
    )
  } else if (search.data.items.length === 0) {
    content = <NoResults>Không tìm thấy từ phù hợp.</NoResults>
  } else {
    const { items, totalItems } = search.data
    content = (
      <div className="flex flex-col gap-2">
        <WordList
          words={items}
          describe={(word) => topicNames.get(word.topicId)}
          linkTo={(word) => (word.topicId == null ? undefined : `/vocabulary/topics/${word.topicId}`)}
          linkState={{ backTo }}
        />
        {totalItems > items.length && (
          <p className="text-xs text-muted">
            Hiển thị {items.length} / {formatCount(totalItems)} từ. Hãy gõ cụ thể hơn để thu hẹp kết quả.
          </p>
        )}
      </div>
    )
  }

  return (
    <section aria-labelledby="word-results" aria-busy={search.isFetching} className="flex flex-col gap-3">
      <h2 id="word-results" className="text-base font-semibold text-ink">
        Từ vựng phù hợp
      </h2>
      {/* Previous results stay visible, dimmed, while the new search runs. */}
      <div className={cx('transition-opacity', search.isPlaceholderData && 'opacity-60')}>{content}</div>
    </section>
  )
}

export function TopicsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTerm = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlTerm)
  const term = query.trim()
  const debouncedTerm = useDebouncedValue(term, SEARCH_DELAY_MS)

  // The search lives in the URL (?q=), so going back from a topic brings it back. `replace` keeps typing from
  // filling the browser history.
  useEffect(() => {
    if (debouncedTerm === urlTerm) return
    setSearchParams(debouncedTerm ? { q: debouncedTerm } : {}, { replace: true })
  }, [debouncedTerm, urlTerm, setSearchParams])

  const topicsQuery = useTopics()
  const topics = topicsQuery.data
  const backTo = term ? `/vocabulary?q=${encodeURIComponent(term)}` : '/vocabulary'

  let summary = null
  if (topics?.length) {
    const { wordCount, learnedCount } = summarizeTopics(topics)
    summary = `Đã học ${formatCount(learnedCount)} / ${formatCount(wordCount)} từ · ${topics.length} chủ đề`
  }

  let body
  if (topicsQuery.isPending) {
    body = (
      <TopicGrid>
        {Array.from({ length: 6 }, (_, index) => (
          <TopicCardSkeleton key={index} />
        ))}
      </TopicGrid>
    )
  } else if (topicsQuery.isError) {
    body = (
      <LoadError
        error={topicsQuery.error}
        onRetry={() => topicsQuery.refetch()}
        message="Không tải được danh sách chủ đề. Vui lòng thử lại."
      />
    )
  } else if (topics.length === 0) {
    body = (
      <Card>
        <p className="text-sm text-muted">Chưa có chủ đề nào. Quản trị viên sẽ sớm bổ sung.</p>
      </Card>
    )
  } else {
    const visibleTopics = term ? topics.filter((topic) => matchesSearch(topic.name, term)) : topics
    body = (
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
            </TopicGrid>
          ) : (
            <NoResults>Không tìm thấy chủ đề phù hợp.</NoResults>
          )}
        </section>
        {term && <WordSearchResults term={debouncedTerm} topics={topics} backTo={backTo} />}
      </>
    )
  }

  return (
    <Page
      title="Từ vựng"
      heading={
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-title font-bold text-ink">Từ vựng</h1>
            {summary && <p className="text-label text-muted">{summary}</p>}
          </div>
          <SearchField
            label="Tìm chủ đề hoặc từ"
            placeholder="Tìm chủ đề hoặc từ…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            className="w-full sm:max-w-72.5"
          />
        </div>
      }
    >
      {body}
    </Page>
  )
}
