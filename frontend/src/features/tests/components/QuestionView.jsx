import { Card } from '@/components/ui/Card'
import { ChoiceOptions } from '@/components/ui/ChoiceOptions'
import { Tag } from '@/components/ui/Tag'
import { TextField } from '@/components/ui/TextField'
import { isChoice, isReadAloud } from '../answers'
import { QUESTION_TYPES, SKILL_LABELS } from '../constants'
import { ReadAloudAnswer } from './ReadAloudAnswer'

function TextAnswer({ question, value, onChange }) {
  const long = question.type === QUESTION_TYPES.WRITING || question.type === QUESTION_TYPES.SPEAKING

  if (!long) {
    return (
      <TextField
        label="Câu trả lời của bạn"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        placeholder="Gõ đáp án…"
      />
    )
  }

  const speaking = question.type === QUESTION_TYPES.SPEAKING
  // Scenario 15, step 10: the essay shows how many words it has.
  const words = value.trim() ? value.trim().split(/\s+/).length : 0
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-label font-medium text-ink-soft">
          {speaking ? 'Gõ câu bạn sẽ đọc (bản demo chưa thu âm)' : 'Bài viết của bạn'}
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={speaking ? 3 : 6}
          maxLength={5000}
          className="w-full rounded-lg border border-line bg-white px-4 py-3.5 text-body text-ink outline-none transition-colors placeholder:text-muted-light focus:border-brand focus:ring-2 focus:ring-brand/25"
          placeholder={speaking ? 'Đọc to câu trên rồi gõ lại…' : 'Viết câu trả lời của bạn…'}
        />
      </label>
      {!speaking && (
        <span aria-live="polite" className="self-end text-xs text-muted">
          {words} từ
        </span>
      )}
    </div>
  )
}

/**
 * One test question with its answer input: the design's pill options (native radios) for choice questions, a
 * recorder for read-aloud questions, a text field or text area for the other typed ones.
 *
 * @param {object} props
 * @param {number} props.number position in the test, from 1
 * @param {import('../types').TestQuestion} props.question
 * @param {{ optionId?: number | null, text?: string, recorded?: boolean } | undefined} props.answer
 * @param {(optionId: number) => void} props.onPick
 * @param {(text: string) => void} props.onType
 * @param {object | undefined} props.upload the recording of a read-aloud question made on this visit
 * @param {(wav: Blob) => void} props.onRecorded
 * @param {() => void} props.onRetryRecording
 */
export function QuestionView({ number, question, answer, onPick, onType, upload, onRecorded, onRetryRecording }) {
  const skill = question.skill ? SKILL_LABELS[question.skill.toLowerCase()] : null
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {skill && <Tag variant="brand">{skill}</Tag>}
          <Tag>{question.points} điểm</Tag>
        </div>
        <h2 className="text-body font-medium whitespace-pre-line text-ink">
          <span className="sr-only">Câu {number}. </span>
          {question.content}
        </h2>
        {question.audioUrl && (
          <audio controls src={question.audioUrl} className="w-full">
            Trình duyệt của bạn không phát được âm thanh này.
          </audio>
        )}
      </div>
      {isChoice(question) ? (
        <ChoiceOptions
          name={`test-question-${question.id}`}
          label={`Câu ${number}`}
          options={question.options.map((option) => ({ id: option.id, text: option.content }))}
          selectedId={answer?.optionId ?? null}
          onSelect={onPick}
        />
      ) : isReadAloud(question) ? (
        <ReadAloudAnswer
          question={question}
          recorded={Boolean(answer?.recorded)}
          upload={upload}
          onRecorded={onRecorded}
          onRetry={onRetryRecording}
        />
      ) : (
        <TextAnswer question={question} value={answer?.text ?? ''} onChange={onType} />
      )}
    </Card>
  )
}
