import { useState } from 'react'
import { useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/paths'
import { formatCount } from '@/lib/format'
import { parseId } from '@/lib/routeParams'
import { useCustomList } from '../api/listsQueries'
import { AddWordsPanel } from '../components/lists/AddWordsPanel'
import { DeleteListDialog } from '../components/lists/DeleteListDialog'
import { ListWords } from '../components/lists/ListWords'
import { RenameListForm } from '../components/lists/RenameListForm'
import { StudyButton } from '../components/StudyButton'

const TEXT_BUTTON =
  'cursor-pointer rounded-md px-2 py-1 text-label font-semibold hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand'

const backLink = <BackLink to={paths.vocabularyLists}>Danh sách của tôi</BackLink>

/** Name, "Đổi tên" and "Xóa", word count and the study button of the list. */
function ListHeading({ list, onRename, onDelete }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 lg:justify-start">
          <h1 className="text-[22px] leading-7 font-bold break-words text-ink">{list.name}</h1>
          <div className="flex gap-1">
            <button type="button" onClick={onRename} className={`${TEXT_BUTTON} text-brand-dark`}>
              Đổi tên
            </button>
            <button type="button" onClick={onDelete} className={`${TEXT_BUTTON} text-danger`}>
              Xóa
            </button>
          </div>
        </div>
        <p className="text-label text-muted">
          {formatCount(list.wordCount)} từ
          {list.wordCount > 0 && ` · Đã học ${formatCount(list.learnedCount)} / ${formatCount(list.wordCount)} từ`}
        </p>
      </div>
      <StudyButton
        counts={list}
        to={paths.listStudy(list.id)}
        finishedMessage="Bạn đã học hết danh sách này. Các từ sẽ được nhắc ôn lại theo lịch."
      >
        Học danh sách này →
      </StudyButton>
    </div>
  )
}

/** /vocabulary/lists/:listId: a personal list (A3), its words, studying it, and managing it. */
export function ListDetailPage() {
  // 1. What the URL asks for.
  const listId = parseId(useParams().listId)

  // 2. The data, and what the learner is doing on the page.
  const listQuery = useCustomList(listId)
  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // 3. One state at a time: not found, error, then the page (the heading shows a placeholder while loading).
  if (listId === null || listQuery.error?.status === 404) {
    return (
      <Page
        title="Không tìm thấy danh sách"
        width="focus"
        heading={
          <div className="flex flex-col gap-2">
            {backLink}
            <h1 className="text-[22px] leading-7 font-bold text-ink">Không tìm thấy danh sách</h1>
          </div>
        }
      >
        <EmptyState>Danh sách này không tồn tại hoặc đã bị xóa.</EmptyState>
      </Page>
    )
  }

  if (listQuery.isError) {
    return (
      <Page title="Danh sách của tôi" width="focus" heading={backLink}>
        <h1 className="sr-only">Danh sách của tôi</h1>
        <LoadError error={listQuery.error} onRetry={() => listQuery.refetch()} message="Không tải được danh sách." />
      </Page>
    )
  }

  const list = listQuery.data
  let heading
  if (!list) {
    heading = (
      <>
        <h1 className="sr-only">Đang tải danh sách</h1>
        <Skeleton className="h-7 w-56" />
      </>
    )
  } else if (renaming) {
    heading = (
      <>
        <h1 className="sr-only">{list.name}</h1>
        <RenameListForm list={list} onDone={() => setRenaming(false)} />
      </>
    )
  } else {
    heading = <ListHeading list={list} onRename={() => setRenaming(true)} onDelete={() => setConfirmingDelete(true)} />
  }

  return (
    <Page
      title={list?.name ?? 'Danh sách của tôi'}
      heading={
        <div className="flex flex-col gap-2">
          {backLink}
          {heading}
        </div>
      }
    >
      {/* The words, and beside them on wide screens (below on small ones) the panel to add more. */}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-3">
          <ListWords listId={listId} />
        </div>
        {list && <AddWordsPanel listId={listId} className="min-w-0 flex-[1_1_340px]" />}
      </div>
      {list && <DeleteListDialog list={list} open={confirmingDelete} onClose={() => setConfirmingDelete(false)} />}
    </Page>
  )
}
