import { Outlet } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { CenteredCard } from './CenteredCard'
import { RouteBoundary } from './RouteBoundary'

/** Layout of the pages for visitors who are not signed in (login, register). */
export function AuthLayout() {
  return (
    <CenteredCard>
      <Logo />
      <RouteBoundary>
        <Outlet />
      </RouteBoundary>
    </CenteredCard>
  )
}
