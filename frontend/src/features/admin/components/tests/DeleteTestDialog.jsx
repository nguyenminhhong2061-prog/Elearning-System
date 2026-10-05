import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/toastContext'
import { formatCount } from '@/lib/format'
import { useDeleteTest } from '../../api/testsQueries'

/**
 * Scenario 24, branch 2b, the same dialog as deleting a lesson: a test learners have submitted is only hidden (their
 * results stay), one nobody has done is deleted for good.
 *
 * @param {object} props
 * @param {{ id: number, title: string, submissions: number } | null} props.test null keeps the dialog closed
 * @param {() => void} props.onClose
 * @param {() => void} [props.onDeleted] after the server answered (the test page goes back to the list)
 */
export function DeleteTestDialog({ test, onClose, onDeleted }) {
  const remove = useDeleteTest()
  const toast = useToast()
  const used = test ? test.submissions > 0 : false

  function close() {
    remove.reset()
    onClose()
  }

  function confirm() {
    remove.mutate(test.id, {
      onSuccess: ({ result }) => {
        toast(result === 'HIDDEN' ? 'Đã ẩn đề' : 'Đã xóa', `Đề “${test.title}”.`)
        close()
        onDeleted?.()
      },
    })
  }

  return (
    <Dialog open={test !== null} onClose={close} title={test ? (used ? `Xóa đề “${test.title}”?` : `Xóa vĩnh viễn đề “${test.title}”?`) : ''}>
      <p className="text-sm leading-5.5 text-ink-soft">
        {used ? (
          <>
            Đề đã có <strong className="text-ink">{formatCount(test.submissions)} bài nộp</strong> nên chỉ bị <strong className="text-ink">ẩn</strong>: người học không thấy
            đề nữa, lịch sử kiểm tra và điểm của họ được giữ nguyên.
          </>
        ) : (
          'Chưa có ai nộp bài đề này. Đề sẽ bị xóa khỏi hệ thống và không khôi phục được.'
        )}
      </p>
      {remove.isError && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được đề. Vui lòng thử lại.')}</Alert>}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={close}>
          Hủy
        </Button>
        <Button variant="danger" size="xs" loading={remove.isPending} onClick={confirm}>
          {used ? 'Ẩn đề' : 'Xóa vĩnh viễn'}
        </Button>
      </div>
    </Dialog>
  )
}
