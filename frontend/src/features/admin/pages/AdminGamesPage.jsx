import { useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Tag } from '@/components/ui/Tag'
import { useToast } from '@/components/ui/toastContext'
import { useAdminGames, useSyncGameBank, useUpdateGame } from '../api/adminQueries'
import { AdminPage } from '../components/AdminPage'
import { InputField } from '../components/fields'
import { formatFullDate, formatNumber } from '../format'

const DESCRIPTIONS = {
  GUESS_MEANING: 'Chọn nghĩa đúng của từ tiếng Anh',
  QUICK_QUIZ: 'Trả lời càng nhanh càng nhiều điểm',
  WORD_MATCH: 'Nối từ tiếng Anh với nghĩa tiếng Việt',
}
const MIN_SECONDS = 30
const MAX_SECONDS = 600

/** Scenario 19, step 2: the question bank follows the word bank after a sync; games can be switched off or timed. */
export function AdminGamesPage() {
  const games = useAdminGames()
  const sync = useSyncGameBank()
  const update = useUpdateGame()
  const toast = useToast()
  const [drafts, setDrafts] = useState({}) // game id -> { enabled, timeLimitSeconds (text) }
  const [saveError, setSaveError] = useState(null)

  if (games.isPending) {
    return (
      <AdminPage title="Trò chơi từ vựng" section="Nội dung học">
        <div aria-hidden="true" className="grid animate-fade-in-late gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
      </AdminPage>
    )
  }
  if (games.isError) {
    return (
      <AdminPage title="Trò chơi từ vựng" section="Nội dung học">
        <LoadError error={games.error} onRetry={games.refetch} message="Không tải được cài đặt trò chơi. Vui lòng thử lại." />
      </AdminPage>
    )
  }

  const { bank } = games.data
  const missing = bank.systemWordCount - bank.coveredWordCount
  const valueOf = (game) => ({ enabled: game.enabled, timeLimitSeconds: String(game.timeLimitSeconds), ...drafts[game.id] })
  const changed = games.data.games.filter((game) => {
    const draft = valueOf(game)
    return draft.enabled !== game.enabled || draft.timeLimitSeconds !== String(game.timeLimitSeconds)
  })
  const invalid = games.data.games.filter((game) => {
    const seconds = Number(valueOf(game).timeLimitSeconds)
    return !Number.isInteger(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS
  })

  function edit(game, change) {
    setSaveError(null)
    setDrafts((previous) => ({ ...previous, [game.id]: { ...valueOf(game), ...change } }))
  }

  async function saveAll() {
    if (invalid.length > 0) return
    setSaveError(null)
    try {
      for (const game of changed) {
        const draft = valueOf(game)
        await update.mutateAsync({ id: game.id, enabled: draft.enabled, timeLimitSeconds: Number(draft.timeLimitSeconds) })
      }
      setDrafts({})
      toast('Đã lưu cài đặt', 'Người học thấy thay đổi ở ván chơi tiếp theo.')
    } catch (error) {
      setSaveError(describeApiError(error, 'Chưa lưu được cài đặt. Vui lòng thử lại.'))
    }
  }

  function syncBank() {
    sync.mutate(undefined, {
      onSuccess: ({ addedWords }) =>
        toast('Đã đồng bộ câu hỏi', addedWords > 0 ? `Đã tạo câu hỏi cho ${addedWords} từ mới.` : 'Mọi từ hệ thống đã có câu hỏi.'),
    })
  }

  return (
    <AdminPage title="Trò chơi từ vựng" section="Nội dung học" summary="Câu hỏi được tạo tự động từ kho từ vựng hệ thống, không cần soạn tay.">
      <section aria-labelledby="bank-title" className="flex flex-wrap items-center gap-5 rounded-xl border border-line bg-white px-5.5 py-5">
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="bank-title" className="text-base font-bold text-ink">
              Ngân hàng câu hỏi
            </h2>
            {missing > 0 ? (
              <Tag variant="warning">
                Thiếu {missing}/{formatNumber(bank.systemWordCount)} từ
              </Tag>
            ) : (
              <Tag variant="success">
                Đủ {formatNumber(bank.coveredWordCount)}/{formatNumber(bank.systemWordCount)} từ
              </Tag>
            )}
          </div>
          <p className="text-label leading-4.5 text-ink-soft">
            {missing > 0
              ? `${missing} từ thêm sau lần đồng bộ gần nhất${bank.lastSyncedAt ? ` (${formatFullDate(bank.lastSyncedAt)})` : ''} chưa xuất hiện trong trò chơi.`
              : `Từ thêm sau lần đồng bộ gần nhất${bank.lastSyncedAt ? ` (${formatFullDate(bank.lastSyncedAt)})` : ''} chưa xuất hiện trong trò chơi. Bấm đồng bộ sau khi thêm từ mới.`}
          </p>
          {sync.isError && <Alert variant="error">{describeApiError(sync.error, 'Chưa đồng bộ được. Vui lòng thử lại.')}</Alert>}
        </div>
        <Button variant={missing > 0 ? 'strong' : 'outline'} size="xs" loading={sync.isPending} onClick={syncBank}>
          Đồng bộ câu hỏi
        </Button>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {games.data.games.map((game) => {
          const draft = valueOf(game)
          const seconds = Number(draft.timeLimitSeconds)
          const secondsError =
            !Number.isInteger(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS ? `Từ ${MIN_SECONDS} đến ${MAX_SECONDS} giây.` : undefined
          return (
            <section key={game.id} aria-labelledby={`game-${game.id}`} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 id={`game-${game.id}`} className="text-[17px] leading-5.5 font-bold text-ink">
                    {game.name}
                  </h2>
                  <span className="text-label text-muted-strong">{DESCRIPTIONS[game.gameType]}</span>
                </div>
                <div className="flex flex-none items-center gap-2 text-label font-semibold whitespace-nowrap">
                  <span className={draft.enabled ? 'text-success' : 'text-muted-strong'}>{draft.enabled ? 'Đang bật' : 'Đang tắt'}</span>
                  <Switch checked={draft.enabled} onChange={(enabled) => edit(game, { enabled })} label={`Bật trò chơi ${game.name}`} hideLabel />
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2.5">
                {[
                  ['Mỗi ván', `${game.questionsPerRound} câu`],
                  ['Ngân hàng', `${formatNumber(game.bankSize)} câu`],
                  ['Lượt chơi 30 ngày', formatNumber(game.sessionsLast30Days)],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col justify-between rounded-[10px] bg-surface-alt px-3 py-2.5">
                    <dt className="text-xs text-muted-strong">{label}</dt>
                    <dd className="mt-1 text-base font-bold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <InputField
                label="Thời gian mỗi ván (giây)"
                type="number"
                min={MIN_SECONDS}
                max={MAX_SECONDS}
                step={10}
                inputMode="numeric"
                value={draft.timeLimitSeconds}
                onChange={(event) => edit(game, { timeLimitSeconds: event.target.value })}
                error={secondsError}
                className="[&_input]:w-30"
              />
              {!draft.enabled && <p className="text-xs text-muted-strong">Trò chơi đang tắt sẽ không hiện với người học; điểm và bảng xếp hạng cũ được giữ.</p>}
            </section>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saveError && <Alert variant="error">{saveError}</Alert>}
        {changed.length > 0 && <span className="text-label text-muted-strong">Có thay đổi chưa lưu</span>}
        <Button variant="outline" size="xs" disabled={changed.length === 0 || update.isPending} onClick={() => setDrafts({})}>
          Hoàn tác
        </Button>
        <Button variant="strong" size="xs" disabled={changed.length === 0 || invalid.length > 0} loading={update.isPending} onClick={saveAll}>
          Lưu cài đặt
        </Button>
      </div>
    </AdminPage>
  )
}
