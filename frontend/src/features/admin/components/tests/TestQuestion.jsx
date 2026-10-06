import { Segmented } from '../controls'
import { InputField, MediaPicker, SelectField, TextAreaField } from '../fields'
import { answerSummary, blankOption } from '../../utils/draft'
import { AcceptedAnswersEditor, OptionsEditor, QuestionFrame, QuestionPreview } from '../editor/questionParts'
import { TEST_SKILL_LABELS } from '../../constants'
import { MATERIAL_SKILLS, materialName, MODES_BY_SKILL, SKILLS, typeFor } from '../../utils/testDraft'

const MODE_LABELS = { CHOICE: 'Trắc nghiệm', TEXT: 'Điền từ', AI: 'Tự luận (AI chấm)' }

/** Fresh answer fields for a grading mode, keeping what fits from before. */
function answersFor(question, mode) {
  return {
    options: mode === 'CHOICE' ? (question.options.length > 0 ? question.options : [blankOption(), blankOption(), blankOption(), blankOption()]) : [],
    acceptedAnswers: mode === 'TEXT' ? (question.acceptedAnswers.length > 0 ? question.acceptedAnswers : ['']) : [],
  }
}

/**
 * One question of the test editor (scenario 24, step 7): skill, grading mode, points, the shared material it uses,
 * and its prompt and answers. `locked` (a test with submissions) keeps everything as graded, wording included.
 *
 * @param {object} props
 * @param {object} props.question
 * @param {object[]} props.materials the test's shared materials
 * @param {number} props.index
 * @param {number} props.count
 * @param {Record<string, string>} [props.errors]
 * @param {boolean} props.open
 * @param {boolean} props.locked
 * @param {() => void} props.onToggle
 * @param {(direction: -1 | 1) => void} props.onMove
 * @param {() => void} props.onRemove
 * @param {(question: object) => void} props.onChange
 */
export function TestQuestion({ question, materials, index, count, errors = {}, open, locked, onToggle, onMove, onRemove, onChange }) {
  const usable = MATERIAL_SKILLS.includes(question.skill) ? materials.filter((material) => material.type === question.skill) : []
  const material = usable.find((candidate) => candidate.key === question.materialKey)
  const meta = [
    TEST_SKILL_LABELS[question.skill],
    MODE_LABELS[question.mode],
    `${question.points} điểm`,
    material && `dùng “${materialName(materials, material)}”`,
    question.vocabularyId && 'tạo từ kho từ vựng',
  ]
    .filter(Boolean)
    .join(' · ')

  function changeMode(mode) {
    if (mode === question.mode) return
    onChange({ ...question, mode, type: typeFor(question.skill, mode), ...answersFor(question, mode) })
  }

  function changeSkill(skill) {
    const modes = MODES_BY_SKILL[skill]
    const mode = modes.includes(question.mode) ? question.mode : modes[0]
    const keepsMaterial = materials.some((candidate) => candidate.key === question.materialKey && candidate.type === skill)
    onChange({
      ...question,
      skill,
      mode,
      type: typeFor(skill, mode),
      materialKey: keepsMaterial ? question.materialKey : null,
      ...(mode === question.mode ? {} : answersFor({ ...question, options: [], acceptedAnswers: [] }, mode)),
    })
  }

  const modeOptions = Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label, disabled: locked || !MODES_BY_SKILL[question.skill].includes(value) }))

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
      preview={<QuestionPreview text={question.content} answer={question.mode === 'AI' ? ['Chấm', 'AI chấm theo thang 10'] : answerSummary(question)} />}
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
          <Segmented label="Cách chấm" size="sm" options={modeOptions} value={question.mode} onChange={changeMode} />
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
      {MATERIAL_SKILLS.includes(question.skill) && (
        <SelectField
          label="Tài liệu dùng chung"
          value={material?.key ?? ''}
          disabled={locked}
          onChange={(event) => onChange({ ...question, materialKey: event.target.value || null })}
          hint={usable.length === 0 ? `Thêm “${question.skill === 'LISTENING' ? 'Bài nghe' : 'Bài đọc'} chung” ở khung tài liệu để nhiều câu dùng chung.` : undefined}
          options={[{ value: '', label: 'Không dùng tài liệu chung' }, ...usable.map((candidate) => ({ value: candidate.key, label: materialName(materials, candidate) }))]}
        />
      )}
      {question.skill === 'LISTENING' && !material && (
        <MediaPicker
          kind="AUDIO"
          label="Âm thanh của câu"
          value={question.audioUrl}
          onChange={(audioUrl) => onChange({ ...question, audioUrl })}
          maxBytes={10 * 1024 * 1024}
          emptyTitle="Chưa có âm thanh"
          emptyNote="Không có file thì người học đọc nội dung thông báo trong đề bài."
          disabled={locked}
        />
      )}
      <TextAreaField
        label="Đề bài *"
        lang="en"
        rows={question.skill === 'READING' || question.skill === 'LISTENING' ? 3 : 2}
        disabled={locked}
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
          Trợ lý AI chấm câu trả lời theo thang 10, rồi quy ra {question.points} điểm của câu. Khi AI lỗi, bài hiện “Đang chấm” và được chấm lại sau.
        </p>
      )}
    </QuestionFrame>
  )
}
