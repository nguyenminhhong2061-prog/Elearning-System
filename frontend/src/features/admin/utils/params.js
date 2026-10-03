/** Query parameters without the empty ones, so the URL only carries the filters the admin chose. */
export function compactParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}
