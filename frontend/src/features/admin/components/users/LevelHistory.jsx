import { cx } from '@/lib/cx'
import { formatFullDate, levelLabel } from '../../utils/format'
import { Panel } from '../Panel'

/**
 * "Lịch sử trình độ": each level change, newest first, down to the registration.
 *
 * @param {{ items: import('../../types').AdminUserDetail['levelHistory'] }} props
 */
export function LevelHistory({ items }) {
  return (
    <Panel title="Lịch sử trình độ">
      <ol className="flex flex-col">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.changedAt}-${index}`} className="flex gap-3.5">
              <div aria-hidden="true" className="flex flex-col items-center">
                <span className={cx('mt-1 size-3 rounded-full', index === 0 && item.level ? 'bg-brand-dark' : 'bg-line')} />
                {!last && <span className="w-0.5 flex-1 bg-line" />}
              </div>
              <div className={cx('flex flex-col gap-0.5', !last && 'pb-4')}>
                <strong className={cx('text-sm', item.level ? 'text-ink' : 'text-ink-soft')}>{levelLabel(item.level)}</strong>
                <span className="text-xs text-muted-strong">
                  {formatFullDate(item.changedAt)} · {item.source}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

/**
 * "Kế hoạch học": the learner's current plan, if any.
 *
 * @param {{ plan: import('../../types').AdminUserDetail['plan'] }} props
 */
export function PlanSummary({ plan }) {
  return (
    <Panel title="Kế hoạch học">
      {plan ? (
        <p className="text-sm text-ink-soft">
          <strong className="text-ink">{plan.title}</strong> · tuần {plan.currentWeek}/{plan.weekCount}
          {plan.status === 'PAUSED' && ' · đang tạm dừng'}
        </p>
      ) : (
        <p className="text-sm text-ink-soft">Chưa có kế hoạch học.</p>
      )}
    </Panel>
  )
}
