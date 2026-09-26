import { Link } from 'react-router'
import { CEFR_LEVELS } from '@/api/constants'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'
import { TESTS_PATH } from '../constants'

const STATES = {
  done: { circle: 'bg-brand text-white', caption: 'font-medium text-ink-soft', label: 'Đạt' },
  current: { circle: 'border-2 border-brand bg-white text-brand-dark', caption: 'font-bold text-brand-dark', label: 'Hiện tại' },
  todo: { circle: 'border border-dashed border-muted-light bg-surface-alt text-ink-soft', caption: 'font-medium text-ink-soft', label: 'Chưa đạt' },
}

/**
 * "Hành trình trình độ" (the design's "Huy hiệu theo trình độ"): the six CEFR levels, levels below the learner's
 * current one reached. Levels are not badges of the badges table; they come from users.current_level, which the
 * comprehensive test sets (docs/api/progress.md, "Gợi ý giải pháp" 3).
 */
export function LevelJourney() {
  const { user } = useAuth()
  const current = user.currentLevel ? CEFR_LEVELS.indexOf(user.currentLevel) : -1
  const reached = Math.max(0, current)

  return (
    <section aria-labelledby="levels-title" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="levels-title" className="text-lg font-semibold text-ink">
          Hành trình trình độ
        </h2>
        <span className={cx('text-label font-semibold', reached > 0 ? 'text-brand-dark' : 'text-ink-soft')}>
          {reached}/{CEFR_LEVELS.length} đã đạt
        </span>
      </div>
      <ol className="grid grid-cols-6 gap-1 sm:gap-2">
        {CEFR_LEVELS.map((level, index) => {
          const state = STATES[index < current ? 'done' : index === current ? 'current' : 'todo']
          return (
            <li key={level} aria-current={index === current ? 'step' : undefined} className="flex flex-col items-center gap-2">
              <span className={cx('flex size-10 items-center justify-center rounded-full text-label font-bold sm:size-12', state.circle)}>{level}</span>
              <span className={cx('text-center text-xs', state.caption)}>{state.label}</span>
            </li>
          )
        })}
      </ol>
      <p className="text-label text-ink-soft">
        {user.currentLevel
          ? 'Trình độ lấy từ bài kiểm tra tổng hợp gần nhất. Mỗi kỹ năng có trình độ riêng, xem ở biểu đồ kỹ năng.'
          : 'Hệ thống chưa biết trình độ của bạn. Làm bài kiểm tra tổng hợp để xác định trình độ bắt đầu.'}
      </p>
      <Link to={TESTS_PATH} className="self-start text-label font-semibold">
        {user.currentLevel ? 'Làm lại bài kiểm tra tổng hợp →' : 'Làm bài kiểm tra tổng hợp →'}
      </Link>
    </section>
  )
}
