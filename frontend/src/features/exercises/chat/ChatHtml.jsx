import { Fragment, createElement } from 'react'
import { ChatMarkdown } from './ChatMarkdown'

const BLOCKED = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'img', 'form', 'input', 'button'])
const TAGS = new Set(['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'code'])
const HTML_TAG = /<\s*\/?\s*(?:p|strong|em|ul|ol|li|br|code)(?:\s|>|\/)/i

function renderNode(node, key) {
  if (node.nodeType === 3) return node.textContent
  if (node.nodeType !== 1) return null

  const tag = node.tagName.toLowerCase()
  if (BLOCKED.has(tag)) return null
  if (!TAGS.has(tag)) return <Fragment key={key}>{Array.from(node.childNodes, renderNode)}</Fragment>

  const className = {
    ul: 'list-disc pl-4.5',
    ol: 'list-decimal pl-5',
    code: 'rounded bg-canvas px-1 font-mono text-xs',
  }[tag]
  return createElement(tag, { key, className }, ...Array.from(node.childNodes, renderNode))
}

/** Only a small, attribute-free HTML subset is rendered. Legacy Markdown answers remain readable. */
export function ChatHtml({ text }) {
  if (!HTML_TAG.test(text)) return <ChatMarkdown text={text} />

  const document = new DOMParser().parseFromString(text, 'text/html')
  return <div className="flex flex-col gap-2">{Array.from(document.body.childNodes, renderNode)}</div>
}
