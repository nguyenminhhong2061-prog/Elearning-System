import { CEFR_LEVELS } from '@/api/constants'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { Panel } from '../Panel'

/**
 * "Trình độ người học": how many learners are at each level, and how many have none yet.
 *
 * @param {{ levels: Record<string, number> }} props
 */
export function LevelBreakdown({ levels }) {
  const rows = [...CEFR_LEVELS.map((level) => [level, level, levels[level] ?? 0]), ['NONE', 'Chưa xác định', levels.NONE ?? 0]]
  const total = rows.reduce((sum, [, , count]) => sum + count, 0)
  const max = Math.max(...rows.map(([, , count]) => count), 1)
  return (
    <Panel title="Trình độ người học" aside={`${formatCount(total)} người`}>
      <ul className="flex flex-col gap-2.75">
        {rows.map(([key, label, count]) => (
          <li key={key} className="flex items-center gap-2.5 text-label">
            <span className={cx('w-24 flex-none font-semibold', key === 'NONE' ? 'text-ink-soft' : 'text-ink')}>{label}</span>
            <span aria-hidden="true" className="flex h-2.5 flex-1 rounded-full bg-canvas">
              <span className={cx('rounded-full', key === 'NONE' ? 'bg-muted-light' : 'bg-brand')} style={{ width: `${(count / max) * 100}%` }} />
            </span>
            <span className="w-8 flex-none text-right text-ink-soft">{count}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-strong">Trình độ đổi sau mỗi bài kiểm tra tổng hợp.</p>
    </Panel>
  )
}
