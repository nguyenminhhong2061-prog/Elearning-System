import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/toastContext'
import { paths } from '@/config/paths'
import { useDeleteTopic, useDeleteWord, useSaveTopic } from '../../api/vocabularyQueries'
import { InputField, MediaPicker, TextAreaField } from '../fields'

function WarningBox({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] bg-warning-bg px-4 py-3 text-warning">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="mt-px flex-none">
        <path d="M9 2.5l7 12.5H2z" />
        <path d="M9 7.5v3.5M9 13.2v.1" />
      </svg>
      <p className="text-label leading-5">{children}</p>
    </div>
  )
}

/** "đã được 3 người học học và nằm trong 2 danh sách riêng": what keeps a word from being deleted for good. */
function usageOf(word) {
  const parts = []
  if (word.learnerCount > 0) parts.push(`đã được ${word.learnerCount} người học học`)
  if (word.listCount > 0) parts.push(`nằm trong ${word.listCount} danh sách riêng`)
  return parts.join(' và ')
}

/**
 * Scenario 21: a word someone studies (or keeps in a list) is hidden ("Lưu trữ" on screen), an unused one is deleted
 * for good. The server makes the final call; the wording follows the counts the table already shows.
 *
 * @param {{ word: import('../../types').AdminWord | null, onClose: () => void }} props
 */
export function DeleteWordDialog({ word, onClose }) {
  const remove = useDeleteWord()
  const toast = useToast()
  const used = word ? word.learnerCount > 0 || word.listCount > 0 : false

  function close() {
    remove.reset()
    onClose()
  }

  function confirm() {
    remove.mutate(word.id, {
      onSuccess: ({ result }) => {
        toast(result === 'HIDDEN' ? 'Đã chuyển vào Lưu trữ' : 'Đã xóa', result === 'HIDDEN' ? `Người học không gặp lại “${word.word}” trong phiên học mới.` : `Đã xóa vĩnh viễn “${word.word}”.`)
        close()
      },
    })
  }

  return (
    <Dialog open={word !== null} onClose={close} title={word ? (used ? `Xóa từ “${word.word}”?` : `Xóa vĩnh viễn từ “${word.word}”?`) : ''}>
      {word &&
        (used ? (
          <>
            <WarningBox>
              Từ “{word.word}” <strong>{usageOf(word)}</strong>.
            </WarningBox>
            <p className="text-sm leading-5.5 text-ink-soft">
              Từ sẽ bị ẩn đối với các lượt học mới; lịch sử học cũ được giữ nguyên. Từ được chuyển vào <strong className="text-ink">Lưu trữ</strong> nên vẫn khôi phục được.
            </p>
          </>
        ) : (
          <p className="text-sm leading-5.5 text-ink-soft">
            Chưa có người học nào học từ này và từ không nằm trong danh sách riêng nào. Từ sẽ bị xóa khỏi kho và <strong className="text-ink">không khôi phục được</strong>.
          </p>
        ))}
      {remove.isError && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được từ. Vui lòng thử lại.')}</Alert>}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={close}>
          Hủy
        </Button>
        <Button variant="danger" size="xs" loading={remove.isPending} onClick={confirm}>
          {used ? 'Xóa từ' : 'Xóa vĩnh viễn'}
        </Button>
      </div>
    </Dialog>
  )
}

const topicSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên chủ đề.').max(150, 'Tên chủ đề tối đa 150 ký tự.'),
  description: z.string().trim(),
  imageUrl: z.string().trim().max(500, 'Đường dẫn tối đa 500 ký tự.'),
})

/**
 * Scenario 22: add or edit a topic. The name must not repeat another topic's (checked here, and by the server: 409).
 *
 * @param {object} props
 * @param {{ mode: 'add' } | { mode: 'edit', topic: import('../../types').AdminTopic } | null} props.target
 * @param {import('../../types').AdminTopic[]} props.topics every topic, for the duplicate check
 * @param {() => void} props.onClose
 */
export function TopicDialog({ target, topics, onClose }) {
  const save = useSaveTopic()
  const toast = useToast()
  const editing = target?.mode === 'edit' ? target.topic : null
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(topicSchema), defaultValues: { name: '', description: '', imageUrl: '' } })

  useEffect(() => {
    if (target) reset({ name: editing?.name ?? '', description: editing?.description ?? '', imageUrl: editing?.imageUrl ?? '' })
  }, [target, editing, reset])

  function close() {
    save.reset()
    onClose()
  }

  function onSubmit(values) {
    const taken = topics.some((topic) => topic.id !== editing?.id && topic.name.trim().toLocaleLowerCase('vi') === values.name.toLocaleLowerCase('vi'))
    if (taken) {
      setError('name', { message: `Đã có chủ đề tên “${values.name}”.` }, { shouldFocus: true })
      return
    }
    const body = { name: values.name, description: values.description || null, imageUrl: values.imageUrl || null }
    save.mutate(editing ? { id: editing.id, ...body } : body, {
      onSuccess: (saved) => {
        toast('Đã lưu', editing ? `Đã cập nhật chủ đề “${saved.name}”.` : `Đã thêm chủ đề “${saved.name}”.`)
        close()
      },
      onError: (error) => {
        if (error?.status === 409) setError('name', { message: `Đã có chủ đề tên “${values.name}”.` }, { shouldFocus: true })
      },
    })
  }

  const name = useWatch({ control, name: 'name' })?.trim()
  return (
    <Dialog open={target !== null} onClose={close} title={editing ? `Sửa chủ đề “${editing.name}”` : 'Thêm chủ đề'}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField label="Tên chủ đề *" maxLength={150} hint="Tối đa 150 ký tự, không trùng tên chủ đề khác." error={errors.name?.message} {...register('name')} />
        <TextAreaField label="Mô tả" {...register('description')} />
        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => (
            <MediaPicker
              kind="IMAGE"
              label="Ảnh minh họa"
              value={field.value}
              onChange={field.onChange}
              maxBytes={2 * 1024 * 1024}
              emptyTitle="Không bắt buộc"
              emptyNote="Không có ảnh thì thẻ chủ đề hiện chữ cái đầu."
            />
          )}
        />
        {!editing && (
          <p role="note" className="rounded-[10px] bg-brand-tint px-3.5 py-3 text-label leading-4.5 text-brand-ink">
            Chủ đề mới chưa có từ nào: người học thấy thẻ “{name || 'chủ đề mới'}” với dòng “Chưa có từ” cho tới khi bạn thêm từ.
          </p>
        )}
        {save.isError && save.error?.status !== 409 && <Alert variant="error">{describeApiError(save.error, 'Chưa lưu được chủ đề. Vui lòng thử lại.')}</Alert>}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" size="xs" onClick={close}>
            Hủy
          </Button>
          <Button type="submit" variant="strong" size="xs" loading={save.isPending}>
            Lưu
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

/**
 * Scenario 22: a topic that still has words cannot be deleted (the admin moves or deletes them first); an empty one
 * asks for confirmation.
 *
 * @param {{ topic: import('../../types').AdminTopic | null, onClose: () => void }} props
 */
export function DeleteTopicDialog({ topic, onClose }) {
  const remove = useDeleteTopic()
  const toast = useToast()
  // The server also refuses (409) when hidden words remain; show the same explanation then.
  const blocked = topic ? topic.wordCount > 0 || remove.error?.status === 409 : false

  function close() {
    remove.reset()
    onClose()
  }

  function confirm() {
    remove.mutate(topic.id, {
      onSuccess: () => {
        toast('Đã xóa', `Đã xóa chủ đề “${topic.name}”.`)
        close()
      },
    })
  }

  return (
    <Dialog open={topic !== null} onClose={close} title={topic ? (blocked ? `Chưa xóa được chủ đề “${topic.name}”` : `Xóa chủ đề “${topic.name}”?`) : ''}>
      {topic &&
        (blocked ? (
          <WarningBox>
            {topic.wordCount > 0
              ? `Chủ đề còn ${topic.wordCount} từ, hãy chuyển các từ sang chủ đề khác hoặc xóa từ trước.`
              : 'Chủ đề còn từ đã lưu trữ, hãy chuyển các từ sang chủ đề khác trước.'}
          </WarningBox>
        ) : (
          <p className="text-sm leading-5.5 text-ink-soft">Chủ đề chưa có từ nào. Người học sẽ không còn thấy thẻ chủ đề này.</p>
        ))}
      {remove.isError && remove.error?.status !== 409 && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được chủ đề. Vui lòng thử lại.')}</Alert>}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={close}>
          {blocked ? 'Đóng' : 'Hủy'}
        </Button>
        {blocked ? (
          topic?.wordCount > 0 && (
            <ButtonLink to={paths.adminTopic(topic.id)} variant="strong" size="xs" onClick={close}>
              Xem {topic.wordCount} từ →
            </ButtonLink>
          )
        ) : (
          <Button variant="danger" size="xs" loading={remove.isPending} onClick={confirm}>
            Xóa chủ đề
          </Button>
        )}
      </div>
    </Dialog>
  )
}
