import { useEffect, useEffectEvent, useState } from 'react'

const TICK_MS = 250

/**
 * Time of a running round, computed from the start time rather than by counting ticks, so it stays right when the
 * browser slows timers down in a background tab.
 *
 * @param {object} options
 * @param {number | null} options.startedAt epoch ms; null while not running
 * @param {number | null} options.limitSeconds null for games without a limit
 * @param {() => void} options.onExpire called once when the limit is reached
 * @returns {{ elapsedMs: number, remainingMs: number | null }}
 */
export function useGameClock({ startedAt, limitSeconds, onExpire }) {
  const [now, setNow] = useState(() => Date.now())
  const expire = useEffectEvent(onExpire)

  useEffect(() => {
    if (startedAt === null) return undefined
    let expired = false
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (!expired && limitSeconds !== null && current - startedAt >= limitSeconds * 1000) {
        expired = true
        expire()
      }
    }
    tick()
    const timer = setInterval(tick, TICK_MS)
    return () => clearInterval(timer)
  }, [startedAt, limitSeconds])

  const elapsedMs = startedAt === null ? 0 : Math.max(0, now - startedAt)
  const remainingMs = limitSeconds === null ? null : Math.max(0, limitSeconds * 1000 - elapsedMs)
  return { elapsedMs, remainingMs }
}
