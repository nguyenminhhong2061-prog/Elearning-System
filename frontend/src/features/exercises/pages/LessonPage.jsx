import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { parseId } from '@/features/vocabulary/routeParams'
import { useStudyTime } from '@/features/progress/useStudyTime'
import { useLesson, useLessons } from '../api/exercisesQueries'
import { ChatAssistant } from '../chat/ChatAssistant'
import { ExerciseHeading } from '../components/ExerciseHeading'
import { EXERCISES_PATH, SKILLS, skillPath } from '../constants'
import { GrammarExercise } from '../grammar/GrammarExercise'
import { ListeningExercise } from '../listening/ListeningExercise'
import { PronunciationExercise } from '../pronunciation/PronunciationExercise'
import { useAttempt } from '../useAttempt'

const EXERCISES = {
  [SKILLS.GRAMMAR]: GrammarExercise,
  [SKILLS.LISTENING]: ListeningExercise,
  [SKILLS.PRONUNCIATION]: PronunciationExercise,
}

/** What the AI assistant offers to ask before the first message, by skill. */
const CHAT_SUGGESTIONS = {
  [SKILLS.GRAMMAR]: ['Giải thích câu này giúp tôi', 'Cho tôi thêm ví dụ tương tự', 'Mẹo để nhớ cấu trúc này'],
  [SKILLS.LISTENING]: ['Giải thích đoạn hội thoại này', 'Những cụm từ nào đáng học trong bài?', 'Làm sao nghe tốt hơn?'],
  [SKILLS.PRONUNCIATION]: ['Làm sao phát âm từ này cho đúng?', 'Trọng âm của từ này ở đâu?', 'Tôi hay sai âm nào?'],
}

function contentSize(lesson) {
  if (lesson.skill === SKILLS.PRONUNCIATION) return lesson.pronunciationItems.length
  return lesson.questions.length
}

/** The lesson after this one in the list (same skill, server order), for "Bài tiếp theo". */
function nextLessonOf(lessons, lessonId) {
  if (!lessons) return null
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? (lessons[index + 1] ?? null) : null
}

function LessonNotFound() {
  return (
    <Page title="Không tìm thấy bài tập" width="focus">
      <Card className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted">Bài tập này không tồn tại hoặc chưa được mở.</p>
        <Link to={EXERCISES_PATH} className="text-label font-semibold">
          ← Về danh sách bài tập
        </Link>
      </Card>
    </Page>
  )
}

function LessonLoading() {
  return (
    <Page title="Bài tập" width="focus" heading={<h1 className="sr-only">Đang tải bài tập</h1>}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-64 rounded-xl" />
    </Page>
  )
}

function LessonPlayer({ lessonId }) {
  useStudyTime()
  const lesson = useLesson(lessonId)
  const attempt = useAttempt(lessonId)
  const siblings = useLessons(lesson.data?.skill ?? null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatContext, setChatContext] = useState({})

  if (lesson.error?.status === 404) return <LessonNotFound />
  if (lesson.isError) {
    // Opening a lesson loads it and opens an attempt at the same time; when both failed, one retry redoes both. Retrying
    // still picks up the unfinished attempt: a network error must not throw the learner's progress away.
    const retry = () => {
      lesson.refetch()
      if (attempt.attemptId === null && !attempt.starting) attempt.retry()
    }
    return (
      <Page title="Bài tập" width="focus">
        <LoadError error={lesson.error} onRetry={retry} message="Không tải được bài tập." />
      </Page>
    )
  }
  if (!lesson.data || (attempt.attemptId === null && attempt.starting)) return <LessonLoading />
  if (attempt.attemptId === null) {
    return (
      <Page title={lesson.data.title} width="focus">
        <LoadError error={attempt.error} onRetry={attempt.retry} message="Không bắt đầu được bài tập." />
      </Page>
    )
  }

  const data = lesson.data
  if (contentSize(data) === 0) {
    // Exception of B1: a lesson without questions (the server should not list it, but a direct link can reach it).
    return (
      <Page title={data.title} width="focus" heading={<ExerciseHeading skill={data.skill} title={data.title} />}>
        <Card className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted">Bài này chưa có câu hỏi nào. Hãy chọn bài khác nhé.</p>
          <Link to={skillPath(data.skill)} className="text-label font-semibold">
            ← Về danh sách
          </Link>
        </Card>
      </Page>
    )
  }

  const Exercise = EXERCISES[data.skill]
  return (
    <>
      <Exercise
        key={attempt.round}
        lesson={data}
        attemptId={attempt.attemptId}
        progress={attempt.progress}
        nextLesson={nextLessonOf(siblings.data, lessonId)}
        onRestart={attempt.restart}
        restarting={attempt.starting}
        restartError={attempt.error}
        onChatContext={setChatContext}
        onAskAssistant={() => setChatOpen(true)}
      />
      <ChatAssistant
        open={chatOpen}
        onOpenChange={setChatOpen}
        lessonId={lessonId}
        attemptId={attempt.attemptId}
        questionId={chatContext.questionId ?? null}
        pronunciationItemId={chatContext.pronunciationItemId ?? null}
        contextLabel={chatContext.label ?? null}
        suggestions={CHAT_SUGGESTIONS[data.skill]}
      />
    </>
  )
}

/**
 * /exercises/lessons/:lessonId: one lesson of any skill. Opening it picks up the unfinished attempt (grammar,
 * pronunciation) or starts one; the screen then depends on the skill (grammar question by question, a listening test,
 * or pronunciation practice). Keyed by lesson so moving to "Bài tiếp theo" opens that lesson afresh.
 */
export function LessonPage() {
  const lessonId = parseId(useParams().lessonId)
  if (lessonId === null) return <LessonNotFound />
  return <LessonPlayer key={lessonId} lessonId={lessonId} />
}
