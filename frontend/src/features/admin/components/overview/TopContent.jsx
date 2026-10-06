import { Link } from 'react-router'
import { paths } from '@/config/paths'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { SKILL_LABELS } from '../../constants'
import { TABLE, TD, TH } from '../controls'
import { Panel } from '../Panel'

/** "Chủ đề từ vựng", "Bài đọc hiểu", "Đề kiểm tra". */
function typeLabel(row) {
  if (row.type === 'TOPIC') return 'Chủ đề từ vựng'
  if (row.type === 'TEST') return 'Đề kiểm tra'
  return `Bài ${(SKILL_LABELS[row.skill] ?? 'tập').toLocaleLowerCase('vi')}`
}

const LINKS = { TOPIC: paths.adminTopic, EXERCISE: paths.adminLesson, TEST: paths.adminTest }

/**
 * Scenario 26, step 4: "Nội dung được học nhiều nhất", topics, lessons and tests together, by number of learners
 * (ContentStat of the design).
 *
 * @param {{ rows: import('../../types').ContentStat[] }} props
 */
export function TopContent({ rows }) {
  return (
    <Panel title="Nội dung được học nhiều nhất" aside={rows.length > 0 && 'theo số người học'} flush>
      {rows.length === 0 ? (
        <p className="px-5.5 pb-5 text-sm text-ink-soft">Chưa có lượt học nào trong kỳ này.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className={cx(TABLE, 'min-w-130')}>
            <thead className="bg-surface-alt">
              <tr>
                <th scope="col" className={TH}>
                  STT
                </th>
                <th scope="col" className={TH}>
                  Nội dung
                </th>
                <th scope="col" className={TH}>
                  Loại
                </th>
                <th scope="col" className={cx(TH, 'text-right')}>
                  Số lượt học
                </th>
                <th scope="col" className={cx(TH, 'text-right')}>
                  Số người học
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.type}-${row.id}`} className="[&:last-child>td]:border-b-0">
                  <td className={cx(TD, 'w-12 text-muted-strong')}>{index + 1}</td>
                  <td className={TD}>
                    <Link to={LINKS[row.type](row.id)} className="font-semibold text-ink">
                      {row.name}
                    </Link>
                  </td>
                  <td className={cx(TD, 'whitespace-nowrap text-ink-soft')}>{typeLabel(row)}</td>
                  <td className={cx(TD, 'text-right')}>{formatCount(row.attemptCount)}</td>
                  <td className={cx(TD, 'text-right font-bold text-ink')}>{formatCount(row.learnerCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
