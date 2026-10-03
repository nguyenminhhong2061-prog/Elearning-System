import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Page } from '@/components/layout/Page'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx } from '@/lib/cx'
import { describeDeadline } from '../answers'
import { useTests } from '../api/testsQueries'
import { TEST_TYPES, TEST_TYPE_LABELS } from '../constants'

/** The learner's standing on a test, under its title. */
function progressLine(test) {
  const { progress } = test
  if (progress.inProgress) {
    return `Đang làm dở · đã trả lời ${progress.inProgress.answeredCount}/${test.questionCount} câu`
  }
  if (progress.attemptCount === 0) return 'Chưa làm lần nào'
  const best = progress.bestScorePercent === null ? '' : ` · cao nhất ${progress.bestScorePercent}/100`
  return `Đã làm ${progress.attemptCount} lần${best}`
}

function actionLabel(test) {
  if (test.progress.inProgress) return 'Làm tiếp'
  if (test.progress.attemptCount > 0) return 'Làm lại'
  return 'Bắt đầu'
}

// The design's test cards: dark for a periodic test, the teal gradient for the comprehensive one.
const CARD = {
  [TEST_TYPES.PERIODIC]: {
    card: 'bg-sidebar',
    detail: 'text-muted-light',
    action: 'bg-brand hover:bg-brand-dark',
  },
  [TEST_TYPES.COMPREHENSIVE]: {
    card: 'bg-[linear-gradient(155deg,var(--color-brand-dark),var(--color-brand))]',
    detail: 'text-white/85',
    action: 'bg-white/18 hover:bg-white/28',
  },
}

function TestCard({ test }) {
  const style = CARD[test.type] ?? CARD[TEST_TYPES.PERIODIC]
  const details = [`${test.questionCount} câu`, describeDeadline(test.endDate), progressLine(test)].filter(Boolean)
  return (
    <article className={cx('flex h-full flex-col justify-between gap-4 rounded-xl p-5 text-white', style.card)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-[17px] leading-6 font-semibold">{test.title}</h3>
        <p className={cx('text-label', style.detail)}>{details.join(' · ')}</p>
      </div>
      <Link
        to={`/tests/${test.id}`}
        aria-label={`${actionLabel(test)}: ${test.title}`}
        className={cx(
          'self-start rounded-lg px-5 py-2.75 text-label font-semibold text-white transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          style.action,
        )}
      >
        {actionLabel(test)}
      </Link>
    </article>
  )
}

function TestGroup({ type, description, tests }) {
  const headingId = `tests-${type.toLowerCase()}`
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div>
        <h2 id={headingId} className="text-lg font-semibold text-ink">
          {TEST_TYPE_LABELS[type]}
        </h2>
        <p className="text-label text-muted">{description}</p>
      </div>
      {tests.length === 0 ? (
        // Scenario 14 branch 4a, scenario 15 branch 2a: the block stays and says so.
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
          Hiện chưa có bài {TEST_TYPE_LABELS[type].toLowerCase()} nào đang mở
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-3">
          {tests.map((test) => (
            <li key={test.id}>
              <TestCard test={test} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function LoadingList() {
  return (
    <div aria-busy="true" aria-label="Đang tải danh sách bài kiểm tra" className="flex flex-col gap-3">
      {[0, 1].map((key) => (
        <Skeleton key={key} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

/** /tests: the open periodic and comprehensive tests, with the learner's progress on each. */
export function TestsPage() {
  const tests = useTests()

  return (
    <Page
      title="Kiểm tra"
      heading={
        <div>
          <h1 className="text-title font-bold text-ink">Kiểm tra</h1>
          <p className="text-label text-muted">
            Kiểm tra định kỳ đo tiến bộ, kiểm tra tổng hợp xác định trình độ CEFR của bạn.
          </p>
        </div>
      }
    >
      {tests.isPending && <LoadingList />}
      {tests.isError && (
        <LoadError error={tests.error} onRetry={() => tests.refetch()} message="Không tải được danh sách bài kiểm tra." />
      )}
      {tests.isSuccess && tests.data.length === 0 && (
        <Card className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold text-ink">Chưa có bài kiểm tra</h2>
          <p className="text-sm text-muted">Hiện chưa có bài kiểm tra nào đang mở. Hãy quay lại sau nhé.</p>
        </Card>
      )}
      {tests.isSuccess && tests.data.length > 0 && (
        <div className="flex flex-col gap-7">
          <TestGroup
            type={TEST_TYPES.PERIODIC}
            description="Bài ngắn theo tuần, chấm điểm ngay khi nộp."
            tests={tests.data.filter((test) => test.type === TEST_TYPES.PERIODIC)}
          />
          <TestGroup
            type={TEST_TYPES.COMPREHENSIVE}
            description="Đủ bốn kỹ năng Nghe, Nói, Đọc, Viết; kết quả xác định trình độ CEFR của bạn."
            tests={tests.data.filter((test) => test.type === TEST_TYPES.COMPREHENSIVE)}
          />
        </div>
      )}
    </Page>
  )
}
