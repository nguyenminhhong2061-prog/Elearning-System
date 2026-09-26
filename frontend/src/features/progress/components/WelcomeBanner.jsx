import { ButtonLink } from '@/components/ui/Button'
import { useLearningSummary } from '@/features/vocabulary/api/learningQueries'
import { useProgressSummary } from '../api/progressQueries'
import { TESTS_PATH, VOCABULARY_PATH } from '../constants'

/**
 * Exception of D1: a learner with no data yet gets a welcome and a first step instead of a page of zeros. Shown only
 * once both summaries say nothing has happened.
 */
export function WelcomeBanner() {
  const learning = useLearningSummary()
  const progress = useProgressSummary()
  if (!learning.data || !progress.data) return null

  const learned = learning.data.learningCount + learning.data.masteredCount
  const { exercisesCompleted, testsCompleted, studyMinutes } = progress.data.totals
  if (learned + exercisesCompleted + testsCompleted + studyMinutes > 0 || progress.data.streak.current > 0) return null

  return (
    <section
      aria-labelledby="welcome-title"
      className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-brand-tint-line bg-brand-tint px-5 py-5 sm:px-7"
    >
      <div className="flex max-w-160 flex-col gap-1.5">
        <h2 id="welcome-title" className="text-[19px] leading-6 font-semibold text-brand-dark">
          Chào mừng bạn đến với LinguaStep
        </h2>
        <p className="text-sm text-ink">
          Bạn chưa có dữ liệu học tập. Hãy bắt đầu với 20 từ vựng đầu tiên, hoặc làm bài kiểm tra tổng hợp để biết trình độ và điểm từng kỹ năng.
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <ButtonLink to={VOCABULARY_PATH} size="sm">
          Học 20 từ đầu tiên →
        </ButtonLink>
        <ButtonLink to={TESTS_PATH} size="sm" variant="outline">
          Làm bài kiểm tra tổng hợp
        </ButtonLink>
      </div>
    </section>
  )
}
