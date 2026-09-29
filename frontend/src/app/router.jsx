import { Route, Routes } from 'react-router'
import { ROLES } from '@/api/constants'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { RouteBoundary } from '@/components/layout/RouteBoundary'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { GuestRoute } from '@/features/auth/guards/GuestRoute'
import { ProtectedRoute } from '@/features/auth/guards/ProtectedRoute'
import { lazyPage } from '@/lib/lazyPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Every page is downloaded the first time it is opened (one file per page), so opening the app only waits for the
// shell (layouts, guards, shared UI) and the current page. Only tiny placeholder pages are imported directly.
const LoginPage = lazyPage(() => import('@/features/auth/pages/LoginPage'), 'LoginPage')
const RegisterPage = lazyPage(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage')
const ChangePasswordPage = lazyPage(() => import('@/features/auth/pages/ChangePasswordPage'), 'ChangePasswordPage')
const HomePage = lazyPage(() => import('@/pages/HomePage'), 'HomePage')

const VocabularyPage = lazyPage(() => import('@/features/vocabulary/pages/VocabularyPage'), 'VocabularyPage')
const TopicDetailPage = lazyPage(() => import('@/features/vocabulary/pages/TopicDetailPage'), 'TopicDetailPage')
const ListDetailPage = lazyPage(() => import('@/features/vocabulary/pages/ListDetailPage'), 'ListDetailPage')
const StudySessionPage = lazyPage(() => import('@/features/vocabulary/pages/StudySessionPage'), 'StudySessionPage')
const GamesPage = lazyPage(() => import('@/features/games/pages/GamesPage'), 'GamesPage')
const GamePlayPage = lazyPage(() => import('@/features/games/pages/GamePlayPage'), 'GamePlayPage')

const ExercisesPage = lazyPage(() => import('@/features/exercises/pages/ExercisesPage'), 'ExercisesPage')
const LessonPage = lazyPage(() => import('@/features/exercises/pages/LessonPage'), 'LessonPage')

const TestsPage = lazyPage(() => import('@/features/tests/pages/TestsPage'), 'TestsPage')
const TestTakingPage = lazyPage(() => import('@/features/tests/pages/TestTakingPage'), 'TestTakingPage')
const TestResultPage = lazyPage(() => import('@/features/tests/pages/TestResultPage'), 'TestResultPage')

const PlanPage = lazyPage(() => import('@/features/plan/pages/PlanPage'), 'PlanPage')

const AdminOverviewPage = lazyPage(() => import('@/features/admin/pages/AdminOverviewPage'), 'AdminOverviewPage')
const AdminTopicsPage = lazyPage(() => import('@/features/admin/pages/AdminTopicsPage'), 'AdminTopicsPage')
const AdminTopicWordsPage = lazyPage(() => import('@/features/admin/pages/AdminTopicWordsPage'), 'AdminTopicWordsPage')
const AdminLessonsPage = lazyPage(() => import('@/features/admin/pages/AdminLessonsPage'), 'AdminLessonsPage')
const AdminLessonEditorPage = lazyPage(() => import('@/features/admin/pages/AdminLessonEditorPage'), 'AdminLessonEditorPage')
const AdminTestsPage = lazyPage(() => import('@/features/admin/pages/AdminTestsPage'), 'AdminTestsPage')
const AdminTestEditorPage = lazyPage(() => import('@/features/admin/pages/AdminTestEditorPage'), 'AdminTestEditorPage')
const AdminGamesPage = lazyPage(() => import('@/features/admin/pages/AdminGamesPage'), 'AdminGamesPage')
const AdminUsersPage = lazyPage(() => import('@/features/admin/pages/AdminUsersPage'), 'AdminUsersPage')
const AdminUserDetailPage = lazyPage(() => import('@/features/admin/pages/AdminUserDetailPage'), 'AdminUserDetailPage')

/**
 * Every route of the app is registered here. To add a module's pages, declare each page with lazyPage above, put
 * its route inside the <AppLayout> group (or the /admin group for admin pages) and keep the sidebar entry in
 * components/layout/navItems.js (admin: features/admin/components/AdminLayout.jsx) in step. A new layout must wrap its <Outlet /> in
 * <RouteBoundary>, like AppLayout; the boundary here only catches what falls outside every layout.
 */
export function AppRoutes() {
  return (
    <RouteBoundary fallback={<FullPageSpinner />}>
      <Routes>
        {/* Visitors only: signed-in users are redirected away. */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Learners only: everyone else is sent to /login, admins to their own area. */}
        <Route element={<ProtectedRoute roles={[ROLES.LEARNER]} redirectTo="/admin" />}>
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
              <Route path="games" element={<GamesPage />} />
              <Route path="games/:gameId" element={<GamePlayPage />} />
            </Route>

            {/* Module B: exercises and the AI assistant (API contract: docs/api/exercises.md, docs/api/chatbot.md). */}
            <Route path="exercises">
              <Route index element={<ExercisesPage />} />
              <Route path="lessons/:lessonId" element={<LessonPage />} />
            </Route>

            {/* Module C: tests (API contract: docs/api/tests.md). */}
            <Route path="tests">
              <Route index element={<TestsPage />} />
              <Route path=":testId" element={<TestTakingPage />} />
              <Route path=":testId/result/:attemptId" element={<TestResultPage />} />
            </Route>

            {/* Module D, D2: study plan (API contract: docs/api/plans.md). */}
            <Route path="plan" element={<PlanPage />} />
          </Route>
        </Route>

        {/* Module E: the admin area (API contract: docs/api/admin.md). Learners see the "forbidden" page. */}
        <Route path="admin" element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="vocabulary" element={<AdminTopicsPage />} />
            <Route path="vocabulary/topics/:topicId" element={<AdminTopicWordsPage />} />
            <Route path="lessons" element={<AdminLessonsPage />} />
            <Route path="lessons/new" element={<AdminLessonEditorPage />} />
            <Route path="lessons/:lessonId" element={<AdminLessonEditorPage />} />
            <Route path="tests" element={<AdminTestsPage />} />
            <Route path="tests/new" element={<AdminTestEditorPage />} />
            <Route path="tests/:testId" element={<AdminTestEditorPage />} />
            <Route path="games" element={<AdminGamesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId" element={<AdminUserDetailPage />} />
            <Route path="account/change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteBoundary>
  )
}
