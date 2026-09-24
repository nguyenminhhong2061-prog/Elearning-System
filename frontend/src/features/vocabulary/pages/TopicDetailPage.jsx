import { Link, useLocation, useParams } from 'react-router'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTopic, useTopicWords } from '../api/queries'
import { WordList, WordListSkeleton } from '../components/WordList'
import { formatCount } from '../topicProgress'

const TOPICS_PATH = '/vocabulary'

/** The id from the URL, or null when it is not a positive whole number (then nothing is fetched). */
function parseTopicId(raw) {
  if (!/^\d{1,15}$/.test(raw ?? '')) return null
  const id = Number(raw)
  return id > 0 ? id : null
}

/** Back to the topics page, keeping its search when the user came from one. */
function backLinkTarget(state) {
  const candidate = state?.backTo
  return typeof candidate === 'string' && candidate.startsWith(`${TOPICS_PATH}?`) ? candidate : TOPICS_PATH
}

function BackLink({ to }) {
  return (
    <Link to={to} className="self-start text-label font-medium">
      ← Chủ đề
    </Link>
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
        <Button variant="outline" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {query.isFetchingNextPage ? 'Đang tải…' : `Xem thêm từ (còn ${formatCount(total - words.length)})`}
        </Button>
      )}
    </>
  )
}

export function TopicDetailPage() {
  const params = useParams()
  const location = useLocation()
  const topicId = parseTopicId(params.topicId)
  const backTo = backLinkTarget(location.state)

  const topicQuery = useTopic(topicId)
  const wordsQuery = useTopicWords(topicId)

  if (topicId === null || topicQuery.error?.status === 404) {
    return (
      <Page
        title="Không tìm thấy chủ đề"
        width="narrow"
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
      width="narrow"
      heading={
        <div className="flex flex-col gap-2">
          <BackLink to={backTo} />
          {topic ? (
            <>
              <h1 className="text-2xl font-bold text-ink">
                {topic.name} · {formatCount(topic.wordCount)} từ
              </h1>
              {topic.description && <p className="text-sm text-muted">{topic.description}</p>}
              {topic.wordCount > 0 && (
                <p className="text-label text-muted">
                  Đã học {formatCount(topic.learnedCount)} / {formatCount(topic.wordCount)} từ
                </p>
              )}
            </>
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
