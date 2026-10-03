import { useState } from 'react'
import { cx } from '@/lib/cx'
import { formatClockMs, parseClockMs, removeAt, replaceAt } from '../../utils/draft'
import { newSegment } from '../../utils/lessonDraft'
import { MediaPicker, TextAreaField } from '../fields'
import { LESSON_CARD } from './LessonInfo'

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

/**
 * Scenario 23, branch 3b: the one passage of a listening lesson: audio file, transcript, translation and the subtitle
 * segments (times typed as "0:00.0", speaker, sentence and its translation).
 */
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
      <section aria-labelledby="lesson-audio" className={LESSON_CARD}>
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

      <section aria-labelledby="lesson-segments" className={LESSON_CARD}>
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
