import { ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDayMonth, todayInVietnam } from '@/lib/dates'
import { useSkills } from '@/features/progress/api/progressQueries'
import { Radar } from '@/features/progress/components/SkillRadar'
import { SKILL_AXES } from '@/features/progress/constants'
import { scoreChange } from '../plan'

/** The design's level ring with the overall score beside it. */
function Headline({ result }) {
  const change = scoreChange(result.overallScore, result.previousOverallScore)
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-18 flex-none items-center justify-center rounded-full border-4 border-brand bg-brand-tint">
        <span className="text-xl font-bold text-brand-dark">{result.level}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xl font-bold text-ink">Điểm tổng: {result.overallScore}/100</span>
        <span className="text-label text-muted">
          {change ?? `${result.testTitle} · nộp ngày ${formatDayMonth(todayInVietnam(new Date(result.takenAt)))}`}
        </span>
      </div>
    </div>
  )
}

/** "Trình độ hiện tại": the latest comprehensive test (D1's skills API) as the design's ring, score and radar. */
export function LevelCard() {
  const skills = useSkills()
  const result = skills.data ?? null // getSkills unwraps `latest`

  let top
  if (skills.isPending) {
    top = <Skeleton className="h-18 w-64" />
  } else if (skills.isError) {
    top = <LoadError error={skills.error} onRetry={() => skills.refetch()} message="Không tải được kết quả kiểm tra." />
  } else if (!result) {
    top = (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body text-ink-soft">
          Bạn chưa làm bài kiểm tra tổng hợp. Làm bài để biết trình độ CEFR và điểm từng kỹ năng, kế hoạch sẽ bám theo
          điểm yếu của bạn.
        </p>
        <ButtonLink to="/tests" size="sm">
          Làm bài kiểm tra tổng hợp
        </ButtonLink>
      </div>
    )
  } else if (result.status === 'SUBMITTED') {
    const pending = SKILL_AXES.filter(({ key }) => result.skills[key].score === null).map(({ label }) => label)
    top = (
      <div className="flex flex-col items-start gap-1.5">
        <span className="rounded-md bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">
          Đang chấm phần {pending.join(', ')}
        </span>
        <p className="text-label text-ink-soft">Điểm tổng và trình độ hiện khi AI chấm xong phần {pending.join(', ')}.</p>
      </div>
    )
  } else {
    top = <Headline result={result} />
  }

  return (
    <section aria-labelledby="level-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 id="level-title" className="text-lg font-semibold text-ink">
        Trình độ hiện tại
      </h2>
      {top}
      {!skills.isError && !skills.isPending && <Radar result={result} />}
    </section>
  )
}
