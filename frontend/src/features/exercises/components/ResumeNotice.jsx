import { describeApiError } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'

/**
 * Top of a lesson picked up where the learner left it: what was kept, and a way to start over instead.
 *
 * @param {object} props
 * @param {string} props.detail what was kept, such as "2/6 câu đã trả lời"
 * @param {() => void} props.onRestart
 * @param {boolean} props.restarting
 * @param {unknown} props.restartError
 */
export function ResumeNotice({ detail, onRestart, restarting, restartError }) {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-brand-tint-line bg-brand-tint px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label text-brand-dark">
          <span className="font-semibold">Làm tiếp từ lần trước.</span> Giữ lại {detail}.
        </p>
        <Button size="sm" variant="outline" onClick={onRestart} loading={restarting}>
          Làm lại từ đầu
        </Button>
      </div>
      {restartError && (
        <p role="alert" className="text-label font-semibold text-danger">
          {describeApiError(restartError, 'Chưa làm lại được. Hãy thử lại.')}
        </p>
      )}
    </div>
  )
}
