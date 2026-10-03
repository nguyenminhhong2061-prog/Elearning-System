import { Link } from 'react-router'
import { paths } from '@/config/paths'
import { addDays, formatDayMonth } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { isoWeek } from '../../utils/format'
import { Panel } from '../Panel'

const TONES = {
  warning: 'bg-warning-bg text-warning hover:text-warning',
  danger: 'bg-danger-bg text-danger hover:text-danger',
  neutral: 'bg-canvas text-ink-soft hover:text-ink',
}

/** [tone, text, link] of each thing to fix, most urgent kinds last as in the design. */
function itemsOf(attention) {
  return [
    attention.wordsMissingAudio > 0 && ['warning', `${formatCount(attention.wordsMissingAudio)} từ chưa có audio phát âm`, paths.adminMissingWords('AUDIO')],
    attention.wordsMissingExample > 0 && ['warning', `${formatCount(attention.wordsMissingExample)} từ chưa có câu ví dụ`, paths.adminMissingWords('EXAMPLE')],
    ...attention.lessonsWithIssues.map((lesson) => [
      'danger',
      lesson.issue === 'MISSING_AUDIO' ? `Bài nghe “${lesson.title}” thiếu file audio` : `Bài “${lesson.title}” chưa có câu hỏi`,
      paths.adminLesson(lesson.lessonId),
    ]),
    attention.periodicTestGap && [
      'danger',
      `Chưa có đề định kỳ tuần ${isoWeek(attention.periodicTestGap.weekEnd)} (đề hiện tại đóng ${formatDayMonth(addDays(attention.periodicTestGap.weekStart, -1))})`,
      paths.adminTests,
    ],
    attention.lockedUsers > 0 && ['neutral', `${attention.lockedUsers} tài khoản đang bị khóa`, paths.adminLockedUsers],
  ].filter(Boolean)
}

/**
 * "Cần chú ý": things to fix whatever the period, each one a link to the page where it is fixed.
 *
 * @param {{ attention: import('../../types').AdminStats['attention'] }} props
 */
export function Attention({ attention }) {
  const items = itemsOf(attention)
  return (
    <Panel title="Cần chú ý">
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">Không có việc cần xử lý.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(([tone, text, to]) => (
            <li key={text}>
              <Link to={to} className={cx('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-label leading-4.25 font-semibold', TONES[tone])}>
                <span className="flex-1">{text}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
