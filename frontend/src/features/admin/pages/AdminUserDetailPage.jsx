import { useState } from 'react'
import { useParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { useToast } from '@/components/ui/toastContext'
import { formatDayMonth } from '@/lib/dates'
import { getInitials } from '@/lib/personName'
import { cx } from '@/lib/cx'
import { useAdminUser, useSetUserStatus } from '../api/adminQueries'
import { AdminPage } from '../components/AdminPage'
import { LevelTag } from '../components/controls'
import { describeActivityTime, describeLastActive, formatFullDate, levelLabel } from '../format'

const CARD = 'flex flex-col gap-3.5 rounded-xl border border-line bg-white px-5.5 py-5'

/** Scenario 24, steps 2–5: a learner's profile, lock and unlock. */
export function AdminUserDetailPage() {
  const userId = Number(useParams().userId)
  const user = useAdminUser(userId)
  const [confirming, setConfirming] = useState(null) // 'LOCKED' | 'ACTIVE'

  if (user.isPending) return <DetailSkeleton />
  if (user.isError) {
    const notFound = user.error?.status === 404
    return (
      <AdminPage title={notFound ? 'Không tìm thấy người dùng' : 'Người dùng'} breadcrumb={[{ label: 'Người dùng', to: '/admin/users' }]}>
        {notFound ? (
          <Alert variant="error">Người dùng này không tồn tại hoặc không phải tài khoản người học.</Alert>
        ) : (
          <LoadError error={user.error} onRetry={user.refetch} message="Không tải được hồ sơ người dùng. Vui lòng thử lại." />
        )}
      </AdminPage>
    )
  }

  const learner = user.data
  const locked = learner.status === 'LOCKED'

  return (
    <AdminPage title={learner.fullName} breadcrumb={[{ label: 'Người dùng', to: '/admin/users' }]} titleInContent>
      <section aria-label="Hồ sơ" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center gap-5">
          <span
            aria-hidden="true"
            className={cx(
              'flex size-16 flex-none items-center justify-center rounded-full text-[22px] font-bold',
              locked ? 'bg-canvas text-ink-soft' : 'bg-brand-soft text-brand-ink',
            )}
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
            <Button variant="strong" size="xs" onClick={() => setConfirming('ACTIVE')}>
              Mở khóa
            </Button>
          ) : (
            <Button variant="dangerOutline" size="xs" onClick={() => setConfirming('LOCKED')}>
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <StudyStats stats={learner.stats} />
          <RecentActivity items={learner.recentActivity} />
        </div>
        <div className="flex flex-col gap-4">
          <LevelHistory items={learner.levelHistory} />
          <section aria-labelledby="plan-title" className={CARD}>
            <h2 id="plan-title" className="text-base font-bold text-ink">
              Kế hoạch học
            </h2>
            {learner.plan ? (
              <p className="text-sm text-ink-soft">
                <strong className="text-ink">{learner.plan.title}</strong> · tuần {learner.plan.currentWeek}/{learner.plan.weekCount}
                {learner.plan.status === 'PAUSED' && ' · đang tạm dừng'}
              </p>
            ) : (
              <p className="text-sm text-ink-soft">Chưa có kế hoạch học.</p>
            )}
          </section>
        </div>
      </div>

      <StatusDialog learner={learner} status={confirming} onClose={() => setConfirming(null)} />
    </AdminPage>
  )
}

function StatusDialog({ learner, status, onClose }) {
  const setStatus = useSetUserStatus()
  const toast = useToast()
  const locking = status === 'LOCKED'

  function close() {
    setStatus.reset()
    onClose()
  }

  function confirm() {
    setStatus.mutate(
      { id: learner.id, status },
      {
        onSuccess: () => {
          toast(locking ? `Đã khóa tài khoản ${learner.fullName}` : `Đã mở khóa tài khoản ${learner.fullName}`)
          close()
        },
      },
    )
  }

  return (
    <Dialog open={status !== null} onClose={close} title={locking ? `Khóa tài khoản ${learner.fullName}?` : `Mở khóa tài khoản ${learner.fullName}?`}>
      {locking ? (
        <>
          <p className="-mt-2 text-label text-muted-strong">{learner.email}</p>
          <ul className="flex flex-col gap-2.5 text-sm leading-5.5 text-ink-soft">
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 flex-none rounded-full bg-danger" />
              <span>
                Người học bị <strong className="text-ink">đăng xuất ngay</strong> trên mọi thiết bị.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 flex-none rounded-full bg-danger" />
              <span>Không đăng nhập được; màn đăng nhập báo tài khoản đã bị khóa.</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 flex-none rounded-full bg-brand-dark" />
              <span>
                Toàn bộ dữ liệu học tập <strong className="text-ink">được giữ nguyên</strong>; mở khóa là học tiếp được.
              </span>
            </li>
          </ul>
        </>
      ) : (
        <p className="text-sm leading-5.5 text-ink-soft">Người học đăng nhập lại được bình thường và học tiếp với dữ liệu cũ.</p>
      )}
      {setStatus.isError && (
        <Alert variant="error">
          {setStatus.error?.status === 403
            ? 'Không thể khóa tài khoản quản trị.'
            : describeApiError(setStatus.error, locking ? 'Chưa khóa được tài khoản. Vui lòng thử lại.' : 'Chưa mở khóa được tài khoản. Vui lòng thử lại.')}
        </Alert>
      )}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={close}>
          Hủy
        </Button>
        <Button variant={locking ? 'danger' : 'strong'} size="xs" loading={setStatus.isPending} onClick={confirm}>
          {locking ? 'Khóa tài khoản' : 'Mở khóa'}
        </Button>
      </div>
    </Dialog>
  )
}

function StudyStats({ stats }) {
  const items = [
    ['Từ đã học', stats.wordsLearned, `${stats.wordsMastered} từ đã thuộc`],
    ['Chuỗi ngày học', stats.streakDays, stats.lastStudyDate ? `học gần nhất ${formatDayMonth(stats.lastStudyDate)}` : 'chưa học ngày nào'],
    ['Bài tập hoàn thành', stats.exercisesCompleted, stats.exerciseAverageScore === null ? 'chưa có điểm' : `điểm TB ${stats.exerciseAverageScore}%`],
    ['Bài kiểm tra đã nộp', stats.testsSubmitted, stats.lastTestDate ? `gần nhất ${formatDayMonth(stats.lastTestDate)}` : 'chưa làm bài nào'],
  ]
  return (
    <section aria-labelledby="study-title" className={CARD}>
      <h2 id="study-title" className="text-base font-bold text-ink">
        Học tập
      </h2>
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {items.map(([label, value, note]) => (
          <div key={label} className="flex flex-col rounded-[10px] bg-surface-alt px-4 py-3.5">
            <dt className="text-xs text-muted-strong">{label}</dt>
            <dd className="mt-1.5 text-2xl font-bold text-ink">{value}</dd>
            <dd className="mt-0.5 text-xs text-muted-strong">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function activityText(item) {
  switch (item.type) {
    case 'CHAT':
      return <>{item.title}{item.detail && ` · ${item.detail}`}</>
    case 'EXERCISE':
      return <>Bài tập <strong>{item.title}</strong>{item.detail && ` · ${item.detail}`}</>
    case 'GAME':
      return <>Trò chơi <strong>{item.title}</strong>{item.detail && ` · ${item.detail}`}</>
    case 'TEST':
      return <><strong>{item.title}</strong>{item.detail && ` · ${item.detail}`}</>
    default:
      return <>{item.title}{item.detail && ` · ${item.detail}`}</>
  }
}

function RecentActivity({ items }) {
  return (
    <section aria-labelledby="recent-title" className={cx(CARD, 'gap-1.5')}>
      <h2 id="recent-title" className="mb-1.5 text-base font-bold text-ink">
        Hoạt động gần đây
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">Chưa có hoạt động nào.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item, index) => (
            <li key={`${item.at}-${index}`} className="flex flex-col gap-1 border-b border-canvas py-3 text-label leading-4.5 last:border-b-0 sm:flex-row sm:gap-4">
              <span className="w-30 flex-none text-muted-strong">{describeActivityTime(item.at)}</span>
              <span className="text-ink">{activityText(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function LevelHistory({ items }) {
  return (
    <section aria-labelledby="level-title" className={CARD}>
      <h2 id="level-title" className="text-base font-bold text-ink">
        Lịch sử trình độ
      </h2>
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
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-400 animate-fade-in-late flex-col gap-5">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-center gap-5 rounded-xl border border-line bg-white p-6">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

