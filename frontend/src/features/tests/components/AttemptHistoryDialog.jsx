import { Link } from 'react-router'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatMoment, todayInVietnam } from '@/lib/dates'
import { useTestAttempts } from '../api/testsQueries'
import { ATTEMPT_STATUS } from '../constants'

/** "21:26, 06/10/2026": the year is shown too, a history can go back a long way. */
function submittedLabel(submittedAt) {
  if (!submittedAt) return ''
  const time = formatMoment(submittedAt, '').split(',')[0]
  return `${time}, ${formatDate(todayInVietnam(new Date(submittedAt)))}`
}

function AttemptList({ testId }) {
  const attempts = useTestAttempts(testId)

  if (attempts.isPending) return <Skeleton className="h-24 w-full rounded-lg" />
  if (attempts.isError) {
    return <LoadError error={attempts.error} onRetry={() => attempts.refetch()} message="Không tải được lịch sử làm bài." />
  }
  if (attempts.data.length === 0) return <p className="text-body text-ink-soft">Bạn chưa nộp bài này lần nào.</p>

  // The server lists the newest first; the oldest attempt is "Lần 1".
  return (
    <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
      {attempts.data.map((attempt, index) => {
        const graded = attempt.status === ATTEMPT_STATUS.GRADED
        return (
          <li key={attempt.attemptId}>
            <Link
              to={`/tests/${testId}/result/${attempt.attemptId}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-ink hover:border-brand-tint-line hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="flex flex-col">
                <span className="text-label font-semibold">Lần {attempts.data.length - index}</span>
                <span className="text-xs text-muted">{submittedLabel(attempt.submittedAt)}</span>
              </span>
              <span className="text-label font-semibold">
                {graded ? `${attempt.scorePercent}/100 · ${attempt.suggestedLevel}` : 'Đang chấm'}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The learner's submitted attempts at a test, each leading to its result page. The list is only fetched while the
 * dialog is open.
 *
 * @param {object} props
 * @param {{ id: number, title: string }} props.test
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export function AttemptHistoryDialog({ test, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Lịch sử làm bài">
      <p className="text-label text-muted">{test.title}</p>
      <AttemptList testId={test.id} />
    </Dialog>
  )
}
