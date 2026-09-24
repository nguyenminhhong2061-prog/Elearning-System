import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { QueryProvider } from './QueryProvider'
import { AppRoutes } from './router'

// The router (BrowserRouter) is provided by main.jsx, so tests can wrap <App /> in a MemoryRouter instead.
export default function App() {
  return (
    <AuthProvider>
      <QueryProvider>
        <AppRoutes />
      </QueryProvider>
    </AuthProvider>
  )
}
