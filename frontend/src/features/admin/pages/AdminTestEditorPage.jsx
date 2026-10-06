import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/toastContext'
import { paths } from '@/config/paths'
import { formatCount } from '@/lib/format'
import { useAdminTest, useAdminTests, useSaveTest } from '../api/testsQueries'
import { AdminPage } from '../components/AdminPage'
import { DeleteTestDialog } from '../components/tests/DeleteTestDialog'
import { DuplicateTestDialog } from '../components/tests/DuplicateTestDialog'
import { TestInfo } from '../components/tests/TestInfo'
import { TestMaterials } from '../components/tests/TestMaterials'
import { TestQuestions } from '../components/tests/TestQuestions'
import { TestStatusTag } from '../components/tests/TestStatusTag'
import { sameContent, toDraft } from '../utils/draft'
import { editableTest, newTest, testPayload, validateTest, weekAfterLast } from '../utils/testDraft'

const SAVED = {
  DRAFT: (title) => `“${title}” là bản nháp, người học chưa thấy.`,
  VISIBLE: (title) => `“${title}” sẽ mở theo lịch.`,
  HIDDEN: (title) => `“${title}” đang ẩn với người học.`,
}

/** Scenario 24, steps 3–10 and branches 2a–2c, 5a: create or edit a test. */
export function AdminTestEditorPage() {
  const { testId } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = testId === undefined
  const test = useAdminTest(isNew ? null : Number(testId))
  const tests = useAdminTests()
  const type = searchParams.get('type') === 'COMPREHENSIVE' ? 'COMPREHENSIVE' : 'PERIODIC'

  const loading = isNew ? tests.isPending : test.isPending
  const error = isNew ? null : test.error
  if (loading) {
    return (
      <div aria-hidden="true" className="mx-auto flex w-full max-w-400 animate-fade-in-late flex-col gap-5">
        <Skeleton className="h-8 w-80" />
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }
  if (error) {
    const missing = error.status === 404
    return (
      <AdminPage title={missing ? 'Không tìm thấy đề' : 'Đề kiểm tra'} breadcrumb={[{ label: 'Đề kiểm tra', to: paths.adminTests }]}>
        {missing ? <Alert variant="error">Đề này không tồn tại hoặc đã bị xóa.</Alert> : <LoadError error={error} onRetry={test.refetch} message="Không tải được đề. Vui lòng thử lại." />}
      </AdminPage>
    )
  }

  const week = weekAfterLast(tests.data ?? [])
  const source = isNew ? newTest(type, week) : editableTest(test.data)
  return <TestEditor key={isNew ? `new-${type}` : testId} source={source} isNew={isNew} week={week} />
}

function TestEditor({ source, isNew, week }) {
  const navigate = useNavigate()
  const toast = useToast()
  const save = useSaveTest()
  const [original, setOriginal] = useState(() => toDraft(source))
  const [draft, setDraft] = useState(original)
  const [openKeys, setOpenKeys] = useState(() => new Set(original.questions.slice(0, 1).map((question) => question.key)))
  const [showErrors, setShowErrors] = useState(false)
  const [dialog, setDialog] = useState(null) // 'leave' | 'duplicate' | 'delete'

  const locked = original.submissions > 0
  const dirty = isNew || !sameContent(draft, original)
  const validation = validateTest(draft)
  const errors = showErrors ? validation : { fields: {}, materials: {}, questions: {} }

  useEffect(() => {
    if (!dirty || isNew) return undefined
    const warn = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, isNew])

  function toggle(key, forceOpen) {
    setOpenKeys((previous) => {
      const next = new Set(previous)
      if (forceOpen || !next.has(key)) next.add(key)
      else next.delete(key)
      return next
    })
  }

  // A new test may still change type: the name, dates and skills follow the new type unless the admin changed them.
  function changeType(type) {
    const before = newTest(draft.type, week)
    const after = newTest(type, week)
    const keep = (field) => (draft[field] === before[field] ? after[field] : draft[field])
    setDraft({ ...draft, type, title: keep('title'), startText: keep('startText'), endText: keep('endText'), skillText: keep('skillText') })
  }

  function submit() {
    setShowErrors(true)
    if (validation.count > 0) {
      setOpenKeys((previous) => new Set([...previous, ...Object.keys(validation.questions)]))
      return
    }
    save.mutate(
      { id: draft.id ?? undefined, ...testPayload(draft) },
      {
        onSuccess: (saved) => {
          toast('Đã lưu', SAVED[saved.status](saved.title))
          if (isNew) {
            navigate(paths.adminTest(saved.id), { replace: true })
            return
          }
          const next = toDraft(editableTest(saved))
          setOriginal(next)
          setDraft(next)
          setShowErrors(false)
        },
      },
    )
  }

  const serverProblem =
    save.isError &&
    (save.error?.status === 409
      ? 'Đề đã có bài nộp nên chỉ sửa được tên đề, ngày đóng và trạng thái hiện/ẩn. Muốn đổi câu hỏi, hãy nhân bản thành đề mới.'
      : save.error?.status === 400
        ? 'Máy chủ chưa nhận đề: nội dung còn chỗ chưa hợp lệ.'
        : describeApiError(save.error, 'Chưa lưu được đề. Vui lòng thử lại.'))

  return (
    <AdminPage
      title={isNew ? 'Đề kiểm tra mới' : original.title}
      breadcrumb={[{ label: 'Đề kiểm tra', to: paths.adminTests }]}
      crumb={draft.type === 'PERIODIC' ? 'Định kỳ' : 'Tổng hợp'}
      titleAddon={!isNew && <TestStatusTag test={original} short />}
      summary={
        original.duplicatedFrom
          ? `Nhân bản từ “${original.duplicatedFrom.title}”${original.status === 'DRAFT' ? ' · người học chưa thấy đề này' : ''}`
          : isNew
            ? 'Đề mới lưu ở dạng nháp cho tới khi bạn chọn “Mở theo lịch”.'
            : `${formatCount(original.submissions)} bài đã nộp${original.averageScore !== null ? ` · điểm TB ${original.averageScore}` : ''}`
      }
      actions={
        <>
          {dirty && !isNew && <span className="text-label text-muted-strong">Có thay đổi chưa lưu</span>}
          <Button variant="outline" size="xs" onClick={() => (dirty ? setDialog('leave') : navigate(paths.adminTests))}>
            Hủy
          </Button>
          <Button variant="strong" size="xs" loading={save.isPending} disabled={!dirty} onClick={submit}>
            Lưu đề
          </Button>
        </>
      }
    >
      {original.duplicatedFrom && original.status === 'DRAFT' && (
        <p role="note" className="rounded-[10px] bg-brand-tint px-4 py-3 text-label leading-4.5 text-brand-ink">
          Đề nhân bản giữ nguyên {original.questions.length} câu của đề gốc và đặt sẵn lịch. Hãy thay hoặc sửa câu hỏi trước khi mở cho người học.
        </p>
      )}
      {locked && (
        <div role="note" className="flex flex-wrap items-center gap-3 rounded-[10px] border border-warning-solid/40 bg-warning-bg px-4 py-3 text-warning">
          <p className="min-w-60 flex-1 text-label leading-5">
            <strong>Đề đã có {formatCount(original.submissions)} bài nộp:</strong> chỉ sửa được tên đề, ngày đóng và trạng thái hiện/ẩn. Câu hỏi giữ nguyên để điểm các bài đã
            nộp luôn thống nhất; muốn đổi thì nhân bản thành đề mới.
          </p>
          <Button variant="outline" size="xs" onClick={() => setDialog('duplicate')}>
            Nhân bản đề này
          </Button>
        </div>
      )}
      {showErrors && validation.count > 0 && <Alert variant="error">Chưa lưu được: còn {validation.count} chỗ cần sửa (tô đỏ bên dưới).</Alert>}
      {serverProblem && <Alert variant="error">{serverProblem}</Alert>}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <TestInfo
          draft={draft}
          errors={errors.fields}
          isNew={isNew}
          locked={locked}
          onChange={setDraft}
          onChangeType={changeType}
          onDelete={isNew ? undefined : () => setDialog('delete')}
        />
        <div className="flex min-w-0 flex-col gap-4">
          <TestMaterials draft={draft} errors={errors.materials} locked={locked} onChange={setDraft} />
          <TestQuestions draft={draft} errors={errors} openKeys={openKeys} locked={locked} onToggle={toggle} onChange={setDraft} />
        </div>
      </div>

      <Dialog open={dialog === 'leave'} onClose={() => setDialog(null)} title="Bỏ các thay đổi?">
        <p className="text-sm leading-5.5 text-ink-soft">Bạn đã sửa đề nhưng chưa lưu. Rời trang bây giờ sẽ mất các thay đổi này.</p>
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" size="xs" onClick={() => setDialog(null)}>
            Tiếp tục sửa
          </Button>
          <Button variant="danger" size="xs" onClick={() => navigate(paths.adminTests)}>
            Bỏ thay đổi
          </Button>
        </div>
      </Dialog>
      {!isNew && <DuplicateTestDialog source={dialog === 'duplicate' ? original : null} onClose={() => setDialog(null)} />}
      {!isNew && <DeleteTestDialog test={dialog === 'delete' ? original : null} onClose={() => setDialog(null)} onDeleted={() => navigate(paths.adminTests)} />}
    </AdminPage>
  )
}
