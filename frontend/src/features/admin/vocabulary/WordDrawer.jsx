import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { CEFR_LEVELS } from '@/api/constants'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Drawer } from '@/components/ui/Drawer'
import { useToast } from '@/components/ui/toastContext'
import { getWords } from '../api/adminApi'
import { useSaveWord } from '../api/adminQueries'
import { InputField, LevelRadios, MediaPicker, SelectField, TextAreaField } from '../components/fields'
import { formatFullDate } from '../format'

const FORM_ID = 'admin-word-form'
const MAX_AUDIO_BYTES = 1024 * 1024
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const optionalUrl = z.string().trim().max(500, 'Đường dẫn tối đa 500 ký tự.')

// Mirrors CreateVocabularyRequest / UpdateVocabularyRequest of the backend.
const wordSchema = z.object({
  word: z.string().trim().min(1, 'Vui lòng nhập từ.').max(150, 'Từ tối đa 150 ký tự.'),
  phonetic: z.string().trim().max(150, 'Phiên âm tối đa 150 ký tự.'),
  meaning: z.string().trim().min(1, 'Vui lòng nhập nghĩa.'),
  difficultyLevel: z.enum(CEFR_LEVELS, { message: 'Vui lòng chọn trình độ.' }),
  topicId: z.string().min(1, 'Vui lòng chọn chủ đề.'),
  exampleSentence: z.string().trim(),
  audioUrl: optionalUrl,
  imageUrl: optionalUrl,
})

// Names of the fields in the "Bỏ các thay đổi?" question, in form order.
const FIELD_NAMES = {
  word: 'từ',
  phonetic: 'phiên âm',
  meaning: 'nghĩa',
  difficultyLevel: 'trình độ',
  topicId: 'chủ đề',
  exampleSentence: 'câu ví dụ',
  audioUrl: 'audio',
  imageUrl: 'ảnh minh họa',
}

function formValues(word, topicId) {
  return {
    word: word?.word ?? '',
    phonetic: word?.phonetic ?? '',
    meaning: word?.meaning ?? '',
    difficultyLevel: word?.difficultyLevel ?? '',
    topicId: String(word?.topicId ?? topicId ?? ''),
    exampleSentence: word?.exampleSentence ?? '',
    audioUrl: word?.audioUrl ?? '',
    imageUrl: word?.imageUrl ?? '',
  }
}

/** "nghĩa và câu ví dụ", "từ, nghĩa và audio". */
function listFields(keys) {
  const names = Object.keys(FIELD_NAMES).filter((key) => keys.includes(key)).map((key) => FIELD_NAMES[key])
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} và ${names.at(-1)}`
}

const capitalize = (text) => text.charAt(0).toLocaleUpperCase('vi') + text.slice(1)

/** Another live system word with the same spelling in the topic, if any (scenario 18, step 5). */
async function findDuplicate({ word, topicId, exceptId }) {
  const spelling = word.trim().toLocaleLowerCase('vi')
  const page = await getWords({ topicId, q: word.trim(), size: 50 })
  return page.items.find((item) => item.id !== exceptId && item.word.trim().toLocaleLowerCase('vi') === spelling) ?? null
}

/**
 * Side panel to edit a word (scenario 18) or add words (scenario 19).
 *
 * @param {object} props
 * @param {{ mode: 'edit', word: import('../types').AdminWord } | { mode: 'add', topicId: number | null } | null} props.target
 * @param {import('../types').AdminTopic[]} props.topics
 * @param {() => void} props.onClose
 * @param {(word: import('../types').AdminWord) => void} props.onOpenWord switches the panel to another word
 */
export function WordDrawer({ target, topics, onClose, onOpenWord }) {
  const editing = target?.mode === 'edit' ? target.word : null
  const save = useSaveWord()
  const toast = useToast()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  // Save problems belong to the word they were found for: opening another word starts without them.
  const [problem, setProblem] = useState({ target: null, duplicate: null, message: null })
  const { duplicate, message: submitProblem } = problem.target === target ? problem : { duplicate: null, message: null }
  const setDuplicate = (value) => setProblem({ target, duplicate: value, message: null })
  const setSubmitProblem = (value) => setProblem({ target, duplicate: null, message: value })

  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    getValues,
    formState: { errors, isDirty, dirtyFields, isSubmitting, submitCount },
  } = useForm({ resolver: zodResolver(wordSchema), defaultValues: formValues(null, null) })

  // A new target (another word, or the panel opening) starts from its saved values.
  useEffect(() => {
    if (!target) return
    reset(formValues(target.mode === 'edit' ? target.word : null, target.mode === 'add' ? target.topicId : null))
  }, [target, reset])

  const topicName = (id) => topics.find((topic) => String(topic.id) === String(id))?.name
  const missingRequired = Object.keys(errors).filter((key) => ['word', 'meaning', 'difficultyLevel', 'topicId'].includes(key)).length

  function requestClose() {
    if (isDirty) setConfirmDiscard(true)
    else onClose()
  }

  async function submit(values, keepAdding) {
    setDuplicate(null)
    const topicId = Number(values.topicId)
    const payload = {
      topicId,
      word: values.word,
      phonetic: values.phonetic || null,
      meaning: values.meaning,
      exampleSentence: values.exampleSentence || null,
      audioUrl: values.audioUrl || null,
      imageUrl: values.imageUrl || null,
      difficultyLevel: values.difficultyLevel,
    }

    try {
      // Checked before saving so the admin sees the existing word instead of a second copy; the server checks again.
      const existing = await findDuplicate({ word: values.word, topicId, exceptId: editing?.id })
      if (existing) {
        setDuplicate(existing)
        setFocus('word')
        return
      }
      const saved = await save.mutateAsync(editing ? { id: editing.id, ...payload } : payload)
      if (editing) {
        const changed = listFields(Object.keys(dirtyFields))
        toast('Đã lưu', changed ? `${capitalize(changed)} của “${saved.word}” đã được cập nhật.` : `Đã lưu “${saved.word}”.`)
      } else {
        toast('Đã lưu', `Đã thêm “${saved.word}” vào chủ đề ${topicName(topicId)}.`)
      }
      if (keepAdding) {
        reset({ ...formValues(null, topicId), difficultyLevel: values.difficultyLevel })
        setFocus('word')
      } else {
        onClose()
      }
    } catch (error) {
      if (error?.status === 409) {
        const existing = await findDuplicate({ word: values.word, topicId, exceptId: editing?.id }).catch(() => null)
        setDuplicate(existing ?? { word: values.word, topicId, id: null })
        setFocus('word')
      } else {
        setSubmitProblem(describeApiError(error, 'Chưa lưu được từ. Vui lòng thử lại.'))
      }
    }
  }

  const exampleSentence = useWatch({ control, name: 'exampleSentence' })
  const exampleMissing = editing && !exampleSentence?.trim()
  const busy = isSubmitting || save.isPending
  const title = editing
    ? `Sửa từ “${editing.word}”`
    : target?.topicId
      ? `Thêm từ vào chủ đề “${topicName(target.topicId) ?? ''}”`
      : 'Thêm từ'
  const subtitle = editing
    ? [`Chủ đề ${topicName(editing.topicId) ?? 'chưa chọn'}`, editing.updatedAt && `cập nhật lần cuối ${formatFullDate(editing.updatedAt)}`].filter(Boolean).join(' · ')
    : 'Từ mới là từ hệ thống: người học gặp từ này ở phiên học tiếp theo.'

  const duplicateMessage = duplicate && (
    <>
      Từ “{duplicate.word}” đã có trong chủ đề {topicName(duplicate.topicId) ?? 'này'}.{' '}
      {duplicate.id !== null && (
        <button type="button" onClick={() => onOpenWord(duplicate)} className="cursor-pointer font-bold text-brand-dark underline-offset-2 hover:underline">
          Mở từ đã có →
        </button>
      )}
    </>
  )

  const footer = editing ? (
    <>
      <Button variant="outline" size="xs" onClick={requestClose}>
        Hủy
      </Button>
      <Button type="submit" form={FORM_ID} variant="strong" size="xs" loading={busy}>
        Lưu thay đổi
      </Button>
    </>
  ) : (
    <>
      <span className="min-w-40 flex-1 text-xs text-muted-strong">“Lưu và thêm tiếp” giữ lại chủ đề và trình độ vừa chọn.</span>
      <Button variant="outline" size="xs" onClick={requestClose}>
        Hủy
      </Button>
      <Button variant="outlineBrand" size="xs" disabled={busy} onClick={handleSubmit((formData) => submit(formData, true))}>
        Lưu và thêm tiếp
      </Button>
      <Button type="submit" form={FORM_ID} variant="strong" size="xs" loading={busy}>
        Lưu
      </Button>
    </>
  )

  return (
    <>
      <Drawer open={target !== null} onClose={requestClose} title={title} subtitle={subtitle} footer={footer}>
        <form id={FORM_ID} noValidate onSubmit={handleSubmit((formData) => submit(formData, false))} className="flex flex-col gap-4">
          {editing && (
            <p role="note" className="rounded-[10px] bg-brand-tint px-3.5 py-3 text-label leading-4.5 text-brand-ink">
              {editing.learnerCount > 0 ? (
                <>
                  <strong>{editing.learnerCount} người học đang học từ này.</strong> Sửa nội dung không làm mất tiến độ của họ; thay đổi hiện ra ngay ở phiên học tiếp theo.
                </>
              ) : (
                'Chưa có người học nào học từ này.'
              )}
            </p>
          )}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <InputField label="Từ *" lang="en" autoComplete="off" error={duplicateMessage || errors.word?.message} {...register('word', { onChange: () => setDuplicate(null) })} />
            <InputField label="Phiên âm" lang="en" autoComplete="off" placeholder="/ˈlʌɡɪdʒ/" error={errors.phonetic?.message} {...register('phonetic')} />
          </div>
          <InputField label="Nghĩa *" autoComplete="off" error={errors.meaning?.message} {...register('meaning')} />
          <Controller
            control={control}
            name="difficultyLevel"
            render={({ field }) => (
              <LevelRadios legend="Trình độ *" name="word-level" value={field.value} onChange={field.onChange} error={errors.difficultyLevel?.message} />
            )}
          />
          <SelectField
            label="Chủ đề *"
            error={errors.topicId?.message}
            options={[{ value: '', label: 'Chọn chủ đề' }, ...topics.map((topic) => ({ value: String(topic.id), label: topic.name }))]}
            {...register('topicId', { onChange: () => setDuplicate(null) })}
          />
          <TextAreaField
            label="Câu ví dụ"
            lang="en"
            placeholder="Một câu tiếng Anh có dùng từ này"
            warning={exampleMissing ? 'Đang thiếu: mặt sau thẻ flashcard của từ này chưa có câu ví dụ.' : undefined}
            {...register('exampleSentence')}
          />
          <Controller
            control={control}
            name="audioUrl"
            render={({ field }) => (
              <MediaPicker
                kind="AUDIO"
                label="Audio phát âm"
                value={field.value}
                onChange={(url) => field.onChange(url)}
                maxBytes={MAX_AUDIO_BYTES}
                emptyTitle={editing ? 'Chưa có audio' : 'Không bắt buộc'}
                emptyNote={editing ? 'Người học đang nghe giọng đọc của trình duyệt.' : 'Không có audio thì người học nghe giọng đọc của trình duyệt.'}
                allowUrl
                urlError={errors.audioUrl?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <MediaPicker kind="IMAGE" label="Ảnh minh họa" value={field.value} onChange={(url) => field.onChange(url)} maxBytes={MAX_IMAGE_BYTES} emptyTitle="Không bắt buộc" emptyNote="" />
            )}
          />

          {submitCount > 0 && missingRequired > 0 && (
            <Alert variant="error">Chưa lưu được: còn {missingRequired} ô bắt buộc chưa điền. Các ô khác vẫn giữ nội dung đã nhập.</Alert>
          )}
          {submitProblem && <Alert variant="error">{submitProblem}</Alert>}
        </form>
      </Drawer>

      <Dialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="Bỏ các thay đổi?">
        <p className="text-sm leading-5.5 text-ink-soft">
          {editing
            ? `Bạn đã sửa ${listFields(Object.keys(dirtyFields)) || 'nội dung'} của “${editing.word}” nhưng chưa lưu. Đóng ngăn kéo bây giờ sẽ mất các thay đổi này.`
            : `Bạn đã nhập nội dung cho từ ${getValues('word') ? `“${getValues('word')}”` : 'mới'} nhưng chưa lưu. Đóng ngăn kéo bây giờ sẽ mất nội dung này.`}
        </p>
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" size="xs" onClick={() => setConfirmDiscard(false)}>
            Tiếp tục sửa
          </Button>
          <Button
            variant="danger"
            size="xs"
            onClick={() => {
              setConfirmDiscard(false)
              onClose()
            }}
          >
            Bỏ thay đổi
          </Button>
        </div>
      </Dialog>
    </>
  )
}
