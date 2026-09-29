import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { useTest, useTestResult } from '../api/testsQueries'
import { ATTEMPT_STATUS, SKILL_LABELS, SKILL_ORDER, TEST_TYPE_LABELS, TEST_TYPES } from '../constants'

function parseId(value) {
  return /^\d+$/.test(value ?? '') ? Number(value) : null
}

/** The big headline: the overall score and CEFR level, or what is still being graded. */
function Headline({ result, pending }) {
  if (result.status === ATTEMPT_STATUS.SUBMITTED) {
    return (
      <div className="flex flex-col gap-2">
        <Tag variant="warning" className="self-start">
          Đang chấm phần {pending.map((key) => SKILL_LABELS[key]).join(', ')}
        </Tag>
        <p className="text-sm text-ink-soft">
          Phần trắc nghiệm, điền từ đã chấm xong. Phần {pending.map((key) => SKILL_LABELS[key]).join(', ')} do AI chấm, điểm tổng và trình độ hiện khi chấm
          xong.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="flex size-22 flex-none items-center justify-center rounded-full border-4 border-brand bg-brand-tint">
        <span className="text-title font-bold text-brand-dark">{result.suggestedLevel}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold text-ink">{result.scorePercent}/100</span>
        <span className="text-sm text-muted">
          Đúng {result.correctCount}/{result.questionCount} câu · {result.earnedPoints}/{result.totalPoints} điểm
        </span>
        {result.isPersonalBest && <Tag variant="success" className="mt-1 self-start">Kỷ lục mới!</Tag>}
      </div>
    </div>
  )
}

function SkillBreakdown({ result }) {
  const skills = SKILL_ORDER.filter((key) => result.skills[key] !== undefined)
  return (
    <div className="flex flex-col gap-2.5">
      {skills.map((key) => {
        const skill = result.skills[key]
        const pending = skill.score === null
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-12 flex-none text-label font-medium text-ink-soft">{SKILL_LABELS[key]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
              {!pending && <div className="h-full rounded-full bg-brand" style={{ width: `${skill.score}%` }} />}
            </div>
            <span className={cx('w-24 flex-none text-right text-label font-semibold', pending ? 'text-warning' : 'text-ink')}>
              {pending ? 'đang chấm' : `${skill.score} · ${skill.level}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** The tag of a reviewed question. Speaking and free writing are scored by the AI, not right or wrong. */
function reviewTag(item, stillGrading) {
  if (item.correct === true) return { tone: 'success', label: 'Đúng' }
  if (item.correct === false) return { tone: 'danger', label: 'Sai' }
  if (stillGrading) return { tone: 'warning', label: 'Đang chấm' }
  return { tone: 'brand', label: `${Number(item.scoreEarned)}/${item.points} điểm` }
}

function ReviewList({ questions, review, stillGrading }) {
  const byId = new Map(questions.map((question) => [question.id, question]))
  return (
    <ul className="flex flex-col gap-3">
      {review.map((item, index) => {
        const question = byId.get(item.questionId)
        const selected =
          item.selectedOptionId == null
            ? item.answerText
            : (question?.options.find((option) => option.id === item.selectedOptionId)?.content ?? '—')
        const { tone, label } = reviewTag(item, stillGrading)
        return (
          <li key={item.questionId} className="rounded-[10px] border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-ink">
                <span className="font-semibold text-muted">Câu {index + 1}. </span>
                {question?.content ?? `Câu hỏi #${item.questionId}`}
              </p>
              <Tag variant={tone} className="flex-none">
                {label}
              </Tag>
            </div>
            <dl className="mt-3 flex flex-col gap-1 text-label">
              <div className="flex gap-2">
                <dt className="flex-none text-muted">Bạn trả lời:</dt>
                <dd className={cx('min-w-0 break-words', item.correct === true ? 'text-success' : 'text-ink')}>
                  {selected || 'Không trả lời'}
                </dd>
              </div>
              {item.correct !== true && item.correctAnswer && (
                <div className="flex gap-2">
                  <dt className="flex-none text-muted">Đáp án đúng:</dt>
                  <dd className="min-w-0 break-words font-semibold text-brand-dark">{item.correctAnswer}</dd>
                </div>
              )}
            </dl>
          </li>
        )
      })}
    </ul>
  )
}

/** What a comprehensive test just did to the learner's level (only such a test changes it). */
function levelChangeNote(result, levelBefore) {
  if (result.type !== TEST_TYPES.COMPREHENSIVE || result.status !== ATTEMPT_STATUS.GRADED) return null
  if (!levelBefore) return `Trình độ của bạn được xác định là ${result.suggestedLevel}.`
  if (levelBefore === result.suggestedLevel) return `Trình độ của bạn giữ nguyên ở ${result.suggestedLevel}.`
  return `Trình độ của bạn đổi từ ${levelBefore} thành ${result.suggestedLevel}.`
}

/** /tests/:testId/result/:attemptId: the graded result of one attempt. */
export function TestResultPage() {
  const params = useParams()
  const testId = parseId(params.testId)
  const attemptId = parseId(params.attemptId)
  const result = useTestResult(attemptId)
  const test = useTest(testId)
  const location = useLocation()
  const navigate = useNavigate()
  // Set by the taking screen right after submitting. It is kept for this visit only: the browser stores history state
  // across reloads, so it is removed from the history entry and a reload or a later visit shows no "level" note.
  const [{ justSubmitted = false, levelBefore = null }] = useState(() => location.state ?? {})
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  if (attemptId === null) {
    return (
      <Page title="Kết quả kiểm tra" width="focus">
        <Card>Không tìm thấy lượt làm bài.</Card>
      </Page>
    )
  }

  if (result.isPending) {
    return (
      <Page title="Kết quả kiểm tra" width="focus">
        <Skeleton className="h-40 w-full rounded-xl" />
      </Page>
    )
  }

  if (result.isError) {
    return (
      <Page title="Kết quả kiểm tra" width="focus">
        <LoadError error={result.error} onRetry={() => result.refetch()} message="Không tải được kết quả." />
      </Page>
    )
  }

  const data = result.data
  const pending = SKILL_ORDER.filter((key) => data.skills[key] !== undefined && data.skills[key].score === null)
  const levelNote = justSubmitted ? levelChangeNote(data, levelBefore) : null

  return (
    <Page
      title="Kết quả kiểm tra"
      width="focus"
      heading={
        <div className="flex flex-col gap-1">
          <Tag variant="brand" className="self-start">
            {TEST_TYPE_LABELS[data.type]}
          </Tag>
          <h1 className="text-title font-bold text-ink">{data.title}</h1>
        </div>
      }
    >
      <Card className="flex flex-col gap-5">
        <Headline result={data} pending={pending} />
        <SkillBreakdown result={data} />
      </Card>

      {levelNote && <Alert variant="info">{levelNote}</Alert>}

      {data.suggestedRoadmap && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-ink">Lộ trình đề xuất</h2>
          <p className="text-body text-ink-soft">{data.suggestedRoadmap}</p>
        </Card>
      )}

      {data.review.length > 0 && (
        <section aria-labelledby="review-title" className="flex flex-col gap-3">
          <h2 id="review-title" className="text-lg font-semibold text-ink">
            Xem lại bài làm
          </h2>
          {test.isSuccess ? (
            <ReviewList
              questions={test.data.questions}
              review={data.review}
              stillGrading={data.status === ATTEMPT_STATUS.SUBMITTED}
            />
          ) : (
            <p className="text-sm text-muted">Không tải được nội dung câu hỏi để xem lại.</p>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/tests" variant="outline">
          ← Về danh sách bài kiểm tra
        </ButtonLink>
        <ButtonLink to={`/tests/${data.testId}`}>Làm lại</ButtonLink>
      </div>
    </Page>
  )
}
