import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { FullPageSpinner } from '@/components/layout/FullPageSpinner'
import { RouteBoundary } from '@/components/layout/RouteBoundary'
import { GuestRoute } from '@/features/auth/components/GuestRoute'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
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

/**
 * Every route of the app is registered here. To add a module's pages, declare each page with lazyPage above, put
 * its route inside the <AppLayout> group (or under <ProtectedRoute roles={[ROLES.ADMIN]}> for admin-only pages) and
 * keep the sidebar entry in components/layout/navItems.js in step. A new layout must wrap its <Outlet /> in
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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteBoundary>
  )
}
