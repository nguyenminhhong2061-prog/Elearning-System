/** `text` with the first occurrence of `term` (ignoring case) marked, as in the search results of the design. */
export function Highlight({ text, term }) {
  const needle = term?.trim()
  const index = needle ? text.toLocaleLowerCase('vi').indexOf(needle.toLocaleLowerCase('vi')) : -1
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-xs bg-brand-soft text-inherit">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}
