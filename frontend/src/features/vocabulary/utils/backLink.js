import { paths } from '@/config/paths'

/**
 * Where a back link returns: the page the user came from when it is a vocabulary page with its search or tab (passed
 * in router state as `backTo`), otherwise `fallback`. Only in-app vocabulary paths are accepted.
 */
export function backLinkTarget(state, fallback = paths.vocabulary) {
  const candidate = state?.backTo
  return typeof candidate === 'string' && candidate.startsWith(`${paths.vocabulary}?`) ? candidate : fallback
}
