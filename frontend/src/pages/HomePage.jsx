import { Page } from '@/components/layout/Page'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/context/useAuth'
import { Achievements } from '@/features/progress/components/Achievements'
import { ActivityChart } from '@/features/progress/components/ActivityChart'
import { ContinueCard } from '@/features/progress/components/ContinueCard'
import { LevelJourney } from '@/features/progress/components/LevelJourney'
import { ProgressStats } from '@/features/progress/components/ProgressStats'
import { SkillRadar } from '@/features/progress/components/SkillRadar'
import { WelcomeBanner } from '@/features/progress/components/WelcomeBanner'
import { getGivenName } from '@/lib/personName'

/**
 * Landing page after login ("Tiến độ" in the sidebar), module D1 (docs/api/progress.md). Each block loads on its own,
 * so a slow or failing one does not hold back the others.
 */
export function HomePage() {
  const { user } = useAuth()

  return (
    <Page
      title="Tiến độ"
      heading={
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size="lg" />
          <h1 className="text-title font-bold text-ink">Chào {getGivenName(user.fullName)} 👋</h1>
        </div>
      }
    >
      <WelcomeBanner />
      <ProgressStats />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <ActivityChart />
        <SkillRadar />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <LevelJourney />
        <Achievements />
      </div>
      <ContinueCard />
    </Page>
  )
}
