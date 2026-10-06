import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
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
import {
  answerPayload,
  answersFromSaved,
  firstUnansweredIndex,
  isAnswered,
  isChoice,
  isReadAloud,
  testParts,
  unansweredQuestions,
} from '../answers'
import { startAttempt } from '../api/testsApi'
import { useSubmitAttempt, useTest } from '../api/testsQueries'
import { PassageView } from '../components/PassageView'
import { QuestionView } from '../components/QuestionView'
import { ATTEMPT_STATUS, QUESTION_TYPES, SKILL_LABELS, SKILL_ORDER, TEST_TYPE_LABELS, TEST_TYPES } from '../constants'
import { useAnswerSaver } from '../useAnswerSaver'
import { useRecordingSaver } from '../useRecordingSaver'

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

/** The numbered buttons, one row per part when the test has several skills ("Nghe 1–10, Nói 11–12…", scenario 15). */
function QuestionNav({ questions, answers, currentIndex, onGo }) {
  const parts = testParts(questions)
  const byPart = parts.length > 1 && parts.every((part) => part.skill && SKILL_LABELS[part.skill])

  function numberButton({ question, index }) {
    const answered = isAnswered(question, answers[question.id])
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
  }

  if (byPart) {
    return (
      <nav aria-label="Chuyển câu hỏi" className="flex flex-col gap-2">
        {parts.map((part) => (
          <div key={part.items[0].index} role="group" aria-label={`Phần ${SKILL_LABELS[part.skill]}`} className="flex flex-wrap items-center gap-2">
            <span className="w-10 flex-none text-xs font-semibold text-muted">{SKILL_LABELS[part.skill]}</span>
            {part.items.map(numberButton)}
          </div>
        ))}
      </nav>
    )
  }

  return (
    <nav aria-label="Chuyển câu hỏi" className="flex flex-wrap gap-2">
      {questions.map((question, index) => {
        const answered = isAnswered(question, answers[question.id])
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

/**
 * Asks before the final submission, and says which questions are still empty (they count as wrong): "Bạn còn 1 câu
 * chưa trả lời (câu 7)" (scenario 14, step 11).
 */
function SubmitDialog({ open, unanswered, unansweredNumbers, submitting, error, onGoToFirstUnanswered, onSubmit, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Nộp bài kiểm tra?">
      <p className="text-body text-ink-soft">
        {unanswered.length > 0
          ? `Bạn còn ${unanswered.length} câu chưa trả lời (câu ${unansweredNumbers.join(', ')}). Câu bỏ trống được tính 0 điểm.`
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
  // passageId -> how many times its recording has been played in this attempt (the server keeps the count).
  const [plays, setPlays] = useState(() =>
    Object.fromEntries((attempt.passagePlays ?? []).map((play) => [play.passageId, play.playCount])),
  )
  const saver = useAnswerSaver(attempt.attemptId, attempt.answers)
  // Recorded answers of read-aloud questions: a question counts as answered once the server has its recording.
  const recordings = useRecordingSaver(attempt.attemptId, (questionId) =>
    setAnswers((current) => ({ ...current, [questionId]: { recorded: true } })),
  )
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
  const passage = (test.passages ?? []).find((item) => item.id === question.passageId) ?? null
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

      {/* Keyed by the passage, not the question: it stays (and keeps playing) across the questions it belongs to. */}
      {passage && (
        <PassageView
          key={passage.id}
          attemptId={attempt.attemptId}
          passage={passage}
          playCount={plays[passage.id] ?? 0}
          onPlayed={(passageId, playCount) => setPlays((current) => ({ ...current, [passageId]: playCount }))}
        />
      )}

      <QuestionView
        key={question.id}
        number={currentIndex + 1}
        question={question}
        answer={answers[question.id]}
        onPick={pick}
        onType={type}
        upload={recordings.uploads[question.id]}
        onRecorded={(wav) => recordings.save(question.id, wav)}
        onRetryRecording={() => recordings.retry(question.id)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
          ← Câu trước
        </Button>
        {isLast ? (
          <Button onClick={openSubmit} disabled={recordings.busy}>
            Nộp bài
          </Button>
        ) : (
          <Button onClick={() => goTo(currentIndex + 1)}>Câu tiếp theo →</Button>
        )}
      </div>
      {!isLast && (
        <button
          type="button"
          onClick={openSubmit}
          disabled={recordings.busy}
          className="cursor-pointer self-end text-label font-semibold text-brand-dark hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          Nộp bài sớm
        </button>
      )}
      {recordings.busy && (
        <p aria-live="polite" className="self-end text-label text-muted">
          Bản ghi âm đang được xử lý. Bạn nộp bài được khi xử lý xong.
        </p>
      )}

      <SubmitDialog
        open={confirming}
        unanswered={unanswered}
        unansweredNumbers={unanswered.map((item) => questions.indexOf(item) + 1)}
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

const QUESTION_FORMS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'trắc nghiệm',
  [QUESTION_TYPES.LISTENING]: 'trắc nghiệm',
  [QUESTION_TYPES.READING]: 'trắc nghiệm',
  [QUESTION_TYPES.FILL_BLANK]: 'điền từ',
  [QUESTION_TYPES.SPEAKING]: 'đề bài nói',
  [QUESTION_TYPES.WRITING]: 'bài viết',
}

/** "Cấu trúc đề" of a test with several parts (scenario 15, step 4): each part's skill, size and kind of question. */
function PartTable({ questions }) {
  const parts = testParts(questions)
  if (parts.length < 2 || !parts.every((part) => part.skill && SKILL_LABELS[part.skill])) return null
  return (
    <table className="w-full text-label">
      <caption className="pb-1.5 text-left text-label font-semibold text-ink">Cấu trúc đề</caption>
      <thead>
        <tr className="text-xs text-muted">
          <th scope="col" className="py-1 pr-3 text-left font-medium">
            Phần
          </th>
          <th scope="col" className="py-1 pr-3 text-left font-medium">
            Số câu
          </th>
          <th scope="col" className="py-1 text-left font-medium">
            Dạng câu
          </th>
        </tr>
      </thead>
      <tbody>
        {parts.map((part) => {
          const forms = [
            ...new Set(
              part.items.map(({ question }) =>
                isReadAloud(question) ? 'đọc theo câu mẫu (ghi âm)' : (QUESTION_FORMS[question.type] ?? 'tự gõ'),
              ),
            ),
          ]
          return (
            <tr key={part.items[0].index} className="border-t border-line">
              <td className="py-1.5 pr-3 font-medium text-ink">{SKILL_LABELS[part.skill]}</td>
              <td className="py-1.5 pr-3 tabular-nums">{part.items.length}</td>
              <td className="py-1.5 text-ink-soft">{forms.join(', ')}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/**
 * The test's introduction (scenarios 14 and 15, step 6 and 4): what it contains, then "Bắt đầu" or, for an unfinished
 * attempt, "Làm tiếp" only: a test is not restarted from scratch. A test taken only once asks before it starts.
 */
function StartCard({ test, starting, error, onStart }) {
  const [confirming, setConfirming] = useState(false)
  const choiceCount = test.questions.filter(isChoice).length
  const recordedCount = test.questions.filter(isReadAloud).length
  const typedCount = test.questions.length - choiceCount - recordedCount
  const kinds = [
    `${choiceCount} câu chọn đáp án`,
    typedCount > 0 && `${typedCount} câu tự gõ`,
    recordedCount > 0 && `${recordedCount} câu ghi âm`,
  ].filter(Boolean)
  const onlyOnce = test.retakeAllowed === false
  const maxPlays = (test.passages ?? []).find((passage) => passage.audioUrl)?.maxPlays ?? null
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-body text-ink-soft">
          {test.questions.length} câu
          {kinds.length > 1 ? ` (${kinds.join(', ')})` : ''}
          {skillList(test.questions) ? ` · Kỹ năng: ${skillList(test.questions)}` : ''}
        </p>
        {test.skill && <p className="text-body text-ink-soft">Nội dung: {test.skill}</p>}
        <PartTable questions={test.questions} />
        <ul className="flex list-disc flex-col gap-1 pl-5 text-label text-muted">
          <li>Câu trả lời được lưu ngay khi bạn chọn hoặc gõ; rời trang rồi quay lại vẫn làm tiếp được.</li>
          <li>Câu bỏ trống khi nộp bài được tính 0 điểm.</li>
          {maxPlays !== null && <li>Mỗi bài nghe được nghe tối đa {maxPlays} lần.</li>}
          {recordedCount > 0 && (
            <li>Câu đọc theo câu mẫu được trả lời bằng ghi âm: bạn cần micro và cho phép trình duyệt dùng micro.</li>
          )}
          {test.type === TEST_TYPES.COMPREHENSIVE && <li>Kết quả bài này xác định lại trình độ CEFR của bạn.</li>}
          {onlyOnce && <li>Bài này chỉ làm được một lần: sau khi nộp bạn không làm lại được.</li>}
        </ul>
      </div>
      {error && (
        <Alert variant="error">
          {describeApiError(
            error,
            error.status === 409
              ? 'Bài kiểm tra này chỉ làm được một lần và bạn đã làm rồi.'
              : 'Không bắt đầu được bài kiểm tra.',
          )}
        </Alert>
      )}
      {test.hasInProgress ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onStart(false)} loading={starting === 'resume'} disabled={Boolean(starting)}>
              Làm tiếp
            </Button>
            <ButtonLink to="/tests" variant="outline">
              Về danh sách
            </ButtonLink>
          </div>
          <p className="text-label text-muted">Bạn đang làm dở bài này. Các câu đã trả lời được giữ lại.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => (onlyOnce ? setConfirming(true) : onStart(false))} loading={starting === 'resume'}>
            Bắt đầu
          </Button>
          <ButtonLink to="/tests" variant="outline">
            Về danh sách
          </ButtonLink>
        </div>
      )}
      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Bắt đầu bài kiểm tra?">
        <p className="text-body text-ink-soft">
          Bài này chỉ làm được một lần. Bạn có thể rời trang rồi quay lại làm tiếp, nhưng sau khi nộp thì không làm lại
          được.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Để sau
          </Button>
          <Button
            onClick={() => {
              setConfirming(false)
              onStart(false)
            }}
          >
            Bắt đầu làm bài
          </Button>
        </div>
      </Dialog>
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

  // A test taken only once and already submitted has nothing to start: its page is its result.
  if (!attempt && test.data.retakeAllowed === false && test.data.lastAttemptId != null && !test.data.hasInProgress) {
    return <Navigate to={`/tests/${testId}/result/${test.data.lastAttemptId}`} replace />
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
