import { useSearchParams } from 'react-router'
import { HistoryTab } from './HistoryTab'
import { ListsTab } from './ListsTab'
import { TopicsTab } from './TopicsTab'

/**
 * /vocabulary. The tab comes from ?tab=; each tab is its own component, so switching tabs starts it afresh (the topic
 * search does not leak into another tab).
 */
export function VocabularyPage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  if (tab === 'history') return <HistoryTab />
  if (tab === 'lists') return <ListsTab />
  return <TopicsTab />
}
