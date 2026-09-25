import { Page } from '@/components/layout/Page'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/context/useAuth'
import { DueReviewCard } from '@/features/vocabulary/components/DueReview'
import { getGivenName } from '@/lib/personName'

/** Landing page after login ("Tiến độ" in the sidebar). The progress module fills in the real content later. */
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
      {/* Review reminder of the vocabulary module (A2); hidden when nothing is due. */}
      <DueReviewCard className="sm:max-w-75" />
      <Card className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-ink">Tiến độ học tập</h2>
        <p className="text-sm text-muted">Thống kê và biểu đồ tiến độ của bạn sẽ hiển thị tại đây.</p>
      </Card>
    </Page>
  )
}
