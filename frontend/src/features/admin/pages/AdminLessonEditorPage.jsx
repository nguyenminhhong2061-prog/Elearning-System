import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { useToast } from '@/components/ui/toastContext'
import { paths } from '@/config/paths'
import { formatCount } from '@/lib/format'
import { useAdminLesson, useSaveLesson } from '../api/lessonsQueries'
import { AdminPage } from '../components/AdminPage'
import { DeleteLessonDialog } from '../components/lessons/DeleteLessonDialog'
import { LessonInfo } from '../components/lessons/LessonInfo'
import { LessonQuestions } from '../components/lessons/LessonQuestions'
import { ListeningPassage } from '../components/lessons/ListeningPassage'
import { PronunciationItems } from '../components/lessons/PronunciationItems'
import { ReadingPassages } from '../components/lessons/ReadingPassages'
import { LESSON_SKILLS, SKILL_LABELS } from '../constants'
import { sameContent, toDraft } from '../utils/draft'
import { formatFullDate } from '../utils/format'
import { editableLesson, lessonPayload, newLesson, validateLesson } from '../utils/lessonDraft'

const STATUS_TAGS = {
  PUBLISHED: ['success', 'Đã xuất bản'],
  DRAFT: ['neutral', 'Nháp'],
  HIDDEN: ['warning', 'Lưu trữ'],
}

/** Scenario 23, steps 3–13 and branches 2a, 3a–3c: create or edit a lesson of any skill. */
export function AdminLessonEditorPage() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = lessonId === undefined
  const id = isNew ? null : Number(lessonId)
  const lesson = useAdminLesson(id)
  const skill = LESSON_SKILLS.includes(searchParams.get('skill')) ? searchParams.get('skill') : 'READING'

  if (!isNew && lesson.isPending) {
    return (
      <div aria-hidden="true" className="mx-auto flex w-full max-w-400 animate-fade-in-late flex-col gap-5">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Skeleton className="h-120 rounded-xl" />
          <Skeleton className="h-120 rounded-xl" />
        </div>
      </div>
    )
  }
  if (!isNew && lesson.isError) {
    const missing = lesson.error?.status === 404
    return (
      <AdminPage title={missing ? 'Không tìm thấy bài tập' : 'Bài tập'} breadcrumb={[{ label: 'Bài tập', to: paths.adminLessons }]}>
        {missing ? (
          <Alert variant="error">Bài tập này không tồn tại hoặc đã bị xóa.</Alert>
        ) : (
          <LoadError error={lesson.error} onRetry={lesson.refetch} message="Không tải được bài tập. Vui lòng thử lại." />
        )}
      </AdminPage>
    )
  }

  // The editor keeps its own draft: refetches while editing must not overwrite what the admin typed.
  return <LessonEditor key={isNew ? `new-${skill}` : id} source={isNew ? newLesson(skill) : editableLesson(lesson.data)} isNew={isNew} />
}

const openFirst = (draft) => new Set(draft.questions.slice(0, 1).map((question) => question.key))

function LessonEditor({ source, isNew }) {
  const navigate = useNavigate()
  const toast = useToast()
  const save = useSaveLesson()
  const [original, setOriginal] = useState(() => toDraft(source))
  const [draft, setDraft] = useState(original)
  const [openKeys, setOpenKeys] = useState(() => openFirst(original))
  const [showErrors, setShowErrors] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const dirty = isNew || !sameContent(draft, original)
  const validation = validateLesson(draft)
  const errors = showErrors
    ? { ...validation.fields, passages: validation.passages, questions: validation.questions, segments: validation.segments, itemErrors: validation.items }
    : { passages: {}, questions: {}, segments: {}, itemErrors: {} }

  // Leaving the page (reload, closing the tab) with unsaved changes asks the browser's confirmation.
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

  // A new lesson may still change skill: its content starts over, the information fields stay.
  function changeSkill(skill) {
    const { title, description, topic, cefrLevel, difficulty, estimatedMinutes, status } = draft
    const fresh = toDraft(newLesson(skill))
    setDraft({ ...fresh, title, description, topic, cefrLevel, difficulty, estimatedMinutes, status })
    setOpenKeys(openFirst(fresh))
  }

  function submit() {
    setShowErrors(true)
    if (validation.count > 0) {
      // Open every question with a problem so its red fields are visible.
      setOpenKeys((previous) => new Set([...previous, ...Object.keys(validation.questions)]))
      return
    }
    save.mutate(
      { id: isNew ? undefined : draft.id, ...lessonPayload(draft) },
      {
        onSuccess: (saved) => {
          toast('Đã lưu', isNew ? `Đã tạo bài “${saved.title}”.` : `Bài “${saved.title}” đã được cập nhật.`)
          if (isNew) {
            navigate(paths.adminLesson(saved.id), { replace: true })
            return
          }
          const next = toDraft(editableLesson(saved))
          setOriginal(next)
          setDraft(next)
          setShowErrors(false)
        },
      },
    )
  }

  const [statusVariant, statusLabel] = STATUS_TAGS[original.status]
  const audioMissing = draft.skill === 'LISTENING' && !isNew && !draft.passage.audioUrl
  const serverProblem =
    save.isError &&
    (save.error?.status === 400
      ? 'Máy chủ chưa nhận bài: nội dung còn chỗ chưa hợp lệ (ví dụ bài xuất bản thiếu câu hỏi hoặc file âm thanh).'
      : describeApiError(save.error, 'Chưa lưu được bài tập. Vui lòng thử lại.'))

  return (
    <AdminPage
      title={isNew ? 'Bài tập mới' : original.title}
      breadcrumb={[{ label: 'Bài tập', to: paths.adminLessons }]}
      crumb={SKILL_LABELS[draft.skill]}
      titleAddon={!isNew && <Tag variant={statusVariant}>{statusLabel}</Tag>}
      summary={
        isNew
          ? 'Chọn “Đã xuất bản” để người học thấy bài ngay sau khi tạo, hoặc lưu Nháp để soạn tiếp.'
          : `${formatCount(original.attempts)} lượt làm${original.updatedAt ? ` · sửa lần cuối ${formatFullDate(original.updatedAt)}` : ''}`
      }
      actions={
        <>
          {dirty && !isNew && <span className="text-label text-muted-strong">Có thay đổi chưa lưu</span>}
          {isNew && (
            <ButtonLink to={paths.adminLessons} variant="outline" size="xs">
              Hủy
            </ButtonLink>
          )}
          <Button variant="strong" size="xs" loading={save.isPending} disabled={!dirty} onClick={submit}>
            {isNew ? 'Tạo bài' : 'Lưu thay đổi'}
          </Button>
        </>
      }
    >
      {original.status === 'PUBLISHED' && original.attempts > 0 && (
        <p role="note" className="rounded-[10px] bg-brand-tint px-4 py-3 text-label leading-4.5 text-brand-ink">
          Bài đang xuất bản: thay đổi áp dụng cho các lượt làm mới; lượt đã nộp giữ nguyên điểm.
        </p>
      )}
      {audioMissing && <Alert variant="error">Chưa có file âm thanh. Người học không nghe được bài này. Tải file lên ở khung “Bài nghe”.</Alert>}
      {showErrors && validation.count > 0 && (
        <Alert variant="error">Chưa lưu được: còn {validation.count} chỗ cần sửa (tô đỏ bên dưới). Các nội dung khác vẫn được giữ.</Alert>
      )}
      {serverProblem && <Alert variant="error">{serverProblem}</Alert>}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <LessonInfo draft={draft} errors={errors} isNew={isNew} onChange={setDraft} onChangeSkill={changeSkill} onDelete={() => setDeleting(true)} />
        <div className="flex min-w-0 flex-col gap-4">
          {draft.skill === 'READING' && <ReadingPassages draft={draft} errors={errors.passages} onChange={setDraft} />}
          {draft.skill === 'LISTENING' && <ListeningPassage draft={draft} errors={errors} onChange={setDraft} />}
          {draft.skill === 'PRONUNCIATION' ? (
            <PronunciationItems draft={draft} errors={errors} onChange={setDraft} />
          ) : (
            <LessonQuestions draft={draft} errors={errors} openKeys={openKeys} onToggle={toggle} onChange={setDraft} />
          )}
        </div>
      </div>

      {!isNew && <DeleteLessonDialog lesson={deleting ? original : null} onClose={() => setDeleting(false)} onDeleted={() => navigate(paths.adminLessons)} />}
    </AdminPage>
  )
}
