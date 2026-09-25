/** A positive whole-number id from the URL, or null when it is not one (then nothing is fetched). */
export function parseId(raw) {
  if (!/^\d{1,15}$/.test(raw ?? '')) return null
  const id = Number(raw)
  return id > 0 ? id : null
}

export const VOCABULARY_PATH = '/vocabulary'
export const LISTS_TAB_PATH = '/vocabulary?tab=lists'

/**
 * Where a back link returns: the page the user came from when it is a vocabulary page with its search or tab (passed
 * in router state as `backTo`), otherwise `fallback`. Only in-app vocabulary paths are accepted.
 */
export function backLinkTarget(state, fallback = VOCABULARY_PATH) {
  const candidate = state?.backTo
  return typeof candidate === 'string' && candidate.startsWith(`${VOCABULARY_PATH}?`) ? candidate : fallback
}
