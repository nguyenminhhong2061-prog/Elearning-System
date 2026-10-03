import { createContext, useContext, useEffect } from 'react'

/**
 * What the sidebar must ask before signing out, set by a page with unfinished work (an open test, scenario 3 branch
 * 4a). `guard` is `{ message, beforeLogout }` or null; AppLayout provides it.
 */
export const LogoutGuardContext = createContext({ guard: null, setGuard: () => {} })

/**
 * Asks before signing out while this page is shown. Pass a stable object (useMemo) or null to stop asking.
 * @param {{ message: string, beforeLogout?: () => Promise<unknown> } | null} guard
 */
export function useLogoutGuard(guard) {
  const { setGuard } = useContext(LogoutGuardContext)
  useEffect(() => {
    if (!guard) return undefined
    setGuard(guard)
    return () => setGuard((current) => (current === guard ? null : current))
  }, [guard, setGuard])
}
