/** A positive whole-number id from the URL, or null when it is not one (then nothing is fetched). */
export function parseId(raw) {
  if (!/^\d{1,15}$/.test(raw ?? '')) return null
  const id = Number(raw)
  return id > 0 ? id : null
}
