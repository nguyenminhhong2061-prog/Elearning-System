import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { getInitials } from '@/lib/personName'
import { cx } from '@/lib/cx'
import { describeLastActive, formatFullDate } from '../../utils/format'
import { LevelTag } from '../controls'

/**
 * Scenario 25, step 6: name, e-mail, level, account state and the lock or unlock button.
 *
 * @param {{ learner: import('../../types').AdminUserDetail, onChangeStatus: (status: 'LOCKED' | 'ACTIVE') => void }} props
 */
export function ProfileCard({ learner, onChangeStatus }) {
  const locked = learner.status === 'LOCKED'
  return (
    <section aria-label="Hồ sơ" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center gap-5">
        <span
          aria-hidden="true"
          className={cx('flex size-16 flex-none items-center justify-center rounded-full text-[22px] font-bold', locked ? 'bg-canvas text-ink-soft' : 'bg-brand-soft text-brand-ink')}
        >
          {getInitials(learner.fullName)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-title font-bold text-ink">{learner.fullName}</h1>
            <LevelTag level={learner.currentLevel} />
            <Tag variant={locked ? 'danger' : 'success'}>{locked ? 'Đã khóa' : 'Đang hoạt động'}</Tag>
          </div>
          <p className="text-sm text-ink-soft">{learner.email} · Người học</p>
          <p className="text-label leading-4.5 text-muted-strong">
            Đăng ký {formatFullDate(learner.createdAt)} · Hoạt động gần nhất:{' '}
            {learner.lastActiveAt ? describeLastActive(learner.lastActiveAt, { lowercase: true }) : 'chưa hoạt động'}
          </p>
        </div>
        {locked ? (
          <Button variant="strong" size="xs" onClick={() => onChangeStatus('ACTIVE')}>
            Mở khóa
          </Button>
        ) : (
          <Button variant="dangerOutline" size="xs" onClick={() => onChangeStatus('LOCKED')}>
            Khóa tài khoản
          </Button>
        )}
      </div>
      {locked && (
        <p role="note" className="rounded-[10px] border border-danger-solid/30 bg-danger-bg px-4 py-3 text-label leading-5 font-semibold text-danger">
          Tài khoản đang bị khóa: người học không đăng nhập được và các phiên đăng nhập cũ đã bị kết thúc. Dữ liệu học tập vẫn được giữ nguyên.
        </p>
      )}
    </section>
  )
}
