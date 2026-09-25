/** Joins class names, skipping falsy values: cx('a', cond && 'b') -> 'a b' or 'a'. */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}
