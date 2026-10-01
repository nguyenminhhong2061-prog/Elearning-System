import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { DIFFICULTY, SKILL_INFO, lessonPath } from '../constants'

function describeSize(lesson) {
  const parts = [`${lesson.itemCount} ${SKILL_INFO[lesson.skill].unit}`]
  if (lesson.estimatedMinutes) parts.push(`khoảng ${lesson.estimatedMinutes} phút`)
  return parts.join(' · ')
}

/**
 * One lesson of the list, as the design's white card: title and difficulty, then its size, and "Đang làm dở" when an
 * attempt can be picked up. Below, the learner's best score as a bar ("mức độ hoàn thành" of B1), or "Chưa làm".
 *
 * @param {{ lesson: import('../types').LessonSummary }} props
 */
/**
 * Bottom line of a card. Pronunciation says how many items were practised and listening the latest result (scenarios
 * 11 and 12), when the server sends them; otherwise, and for the other skills, the best score as a bar.
 */
function Standing({ lesson }) {
  const { attemptCount, bestScorePercent, practicedCount, lastResult } = lesson.progress
  if (lesson.skill === 'PRONUNCIATION' && practicedCount !== undefined && practicedCount !== null) {
    return practicedCount === 0 ? (
      <span className="text-xs font-semibold text-muted-light">Chưa luyện</span>
    ) : (
      <span className="text-xs font-semibold text-brand-dark">
        Đã luyện {practicedCount}/{lesson.itemCount} mục
      </span>
    )
  }
  if (lesson.skill === 'LISTENING' && lastResult !== undefined) {
    return lastResult ? (
      <span className="text-xs font-semibold text-brand-dark">
        Gần nhất {lastResult.correctCount}/{lastResult.questionCount}
      </span>
    ) : (
      <span className="text-xs font-semibold text-muted-light">Chưa làm</span>
    )
  }
  if (attemptCount === 0) return <span className="text-xs font-semibold text-muted-light">Chưa làm</span>
  return (
    <>
      <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${bestScorePercent}%` }} />
      </span>
      <span className="text-xs font-semibold text-brand-dark">
        Tốt nhất {bestScorePercent}% · {attemptCount} lần
      </span>
    </>
  )
}

export function LessonCard({ lesson }) {
  const difficulty = DIFFICULTY[lesson.difficulty]

  return (
    <Link
      to={lessonPath(lesson.id)}
      className="flex h-full flex-col gap-1.5 rounded-[10px] border border-line bg-white p-4 text-ink transition-colors hover:border-brand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-body font-semibold">{lesson.title}</span>
        {difficulty && <Tag variant={difficulty.variant}>{difficulty.label}</Tag>}
      </span>
      {lesson.description && <span className="line-clamp-2 text-label text-muted">{lesson.description}</span>}
      <span className="text-label text-muted">{describeSize(lesson)}</span>
      {lesson.progress.inProgress && (
        <Tag variant="warning" className="self-start">
          Đang làm dở · {lesson.progress.inProgress.doneCount}/{lesson.itemCount} {SKILL_INFO[lesson.skill].unit}
        </Tag>
      )}
      <span className="mt-auto flex items-center gap-2.5 pt-1.5">
        <Standing lesson={lesson} />
      </span>
    </Link>
  )
}

export function LessonCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-line bg-white p-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-1.5 w-full" />
    </div>
  )
}
