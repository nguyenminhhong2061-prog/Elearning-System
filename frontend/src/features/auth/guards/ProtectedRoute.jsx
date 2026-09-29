import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { useAuth } from '../context/useAuth'
import { SessionErrorScreen } from '../components/SessionErrorScreen'

/**
 * Layout route that only lets signed-in users through; everyone else is sent to the login page and brought
 * back afterwards. With `roles`, users whose role is not listed see the "forbidden" page instead, or are sent to
 * `redirectTo` when it is given. That check is only for a tidy interface: the backend is what really enforces roles.
 *
 * @example
 * <Route element={<ProtectedRoute />}>...</Route>
 * <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>...</Route>
 * <Route element={<ProtectedRoute roles={[ROLES.LEARNER]} redirectTo="/admin" />}>...</Route>
 *
 * @param {object} props
 * @param {string[]} [props.roles] allowed roles (use the ROLES constants); everyone signed in when omitted
 * @param {string} [props.redirectTo] where users with another role go instead of the "forbidden" page
 */
export function ProtectedRoute({ roles, redirectTo }) {
  const { status, user, endReason, retry } = useAuth()
  const location = useLocation()

  // Wait for the stored token to be checked, otherwise every reload would flash the login page first.
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'error') return <SessionErrorScreen onRetry={retry} />

  if (status !== 'authenticated') {
    // After an explicit logout there is nowhere to return to; otherwise remember where the user was heading.
    const from = endReason === 'logout' ? null : location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={from ? { from } : null} />
  }

  if (roles && !roles.includes(user.role)) return redirectTo ? <Navigate to={redirectTo} replace /> : <ForbiddenPage />
  return <Outlet />
}
