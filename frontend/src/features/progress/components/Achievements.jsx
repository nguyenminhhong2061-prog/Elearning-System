import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, todayInVietnam } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { useBadges } from '../api/progressQueries'
import { BADGE_UNITS } from '../constants'

// Stroke icons per kind of badge, used when a badge has no image of its own (iconUrl null).
const ICON_PATHS = {
  STREAK_DAYS: 'M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z',
  WORDS_LEARNED: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13',
  PERFECT_SCORE: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
}

function BadgeIcon({ badge, earned, size }) {
  const box = size === 'lg' ? 'size-11' : 'size-8'
  return (
    <span className={cx('flex flex-none items-center justify-center rounded-full', box, earned ? 'bg-brand-tint text-brand-dark' : 'bg-canvas text-ink-soft')}>
      {badge.iconUrl ? (
        <img src={badge.iconUrl} alt="" className="size-2/3 object-contain" />
      ) : (
        <svg width={size === 'lg' ? 22 : 16} height={size === 'lg' ? 22 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ICON_PATHS[badge.condition.type]} />
        </svg>
      )}
    </span>
  )
}

const earnedDate = (badge) => formatDate(todayInVietnam(new Date(badge.earnedAt)))

function EarnedTile({ badge }) {
  return (
    <li className="flex flex-col items-center gap-1.5 text-center">
      <BadgeIcon badge={badge} earned size="lg" />
      <span className="text-xs leading-4 font-semibold text-ink">{badge.name}</span>
      <span className="text-tag text-muted">{earnedDate(badge)}</span>
    </li>
  )
}

/** A badge not reached yet, with how far the learner is ("14/30 ngày"). */
function ProgressRow({ badge }) {
  const { value, type } = badge.condition
  const percent = Math.round((badge.progress / value) * 100)
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5">
      <span className="row-span-2">
        <BadgeIcon badge={badge} earned={false} />
      </span>
      <span className="text-label font-semibold text-ink">{badge.name}</span>
      <span className="text-xs text-ink-soft">
        {badge.progress}/{value} {BADGE_UNITS[type]}
      </span>
      <span
        role="progressbar"
        aria-label={badge.name}
        aria-valuemin={0}
        aria-valuemax={value}
        aria-valuenow={badge.progress}
        className="col-span-2 h-1.5 overflow-hidden rounded-full bg-canvas"
      >
        <span className="block h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </span>
    </li>
  )
}

function AllBadges({ badges, onClose }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex max-h-[60vh] flex-col gap-3.5 overflow-y-auto">
        {badges.map((badge) =>
          badge.earnedAt ? (
            <li key={badge.id} className="flex items-center gap-2.5">
              <BadgeIcon badge={badge} earned />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-label font-semibold text-ink">{badge.name}</span>
                {badge.description && <span className="text-xs text-muted">{badge.description}</span>}
              </span>
              <span className="text-xs font-semibold text-brand-dark">Đạt {earnedDate(badge)}</span>
            </li>
          ) : (
            <ProgressRow key={badge.id} badge={badge} />
          ),
        )}
      </ul>
      <Button variant="outline" onClick={onClose} className="self-end">
        Đóng
      </Button>
    </div>
  )
}

/** D1 "huy hiệu đã đạt và sắp đạt": the latest badges earned, the three closest to being earned, and the full list. */
export function Achievements() {
  const badges = useBadges()
  const [open, setOpen] = useState(false)
  const list = badges.data

  let body
  if (!list && badges.isError) {
    body = <LoadError error={badges.error} onRetry={() => badges.refetch()} message="Không tải được thành tích." />
  } else if (!list) {
    body = <Skeleton className="h-40 w-full rounded-lg" />
  } else {
    const earned = list.filter((badge) => badge.earnedAt)
    const upcoming = list.filter((badge) => !badge.earnedAt).slice(0, 3)
    body = (
      <>
        {earned.length > 0 ? (
          <>
            <h3 className="text-label font-semibold text-muted">Đạt gần đây</h3>
            <ul className="grid grid-cols-4 gap-2.5">
              {earned.slice(0, 4).map((badge) => (
                <EarnedTile key={badge.id} badge={badge} />
              ))}
            </ul>
          </>
        ) : (
          <p className="text-label text-ink-soft">Chưa có thành tích nào. Đây là những thành tích gần bạn nhất:</p>
        )}
        {upcoming.length > 0 && (
          <>
            <h3 className="text-label font-semibold text-muted">Sắp đạt</h3>
            <ul className="flex flex-col gap-3">
              {upcoming.map((badge) => (
                <ProgressRow key={badge.id} badge={badge} />
              ))}
            </ul>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="self-start">
          Xem tất cả thành tích
        </Button>
        <Dialog open={open} onClose={() => setOpen(false)} title={`Thành tích · ${earned.length}/${list.length} đã đạt`}>
          <AllBadges badges={list} onClose={() => setOpen(false)} />
        </Dialog>
      </>
    )
  }

  return (
    <section aria-labelledby="badges-title" className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="badges-title" className="text-lg font-semibold text-ink">
          Thành tích
        </h2>
        {list && (
          <span className="text-label font-semibold text-brand-dark">
            {list.filter((badge) => badge.earnedAt).length}/{list.length} đã đạt
          </span>
        )}
      </div>
      {body}
    </section>
  )
}
