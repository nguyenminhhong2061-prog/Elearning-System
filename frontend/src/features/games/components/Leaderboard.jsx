import { useId, useState } from 'react'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'
import { formatMoment } from '@/lib/dates'
import { formatCount } from '@/lib/format'
import { getInitials } from '@/lib/personName'
import { useLeaderboard } from '../api/gamesQueries'

const PERIODS = [
  { value: 'WEEK', label: 'Tuần', title: 'Bảng xếp hạng tuần', empty: 'tuần này' },
  { value: 'MONTH', label: 'Tháng', title: 'Bảng xếp hạng tháng', empty: 'tháng này' },
]

// Podium of the design, drawn in the order 2, 1, 3. The first place's orange is darkened for white text.
const PODIUM = {
  1: { avatar: 'size-12 bg-review-vague text-white', name: 'text-xs font-bold', bar: 'h-14.5 bg-review-vague text-sm' },
  2: { avatar: 'size-10 bg-line text-ink', name: 'text-tag font-semibold', bar: 'h-10 bg-muted text-xs' },
  3: { avatar: 'size-9 bg-line text-ink', name: 'text-tag font-semibold', bar: 'h-7.5 bg-ink-soft text-xs' },
}

function PodiumPlace({ entry, isMe }) {
  const style = PODIUM[entry.rank]
  return (
    <li className="flex flex-col items-center gap-1.5">
      <span aria-hidden="true" className={cx('flex items-center justify-center rounded-full text-xs font-bold', style.avatar)}>
        {getInitials(entry.displayName)}
      </span>
      <span className={cx('max-w-18 truncate text-white', style.name)}>{isMe ? 'Bạn' : entry.displayName}</span>
      <span
        aria-hidden="true"
        className={cx('flex w-12.5 items-center justify-center rounded-t-md font-bold text-white', style.bar)}
      >
        {entry.rank}
      </span>
      <span className="sr-only">
        Hạng {entry.rank}, {formatCount(entry.totalScore)} điểm
      </span>
    </li>
  )
}

function Row({ rank, name, score, highlight }) {
  return (
    <li
      className={cx(
        'flex items-center gap-3 border-b border-canvas px-5 py-3 last:border-b-0',
        highlight && 'border-t border-t-brand-tint-line bg-brand-tint',
      )}
    >
      <span className={cx('w-6 text-label', highlight ? 'font-bold text-brand-dark' : 'font-semibold text-muted')}>{rank}</span>
      <span
        aria-hidden="true"
        className={cx(
          'flex size-6.5 flex-none items-center justify-center rounded-full text-xs font-semibold',
          highlight ? 'bg-brand text-white' : 'bg-canvas text-ink-soft',
        )}
      >
        {getInitials(name)}
      </span>
      <span className={cx('flex-1 truncate text-sm text-ink', highlight ? 'font-semibold' : 'font-medium')}>{name}</span>
      <span className="text-sm font-bold text-ink-soft">{formatCount(score)}</span>
    </li>
  )
}

/**
 * The design's "Bảng xếp hạng tuần" card, with a week/month switch. The server keeps it as a cache refreshed by a
 * batch job, so it says when it was last updated.
 */
export function Leaderboard({ className }) {
  const [period, setPeriod] = useState('WEEK')
  const board = useLeaderboard(period)
  const { user } = useAuth()
  const titleId = useId()
  const current = PERIODS.find((option) => option.value === period)

  let content
  if (board.isPending) {
    content = <Skeleton className="m-5 h-40" />
  } else if (board.isError) {
    content = (
      <div className="p-5">
        <LoadError error={board.error} onRetry={() => board.refetch()} message="Không tải được bảng xếp hạng." />
      </div>
    )
  } else {
    const { entries, me, updatedAt } = board.data
    const podium = [2, 1, 3].map((rank) => entries.find((entry) => entry.rank === rank)).filter(Boolean)
    const others = entries.filter((entry) => entry.rank > 3)
    const meInTop = entries.some((entry) => entry.userId === user.id)

    content =
      entries.length === 0 ? (
        <p className="p-5 text-sm text-muted">Chưa có ai ghi điểm trong {current.empty}. Hãy là người đầu tiên!</p>
      ) : (
        <>
          {podium.length > 0 && (
            <ol aria-label="Ba người dẫn đầu" className="flex items-end justify-center gap-3 bg-sidebar px-5 pb-5.5">
              {podium.map((entry) => (
                <PodiumPlace key={entry.rank} entry={entry} isMe={entry.userId === user.id} />
              ))}
            </ol>
          )}
          {others.length > 0 && (
            <ol aria-label="Các hạng tiếp theo">
              {others.map((entry) => (
                <Row
                  key={entry.rank}
                  rank={entry.rank}
                  name={entry.userId === user.id ? 'Bạn' : entry.displayName}
                  score={entry.totalScore}
                  highlight={entry.userId === user.id}
                />
              ))}
            </ol>
          )}
          {me && !meInTop && (
            <ol aria-label="Hạng của bạn">
              <Row rank={me.rank} name="Bạn" score={me.totalScore} highlight />
            </ol>
          )}
          <p className="px-5 py-3 text-xs text-muted-light">
            Cập nhật lúc {formatMoment(updatedAt)} · bảng được tính lại định kỳ
          </p>
        </>
      )
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cx('flex flex-col overflow-hidden rounded-xl border border-line bg-white', className)}
    >
      <div className="flex flex-col items-center gap-3 bg-sidebar px-5 pt-5.5 pb-4">
        <h2 id={titleId} className="text-lg font-bold text-white">
          {current.title}
        </h2>
        <div role="group" aria-label="Kỳ xếp hạng" className="flex gap-1 rounded-full bg-sidebar-raised p-1">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === period}
              onClick={() => setPeriod(option.value)}
              className={cx(
                'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-brand',
                option.value === period ? 'bg-brand text-white' : 'text-sidebar-text hover:text-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {content}
    </section>
  )
}
