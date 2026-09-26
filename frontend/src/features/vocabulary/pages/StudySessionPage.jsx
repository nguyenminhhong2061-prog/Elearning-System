import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useStudyTime } from '@/features/progress/useStudyTime'
import { useStudySession } from '../api/learningQueries'
import { parseId, VOCABULARY_PATH } from '../routeParams'
import { FlashcardSession } from '../study/FlashcardSession'

// The flashcard column: 520px as in the design, larger on big screens so the card does not look lost in the window.
const SESSION_WIDTH = '2xl:max-w-180'

// Where a session's cards come from, and where "back" leads. `param` names the id in the URL.
const MODES = {
  topic: { param: 'topicId', back: (id) => `/vocabulary/topics/${id}`, backLabel: 'Về chủ đề', title: 'Học chủ đề' },
  list: { param: 'listId', back: (id) => `/vocabulary/lists/${id}`, backLabel: 'Về danh sách', title: 'Học danh sách' },
  due: { param: null, back: () => VOCABULARY_PATH, backLabel: 'Về từ vựng', title: 'Ôn tập hôm nay' },
}

function Message({ title, backTo, backLabel, children }) {
  return (
    <Page title={title} width="focus">
      <Card className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted">{children}</p>
        <ButtonLink to={backTo} variant="outline" size="sm">
          ← {backLabel}
        </ButtonLink>
      </Card>
    </Page>
  )
}

/**
 * A flashcard session (A1, A2): mode "topic" and "list" study one topic or personal list, mode "due" reviews every
 * word due today.
 * @param {{ mode: 'topic' | 'list' | 'due' }} props
 */
export function StudySessionPage({ mode }) {
  useStudyTime()
  const config = MODES[mode]
  const params = useParams()
  const id = config.param ? parseId(params[config.param]) : null
  const invalid = config.param !== null && id === null
  const source = useMemo(() => (config.param ? { [config.param]: id } : {}), [config.param, id])
  const backTo = invalid ? VOCABULARY_PATH : config.back(id)

  // Bumped by "Học tiếp" to fetch a fresh session from the same source.
  const [round, setRound] = useState(0)
  const session = useStudySession(source, round, { enabled: !invalid })

  if (invalid || session.error?.status === 404) {
    return (
      <Message title="Không tìm thấy" backTo={VOCABULARY_PATH} backLabel="Về từ vựng">
        {mode === 'list' ? 'Danh sách này không tồn tại hoặc đã bị xóa.' : 'Chủ đề này không tồn tại hoặc đã bị xóa.'}
      </Message>
    )
  }

  if (session.isPending) {
    return (
      <Page
        title={config.title}
        width="focus"
        className={SESSION_WIDTH}
        heading={<h1 className="sr-only">Đang chuẩn bị phiên học</h1>}
      >
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-77 w-full rounded-2xl 2xl:h-100" />
      </Page>
    )
  }

  if (session.isError) {
    return (
      <Page title={config.title} width="focus">
        <LoadError error={session.error} onRetry={() => session.refetch()} message="Không tải được phiên học. Vui lòng thử lại." />
        <Link to={backTo} className="text-label font-medium">
          ← {config.backLabel}
        </Link>
      </Page>
    )
  }

  const { cards, source: origin } = session.data
  const title = origin.name ? `${config.title}: ${origin.name}` : config.title

  if (cards.length === 0) {
    return (
      <Message title={title} backTo={backTo} backLabel={config.backLabel}>
        {mode === 'due'
          ? 'Hôm nay bạn không có từ nào cần ôn. Hãy quay lại vào ngày mai nhé!'
          : `Không còn từ mới hay từ đến hạn ôn trong ${mode === 'list' ? 'danh sách' : 'chủ đề'} “${origin.name}”. Các từ đã học sẽ được nhắc lại theo lịch ôn.`}
      </Message>
    )
  }

  return (
    <Page title={title} width="focus" className={SESSION_WIDTH} heading={<h1 className="sr-only">{title}</h1>}>
      <FlashcardSession
        key={`${JSON.stringify(source)}:${round}`}
        cards={cards}
        backTo={backTo}
        backLabel={config.backLabel}
        onContinue={() => setRound((previous) => previous + 1)}
      />
    </Page>
  )
}
