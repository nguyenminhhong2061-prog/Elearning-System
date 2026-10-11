import { useId, useState } from 'react'
import { WRITING_TYPES } from '../constants'
import { feedbackSummary, scoreText, scoreTone } from './writing'
import { TranslationAssessmentView } from './TranslationAssessmentView'

const SCORE_COLOURS = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' }

function ReviewItem({ number, question, item, onAsk }) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const summary = feedbackSummary(item.feedback)

  return (
    <li className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-white p-4 text-sm">
      <p className="text-xs font-semibold text-muted">
        Câu {number} · {WRITING_TYPES[question.type].label} ·{' '}
        <span className={SCORE_COLOURS[scoreTone(item)]}>{scoreText(item)} điểm</span>
      </p>
      <p lang={question.type === 'TRANSLATION' ? 'vi' : 'en'} className={`font-semibold text-ink ${question.type === 'PARAGRAPH_TRANSLATION' ? 'whitespace-pre-line' : ''}`}>
        {question.prompt}
        {question.starter && ` → ${question.starter} …`}
      </p>
      <p className="text-ink-soft">
        Câu trả lời của bạn: {item.answer ? <span lang={question.type === 'PARAGRAPH_TRANSLATION' ? 'vi' : 'en'} className="text-ink">{item.answer}</span> : <em>chưa trả lời</em>}
      </p>
      {summary && !open && <p className="leading-relaxed text-ink-soft">{summary}</p>}
      <div id={detailsId} hidden={!open} className="flex flex-col gap-1.5 border-t border-line pt-2">
        {item.feedback && (
          <p className="leading-relaxed text-ink">
            <span className="font-semibold">Nhận xét của trợ lý AI: </span>
            {item.feedback}
          </p>
        )}
        {item.sampleAnswers.length > 0 && (
          <div>
            <p className="font-semibold text-ink">Câu trả lời mẫu</p>
            <ul className="list-disc pl-5 text-ink">
              {item.sampleAnswers.map((sample) => (
                <li key={sample} lang="en">
                  {sample}
                </li>
              ))}
            </ul>
          </div>
        )}
        {item.explanation && <p className="leading-relaxed text-ink-soft">{item.explanation}</p>}
        {item.translationAssessment && <TranslationAssessmentView assessment={item.translationAssessment} />}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen(!open)}
          className="cursor-pointer text-label font-semibold text-brand-dark hover:text-brand"
        >
          {open ? 'Ẩn chi tiết' : 'Xem chi tiết'}
        </button>
        <button type="button" onClick={() => onAsk(item.questionId)} className="cursor-pointer text-label font-semibold text-brand-dark hover:text-brand">
          Hỏi trợ lý AI về câu này →
        </button>
      </div>
    </li>
  )
}

/**
 * Below the result of a writing lesson (scenario 10, step 14): every question with what the learner wrote, the points
 * and the first sentence of the AI's feedback; "Xem chi tiết" shows the whole feedback, the sample answers and the
 * explanation again.
 *
 * @param {object} props
 * @param {import('../types').Lesson} props.lesson
 * @param {import('../types').WritingResult[]} props.review
 * @param {(questionId: number) => void} props.onAsk opens the AI assistant about that question
 */
export function WritingReview({ lesson, review, onAsk }) {
  const questions = new Map(lesson.questions.map((question) => [question.id, question]))
  return (
    <section aria-labelledby="review-title" className="flex flex-col gap-3">
      <h2 id="review-title" className="text-base font-semibold text-ink">
        Xem lại từng câu
      </h2>
      <ol className="flex flex-col gap-2.5">
        {review.map((item, index) => (
          <ReviewItem key={item.questionId} number={index + 1} question={questions.get(item.questionId)} item={item} onAsk={onAsk} />
        ))}
      </ol>
    </section>
  )
}
