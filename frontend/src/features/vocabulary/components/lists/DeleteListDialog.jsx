import { useNavigate } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { paths } from '@/config/paths'
import { useDeleteList } from '../../api/listsQueries'

/**
 * "Xóa danh sách?": deletes the list, then goes back to the learner's lists. Learning progress and the learner's own
 * words are kept.
 * @param {{ list: import('../../types').CustomList, open: boolean, onClose: () => void }} props
 */
export function DeleteListDialog({ list, open, onClose }) {
  const navigate = useNavigate()
  // Leaving the page before the cache is cleaned keeps it from refetching the deleted list; the dialog goes with it.
  const remove = useDeleteList(list.id, { onDeleted: () => navigate(paths.vocabularyLists, { replace: true }) })

  return (
    <Dialog open={open} onClose={onClose} title="Xóa danh sách?">
      <p className="text-sm text-ink-soft">
        Danh sách “{list.name}” sẽ bị xóa. Tiến độ học các từ và những từ bạn tự nhập vẫn được giữ.
      </p>
      {remove.isError && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được danh sách.')}</Alert>}
      <div className="flex gap-2 pt-1.5">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="danger" size="sm" className="flex-1" loading={remove.isPending} onClick={() => remove.mutate()}>
          Xóa danh sách
        </Button>
      </div>
    </Dialog>
  )
}
