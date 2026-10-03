import { ButtonLink } from '@/components/ui/Button'
import { cx } from '@/lib/cx'
import { studyableCount } from '../utils/learning'

// Full width under the title on small screens (as in the design), beside the title on large ones.
const WIDTH = 'w-full lg:w-auto lg:min-w-80 lg:max-w-100'

/**
 * The study button of a topic or a personal list ("Học 30 từ →"). Once every word has been learned and none is due,
 * a note takes its place; an empty topic or list shows nothing.
 *
 * @param {object} props
 * @param {{ wordCount: number, learnedCount: number, dueCount: number }} props.counts the topic or list
 * @param {string} props.to the study page
 * @param {string} props.finishedMessage the note shown when there is nothing to study
 * @param {import('react').ReactNode} props.children the button's label
 */
export function StudyButton({ counts, to, finishedMessage, children }) {
  if (counts.wordCount === 0) return null

  if (studyableCount(counts) === 0) {
    return (
      <p className={cx(WIDTH, 'rounded-lg border border-dashed border-line px-4 py-3 text-label text-muted')}>
        {finishedMessage}
      </p>
    )
  }

  return (
    <ButtonLink to={to} className={WIDTH}>
      {children}
    </ButtonLink>
  )
}
