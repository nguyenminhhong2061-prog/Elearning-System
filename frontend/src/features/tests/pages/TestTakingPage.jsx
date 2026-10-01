import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { useLogoutGuard } from '@/components/layout/logoutGuard'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'
import { answerPayload, answersFromSaved, firstUnansweredIndex, isChoice, unansweredQuestions } from '../answers'
import { startAttempt } from '../api/testsApi'
import { useSubmitAttempt, useTest } from '../api/testsQueries'
import { QuestionView } from '../components/QuestionView'
import { ATTEMPT_STATUS, SKILL_LABELS, SKILL_ORDER, TEST_TYPE_LABELS, TEST_TYPES } from '../constants'
import { useAnswerSaver } from '../useAnswerSaver'

const SAVE_TEXT = {
  unsaved: 'Đang lưu…',
  saving: 'Đang lưu…',
  saved: 'Đã lưu',
}

/** The small "Đã lưu" note beside the question counter; a failed save offers to try again. */
function SaveStatus({ status, onRetry }) {
  if (status === 'error') {
    return (
      <span className="flex items-center gap-2 text-label text-danger">
        Chưa lưu được câu trả lời.
        <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline">
          Thử lại
        </button>
      </span>
    )
  }
  return (
    <span className="text-label text-muted" aria-hidden={status === 'idle'}>
      {SAVE_TEXT[status] ?? ''}
    </span>
  )
}

function QuestionNav({ questions, answers, currentIndex, onGo }) {
  return (
    <nav aria-label="Chuyển câu hỏi" className="flex flex-wrap gap-2">
      {questions.map((question, index) => {
        const answered = Boolean(answerPayload(question, answers[question.id]))
        const current = index === currentIndex
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onGo(index)}
            aria-current={current ? 'step' : undefined}
            aria-label={`Câu ${index + 1}${answered ? ' (đã trả lời)' : ''}`}
            className={cx(
              'size-9 cursor-pointer rounded-lg border text-label font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              current
                ? 'border-brand bg-brand text-white'
                : answered
                  ? 'border-success-line bg-success-bg text-success'
                  : 'border-line bg-white text-ink-soft hover:border-brand-tint-line',
            )}
          >
            {index + 1}
          </button>
        )
      })}
    </nav>
  )
}

/** Asks before the final submission, and says how many questions are still empty (they count as wrong). */
function SubmitDialog({ open, unanswered, submitting, error, onGoToFirstUnanswered, onSubmit, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Nộp bài kiểm tra?">
      <p className="text-body text-ink-soft">
        {unanswered.length > 0
          ? `Bạn còn ${unanswered.length} câu chưa trả lời. Câu bỏ trống được tính 0 điểm.`
          : 'Bạn đã trả lời tất cả các câu. Sau khi nộp, bạn không sửa được câu trả lời nữa.'}
      </p>
      {error && <Alert variant="error">{describeApiError(error, 'Không nộp được bài. Vui lòng thử lại.')}</Alert>}
      <div className="flex flex-wrap justify-end gap-3">
        {unanswered.length > 0 ? (
          <Button variant="outline" onClick={onGoToFirstUnanswered} disabled={submitting}>
            Làm câu còn thiếu
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Kiểm tra lại
          </Button>
        )}
        <Button onClick={onSubmit} loading={submitting}>
          Nộp bài
        </Button>
      </div>
    </Dialog>
  )
}

/**
 * Taking one attempt: every answer is saved as it is given, the learner moves freely between questions, and the
 * attempt is submitted once, after a confirmation. Mounted with key={attemptId}, so restarting begins from scratch.
 */
function AttemptRunner({ test, attempt }) {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { questions } = test
  const [answers, setAnswers] = useState(() => answersFromSaved(attempt.answers))
  const [currentIndex, setCurrentIndex] = useState(() => firstUnansweredIndex(questions, answers))
  const [confirming, setConfirming] = useState(false)
  const saver = useAnswerSaver(attempt.attemptId, attempt.answers)
  const submit = useSubmitAttempt()
  // Signing out in the middle asks first; the attempt stays in progress with the answers saved (scenario 3, 4a).
  const logoutGuard = useMemo(
    () => ({
      message: 'Bài kiểm tra đang làm sẽ được lưu ở trạng thái đang làm. Bạn có muốn đăng xuất?',
      beforeLogout: saver.flush,
    }),
    [saver.flush],
  )
  useLogoutGuard(submit.isSuccess ? null : logoutGuard)

  const question = questions[currentIndex]
  const unanswered = unansweredQuestions(questions, answers)
  const isLast = currentIndex === questions.length - 1

  function pick(optionId) {
    setAnswers((current) => ({ ...current, [question.id]: { optionId } }))
    saver.saveNow(question.id, { optionId })
  }

  function type(text) {
    setAnswers((current) => ({ ...current, [question.id]: { text } }))
    saver.saveLater(question.id, answerPayload(question, { text }))
  }

  function goTo(index) {
    saver.flush() // typed text of the question being left; a failure shows in the save status
    setCurrentIndex(index)
  }

  async function openSubmit() {
    submit.reset()
    if (!(await saver.flush())) return // the save status already says what went wrong
    setConfirming(true)
  }

  function confirmSubmit() {
    const levelBefore = user.currentLevel ?? null
    submit.mutate(attempt.attemptId, {
      onSuccess: (result) => {
        // A graded comprehensive test changes the learner's level: the sidebar and home page show it at once.
        if (result.type === TEST_TYPES.COMPREHENSIVE && result.status === ATTEMPT_STATUS.GRADED) {
          refreshUser().catch(() => {})
        }
        navigate(`/tests/${test.id}/result/${result.attemptId}`, { state: { justSubmitted: true, levelBefore } })
      },
    })
  }

  return (
    <Page
      title={test.title}
      width="focus"
      heading={
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-bold text-ink">{test.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-label text-muted">
              Câu {currentIndex + 1}/{questions.length} · đã trả lời {questions.length - unanswered.length}/
              {questions.length}
            </p>
            <SaveStatus status={saver.status} onRetry={saver.flush} />
          </div>
        </div>
      }
    >
      <QuestionNav questions={questions} answers={answers} currentIndex={currentIndex} onGo={goTo} />

      {saver.status === 'error' && (
        <Alert variant="error">{describeApiError(saver.error, 'Không lưu được câu trả lời. Vui lòng thử lại.')}</Alert>
      )}

      <QuestionView
        key={question.id}
        number={currentIndex + 1}
        question={question}
        answer={answers[question.id]}
        onPick={pick}
        onType={type}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
          ← Câu trước
        </Button>
        {isLast ? (
          <Button onClick={openSubmit}>Nộp bài</Button>
        ) : (
          <Button onClick={() => goTo(currentIndex + 1)}>Câu tiếp theo →</Button>
        )}
      </div>
      {!isLast && (
        <button
          type="button"
          onClick={openSubmit}
          className="cursor-pointer self-end text-label font-semibold text-brand-dark hover:underline"
        >
          Nộp bài sớm
        </button>
      )}

      <SubmitDialog
        open={confirming}
        unanswered={unanswered}
        submitting={submit.isPending}
        error={submit.error}
        onGoToFirstUnanswered={() => {
          setConfirming(false)
          setCurrentIndex(questions.indexOf(unanswered[0]))
        }}
        onSubmit={confirmSubmit}
        onClose={() => {
          if (!submit.isPending) setConfirming(false)
        }}
      />
    </Page>
  )
}

/** The skills a test covers, in the progress radar's order: "Nghe, Đọc, Viết, Nói". */
function skillList(questions) {
  const skills = new Set(questions.map((question) => question.skill?.toLowerCase()).filter(Boolean))
  return SKILL_ORDER.filter((key) => skills.has(key))
    .map((key) => SKILL_LABELS[key])
    .join(', ')
}

/** What the test contains, and "Bắt đầu" / "Làm tiếp" / "Làm lại từ đầu" before the questions show. */
function StartCard({ test, starting, error, onStart }) {
  const choiceCount = test.questions.filter(isChoice).length
  const typedCount = test.questions.length - choiceCount
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-body text-ink-soft">
          {test.questions.length} câu
          {typedCount > 0 ? ` (${choiceCount} câu chọn đáp án, ${typedCount} câu tự gõ)` : ''}
          {skillList(test.questions) ? ` · Kỹ năng: ${skillList(test.questions)}` : ''}
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-label text-muted">
          <li>Câu trả lời được lưu ngay khi bạn chọn hoặc gõ; rời trang rồi quay lại vẫn làm tiếp được.</li>
          <li>Câu bỏ trống khi nộp bài được tính 0 điểm.</li>
          {test.type === TEST_TYPES.COMPREHENSIVE && <li>Kết quả bài này xác định lại trình độ CEFR của bạn.</li>}
        </ul>
      </div>
      {error && <Alert variant="error">{describeApiError(error, 'Không bắt đầu được bài kiểm tra.')}</Alert>}
      {test.hasInProgress ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onStart(false)} loading={starting === 'resume'} disabled={Boolean(starting)}>
              Làm tiếp
            </Button>
            <Button
              variant="outline"
              onClick={() => onStart(true)}
              loading={starting === 'restart'}
              disabled={Boolean(starting)}
            >
              Làm lại từ đầu
            </Button>
          </div>
          <p className="text-label text-muted">Bạn đang làm dở bài này. Làm lại từ đầu sẽ xóa các câu đã trả lời.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onStart(false)} loading={starting === 'resume'}>
            Bắt đầu
          </Button>
          <ButtonLink to="/tests" variant="outline">
            Về danh sách
          </ButtonLink>
        </div>
      )}
    </Card>
  )
}

function parseId(value) {
  return /^\d+$/.test(value ?? '') ? Number(value) : null
}

/** /tests/:testId: the test's overview, then its questions once an attempt is started or resumed. */
export function TestTakingPage() {
  const testId = parseId(useParams().testId)
  const test = useTest(testId)
  const [attempt, setAttempt] = useState(null)
  const [starting, setStarting] = useState(null) // null | 'resume' | 'restart'
  const [error, setError] = useState(null)

  async function start(restart) {
    setError(null)
    setStarting(restart ? 'restart' : 'resume')
    try {
      setAttempt(await startAttempt(testId, { restart }))
    } catch (startError) {
      setError(startError)
    } finally {
      setStarting(null)
    }
  }

  if (testId === null) {
    return (
      <Page title="Kiểm tra" width="focus">
        <Card>Bài kiểm tra không tồn tại.</Card>
      </Page>
    )
  }

  if (test.isPending) {
    return (
      <Page title="Kiểm tra" width="focus">
        <Skeleton className="h-56 w-full rounded-xl" />
      </Page>
    )
  }

  if (test.isError) {
    return (
      <Page title="Kiểm tra" width="focus">
        {test.error?.status === 404 ? (
          <Card className="flex flex-col items-start gap-3">
            <p className="text-body text-ink-soft">Bài kiểm tra không tồn tại hoặc đã hết hạn.</p>
            <ButtonLink to="/tests" variant="outline" size="sm">
              ← Về danh sách bài kiểm tra
            </ButtonLink>
          </Card>
        ) : (
          <LoadError error={test.error} onRetry={() => test.refetch()} message="Không tải được bài kiểm tra." />
        )}
      </Page>
    )
  }

  if (!attempt) {
    return (
      <Page
        title={test.data.title}
        width="focus"
        heading={
          <div className="flex flex-col gap-2">
            <Tag variant="brand" className="self-start">
              {TEST_TYPE_LABELS[test.data.type]}
            </Tag>
            <h1 className="text-title font-bold text-ink">{test.data.title}</h1>
          </div>
        }
      >
        <StartCard test={test.data} starting={starting} error={error} onStart={start} />
      </Page>
    )
  }

  return <AttemptRunner key={attempt.attemptId} test={test.data} attempt={attempt} />
}
