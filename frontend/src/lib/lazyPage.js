import { lazy } from 'react'

/** A page's code could not be downloaded: the network dropped, or the app was redeployed and the old file is gone. */
export class PageLoadError extends Error {
  constructor(cause) {
    super('The code of this page could not be loaded', { cause })
    this.name = 'PageLoadError'
  }
}

const RELOAD_KEY = 'linguastep:page-reload-at'
// A second failure this soon after a reload means reloading did not help (the server or the network is down).
const RELOAD_WINDOW_MS = 10_000

function sessionStorageOrNull() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Reacts to a page whose code failed to download. After a deploy, a tab still running the previous version asks for
 * file names that no longer exist; reloading fetches the new index.html and fixes it. At most one reload per
 * RELOAD_WINDOW_MS, so a real outage ends on an error message instead of a reload loop. Without sessionStorage there
 * is no way to tell a loop apart, so it never reloads.
 *
 * @returns {boolean} true when a reload has been started
 */
export function reloadAfterLoadFailure({
  storage = sessionStorageOrNull(),
  now = Date.now(),
  reload = () => window.location.reload(),
} = {}) {
  if (!storage) return false
  try {
    const lastReload = Number(storage.getItem(RELOAD_KEY))
    if (lastReload && now - lastReload < RELOAD_WINDOW_MS) return false
    storage.setItem(RELOAD_KEY, String(now))
  } catch {
    return false
  }
  reload()
  return true
}

/**
 * A page component whose code is downloaded the first time it is rendered, so each page ships in its own file instead
 * of the bundle every visitor downloads. Render it under a <Suspense> boundary (layouts use RouteBoundary).
 * If the download fails the page reloads once; when that does not help, rendering throws a PageLoadError.
 *
 * @example
 * const VocabularyPage = lazyPage(() => import('@/features/vocabulary/pages/VocabularyPage'), 'VocabularyPage')
 *
 * @param {() => Promise<Record<string, unknown>>} load dynamic import of the page's module
 * @param {string} exportName the named export holding the page component
 * @param {{ onLoadFailure?: () => boolean }} [options] replaces reloadAfterLoadFailure (for tests)
 */
export function lazyPage(load, exportName, { onLoadFailure = reloadAfterLoadFailure } = {}) {
  return lazy(() =>
    load().then(
      (module) => {
        const page = module[exportName]
        if (!page) throw new Error(`${exportName} is not exported by the loaded module`)
        return { default: page }
      },
      (error) => {
        // Keep waiting (the current screen stays) while the browser reloads.
        if (onLoadFailure()) return new Promise(() => {})
        throw new PageLoadError(error)
      },
    ),
  )
}
