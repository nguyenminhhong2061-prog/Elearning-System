import { formatDayMonth } from '@/lib/dates'
import { Panel } from '../Panel'

/**
 * Scenario 25, step 6: the "Học tập" cards of a learner, chat sessions included (only their number, never what was
 * said).
 *
 * @param {{ stats: import('../../types').AdminUserDetail['stats'] }} props
 */
export function StudyStats({ stats }) {
  const items = [
    ['Từ đã học', stats.wordsLearned, `${stats.wordsMastered} từ đã thuộc`],
    ['Chuỗi ngày học', stats.streakDays, stats.lastStudyDate ? `học gần nhất ${formatDayMonth(stats.lastStudyDate)}` : 'chưa học ngày nào'],
    ['Bài tập hoàn thành', stats.exercisesCompleted, stats.exerciseAverageScore === null ? 'chưa có điểm' : `điểm TB ${stats.exerciseAverageScore}%`],
    ['Bài kiểm tra đã nộp', stats.testsSubmitted, stats.lastTestDate ? `gần nhất ${formatDayMonth(stats.lastTestDate)}` : 'chưa làm bài nào'],
    ['Phiên chat', stats.chatSessions, stats.lastChatDate ? `gần nhất ${formatDayMonth(stats.lastChatDate)}` : 'chưa trò chuyện với trợ lý'],
  ]
  return (
    <Panel title="Học tập">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
        {items.map(([label, value, note]) => (
          <div key={label} className="flex flex-col rounded-[10px] bg-surface-alt px-4 py-3.5">
            <dt className="text-xs text-muted-strong">{label}</dt>
            <dd className="mt-1.5 text-2xl font-bold text-ink">{value}</dd>
            <dd className="mt-0.5 text-xs text-muted-strong">{note}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
