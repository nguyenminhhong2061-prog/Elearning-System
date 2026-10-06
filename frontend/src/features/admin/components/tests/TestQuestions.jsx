import { useState } from 'react'
import { TEST_SKILL_LABELS } from '../../constants'
import { move, removeAt, replaceAt } from '../../utils/draft'
import { newTestQuestion, SKILLS, TEMPLATES, wordQuestionDraft } from '../../utils/testDraft'
import { TestQuestion } from './TestQuestion'
import { WordQuestionDialog } from './WordQuestionDialog'

const CHIP =
  'cursor-pointer rounded-full border border-line bg-surface-alt px-3.5 py-2 text-label font-semibold text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-brand'

/**
 * Scenario 24, steps 6–7: the questions of a test, "+ Thêm câu hỏi" by kind and "Thêm câu hỏi từ kho từ vựng".
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {{ fields: Record<string, string>, questions: Record<string, Record<string, string>> }} props.errors
 * @param {Set<string>} props.openKeys questions shown with their fields
 * @param {boolean} props.locked
 * @param {(key: string, forceOpen?: boolean) => void} props.onToggle
 * @param {(draft: object) => void} props.onChange
 */
export function TestQuestions({ draft, errors, openKeys, locked, onToggle, onChange }) {
  const [picking, setPicking] = useState(false)
  const questions = draft.questions
  const setQuestions = (next) => onChange({ ...draft, questions: next })
  const totalPoints = questions.reduce((sum, question) => sum + (Number.isFinite(question.points) ? question.points : 0), 0)
  const skills = SKILLS.filter((skill) => questions.some((question) => question.skill === skill)).map((skill) => TEST_SKILL_LABELS[skill])

  function add(question) {
    setQuestions([...questions, question])
    onToggle(question.key, true)
  }

  return (
    <section aria-labelledby="test-questions" className="flex min-w-0 flex-col gap-3">
      <h2 id="test-questions" className="text-base font-bold text-ink">
        Câu hỏi ({questions.length}){skills.length > 0 && ` · ${skills.join(', ')}`} · {totalPoints} điểm
      </h2>
      {(errors.fields.questions || errors.fields.skills) && <p className="text-label font-semibold text-danger">{errors.fields.questions ?? errors.fields.skills}</p>}
      {questions.map((question, index) => (
        <TestQuestion
          key={question.key}
          question={question}
          materials={draft.materials}
          index={index}
          count={questions.length}
          errors={errors.questions[question.key]}
          open={openKeys.has(question.key)}
          locked={locked}
          onToggle={() => onToggle(question.key)}
          onMove={(direction) => setQuestions(move(questions, index, direction))}
          onRemove={() => setQuestions(removeAt(questions, index))}
          onChange={(next) => setQuestions(replaceAt(questions, index, next))}
        />
      ))}
      {!locked && (
        <div className="flex flex-col gap-3 rounded-xl border-[1.5px] border-dashed border-brand-tint-line bg-white px-5 py-4">
          <span className="text-label font-bold text-brand-dark">+ Thêm câu hỏi</span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((template) => (
              <button key={template.id} type="button" onClick={() => add(newTestQuestion(template))} className={CHIP}>
                {template.label}
              </button>
            ))}
            <button type="button" onClick={() => setPicking(true)} className={CHIP}>
              Thêm câu hỏi từ kho từ vựng
            </button>
          </div>
        </div>
      )}
      <WordQuestionDialog open={picking} onClose={() => setPicking(false)} onAdd={(question) => add(wordQuestionDraft(question))} />
    </section>
  )
}
