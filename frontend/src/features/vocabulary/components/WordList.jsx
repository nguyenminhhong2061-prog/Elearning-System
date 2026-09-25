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
    <ul className="rounded-xl border border-line bg-white px-5 py-1.5">
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
          <li key={word.id} className="border-b border-canvas last:border-b-0">
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
  )
}

export function WordListSkeleton({ rows = 5 }) {
  return (
    <div aria-hidden="true" className="rounded-xl border border-line bg-white px-5 py-1.5">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-canvas py-3.5 last:border-b-0">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      ))}
    </div>
  )
}
