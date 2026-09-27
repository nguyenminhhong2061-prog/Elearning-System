import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { TextField } from '@/components/ui/TextField'
import { cx } from '@/lib/cx'
import { saveAnswer, startAttempt, submitAttempt } from '../api/testsApi'
import { useTest } from '../api/testsQueries'
import { QUESTION_TYPES, SKILL_LABELS, TEST_TYPE_LABELS } from '../constants'

/** A test question answered by picking one of its options. */
const isChoice = (question) => question.options.length > 0

/** The body of PUT .../answers/{questionId}, or null when nothing usable was entered (nothing is saved then). */
function answerPayload(question, answer) {
  if (!answer) return null
  if (isChoice(question)) {
    return answer.optionId != null ? { optionId: answer.optionId } : null
  }
  const text = (answer.text ?? '').trim()
  return text ? { text } : null
}

/** Turns the resume payload into the page's answer map. */
function answersFromSaved(saved) {
  const map = {}
  for (const item of saved) {
    map[item.questionId] = item.optionId != null ? { optionId: item.optionId } : { text: item.text ?? '' }
  }
  return map
}

function QuestionPrompt({ question }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {question.skill && <Tag variant="brand">{SKILL_LABELS[question.skill.toLowerCase()] ?? question.skill}</Tag>}
        <Tag>{question.points} điểm</Tag>
      </div>
      <p className="whitespace-pre-line text-body text-ink">{question.content}</p>
      {question.audioUrl && (
        <audio controls src={question.audioUrl} className="w-full">
          Trình duyệt của bạn không phát được âm thanh này.
        </audio>
      )}
    </div>
  )
}

function ChoiceAnswer({ question, answer, onSelect }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {question.options.map((option) => {
        const selected = answer?.optionId === option.id
        return (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={selected}
              className={cx(
                'w-full rounded-[10px] border px-4 py-3.5 text-left text-body transition-colors',
                selected
                  ? 'border-brand bg-brand-tint font-semibold text-brand-dark'
                  : 'border-line bg-white text-ink-soft hover:border-brand/50',
              )}
            >
              {option.content}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function TextAnswer({ question, answer, onChange }) {
  const value = answer?.text ?? ''
  const long = question.type === QUESTION_TYPES.WRITING || question.type === QUESTION_TYPES.SPEAKING

  if (!long) {
    return (
      <TextField
        label="Câu trả lời của bạn"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        placeholder="Gõ đáp án…"
      />
    )
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label font-medium text-ink-soft">
        {question.type === QUESTION_TYPES.SPEAKING ? 'Gõ câu bạn sẽ đọc (bản demo chưa thu âm)' : 'Bài viết của bạn'}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={question.type === QUESTION_TYPES.SPEAKING ? 3 : 6}
        className="w-full rounded-lg border border-line bg-white px-4 py-3.5 text-body text-ink outline-none transition-colors placeholder:text-muted-light focus:border-brand focus:ring-2 focus:ring-brand/25"
        placeholder={question.type === QUESTION_TYPES.SPEAKING ? 'Đọc to câu trên rồi gõ lại…' : 'Viết câu trả lời của bạn…'}
      />
    </label>
  )
}

/** /tests/:testId: starts (or resumes) an attempt and walks the learner through every question. */
export function TestTakingPage() {
  const params = useParams()
  const navigate = useNavigate()
  const testId = /^\d+$/.test(params.testId ?? '') ? Number(params.testId) : null
  const test = useTest(testId)

  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
        <Skeleton className="h-40 w-full rounded-xl" />
      </Page>
    )
  }

  if (test.isError) {
    return (
      <Page title="Kiểm tra" width="focus">
        <LoadError error={test.error} onRetry={() => test.refetch()} message="Không tải được bài kiểm tra." />
      </Page>
    )
  }

  const { questions } = test.data
  const question = questions[currentIndex]
  const answeredCount = questions.filter((item) => answerPayload(item, answers[item.id])).length
  const isLast = currentIndex === questions.length - 1

  async function handleStart() {
    setError(null)
    setStarting(true)
    try {
      const started = await startAttempt(testId)
      setAttempt(started)
      setAnswers(answersFromSaved(started.answers))
      setCurrentIndex(0)
    } catch (startError) {
      setError(startError)
    } finally {
      setStarting(false)
    }
  }

  function setAnswer(questionId, patch) {
    setAnswers((current) => ({ ...current, [questionId]: { ...current[questionId], ...patch } }))
  }

  /** Saves the current question; returns false (and shows the error) when saving failed. */
  async function persistCurrent() {
    if (!attempt) return true
    const payload = answerPayload(question, answers[question.id])
    if (!payload) return true
    setSaving(true)
    try {
      await saveAnswer(attempt.attemptId, question.id, payload)
      return true
    } catch (saveError) {
      setError(saveError)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function goTo(index) {
    setError(null)
    if (!(await persistCurrent())) return
    setCurrentIndex(index)
  }

  async function handleSubmit() {
    setError(null)
    if (!(await persistCurrent())) return
    setSubmitting(true)
    try {
      await submitAttempt(attempt.attemptId)
      navigate(`/tests/${testId}/result/${attempt.attemptId}`)
    } catch (submitError) {
      setError(submitError)
      setSubmitting(false)
    }
  }

  // Before starting: what the test contains, and the start / resume action.
  if (!attempt) {
    return (
      <Page title={test.data.title} width="focus">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Tag variant="brand" className="self-start">
              {TEST_TYPE_LABELS[test.data.type]}
            </Tag>
            <h1 className="text-title font-bold text-ink">{test.data.title}</h1>
            <p className="text-sm text-muted">{questions.length} câu hỏi. Trả lời từng câu rồi bấm “Nộp bài” ở câu cuối.</p>
          </div>
          {error && <Alert variant="error">{describeApiError(error, 'Không bắt đầu được bài kiểm tra.')}</Alert>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStart} loading={starting}>
              {test.data.hasInProgress ? 'Làm tiếp' : 'Bắt đầu'}
            </Button>
            <ButtonLink to="/tests" variant="outline">
              Về danh sách
            </ButtonLink>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page
      title={test.data.title}
      width="focus"
      heading={
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-bold text-ink">{test.data.title}</h1>
          <p className="text-label text-muted">
            Câu {currentIndex + 1}/{questions.length} · đã trả lời {answeredCount}/{questions.length}
          </p>
        </div>
      }
    >
      <nav aria-label="Chuyển câu hỏi" className="flex flex-wrap gap-2">
        {questions.map((item, index) => {
          const answered = Boolean(answerPayload(item, answers[item.id]))
          const current = index === currentIndex
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              aria-current={current ? 'true' : undefined}
              aria-label={`Câu ${index + 1}${answered ? ' (đã trả lời)' : ''}`}
              className={cx(
                'size-8 rounded-lg border text-label font-semibold transition-colors',
                current
                  ? 'border-brand bg-brand text-white'
                  : answered
                    ? 'border-success-line bg-success-bg text-success'
                    : 'border-line bg-white text-ink-soft',
              )}
            >
              {index + 1}
            </button>
          )
        })}
      </nav>

      {error && <Alert variant="error">{describeApiError(error, 'Không lưu được câu trả lời. Vui lòng thử lại.')}</Alert>}

      <Card className="flex flex-col gap-5">
        <QuestionPrompt question={question} />
        {isChoice(question) ? (
          <ChoiceAnswer
            question={question}
            answer={answers[question.id]}
            onSelect={(optionId) => setAnswer(question.id, { optionId })}
          />
        ) : (
          <TextAnswer
            question={question}
            answer={answers[question.id]}
            onChange={(text) => setAnswer(question.id, { text })}
          />
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0 || saving}>
          ← Câu trước
        </Button>
        {isLast ? (
          <Button onClick={handleSubmit} loading={submitting} disabled={saving}>
            Nộp bài
          </Button>
        ) : (
          <Button onClick={() => goTo(currentIndex + 1)} loading={saving}>
            Câu tiếp theo →
          </Button>
        )}
      </div>
    </Page>
  )
}
