import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import { tokenStorage } from '@/api/tokenStorage'

// findBy* and waitFor give up after 1s by default. A full-app test goes through several async steps (session check,
// then data loading), which can take longer when all test files run in parallel on a slower machine.
configure({ asyncUtilTimeout: 3000 })

// Vitest globals are enabled, but cleanup must still be registered explicitly for React Testing Library.
// Each test starts signed out: the session lives in localStorage and in tokenStorage's memory fallback.
afterEach(() => {
  cleanup()
  tokenStorage.clear()
  localStorage.clear()
})
