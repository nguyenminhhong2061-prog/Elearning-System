import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { answerWriting, regradeWriting } from '../api/exercisesApi'
import { markAttemptsStale, useCompleteAttempt } from '../api/exercisesQueries'
import { ExerciseHeading } from '../components/ExerciseHeading'
import { HintToggle } from '../components/HintToggle'
import { QuestionProgress } from '../components/QuestionProgress'
import { ResultCard } from '../components/ResultCard'
import { ResumeNotice } from '../components/ResumeNotice'
import { ScoreRing } from '../components/ScoreRing'
import { chatContextLabel } from '../chat/contextLabel'
import { MAX_WRITING_LENGTH } from '../constants'
import { formatTotal, scoreText, writingOutcome } from './writing'
import { WritingFeedback } from './WritingFeedback'
import { WritingPrompt } from './WritingPrompt'
import { WritingReview } from './WritingReview'

/**
 * Where a picked-up attempt stands: the answers already sent (graded or not) and the first question still open, or the
 * last one when every question was answered.
 */
function resumeState(questions, responses) {
  const results = new Map(responses.map((item) => [item.questionId, item]))
  const answers = new Map(responses.map((item) => [item.questionId, item.answer ?? '']))
  const firstOpen = questions.findIndex((question) => !results.has(question.id))
  return { results, answers, index: firstOpen === -1 ? questions.length - 1 : firstOpen }
}

const isPending = (result) => Boolean(result) && !result.graded

/**
 * Writing (scenario 10): one question at a time, a sentence to translate, to rewrite or to write with keywords. "Kiểm
 * tra" saves the answer and the AI grades it ("Đang chấm…"); the box below shows the points, the feedback, the sample
 * answers and the explanation. A sent answer cannot be changed in this attempt. When the AI fails, the answer stays
 * saved without points and can be sent again, now or at the end; the attempt only gets its total once every answer
 * is graded. A picked-up attempt opens at the first question not answered yet.
 *
 * @param {object} props
 * @param {import('../types').Lesson} props.lesson
 * @param {number} props.attemptId
 * @param {import('../types').AttemptProgress} props.progress
 * @param {{ id: number, title: string } | null} props.nextLesson
 * @param {() => void} props.onRestart
 * @param {boolean} props.restarting
 * @param {unknown} props.restartError
 * @param {(context: { questionId?: number }) => void} props.onChatContext
 * @param {() => void} props.onAskAssistant
 */
export function WritingExercise({ lesson, attemptId, progress, nextLesson, onRestart, restarting, restartError, onChatContext, onAskAssistant }) {
  const questions = lesson.questions
  const [resumed] = useState(() => resumeState(questions, progress.responses))
  const [index, setIndex] = useState(resumed.index)
  const [draft, setDraft] = useState('')
  const [answers, setAnswers] = useState(resumed.answers) // questionId -> what the learner sent
  const [results, setResults] = useState(resumed.results) // questionId -> WritingResult
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState(null)
  const [regrading, setRegrading] = useState(() => new Set()) // questionIds being sent to the AI again
  const [regradeErrors, setRegradeErrors] = useState(() => new Map())
  const [finishing, setFinishing] = useState(false) // "Xem kết quả" while some answers are not graded
  const complete = useCompleteAttempt(attemptId)
  const queryClient = useQueryClient()
  const answerId = useId()
  const nextButton = useRef(null)
  const resultHeading = useRef(null)
  const pendingHeading = useRef(null)

  const question = questions[index]
  const result = results.get(question.id) ?? null
  const isLast = index === questions.length - 1
  const pendingIds = questions.filter((item) => isPending(results.get(item.id))).map((item) => item.id)

  const sent = answers.get(question.id) ?? null
  useEffect(() => {
    if (complete.isSuccess) {
      onChatContext({})
      return
    }
    const label = chatContextLabel({
      number: index + 1,
      lessonTitle: lesson.title,
      prompt: question.prompt,
      answer: result ? sent : null,
      answerLabel: 'Bạn viết',
      score: result ? (result.graded ? `${scoreText(result)} điểm` : 'chưa chấm') : null,
    })
    onChatContext({ questionId: question.id, label })
  }, [complete.isSuccess, question, index, lesson.title, result, sent, onChatContext])

  function reviewContext(questionId) {
    const position = questions.findIndex((item) => item.id === questionId)
    const item = complete.data?.review.find((entry) => entry.questionId === questionId)
    return {
      questionId,
      label: chatContextLabel({
        number: position + 1,
        lessonTitle: lesson.title,
        prompt: questions[position].prompt,
        answer: item?.answer ?? null,
        answerLabel: 'Bạn viết',
        score: item ? `${scoreText(item)} điểm` : null,
      }),
    }
  }

  useEffect(() => {
    if (result) nextButton.current?.focus()
  }, [result])

  useEffect(() => {
    if (complete.isSuccess) resultHeading.current?.querySelector('h2')?.focus()
  }, [complete.isSuccess])

  useEffect(() => {
    if (finishing) pendingHeading.current?.focus()
  }, [finishing])

  async function check() {
    const text = draft.trim()
    if (!text || checking) return
    setChecking(true)
    setCheckError(null)
    try {
      const response = await answerWriting(attemptId, { questionId: question.id, answer: text })
      setAnswers((previous) => new Map(previous).set(question.id, text))
      setResults((previous) => new Map(previous).set(question.id, response))
      markAttemptsStale(queryClient)
    } catch (error) {
      setCheckError(
        error.status === 409
          ? 'Câu này đã được gửi trước đó. Tải lại trang để xem kết quả.'
          : describeApiError(error, 'Chưa gửi được câu trả lời. Hãy thử lại.'),
      )
    } finally {
      setChecking(false)
    }
  }

  /** Sends a saved answer to the AI again; the new result, or null when the request itself failed. */
  async function regrade(questionId) {
    setRegrading((previous) => new Set(previous).add(questionId))
    setRegradeErrors((previous) => {
      const next = new Map(previous)
      next.delete(questionId)
      return next
    })
    try {
      const response = await regradeWriting(attemptId, questionId)
      setResults((previous) => new Map(previous).set(questionId, response))
      return response
    } catch (error) {
      setRegradeErrors((previous) => new Map(previous).set(questionId, describeApiError(error, 'Chưa gửi được. Hãy thử lại.')))
      return null
    } finally {
      setRegrading((previous) => {
        const next = new Set(previous)
        next.delete(questionId)
        return next
      })
    }
  }

  /** Branch 14a: every answer not graded yet, one after the other; once none is left the attempt is completed. */
  async function regradeAll() {
    let stillPending = 0
    for (const questionId of pendingIds) {
      const response = await regrade(questionId)
      if (!response?.graded) stillPending += 1
    }
    if (stillPending === 0) complete.mutate({ responses: [] })
  }

  function next() {
    if (isLast) {
      if (pendingIds.length > 0) setFinishing(true)
      else complete.mutate({ responses: [] })
      return
    }
    setIndex(index + 1)
    setDraft('')
    setCheckError(null)
  }

  function submit(event) {
    event.preventDefault()
    if (result) next()
    else check()
  }

  if (complete.isSuccess) {
    const summary = complete.data
    const earned = formatTotal(summary.earnedPoints)
    const total = formatTotal(summary.totalPoints)
    return (
      <Page title={lesson.title} width="focus" className="pb-20" heading={<ExerciseHeading skill={lesson.skill} title={lesson.title} />}>
        <div ref={resultHeading} className="flex flex-col gap-6">
          <ResultCard
            skill={lesson.skill}
            ring={
              <ScoreRing fraction={summary.totalPoints ? summary.earnedPoints / summary.totalPoints : 0} label={`Đạt ${earned} trên ${total} điểm`}>
                {earned}/{total}
              </ScoreRing>
            }
            title="Hoàn thành bài tập"
            details={`Điểm ${summary.scorePercent}% · Cao nhất ${summary.bestScorePercent}%`}
            isPersonalBest={summary.isPersonalBest}
            nextLesson={nextLesson}
            onRestart={onRestart}
            restarting={restarting}
            restartError={restartError}
          />
          <WritingReview
            lesson={lesson}
            review={summary.review}
            onAsk={(questionId) => {
              onChatContext(reviewContext(questionId))
              onAskAssistant()
            }}
          />
        </div>
      </Page>
    )
  }

  const heading = (
    <ExerciseHeading
      skill={lesson.skill}
      title={lesson.title}
      aside={
        <span className="font-mono text-label font-semibold text-ink-soft">
          Câu {index + 1}/{questions.length}
        </span>
      }
    />
  )
  const outcomes = questions.map((item) => writingOutcome(results.get(item.id)))

  if (finishing) {
    const working = regrading.size > 0 || complete.isPending
    return (
      <Page title={lesson.title} width="focus" className="pb-20" heading={heading}>
        <QuestionProgress outcomes={outcomes} current={-1} />
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 ref={pendingHeading} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">
              Chưa có tổng điểm
            </h2>
            <p aria-live="polite" className="text-body text-ink-soft">
              {pendingIds.length > 0
                ? `Còn ${pendingIds.length} câu chưa chấm. Bài chỉ có tổng điểm khi mọi câu đã được trợ lý AI chấm.`
                : 'Mọi câu đã được chấm.'}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-label">
            {questions.map((item, position) => {
              const outcome = results.get(item.id)
              return (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-ink-soft">Câu {position + 1}</span>
                  <span className={isPending(outcome) ? 'font-semibold text-danger' : 'text-ink'}>
                    {isPending(outcome) ? 'Chưa chấm' : outcome ? `${scoreText(outcome)} điểm` : 'Chưa trả lời'}
                  </span>
                </li>
              )
            })}
          </ul>
          {regradeErrors.size > 0 && <Alert variant="error">Chưa gửi được {regradeErrors.size} câu. Hãy thử lại.</Alert>}
          {complete.isError && <Alert variant="error">{describeApiError(complete.error, 'Chưa nộp được bài. Hãy thử lại.')}</Alert>}
          <div className="flex flex-wrap gap-3">
            {pendingIds.length > 0 ? (
              <Button onClick={regradeAll} loading={working}>
                Gửi chấm lại các câu chưa chấm
              </Button>
            ) : (
              <Button onClick={() => complete.mutate({ responses: [] })} loading={complete.isPending}>
                Xem kết quả
              </Button>
            )}
            <Button variant="outline" onClick={() => setFinishing(false)} disabled={working}>
              ← Quay lại bài làm
            </Button>
          </div>
        </Card>
      </Page>
    )
  }

  const pendingDone = progress.responses.filter(isPending).length
  const resumeDetail = `${progress.responses.length}/${questions.length} câu đã trả lời${pendingDone ? `, ${pendingDone} câu chưa chấm` : ''}`

  return (
    <Page title={lesson.title} width="focus" className="pb-20" heading={heading}>
      {progress.resumed && <ResumeNotice detail={resumeDetail} onRestart={onRestart} restarting={restarting} restartError={restartError} />}
      <QuestionProgress outcomes={outcomes} current={index} />

      <form key={question.id} onSubmit={submit} className="flex animate-screen-in flex-col gap-5">
        <WritingPrompt question={question} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor={answerId} className="text-label font-medium text-ink-soft">
            Câu trả lời của bạn
          </label>
          <textarea
            id={answerId}
            lang={question.type === 'PARAGRAPH_TRANSLATION' ? 'vi' : 'en'}
            rows={question.type === 'PARAGRAPH_TRANSLATION' ? 10 : 3}
            maxLength={MAX_WRITING_LENGTH}
            autoFocus={!result}
            spellCheck={false}
            value={result ? (sent ?? '') : draft}
            disabled={Boolean(result) || checking}
            placeholder={question.type === 'PARAGRAPH_TRANSLATION'
              ? 'Viết bản dịch tiếng Việt của bạn'
              : question.starter ? `${question.starter} …` : 'Viết câu trả lời bằng tiếng Anh'}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter starts a new line; Ctrl+Enter checks, like a chat box.
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                event.currentTarget.form.requestSubmit()
              }
            }}
            className="w-full resize-y rounded-lg border border-line bg-white px-4 py-3 text-body text-ink outline-none transition-colors placeholder:text-muted-light focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:bg-surface-alt disabled:text-ink"
          />
          {result && <p className="text-xs text-muted">Câu đã gửi không sửa được trong lượt này. Muốn viết lại, bấm “Làm lại” ở cuối bài.</p>}
        </div>

        {question.hint && !result && <HintToggle hint={question.hint} />}

        <div aria-live="polite">
          {result && (
            <WritingFeedback
              result={result}
              onRegrade={() => regrade(question.id)}
              regrading={regrading.has(question.id)}
              regradeError={regradeErrors.get(question.id) ?? null}
            >
              <button
                type="button"
                onClick={onAskAssistant}
                className="cursor-pointer self-start text-label font-semibold text-brand-dark hover:text-brand"
              >
                Hỏi trợ lý AI về câu này →
              </button>
            </WritingFeedback>
          )}
        </div>

        {checkError && <Alert variant="error">{checkError}</Alert>}
        {complete.isError && (
          <Alert variant="error">{describeApiError(complete.error, 'Chưa nộp được bài. Bấm "Xem kết quả" để thử lại.')}</Alert>
        )}

        <Button
          ref={nextButton}
          type="submit"
          disabled={!result && !draft.trim()}
          loading={checking || complete.isPending}
          className="disabled:bg-line disabled:opacity-100"
        >
          {checking ? 'Đang chấm…' : !result ? 'Kiểm tra' : isLast ? 'Xem kết quả' : 'Câu tiếp theo →'}
        </Button>
      </form>
    </Page>
  )
}
