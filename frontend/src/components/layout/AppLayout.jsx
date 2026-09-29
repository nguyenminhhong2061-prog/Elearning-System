import { Logo } from '@/components/ui/Logo'
import { AppShell } from './AppShell'
import { SidebarContent } from './Sidebar'

/** Layout of every page of the learner area: the dark sidebar of the design (a menu on phones) and the content. */
export function AppLayout() {
  return (
    <AppShell
      brand={<Logo variant="dark" />}
      renderSidebar={(onNavigate) => <SidebarContent onNavigate={onNavigate} />}
    />
  )
}
