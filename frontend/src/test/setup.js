import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are enabled, but cleanup must still be registered explicitly for React Testing Library.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
