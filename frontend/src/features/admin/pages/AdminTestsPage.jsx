import { useState } from 'react'
import { Link } from 'react-router'
import { Button, ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/paths'
import { formatDayMonth } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { useAdminTests } from '../api/testsQueries'
import { AdminPage } from '../components/AdminPage'
import { InlineSelect, RowAction, Segmented, TABLE, TableCard, TD, TH } from '../components/controls'
import { TEST_SKILL_LABELS } from '../constants'
import { formatDateRange, isoWeek } from '../utils/format'
import { DeleteTestDialog } from '../components/tests/DeleteTestDialog'
import { DuplicateTestDialog } from '../components/tests/DuplicateTestDialog'
import { TestSchedule } from '../components/tests/TestSchedule'
import { TestStatusTag } from '../components/tests/TestStatusTag'
import { displayStatus, nextWeek } from '../utils/testDraft'
import { useUrlFilters } from '../hooks/useUrlFilters'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'UPCOMING', label: 'Sắp mở' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'HIDDEN', label: 'Đã ẩn' },
]

/** Scenario 24, step 2 and branch 2b: every test, the warning about next week's missing weekly test, and the schedule. */
export function AdminTestsPage() {
  const [filters, setFilters] = useUrlFilters({ type: '', status: '' })
  const tests = useAdminTests()
  const [duplicating, setDuplicating] = useState(null) // { source, week }
  const [deleting, setDeleting] = useState(null)

  const all = tests.data ?? []
  const shown = all.filter((test) => (!filters.type || test.type === filters.type) && (!filters.status || displayStatus(test) === filters.status))
  const periodic = all.filter((test) => test.type === 'PERIODIC')
  const openPeriodic = periodic.filter((test) => displayStatus(test) === 'OPEN').length
  const comprehensive = all.filter((test) => test.type === 'COMPREHENSIVE').length
  const week = tests.data ? nextWeek(all) : null
  const weekTaken = week && periodic.some((test) => test.status === 'VISIBLE' && test.startDate >= week.weekStart && test.startDate <= week.weekEnd)
  const weekDraft = week && !weekTaken ? periodic.find((test) => test.status === 'DRAFT' && test.startDate >= week.weekStart && test.startDate <= week.weekEnd) : null

  return (
    <AdminPage
      title="Đề kiểm tra"
      section="Nội dung học"
      summary={tests.data ? `${openPeriodic} đề định kỳ đang mở · ${comprehensive} đề tổng hợp` : ' '}
      actions={
        <ButtonLink to={paths.adminNewTest('PERIODIC')} variant="strong" size="xs">
          + Tạo đề
        </ButtonLink>
      }
    >
      {week && !weekTaken && (
        <div
          role="status"
          className={cx('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border px-4.5 py-3.5', weekDraft ? 'border-warning-solid/40 bg-warning-bg text-warning' : 'border-danger-solid/30 bg-danger-bg text-danger')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="9" cy="9" r="7" />
            <path d="M9 5.5v4M9 12.3v.1" />
          </svg>
          <p className="min-w-60 flex-1 text-label leading-5">
            {weekDraft ? (
              <>
                <strong>Đề tuần {week.week} đang là bản nháp.</strong> Người học chưa thấy đề này; chọn “Mở theo lịch” khi đã soạn xong.
              </>
            ) : (
              <>
                <strong>Chưa có đề định kỳ cho tuần {week.week}.</strong> Đề “{week.last.title}” đóng ngày {formatDayMonth(week.last.endDate)}; từ {formatDayMonth(week.weekStart)} người
                học không còn đề định kỳ để làm.
              </>
            )}
          </p>
          {weekDraft ? (
            <ButtonLink to={paths.adminTest(weekDraft.id)} variant="outline" size="xs">
              Tiếp tục soạn →
            </ButtonLink>
          ) : (
            <Button variant="danger" size="xs" onClick={() => setDuplicating({ source: week.last, week })}>
              Nhân bản đề tuần {isoWeek(week.last.endDate)} thành tuần {week.week}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Loại đề"
          size="sm"
          value={filters.type}
          onChange={(type) => setFilters({ type })}
          options={[
            { value: '', label: `Tất cả (${all.length})` },
            { value: 'PERIODIC', label: `Định kỳ (${periodic.length})` },
            { value: 'COMPREHENSIVE', label: `Tổng hợp (${comprehensive})` },
          ]}
        />
        <InlineSelect label="Trạng thái" value={filters.status} onChange={(status) => setFilters({ status })} options={STATUS_OPTIONS} />
      </div>

      {tests.isPending ? (
        <div aria-hidden="true" className="flex animate-fade-in-late flex-col gap-3 rounded-xl border border-line bg-white p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : tests.isError ? (
        <LoadError error={tests.error} onRetry={tests.refetch} message="Không tải được danh sách đề. Vui lòng thử lại." />
      ) : shown.length === 0 ? (
        <p role="status" className="rounded-xl border border-line bg-white px-6 py-10 text-center text-sm text-ink-soft">
          Không có đề phù hợp với bộ lọc.
        </p>
      ) : (
        <TableCard label="Danh sách đề kiểm tra">
          <table className={cx(TABLE, 'min-w-240')}>
            <thead className="bg-surface-alt">
              <tr>
                <th scope="col" className={TH}>Đề</th>
                <th scope="col" className={TH}>Thời gian mở</th>
                <th scope="col" className={TH}>Trạng thái</th>
                <th scope="col" className={TH}>Câu hỏi</th>
                <th scope="col" className={cx(TH, 'text-right')}>Bài đã nộp</th>
                <th scope="col" className={cx(TH, 'text-right')}>Điểm TB</th>
                <th scope="col" className={cx(TH, 'text-right')}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((test) => (
                <tr key={test.id}>
                  <td className={cx(TD, 'py-3')}>
                    <div className="flex flex-col gap-0.5">
                      <Link to={paths.adminTest(test.id)} className="text-sm font-semibold">
                        {test.title}
                      </Link>
                      <span className="text-xs text-muted-strong">
                        {test.type === 'PERIODIC' ? 'Định kỳ' : 'Tổng hợp 4 kỹ năng · đổi trình độ người học'}
                        {test.skillText && ` · ${test.skillText}`}
                      </span>
                    </div>
                  </td>
                  <td className={cx(TD, 'whitespace-nowrap')}>{formatDateRange(test.startDate, test.endDate)}</td>
                  <td className={TD}>
                    <TestStatusTag test={test} />
                  </td>
                  <td className={cx(TD, 'text-ink-soft')}>
                    {test.questionCount} câu{test.skills.length > 0 && ` · ${test.skills.map((skill) => TEST_SKILL_LABELS[skill]).join(', ')}`}
                  </td>
                  <td className={cx(TD, 'text-right')}>{formatCount(test.submissions)}</td>
                  <td className={cx(TD, 'text-right')}>{test.averageScore ?? '—'}</td>
                  <td className={cx(TD, 'text-right whitespace-nowrap')}>
                    {displayStatus(test) !== 'CLOSED' && (
                      <Link to={paths.adminTest(test.id)} aria-label={`Sửa ${test.title}`} className="inline-block px-2.5 py-1.5 text-label font-bold">
                        Sửa
                      </Link>
                    )}
                    <RowAction onClick={() => setDuplicating({ source: test, week: null })} aria-label={`Nhân bản ${test.title}`}>
                      Nhân bản
                    </RowAction>
                    {test.status !== 'HIDDEN' && (
                      <RowAction tone="danger" onClick={() => setDeleting(test)} aria-label={`Xóa ${test.title}`}>
                        Xóa
                      </RowAction>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {tests.data && <TestSchedule tests={periodic} />}

      <DuplicateTestDialog source={duplicating?.source ?? null} week={duplicating?.week} onClose={() => setDuplicating(null)} />
      <DeleteTestDialog test={deleting} onClose={() => setDeleting(null)} />
    </AdminPage>
  )
}
