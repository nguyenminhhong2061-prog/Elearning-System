import { Button } from '@/components/ui/Button'
import { cx } from '@/lib/cx'
import { scoreText, scoreTone } from './writing'

const TONES = {
  success: 'border-success-line bg-success-bg text-success',
  warning: 'border-warning-solid/40 bg-warning-bg text-warning',
  danger: 'border-danger-solid/30 bg-danger-bg text-danger',
}

/**
 * The grading box of a writing answer (scenario 10, step 8), grown from the reading's "✓ Chính xác!" box: the points,
 * the AI's feedback, the sample answers and the question's explanation. When the AI could not grade the answer
 * (branch 7b) it says so in red, with "Gửi chấm lại" (the saved answer is sent again; nothing is scored meanwhile).
 * `children` adds an action at the bottom (asking the AI assistant).
 *
 * @param {object} props
 * @param {import('../types').WritingResult} props.result
 * @param {() => void} props.onRegrade
 * @param {boolean} props.regrading
 * @param {string | null} [props.regradeError]
 */
export function WritingFeedback({ result, onRegrade, regrading, regradeError = null, children }) {
  if (!result.graded) {
    return (
      <div className={cx('flex flex-col items-start gap-2 rounded-[10px] border p-3.5 text-sm', TONES.danger)}>
        <p className="font-semibold">Chưa chấm được câu này</p>
        <p className="leading-relaxed text-ink-soft">
          Trợ lý AI đang bận hoặc mất kết nối. Câu trả lời của bạn đã được lưu: bấm “Gửi chấm lại”, hoặc làm câu tiếp theo rồi chấm
          lại sau.
        </p>
        {regradeError && <p>{regradeError}</p>}
        <Button type="button" variant="outline" size="sm" loading={regrading} onClick={onRegrade}>
          Gửi chấm lại
        </Button>
      </div>
    )
  }

  return (
    <div className={cx('flex flex-col gap-2.5 rounded-[10px] border p-3.5 text-sm', TONES[scoreTone(result)])}>
      <p className="text-base font-bold">Điểm {scoreText(result)}</p>
      {result.feedback && (
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Nhận xét của trợ lý AI</p>
          <p className="leading-relaxed text-ink">{result.feedback}</p>
        </div>
      )}
      {result.sampleAnswers.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Câu trả lời mẫu</p>
          <ul className="flex list-disc flex-col gap-0.5 pl-5 text-ink">
            {result.sampleAnswers.map((sample) => (
              <li key={sample} lang="en">
                {sample}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.explanation && <p className="leading-relaxed text-ink-soft">{result.explanation}</p>}
      {children}
    </div>
  )
}
