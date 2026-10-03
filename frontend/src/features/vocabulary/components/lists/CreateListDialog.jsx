import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { paths } from '@/config/paths'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useCreateList, useCustomLists } from '../../api/listsQueries'
import { useWordSearch } from '../../api/vocabularyQueries'
import { WORD_SEARCH_MIN_LENGTH } from '../../constants'
import { parseWordEntry } from '../../utils/wordEntry'

const MAX_NAME = 150
const MAX_SUGGESTIONS = 5
const INPUT =
  'w-full rounded-lg border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none placeholder:text-muted-light focus:border-brand focus:ring-2 focus:ring-brand/25'
const NAME_TAKEN = 'Bạn đã có danh sách tên này.'

/** Same rule as the server: a learner's lists cannot share a name, ignoring case (scenario 7, branch 11a). */
const sameName = (a, b) => a.trim().toLocaleLowerCase('vi') === b.trim().toLocaleLowerCase('vi')

/** Words from the shared vocabulary matching what is being typed ("chọn từ kho có sẵn" of A3). */
function Suggestions({ term, excluded, onPick }) {
  const search = useWordSearch(term)
  const found = search.data?.items ?? []
  const words = found.filter((word) => !excluded.has(word.id)).slice(0, MAX_SUGGESTIONS)
  if (term.length < WORD_SEARCH_MIN_LENGTH || !search.isSuccess || search.isPlaceholderData) return null
  // Scenario 7, branch 6a: nothing in the shared vocabulary contains the term.
  if (found.length === 0) {
    return <p className="text-xs text-muted">Không tìm thấy từ phù hợp. Bạn có thể tự nhập theo dạng “từ — nghĩa”.</p>
  }
  if (words.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted">Có sẵn trong kho từ vựng:</p>
      <ul className="flex flex-col rounded-lg border border-line">
        {words.map((word) => (
          <li key={word.id} className="border-b border-canvas last:border-b-0">
            <button
              type="button"
              onClick={() => onPick(word)}
              className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-label text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span>
                <span lang="en" className="font-semibold">
                  {word.word}
                </span>{' '}
                — {word.meaning}
              </span>
              <span aria-hidden="true" className="font-semibold text-brand-dark">
                +
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CreateListForm({ onClose }) {
  const navigate = useNavigate()
  const create = useCreateList()
  const lists = useCustomLists()
  const nameId = useId()
  const entryId = useId()
  const entryErrorId = useId()
  const nameErrorId = useId()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(null)
  const [entry, setEntry] = useState('')
  const [entryError, setEntryError] = useState(null)
  // Chosen words: { key, label, vocabularyId } for words of the shared vocabulary, { key, label, newWord } for typed ones.
  const [items, setItems] = useState([])
  const suggestionTerm = useDebouncedValue(entry.trim(), 250)

  function add(item) {
    if (items.some((existing) => existing.key === item.key)) {
      setEntryError('Từ này đã có trong danh sách.')
      return
    }
    setItems((previous) => [...previous, item])
    setEntry('')
    setEntryError(null)
  }

  function addTyped() {
    const parsed = parseWordEntry(entry)
    if (!parsed) {
      setEntryError('Nhập theo dạng “từ — nghĩa”, ví dụ: negotiate — thương lượng. Hoặc chọn một từ gợi ý.')
      return
    }
    add({ key: `new:${parsed.word.toLowerCase()}`, label: `${parsed.word} — ${parsed.meaning}`, newWord: parsed })
  }

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Vui lòng nhập tên danh sách.')
      return
    }
    if (lists.data?.some((list) => sameName(list.name, name))) {
      setNameError(NAME_TAKEN)
      return
    }
    try {
      const list = await create.mutateAsync({
        name: name.trim(),
        vocabularyIds: items.filter((item) => item.vocabularyId).map((item) => item.vocabularyId),
        newWords: items.filter((item) => item.newWord).map((item) => item.newWord),
      })
      onClose()
      navigate(paths.list(list.id))
    } catch (error) {
      // A list created meanwhile in another tab: the server refuses the name (409). Other errors are shown below.
      if (error?.status === 409) setNameError(NAME_TAKEN)
    }
  }

  const chosenIds = new Set(items.filter((item) => item.vocabularyId).map((item) => item.vocabularyId))

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-label font-medium text-ink-soft">
          Tên danh sách
        </label>
        <input
          id={nameId}
          value={name}
          maxLength={MAX_NAME}
          onChange={(event) => {
            setName(event.target.value)
            setNameError(null)
          }}
          placeholder="VD: Từ vựng du lịch cá nhân"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          className={INPUT}
          autoFocus
        />
        {nameError && (
          <p id={nameErrorId} className="text-xs text-danger">
            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={entryId} className="text-label font-medium text-ink-soft">
          Thêm từ
        </label>
        <div className="flex gap-2">
          <input
            id={entryId}
            value={entry}
            onChange={(event) => {
              setEntry(event.target.value)
              setEntryError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault() // Enter adds the word instead of submitting the whole form
                addTyped()
              }
            }}
            placeholder="VD: negotiate — thương lượng"
            aria-invalid={entryError ? true : undefined}
            aria-describedby={entryError ? entryErrorId : undefined}
            className={INPUT}
          />
          <Button variant="secondary" size="sm" onClick={addTyped}>
            Thêm
          </Button>
        </div>
        {entryError && (
          <p id={entryErrorId} className="text-xs text-danger">
            {entryError}
          </p>
        )}
      </div>

      {!parseWordEntry(entry) && (
        <Suggestions
          term={suggestionTerm}
          excluded={chosenIds}
          onPick={(word) => add({ key: `bank:${word.id}`, label: `${word.word} — ${word.meaning}`, vocabularyId: word.id })}
        />
      )}

      <ul aria-label="Từ đã chọn" className="flex min-h-7 flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-1.5 rounded-full bg-brand-tint py-1.5 pr-1.5 pl-3 text-xs font-medium text-brand-dark"
          >
            {item.label}
            <button
              type="button"
              aria-label={`Bỏ “${item.label}”`}
              onClick={() => setItems((previous) => previous.filter((other) => other.key !== item.key))}
              className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-brand-tint-line focus-visible:outline-2 focus-visible:outline-brand"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {create.isError && create.error?.status !== 409 && (
        <Alert variant="error">{describeApiError(create.error, 'Không tạo được danh sách. Vui lòng thử lại.')}</Alert>
      )}

      <div className="flex gap-2 pt-1.5">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" size="sm" className="flex-1" loading={create.isPending}>
          Tạo danh sách
        </Button>
      </div>
    </form>
  )
}

/** The design's "Tạo danh sách riêng" modal (A3). After creating, it opens the new list. */
export function CreateListDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Tạo danh sách riêng">
      <CreateListForm onClose={onClose} />
    </Dialog>
  )
}
