import { useSearchParams } from 'react-router'
import { HistoryTab } from './HistoryTab'
import { TopicsTab } from './TopicsTab'

/**
 * /vocabulary. The tab comes from ?tab=; each tab is its own component, so switching tabs starts it afresh (the topic
 * search does not leak into another tab).
 */
export function VocabularyPage() {
  const [searchParams] = useSearchParams()
  return searchParams.get('tab') === 'history' ? <HistoryTab /> : <TopicsTab />
}
