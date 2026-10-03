import { Link } from 'react-router'
import { paths } from '@/config/paths'
import { describeTopicProgress } from '../../utils/topicProgress'

/**
 * One personal list in the "Danh sách của tôi" tab: its name and progress, linking to the list.
 * @param {{ list: import('../../types').CustomList }} props
 */
export function ListRow({ list }) {
  return (
    <Link
      to={paths.list(list.id)}
      className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-white p-4 transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="text-sm font-semibold text-ink">{list.name}</span>
      <span className="flex-none text-xs text-muted">{describeTopicProgress(list)}</span>
    </Link>
  )
}

/** The dashed "+ Tạo danh sách mới" row under the lists. */
export function NewListRow({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-line bg-surface-alt p-4 text-sm font-semibold text-brand-dark hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      + Tạo danh sách mới
    </button>
  )
}
