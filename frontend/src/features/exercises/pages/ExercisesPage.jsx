import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Tag } from '@/components/ui/Tag'
import { CEFR_LEVELS } from '@/api/constants'
import { useAuth } from '@/features/auth/context/useAuth'
import { useLessons } from '../api/exercisesQueries'
import { ChatAssistant } from '../chat/ChatAssistant'
import { LessonCard, LessonCardSkeleton } from '../components/LessonCard'
import { SkillTabs } from '../components/SkillTabs'
import { LEVEL_NAMES, SKILL_INFO, skillFromParam } from '../constants'

/** Lessons grouped by CEFR level, easiest first ("cơ bản đến nâng cao" of B1). The server already sorts them. */
function groupByLevel(lessons) {
  return CEFR_LEVELS.map((level) => ({ level, lessons: lessons.filter((lesson) => lesson.cefrLevel === level) })).filter(
    (group) => group.lessons.length > 0,
  )
}

// One column per level, left to right like a learning path. auto-fit stretches the columns over the whole width when
// there are few levels, so wide screens are not left half empty; narrow screens stack the levels.
const LEVEL_COLUMNS = 'grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] items-start gap-x-4 gap-y-6'

function LessonList({ skill }) {
  const { user } = useAuth()
  const lessons = useLessons(skill)

  if (lessons.isPending) {
    return (
      <div aria-label="Đang tải bài tập" aria-busy="true" className={LEVEL_COLUMNS}>
        {[0, 1, 2].map((key) => (
          <LessonCardSkeleton key={key} />
        ))}
      </div>
    )
  }
  if (lessons.isError) {
    return <LoadError error={lessons.error} onRetry={() => lessons.refetch()} message="Không tải được danh sách bài tập." />
  }
  if (lessons.data.length === 0) {
    return (
      <Card className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-ink">Chưa có bài tập</h2>
        <p className="text-sm text-muted">Kỹ năng này chưa có bài nào. Hãy quay lại sau nhé.</p>
      </Card>
    )
  }

  return (
    <div className={LEVEL_COLUMNS}>
      {groupByLevel(lessons.data).map(({ level, lessons: group }) => (
        <section key={level} aria-labelledby={`level-${level}`} className="flex flex-col gap-3">
          <h2 id={`level-${level}`} className="flex min-h-6 flex-wrap items-center gap-2 text-sm font-semibold text-ink-soft">
            <span>
              {level} · {LEVEL_NAMES[level]}
            </span>
            {user.currentLevel === level && <Tag variant="brand">Trình độ của bạn</Tag>}
          </h2>
          <ul className="flex flex-col gap-3">
            {group.map((lesson) => (
              <li key={lesson.id}>
                <LessonCard lesson={lesson} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** "Đã hoàn thành 2 / 4 bài" under the title, or nothing while unknown. */
function useCompletionSummary(skill) {
  const { data } = useLessons(skill)
  if (!data?.length) return null
  const done = data.filter((lesson) => lesson.progress.attemptCount > 0).length
  return `Đã hoàn thành ${done} / ${data.length} ${SKILL_INFO[skill].lessons}`
}

/**
 * /exercises: the lessons of one skill (?skill=grammar|listening|pronunciation, grammar by default) with the learner's
 * best scores. The AI assistant is available here too, for general questions.
 */
export function ExercisesPage() {
  const [searchParams] = useSearchParams()
  const skill = skillFromParam(searchParams.get('skill'))
  const summary = useCompletionSummary(skill)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <Page
      title={SKILL_INFO[skill].title}
      className="pb-20"
      heading={
        <div>
          <h1 className="text-title font-bold text-ink">Bài tập</h1>
          {summary && <p className="text-label text-muted">{summary}</p>}
        </div>
      }
    >
      <SkillTabs current={skill} />
      <LessonList key={skill} skill={skill} />
      <ChatAssistant open={chatOpen} onOpenChange={setChatOpen} />
    </Page>
  )
}
