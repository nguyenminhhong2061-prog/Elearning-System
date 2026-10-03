import { useMemo, useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { AppShell } from './AppShell'
import { LogoutGuardContext } from './logoutGuard'
import { SidebarContent } from './Sidebar'

/**
 * Layout of every page of the learner area: the dark sidebar of the design (a menu on phones) and the content. A page
 * with unfinished work (an open test) asks the sidebar to confirm before signing out (logoutGuard.js).
 */
export function AppLayout() {
  const [guard, setGuard] = useState(null)
  const logoutGuard = useMemo(() => ({ guard, setGuard }), [guard])

  return (
    <LogoutGuardContext value={logoutGuard}>
      <AppShell
        brand={<Logo variant="dark" />}
        renderSidebar={(onNavigate) => <SidebarContent onNavigate={onNavigate} />}
      />
    </LogoutGuardContext>
  )
}
