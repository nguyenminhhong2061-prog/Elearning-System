import { NavLink } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { Logo } from '@/components/ui/Logo'
import { ToastProvider } from '@/components/ui/Toast'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'

// Sidebar of the admin area, in the order of the design: one section per group, "Tổng quan" on its own.
const SECTIONS = [
  { items: [{ label: 'Tổng quan', to: '/admin', end: true }] },
  {
    title: 'Nội dung học',
    items: [
      { label: 'Từ vựng', to: '/admin/vocabulary' },
      { label: 'Bài tập', to: '/admin/lessons' },
      { label: 'Đề kiểm tra', to: '/admin/tests' },
      { label: 'Trò chơi', to: '/admin/games' },
    ],
  },
  { title: 'Hệ thống', items: [{ label: 'Người dùng', to: '/admin/users' }] },
]

const ROW = 'flex items-center gap-3 rounded-lg px-3 py-2.75 transition-colors focus-visible:outline-2 focus-visible:outline-brand'
const SECONDARY_ROW = 'text-label font-medium text-muted-light hover:bg-sidebar-raised hover:text-white'

function AdminBrand() {
  return (
    <div className="flex flex-1 items-center gap-2.5">
      <Logo variant="dark" />
      <span className="rounded-full bg-brand-soft px-2.25 py-0.75 text-tag font-bold text-brand-ink md:ml-auto">Quản trị</span>
    </div>
  )
}

function AdminSidebar({ onNavigate }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <nav aria-label="Điều hướng quản trị" className="flex flex-col gap-1">
        {SECTIONS.map((section) => (
          <div key={section.title ?? 'main'} className="flex flex-col gap-1">
            {section.title && (
              <h2 className="px-3 pt-4 pb-1.5 text-tag font-bold tracking-[0.06em] text-muted-light uppercase">{section.title}</h2>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(ROW, 'text-sm leading-4.5 font-semibold', isActive ? 'bg-brand-dark text-white' : 'text-sidebar-text hover:bg-sidebar-raised')
                }
              >
                {({ isActive }) => (
                  <>
                    <span aria-hidden="true" className={cx('size-2 rounded-xs', isActive ? 'bg-white' : 'bg-muted')} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3.5">
        <div className="flex items-center gap-3 px-1.5">
          <span aria-hidden="true" className="flex size-9.5 flex-none items-center justify-center rounded-full bg-brand-soft text-label font-bold text-brand-ink">
            QT
          </span>
          <div className="min-w-0">
            <p className="truncate text-label font-semibold text-white">{user.fullName || 'Quản trị viên'}</p>
            <p className="truncate text-xs text-muted-light">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <NavLink
            to="/admin/account/change-password"
            onClick={onNavigate}
            className={({ isActive }) => cx(ROW, SECONDARY_ROW, isActive && 'bg-sidebar-raised text-white')}
          >
            Đổi mật khẩu
          </NavLink>
          <button
            type="button"
            onClick={() => {
              onNavigate?.()
              logout()
            }}
            className={cx(ROW, SECONDARY_ROW, 'cursor-pointer text-left')}
          >
            ← Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}

/** Layout of the admin area (/admin/*): its own sidebar, and the "Đã lưu" confirmations shared by every page. */
export function AdminLayout() {
  return (
    <ToastProvider>
      <AppShell
        brand={<AdminBrand />}
        columnsClassName="md:grid-cols-[min(248px,26vw)_minmax(0,1fr)]"
        renderSidebar={(onNavigate) => <AdminSidebar onNavigate={onNavigate} />}
      />
    </ToastProvider>
  )
}
