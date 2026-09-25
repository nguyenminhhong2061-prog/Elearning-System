import { useEffect, useEffectEvent, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { canSpeak, pronounce, stopPronouncing } from '@/lib/speech'
import { useSubmitReview } from '../api/learningQueries'
import { REVIEW_OPTIONS } from '../constants'
import { Flashcard } from './Flashcard'
import { RatingButtons } from './RatingButtons'
import { SessionComplete } from './SessionComplete'
import { SessionProgress } from './SessionProgress'
import { useAutoSpeak } from './useAutoSpeak'

// Text fields keep every key; other controls (buttons, links, the checkbox) keep Space and Enter for themselves.
const TEXT_ENTRY = 'input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'
const isTyping = (target) => target instanceof HTMLElement && target.closest(TEXT_ENTRY)
const isControl = (target) => target instanceof HTMLElement && target.closest('button, a, input, label')

/**
 * Runs one study session over `cards`: flip, self-assess, next. Every rating is saved as soon as it is given, so
 * leaving halfway keeps the progress of the cards already rated (the exception case of A1).
 *
 * @param {object} props
 * @param {import('../types').LearningCard[]} props.cards
 * @param {string} props.backTo
 * @param {string} props.backLabel
 * @param {() => void} props.onContinue starts a new session from the same source
 */
export function FlashcardSession({ cards, backTo, backLabel, onContinue }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState([])
  const [autoSpeak, setAutoSpeak] = useAutoSpeak()
  const review = useSubmitReview()

  const done = index >= cards.length
  const card = cards[index]

  async function rate(result) {
    if (!flipped || done || review.isPending) return
    try {
      await review.mutateAsync({ vocabularyId: card.id, result })
    } catch {
      return // shown below the buttons; the learner can simply rate again
    }
    setResults((previous) => [...previous, result])
    setIndex((previous) => previous + 1)
    setFlipped(false)
  }

  // Space/Enter flips, 1/2/3 rate. useEffectEvent sees the latest state while the listener is attached only once.
  const handleKeyDown = useEffectEvent((event) => {
    if (done || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return
    if (event.key === ' ' || event.key === 'Enter') {
      if (isControl(event.target)) return
      event.preventDefault()
      setFlipped((previous) => !previous)
      return
    }
    const option = REVIEW_OPTIONS.find((candidate) => candidate.shortcut === event.key)
    if (option && flipped) {
      event.preventDefault()
      rate(option.value)
    }
  })
  useEffect(() => {
    const listener = (event) => handleKeyDown(event)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  // Read each new word aloud when it appears ("phát âm tự động").
  useEffect(() => {
    if (!done && autoSpeak) pronounce(card.word, { audioUrl: card.audioUrl })
  }, [card, done, autoSpeak])
  useEffect(() => stopPronouncing, [])

  if (done) {
    return <SessionComplete results={results} backTo={backTo} backLabel={backLabel} onContinue={onContinue} />
  }

  return (
    <div className="flex flex-col gap-5">
      <SessionProgress results={results} total={cards.length} backTo={backTo} />

      <p className="sr-only" aria-live="polite">
        {flipped ? `Nghĩa: ${card.meaning}` : `Thẻ ${index + 1} trên ${cards.length}: ${card.word}`}
      </p>

      <Flashcard key={card.id} card={card} flipped={flipped} onFlip={() => setFlipped((previous) => !previous)} />

      {flipped ? (
        <RatingButtons onRate={rate} busy={review.isPending} />
      ) : (
        <p className="flex min-h-11.5 items-center justify-center rounded-lg border border-dashed border-line text-label text-muted">
          Lật thẻ để tự đánh giá mức độ nhớ
        </p>
      )}

      {review.isError && (
        <Alert variant="error">
          {describeApiError(review.error, 'Chưa lưu được kết quả của thẻ này. Vui lòng đánh giá lại.')}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-light">
        <span className="hidden sm:inline">Phím tắt: Space lật thẻ · 1 Chưa nhớ · 2 Nhớ mơ hồ · 3 Nhớ rõ</span>
        {(canSpeak() || card.audioUrl) && (
          <label className="flex cursor-pointer items-center gap-1.5 text-muted">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(event) => setAutoSpeak(event.target.checked)}
              className="size-3.5 accent-brand"
            />
            Tự động phát âm
          </label>
        )}
      </div>
    </div>
  )
}
