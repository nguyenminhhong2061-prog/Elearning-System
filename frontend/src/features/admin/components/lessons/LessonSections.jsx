import { useState } from 'react'
import { cx } from '@/lib/cx'
import { Segmented } from '../controls'
import { InputField, MediaPicker, SelectField, TextAreaField } from '../fields'
import { answerSummary, blankOption, formatClockMs, move, parseClockMs, removeAt, replaceAt } from '../../utils/draft'
import { AcceptedAnswersEditor, OptionsEditor, QuestionFrame, QuestionPreview } from '../editor/questionParts'
import { SKILL_LABELS } from '../../constants'
import { newItem, newQuestion, newSegment } from '../../utils/lessonDraft'

const CARD = 'flex flex-col gap-4 rounded-xl border border-line bg-white px-5.5 py-5'
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const DIFFICULTIES = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Vừa' },
  { value: 'HARD', label: 'Khó' },
]
const STATUSES = [
  { value: 'DRAFT', label: 'Nháp', note: 'Người học chưa thấy bài.' },
  { value: 'PUBLISHED', label: 'Đã xuất bản', note: 'Hiện trong danh sách bài tập.' },
  { value: 'HIDDEN', label: 'Lưu trữ', note: 'Ẩn với người học, giữ lịch sử làm bài.' },
]

/** Left column: title, level, difficulty, time and status. */
export function LessonInfo({ draft, errors, isNew, onChange, onDelete }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value })
  return (
    <section aria-labelledby="lesson-info" className={cx(CARD, 'self-start')}>
      <h2 id="lesson-info" className="text-base font-bold text-ink">
        Thông tin bài
      </h2>
      <InputField label="Tiêu đề *" value={draft.title} onChange={set('title')} error={errors.title} maxLength={150} />
      <TextAreaField label="Mô tả" rows={3} value={draft.description} onChange={set('description')} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Kỹ năng"
          value={draft.skill}
          disabled={!isNew}
          hint={isNew ? undefined : 'Không đổi được sau khi tạo.'}
          onChange={set('skill')}
          options={Object.entries(SKILL_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Trình độ *"
          value={draft.cefrLevel}
          onChange={set('cefrLevel')}
          error={errors.cefrLevel}
          options={[{ value: '', label: 'Chọn' }, ...LEVELS.map((level) => ({ value: level, label: level }))]}
        />
      </div>
      <InputField label="Chủ đề (không bắt buộc)" value={draft.topic} onChange={set('topic')} placeholder="Ví dụ: Thì của động từ" />
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-label font-medium text-ink-soft">Độ khó</legend>
        <Segmented label="Độ khó" options={DIFFICULTIES} value={draft.difficulty} onChange={(difficulty) => onChange({ ...draft, difficulty })} className="self-start" />
      </fieldset>
      <InputField
        label="Thời gian ước tính (phút)"
        type="number"
        min={1}
        inputMode="numeric"
        value={draft.estimatedMinutes ?? ''}
        error={errors.estimatedMinutes}
        onChange={(event) => onChange({ ...draft, estimatedMinutes: event.target.value === '' ? null : Number(event.target.value) })}
        className="[&_input]:w-28"
      />
      <fieldset disabled={isNew} className="flex min-w-0 flex-col gap-2 disabled:opacity-70">
        <legend className="mb-2 text-label font-medium text-ink-soft">Trạng thái{isNew && ' (bài mới lưu ở dạng Nháp)'}</legend>
        {STATUSES.map((status) => (
          <label
            key={status.value}
            className={cx(
              'flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-3 has-focus-visible:outline-2 has-focus-visible:outline-brand',
              draft.status === status.value ? 'border-brand-dark bg-brand-tint' : 'border-line hover:bg-surface-alt',
            )}
          >
            <input
              type="radio"
              name="lesson-status"
              value={status.value}
              checked={draft.status === status.value}
              onChange={() => onChange({ ...draft, status: status.value })}
              className="mt-0.5 size-4 accent-brand-dark"
            />
            <span className="flex flex-col gap-0.5 text-label">
              <strong className="text-ink">{status.label}</strong>
              <span className="text-muted-strong">{status.note}</span>
            </span>
          </label>
        ))}
        {errors.items && draft.status === 'PUBLISHED' && <p className="text-xs text-danger">{errors.items}</p>}
      </fieldset>
      {!isNew && (
        <button
          type="button"
          onClick={onDelete}
          className="self-start cursor-pointer rounded-md px-2 py-1.5 text-label font-bold text-danger hover:bg-danger-bg focus-visible:outline-2 focus-visible:outline-brand"
        >
          Xóa bài tập…
        </button>
      )}
    </section>
  )
}

/** Questions of a grammar or listening lesson. */
export function LessonQuestions({ draft, errors, openKeys, onToggle, onChange }) {
  const questions = draft.questions
  const setQuestions = (next) => onChange({ ...draft, questions: next })

  function add() {
    const question = newQuestion()
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

const TYPE_OPTIONS = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'FILL_BLANK', label: 'Điền từ' },
]

function LessonQuestion({ question, index, count, errors = {}, open, onToggle, onMove, onRemove, onChange }) {
  const set = (field) => (event) => onChange({ ...question, [field]: event.target.value })
  const meta = `${question.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Điền từ'} · ${question.points} điểm`

  function changeType(type) {
    if (type === question.type) return
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
      preview={<QuestionPreview text={question.prompt} answer={answerSummary(question)} />}
    >
      <Segmented label="Loại câu" size="sm" options={TYPE_OPTIONS} value={question.type} onChange={changeType} className="self-start" />
      <InputField label="Đề bài *" lang="en" hint="Dùng ___ cho chỗ trống." value={question.prompt} onChange={set('prompt')} error={errors.prompt} />
      {question.type === 'MULTIPLE_CHOICE' ? (
        <OptionsEditor options={question.options} onChange={(options) => onChange({ ...question, options })} error={errors.options} lang="en" />
      ) : (
        <AcceptedAnswersEditor answers={question.acceptedAnswers} onChange={(acceptedAnswers) => onChange({ ...question, acceptedAnswers })} error={errors.acceptedAnswers} />
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

/** A time typed as "0:08.5": kept as text while typing, read when the field is left. */
function TimeInput({ value, onChange, label, invalid }) {
  const [text, setText] = useState(formatClockMs(value))
  const [shownValue, setShownValue] = useState(value)
  if (value !== shownValue) {
    // The value changed from outside (a new row, an undo): show it.
    setShownValue(value)
    setText(formatClockMs(value))
  }
  return (
    <input
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const ms = parseClockMs(text)
        setShownValue(ms)
        onChange(ms)
        if (ms !== null) setText(formatClockMs(ms))
      }}
      inputMode="decimal"
      placeholder="0:00.0"
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      className={cx(
        'w-20 rounded-md border bg-white px-2 py-1.75 font-mono text-label text-ink outline-none focus:ring-2',
        invalid ? 'border-danger-solid focus:ring-danger-solid/20' : 'border-line focus:border-brand focus:ring-brand/25',
      )}
    />
  )
}

/** Audio file, transcript and subtitle segments of a listening lesson. */
export function ListeningPassage({ draft, errors, onChange }) {
  const passage = draft.passage
  const setPassage = (next) => onChange({ ...draft, passage: { ...passage, ...next } })
  const segments = passage.segments
  const setSegments = (next) => setPassage({ segments: next })
  const cell = 'border-b border-canvas px-2 py-2 align-top'
  const textInput = (invalid) =>
    cx(
      'w-full rounded-md border bg-white px-2 py-1.75 text-label text-ink outline-none focus:ring-2',
      invalid ? 'border-danger-solid focus:ring-danger-solid/20' : 'border-line focus:border-brand focus:ring-brand/25',
    )

  return (
    <>
      <section aria-labelledby="lesson-audio" className={CARD}>
        <h2 id="lesson-audio" className="text-base font-bold text-ink">
          Bài nghe
        </h2>
        <MediaPicker
          kind="AUDIO"
          label="File âm thanh *"
          value={passage.audioUrl}
          onChange={(audioUrl) => setPassage({ audioUrl, audioMissing: !audioUrl })}
          maxBytes={10 * 1024 * 1024}
          emptyTitle="Chưa có file âm thanh"
          emptyNote="Người học không nghe được bài cho tới khi có file."
          allowUrl
          urlError={errors.audioUrl}
        />
        <div className="grid gap-3 xl:grid-cols-2">
          <TextAreaField
            label="Transcript đầy đủ (tiếng Anh) *"
            lang="en"
            rows={4}
            value={passage.transcript}
            onChange={(event) => setPassage({ transcript: event.target.value })}
            error={errors.transcript}
          />
          <TextAreaField label="Bản dịch (hiện sau khi nộp bài)" rows={4} value={passage.translation} onChange={(event) => setPassage({ translation: event.target.value })} />
        </div>
      </section>

      <section aria-labelledby="lesson-segments" className={CARD}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="lesson-segments" className="text-base font-bold text-ink">
            Đoạn phụ đề ({segments.length})
          </h2>
          <span className="text-label text-muted-strong">Người học bấm một đoạn để nghe lại đoạn đó</span>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-220 border-collapse text-label">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-soft">
                <th scope="col" className="border-b border-line px-2 py-2">#</th>
                <th scope="col" className="border-b border-line px-2 py-2">Bắt đầu</th>
                <th scope="col" className="border-b border-line px-2 py-2">Kết thúc</th>
                <th scope="col" className="border-b border-line px-2 py-2">Người nói</th>
                <th scope="col" className="border-b border-line px-2 py-2">Câu tiếng Anh *</th>
                <th scope="col" className="border-b border-line px-2 py-2">Bản dịch</th>
                <th scope="col" className="border-b border-line px-2 py-2">
                  <span className="sr-only">Xóa</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment, index) => {
                const segmentErrors = errors.segments[segment.key] ?? {}
                const update = (change) => setSegments(replaceAt(segments, index, { ...segment, ...change }))
                const number = index + 1
                return (
                  <tr key={segment.key}>
                    <td className={cx(cell, 'pt-3.5 font-semibold text-ink-soft')}>{number}</td>
                    <td className={cell}>
                      <TimeInput label={`Bắt đầu đoạn ${number}`} value={segment.startMs} invalid={segmentErrors.startMs} onChange={(startMs) => update({ startMs })} />
                    </td>
                    <td className={cell}>
                      <TimeInput label={`Kết thúc đoạn ${number}`} value={segment.endMs} invalid={segmentErrors.endMs} onChange={(endMs) => update({ endMs })} />
                      {segmentErrors.endMs && <p className="mt-1 max-w-24 text-xs text-danger">{segmentErrors.endMs}</p>}
                    </td>
                    <td className={cell}>
                      <input aria-label={`Người nói đoạn ${number}`} value={segment.speaker} onChange={(event) => update({ speaker: event.target.value })} className={cx(textInput(false), 'w-28')} />
                    </td>
                    <td className={cell}>
                      <input
                        aria-label={`Câu tiếng Anh đoạn ${number}`}
                        lang="en"
                        value={segment.text}
                        onChange={(event) => update({ text: event.target.value })}
                        aria-invalid={segmentErrors.text ? true : undefined}
                        className={cx(textInput(segmentErrors.text), 'min-w-64')}
                      />
                    </td>
                    <td className={cell}>
                      <input aria-label={`Bản dịch đoạn ${number}`} value={segment.translation} onChange={(event) => update({ translation: event.target.value })} className={cx(textInput(false), 'min-w-56')} />
                    </td>
                    <td className={cell}>
                      <button
                        type="button"
                        onClick={() => setSegments(removeAt(segments, index))}
                        aria-label={`Xóa đoạn ${number}`}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-lg text-ink-soft hover:bg-canvas"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setSegments([...segments, newSegment(segments.length > 0 ? (segments.at(-1).endMs ?? 0) + 500 : 0)])}
          className="self-start cursor-pointer rounded-md px-2 py-1.5 text-label font-bold text-brand-dark hover:bg-brand-tint"
        >
          + Thêm đoạn
        </button>
      </section>
    </>
  )
}

/** Model sentences of a pronunciation lesson. */
export function PronunciationItems({ draft, errors, onChange }) {
  const items = draft.pronunciationItems
  const setItems = (next) => onChange({ ...draft, pronunciationItems: next })
  return (
    <section aria-labelledby="lesson-items" className="flex flex-col gap-3">
      <h2 id="lesson-items" className="text-base font-bold text-ink">
        Câu mẫu ({items.length})
      </h2>
      {errors.items && items.length === 0 && <p className="text-label font-semibold text-danger">{errors.items}</p>}
      {items.map((item, index) => {
        const itemErrors = errors.itemErrors[item.key] ?? {}
        const update = (change) => setItems(replaceAt(items, index, { ...item, ...change }))
        return (
          <article key={item.key} className={cx(CARD, itemErrors.text && 'border-danger-solid')}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">Câu mẫu {index + 1}</h3>
              <div className="ml-auto flex gap-1">
                <button type="button" aria-label={`Chuyển câu mẫu ${index + 1} lên`} disabled={index === 0} onClick={() => setItems(move(items, index, -1))} className="size-8 cursor-pointer rounded-md border border-line text-sm disabled:opacity-40">
                  ↑
                </button>
                <button type="button" aria-label={`Chuyển câu mẫu ${index + 1} xuống`} disabled={index === items.length - 1} onClick={() => setItems(move(items, index, 1))} className="size-8 cursor-pointer rounded-md border border-line text-sm disabled:opacity-40">
                  ↓
                </button>
                <button type="button" onClick={() => setItems(removeAt(items, index))} className="cursor-pointer rounded-md px-2.5 text-label font-bold text-danger hover:bg-danger-bg">
                  Xóa
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField label="Câu hoặc từ *" lang="en" value={item.text} error={itemErrors.text} onChange={(event) => update({ text: event.target.value })} />
              <InputField label="Phiên âm IPA" lang="en" value={item.ipa} onChange={(event) => update({ ipa: event.target.value })} placeholder="/ˈʃedjuːl/" />
            </div>
            <InputField label="Ghi chú cách đọc" value={item.notes} onChange={(event) => update({ notes: event.target.value })} />
            <MediaPicker
              kind="AUDIO"
              label="Âm thanh mẫu"
              value={item.audioUrl}
              onChange={(audioUrl) => update({ audioUrl })}
              maxBytes={1024 * 1024}
              emptyTitle="Không bắt buộc"
              emptyNote="Không có thì người học nghe giọng đọc của trình duyệt."
            />
          </article>
        )
      })}
      <button
        type="button"
        onClick={() => setItems([...items, newItem()])}
        className="cursor-pointer rounded-xl border-[1.5px] border-dashed border-brand-tint-line bg-white px-5 py-4 text-label font-bold text-brand-dark hover:bg-brand-tint"
      >
        + Thêm câu mẫu
      </button>
    </section>
  )
}
