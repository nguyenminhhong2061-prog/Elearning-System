import { Segmented } from '../components/controls'
import { InputField, MediaPicker, SelectField, TextAreaField } from '../components/fields'
import { answerSummary, blankOption } from '../editor/draft'
import { AcceptedAnswersEditor, OptionsEditor, QuestionFrame, QuestionPreview } from '../editor/questionParts'
import { TEST_SKILL_LABELS } from '../format'
import { AI_SKILLS, SKILLS, typeFor } from './testDraft'

const MODE_LABELS = { CHOICE: 'Trắc nghiệm', TEXT: 'Điền từ', AI: 'Tự luận (AI chấm)' }

/**
 * One question of the test editor. `locked` (a test with submissions) keeps only the wording editable.
 */
export function TestQuestion({ question, index, count, errors = {}, open, locked, onToggle, onMove, onRemove, onChange }) {
  const meta = `${TEST_SKILL_LABELS[question.skill]} · ${MODE_LABELS[question.mode]} · ${question.points} điểm`

  function changeMode(mode) {
    if (mode === question.mode) return
    onChange({
      ...question,
      mode,
      type: typeFor(question.skill, mode, question.type),
      options: mode === 'CHOICE' ? (question.options.length > 0 ? question.options : [blankOption(), blankOption(), blankOption(), blankOption()]) : [],
      acceptedAnswers: mode === 'TEXT' ? (question.acceptedAnswers.length > 0 ? question.acceptedAnswers : ['']) : [],
    })
  }

  function changeSkill(skill) {
    // Listening and reading are never graded by the AI: fall back to choices.
    const mode = question.mode === 'AI' && !AI_SKILLS.includes(skill) ? 'CHOICE' : question.mode
    const next = { ...question, skill }
    if (mode !== question.mode) {
      Object.assign(next, { mode, options: [blankOption(), blankOption(), blankOption(), blankOption()], acceptedAnswers: [] })
    }
    next.type = typeFor(skill, mode, question.type)
    onChange(next)
  }

  const modeOptions = Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label, disabled: value === 'AI' && !AI_SKILLS.includes(question.skill) }))

  return (
    <QuestionFrame
      index={index}
      count={count}
      meta={meta}
      open={open}
      invalid={Object.keys(errors).length > 0}
      onToggle={onToggle}
      onMove={onMove}
      onRemove={locked ? undefined : onRemove}
      reorderLocked={locked}
      preview={<QuestionPreview text={question.content} answer={question.mode === 'AI' ? ['Chấm', 'AI chấm theo thang 0–100'] : answerSummary(question)} />}
    >
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label="Kỹ năng"
          value={question.skill}
          disabled={locked}
          onChange={(event) => changeSkill(event.target.value)}
          options={SKILLS.map((skill) => ({ value: skill, label: TEST_SKILL_LABELS[skill] }))}
          className="w-32"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-label font-medium text-ink-soft">Cách chấm</span>
          <Segmented label="Loại câu" size="sm" options={modeOptions.map((option) => ({ ...option, disabled: option.disabled || locked }))} value={question.mode} onChange={changeMode} />
        </div>
        <InputField
          label="Điểm"
          type="number"
          min={1}
          inputMode="numeric"
          disabled={locked}
          value={question.points}
          error={errors.points}
          onChange={(event) => onChange({ ...question, points: event.target.value === '' ? 0 : Number(event.target.value) })}
          className="w-24"
        />
      </div>
      {question.skill === 'LISTENING' && (
        <MediaPicker
          kind="AUDIO"
          label="Âm thanh của câu"
          value={question.audioUrl}
          onChange={(audioUrl) => onChange({ ...question, audioUrl })}
          maxBytes={10 * 1024 * 1024}
          emptyTitle="Chưa có âm thanh"
          emptyNote="Không có file thì người học đọc nội dung thông báo trong đề bài."
        />
      )}
      <TextAreaField
        label="Đề bài *"
        lang="en"
        rows={question.skill === 'READING' || question.skill === 'LISTENING' ? 3 : 2}
        value={question.content}
        error={errors.content}
        onChange={(event) => onChange({ ...question, content: event.target.value })}
      />
      {question.mode === 'CHOICE' && (
        <OptionsEditor options={question.options} onChange={(options) => onChange({ ...question, options })} error={errors.options} locked={locked} lang="en" />
      )}
      {question.mode === 'TEXT' && (
        <AcceptedAnswersEditor answers={question.acceptedAnswers} onChange={(acceptedAnswers) => onChange({ ...question, acceptedAnswers })} error={errors.acceptedAnswers} locked={locked} />
      )}
      {question.mode === 'AI' && (
        <p className="rounded-[10px] bg-surface-alt px-3.5 py-3 text-label leading-4.5 text-ink-soft">
          Trợ lý AI chấm câu trả lời theo thang 0–100, rồi quy ra {question.points} điểm của câu. Khi AI lỗi, bài hiện “Đang chấm” và được chấm lại sau.
        </p>
      )}
    </QuestionFrame>
  )
}
