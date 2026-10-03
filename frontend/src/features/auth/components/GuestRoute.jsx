import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { useAuth } from '../context/useAuth'
import { safeRedirectPath } from '../utils/redirect'

/**
 * Layout route for pages meant for visitors (login, register). Signed-in users are sent on to the page they
 * were originally heading to, or the home page. Because this redirect fires as soon as the session starts,
 * the login and register pages never navigate themselves after a successful sign-in.
 */
export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to={safeRedirectPath(location.state?.from)} replace />
  return <Outlet />
}
