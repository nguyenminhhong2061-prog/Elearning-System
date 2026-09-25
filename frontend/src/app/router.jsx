import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { GuestRoute } from '@/features/auth/guards/GuestRoute'
import { ProtectedRoute } from '@/features/auth/guards/ProtectedRoute'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { TopicDetailPage } from '@/features/vocabulary/pages/TopicDetailPage'
import { ListDetailPage } from '@/features/vocabulary/pages/ListDetailPage'
import { StudySessionPage } from '@/features/vocabulary/pages/StudySessionPage'
import { VocabularyPage } from '@/features/vocabulary/pages/VocabularyPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Every route of the app is registered here. To add a module's pages, put them inside the <AppLayout> group
 * (or under <ProtectedRoute roles={[ROLES.ADMIN]}> for admin-only pages) and keep the sidebar entry in
 * components/layout/navItems.js in step.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Visitors only: signed-in users are redirected away. */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Signed-in users only: everyone else is sent to /login. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="account/change-password" element={<ChangePasswordPage />} />

          {/* Module A: vocabulary. */}
          <Route path="vocabulary">
            <Route index element={<VocabularyPage />} />
            <Route path="review" element={<StudySessionPage mode="due" />} />
            <Route path="topics/:topicId" element={<TopicDetailPage />} />
            <Route path="topics/:topicId/study" element={<StudySessionPage mode="topic" />} />
            <Route path="lists/:listId" element={<ListDetailPage />} />
            <Route path="lists/:listId/study" element={<StudySessionPage mode="list" />} />
          </Route>

          {/* Sections owned by other modules. Replace the placeholder when the module's pages exist. */}
          <Route path="exercises/*" element={<ComingSoonPage title="Bài tập" />} />
          <Route path="tests/*" element={<ComingSoonPage title="Kiểm tra" />} />
          <Route path="plan/*" element={<ComingSoonPage title="Kế hoạch" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
