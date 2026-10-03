import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { cx } from '@/lib/cx'
import { useCheckAnswer } from '../api/gamesQueries'
import { FEEDBACK_MS } from '../constants'
import { elapsedSince } from '../utils/clock'

const OPTION =
  'min-h-14 cursor-pointer rounded-[10px] px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default'

function optionStyle(optionId, feedback) {
  if (!feedback) return 'bg-white/92 text-brand-dark hover:bg-white'
  if (optionId === feedback.correctOptionId) return 'bg-review-remembered text-white'
  if (optionId === feedback.chosenId) return 'bg-review-forgot text-white'
  return 'bg-white/60 text-brand-dark'
}

/**
 * GUESS_MEANING and QUICK_QUIZ: one prompt, four choices, one answer per question. The choice is checked with the
 * server (the round carries no answers), coloured right or wrong, then the next question follows.
 *
 * @param {object} props
 * @param {import('../types').GameRound} props.round
 * @param {(answer: { questionId: number, optionId: number, correct: boolean, correctOptionId: number | null, points: number, responseTimeMs: number }) => void} props.onAnswer
 * @param {() => void} props.onComplete after the last question
 */
export function ChoiceRound({ round, onAnswer, onComplete }) {
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState(null) // { chosenId, correctOptionId, correct }
  const check = useCheckAnswer(round.gameId)
  const shownAt = useRef(0)
  const question = round.questions[index]

  async function choose(option) {
    if (feedback || check.isPending) return
    try {
      const result = await check.mutateAsync({ playToken: round.playToken, questionId: question.id, optionId: option.id })
      const correctOptionId = result.correctOptionId ?? (result.correct ? option.id : null)
      setFeedback({ chosenId: option.id, correctOptionId, correct: result.correct })
      onAnswer({
        questionId: question.id,
        optionId: option.id,
        correct: result.correct,
        correctOptionId,
        points: question.points,
        responseTimeMs: elapsedSince(shownAt.current),
      })
    } catch {
      // Shown below; the learner simply chooses again.
    }
  }

  // Response time is measured from when each question appears.
  useEffect(() => {
    shownAt.current = Date.now()
  }, [index])

  // After the colours have been seen, move on.
  const advance = useEffectEvent(() => {
    if (index + 1 < round.questions.length) {
      setIndex(index + 1)
      setFeedback(null)
    } else {
      onComplete()
    }
  })
  useEffect(() => {
    if (!feedback) return undefined
    const timer = setTimeout(advance, FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [feedback])

  // Keys 1-4 pick an option.
  const onKey = useEffectEvent((event) => {
    const position = Number(event.key) - 1
    if (Number.isInteger(position) && question.options[position] && !event.ctrlKey && !event.metaKey && !event.altKey) {
      choose(question.options[position])
    }
  })
  useEffect(() => {
    const listener = (event) => onKey(event)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-label font-semibold text-white/85">
        Câu {index + 1}/{round.questions.length}
      </p>
      <div className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-[10px] bg-white/12 px-4 py-5 text-center">
        <p lang="en" className="text-[28px] leading-9 font-bold break-words text-white">
          {question.prompt}
        </p>
        {question.phonetic && <p className="font-mono text-sm text-white/80">{question.phonetic}</p>}
      </div>
      <div role="group" aria-label="Chọn nghĩa đúng" className="grid gap-2.5 sm:grid-cols-2">
        {question.options.map((option, position) => (
          <button
            key={option.id}
            type="button"
            lang="vi"
            disabled={Boolean(feedback) || check.isPending}
            aria-keyshortcuts={String(position + 1)}
            onClick={() => choose(option)}
            className={cx(OPTION, optionStyle(option.id, feedback))}
          >
            {option.content}
          </button>
        ))}
      </div>
      <p aria-live="assertive" className="min-h-5 text-label font-semibold text-white">
        {feedback ? (feedback.correct ? 'Chính xác!' : 'Chưa đúng, đáp án đúng được tô xanh.') : ''}
      </p>
      {check.isError && (
        <p role="alert" className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-danger">
          {describeApiError(check.error, 'Không kiểm tra được đáp án. Hãy chọn lại.')}
        </p>
      )}
    </div>
  )
}
