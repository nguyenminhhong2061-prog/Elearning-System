/** Whole seconds as "mm:ss", as on the design's timer pill ("00:42"). Negative values show "00:00". */
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** Milliseconds since `start` (epoch ms), for the response time of an answer. */
export function elapsedSince(start) {
  return Date.now() - start
}
