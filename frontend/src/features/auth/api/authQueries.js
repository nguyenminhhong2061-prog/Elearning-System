import { useMutation } from '@tanstack/react-query'
import { changePassword } from './authApi'

// Hooks for account actions. Signing in, registering and signing out are not here: they change who is signed in, so
// they go through useAuth() (see context/AuthProvider.jsx).

/** POST /api/auth/change-password. Rejects with status 400 when the current password is wrong. */
export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
