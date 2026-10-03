import { useLocation, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/paths'
import { formatCount } from '@/lib/format'
import { parseId } from '@/lib/routeParams'
import { useTopic } from '../api/vocabularyQueries'
import { StudyButton } from '../components/StudyButton'
import { TopicWords } from '../components/topics/TopicWords'
import { backLinkTarget } from '../utils/backLink'
import { studyableCount } from '../utils/learning'

/** Name, description and progress of the topic, with its study button; a placeholder while it loads. */
function TopicHeading({ topic, backTo }) {
  return (
    <div className="flex flex-col gap-2">
      <BackLink to={backTo}>Chủ đề</BackLink>
      {topic ? (
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl font-bold text-ink">
              {topic.name} · {formatCount(topic.wordCount)} từ
            </h1>
            {topic.description && <p className="text-sm text-muted">{topic.description}</p>}
            {topic.wordCount > 0 && (
              <p className="text-label text-muted">
                Đã học {formatCount(topic.learnedCount)} / {formatCount(topic.wordCount)} từ
              </p>
            )}
          </div>
          <StudyButton
            counts={topic}
            to={paths.topicStudy(topic.id)}
            finishedMessage="Bạn đã học hết chủ đề này. Các từ sẽ được nhắc ôn lại theo lịch."
          >
            Học {formatCount(studyableCount(topic))} từ →
          </StudyButton>
        </div>
      ) : (
        <>
          <h1 className="sr-only">Đang tải chủ đề</h1>
          <Skeleton className="h-8 w-56" />
        </>
      )}
    </div>
  )
}

/** /vocabulary/topics/:topicId: the words of one topic (A1), and the way into studying them. */
export function TopicDetailPage() {
  // 1. What the URL asks for.
  const topicId = parseId(useParams().topicId)
  const backTo = backLinkTarget(useLocation().state)

  // 2. The data. The topic's words are loaded by <TopicWords> itself, at the same time.
  const topicQuery = useTopic(topicId)

  // 3. One state at a time: not found, error, then the page (the heading shows a placeholder while loading).
  if (topicId === null || topicQuery.error?.status === 404) {
    return (
      <Page
        title="Không tìm thấy chủ đề"
        width="focus"
        heading={
          <div className="flex flex-col gap-2">
            <BackLink to={backTo}>Chủ đề</BackLink>
            <h1 className="text-2xl font-bold text-ink">Không tìm thấy chủ đề</h1>
          </div>
        }
      >
        <EmptyState>Chủ đề này không tồn tại hoặc đã bị xóa.</EmptyState>
      </Page>
    )
  }

  const topic = topicQuery.data
  return (
    <Page title={topic?.name ?? 'Chủ đề'} heading={<TopicHeading topic={topic} backTo={backTo} />}>
      {topicQuery.isError ? (
        <LoadError error={topicQuery.error} onRetry={() => topicQuery.refetch()} message="Không tải được chủ đề. Vui lòng thử lại." />
      ) : (
        <TopicWords topicId={topicId} />
      )}
    </Page>
  )
}
