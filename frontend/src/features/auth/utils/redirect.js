const HOME = '/'

/**
 * The path to return to after logging in. The candidate comes from router state (where the user was heading
 * before being sent to the login page), so it is only accepted when it is a plain in-app path: this rules out
 * "//evil.example" style targets and anything that would loop straight back to the login or register page.
 *
 * @param {unknown} candidate
 * @returns {string} the candidate, or "/" when it is missing or unsafe
 */
export function safeRedirectPath(candidate) {
  if (typeof candidate !== 'string') return HOME
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) return HOME
  // Spaces and control characters (tab, newline...) have no place in an in-app path, and some browsers strip
  // them from URLs, which could turn "/\t/evil.example" into "//evil.example".
  if (Array.from(candidate).some((char) => char <= ' ' || char === '\u007f')) return HOME
  if (/^\/(login|register)(?:[/?#]|$)/.test(candidate)) return HOME
  return candidate
}
