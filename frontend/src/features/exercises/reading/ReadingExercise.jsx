import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ChoiceOptions } from '@/components/ui/ChoiceOptions'
import { TextField } from '@/components/ui/TextField'
import { cx } from '@/lib/cx'
import { answerQuestion } from '../api/exercisesApi'
import { markAttemptsStale, useCompleteAttempt } from '../api/exercisesQueries'
import { AnswerFeedback } from '../components/AnswerFeedback'
import { ExerciseHeading } from '../components/ExerciseHeading'
import { HintToggle } from '../components/HintToggle'
import { QuestionProgress } from '../components/QuestionProgress'
import { ResultCard } from '../components/ResultCard'
import { ResumeNotice } from '../components/ResumeNotice'
import { ScoreRing } from '../components/ScoreRing'
import { answerText, chatContextLabel } from '../chat/contextLabel'
import { PassagePanel } from './PassagePanel'
import { ReadingReview } from './ReadingReview'

const EMPTY_CHOICE = { optionId: null, answer: '' }

function toResponse(question, choice) {
  return question.type === 'FILL_BLANK'
    ? { questionId: question.id, answer: choice.answer.trim() }
    : { questionId: question.id, optionId: choice.optionId }
}

function hasChoice(question, choice) {
  return question.type === 'FILL_BLANK' ? choice.answer.trim().length > 0 : choice.optionId !== null
}

/**
 * Where a picked-up attempt stands: the answers already graded (review items carry the same fields as a grading
 * result) and the first question still open, or the last one when every question was answered.
 */
function resumeState(questions, responses) {
  const graded = new Map(responses.map((item) => [item.questionId, item]))
  const choices = new Map(responses.map((item) => [item.questionId, { optionId: item.optionId, answer: item.answer ?? '' }]))
  const firstOpen = questions.findIndex((question) => !graded.has(question.id))
  const index = firstOpen === -1 ? questions.length - 1 : firstOpen
  return { graded, choices, index, choice: choices.get(questions[index].id) ?? EMPTY_CHOICE }
}

/**
 * Reading (scenario 9): one question at a time, grammar multiple choice, fill in the blank, or a question about a
 * passage, which then shows in a left column. The learner picks or types an answer and presses "Kiểm tra"; the server
 * grades it at once and returns the right answer and the explanation. After the last question the attempt is
 * completed and the score shown, with every question to go over. A picked-up attempt opens at the first question not
 * answered yet.
 *
 * @param {object} props
 * @param {import('../types').Lesson} props.lesson
 * @param {number} props.attemptId
 * @param {import('../types').AttemptProgress} props.progress what was already done when the attempt was picked up
 * @param {{ id: number, title: string } | null} props.nextLesson
 * @param {() => void} props.onRestart
 * @param {boolean} props.restarting
 * @param {unknown} props.restartError
 * @param {(context: { questionId?: number }) => void} props.onChatContext
 * @param {() => void} props.onAskAssistant
 */
export function ReadingExercise({ lesson, attemptId, progress, nextLesson, onRestart, restarting, restartError, onChatContext, onAskAssistant }) {
  const questions = lesson.questions
  const passages = lesson.readingPassages ?? []
  const [resumed] = useState(() => resumeState(questions, progress.responses))
  const [index, setIndex] = useState(resumed.index)
  const [choice, setChoice] = useState(resumed.choice)
  const [choices, setChoices] = useState(resumed.choices) // questionId -> what the learner answered
  const [graded, setGraded] = useState(resumed.graded) // questionId -> ResponseResult
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState(null)
  const complete = useCompleteAttempt(attemptId)
  const queryClient = useQueryClient()
  const nextButton = useRef(null)
  const resultHeading = useRef(null)

  const question = questions[index]
  const passage = passages.find((candidate) => candidate.id === question.passageId) ?? null
  const result = graded.get(question.id) ?? null
  const isLast = index === questions.length - 1

  // The assistant is told which question is on screen, so its answer is about this one. On the result there is no
  // single question: the review items below ask about their own.
  const chosen = choices.get(question.id)
  useEffect(() => {
    if (complete.isSuccess) {
      onChatContext({})
      return
    }
    const label = chatContextLabel({
      number: index + 1,
      lessonTitle: lesson.title,
      prompt: question.prompt,
      answer: result ? answerText(question, chosen) : null,
      correct: result?.correct ?? null,
    })
    onChatContext({ questionId: question.id, label })
  }, [complete.isSuccess, question, index, lesson.title, result, chosen, onChatContext])

  /** The context of a question asked about from the review list. */
  function reviewContext(questionId) {
    const position = questions.findIndex((item) => item.id === questionId)
    const item = questions[position]
    const outcome = graded.get(questionId) ?? complete.data?.review.find((entry) => entry.questionId === questionId)
    return {
      questionId,
      label: chatContextLabel({
        number: position + 1,
        lessonTitle: lesson.title,
        prompt: item.prompt,
        answer: answerText(item, choices.get(questionId)),
        correct: outcome?.correct ?? null,
      }),
    }
  }

  // Once graded, focus goes to "Câu tiếp theo" so Enter moves on (the feedback is announced by the live region).
  useEffect(() => {
    if (result) nextButton.current?.focus()
  }, [result])

  useEffect(() => {
    if (complete.isSuccess) resultHeading.current?.querySelector('h2')?.focus()
  }, [complete.isSuccess])

  async function check() {
    if (!hasChoice(question, choice) || checking) return
    setChecking(true)
    setCheckError(null)
    try {
      const response = await answerQuestion(attemptId, toResponse(question, choice))
      setChoices((previous) => new Map(previous).set(question.id, choice))
      setGraded((previous) => new Map(previous).set(question.id, response))
      markAttemptsStale(queryClient)
    } catch (error) {
      setCheckError(describeApiError(error, 'Chưa gửi được câu trả lời. Hãy thử lại.'))
    } finally {
      setChecking(false)
    }
  }

  function next() {
    if (isLast) {
      complete.mutate({ responses: [] })
      return
    }
    setIndex(index + 1)
    setChoice(EMPTY_CHOICE)
    setCheckError(null)
  }

  function submit(event) {
    event.preventDefault()
    if (result) next()
    else check()
  }

  // Keys 1-9 pick an answer of a multiple-choice question, unless the learner is typing somewhere.
  const onKey = useEffectEvent((event) => {
    if (result || question.type !== 'MULTIPLE_CHOICE' || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof HTMLElement && event.target.closest('input[type="text"], textarea')) return
    const option = question.options[Number(event.key) - 1]
    if (option) setChoice({ ...EMPTY_CHOICE, optionId: option.id })
  })
  useEffect(() => {
    const listener = (event) => onKey(event)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  if (complete.isSuccess) {
    const summary = complete.data
    return (
      <Page title={lesson.title} width="focus" className="pb-20" heading={<ExerciseHeading skill={lesson.skill} title={lesson.title} />}>
        <div ref={resultHeading} className="flex flex-col gap-6">
          <ResultCard
            skill={lesson.skill}
            ring={
              <ScoreRing
                fraction={summary.questionCount ? summary.correctCount / summary.questionCount : 0}
                label={`Đúng ${summary.correctCount} trên ${summary.questionCount} câu`}
              >
                {summary.correctCount}/{summary.questionCount}
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
          <ReadingReview
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

  const outcomes = questions.map((item) => graded.get(item.id)?.correct)
  const ready = hasChoice(question, choice)

  const form = (
    <form
      key={question.id}
      onSubmit={submit}
      onKeyDown={(event) => {
        // Enter on a focused radio button does not submit a form by itself.
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type === 'radio') {
          event.preventDefault()
          event.currentTarget.requestSubmit()
        }
      }}
      className="flex min-w-0 animate-screen-in flex-col gap-5"
    >
      <p lang="en" className="text-[19px] leading-relaxed font-semibold text-ink">
        {question.prompt}
      </p>

      {question.type === 'FILL_BLANK' ? (
        <TextField
          label="Đáp án của bạn"
          placeholder="Nhập từ còn thiếu"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          lang="en"
          maxLength={200}
          autoFocus
          value={choice.answer}
          disabled={Boolean(result)}
          onChange={(event) => setChoice({ ...EMPTY_CHOICE, answer: event.target.value })}
        />
      ) : (
        <ChoiceOptions
          name={`question-${question.id}`}
          label={question.prompt}
          options={question.options}
          selectedId={result ? (choices.get(question.id)?.optionId ?? null) : choice.optionId}
          onSelect={(optionId) => setChoice({ ...EMPTY_CHOICE, optionId })}
          graded={result}
          shortcuts
        />
      )}

      {question.hint && !result && <HintToggle hint={question.hint} />}

      <div aria-live="polite">
        {result && (
          <AnswerFeedback correct={result.correct} correctAnswer={result.correctAnswer} explanation={result.explanation}>
            <button
              type="button"
              onClick={onAskAssistant}
              className="cursor-pointer self-start text-label font-semibold text-brand-dark hover:text-brand"
            >
              Hỏi trợ lý AI về câu này →
            </button>
          </AnswerFeedback>
        )}
      </div>

      {checkError && <Alert variant="error">{checkError}</Alert>}
      {complete.isError && (
        <Alert variant="error">{describeApiError(complete.error, 'Chưa nộp được bài. Bấm "Xem kết quả" để thử lại.')}</Alert>
      )}

      <Button
        ref={nextButton}
        type="submit"
        disabled={!result && !ready}
        loading={checking || complete.isPending}
        className="disabled:bg-line disabled:opacity-100"
      >
        {!result ? 'Kiểm tra' : isLast ? 'Xem kết quả' : 'Câu tiếp theo →'}
      </Button>
    </form>
  )

  return (
    <Page
      title={lesson.title}
      // A lesson with passages needs room for the passage beside its questions (scenario 9, step 13).
      width={passages.length > 0 ? 'medium' : 'focus'}
      className="pb-20"
      heading={
        <ExerciseHeading
          skill={lesson.skill}
          title={lesson.title}
          aside={
            <span className="font-mono text-label font-semibold text-ink-soft">
              Câu {index + 1}/{questions.length}
            </span>
          }
        />
      }
    >
      {progress.resumed && (
        <ResumeNotice
          detail={`${progress.responses.length}/${questions.length} câu đã trả lời`}
          onRestart={onRestart}
          restarting={restarting}
          restartError={restartError}
        />
      )}
      <QuestionProgress outcomes={outcomes} current={index} />

      {passage ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <PassagePanel key={passage.id} passage={passage} />
          {form}
        </div>
      ) : (
        <div className={cx(passages.length > 0 && 'mx-auto w-full max-w-130')}>{form}</div>
      )}
    </Page>
  )
}
