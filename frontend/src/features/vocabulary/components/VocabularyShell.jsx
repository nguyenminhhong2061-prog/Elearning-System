import { Page } from '@/components/layout/Page'
import { TabLinks } from '@/components/ui/TabLinks'
import { useCustomLists } from '../api/listsQueries'
import { useTopics } from '../api/queries'
import { formatCount, summarizeTopics } from '../topicProgress'
import { DueReviewBanner } from './DueReview'

function useVocabularyTabs() {
  const { data: lists } = useCustomLists()
  return [
    { id: 'topics', label: 'Chủ đề có sẵn', to: '/vocabulary' },
    { id: 'lists', label: lists ? `Danh sách của tôi (${lists.length})` : 'Danh sách của tôi', to: '/vocabulary?tab=lists' },
    { id: 'history', label: 'Lịch sử học', to: '/vocabulary?tab=history' },
  ]
}

/** "Đã học 35 / 74 từ · 6 chủ đề" from the topics (the design's line under the title), or null while unknown. */
function useVocabularySummary() {
  const { data: topics } = useTopics()
  if (!topics?.length) return null
  const { wordCount, learnedCount } = summarizeTopics(topics)
  return `Đã học ${formatCount(learnedCount)} / ${formatCount(wordCount)} từ · ${topics.length} chủ đề`
}

/**
 * Frame shared by the tabs of the vocabulary page: title and summary, an optional control on the right of the title
 * (the search box on the topics tab), the review reminder, and the tab bar.
 *
 * @param {object} props
 * @param {string} props.tab id of the current tab
 * @param {string} props.title browser tab title
 * @param {import('react').ReactNode} [props.headerAside]
 * @param {boolean} [props.showReminder] show the "N từ cần ôn hôm nay" banner
 */
export function VocabularyShell({ tab, title, headerAside, showReminder = false, children }) {
  const summary = useVocabularySummary()
  const tabs = useVocabularyTabs()

  return (
    <Page
      title={title}
      heading={
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-title font-bold text-ink">Từ vựng</h1>
            {summary && <p className="text-label text-muted">{summary}</p>}
          </div>
          {headerAside}
        </div>
      }
    >
      {showReminder && <DueReviewBanner />}
      <TabLinks label="Mục từ vựng" tabs={tabs} current={tab} />
      {children}
    </Page>
  )
}
