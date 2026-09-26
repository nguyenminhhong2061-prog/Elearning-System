import { Link } from 'react-router'
import { useAuth } from '@/features/auth/context/useAuth'
import { useCurrentAttempt, useLessons } from '@/features/exercises/api/exercisesQueries'
import { SKILL_INFO, lessonPath } from '@/features/exercises/constants'
import { nextLesson } from '../chart'

function DarkCard({ to, title, detail, action }) {
  return (
    <Link
      to={to}
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-sidebar px-5 py-5 text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-6.5"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-[19px] leading-6 font-semibold">{title}</span>
        <span className="text-label text-muted-light">{detail}</span>
      </span>
      <span className="rounded-lg bg-brand px-5.5 py-3 text-sm font-semibold">{action}</span>
    </Link>
  )
}

/**
 * The design's "Tiếp tục" card: the unfinished lesson the learner worked on last, opened where they left it
 * (docs/api/exercises.md). With nothing unfinished it suggests the next grammar lesson instead ("Học tiếp"); with no
 * such lesson, or while loading, it is not shown.
 */
export function ContinueCard() {
  const { user } = useAuth()
  const current = useCurrentAttempt()
  const suggest = current.isSuccess && current.data === null
  const lessons = useLessons(suggest ? 'GRAMMAR' : null)

  if (current.data) {
    const { lesson, doneCount } = current.data
    const { tab, unit } = SKILL_INFO[lesson.skill]
    const left = lesson.itemCount - doneCount
    const progress = `Đã làm ${doneCount}/${lesson.itemCount} ${unit}`
    return (
      <DarkCard
        to={lessonPath(lesson.id)}
        title={`Tiếp tục: ${lesson.title}`}
        detail={`${tab} · ${progress} · ${left > 0 ? `còn ${left} ${unit}` : 'bấm để xem kết quả'}`}
        action="Tiếp tục học →"
      />
    )
  }

  const next = suggest && lessons.data ? nextLesson(lessons.data, user.currentLevel) : null
  if (!next) return null
  const size = [`${next.itemCount} ${SKILL_INFO[next.skill].unit}`, next.estimatedMinutes && `khoảng ${next.estimatedMinutes} phút`].filter(Boolean)
  return (
    <DarkCard
      to={lessonPath(next.id)}
      title={`Học tiếp: ${next.title}`}
      detail={[SKILL_INFO[next.skill].tab, next.cefrLevel, ...size].join(' · ')}
      action="Bắt đầu →"
    />
  )
}
