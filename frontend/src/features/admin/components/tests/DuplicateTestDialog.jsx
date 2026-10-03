import { useState } from 'react'
import { useNavigate } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/toastContext'
import { paths } from '@/config/paths'
import { addDays, formatDayMonth } from '@/lib/dates'
import { useDuplicateTest } from '../../api/testsQueries'
import { InputField } from '../fields'
import { parseTypedDate } from '../../utils/format'
import { periodicTitle } from '../../utils/testDraft'

const typed = (date) => (date ? `${formatDayMonth(date)}/${date.slice(0, 4)}` : '')

/**
 * Scenario 24, branch 2c: copies a test into a new draft (same questions) with its own name and dates, then opens it.
 * A weekly test is proposed for the week after `week` (or after the copied test).
 *
 * @param {{ source: import('../../types').AdminTestSummary | null, week?: { weekStart: string, weekEnd: string } | null, onClose: () => void }} props
 */
export function DuplicateTestDialog({ source, week, onClose }) {
  return (
    <Dialog open={source !== null} onClose={onClose} title={source ? `Nhân bản “${source.title}”` : ''}>
      {source && <DuplicateForm key={source.id} source={source} week={week} onClose={onClose} />}
    </Dialog>
  )
}

function DuplicateForm({ source, week, onClose }) {
  const navigate = useNavigate()
  const toast = useToast()
  const duplicate = useDuplicateTest()
  const periodic = source.type === 'PERIODIC'
  const start = week?.weekStart ?? (source.endDate ? addDays(source.endDate, 1) : null)
  const end = week?.weekEnd ?? (source.endDate ? addDays(source.endDate, 7) : null)
  const [title, setTitle] = useState(periodic && end ? periodicTitle(end) : `${source.title} (bản sao)`)
  const [startText, setStartText] = useState(typed(start))
  const [endText, setEndText] = useState(typed(end))
  const [errors, setErrors] = useState({})

  function submit(event) {
    event.preventDefault()
    const startDate = periodic ? parseTypedDate(startText) : null
    const endDate = periodic ? parseTypedDate(endText) : null
    const found = {}
    if (!title.trim()) found.title = 'Vui lòng nhập tên đề.'
    if (periodic && !startDate) found.start = 'Nhập ngày mở dạng ngày/tháng/năm.'
    if (periodic && !endDate) found.end = 'Nhập ngày đóng dạng ngày/tháng/năm.'
    else if (periodic && startDate && endDate <= startDate) found.end = 'Ngày đóng phải sau ngày mở.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    duplicate.mutate(
      { id: source.id, title: title.trim(), startDate, endDate },
      {
        onSuccess: (copy) => {
          toast('Đã tạo bản nháp', `“${copy.title}” giữ nguyên ${copy.questions.length} câu của đề gốc.`)
          onClose()
          navigate(paths.adminTest(copy.id))
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm leading-5.5 text-ink-soft">Đề mới là bản nháp, giữ nguyên câu hỏi của đề gốc; người học chưa thấy cho tới khi bạn chọn “Mở theo lịch”.</p>
      <InputField label="Tên đề mới *" value={title} onChange={(event) => setTitle(event.target.value)} error={errors.title} />
      {periodic && (
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Ngày mở *" inputMode="numeric" placeholder="dd/mm/yyyy" value={startText} onChange={(event) => setStartText(event.target.value)} error={errors.start} />
          <InputField label="Ngày đóng *" inputMode="numeric" placeholder="dd/mm/yyyy" value={endText} onChange={(event) => setEndText(event.target.value)} error={errors.end} />
        </div>
      )}
      {duplicate.isError && <Alert variant="error">{describeApiError(duplicate.error, 'Chưa nhân bản được đề. Vui lòng thử lại.')}</Alert>}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" variant="strong" size="xs" loading={duplicate.isPending}>
          Tạo bản nháp
        </Button>
      </div>
    </form>
  )
}
