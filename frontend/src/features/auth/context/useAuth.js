import { useContext } from 'react'
import { AuthContext } from './authContext'

/** Current authentication state and actions. Must be used under <AuthProvider>. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return context
}
