import { useState } from 'react'
import { LoadError } from '@/components/ui/LoadError'
import { addDays, todayInVietnam } from '@/lib/dates'
import { useStats } from '../api/overviewQueries'
import { AdminPage } from '../components/AdminPage'
import { Segmented } from '../components/controls'
import { Attention } from '../components/overview/Attention'
import { CustomPeriod } from '../components/overview/CustomPeriod'
import { DailyActiveChart } from '../components/overview/DailyActiveChart'
import { KeyFigures } from '../components/overview/KeyFigures'
import { LevelBreakdown } from '../components/overview/LevelBreakdown'
import { OverviewSkeleton } from '../components/overview/OverviewSkeleton'
import { TopContent } from '../components/overview/TopContent'
import { useUrlFilters } from '../hooks/useUrlFilters'
import { formatClock, formatDateRange } from '../utils/format'

const PERIODS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: 'custom', label: 'Tùy chọn…' },
]

/** The period asked for: the last 7/30/90 days up to today, or the admin's own dates. */
function periodOf(filters, today) {
  if (filters.period === 'custom' && filters.from && filters.to) return { from: filters.from, to: filters.to }
  const days = Number(filters.period === 'custom' ? 30 : filters.period) || 30
  return { from: addDays(today, -(days - 1)), to: today }
}

/** Scenario 26: the admin area's home page. */
export function AdminOverviewPage() {
  // 1. Data
  const today = todayInVietnam()
  const [filters, setFilters] = useUrlFilters({ period: '30', from: '', to: '' })
  const period = periodOf(filters, today)
  const stats = useStats(period)
  const [choosing, setChoosing] = useState(false)

  // 2. Derived values
  const periodLabel =
    filters.period === 'custom' && filters.from ? 'Khoảng tự chọn' : `${filters.period === 'custom' ? 30 : filters.period} ngày gần nhất`

  function choosePeriod(value) {
    if (value === 'custom') return setChoosing(true)
    setChoosing(false)
    setFilters({ period: value, from: '', to: '' })
  }

  // 3. Screen: the frame stays while the numbers load or fail
  return (
    <AdminPage
      title="Tổng quan hệ thống"
      summary={
        <>
          {periodLabel}: {formatDateRange(period.from, period.to)}
          {stats.data && ` · cập nhật lúc ${formatClock(stats.data.generatedAt)}`}
        </>
      }
      actions={<Segmented label="Khoảng thời gian" options={PERIODS} value={choosing ? 'custom' : filters.period} onChange={choosePeriod} />}
    >
      {choosing && (
        <CustomPeriod
          initial={period}
          today={today}
          onApply={({ from, to }) => {
            setChoosing(false)
            setFilters({ period: 'custom', from, to })
          }}
          onCancel={() => setChoosing(false)}
        />
      )}

      {stats.isPending ? (
        <OverviewSkeleton />
      ) : stats.isError ? (
        <LoadError error={stats.error} onRetry={stats.refetch} message="Không tải được số liệu thống kê. Vui lòng thử lại." />
      ) : (
        <>
          <KeyFigures stats={stats.data} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <DailyActiveChart days={stats.data.dailyActive} today={today} />
            <LevelBreakdown levels={stats.data.levels} />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <TopContent rows={stats.data.topContent} />
            <Attention attention={stats.data.attention} />
          </div>
        </>
      )}
    </AdminPage>
  )
}
