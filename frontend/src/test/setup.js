import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { tokenStorage } from '@/api/tokenStorage'

// Vitest globals are enabled, but cleanup must still be registered explicitly for React Testing Library.
// Each test starts signed out: the session lives in localStorage and in tokenStorage's memory fallback.
afterEach(() => {
  cleanup()
  tokenStorage.clear()
  localStorage.clear()
})
