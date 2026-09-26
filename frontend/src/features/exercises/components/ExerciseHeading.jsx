import { Link } from 'react-router'
import { SKILL_INFO, skillPath } from '../constants'

/**
 * Top of an exercise screen: the design's "← Bài tập nghe hiểu" back link with an optional counter on the right
 * ("Câu 3/10"), then the lesson title.
 *
 * @param {{ skill: import('../types').Skill, title: string, aside?: import('react').ReactNode }} props
 */
export function ExerciseHeading({ skill, title, aside }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Link to={skillPath(skill)} className="text-label font-medium">
          ← {SKILL_INFO[skill].title}
        </Link>
        {aside}
      </div>
      <h1 className="text-[22px] leading-7 font-bold text-ink">{title}</h1>
    </div>
  )
}
