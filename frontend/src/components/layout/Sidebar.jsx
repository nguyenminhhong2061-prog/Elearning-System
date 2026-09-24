import { NavLink } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'
import { NAV_ITEMS } from './navItems'

const ROW = 'flex items-center gap-3 rounded-lg px-3 py-2.75 transition-colors focus-visible:outline-2 focus-visible:outline-brand'
const SECONDARY_ROW = 'text-label font-medium text-muted-light hover:bg-sidebar-raised hover:text-white'

/**
 * Everything in the sidebar below the logo: navigation, the learner's level, the signed-in user, and the
 * account actions. Shared by the desktop sidebar and the mobile menu.
 *
 * @param {object} props
 * @param {() => void} [props.onNavigate] called after a link or logout is used (the mobile menu closes itself)
 */
export function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()

  function handleLogout() {
    onNavigate?.()
    // The route guard sees the session end and sends the user to the login page.
    logout()
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                ROW,
                'text-sm leading-4.5 font-semibold',
                isActive ? 'bg-brand text-white' : 'text-sidebar-text hover:bg-sidebar-raised',
              )
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
      </nav>

      <div className="mt-auto flex flex-col gap-2 rounded-[10px] bg-sidebar-raised p-4">
        <div className="text-xs font-medium text-muted-light">Trình độ hiện tại</div>
        {user.currentLevel ? (
          <div className="text-title font-bold text-white">{user.currentLevel}</div>
        ) : (
          <div className="text-sm font-semibold text-white">Chưa xác định</div>
        )}
      </div>

      <div className="flex items-center gap-3 px-1.5">
        <Avatar name={user.fullName} />
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-white">{user.fullName}</p>
          <p className="truncate text-xs text-muted-light">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <NavLink
          to="/account/change-password"
          onClick={onNavigate}
          className={({ isActive }) => cx(ROW, SECONDARY_ROW, isActive && 'bg-sidebar-raised text-white')}
        >
          Đổi mật khẩu
        </NavLink>
        <button type="button" onClick={handleLogout} className={cx(ROW, SECONDARY_ROW, 'cursor-pointer text-left')}>
          ← Đăng xuất
        </button>
      </div>
    </div>
  )
}
