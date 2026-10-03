import { useMemo } from 'react'
import { LoadError } from '@/components/ui/LoadError'
import { paths } from '@/config/paths'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { useWordSearch } from '../../api/vocabularyQueries'
import { WORD_SEARCH_MIN_LENGTH } from '../../constants'
import { WordList, WordListSkeleton } from '../WordList'
import { NoResults } from './NoResults'

/** The search results themselves, in the usual order: too short, loading, error, nothing found, words. */
function Results({ term, search, topicNames, backTo }) {
  if (term.length < WORD_SEARCH_MIN_LENGTH) return <NoResults>Gõ ít nhất {WORD_SEARCH_MIN_LENGTH} ký tự để tìm từ.</NoResults>
  if (search.isPending) return <WordListSkeleton rows={3} />
  if (search.isError) {
    return <LoadError error={search.error} onRetry={() => search.refetch()} message="Không tìm được từ. Vui lòng thử lại." />
  }

  const { items, totalItems } = search.data
  if (items.length === 0) return <NoResults>Không tìm thấy từ phù hợp.</NoResults>

  return (
    <div className="flex flex-col gap-2">
      <WordList
        words={items}
        describe={(word) => topicNames.get(word.topicId)}
        linkTo={(word) => (word.topicId == null ? undefined : paths.topic(word.topicId))}
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

/**
 * "Từ vựng phù hợp" under the topics while searching: words whose text or meaning matches, fetched from the server
 * (topics are filtered in the browser, words cannot be).
 *
 * @param {object} props
 * @param {string} props.term the search, already debounced
 * @param {import('../../types').Topic[]} props.topics to show each word's topic
 * @param {string} props.backTo where the topic page's back link should return
 */
export function WordSearchResults({ term, topics, backTo }) {
  const search = useWordSearch(term)
  const topicNames = useMemo(() => new Map(topics.map((topic) => [topic.id, topic.name])), [topics])

  return (
    <section aria-labelledby="word-results" aria-busy={search.isFetching} className="flex flex-col gap-3">
      <h2 id="word-results" className="text-base font-semibold text-ink">
        Từ vựng phù hợp
      </h2>
      {/* Previous results stay visible, dimmed, while the new search runs. */}
      <div className={cx('transition-opacity', search.isPlaceholderData && 'opacity-60')}>
        <Results term={term} search={search} topicNames={topicNames} backTo={backTo} />
      </div>
    </section>
  )
}
