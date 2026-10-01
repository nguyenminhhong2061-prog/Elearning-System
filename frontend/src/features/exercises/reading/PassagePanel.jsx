/**
 * The reading passage a question is about (scenario 9, step 13), in the left column like the listening transcript. It
 * stays in view while the learner moves through its questions; a long passage scrolls inside the panel.
 *
 * @param {{ passage: import('../types').ReadingPassage }} props
 */
export function PassagePanel({ passage }) {
  const titleId = `passage-${passage.id}`
  const paragraphs = passage.content.split(/\n\s*\n/).filter((text) => text.trim())

  return (
    <section
      aria-labelledby={titleId}
      // Focusable so a keyboard can scroll a passage longer than the panel.
      tabIndex={0}
      className="flex max-h-80 flex-col gap-3 overflow-y-auto rounded-xl border border-line bg-surface-alt p-5 focus-visible:outline-2 focus-visible:outline-brand lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]"
    >
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Bài đọc</p>
      <h2 id={titleId} lang="en" className="text-lg leading-6 font-semibold text-ink">
        {passage.title}
      </h2>
      {paragraphs.map((text, index) => (
        <p key={index} lang="en" className="text-body leading-relaxed text-ink">
          {text}
        </p>
      ))}
    </section>
  )
}
