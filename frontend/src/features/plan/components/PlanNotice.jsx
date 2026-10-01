import { Link } from 'react-router'
import { useStudyPlan } from '../api/planQueries'
import { currentWeekOf, lastMissedWeek } from '../plan'

/**
 * Scenario 18, step 1: the home page reminds the learner of this week's targets and, gently, of a week that fell
 * short. Only for an active plan; hidden while loading and after an error.
 */
export function PlanNotice() {
  const studyPlan = useStudyPlan()
  const plan = studyPlan.data?.plan
  if (!plan || plan.status !== 'ACTIVE') return null
  const week = currentWeekOf(plan)
  const missed = lastMissedWeek(plan)
  if (!week && !missed) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-tint-line bg-brand-tint px-5 py-3.5">
      <div className="flex flex-col gap-0.5">
        {week && (
          <p className="text-sm font-semibold text-brand-dark">
            Tuần {week.weekNumber}: mục tiêu {week.targetWords} từ mới, {week.targetExercises} bài tập
          </p>
        )}
        {missed && (
          <p className="text-sm text-warning">
            Tuần {missed.weekNumber} chưa đạt mục tiêu ({missed.wordsDone}/{missed.targetWords} từ)
          </p>
        )}
      </div>
      <Link
        to="/plan"
        className="rounded-lg bg-brand px-4 py-2 text-label font-semibold text-white hover:bg-brand-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Xem kế hoạch →
      </Link>
    </div>
  )
}
