/** Milliseconds as "m:ss", as under the design's audio player ("0:42", "1:50"). Negative or unknown values show "0:00". */
export function formatPlayTime(ms) {
  const seconds = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * The transcript segment being heard at `positionMs`: the last one that has started and not yet ended. Between two
 * segments (a pause) nothing is highlighted.
 *
 * @param {import('./types').Segment[]} segments ordered by startMs
 * @param {number} positionMs
 */
export function activeSegmentId(segments, positionMs) {
  const segment = segments.find((candidate) => positionMs >= candidate.startMs && positionMs < candidate.endMs)
  return segment?.id ?? null
}
