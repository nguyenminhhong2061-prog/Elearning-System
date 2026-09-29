import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { formatDate, goalTitle, minutesLabel } from '../plan'
import { WeekList } from './WeekList'

/**
 * The AI's weekly plan for the chosen goal, before it is saved (D2: "xác nhận hoặc chỉnh sửa"): apply it, or change
 * the goal above and ask again.
 *
 * @param {object} props
 * @param {import('../types').PlanDraft} props.draft
 * @param {string | null} props.currentLevel
 * @param {boolean} props.replacing
 * @param {() => void} props.onApply
 * @param {boolean} props.applying
 * @param {unknown} props.error failed save
 */
export function PlanPreview({ draft, currentLevel, replacing, onApply, applying, error }) {
  const totals = draft.weeks.reduce(
    (sum, week) => ({ words: sum.words + week.targetWords, exercises: sum.exercises + week.targetExercises }),
    { words: 0, exercises: 0 },
  )

  return (
    <section aria-labelledby="preview-title" className="flex min-w-0 flex-col gap-4 rounded-xl border-2 border-brand bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="preview-title" className="text-lg font-semibold text-ink">
          Lộ trình gợi ý: {goalTitle(draft.goal, currentLevel)}
        </h2>
        <p className="text-label text-muted">
          {formatDate(draft.startDate)} – {formatDate(draft.endDate)} · {draft.weeks.length} tuần ·{' '}
          {minutesLabel(draft.dailyMinutes)} · tổng {totals.words} từ, {totals.exercises} bài tập
        </p>
      </div>

      {draft.summary && <p className="text-body whitespace-pre-line text-ink-soft">{draft.summary}</p>}

      <div className="max-h-96 overflow-y-auto rounded-[10px] border border-line px-4 py-1">
        <WeekList weeks={draft.weeks} />
      </div>

      {error && <Alert variant="error">{describeApiError(error, 'Không lưu được kế hoạch. Vui lòng thử lại.')}</Alert>}

      <div className="flex flex-col gap-2">
        <Button onClick={onApply} loading={applying} className="self-start">
          Áp dụng kế hoạch
        </Button>
        <p className="text-xs text-muted">
          {replacing
            ? 'Kế hoạch hiện tại sẽ được thay bằng kế hoạch này. Muốn khác, đổi mục tiêu ở trên rồi bấm "Gợi ý lộ trình" lần nữa.'
            : 'Muốn khác, đổi mục tiêu ở trên rồi bấm "Gợi ý lộ trình" lần nữa.'}
        </p>
      </div>
    </section>
  )
}
