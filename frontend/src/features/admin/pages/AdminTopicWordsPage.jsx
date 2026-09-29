import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { SearchField } from '@/components/ui/SearchField'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useAdminTopics, useAdminWords } from '../api/adminQueries'
import { AdminPage } from '../components/AdminPage'
import { InlineSelect } from '../components/controls'
import { levelOptions } from '../format'
import { useClampPage, useUrlFilters } from '../useUrlFilters'
import { DeleteWordDialog, TopicDialog } from '../vocabulary/vocabularyDialogs'
import { WordDrawer } from '../vocabulary/WordDrawer'
import { WordTable } from '../vocabulary/WordTable'

const PAGE_SIZE = 10
const MISSING_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'AUDIO', label: 'Thiếu audio' },
  { value: 'EXAMPLE', label: 'Thiếu câu ví dụ' },
  { value: 'IMAGE', label: 'Thiếu ảnh' },
]

/** Scenarios 18–20: the words of one topic, with the edit/add panel and the delete dialog. */
export function AdminTopicWordsPage() {
  const topicId = Number(useParams().topicId)
  const [filters, setFilters] = useUrlFilters({ q: '', level: '', missing: '', page: '0' })
  const [term, setTerm] = useState(filters.q)
  const debouncedTerm = useDebouncedValue(term.trim(), 300)
  useEffect(() => {
    if (debouncedTerm !== filters.q) setFilters({ q: debouncedTerm })
  }, [debouncedTerm, filters.q, setFilters])

  const topics = useAdminTopics()
  const words = useAdminWords({ topicId, q: filters.q, level: filters.level, missing: filters.missing, page: Number(filters.page), size: PAGE_SIZE })
  useClampPage(words.data, setFilters)
  const [wordTarget, setWordTarget] = useState(null)
  const [deletingWord, setDeletingWord] = useState(null)
  const [editingTopic, setEditingTopic] = useState(null)

  const topic = topics.data?.find((candidate) => candidate.id === topicId)
  const filtered = Boolean(filters.q || filters.level || filters.missing)

  if (topics.isPending) return <WordsSkeleton />
  if (topics.isError) {
    return (
      <AdminPage title="Từ vựng" section="Nội dung học">
        <LoadError error={topics.error} onRetry={topics.refetch} message="Không tải được chủ đề. Vui lòng thử lại." />
      </AdminPage>
    )
  }
  if (!topic) {
    return (
      <AdminPage title="Không tìm thấy chủ đề" breadcrumb={[{ label: 'Từ vựng', to: '/admin/vocabulary' }]}>
        <Alert variant="error">Chủ đề này không tồn tại hoặc đã bị xóa.</Alert>
      </AdminPage>
    )
  }

  const levelRange = topic.minLevel ? (topic.minLevel === topic.maxLevel ? topic.minLevel : `${topic.minLevel} – ${topic.maxLevel}`) : null
  return (
    <AdminPage
      title={topic.name}
      breadcrumb={[{ label: 'Từ vựng', to: '/admin/vocabulary' }]}
      summary={[topic.description, `${topic.wordCount} từ`, levelRange].filter(Boolean).join(' · ')}
      actions={
        <>
          <Button variant="outline" size="xs" onClick={() => setEditingTopic({ mode: 'edit', topic })}>
            Sửa chủ đề
          </Button>
          <Button variant="strong" size="xs" onClick={() => setWordTarget({ mode: 'add', topicId })}>
            + Thêm từ
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          label="Tìm trong chủ đề"
          placeholder="Tìm từ hoặc nghĩa"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onClear={() => {
            setTerm('')
            setFilters({ q: '' })
          }}
          className="w-full sm:w-80"
        />
        <InlineSelect label="Trình độ" value={filters.level} onChange={(level) => setFilters({ level })} options={levelOptions()} />
        <InlineSelect label="Nội dung" value={filters.missing} onChange={(missing) => setFilters({ missing })} options={MISSING_OPTIONS} />
        <span className="text-label text-muted-strong xl:ml-auto">Sắp theo trình độ A1 → C2, rồi theo chữ cái</span>
      </div>

      {words.isPending ? (
        <WordsSkeleton inline />
      ) : words.isError ? (
        <LoadError error={words.error} onRetry={words.refetch} message="Không tải được danh sách từ. Vui lòng thử lại." />
      ) : words.data.totalItems === 0 ? (
        <section role="status" className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-12 text-center">
          <p className="text-base font-bold text-ink">{filtered ? 'Không có từ phù hợp' : 'Chủ đề này chưa có từ nào.'}</p>
          {filtered ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setTerm('')
                setFilters({ q: '', level: '', missing: '' })
              }}
            >
              Xóa bộ lọc
            </Button>
          ) : (
            <Button variant="strong" size="xs" onClick={() => setWordTarget({ mode: 'add', topicId })}>
              + Thêm từ
            </Button>
          )}
        </section>
      ) : (
        <WordTable
          label={`Từ trong chủ đề ${topic.name}`}
          page={words.data}
          stale={words.isPlaceholderData}
          term={filters.q}
          onPageChange={(page) => setFilters({ page: String(page) })}
          onEdit={(word) => setWordTarget({ mode: 'edit', word })}
          onDelete={setDeletingWord}
        />
      )}

      <WordDrawer target={wordTarget} topics={topics.data} onClose={() => setWordTarget(null)} onOpenWord={(word) => setWordTarget({ mode: 'edit', word })} />
      <DeleteWordDialog word={deletingWord} onClose={() => setDeletingWord(null)} />
      <TopicDialog target={editingTopic} topics={topics.data} onClose={() => setEditingTopic(null)} />
    </AdminPage>
  )
}

function WordsSkeleton({ inline = false }) {
  return (
    <div aria-hidden="true" className={inline ? 'animate-fade-in-late' : 'mx-auto flex w-full max-w-400 animate-fade-in-late flex-col gap-5'}>
      {!inline && <Skeleton className="h-8 w-60" />}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
