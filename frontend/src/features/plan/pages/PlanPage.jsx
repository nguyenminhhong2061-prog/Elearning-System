import { useState } from 'react'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useCreatePlan, usePreviewPlan, useStudyPlan } from '../api/planQueries'
import { GoalForm } from '../components/GoalForm'
import { LevelCard } from '../components/LevelCard'
import { PlanOverview } from '../components/PlanOverview'
import { PlanPreview } from '../components/PlanPreview'
import { ReminderCard } from '../components/ReminderCard'
import { Suggestions } from '../components/Suggestions'

/**
 * The plan column. D2: without a plan the system asks for a goal; the AI's weekly plan is previewed, then applied;
 * later the learner comes back to follow it or set a new goal.
 */
function PlanColumn() {
  const { user } = useAuth()
  const studyPlan = useStudyPlan()
  const preview = usePreviewPlan()
  const create = useCreatePlan()
  const [editing, setEditing] = useState(false)
  const [applied, setApplied] = useState(false)

  if (studyPlan.isPending) return <Skeleton className="h-96 w-full rounded-xl" />
  if (studyPlan.isError) {
    return <LoadError error={studyPlan.error} onRetry={() => studyPlan.refetch()} message="Không tải được kế hoạch học." />
  }

  const { plan, goalOptions } = studyPlan.data
  const currentLevel = user.currentLevel ?? null
  const showForm = !plan || editing

  function startEditing() {
    setApplied(false)
    setEditing(true)
  }

  function stopEditing() {
    preview.reset()
    create.reset()
    setEditing(false)
  }

  function apply() {
    create.mutate(preview.data, {
      onSuccess: () => {
        preview.reset()
        setEditing(false)
        setApplied(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {applied && <Alert variant="success">Đã áp dụng kế hoạch mới. Chúc bạn học tốt!</Alert>}
      {plan && !editing && <PlanOverview plan={plan} currentLevel={currentLevel} onAdjust={startEditing} />}
      {showForm && (
        <GoalForm
          goalOptions={goalOptions}
          currentLevel={currentLevel}
          replacing={Boolean(plan)}
          onPreview={(goal) => {
            create.reset()
            preview.mutate(goal)
          }}
          previewing={preview.isPending}
          error={preview.error}
          onCancel={plan ? stopEditing : undefined}
        />
      )}
      {showForm && preview.data && !preview.isPending && (
        <PlanPreview
          draft={preview.data}
          currentLevel={currentLevel}
          replacing={Boolean(plan)}
          onApply={apply}
          applying={create.isPending}
          error={create.error}
        />
      )}
    </div>
  )
}

/** /plan: "Kế hoạch học cá nhân" (module D, D2). Each block loads and fails on its own. */
export function PlanPage() {
  return (
    <Page title="Kế hoạch học cá nhân">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <LevelCard />
          <Suggestions />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <PlanColumn />
          <ReminderCard />
        </div>
      </div>
    </Page>
  )
}
