import { Link } from 'react-router'
import { cx } from '@/lib/cx'
import { SKILL_INFO, SKILL_ORDER, skillPath } from '../constants'

/**
 * The design's pill tabs of the exercise section (Đọc hiểu / Viết / Nghe hiểu / Phát âm, scenario 9 step 2). Each tab is a link, so the chosen
 * skill lives in the URL (?skill=) and survives reloads and the back button, like the vocabulary tabs.
 *
 * @param {{ current: import('../types').Skill }} props
 */
export function SkillTabs({ current }) {
  return (
    <nav aria-label="Kỹ năng" className="flex flex-wrap gap-2">
      {SKILL_ORDER.map((skill) => {
        const selected = skill === current
        return (
          <Link
            key={skill}
            to={skillPath(skill)}
            aria-current={selected ? 'page' : undefined}
            className={cx(
              'rounded-full px-3.5 py-2 text-label font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              selected ? 'bg-brand text-white hover:text-white' : 'text-ink-soft hover:bg-white hover:text-ink',
            )}
          >
            {SKILL_INFO[skill].tab}
          </Link>
        )
      })}
    </nav>
  )
}
