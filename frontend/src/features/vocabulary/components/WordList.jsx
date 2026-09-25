import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { isLearned } from '../constants'

function LearnedMark({ status }) {
  const learned = isLearned(status)

  return (
    <span
      className={cx(
        'flex size-5 flex-none items-center justify-center rounded-full text-tag font-semibold',
        learned ? 'bg-success-solid text-white' : 'border border-line',
      )}
    >
      {learned && <span aria-hidden="true">✓</span>}
      <span className="sr-only">{learned ? 'Đã học' : 'Chưa học'}</span>
    </span>
  )
}

function LevelTag(word) {
  return (
    <Tag variant="brand" title={`Trình độ ${word.difficultyLevel}`}>
      {word.difficultyLevel}
    </Tag>
  )
}

const ROW = 'flex items-center gap-3 py-3.5'

// The design's white box with one word per row. When the box is wide (a wide screen), the rows flow into two or three
// columns, sized by the box itself (container queries), so the same list fits a narrow side column or a full page.
// Every row has a bottom line; the white ::after strip covers the lines of the last row, whichever row that is.
const BOX =
  '@container relative rounded-xl border border-line bg-white px-5 py-1.5 after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:bg-white'
const COLUMNS = 'grid gap-x-8 @3xl:grid-cols-2 @6xl:grid-cols-3'
const ITEM = 'min-w-0 border-b border-canvas'

/**
 * One word per row, as in the design's topic page: learned mark, "word — meaning", and the CEFR level.
 *
 * @param {object} props
 * @param {import('../types').VocabularyItem[]} props.words
 * @param {(word: import('../types').VocabularyItem) => string | undefined} [props.describe] extra line under a word
 *   (the topic name in search results)
 * @param {(word: import('../types').VocabularyItem) => string | undefined} [props.linkTo] makes rows links
 * @param {object} [props.linkState] router state passed with those links
 * @param {(word: import('../types').VocabularyItem) => import('react').ReactNode} [props.aside] right-hand content
 *   of a row; the CEFR level by default
 */
export function WordList({ words, describe, linkTo, linkState, aside = LevelTag }) {
  return (
    <div className={BOX}>
      <ul className={COLUMNS}>
        {words.map((word) => {
          const detail = describe?.(word)
          const to = linkTo?.(word)
          const content = (
            <>
              <LearnedMark status={word.learningStatus} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  <span lang="en">{word.word}</span> — {word.meaning}
                </p>
                {detail && <p className="text-xs text-muted">{detail}</p>}
              </div>
              {aside(word)}
            </>
          )

          return (
            <li key={word.id} className={ITEM}>
              {to ? (
                <Link to={to} state={linkState} className={cx(ROW, 'rounded-md hover:bg-surface-alt')}>
                  {content}
                </Link>
              ) : (
                <div className={ROW}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function WordListSkeleton({ rows = 6 }) {
  return (
    <div aria-hidden="true" className={BOX}>
      <div className={COLUMNS}>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className={cx(ITEM, 'flex items-center gap-3 py-3.5')}>
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
