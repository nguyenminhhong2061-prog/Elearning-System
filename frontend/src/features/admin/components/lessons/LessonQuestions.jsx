import { WRITING_TYPE_LABELS } from '../../constants'
import { answerSummary, blankOption, move, removeAt, replaceAt } from '../../utils/draft'
import { newQuestion } from '../../utils/lessonDraft'
import { Segmented } from '../controls'
import { AcceptedAnswersEditor, OptionsEditor, QuestionFrame, QuestionPreview, SampleAnswersEditor } from '../editor/questionParts'
import { InputField, SelectField, TextAreaField } from '../fields'

const CHOICE_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'FILL_BLANK', label: 'Điền từ' },
]
const WRITING_TYPES = Object.entries(WRITING_TYPE_LABELS).map(([value, label]) => ({ value, label }))

/** What the prompt field holds for each kind of writing question (docs/api/exercises.md). */
const WRITING_PROMPTS = {
  TRANSLATION: { label: 'Câu tiếng Việt cần dịch *', hint: 'Người học dịch câu này sang tiếng Anh.', lang: 'vi' },
  REWRITE: { label: 'Câu gốc *', hint: 'Người học viết lại câu sao cho nghĩa không đổi.', lang: 'en' },
  KEYWORD_SENTENCE: { label: 'Từ khóa *', hint: 'Cách nhau bằng “ / ”, ví dụ: luggage / heavy / carry.', lang: 'en' },
}

/**
 * Scenario 23, steps 7–10 and branches 3a, 3b: the questions of a reading, writing or listening lesson.
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {{ questions: Record<string, Record<string, string>>, items?: string }} props.errors
 * @param {Set<string>} props.openKeys questions shown with their fields
 * @param {(key: string, forceOpen?: boolean) => void} props.onToggle
 * @param {(draft: object) => void} props.onChange
 */
export function LessonQuestions({ draft, errors, openKeys, onToggle, onChange }) {
  const questions = draft.questions
  const setQuestions = (next) => onChange({ ...draft, questions: next })

  function add() {
    const question = newQuestion(draft.skill)
    setQuestions([...questions, question])
    onToggle(question.key, true)
  }

  return (
    <section aria-labelledby="lesson-questions" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="lesson-questions" className="text-base font-bold text-ink">
          Câu hỏi ({questions.length})
        </h2>
        <button type="button" onClick={add} className="cursor-pointer rounded-md px-2.5 py-1.5 text-label font-bold text-brand-dark hover:bg-brand-tint">
          + Thêm câu hỏi
        </button>
      </div>
      {errors.items && questions.length === 0 && <p className="text-label font-semibold text-danger">{errors.items}</p>}
      {questions.map((question, index) => (
        <LessonQuestion
          key={question.key}
          question={question}
          skill={draft.skill}
          passages={draft.readingPassages}
          index={index}
          count={questions.length}
          errors={errors.questions[question.key]}
          open={openKeys.has(question.key)}
          onToggle={() => onToggle(question.key)}
          onMove={(direction) => setQuestions(move(questions, index, direction))}
          onRemove={() => setQuestions(removeAt(questions, index))}
          onChange={(next) => setQuestions(replaceAt(questions, index, next))}
        />
      ))}
      <button
        type="button"
        onClick={add}
        className="cursor-pointer rounded-xl border-[1.5px] border-dashed border-brand-tint-line bg-white px-5 py-4 text-label font-bold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
      >
        + Thêm câu hỏi
      </button>
    </section>
  )
}

function typeLabel(question) {
  return WRITING_TYPE_LABELS[question.type] ?? CHOICE_TYPES.find((type) => type.value === question.type)?.label
}

function LessonQuestion({ question, skill, passages, index, count, errors = {}, open, onToggle, onMove, onRemove, onChange }) {
  const writing = skill === 'WRITING'
  const set = (field) => (event) => onChange({ ...question, [field]: event.target.value })
  const passage = passages.find((candidate) => candidate.key === question.passageKey)
  const meta = [typeLabel(question), passage && `bài đọc “${passage.title || 'chưa đặt tên'}”`, `${question.points} điểm`].filter(Boolean).join(' · ')
  const samples = question.sampleAnswers.filter((answer) => answer.trim())

  function changeType(type) {
    if (type === question.type || writing) return onChange({ ...question, type })
    onChange({
      ...question,
      type,
      options: type === 'MULTIPLE_CHOICE' ? (question.options.length > 0 ? question.options : [blankOption(), blankOption(), blankOption()]) : [],
      acceptedAnswers: type === 'FILL_BLANK' ? (question.acceptedAnswers.length > 0 ? question.acceptedAnswers : ['']) : [],
    })
  }

  return (
    <QuestionFrame
      index={index}
      count={count}
      meta={meta}
      open={open}
      invalid={Object.keys(errors).length > 0}
      onToggle={onToggle}
      onMove={onMove}
      onRemove={onRemove}
      preview={
        <QuestionPreview
          text={question.prompt}
          lang={question.type === 'TRANSLATION' ? 'vi' : 'en'}
          answer={writing ? samples.length > 0 && ['Câu mẫu', samples[0]] : answerSummary(question)}
        />
      }
    >
      <Segmented
        label={writing ? 'Dạng câu' : 'Loại câu'}
        size="sm"
        options={writing ? WRITING_TYPES : CHOICE_TYPES}
        value={question.type}
        onChange={changeType}
        className="self-start"
      />
      {skill === 'READING' && (
        <SelectField
          label="Bài đọc liên quan"
          value={question.passageKey ?? ''}
          onChange={(event) => onChange({ ...question, passageKey: event.target.value || null })}
          hint={passages.length === 0 ? 'Thêm bài đọc ở khung “Bài đọc” để gắn câu hỏi với bài.' : undefined}
          options={[
            { value: '', label: 'Không gắn bài đọc' },
            ...passages.map((candidate, position) => ({ value: candidate.key, label: candidate.title.trim() || `Bài đọc ${position + 1}` })),
          ]}
        />
      )}
      {writing ? (
        <WritingFields question={question} errors={errors} onChange={onChange} />
      ) : (
        <>
          <InputField label="Đề bài *" lang="en" hint="Dùng ___ cho chỗ trống." value={question.prompt} onChange={set('prompt')} error={errors.prompt} />
          {question.type === 'MULTIPLE_CHOICE' ? (
            <OptionsEditor options={question.options} onChange={(options) => onChange({ ...question, options })} error={errors.options} lang="en" />
          ) : (
            <AcceptedAnswersEditor answers={question.acceptedAnswers} onChange={(acceptedAnswers) => onChange({ ...question, acceptedAnswers })} error={errors.acceptedAnswers} />
          )}
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <InputField label="Gợi ý (hiện khi người học bấm “Gợi ý”)" value={question.hint} onChange={set('hint')} />
        <InputField
          label="Điểm"
          type="number"
          min={1}
          inputMode="numeric"
          value={question.points}
          error={errors.points}
          onChange={(event) => onChange({ ...question, points: event.target.value === '' ? 0 : Number(event.target.value) })}
        />
      </div>
      <TextAreaField label="Giải thích (chỉ hiện sau khi người học trả lời)" value={question.explanation} onChange={set('explanation')} />
    </QuestionFrame>
  )
}

/** Scenario 23, branch 3a: the sentence to translate, rewrite or build from keywords, and the sample answers. */
function WritingFields({ question, errors, onChange }) {
  const prompt = WRITING_PROMPTS[question.type]
  return (
    <>
      <TextAreaField
        label={prompt.label}
        lang={prompt.lang}
        hint={prompt.hint}
        value={question.prompt}
        error={errors.prompt}
        onChange={(event) => onChange({ ...question, prompt: event.target.value })}
      />
      {question.type === 'REWRITE' && (
        <InputField
          label="Phần mở đầu cho sẵn (không bắt buộc)"
          lang="en"
          placeholder="Ví dụ: We spent"
          value={question.starter}
          onChange={(event) => onChange({ ...question, starter: event.target.value })}
        />
      )}
      <SampleAnswersEditor answers={question.sampleAnswers} onChange={(sampleAnswers) => onChange({ ...question, sampleAnswers })} error={errors.sampleAnswers} />
    </>
  )
}
