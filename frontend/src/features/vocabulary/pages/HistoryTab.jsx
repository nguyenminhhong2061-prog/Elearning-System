import { useSearchParams } from 'react-router'
import { useLearningSummary } from '../api/learningQueries'
import { HistoryStats } from '../components/history/HistoryStats'
import { ReviewedWords } from '../components/history/ReviewedWords'
import { UpcomingReviews } from '../components/history/UpcomingReviews'
import { VocabularyShell } from '../components/VocabularyShell'
import { HISTORY_FILTERS } from '../constants'

/** Id of the statistic named by ?show=, or null when there is none or it is unknown. */
function useChosenFilter() {
  const [searchParams] = useSearchParams()
  const show = searchParams.get('show')
  return show !== null && Object.hasOwn(HISTORY_FILTERS, show) ? show : null
}

/**
 * "Lịch sử học" tab of /vocabulary (A2): what is due, the words behind each count (chosen by clicking it), and the
 * next 7 days. The word list sits right under the counts so that choosing one shows its words without scrolling.
 */
export function HistoryTab() {
  const summary = useLearningSummary()
  const chosen = useChosenFilter()

  return (
    <VocabularyShell tab="history" title="Lịch sử học">
      <HistoryStats summary={summary} chosen={chosen} />
      <div className="flex flex-wrap items-start gap-5">
        <ReviewedWords filterId={chosen} className="min-w-0 flex-[2_1_432px]" />
        {summary.data && <UpcomingReviews days={summary.data.upcoming} className="flex-[1_1_260px]" />}
      </div>
    </VocabularyShell>
  )
}
