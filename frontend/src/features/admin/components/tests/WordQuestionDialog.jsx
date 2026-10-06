import { useDeferredValue, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SearchField } from '@/components/ui/SearchField'
import { Spinner } from '@/components/ui/Spinner'
import { useWordQuestion } from '../../api/testsQueries'
import { useAdminTopics, useAdminWords } from '../../api/vocabularyQueries'
import { LevelTag } from '../controls'

/**
 * Scenario 24, step 6: "Thêm câu hỏi từ kho từ vựng". The admin finds a word and the server makes a multiple-choice
 * question from it (the word is the answer, three words of its topic are the wrong choices); the question joins the
 * test linked to the word, and is saved with it.
 *
 * @param {{ open: boolean, onClose: () => void, onAdd: (question: import('../../types').AdminTestQuestion) => void }} props
 */
export function WordQuestionDialog({ open, onClose, onAdd }) {
  return (
    <Dialog open={open} onClose={onClose} title="Thêm câu hỏi từ kho từ vựng">
      {open && <WordPicker onClose={onClose} onAdd={onAdd} />}
    </Dialog>
  )
}

function WordPicker({ onClose, onAdd }) {
  const [text, setText] = useState('')
  const term = useDeferredValue(text.trim())
  const words = useAdminWords({ q: term, page: 0, size: 8 }, { enabled: term.length > 0 })
  const topics = useAdminTopics()
  const make = useWordQuestion()
  const topicName = (id) => topics.data?.find((topic) => topic.id === id)?.name ?? 'Chưa có chủ đề'

  function choose(word) {
    make.mutate(word.id, {
      onSuccess: (question) => {
        onAdd(question)
        onClose()
      },
    })
  }

  const problem =
    make.isError &&
    (make.error?.status === 422
      ? 'Chủ đề của từ này cần ít nhất 3 từ khác để làm lựa chọn nhiễu. Chọn từ khác hoặc thêm từ vào chủ đề.'
      : describeApiError(make.error, 'Chưa tạo được câu hỏi. Vui lòng thử lại.'))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-5.5 text-ink-soft">
        Hệ thống tạo sẵn một câu trắc nghiệm: đáp án là từ đã chọn, ba lựa chọn nhiễu lấy từ các từ khác cùng chủ đề. Bạn sửa được câu sau khi thêm.
      </p>
      <SearchField label="Tìm từ" placeholder="Tìm theo từ hoặc nghĩa" value={text} onChange={(event) => setText(event.target.value)} onClear={() => setText('')} />
      {term.length > 0 &&
        (words.isPending ? (
          <Spinner label="Đang tìm từ…" />
        ) : words.isError ? (
          <Alert variant="error">{describeApiError(words.error, 'Không tìm được từ. Vui lòng thử lại.')}</Alert>
        ) : words.data.items.length === 0 ? (
          <p role="status" className="text-sm text-ink-soft">
            Không có từ nào khớp với “{term}”.
          </p>
        ) : (
          <ul aria-label="Kết quả tìm từ" className="flex max-h-72 flex-col overflow-y-auto rounded-[10px] border border-line">
            {words.data.items.map((word) => (
              <li key={word.id} className="flex items-center gap-3 border-b border-canvas px-3.5 py-2.5 last:border-b-0">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm">
                    <strong lang="en" className="text-ink">
                      {word.word}
                    </strong>{' '}
                    <span className="text-ink-soft">— {word.meaning}</span>
                  </span>
                  <span className="text-xs text-muted-strong">{topicName(word.topicId)}</span>
                </div>
                <LevelTag level={word.difficultyLevel} />
                <Button variant="outlineBrand" size="xs" loading={make.isPending && make.variables === word.id} onClick={() => choose(word)} aria-label={`Chọn “${word.word}”`}>
                  Chọn
                </Button>
              </li>
            ))}
          </ul>
        ))}
      {problem && <Alert variant="error">{problem}</Alert>}
      <div className="flex justify-end">
        <Button variant="outline" size="xs" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  )
}
