import { describeActivityTime } from '../../utils/format'
import { Panel } from '../Panel'

const PREFIX = { EXERCISE: 'Bài tập ', GAME: 'Trò chơi ' }

/** "Bài tập **Thì hiện tại đơn** · 50%": the title is bold, except for chats and reviews whose title is a description. */
function ActivityText({ item }) {
  const bold = item.type === 'EXERCISE' || item.type === 'GAME' || item.type === 'TEST'
  return (
    <>
      {PREFIX[item.type]}
      {bold ? <strong>{item.title}</strong> : item.title}
      {item.detail && ` · ${item.detail}`}
    </>
  )
}

/**
 * Scenario 25, step 6: the five latest things a learner did. Chats only show how many messages, never their content.
 *
 * @param {{ items: import('../../types').AdminUserDetail['recentActivity'] }} props
 */
export function RecentActivity({ items }) {
  return (
    <Panel title="Hoạt động gần đây">
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">Chưa có hoạt động nào.</p>
      ) : (
        <ul className="-mt-1.5 flex flex-col">
          {items.map((item, index) => (
            <li key={`${item.at}-${index}`} className="flex flex-col gap-1 border-b border-canvas py-3 text-label leading-4.5 last:border-b-0 sm:flex-row sm:gap-4">
              <span className="w-30 flex-none text-muted-strong">{describeActivityTime(item.at)}</span>
              <span className="text-ink">
                <ActivityText item={item} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
