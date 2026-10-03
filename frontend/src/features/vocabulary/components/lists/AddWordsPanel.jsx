import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CEFR_LEVELS } from '@/api/constants'
import { describeApiError } from '@/api/errorMessages'
import { loadedItems } from '@/api/pagination'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SearchField } from '@/components/ui/SearchField'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/features/auth/context/useAuth'
import { cx } from '@/lib/cx'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useAddNewWordToList, useAddWordToList, useListWords } from '../../api/listsQueries'
import { useWordSearch } from '../../api/vocabularyQueries'
import { SEARCH_DELAY_MS, WORD_SEARCH_MIN_LENGTH } from '../../constants'
import { newWordSchema } from '../../schemas'

/** Search the shared vocabulary and add a word with one click. */
function FromVocabulary({ listId, wordIdsInList, onAdded }) {
  const [query, setQuery] = useState('')
  const term = useDebouncedValue(query.trim(), SEARCH_DELAY_MS)
  const search = useWordSearch(term)
  const add = useAddWordToList(listId)
  const [error, setError] = useState(null)

  async function addWord(word) {
    setError(null)
    try {
      await add.mutateAsync(word.id)
      onAdded(word.word)
    } catch (failure) {
      setError(
        failure?.status === 409
          ? `“${word.word}” đã có trong danh sách.`
          : describeApiError(failure, `Chưa thêm được “${word.word}”. Vui lòng thử lại.`),
      )
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <SearchField
        label="Tìm từ trong kho từ vựng"
        placeholder="Tìm từ trong kho (VD: invoice, hóa đơn)…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {error && <Alert variant="error">{error}</Alert>}
      {term.length >= WORD_SEARCH_MIN_LENGTH && search.data && (
        search.data.items.length === 0 ? (
          <p className="text-label text-muted-light">Không tìm thấy từ phù hợp. Bạn có thể tự nhập từ mới ở bên dưới.</p>
        ) : (
          <ul className="flex flex-col rounded-lg border border-line">
            {search.data.items.map((word) => {
              const inList = wordIdsInList.has(word.id)
              return (
                <li key={word.id} className="flex items-center justify-between gap-3 border-b border-canvas px-3 py-2 last:border-b-0">
                  <span className="text-label text-ink">
                    <span lang="en" className="font-semibold">
                      {word.word}
                    </span>{' '}
                    — {word.meaning}
                  </span>
                  <Button
                    size="sm"
                    variant={inList ? 'outline' : 'secondary'}
                    disabled={inList || add.isPending}
                    onClick={() => addWord(word)}
                    className="flex-none px-3 py-1.5"
                    aria-label={inList ? `“${word.word}” đã có trong danh sách` : `Thêm “${word.word}”`}
                  >
                    {inList ? 'Đã có' : '+ Thêm'}
                  </Button>
                </li>
              )
            })}
          </ul>
        )
      )}
    </div>
  )
}

/** "Tự nhập từ mới": the learner's own word, which only they will see. */
function NewWordForm({ listId, onAdded }) {
  const { user } = useAuth()
  const add = useAddNewWordToList(listId)
  const defaults = {
    word: '',
    meaning: '',
    difficultyLevel: user.currentLevel ?? 'A1',
    phonetic: '',
    exampleSentence: '',
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(newWordSchema), defaultValues: defaults })

  async function onSubmit(values) {
    try {
      const word = await add.mutateAsync(values)
      reset(defaults)
      onAdded(word.word)
    } catch {
      // Shown below.
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Từ tiếng Anh" lang="en" placeholder="VD: negotiate" error={errors.word?.message} {...register('word')} />
        <TextField label="Nghĩa" placeholder="VD: thương lượng" error={errors.meaning?.message} {...register('meaning')} />
        <TextField
          label="Phiên âm (không bắt buộc)"
          placeholder="VD: /nɪˈɡəʊʃieɪt/"
          error={errors.phonetic?.message}
          {...register('phonetic')}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-word-level" className="text-label font-medium text-ink-soft">
            Trình độ
          </label>
          <select
            id="new-word-level"
            className="w-full rounded-lg border border-line bg-white px-4 py-3.5 text-body text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            {...register('difficultyLevel')}
          >
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TextField
        label="Câu ví dụ (không bắt buộc)"
        lang="en"
        placeholder="VD: We need to negotiate a better price."
        error={errors.exampleSentence?.message}
        {...register('exampleSentence')}
      />
      {add.isError && <Alert variant="error">{describeApiError(add.error, 'Chưa thêm được từ. Vui lòng thử lại.')}</Alert>}
      <Button type="submit" variant="outline" size="sm" loading={isSubmitting} className="self-start">
        Thêm từ tự nhập
      </Button>
    </form>
  )
}

/**
 * Both ways of adding words to a list (A3: "chọn từ kho có sẵn hoặc tự nhập"). Words already in the list are marked
 * "Đã có" in the search results.
 * @param {{ listId: number, className?: string }} props
 */
export function AddWordsPanel({ listId, className }) {
  const [lastAdded, setLastAdded] = useState(null)
  const listWords = useListWords(listId)
  const wordIdsInList = new Set(loadedItems(listWords.data).map((word) => word.id))

  return (
    <Card className={cx('flex flex-col gap-4', className)}>
      <h2 className="text-lg font-semibold text-ink">Thêm từ vào danh sách</h2>
      <p role="status" className="text-label font-medium text-success empty:hidden">
        {lastAdded ? `Đã thêm “${lastAdded}” vào danh sách.` : ''}
      </p>
      <FromVocabulary listId={listId} wordIdsInList={wordIdsInList} onAdded={setLastAdded} />
      <div className="flex items-center gap-3 text-xs text-muted-light">
        <span className="h-px flex-1 bg-line" />
        hoặc tự nhập từ mới
        <span className="h-px flex-1 bg-line" />
      </div>
      <NewWordForm listId={listId} onAdded={setLastAdded} />
    </Card>
  )
}
