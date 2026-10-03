import { Link } from 'react-router'
import { Tag } from '@/components/ui/Tag'
import { paths } from '@/config/paths'
import { cx } from '@/lib/cx'
import { LevelTag, Pagination, RowAction, TABLE, TableCard, TD, TH } from '../controls'
import { Highlight } from '../Highlight'

/**
 * Words of the admin area: one topic's words, or search results across the whole bank (`topics` given: a "Chủ đề"
 * column is added).
 *
 * @param {object} props
 * @param {string} props.label
 * @param {import('@/api/types').PageResponse<import('../../types').AdminWord>} props.page
 * @param {boolean} [props.stale] a newer page is loading
 * @param {string} [props.term] search term to highlight
 * @param {import('../../types').AdminTopic[]} [props.topics]
 * @param {(page: number) => void} props.onPageChange
 * @param {(word: import('../../types').AdminWord) => void} props.onEdit
 * @param {(word: import('../../types').AdminWord) => void} props.onDelete
 */
export function WordTable({ label, page, stale, term, topics, onPageChange, onEdit, onDelete }) {
  const topicOf = (id) => topics?.find((topic) => topic.id === id)
  return (
    <TableCard label={label} footer={<Pagination data={page} unit="từ" onPageChange={onPageChange} />}>
      <table className={cx(TABLE, 'min-w-220', stale && 'opacity-60')}>
        <thead className="bg-surface-alt">
          <tr>
            <th scope="col" className={TH}>Từ</th>
            <th scope="col" className={TH}>Nghĩa</th>
            {topics && <th scope="col" className={TH}>Chủ đề</th>}
            <th scope="col" className={TH}>Trình độ</th>
            <th scope="col" className={TH}>Câu ví dụ</th>
            <th scope="col" className={TH}>Audio</th>
            <th scope="col" className={cx(TH, 'text-right')}>Người học</th>
            <th scope="col" className={cx(TH, 'text-right')}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {page.items.map((word) => {
            const topic = topicOf(word.topicId)
            return (
              <tr key={word.id}>
                <td className={cx(TD, 'py-2.75')}>
                  <div className="flex flex-col gap-0.5">
                    <span lang="en" className="text-sm font-semibold text-ink">
                      <Highlight text={word.word} term={term} />
                    </span>
                    {word.phonetic && (
                      <span lang="en" className="font-mono text-xs text-muted-strong">
                        {word.phonetic}
                      </span>
                    )}
                  </div>
                </td>
                <td className={TD}>
                  <Highlight text={word.meaning} term={term} />
                </td>
                {topics && (
                  <td className={TD}>
                    {topic ? (
                      <Link to={paths.adminTopic(topic.id)} className="font-semibold">
                        {topic.name}
                      </Link>
                    ) : (
                      <span className="text-muted-strong">Chưa có chủ đề</span>
                    )}
                  </td>
                )}
                <td className={TD}>
                  <LevelTag level={word.difficultyLevel} />
                </td>
                <td className={TD}>{word.exampleSentence ? <Tag variant="success">Có</Tag> : <Tag variant="warning">Thiếu</Tag>}</td>
                <td className={TD}>{word.audioUrl ? <Tag variant="success">Có</Tag> : <Tag variant="warning">Thiếu</Tag>}</td>
                <td className={cx(TD, 'text-right text-ink-soft')}>{word.learnerCount}</td>
                <td className={cx(TD, 'text-right whitespace-nowrap')}>
                  <RowAction onClick={() => onEdit(word)} aria-label={`Sửa “${word.word}”`}>
                    Sửa
                  </RowAction>
                  <RowAction tone="danger" onClick={() => onDelete(word)} aria-label={`Xóa “${word.word}”`}>
                    Xóa
                  </RowAction>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableCard>
  )
}
