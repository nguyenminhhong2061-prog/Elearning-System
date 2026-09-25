import { Link, useLocation, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx } from '@/lib/cx'
import { useTopic, useTopicWords } from '../api/queries'
import { WordList, WordListSkeleton } from '../components/WordList'
import { studyableCount } from '../constants'
import { backLinkTarget, parseId } from '../routeParams'
import { formatCount } from '../topicProgress'

function BackLink({ to }) {
  return (
    <Link to={to} className="self-start text-label font-medium">
      ← Chủ đề
    </Link>
  )
}

// Full width under the title on small screens (as in the design), beside the title on large ones.
const ACTION_WIDTH = 'w-full lg:w-auto lg:min-w-80 lg:max-w-100'

/** The design's "Học 20 từ →": due words plus words never studied, at most one session's worth. */
function StudyAction({ topic }) {
  const count = studyableCount(topic)
  if (topic.wordCount === 0) return null
  if (count === 0) {
    return (
      <p className={cx(ACTION_WIDTH, 'rounded-lg border border-dashed border-line px-4 py-3 text-label text-muted')}>
        Bạn đã học hết chủ đề này. Các từ sẽ được nhắc ôn lại theo lịch.
      </p>
    )
  }
  return (
    <ButtonLink to={`/vocabulary/topics/${topic.id}/study`} className={ACTION_WIDTH}>
      Học {formatCount(count)} từ →
    </ButtonLink>
  )
}

function TopicWords({ words: query }) {
  if (query.isPending) return <WordListSkeleton />
  if (query.isError) {
    return (
      <LoadError error={query.error} onRetry={() => query.refetch()} message="Không tải được danh sách từ. Vui lòng thử lại." />
    )
  }

  const words = query.data.pages.flatMap((page) => page.items)
  const total = query.data.pages[0].totalItems
  if (total === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">Chủ đề này chưa có từ nào.</p>
      </Card>
    )
  }

  return (
    <>
      <WordList words={words} />
      {query.hasNextPage && (
        <Button variant="outline" className="sm:min-w-60 sm:self-center" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {query.isFetchingNextPage ? 'Đang tải…' : `Xem thêm từ (còn ${formatCount(total - words.length)})`}
        </Button>
      )}
    </>
  )
}

export function TopicDetailPage() {
  const params = useParams()
  const location = useLocation()
  const topicId = parseId(params.topicId)
  const backTo = backLinkTarget(location.state)

  const topicQuery = useTopic(topicId)
  const wordsQuery = useTopicWords(topicId)

  if (topicId === null || topicQuery.error?.status === 404) {
    return (
      <Page
        title="Không tìm thấy chủ đề"
        width="focus"
        heading={
          <div className="flex flex-col gap-2">
            <BackLink to={backTo} />
            <h1 className="text-2xl font-bold text-ink">Không tìm thấy chủ đề</h1>
          </div>
        }
      >
        <Card>
          <p className="text-sm text-muted">Chủ đề này không tồn tại hoặc đã bị xóa.</p>
        </Card>
      </Page>
    )
  }

  const topic = topicQuery.data

  return (
    <Page
      title={topic?.name ?? 'Chủ đề'}
      heading={
        <div className="flex flex-col gap-2">
          <BackLink to={backTo} />
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
              <StudyAction topic={topic} />
            </div>
          ) : (
            <>
              <h1 className="sr-only">Đang tải chủ đề</h1>
              <Skeleton className="h-8 w-56" />
            </>
          )}
        </div>
      }
    >
      {topicQuery.isError ? (
        <LoadError
          error={topicQuery.error}
          onRetry={() => {
            topicQuery.refetch()
            wordsQuery.refetch()
          }}
          message="Không tải được chủ đề. Vui lòng thử lại."
        />
      ) : (
        <TopicWords words={wordsQuery} />
      )}
    </Page>
  )
}
