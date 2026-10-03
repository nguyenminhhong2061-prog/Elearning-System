import { Tag } from '@/components/ui/Tag'
import { WRITING_TYPES } from '../constants'
import { keywordsOf } from './writing'

/**
 * The task of a writing question (scenario 10, steps 4, 9 and 11): its kind as a tag, the instruction, then the
 * Vietnamese sentence to translate, the sentence to rewrite with its given start ("→ We spent …"), or the keywords.
 *
 * @param {{ question: import('../types').Question }} props
 */
export function WritingPrompt({ question }) {
  const type = WRITING_TYPES[question.type]
  return (
    <div className="flex flex-col gap-2">
      <Tag variant="brand" className="self-start">
        {type.label}
      </Tag>
      <p className="text-label text-ink-soft">{type.instruction}</p>
      {question.type === 'KEYWORD_SENTENCE' ? (
        <ul aria-label="Từ khóa gợi ý" className="flex flex-wrap gap-2">
          {keywordsOf(question.prompt).map((keyword) => (
            <li key={keyword} lang="en" className="rounded-full border border-brand-tint-line bg-white px-3.5 py-1.5 text-body font-semibold text-ink">
              {keyword}
            </li>
          ))}
        </ul>
      ) : (
        <p lang={question.type === 'TRANSLATION' ? 'vi' : 'en'} className="text-[19px] leading-relaxed font-semibold text-ink">
          {question.prompt}
        </p>
      )}
      {question.starter && (
        <p lang="en" className="text-body text-ink-soft">
          → <span className="font-semibold text-ink">{question.starter} …</span>
        </p>
      )}
    </div>
  )
}
