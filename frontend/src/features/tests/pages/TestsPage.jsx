import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Page } from '@/components/layout/Page'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { useTests } from '../api/testsQueries'
import { TEST_TYPES, TEST_TYPE_LABELS } from '../constants'

/** The one-line status under a test's title. */
function progressLine(test) {
  const { progress } = test
  if (progress.inProgress) {
    return `Đang làm dở · đã trả lời ${progress.inProgress.answeredCount}/${test.questionCount} câu`
  }
  if (progress.attemptCount === 0) {
    return 'Chưa làm lần nào'
  }
  const best = progress.bestScorePercent === null ? '' : ` · điểm cao nhất ${progress.bestScorePercent}/100`
  return `Đã làm ${progress.attemptCount} lần${best}`
}

function actionLabel(test) {
  if (test.progress.inProgress) return 'Làm tiếp'
  if (test.progress.attemptCount > 0) return 'Làm lại'
  return 'Bắt đầu'
}

function TestCard({ test }) {
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-ink">{test.title}</h3>
          <Tag variant={test.type === TEST_TYPES.COMPREHENSIVE ? 'brand' : 'neutral'}>
            {TEST_TYPE_LABELS[test.type]}
          </Tag>
          {test.progress.inProgress && <Tag variant="warning">Đang làm dở</Tag>}
        </div>
        <p className="text-label text-muted">
          {test.questionCount} câu · {progressLine(test)}
        </p>
      </div>
      <ButtonLink to={`/tests/${test.id}`} className="flex-none self-start sm:self-auto">
        {actionLabel(test)}
      </ButtonLink>
    </Card>
  )
}

function TestGroup({ title, description, tests }) {
  if (tests.length === 0) return null
  return (
    <section aria-labelledby={`group-${title}`} className="flex flex-col gap-3">
      <div>
        <h2 id={`group-${title}`} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <p className="text-label text-muted">{description}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {tests.map((test) => (
          <li key={test.id}>
            <TestCard test={test} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function LoadingList() {
  return (
    <div aria-busy="true" aria-label="Đang tải danh sách bài kiểm tra" className="flex flex-col gap-3">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-24 w-full rounded-xl" />
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
          <p className="text-label text-muted">Kiểm tra định kỳ đo tiến bộ, kiểm tra tổng hợp xác định trình độ CEFR của bạn.</p>
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
            title={TEST_TYPE_LABELS[TEST_TYPES.PERIODIC]}
            description="Bài ngắn theo tuần, chấm điểm ngay khi nộp."
            tests={tests.data.filter((test) => test.type === TEST_TYPES.PERIODIC)}
          />
          <TestGroup
            title={TEST_TYPE_LABELS[TEST_TYPES.COMPREHENSIVE]}
            description="Đủ bốn kỹ năng Nghe, Nói, Đọc, Viết; kết quả xác định trình độ CEFR của bạn."
            tests={tests.data.filter((test) => test.type === TEST_TYPES.COMPREHENSIVE)}
          />
        </div>
      )}
    </Page>
  )
}
