const numberFormat = new Intl.NumberFormat('vi-VN')

/** Vietnamese thousands separator, as in the design: 1248 -> "1.248". */
export function formatCount(value) {
  return numberFormat.format(value)
}
