import { Fragment } from 'react'
import { parseBlocks, parseInline } from './markdownParser'

function Inline({ text }) {
  return parseInline(text).map((part, index) => {
    if (part.type === 'strong') return <strong key={index}>{part.text}</strong>
    if (part.type === 'em') return <em key={index}>{part.text}</em>
    if (part.type === 'code') {
      return (
        <code key={index} className="rounded bg-canvas px-1 font-mono text-xs">
          {part.text}
        </code>
      )
    }
    return <Fragment key={index}>{part.text}</Fragment>
  })
}

/** An assistant answer: the Markdown subset of markdownParser.js, rendered as React elements only (never as HTML). */
export function ChatMarkdown({ text }) {
  return (
    <div className="flex flex-col gap-2">
      {parseBlocks(text).map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  <Inline text={line} />
                </Fragment>
              ))}
            </p>
          )
        }
        const List = block.type === 'bullets' ? 'ul' : 'ol'
        return (
          <List key={index} className={block.type === 'bullets' ? 'list-disc pl-4.5' : 'list-decimal pl-5'}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inline text={item} />
              </li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
