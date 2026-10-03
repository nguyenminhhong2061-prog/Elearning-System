import { useEffect, useEffectEvent, useState } from 'react'
import { useSubmitReview } from '../api/learningQueries'
import { REVIEW_OPTIONS } from '../constants'

// Text fields keep every key; other controls (buttons, links, the checkbox) keep Space and Enter for themselves.
const TEXT_ENTRY = 'input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'
const isTyping = (target) => target instanceof HTMLElement && target.closest(TEXT_ENTRY)
const isControl = (target) => target instanceof HTMLElement && target.closest('button, a, input, label')

/**
 * The rules of one flashcard session over `cards`: flip, self-assess, next. Every rating is saved as soon as it is
 * given, so leaving halfway keeps the progress of the cards already rated (the exception case of A1). Space or Enter
 * flips the card, 1/2/3 rate it.
 *
 * @param {import('../types').LearningCard[]} cards
 * @returns {{
 *   card: import('../types').LearningCard | undefined, index: number, flipped: boolean, results: string[],
 *   done: boolean, flip: () => void, rate: (result: string) => void, end: () => void,
 *   review: import('@tanstack/react-query').UseMutationResult,
 * }} `results` holds the ratings given so far, in order; `review` the saving of the last one (pending, error)
 */
export function useFlashcardSession(cards) {
  const [index, setIndex] = useState(0)
  // "Kết thúc" ends the session early; the card on screen is not counted (scenario 5, step 13).
  const [ended, setEnded] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState([])
  const review = useSubmitReview()

  const done = ended || index >= cards.length
  const card = cards[index]

  const flip = () => setFlipped((previous) => !previous)
  const end = () => setEnded(true)

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

  // useEffectEvent sees the latest state while the listener is attached only once.
  const handleKeyDown = useEffectEvent((event) => {
    if (done || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return
    if (event.key === ' ' || event.key === 'Enter') {
      if (isControl(event.target)) return
      event.preventDefault()
      flip()
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

  return { card, index, flipped, results, done, flip, rate, end, review }
}
