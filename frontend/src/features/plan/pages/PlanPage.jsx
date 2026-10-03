import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { useChangePlanStatus, useCreatePlan, usePreviewPlan, useStudyPlan, useUpdateSchedule } from '../api/planQueries'
import { AdjustPlan } from '../components/AdjustPlan'
import { GoalForm } from '../components/GoalForm'
import { LevelCard } from '../components/LevelCard'
import { PlanOverview } from '../components/PlanOverview'
import { PlanPreview } from '../components/PlanPreview'
import { Suggestions } from '../components/Suggestions'
import { emptyDraft } from '../plan'

// Scenario 18, branches 5a and 5b: pausing and ending a plan are confirmed first.
const STATUS_QUESTIONS = {
  PAUSED: {
    title: 'Tạm dừng kế hoạch?',
    text: 'Các nhắc nhở chưa gửi sẽ ngừng. Bạn có thể tiếp tục kế hoạch bất cứ lúc nào, các tuần vẫn giữ nguyên ngày.',
    confirm: 'Tạm dừng',
  },
  COMPLETED: {
    title: 'Kết thúc kế hoạch?',
    text: 'Kế hoạch sẽ chuyển sang đã kết thúc và các nhắc nhở chưa gửi bị hủy. Kết quả đã học vẫn được giữ. Sau đó bạn có thể lập kế hoạch mới.',
    confirm: 'Kết thúc kế hoạch',
  },
}

const NOTICES = {
  applied: 'Đã áp dụng kế hoạch mới. Chúc bạn học tốt!',
  updated: 'Cập nhật kế hoạch thành công',
  ended: 'Đã kết thúc kế hoạch. Bạn có thể lập kế hoạch mới.',
}

/**
 * The roadmap a comprehensive test hands over (scenario 15 step 18a → scenario 17 branch 2a), read once: the browser
 * keeps history state across reloads, so it is cleared from the entry right away.
 */
function useRoadmapFromTest() {
  const location = useLocation()
  const navigate = useNavigate()
  const [fromTest] = useState(() => location.state?.fromTest ?? null)
  useEffect(() => {
    if (location.state?.fromTest) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])
  return fromTest
}

/**
 * The plan column (scenarios 17 and 18). Without a plan the system asks for a goal; the AI's weekly plan (or empty
 * weeks the learner fills in) is previewed, then applied; later the learner follows it, adjusts it, pauses or ends it.
 */
function PlanColumn() {
  const { user } = useAuth()
  const fromTest = useRoadmapFromTest()
  const studyPlan = useStudyPlan()
  const preview = usePreviewPlan()
  const create = useCreatePlan()
  const updateSchedule = useUpdateSchedule()
  const changeStatus = useChangePlanStatus()
  const [mode, setMode] = useState('view') // 'view' | 'goal' (a new plan over an active one) | 'adjust'
  const [askReplace, setAskReplace] = useState(Boolean(fromTest)) // branch 2b
  const [roadmap, setRoadmap] = useState(fromTest)
  const [manualDraft, setManualDraft] = useState(null)
  const [draftVersion, setDraftVersion] = useState(0)
  const [statusQuestion, setStatusQuestion] = useState(null) // 'PAUSED' | 'COMPLETED'
  const [notice, setNotice] = useState(null)

  if (studyPlan.isPending) return <Skeleton className="h-96 w-full rounded-xl" />
  if (studyPlan.isError) {
    return <LoadError error={studyPlan.error} onRetry={() => studyPlan.refetch()} message="Không tải được kế hoạch học." />
  }

  const { plan, goalOptions } = studyPlan.data
  const currentLevel = user.currentLevel ?? null
  const showForm = !plan || mode === 'goal'
  const draft = manualDraft ?? preview.data

  function show(nextMode) {
    setNotice(null)
    preview.reset()
    create.reset()
    updateSchedule.reset()
    changeStatus.reset()
    setManualDraft(null)
    setMode(nextMode)
  }

  function done(message) {
    setNotice(message)
    setMode('view')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function askAi(goal) {
    create.reset()
    setManualDraft(null)
    setDraftVersion((version) => version + 1)
    preview.mutate(goal)
  }

  function writeMyself(goal) {
    create.reset()
    preview.reset()
    setManualDraft(emptyDraft(goal, currentLevel))
    setDraftVersion((version) => version + 1)
  }

  function apply(finalDraft) {
    create.mutate(finalDraft, {
      onSuccess: () => {
        preview.reset()
        setManualDraft(null)
        setRoadmap(null)
        done(NOTICES.applied)
      },
    })
  }

  function saveSchedule(change) {
    updateSchedule.mutate(change, { onSuccess: () => done(NOTICES.updated) })
  }

  function changeTo(status) {
    if (status === 'ACTIVE') {
      changeStatus.mutate(status)
      return
    }
    setStatusQuestion(status)
  }

  function confirmStatus() {
    const status = statusQuestion
    changeStatus.mutate(status, {
      onSuccess: () => {
        setStatusQuestion(null)
        if (status === 'COMPLETED') done(NOTICES.ended)
      },
    })
  }

  function closeStatusQuestion() {
    setStatusQuestion(null)
    changeStatus.reset()
  }

  const question = statusQuestion && STATUS_QUESTIONS[statusQuestion]

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {notice && <Alert variant="success">{notice}</Alert>}
      {changeStatus.isError && !statusQuestion && (
        <Alert variant="error">{describeApiError(changeStatus.error, 'Không đổi được trạng thái kế hoạch. Vui lòng thử lại.')}</Alert>
      )}

      {plan && mode === 'view' && (
        <PlanOverview
          plan={plan}
          currentLevel={currentLevel}
          onAdjust={() => show('adjust')}
          onNewPlan={() => show('goal')}
          onStatus={changeTo}
          changingStatus={changeStatus.isPending && !statusQuestion}
        />
      )}
      {plan && mode === 'adjust' && (
        <AdjustPlan
          plan={plan}
          onSave={saveSchedule}
          saving={updateSchedule.isPending}
          error={updateSchedule.error}
          onCancel={() => show('view')}
          onStatus={changeTo}
        />
      )}

      {showForm && (
        <GoalForm
          goalOptions={goalOptions}
          currentLevel={currentLevel}
          replacing={Boolean(plan)}
          fromTest={roadmap}
          onPreview={askAi}
          onManual={writeMyself}
          previewing={preview.isPending}
          error={preview.error}
          onCancel={plan ? () => show('view') : undefined}
        />
      )}
      {showForm && draft && !preview.isPending && (
        <PlanPreview
          key={draftVersion}
          draft={draft}
          manual={Boolean(manualDraft)}
          replacing={Boolean(plan)}
          onApply={apply}
          applying={create.isPending}
          error={create.error}
        />
      )}

      <Dialog open={Boolean(plan) && askReplace && mode === 'view'} onClose={() => setAskReplace(false)} title="Lập kế hoạch mới?">
        <p className="text-body text-ink-soft">Kế hoạch hiện tại sẽ chuyển sang tạm dừng. Tiếp tục?</p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setAskReplace(false)
              setRoadmap(null)
            }}
          >
            Giữ kế hoạch hiện tại
          </Button>
          <Button
            onClick={() => {
              setAskReplace(false)
              show('goal')
            }}
          >
            Tiếp tục
          </Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(question)} onClose={closeStatusQuestion} title={question?.title ?? ''}>
        <p className="text-body text-ink-soft">{question?.text}</p>
        {changeStatus.isError && (
          <Alert variant="error">{describeApiError(changeStatus.error, 'Không đổi được trạng thái kế hoạch. Vui lòng thử lại.')}</Alert>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={closeStatusQuestion} disabled={changeStatus.isPending}>
            Không
          </Button>
          <Button variant={statusQuestion === 'COMPLETED' ? 'danger' : 'primary'} onClick={confirmStatus} loading={changeStatus.isPending}>
            {question?.confirm}
          </Button>
        </div>
      </Dialog>
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
        <PlanColumn />
      </div>
    </Page>
  )
}
