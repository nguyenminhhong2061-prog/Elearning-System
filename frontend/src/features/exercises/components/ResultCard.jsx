import { useId } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { lessonPath, skillPath } from '../constants'

/**
 * The design's "Hoàn thành bài tập" card: score ring, title, a line of details, then "Làm lại" and "Bài tiếp theo".
 * Without a next lesson the second button goes back to the list.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.ring
 * @param {string} props.title
 * @param {import('react').ReactNode} props.details
 * @param {boolean} [props.isPersonalBest]
 * @param {import('../types').Skill} props.skill
 * @param {{ id: number, title: string } | null} props.nextLesson
 * @param {() => void} props.onRestart
 * @param {boolean} [props.restarting]
 * @param {unknown} [props.restartError]
 * @param {string} [props.restartLabel]
 */
export function ResultCard({
  ring,
  title,
  details,
  isPersonalBest = false,
  skill,
  nextLesson,
  onRestart,
  restarting = false,
  restartError = null,
  restartLabel = 'Làm lại',
}) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto flex w-full max-w-113 animate-screen-in flex-col items-center gap-4 rounded-2xl border border-line bg-white p-9 text-center"
    >
      {ring}
      {isPersonalBest && <Tag variant="warning">Kỷ lục mới!</Tag>}
      <h2 id={titleId} tabIndex={-1} className="text-xl font-bold text-ink outline-none">
        {title}
      </h2>
      <div className="text-label text-muted">{details}</div>
      {restartError && (
        <p role="alert" className="text-label font-semibold text-danger">
          {describeApiError(restartError, 'Chưa bắt đầu lại được. Vui lòng thử lại.')}
        </p>
      )}
      <div className="flex w-full gap-2">
        <Button variant="outline" size="sm" className="flex-1" loading={restarting} onClick={onRestart}>
          {restartLabel}
        </Button>
        {nextLesson ? (
          <ButtonLink to={lessonPath(nextLesson.id)} size="sm" className="flex-1" title={nextLesson.title}>
            Bài tiếp theo
          </ButtonLink>
        ) : (
          <ButtonLink to={skillPath(skill)} size="sm" className="flex-1">
            Về danh sách
          </ButtonLink>
        )}
      </div>
    </section>
  )
}
