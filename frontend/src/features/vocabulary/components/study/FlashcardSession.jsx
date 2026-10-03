import { useEffect } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { canSpeak, pronounce, stopPronouncing } from '@/lib/speech'
import { useAutoSpeak } from '../../hooks/useAutoSpeak'
import { useFlashcardSession } from '../../hooks/useFlashcardSession'
import { Flashcard } from './Flashcard'
import { RatingButtons } from './RatingButtons'
import { SessionComplete } from './SessionComplete'
import { SessionProgress } from './SessionProgress'

/**
 * One study session on screen: progress, the card, the rating buttons, then the summary. The rules (what flipping,
 * rating and the keyboard do) are in useFlashcardSession.
 *
 * @param {object} props
 * @param {import('../../types').LearningCard[]} props.cards
 * @param {string} props.summaryTitle heading of the summary card
 * @param {string} props.backTo
 * @param {string} props.backLabel
 * @param {() => void} props.onContinue starts a new session from the same source
 */
export function FlashcardSession({ cards, summaryTitle, backTo, backLabel, onContinue }) {
  const { card, index, flipped, results, done, flip, rate, end, review } = useFlashcardSession(cards)
  const [autoSpeak, setAutoSpeak] = useAutoSpeak()

  // Read each new word aloud when it appears ("phát âm tự động").
  useEffect(() => {
    if (!done && autoSpeak) pronounce(card.word, { audioUrl: card.audioUrl })
  }, [card, done, autoSpeak])
  useEffect(() => stopPronouncing, [])

  if (done) {
    return (
      <SessionComplete title={summaryTitle} results={results} backTo={backTo} backLabel={backLabel} onContinue={onContinue} />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SessionProgress results={results} total={cards.length} onFinish={end} />

      <p className="sr-only" aria-live="polite">
        {flipped ? `Nghĩa: ${card.meaning}` : `Thẻ ${index + 1} trên ${cards.length}: ${card.word}`}
      </p>

      <Flashcard key={card.id} card={card} flipped={flipped} onFlip={flip} />

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
