import { useState } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { SearchField } from '@/components/ui/SearchField'
import { Skeleton } from '@/components/ui/Skeleton'
import { TabLinks } from '@/components/ui/TabLinks'
import { Tag } from '@/components/ui/Tag'
import { CEFR_LEVELS } from '@/api/constants'
import { paths } from '@/config/paths'
import { matchesSearch } from '@/lib/searchText'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { useAdminLessons } from '../api/lessonsQueries'
import { AdminPage } from '../components/AdminPage'
import { InlineSelect, LevelTag, RowAction, Segmented, TABLE, TableCard, TD, TH } from '../components/controls'
import { DeleteLessonDialog } from '../components/lessons/DeleteLessonDialog'
import { DIFFICULTY_LABELS, LESSON_SKILLS, SKILL_LABELS } from '../constants'
import { formatFullDate, levelOptions } from '../utils/format'
import { useUrlFilters } from '../hooks/useUrlFilters'

const STATUS = {
  PUBLISHED: { label: 'Đã xuất bản', variant: 'success' },
  DRAFT: { label: 'Nháp', variant: 'neutral' },
  HIDDEN: { label: 'Lưu trữ', variant: 'warning' },
}
const STATUS_OPTIONS = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'HIDDEN', label: 'Lưu trữ' },
]
const ISSUES = { MISSING_AUDIO: 'Thiếu file audio', INCOMPLETE_ITEMS: 'Câu mẫu thiếu IPA hoặc âm thanh', NO_QUESTIONS: 'Chưa có câu hỏi' }

/** "Nội dung" column (scenario 23, step 2): questions, and the passages of a reading lesson. */
function contentOf(lesson) {
  if (lesson.skill === 'PRONUNCIATION') return `${lesson.itemCount} câu mẫu`
  if (lesson.skill === 'WRITING') return `${lesson.questionCount} câu viết`
  const parts = [`${lesson.questionCount} câu hỏi`]
  if (lesson.skill === 'READING') parts.push(`${lesson.passageCount} bài đọc`)
  if (lesson.skill === 'LISTENING') parts.push(`${lesson.segmentCount} đoạn phụ đề`)
  return parts.join(' · ')
}

/** Scenario 23, step 2 and branch 2b: every lesson of module B, filtered on the page (the list is small). */
export function AdminLessonsPage() {
  const [filters, setFilters] = useUrlFilters({ skill: '', status: '', level: '', q: '' })
  const lessons = useAdminLessons()
  const [deleting, setDeleting] = useState(null)
  const all = lessons.data ?? []

  const inSkill = all.filter((lesson) => !filters.skill || lesson.skill === filters.skill)
  const shown = inSkill
    .filter((lesson) => (!filters.status || lesson.status === filters.status) && (!filters.level || lesson.cefrLevel === filters.level) && matchesSearch(lesson.title, filters.q))
    .toSorted((a, b) => LESSON_SKILLS.indexOf(a.skill) - LESSON_SKILLS.indexOf(b.skill) || CEFR_LEVELS.indexOf(a.cefrLevel) - CEFR_LEVELS.indexOf(b.cefrLevel) || a.id - b.id)

  const published = all.filter((lesson) => lesson.status === 'PUBLISHED').length
  const drafts = all.filter((lesson) => lesson.status === 'DRAFT').length
  const tabTo = (skill) => {
    const params = new URLSearchParams()
    if (skill) params.set('skill', skill)
    for (const key of ['status', 'level', 'q']) if (filters[key]) params.set(key, filters[key])
    const query = params.toString()
    return query ? `?${query}` : paths.adminLessons
  }

  return (
    <AdminPage
      title="Bài tập"
      section="Nội dung học"
      summary={lessons.data ? `${published} bài đã xuất bản · ${drafts} bản nháp` : ' '}
      actions={
        <ButtonLink to={paths.adminNewLesson(filters.skill || 'READING')} variant="strong" size="xs">
          + Tạo bài tập
        </ButtonLink>
      }
    >
      <TabLinks
        label="Kỹ năng"
        current={filters.skill || 'ALL'}
        tabs={[
          { id: 'ALL', label: `Tất cả (${all.length})`, to: tabTo('') },
          ...LESSON_SKILLS.map((skill) => ({ id: skill, label: `${SKILL_LABELS[skill]} (${all.filter((lesson) => lesson.skill === skill).length})`, to: tabTo(skill) })),
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Trạng thái" size="sm" options={STATUS_OPTIONS} value={filters.status} onChange={(status) => setFilters({ status })} />
        <InlineSelect label="Trình độ" value={filters.level} onChange={(level) => setFilters({ level })} options={levelOptions()} />
        <SearchField
          label="Tìm bài tập"
          placeholder="Tìm theo tên bài"
          value={filters.q}
          onChange={(event) => setFilters({ q: event.target.value })}
          onClear={() => setFilters({ q: '' })}
          className="w-full sm:w-72 xl:ml-auto"
        />
      </div>

      {lessons.isPending ? (
        <div aria-hidden="true" className="flex animate-fade-in-late flex-col gap-3 rounded-xl border border-line bg-white p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : lessons.isError ? (
        <LoadError error={lessons.error} onRetry={lessons.refetch} message="Không tải được danh sách bài tập. Vui lòng thử lại." />
      ) : shown.length === 0 ? (
        <p role="status" className="rounded-xl border border-line bg-white px-6 py-10 text-center text-sm text-ink-soft">
          {inSkill.length === 0 ? 'Chưa có bài tập nào.' : 'Không có bài tập phù hợp với bộ lọc.'}
        </p>
      ) : (
        <TableCard label="Danh sách bài tập">
          <table className={cx(TABLE, 'min-w-250')}>
            <thead className="bg-surface-alt">
              <tr>
                <th scope="col" className={TH}>Bài tập</th>
                <th scope="col" className={TH}>Kỹ năng</th>
                <th scope="col" className={TH}>Trình độ</th>
                <th scope="col" className={TH}>Độ khó</th>
                <th scope="col" className={TH}>Nội dung</th>
                <th scope="col" className={TH}>Trạng thái</th>
                <th scope="col" className={cx(TH, 'text-right')}>Lượt làm</th>
                <th scope="col" className={TH}>Cập nhật</th>
                <th scope="col" className={cx(TH, 'text-right')}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((lesson) => (
                <tr key={lesson.id}>
                  <td className={cx(TD, 'py-3')}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={paths.adminLesson(lesson.id)} className="text-sm font-semibold">
                        {lesson.title}
                      </Link>
                      {lesson.issues.map((issue) => (
                        <Tag key={issue} variant={issue === 'NO_QUESTIONS' ? 'warning' : 'danger'}>
                          {ISSUES[issue]}
                        </Tag>
                      ))}
                    </div>
                  </td>
                  <td className={TD}>{SKILL_LABELS[lesson.skill]}</td>
                  <td className={TD}>
                    <LevelTag level={lesson.cefrLevel} />
                  </td>
                  <td className={TD}>{DIFFICULTY_LABELS[lesson.difficulty]}</td>
                  <td className={cx(TD, 'text-ink-soft')}>{contentOf(lesson)}</td>
                  <td className={TD}>
                    <Tag variant={STATUS[lesson.status].variant}>{STATUS[lesson.status].label}</Tag>
                  </td>
                  <td className={cx(TD, 'text-right')}>{formatCount(lesson.attempts)}</td>
                  <td className={cx(TD, 'text-muted-strong')}>{lesson.updatedAt ? formatFullDate(lesson.updatedAt) : '—'}</td>
                  <td className={cx(TD, 'text-right whitespace-nowrap')}>
                    <Link to={paths.adminLesson(lesson.id)} aria-label={`Sửa bài ${lesson.title}`} className="inline-block px-2.5 py-1.5 text-label font-bold">
                      Sửa
                    </Link>
                    <RowAction tone="danger" onClick={() => setDeleting(lesson)} aria-label={`Xóa bài ${lesson.title}`}>
                      Xóa
                    </RowAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      <DeleteLessonDialog lesson={deleting} onClose={() => setDeleting(null)} />
    </AdminPage>
  )
}
