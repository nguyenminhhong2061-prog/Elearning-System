import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/paths'
import { useAdminUser } from '../api/usersQueries'
import { AdminPage } from '../components/AdminPage'
import { LevelHistory, PlanSummary } from '../components/users/LevelHistory'
import { ProfileCard } from '../components/users/ProfileCard'
import { RecentActivity } from '../components/users/RecentActivity'
import { StatusDialog } from '../components/users/StatusDialog'
import { StudyStats } from '../components/users/StudyStats'

const BREADCRUMB = [{ label: 'Người dùng', to: paths.adminUsers }]

/** Scenario 25, steps 5–10 and branch 7a: a learner's profile, lock and unlock. */
export function AdminUserDetailPage() {
  // 1. Data
  const userId = Number(useParams().userId)
  const user = useAdminUser(userId)
  const [confirming, setConfirming] = useState(null) // 'LOCKED' | 'ACTIVE'

  // 2. Early returns: loading, missing, failed
  if (user.isPending) return <DetailSkeleton />
  if (user.isError) {
    const notFound = user.error?.status === 404
    return (
      <AdminPage title={notFound ? 'Không tìm thấy người dùng' : 'Người dùng'} breadcrumb={BREADCRUMB}>
        {notFound ? (
          <Alert variant="error">Người dùng này không tồn tại hoặc không phải tài khoản người học.</Alert>
        ) : (
          <LoadError error={user.error} onRetry={user.refetch} message="Không tải được hồ sơ người dùng. Vui lòng thử lại." />
        )}
      </AdminPage>
    )
  }

  // 3. Screen
  const learner = user.data
  return (
    <AdminPage title={learner.fullName} breadcrumb={BREADCRUMB} titleInContent>
      <ProfileCard learner={learner} onChangeStatus={setConfirming} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <StudyStats stats={learner.stats} />
          <RecentActivity items={learner.recentActivity} />
        </div>
        <div className="flex flex-col gap-4">
          <LevelHistory items={learner.levelHistory} />
          <PlanSummary plan={learner.plan} />
        </div>
      </div>
      <StatusDialog learner={learner} status={confirming} onClose={() => setConfirming(null)} />
    </AdminPage>
  )
}

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-400 animate-fade-in-late flex-col gap-5">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-center gap-5 rounded-xl border border-line bg-white p-6">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}
