import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { useReminder, useSaveReminder } from '../api/planQueries'
import { REMINDER_TIMES } from '../plan'

/**
 * The design's "Nhắc học hằng ngày · 20:00 mỗi ngày" toggle, with the time to choose. Each change is saved at once
 * and shown straight away; a failed save puts the previous setting back.
 */
export function ReminderCard() {
  const reminder = useReminder()
  const save = useSaveReminder()
  // While a save is on its way, show what the learner just chose.
  const setting = save.isPending ? save.variables : reminder.data

  function change(patch) {
    save.mutate({ ...setting, ...patch })
  }

  return (
    <section aria-labelledby="reminder-title" className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 id="reminder-title" className="text-lg font-semibold text-ink">
        Nhắc học hằng ngày
      </h2>
      {reminder.isPending && <Skeleton className="h-12 w-full rounded-[10px]" />}
      {reminder.isError && (
        <LoadError error={reminder.error} onRetry={() => reminder.refetch()} message="Không tải được cài đặt nhắc học." />
      )}
      {setting && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ink">Nhắc tôi học mỗi ngày</span>
              <span className="text-xs text-muted">{setting.enabled ? `${setting.time} mỗi ngày` : 'Đang tắt'}</span>
            </div>
            <Switch checked={setting.enabled} onChange={(enabled) => change({ enabled })} label="Nhắc tôi học mỗi ngày" hideLabel />
          </div>
          {setting.enabled && (
            <label className="flex items-center justify-between gap-3 text-label text-ink-soft">
              Giờ nhắc
              <select
                value={setting.time}
                onChange={(event) => change({ time: event.target.value })}
                className="rounded-lg border border-line bg-white px-3 py-2 text-body text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
              >
                {REMINDER_TIMES.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p aria-live="polite" className="text-xs text-muted">
            {save.isPending ? 'Đang lưu…' : save.isSuccess ? 'Đã lưu' : ''}
          </p>
          {save.isError && (
            <Alert variant="error">{describeApiError(save.error, 'Không lưu được cài đặt nhắc học. Vui lòng thử lại.')}</Alert>
          )}
        </>
      )}
    </section>
  )
}
