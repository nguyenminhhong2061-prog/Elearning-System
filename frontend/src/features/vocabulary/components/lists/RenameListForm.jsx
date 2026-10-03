import { useId, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useRenameList } from '../../api/listsQueries'

/**
 * Replaces the list's title while renaming it. A name the learner already uses for another list is refused (409).
 * @param {{ list: import('../../types').CustomList, onDone: () => void }} props
 */
export function RenameListForm({ list, onDone }) {
  const rename = useRenameList(list.id)
  const [name, setName] = useState(list.name)
  const inputId = useId()

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      await rename.mutateAsync(name.trim())
      onDone()
    } catch {
      // Shown below.
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label font-medium text-ink-soft">
        Tên danh sách
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          value={name}
          maxLength={150}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
        <Button type="submit" size="sm" disabled={!name.trim()} loading={rename.isPending}>
          Lưu
        </Button>
        <Button variant="outline" size="sm" onClick={onDone}>
          Hủy
        </Button>
      </div>
      {rename.isError && (
        <Alert variant="error">
          {rename.error?.status === 409
            ? 'Bạn đã có danh sách tên này.'
            : describeApiError(rename.error, 'Chưa đổi được tên. Vui lòng thử lại.')}
        </Alert>
      )}
    </form>
  )
}
