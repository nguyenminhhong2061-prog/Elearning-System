import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { CEFR_LEVELS } from '@/api/constants'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'
import { formatDate, todayInVietnam } from '@/lib/dates'
import { useTest, useTestResult } from '../api/testsQueries'
import { AI_CRITERIA, ATTEMPT_STATUS, SKILL_LABELS, SKILL_ORDER, TEST_TYPE_LABELS, TEST_TYPES } from '../constants'

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
          xong. Trang này tự cập nhật, bạn không cần tải lại.
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

/**
 * The tag of a reviewed question. Speaking and free writing are scored by the AI, not right or wrong; while the
 * attempt is still being graded, an answer the AI has not reached yet says so.
 */
function reviewTag(item, stillGrading) {
  if (item.correct === true) return { tone: 'success', label: 'Đúng' }
  if (item.correct === false) return { tone: 'danger', label: 'Sai' }
  if (stillGrading && !item.aiCriteria && !item.pronunciation && item.answerText) {
    return { tone: 'warning', label: 'Đang chấm' }
  }
  return { tone: 'brand', label: `${Number(item.scoreEarned)}/${item.points} điểm` }
}

/** The AI's band of a criterion as a level: 1 is A1 ... 6 is C2, 0 is below anything it could rate. */
function bandLabel(band) {
  if (band == null) return '—'
  return CEFR_LEVELS[band - 1] ?? 'chưa đạt A1'
}

/** What the AI examiner said about a spoken or written answer: a level per criterion and a short comment. */
function AiFeedback({ item }) {
  if (!item.aiCriteria) return null
  return (
    <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-canvas p-3 text-label">
      <p className="font-semibold text-ink">Nhận xét của AI</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-ink-soft">
        {AI_CRITERIA.map(({ key, label }) => (
          <li key={key}>
            {label}: <span className="font-semibold text-ink">{bandLabel(item.aiCriteria[key])}</span>
          </li>
        ))}
      </ul>
      {item.aiComment && <p className="text-ink-soft">{item.aiComment}</p>}
    </div>
  )
}

/**
 * How a read-aloud answer was pronounced: the overall score, how much of the sentence matched, and the words that
 * were mispronounced or left out, with what was expected and what was heard (IPA).
 */
function PronunciationFeedback({ pronunciation }) {
  const percent = (value) => `${Math.round(Number(value))}%`
  return (
    <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-canvas p-3 text-label">
      <p className="font-semibold text-ink">Chấm phát âm</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-ink-soft">
        <li>
          Điểm phát âm: <span className="font-semibold text-ink">{Math.round(Number(pronunciation.score))}/100</span>
        </li>
        {pronunciation.phonemeAccuracy != null && <li>Khớp âm: {percent(pronunciation.phonemeAccuracy)}</li>}
        {pronunciation.wordAccuracy != null && <li>Khớp từ: {percent(pronunciation.wordAccuracy)}</li>}
      </ul>
      {pronunciation.errors.length > 0 ? (
        <ul className="flex list-disc flex-col gap-0.5 pl-5 text-ink-soft">
          {pronunciation.errors.map((error, index) => (
            <li key={`${error.word}-${index}`}>
              {error.heardIpa
                ? `“${error.word}”: mong đợi /${error.expectedIpa}/, nghe được /${error.heardIpa}/`
                : `“${error.word}”: chưa đọc hoặc không nghe rõ`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">Không phát hiện từ nào đọc sai.</p>
      )}
      <p className="text-xs text-muted">Điểm do mô hình ước lượng từ bản ghi âm, có thể sai với giọng lạ hoặc tiếng ồn.</p>
    </div>
  )
}

/** The passage the questions below it were about. After submission its recording plays freely, with the transcript. */
function ReviewPassage({ passage }) {
  return (
    <li className="flex flex-col gap-2 rounded-[10px] border border-brand-tint-line bg-brand-tint p-4">
      <h3 className="text-label font-semibold text-brand-dark">
        {passage.audioUrl ? 'Bài nghe' : 'Đoạn đọc'}
        {passage.title ? `: ${passage.title}` : ''}
      </h3>
      {passage.audioUrl && (
        <audio controls src={passage.audioUrl} className="w-full">
          Trình duyệt của bạn không phát được âm thanh này.
        </audio>
      )}
      {passage.content && <p className="text-sm whitespace-pre-line text-ink">{passage.content}</p>}
      {passage.transcript && (
        <details className="text-sm text-ink">
          <summary className="cursor-pointer font-semibold text-brand-dark">Lời thoại</summary>
          <p className="mt-1.5 whitespace-pre-line">{passage.transcript}</p>
        </details>
      )}
    </li>
  )
}

function ReviewList({ questions, passages, review, stillGrading }) {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const passageById = new Map(passages.map((passage) => [passage.id, passage]))
  return (
    <ul className="flex flex-col gap-3">
      {review.flatMap((item, index) => {
        const question = byId.get(item.questionId)
        const selected =
          item.selectedOptionId == null
            ? item.answerText
            : (question?.options.find((option) => option.id === item.selectedOptionId)?.content ?? '—')
        const { tone, label } = reviewTag(item, stillGrading)
        // A read-aloud answer is a recording: what is shown is what was heard in it, beside the sentence to read.
        const readAloud = Boolean(question?.referenceText || item.pronunciation)
        const noAnswer = readAloud ? (item.pronunciation ? '(không nghe rõ)' : 'Chưa ghi âm') : 'Không trả lời'
        // A passage is shown once, above the first of its questions.
        const passage = item.passageId != null && item.passageId !== review[index - 1]?.passageId
          ? passageById.get(item.passageId)
          : null
        return [
          passage && <ReviewPassage key={`passage-${passage.id}-${item.questionId}`} passage={passage} />,
          <li key={item.questionId} className="rounded-[10px] border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-ink">
                <span className="font-semibold text-muted">Câu {index + 1}. </span>
                {question?.content ?? `Câu hỏi #${item.questionId}`}
              </p>
              <div className="flex flex-none items-center gap-1.5">
                {item.level && <Tag aria-label={`Bậc ${item.level}`}>{item.level}</Tag>}
                <Tag variant={tone}>{label}</Tag>
              </div>
            </div>
            <dl className="mt-3 flex flex-col gap-1 text-label">
              <div className="flex gap-2">
                <dt className="flex-none text-muted">{readAloud ? 'Hệ thống nghe được:' : 'Bạn trả lời:'}</dt>
                <dd className={cx('min-w-0 break-words', item.correct === true ? 'text-success' : 'text-ink')}>
                  {selected || noAnswer}
                </dd>
              </div>
              {item.correct !== true && item.correctAnswer && (
                <div className="flex gap-2">
                  <dt className="flex-none text-muted">{readAloud ? 'Câu mẫu:' : 'Đáp án đúng:'}</dt>
                  <dd className="min-w-0 break-words font-semibold text-brand-dark">{item.correctAnswer}</dd>
                </div>
              )}
            </dl>
            <AiFeedback item={item} />
            {item.pronunciation && <PronunciationFeedback pronunciation={item.pronunciation} />}
          </li>,
        ]
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

/** The next CEFR level, the goal a comprehensive test's roadmap aims at ("12 tuần hướng tới B2"). */
function nextLevel(level) {
  const position = CEFR_LEVELS.indexOf(level)
  return position === -1 ? null : CEFR_LEVELS[Math.min(position + 1, CEFR_LEVELS.length - 1)]
}

/** "Người học: … · Ngày làm: … · Trình độ trước khi làm bài: …" of a comprehensive test (scenario 15, step 18). */
function reportLine(fullName, submittedAt, levelBefore) {
  const parts = [`Người học: ${fullName}`]
  if (submittedAt) parts.push(`Ngày làm: ${formatDate(todayInVietnam(new Date(submittedAt)))}`)
  if (levelBefore) parts.push(`Trình độ trước khi làm bài: ${levelBefore}`)
  return parts.join(' · ')
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
  const { user, refreshUser } = useAuth()
  // Set by the taking screen right after submitting. It is kept for this visit only: the browser stores history state
  // across reloads, so it is removed from the history entry and a reload or a later visit shows no "level" note.
  const [{ justSubmitted = false, levelBefore = null }] = useState(() => location.state ?? {})
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  // The AI finished grading while this page was open: a comprehensive test has just set the learner's level.
  const status = result.data?.status
  const wasGrading = useRef(false)
  useEffect(() => {
    if (status === ATTEMPT_STATUS.SUBMITTED) {
      wasGrading.current = true
    } else if (status === ATTEMPT_STATUS.GRADED && wasGrading.current) {
      wasGrading.current = false
      refreshUser().catch(() => {})
    }
  }, [status, refreshUser])

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
  const comprehensive = data.type === TEST_TYPES.COMPREHENSIVE
  // Scenario 15 branch 18a: the roadmap goes to the plan page with the next level as the goal.
  const applyRoadmap =
    comprehensive && data.status === ATTEMPT_STATUS.GRADED && data.suggestedRoadmap
      ? { attemptId: data.attemptId, targetLevel: nextLevel(data.suggestedLevel), roadmap: data.suggestedRoadmap }
      : null

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
          {comprehensive && (
            <p className="text-label text-muted">{reportLine(user.fullName, data.submittedAt, justSubmitted ? levelBefore : null)}</p>
          )}
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
              passages={data.passages ?? []}
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
        {/* Only a test that may be taken again (and is still open) offers it: a comprehensive test is taken once. */}
        {test.data?.retakeAllowed === true && <ButtonLink to={`/tests/${data.testId}`}>Làm lại</ButtonLink>}
        {applyRoadmap ? (
          <ButtonLink to="/plan" state={{ fromTest: applyRoadmap }} variant="outline">
            Áp dụng lộ trình vào kế hoạch học →
          </ButtonLink>
        ) : (
          <ButtonLink to="/plan" variant="outline">
            Xem kế hoạch cá nhân →
          </ButtonLink>
        )}
      </div>
    </Page>
  )
}
