import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx } from '@/lib/cx'
import { useCustomList, useDeleteList, useListWords, useRemoveWordFromList, useRenameList } from '../api/listsQueries'
import { WordList, WordListSkeleton } from '../components/WordList'
import { studyableCount } from '../constants'
import { AddWordsPanel } from '../lists/AddWordsPanel'
import { LISTS_TAB_PATH, parseId } from '../routeParams'
import { formatCount } from '../topicProgress'

function BackLink() {
  return (
    <Link to={LISTS_TAB_PATH} className="self-start text-label font-medium">
      ← Danh sách của tôi
    </Link>
  )
}

const TEXT_BUTTON =
  'cursor-pointer rounded-md px-2 py-1 text-label font-semibold hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand'

function RenameForm({ list, onDone }) {
  const rename = useRenameList(list.id)
  const [name, setName] = useState(list.name)
  const inputId = useId()

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      await rename.mutateAsync(name.trim())
      onDone()
    } catch {
      // Shown below.
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label font-medium text-ink-soft">
        Tên danh sách
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          value={name}
          maxLength={150}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
        <Button type="submit" size="sm" disabled={!name.trim()} loading={rename.isPending}>
          Lưu
        </Button>
        <Button variant="outline" size="sm" onClick={onDone}>
          Hủy
        </Button>
      </div>
      {rename.isError && <Alert variant="error">{describeApiError(rename.error, 'Chưa đổi được tên. Vui lòng thử lại.')}</Alert>}
    </form>
  )
}

function DeleteDialog({ list, open, onClose }) {
  const navigate = useNavigate()
  const remove = useDeleteList(list.id)

  async function confirm() {
    try {
      await remove.mutateAsync()
      onClose()
      navigate(LISTS_TAB_PATH, { replace: true })
    } catch {
      // Shown below.
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Xóa danh sách?">
      <p className="text-sm text-ink-soft">
        Danh sách “{list.name}” sẽ bị xóa. Tiến độ học các từ và những từ bạn tự nhập vẫn được giữ.
      </p>
      {remove.isError && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được danh sách.')}</Alert>}
      <div className="flex gap-2 pt-1.5">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="danger" size="sm" className="flex-1" loading={remove.isPending} onClick={confirm}>
          Xóa danh sách
        </Button>
      </div>
    </Dialog>
  )
}

// Full width under the title on small screens, beside the title on large ones (like the topic page).
const ACTION_WIDTH = 'w-full lg:w-auto lg:min-w-80 lg:max-w-100'

function StudyAction({ list }) {
  if (list.wordCount === 0) return null
  if (studyableCount(list) === 0) {
    return (
      <p className={cx(ACTION_WIDTH, 'rounded-lg border border-dashed border-line px-4 py-3 text-label text-muted')}>
        Bạn đã học hết danh sách này. Các từ sẽ được nhắc ôn lại theo lịch.
      </p>
    )
  }
  return (
    <ButtonLink to={`/vocabulary/lists/${list.id}/study`} className={ACTION_WIDTH}>
      Học danh sách này →
    </ButtonLink>
  )
}

function ListWords({ listId, query }) {
  const removeWord = useRemoveWordFromList(listId)

  if (query.isPending) return <WordListSkeleton rows={4} />
  if (query.isError) {
    return <LoadError error={query.error} onRetry={() => query.refetch()} message="Không tải được các từ của danh sách." />
  }

  const words = query.data.pages.flatMap((page) => page.items)
  if (words.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">Danh sách chưa có từ nào. Hãy thêm từ trong khung “Thêm từ vào danh sách”.</p>
      </Card>
    )
  }

  return (
    <>
      <WordList
        words={words}
        aside={(word) => (
          <button
            type="button"
            aria-label={`Bỏ “${word.word}” khỏi danh sách`}
            title="Bỏ khỏi danh sách"
            disabled={removeWord.isPending}
            onClick={() => removeWord.mutate(word.id)}
            className="flex size-7 flex-none cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          >
            ✕
          </button>
        )}
      />
      {removeWord.isError && (
        <Alert variant="error">{describeApiError(removeWord.error, 'Chưa bỏ được từ. Vui lòng thử lại.')}</Alert>
      )}
      {query.hasNextPage && (
        <Button variant="outline" className="sm:min-w-60 sm:self-center" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          Xem thêm từ
        </Button>
      )}
    </>
  )
}

/** A personal list (A3): its words, studying it, and managing it. */
export function ListDetailPage() {
  const params = useParams()
  const listId = parseId(params.listId)
  const listQuery = useCustomList(listId)
  const wordsQuery = useListWords(listId)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (listId === null || listQuery.error?.status === 404) {
    return (
      <Page
        title="Không tìm thấy danh sách"
        width="focus"
        heading={
          <div className="flex flex-col gap-2">
            <BackLink />
            <h1 className="text-[22px] leading-7 font-bold text-ink">Không tìm thấy danh sách</h1>
          </div>
        }
      >
        <Card>
          <p className="text-sm text-muted">Danh sách này không tồn tại hoặc đã bị xóa.</p>
        </Card>
      </Page>
    )
  }

  if (listQuery.isError) {
    return (
      <Page title="Danh sách của tôi" width="focus" heading={<BackLink />}>
        <h1 className="sr-only">Danh sách của tôi</h1>
        <LoadError error={listQuery.error} onRetry={() => listQuery.refetch()} message="Không tải được danh sách." />
      </Page>
    )
  }

  const list = listQuery.data
  const wordIdsInList = new Set((wordsQuery.data?.pages ?? []).flatMap((page) => page.items.map((word) => word.id)))

  return (
    <Page
      title={list?.name ?? 'Danh sách của tôi'}
      heading={
        <div className="flex flex-col gap-2">
          <BackLink />
          {!list ? (
            <>
              <h1 className="sr-only">Đang tải danh sách</h1>
              <Skeleton className="h-7 w-56" />
            </>
          ) : editing ? (
            <>
              <h1 className="sr-only">{list.name}</h1>
              <RenameForm list={list} onDone={() => setEditing(false)} />
            </>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 lg:justify-start">
                  <h1 className="text-[22px] leading-7 font-bold break-words text-ink">{list.name}</h1>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditing(true)} className={`${TEXT_BUTTON} text-brand-dark`}>
                      Đổi tên
                    </button>
                    <button type="button" onClick={() => setConfirmingDelete(true)} className={`${TEXT_BUTTON} text-danger`}>
                      Xóa
                    </button>
                  </div>
                </div>
                <p className="text-label text-muted">
                  {formatCount(list.wordCount)} từ
                  {list.wordCount > 0 && ` · Đã học ${formatCount(list.learnedCount)} / ${formatCount(list.wordCount)} từ`}
                </p>
              </div>
              <StudyAction list={list} />
            </div>
          )}
        </div>
      }
    >
      {/* The words, and beside them on wide screens (below on small ones) the panel to add more. */}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-3">
          <ListWords listId={listId} query={wordsQuery} />
        </div>
        {list && <AddWordsPanel listId={listId} wordIdsInList={wordIdsInList} className="min-w-0 flex-[1_1_340px]" />}
      </div>
      {list && <DeleteDialog list={list} open={confirmingDelete} onClose={() => setConfirmingDelete(false)} />}
    </Page>
  )
}
