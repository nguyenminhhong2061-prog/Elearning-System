import { cx } from '@/lib/cx'
import { pronounce } from '@/lib/speech'

function SpeakButton({ card, className }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        // The card itself flips on click; listening must not flip it.
        event.stopPropagation()
        pronounce(card.word, { audioUrl: card.audioUrl })
      }}
      className={cx(
        'cursor-pointer rounded-md px-2 py-1 text-label font-semibold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand',
        className,
      )}
    >
      <span aria-hidden="true">🔊 </span>Nghe phát âm
    </button>
  )
}

/** One side of the card. Both sides share a grid cell, so the card is as tall as the taller side. */
function Face({ hidden, back, children }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={cx(
        'col-start-1 row-start-1 flex min-h-77 flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-white p-6 text-center 2xl:min-h-100',
        'shadow-[0_2px_10px_rgba(22,33,31,0.06)] [backface-visibility:hidden]',
        back && '[transform:rotateY(180deg)]',
      )}
    >
      {children}
    </div>
  )
}

/**
 * The two-sided card of the design. Clicking anywhere on it flips it (mouse and touch); keyboard users press Space
 * (see FlashcardSession) or the "Bấm vào thẻ để lật" button, which is a real button.
 *
 * @param {object} props
 * @param {import('../types').LearningCard} props.card
 * @param {boolean} props.flipped
 * @param {() => void} props.onFlip
 */
export function Flashcard({ card, flipped, onFlip }) {
  return (
    <div className="[perspective:1200px]">
      <div
        onClick={onFlip}
        className={cx(
          'grid cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        <Face hidden={flipped}>
          <p lang="en" className="text-card font-bold break-words text-ink">
            {card.word}
          </p>
          <SpeakButton card={card} />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onFlip()
            }}
            className="cursor-pointer rounded-md px-2 py-1 text-label text-muted-light hover:text-muted focus-visible:outline-2 focus-visible:outline-brand"
          >
            Bấm vào thẻ để lật
          </button>
        </Face>

        <Face hidden={!flipped} back>
          <div className="flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-1">
            <span lang="en" className="text-title font-bold break-words text-ink">
              {card.word}
            </span>
            {card.phonetic && <span className="font-mono text-sm text-muted">{card.phonetic}</span>}
          </div>
          <p className="text-[17px] leading-6 font-semibold text-brand-dark">{card.meaning}</p>
          {card.imageUrl && <img src={card.imageUrl} alt="" className="max-h-32 rounded-lg object-cover" />}
          {card.exampleSentence && (
            <p lang="en" className="text-label leading-[1.6] text-muted">
              “{card.exampleSentence}”
            </p>
          )}
          <SpeakButton card={card} className="text-xs" />
        </Face>
      </div>
    </div>
  )
}
