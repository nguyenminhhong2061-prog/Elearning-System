import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { SearchField } from '@/components/ui/SearchField'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { paths } from '@/config/paths'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { useAdminTopics, useAdminWords } from '../api/vocabularyQueries'
import { AdminPage } from '../components/AdminPage'
import { RowAction, TABLE, TableCard, TD, TH } from '../components/controls'
import { formatFullDate } from '../utils/format'
import { useClampPage, useUrlFilters } from '../hooks/useUrlFilters'
import { DeleteTopicDialog, DeleteWordDialog, TopicDialog } from '../components/vocabulary/vocabularyDialogs'
import { WordDrawer } from '../components/vocabulary/WordDrawer'
import { WordTable } from '../components/vocabulary/WordTable'

const MISSING_LABELS = { AUDIO: 'Từ chưa có audio phát âm', EXAMPLE: 'Từ chưa có câu ví dụ', IMAGE: 'Từ chưa có ảnh minh họa' }

/**
 * Scenarios 19, 20 and 22: every topic with what it still lacks, a search across the whole word bank, and the
 * topic dialogs. `?q=` or `?missing=AUDIO|EXAMPLE|IMAGE` lists matching words of every topic instead of the topics.
 */
export function AdminTopicsPage() {
  const [filters, setFilters] = useUrlFilters({ q: '', missing: '', page: '0' })
  const [term, setTerm] = useState(filters.q)
  const debouncedTerm = useDebouncedValue(term.trim(), 300)
  useEffect(() => {
    if (debouncedTerm !== filters.q) setFilters({ q: debouncedTerm })
  }, [debouncedTerm, filters.q, setFilters])

  const topics = useAdminTopics()
  const listingWords = Boolean(filters.q || filters.missing)
  const words = useAdminWords({ q: filters.q, missing: filters.missing, page: Number(filters.page), size: 10 }, { enabled: listingWords })

  useClampPage(words.data, setFilters)
  const [wordTarget, setWordTarget] = useState(null)
  const [deletingWord, setDeletingWord] = useState(null)
  const [topicTarget, setTopicTarget] = useState(null)
  const [deletingTopic, setDeletingTopic] = useState(null)

  const list = topics.data ?? []
  const totalWords = list.reduce((sum, topic) => sum + topic.wordCount, 0)
  const missingAudio = list.reduce((sum, topic) => sum + topic.missingAudioCount, 0)
  const missingExample = list.reduce((sum, topic) => sum + topic.missingExampleCount, 0)

  return (
    <AdminPage
      title="Từ vựng"
      section="Nội dung học"
      summary={topics.data ? `${list.length} chủ đề · ${formatCount(totalWords)} từ hệ thống` : ' '}
      actions={
        <>
          <Button variant="outline" size="xs" onClick={() => setWordTarget({ mode: 'add', topicId: null })} disabled={!topics.data}>
            + Thêm từ
          </Button>
          <Button variant="strong" size="xs" onClick={() => setTopicTarget({ mode: 'add' })} disabled={!topics.data}>
            + Thêm chủ đề
          </Button>
        </>
      }
    >
      <SearchField
        label="Tìm từ trong toàn bộ kho"
        placeholder="Tìm từ hoặc nghĩa trong toàn bộ kho"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onClear={() => {
          setTerm('')
          setFilters({ q: '' })
        }}
        className="w-full sm:w-110"
      />

      {topics.isPending ? (
        <TopicsSkeleton />
      ) : topics.isError ? (
        <LoadError error={topics.error} onRetry={topics.refetch} message="Không tải được danh sách chủ đề. Vui lòng thử lại." />
      ) : listingWords ? (
        <section aria-labelledby="word-results" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="word-results" className="text-base font-bold text-ink">
              {filters.missing ? MISSING_LABELS[filters.missing] : 'Kết quả tìm kiếm'}
              {words.data && ` (${formatCount(words.data.totalItems)})`}
            </h2>
            {filters.q && filters.missing && <span className="text-label text-muted-strong">có “{filters.q}”</span>}
            <button
              type="button"
              onClick={() => {
                setTerm('')
                setFilters({ q: '', missing: '' })
              }}
              className="cursor-pointer text-label font-bold text-brand-dark hover:underline"
            >
              ← Về danh sách chủ đề
            </button>
          </div>
          {words.isPending ? (
            <TopicsSkeleton />
          ) : words.isError ? (
            <LoadError error={words.error} onRetry={words.refetch} message="Không tìm được từ. Vui lòng thử lại." />
          ) : words.data.totalItems === 0 ? (
            <p role="status" className="rounded-xl border border-line bg-white px-6 py-10 text-center text-sm text-ink-soft">
              {filters.missing ? 'Không còn từ nào thiếu nội dung này.' : `Không có từ nào khớp với “${filters.q}”.`}
            </p>
          ) : (
            <WordTable
              label={filters.missing ? MISSING_LABELS[filters.missing] : 'Kết quả tìm kiếm'}
              page={words.data}
              stale={words.isPlaceholderData}
              term={filters.q}
              topics={list}
              onPageChange={(page) => setFilters({ page: String(page) })}
              onEdit={(word) => setWordTarget({ mode: 'edit', word })}
              onDelete={setDeletingWord}
            />
          )}
        </section>
      ) : (
        <>
          {(missingAudio > 0 || missingExample > 0) && (
            <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] bg-warning-bg px-4.5 py-3.5 text-warning">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M9 2.5l7 12.5H2z" />
                <path d="M9 7.5v3.5M9 13.2v.1" />
              </svg>
              <p className="min-w-60 flex-1 text-label leading-4.5">
                <strong>Nội dung còn thiếu:</strong>{' '}
                {[missingAudio > 0 && `${formatCount(missingAudio)} từ chưa có audio phát âm`, missingExample > 0 && `${formatCount(missingExample)} từ chưa có câu ví dụ`]
                  .filter(Boolean)
                  .join(', ')}
                . Khi thiếu audio, người học nghe giọng đọc của trình duyệt.
              </p>
              {missingAudio > 0 && (
                <Link to={paths.adminMissingWords('AUDIO')} className="text-label font-bold whitespace-nowrap text-warning">
                  Xem từ thiếu audio →
                </Link>
              )}
            </div>
          )}

          {list.length === 0 ? (
            <p role="status" className="rounded-xl border border-line bg-white px-6 py-10 text-center text-sm text-ink-soft">
              Chưa có chủ đề nào. Bấm “+ Thêm chủ đề” để bắt đầu.
            </p>
          ) : (
            <TableCard label="Danh sách chủ đề">
              <table className={cx(TABLE, 'min-w-230')}>
                <thead className="bg-surface-alt">
                  <tr>
                    <th scope="col" className={TH}>Chủ đề</th>
                    <th scope="col" className={cx(TH, 'text-right')}>Số từ</th>
                    <th scope="col" className={TH}>Trình độ</th>
                    <th scope="col" className={TH}>Còn thiếu</th>
                    <th scope="col" className={cx(TH, 'text-right')}>Người học đã học</th>
                    <th scope="col" className={TH}>Cập nhật</th>
                    <th scope="col" className={cx(TH, 'text-right')}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((topic) => (
                    <tr key={topic.id}>
                      <td className={cx(TD, 'py-3')}>
                        <div className="flex items-center gap-3">
                          {topic.imageUrl ? (
                            <img src={topic.imageUrl} alt="" className="size-10 flex-none rounded-lg object-cover" />
                          ) : (
                            <span aria-hidden="true" className="size-10 flex-none rounded-lg bg-[repeating-linear-gradient(135deg,var(--color-brand-tint)_0_8px,var(--color-brand-stripe)_8px_16px)]" />
                          )}
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <Link to={paths.adminTopic(topic.id)} className="text-sm font-semibold text-ink hover:text-brand-dark">
                              {topic.name}
                            </Link>
                            {topic.description && <span className="text-xs text-muted-strong">{topic.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className={cx(TD, 'text-right font-semibold')}>{topic.wordCount}</td>
                      <td className={cx(TD, 'whitespace-nowrap')}>
                        {topic.minLevel ? (topic.minLevel === topic.maxLevel ? topic.minLevel : `${topic.minLevel} – ${topic.maxLevel}`) : <span className="text-muted-strong">Chưa có từ</span>}
                      </td>
                      <td className={TD}>
                        <div className="flex gap-1.5">
                          {topic.missingAudioCount > 0 && <Tag variant="warning">{topic.missingAudioCount} audio</Tag>}
                          {topic.missingExampleCount > 0 && <Tag variant="warning">{topic.missingExampleCount} ví dụ</Tag>}
                          {topic.wordCount > 0 && topic.missingAudioCount === 0 && topic.missingExampleCount === 0 && <Tag variant="success">Đủ</Tag>}
                        </div>
                      </td>
                      <td className={cx(TD, 'text-right')}>{topic.learnerCount}</td>
                      <td className={cx(TD, 'text-muted-strong')}>{topic.updatedAt ? formatFullDate(topic.updatedAt) : '—'}</td>
                      <td className={cx(TD, 'text-right whitespace-nowrap')}>
                        <RowAction onClick={() => setTopicTarget({ mode: 'edit', topic })} aria-label={`Sửa chủ đề ${topic.name}`}>
                          Sửa
                        </RowAction>
                        <RowAction tone="danger" onClick={() => setDeletingTopic(topic)} aria-label={`Xóa chủ đề ${topic.name}`}>
                          Xóa
                        </RowAction>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          )}
        </>
      )}

      <WordDrawer target={wordTarget} topics={list} onClose={() => setWordTarget(null)} onOpenWord={(word) => setWordTarget({ mode: 'edit', word })} />
      <DeleteWordDialog word={deletingWord} onClose={() => setDeletingWord(null)} />
      <TopicDialog target={topicTarget} topics={list} onClose={() => setTopicTarget(null)} />
      <DeleteTopicDialog topic={deletingTopic} onClose={() => setDeletingTopic(null)} />
    </AdminPage>
  )
}

function TopicsSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-fade-in-late flex-col gap-4 rounded-xl border border-line bg-white p-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
