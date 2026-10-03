import { useState } from 'react'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCustomLists } from '../api/listsQueries'
import { CreateListDialog } from '../components/lists/CreateListDialog'
import { ListRow, NewListRow } from '../components/lists/ListRow'
import { VocabularyShell } from '../components/VocabularyShell'

/** The learner's lists as rows, ending with the dashed "+ Tạo danh sách mới" row. */
function ListsContent({ onCreate }) {
  const lists = useCustomLists()

  if (lists.isPending) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-13.5 rounded-[10px]" />
        ))}
      </div>
    )
  }
  if (lists.isError) {
    return <LoadError error={lists.error} onRetry={() => lists.refetch()} message="Không tải được danh sách của bạn." />
  }

  return (
    <div className="flex flex-col gap-2.5">
      {lists.data.length === 0 && (
        <p className="text-sm text-muted">
          Bạn chưa có danh sách nào. Hãy gom những từ bạn muốn luyện riêng, từ kho có sẵn hoặc tự nhập.
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {lists.data.map((list) => (
          <li key={list.id}>
            <ListRow list={list} />
          </li>
        ))}
      </ul>
      <NewListRow onClick={onCreate} />
    </div>
  )
}

/** "Danh sách của tôi" tab of /vocabulary (A3). */
export function ListsTab() {
  const [creating, setCreating] = useState(false)

  return (
    <VocabularyShell tab="lists" title="Danh sách của tôi">
      <ListsContent onCreate={() => setCreating(true)} />
      <CreateListDialog open={creating} onClose={() => setCreating(false)} />
    </VocabularyShell>
  )
}
