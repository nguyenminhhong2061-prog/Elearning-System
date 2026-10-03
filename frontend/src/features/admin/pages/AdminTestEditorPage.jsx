import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { useToast } from '@/components/ui/toastContext'
import { cx } from '@/lib/cx'
import { useAdminTest, useAdminTests, useSaveTest } from '../api/adminQueries'
import { AdminPage } from '../components/AdminPage'
import { InputField, SelectField } from '../components/fields'
import { move, removeAt, replaceAt, sameContent, toDraft } from '../editor/draft'
import { formatNumber, TEST_SKILL_LABELS } from '../format'
import { DuplicateTestDialog } from '../tests/DuplicateTestDialog'
import { editableTest, newTest, newTestQuestion, SKILLS, TEMPLATES, testPayload, validateTest, weekAfterLast } from '../tests/testDraft'
import { TestQuestion } from '../tests/TestQuestion'

const STATUS_TAGS = { DRAFT: ['warning', 'Nháp'], UPCOMING: ['brand', 'Sắp mở'], OPEN: ['success', 'Đang mở'], CLOSED: ['neutral', 'Đã đóng'] }

/** Scenario 23, steps 2–3: edit a test (a duplicated draft, or the wording of one with submissions) or create one. */
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
      <AdminPage title={missing ? 'Không tìm thấy đề' : 'Đề kiểm tra'} breadcrumb={[{ label: 'Đề kiểm tra', to: '/admin/tests' }]}>
        {missing ? <Alert variant="error">Đề này không tồn tại hoặc đã bị xóa.</Alert> : <LoadError error={error} onRetry={test.refetch} message="Không tải được đề. Vui lòng thử lại." />}
      </AdminPage>
    )
  }

  const source = isNew ? newTest(type, type === 'PERIODIC' ? weekAfterLast(tests.data ?? []) : null) : editableTest(test.data)
  return <TestEditor key={isNew ? `new-${type}` : testId} source={source} isNew={isNew} />
}

function TestEditor({ source, isNew }) {
  const navigate = useNavigate()
  const toast = useToast()
  const save = useSaveTest()
  const [original, setOriginal] = useState(() => toDraft(source))
  const [draft, setDraft] = useState(original)
  const [openKeys, setOpenKeys] = useState(() => new Set(original.questions.slice(0, 1).map((question) => question.key)))
  const [showErrors, setShowErrors] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const locked = original.submissions > 0
  const dirty = isNew || !sameContent(draft, original)
  const validation = validateTest(draft)
  const fieldErrors = showErrors ? validation.fields : {}
  const questionErrors = showErrors ? validation.questions : {}
  const setQuestions = (questions) => setDraft({ ...draft, questions })

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

  function addQuestion(template) {
    const question = newTestQuestion(template)
    setQuestions([...draft.questions, question])
    toggle(question.key, true)
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
          toast('Đã lưu', saved.status === 'DRAFT' ? `“${saved.title}” là bản nháp, người học chưa thấy.` : `“${saved.title}” sẽ mở theo lịch.`)
          if (isNew) {
            navigate(`/admin/tests/${saved.id}`, { replace: true })
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

  const totalPoints = draft.questions.reduce((sum, question) => sum + (Number.isFinite(question.points) ? question.points : 0), 0)
  const skills = SKILLS.filter((skill) => draft.questions.some((question) => question.skill === skill)).map((skill) => TEST_SKILL_LABELS[skill])
  const [statusVariant, statusLabel] = STATUS_TAGS[isNew ? 'DRAFT' : original.status]
  const serverProblem =
    save.isError &&
    (save.error?.status === 409
      ? 'Đề đã có bài nộp nên chỉ sửa được lời văn và ngày đóng. Muốn đổi đáp án, điểm hoặc câu hỏi, hãy nhân bản thành đề mới.'
      : save.error?.status === 400
        ? 'Máy chủ chưa nhận đề: nội dung còn chỗ chưa hợp lệ.'
        : describeApiError(save.error, 'Chưa lưu được đề. Vui lòng thử lại.'))

  return (
    <AdminPage
      title={isNew ? 'Đề kiểm tra mới' : original.title}
      breadcrumb={[{ label: 'Đề kiểm tra', to: '/admin/tests' }]}
      crumb={draft.type === 'PERIODIC' ? 'Định kỳ' : 'Tổng hợp'}
      titleAddon={<Tag variant={statusVariant}>{statusLabel}</Tag>}
      summary={
        original.duplicatedFrom
          ? `Nhân bản từ “${original.duplicatedFrom.title}”${original.draft ? ' · người học chưa thấy đề này' : ''}`
          : isNew
            ? 'Đề mới lưu ở dạng nháp cho tới khi bạn chọn “Mở theo lịch”.'
            : `${formatNumber(original.submissions)} bài đã nộp${original.averageScore !== null ? ` · điểm TB ${original.averageScore}` : ''}`
      }
      actions={
        <>
          {dirty && !isNew && <span className="text-label text-muted-strong">Có thay đổi chưa lưu</span>}
          <Button variant="outline" size="xs" onClick={() => (dirty ? setLeaving(true) : navigate('/admin/tests'))}>
            Hủy
          </Button>
          <Button variant="strong" size="xs" loading={save.isPending} disabled={!dirty} onClick={submit}>
            Lưu đề
          </Button>
        </>
      }
    >
      {original.duplicatedFrom && original.draft && (
        <p role="note" className="rounded-[10px] bg-brand-tint px-4 py-3 text-label leading-4.5 text-brand-ink">
          Đề nhân bản giữ nguyên {original.questions.length} câu của đề gốc và đặt sẵn lịch. Hãy thay hoặc sửa câu hỏi trước khi mở cho người học.
        </p>
      )}
      {locked && (
        <div role="note" className="flex flex-wrap items-center gap-3 rounded-[10px] border border-warning-solid/40 bg-warning-bg px-4 py-3 text-warning">
          <p className="min-w-60 flex-1 text-label leading-5">
            <strong>Đề đã có {formatNumber(original.submissions)} bài nộp:</strong> chỉ sửa được tên đề, ngày đóng và lời văn câu hỏi. Muốn đổi đáp án hoặc điểm thì nhân bản thành đề mới.
          </p>
          <Button variant="outline" size="xs" onClick={() => setDuplicating(true)}>
            Nhân bản đề này
          </Button>
        </div>
      )}
      {showErrors && validation.count > 0 && <Alert variant="error">Chưa lưu được: còn {validation.count} chỗ cần sửa (tô đỏ bên dưới).</Alert>}
      {serverProblem && <Alert variant="error">{serverProblem}</Alert>}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <section aria-labelledby="test-info" className="flex flex-col gap-4 self-start rounded-xl border border-line bg-white px-5.5 py-5">
          <h2 id="test-info" className="text-base font-bold text-ink">
            Thông tin đề
          </h2>
          <InputField label="Tên đề *" value={draft.title} error={fieldErrors.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <SelectField
            label="Loại đề"
            value={draft.type}
            disabled={!isNew}
            onChange={(event) => setDraft({ ...draft, type: event.target.value })}
            options={[
              { value: 'PERIODIC', label: 'Định kỳ' },
              { value: 'COMPREHENSIVE', label: 'Tổng hợp 4 kỹ năng' },
            ]}
          />
          {draft.type === 'PERIODIC' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Ngày mở *"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  disabled={locked}
                  value={draft.startText}
                  error={fieldErrors.startDate}
                  onChange={(event) => setDraft({ ...draft, startText: event.target.value })}
                />
                <InputField
                  label="Ngày đóng *"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  value={draft.endText}
                  error={fieldErrors.endDate}
                  onChange={(event) => setDraft({ ...draft, endText: event.target.value })}
                />
              </div>
              {!fieldErrors.endDate && <p className="-mt-2 text-xs text-muted-strong">Ngày đóng phải sau ngày mở. Đề mở từ đầu ngày mở đến hết ngày đóng.</p>}
            </>
          ) : (
            <p className="text-label text-muted-strong">Đề tổng hợp luôn mở, cần đủ 4 kỹ năng; kết quả đổi trình độ người học.</p>
          )}
          <fieldset disabled={locked} className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 text-label font-medium text-ink-soft">Trạng thái</legend>
            {[
              [true, 'Nháp', 'Người học chưa thấy đề.'],
              [false, draft.type === 'PERIODIC' ? 'Mở theo lịch' : 'Mở cho người học', draft.type === 'PERIODIC' ? 'Hiện với người học từ ngày mở đến hết ngày đóng.' : 'Hiện với người học ngay sau khi lưu.'],
            ].map(([value, label, note]) => (
              <label
                key={label}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-3 has-disabled:cursor-not-allowed has-focus-visible:outline-2 has-focus-visible:outline-brand',
                  draft.draft === value ? 'border-brand-dark bg-brand-tint' : 'border-line hover:bg-surface-alt',
                )}
              >
                <input type="radio" name="test-status" checked={draft.draft === value} onChange={() => setDraft({ ...draft, draft: value })} className="mt-0.5 size-4 accent-brand-dark" />
                <span className="flex flex-col gap-0.5 text-label">
                  <strong className="text-ink">{label}</strong>
                  <span className="text-muted-strong">{note}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="text-xs leading-4 text-muted-strong">Đề đã có bài nộp chỉ sửa được lời văn; muốn đổi đáp án hoặc điểm thì nhân bản thành đề mới.</p>
        </section>

        <section aria-labelledby="test-questions" className="flex min-w-0 flex-col gap-3">
          <h2 id="test-questions" className="text-base font-bold text-ink">
            Câu hỏi ({draft.questions.length}){skills.length > 0 && ` · ${skills.join(', ')}`} · {totalPoints} điểm
          </h2>
          {(fieldErrors.questions || fieldErrors.skills) && <p className="text-label font-semibold text-danger">{fieldErrors.questions ?? fieldErrors.skills}</p>}
          {draft.questions.map((question, index) => (
            <TestQuestion
              key={question.key}
              question={question}
              index={index}
              count={draft.questions.length}
              errors={questionErrors[question.key]}
              open={openKeys.has(question.key)}
              locked={locked}
              onToggle={() => toggle(question.key)}
              onMove={(direction) => setQuestions(move(draft.questions, index, direction))}
              onRemove={() => setQuestions(removeAt(draft.questions, index))}
              onChange={(next) => setQuestions(replaceAt(draft.questions, index, next))}
            />
          ))}
          {!locked && (
            <div className="flex flex-col gap-3 rounded-xl border-[1.5px] border-dashed border-brand-tint-line bg-white px-5 py-4">
              <span className="text-label font-bold text-brand-dark">+ Thêm câu hỏi</span>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => addQuestion(template)}
                    className="cursor-pointer rounded-full border border-line bg-surface-alt px-3.5 py-2 text-label font-semibold text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={leaving} onClose={() => setLeaving(false)} title="Bỏ các thay đổi?">
        <p className="text-sm leading-5.5 text-ink-soft">Bạn đã sửa đề nhưng chưa lưu. Rời trang bây giờ sẽ mất các thay đổi này.</p>
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" size="xs" onClick={() => setLeaving(false)}>
            Tiếp tục sửa
          </Button>
          <Button variant="danger" size="xs" onClick={() => navigate('/admin/tests')}>
            Bỏ thay đổi
          </Button>
        </div>
      </Dialog>
      {!isNew && <DuplicateTestDialog source={duplicating ? original : null} onClose={() => setDuplicating(false)} />}
    </AdminPage>
  )
}
