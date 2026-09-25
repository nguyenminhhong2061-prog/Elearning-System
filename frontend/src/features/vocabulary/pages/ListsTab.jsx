import { useState } from 'react'
import { Link } from 'react-router'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCustomLists } from '../api/listsQueries'
import { VocabularyShell } from '../components/VocabularyShell'
import { CreateListDialog } from '../lists/CreateListDialog'
import { describeTopicProgress } from '../topicProgress'

const NEW_LIST_ROW =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-line bg-surface-alt p-4 text-sm font-semibold text-brand-dark hover:border-brand focus-visible:outline-2 focus-visible:outline-brand'

/** "Danh sách của tôi" tab (A3): the learner's lists, as rows, and the dashed "+ Tạo danh sách mới" row. */
export function ListsTab() {
  const lists = useCustomLists()
  const [creating, setCreating] = useState(false)

  let body
  if (lists.isPending) {
    body = (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-13.5 rounded-[10px]" />
        ))}
      </div>
    )
  } else if (lists.isError) {
    body = <LoadError error={lists.error} onRetry={() => lists.refetch()} message="Không tải được danh sách của bạn." />
  } else {
    body = (
      <div className="flex flex-col gap-2.5">
        {lists.data.length === 0 && (
          <p className="text-sm text-muted">
            Bạn chưa có danh sách nào. Hãy gom những từ bạn muốn luyện riêng, từ kho có sẵn hoặc tự nhập.
          </p>
        )}
        <ul className="flex flex-col gap-2.5">
          {lists.data.map((list) => (
            <li key={list.id}>
              <Link
                to={`/vocabulary/lists/${list.id}`}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-white p-4 transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="text-sm font-semibold text-ink">{list.name}</span>
                <span className="flex-none text-xs text-muted">{describeTopicProgress(list)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setCreating(true)} className={NEW_LIST_ROW}>
          + Tạo danh sách mới
        </button>
      </div>
    )
  }

  return (
    <VocabularyShell tab="lists" title="Danh sách của tôi">
      {body}
      <CreateListDialog open={creating} onClose={() => setCreating(false)} />
    </VocabularyShell>
  )
}
