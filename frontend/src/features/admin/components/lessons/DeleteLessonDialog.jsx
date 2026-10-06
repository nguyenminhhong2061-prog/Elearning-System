import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/toastContext'
import { formatCount } from '@/lib/format'
import { useDeleteLesson } from '../../api/lessonsQueries'

/**
 * Scenario 23, branch 2b: a lesson learners have done is hidden ("Lưu trữ"), one nobody has done is deleted for good.
 * Opened from a row of the list or from the lesson's page.
 *
 * @param {object} props
 * @param {{ id: number, title: string, attempts: number } | null} props.lesson null keeps the dialog closed
 * @param {() => void} props.onClose
 * @param {() => void} [props.onDeleted] after the server answered (the lesson page goes back to the list)
 */
export function DeleteLessonDialog({ lesson, onClose, onDeleted }) {
  const remove = useDeleteLesson()
  const toast = useToast()
  const used = lesson ? lesson.attempts > 0 : false

  function close() {
    remove.reset()
    onClose()
  }

  function confirm() {
    remove.mutate(lesson.id, {
      onSuccess: ({ result }) => {
        toast(result === 'HIDDEN' ? 'Đã chuyển vào Lưu trữ' : 'Đã xóa', `Bài “${lesson.title}”.`)
        close()
        onDeleted?.()
      },
    })
  }

  return (
    <Dialog open={lesson !== null} onClose={close} title={lesson ? (used ? `Xóa bài “${lesson.title}”?` : `Xóa vĩnh viễn bài “${lesson.title}”?`) : ''}>
      <p className="text-sm leading-5.5 text-ink-soft">
        {used ? (
          <>
            Bài đã có <strong className="text-ink">{formatCount(lesson.attempts)} lượt làm</strong> nên sẽ được chuyển sang <strong className="text-ink">Lưu trữ</strong>: người học
            không thấy bài nữa, lịch sử và điểm các lượt đã làm được giữ nguyên.
          </>
        ) : (
          'Chưa có ai làm bài này. Bài sẽ bị xóa khỏi hệ thống và không khôi phục được.'
        )}
      </p>
      {remove.isError && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được bài. Vui lòng thử lại.')}</Alert>}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={close}>
          Hủy
        </Button>
        <Button variant="danger" size="xs" loading={remove.isPending} onClick={confirm}>
          {used ? 'Chuyển vào Lưu trữ' : 'Xóa vĩnh viễn'}
        </Button>
      </div>
    </Dialog>
  )
}
