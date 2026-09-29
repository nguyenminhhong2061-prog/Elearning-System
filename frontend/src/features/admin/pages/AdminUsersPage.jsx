import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { SearchField } from '@/components/ui/SearchField'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { getInitials } from '@/lib/personName'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cx } from '@/lib/cx'
import { useAdminUsers, useUsersSummary } from '../api/adminQueries'
import { AdminPage } from '../components/AdminPage'
import { Highlight } from '../components/Highlight'
import { InlineSelect, LevelTag, Pagination, Segmented, TABLE, TableCard, TD, TH } from '../components/controls'
import { describeLastActive, formatFullDate, formatNumber, levelOptions } from '../format'
import { useUrlFilters } from '../useUrlFilters'

const PAGE_SIZE = 10
const SORTS = [
  { value: 'NEWEST', label: 'Mới đăng ký trước' },
  { value: 'RECENT_ACTIVITY', label: 'Hoạt động gần đây trước' },
  { value: 'NAME', label: 'Tên A → Z' },
]

/** Scenario 24, steps 1–2 and the "not found" exception: find a learner and open their profile. */
export function AdminUsersPage() {
  const [filters, setFilters] = useUrlFilters({ q: '', status: '', level: '', sort: 'NEWEST', page: '0' })
  const [term, setTerm] = useState(filters.q)
  const debouncedTerm = useDebouncedValue(term.trim(), 300)

  useEffect(() => {
    if (debouncedTerm !== filters.q) setFilters({ q: debouncedTerm })
  }, [debouncedTerm, filters.q, setFilters])

  const summary = useUsersSummary()
  const users = useAdminUsers({ q: filters.q, status: filters.status, level: filters.level, sort: filters.sort, page: Number(filters.page), size: PAGE_SIZE })

  function clearSearch() {
    setTerm('')
    setFilters({ q: '', status: '', level: '' })
  }

  const counts = summary.data
  const statusOptions = [
    { value: '', label: counts ? `Tất cả (${formatNumber(counts.total)})` : 'Tất cả' },
    { value: 'ACTIVE', label: counts ? `Đang hoạt động (${formatNumber(counts.active)})` : 'Đang hoạt động' },
    { value: 'LOCKED', label: counts ? `Đã khóa (${formatNumber(counts.locked)})` : 'Đã khóa' },
  ]

  return (
    <AdminPage
      title="Người dùng"
      section="Hệ thống"
      summary={counts ? `${formatNumber(counts.total)} người học · ${counts.locked} tài khoản đang bị khóa` : ' '}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          label="Tìm người học"
          placeholder="Tìm theo họ tên hoặc email"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onClear={clearSearch}
          className="w-full sm:w-85"
        />
        <Segmented label="Trạng thái tài khoản" size="sm" options={statusOptions} value={filters.status} onChange={(status) => setFilters({ status })} />
        <InlineSelect label="Trình độ" value={filters.level} onChange={(level) => setFilters({ level })} options={levelOptions({ withNone: true })} />
      </div>

      <div className="-mt-1 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-label text-muted-strong">
          {filters.q && users.data && users.data.totalItems > 0 && `${users.data.totalItems} kết quả cho “${filters.q}”`}
        </p>
        <InlineSelect label="Sắp xếp" value={filters.sort} onChange={(sort) => setFilters({ sort })} options={SORTS} />
      </div>

      {users.isPending ? (
        <UsersSkeleton />
      ) : users.isError ? (
        <LoadError error={users.error} onRetry={users.refetch} message="Không tải được danh sách người dùng. Vui lòng thử lại." />
      ) : users.data.totalItems === 0 ? (
        <NoUsers searching={Boolean(filters.q || filters.status || filters.level)} onClear={clearSearch} />
      ) : (
        <TableCard
          label={filters.q ? 'Kết quả tìm kiếm' : 'Danh sách người học'}
          footer={<Pagination data={users.data} unit="người học" onPageChange={(page) => setFilters({ page: String(page) })} />}
        >
          <table className={cx(TABLE, 'min-w-240', users.isPlaceholderData && 'opacity-60')}>
            <thead className="bg-surface-alt">
              <tr>
                <th scope="col" className={TH}>Người học</th>
                <th scope="col" className={TH}>Email</th>
                <th scope="col" className={TH}>Trình độ</th>
                <th scope="col" className={TH}>Trạng thái</th>
                <th scope="col" className={TH}>Ngày đăng ký</th>
                <th scope="col" className={TH}>Hoạt động gần nhất</th>
                <th scope="col" className={TH}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.data.items.map((user) => {
                const locked = user.status === 'LOCKED'
                return (
                  <tr key={user.id}>
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={cx(
                            'flex size-8.5 flex-none items-center justify-center rounded-full text-xs font-bold',
                            locked ? 'bg-canvas text-ink-soft' : 'bg-brand-soft text-brand-ink',
                          )}
                        >
                          {getInitials(user.fullName)}
                        </span>
                        <Link to={`/admin/users/${user.id}`} className={cx('text-sm font-semibold', locked ? 'text-ink-soft' : 'text-ink')}>
                          <Highlight text={user.fullName} term={filters.q} />
                        </Link>
                      </div>
                    </td>
                    <td className={cx(TD, 'text-ink-soft')}>
                      <Highlight text={user.email} term={filters.q} />
                    </td>
                    <td className={TD}>
                      <LevelTag level={user.currentLevel} />
                    </td>
                    <td className={TD}>
                      <Tag variant={locked ? 'danger' : 'success'}>{locked ? 'Đã khóa' : 'Hoạt động'}</Tag>
                    </td>
                    <td className={cx(TD, 'text-ink-soft')}>{formatFullDate(user.createdAt)}</td>
                    <td className={cx(TD, 'text-ink-soft')}>{user.lastActiveAt ? describeLastActive(user.lastActiveAt) : 'Chưa hoạt động'}</td>
                    <td className={cx(TD, 'text-right')}>
                      <Link to={`/admin/users/${user.id}`} aria-label={`Xem ${user.fullName}`} className="inline-block px-2.5 py-1.5 text-label font-bold">
                        Xem →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableCard>
      )}
    </AdminPage>
  )
}

function NoUsers({ searching, onClear }) {
  return (
    <section role="status" className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white px-6 py-12 text-center">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-muted-light">
        <circle cx="18" cy="18" r="10" />
        <path d="M26 26l8 8M14 18h8" />
      </svg>
      <p className="text-base font-bold text-ink">{searching ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người học nào'}</p>
      {searching && (
        <>
          <p className="text-label text-muted-strong">Thử tìm bằng họ tên hoặc một phần email, hoặc bỏ bớt bộ lọc.</p>
          <Button variant="outline" size="xs" onClick={onClear} className="mt-2">
            Xóa tìm kiếm
          </Button>
        </>
      )}
    </section>
  )
}

function UsersSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-fade-in-late flex-col gap-3 rounded-xl border border-line bg-white p-5">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-8.5 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="ml-auto h-4 w-20" />
        </div>
      ))}
    </div>
  )
}
