import { useEffect, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Switch } from '@/components/ui/Switch'
import { useCompleteAttempt } from '../api/exercisesQueries'
import { AnswerFeedback } from '../components/AnswerFeedback'
import { ChoiceOptions } from '../components/ChoiceOptions'
import { ExerciseHeading } from '../components/ExerciseHeading'
import { ResultCard } from '../components/ResultCard'
import { ScoreRing } from '../components/ScoreRing'
import { activeSegmentId } from '../time'
import { AudioPlayer } from './AudioPlayer'
import { Transcript } from './Transcript'

function isAnswered(question, answer) {
  if (!answer) return false
  return question.type === 'FILL_BLANK' ? answer.answer.trim().length > 0 : answer.optionId !== null
}

function toResponse(question, answer) {
  return question.type === 'FILL_BLANK'
    ? { questionId: question.id, answer: answer.answer.trim() }
    : { questionId: question.id, optionId: answer.optionId }
}

/**
 * B2, listening: the player with speed control and optional subtitles, and the questions beside it (below on narrow
 * screens). Questions can be answered before the audio ends (exception of B2). The whole test is handed in at once;
 * the server grades it and returns the right answers and the translation of each segment to compare with.
 *
 * @param {object} props see GrammarExercise
 */
export function ListeningExercise({ lesson, attemptId, nextLesson, onRestart, restarting, restartError, onChatContext, onAskAssistant }) {
  const { passage, questions } = lesson
  const [rate, setRate] = useState(1)
  const [position, setPosition] = useState(0)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)
  const [answers, setAnswers] = useState(() => new Map()) // questionId -> { optionId, answer }
  const [missing, setMissing] = useState(0)
  const complete = useCompleteAttempt(attemptId)
  const player = useRef(null)
  const resultArea = useRef(null)

  const result = complete.data ?? null
  const review = new Map(result?.review.map((item) => [item.questionId, item]) ?? [])
  const translations = result && showTranslation ? new Map(result.translations.map((item) => [item.segmentId, item.translation])) : null

  useEffect(() => {
    if (complete.isSuccess) resultArea.current?.querySelector('h2')?.focus()
  }, [complete.isSuccess])

  function answer(question, patch) {
    setAnswers((previous) => new Map(previous).set(question.id, { optionId: null, answer: '', ...patch }))
    setMissing(0)
  }

  function submit(event) {
    event.preventDefault()
    const unanswered = questions.filter((question) => !isAnswered(question, answers.get(question.id))).length
    if (unanswered > 0) {
      setMissing(unanswered)
      return
    }
    complete.mutate(
      { responses: questions.map((question) => toResponse(question, answers.get(question.id))), playbackRate: rate },
      // After hand-in the transcript and its translation are the point: show them.
      { onSuccess: () => setShowSubtitles(true) },
    )
  }

  return (
    <Page title={lesson.title} width="medium" className="pb-20" heading={<ExerciseHeading skill={lesson.skill} title={lesson.title} />}>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-label="Bài nghe"
          className="flex flex-col gap-3.5 rounded-xl border border-line bg-surface-alt p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
        >
          <AudioPlayer
            ref={player}
            src={passage.audioUrl}
            durationMs={passage.durationMs}
            rate={rate}
            onRateChange={setRate}
            onPosition={setPosition}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5">
            <span className="text-label font-medium text-ink-soft">Bản chép lời</span>
            <div className="flex flex-wrap gap-4">
              <Switch label="Hiện phụ đề" checked={showSubtitles} onChange={setShowSubtitles} />
              {result && showSubtitles && <Switch label="Hiện bản dịch" checked={showTranslation} onChange={setShowTranslation} />}
            </div>
          </div>
          {showSubtitles ? (
            <Transcript
              segments={passage.segments}
              activeId={activeSegmentId(passage.segments, position)}
              translations={translations}
              onPlayFrom={(ms) => player.current?.playFrom(ms)}
            />
          ) : (
            <p className="text-label text-muted">
              Nghe trước, bật phụ đề khi cần đọc theo. Bạn có thể trả lời câu hỏi bất cứ lúc nào, kể cả khi chưa nghe hết.
            </p>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <div ref={resultArea}>
            {result && (
              <ResultCard
                skill={lesson.skill}
                ring={
                  <ScoreRing
                    fraction={result.questionCount ? result.correctCount / result.questionCount : 0}
                    label={`Đúng ${result.correctCount} trên ${result.questionCount} câu`}
                  >
                    {result.correctCount}/{result.questionCount}
                  </ScoreRing>
                }
                title="Hoàn thành bài nghe"
                details={`Điểm ${result.scorePercent}% · Cao nhất ${result.bestScorePercent}%`}
                isPersonalBest={result.isPersonalBest}
                nextLesson={nextLesson}
                onRestart={onRestart}
                restarting={restarting}
                restartError={restartError}
              />
            )}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <ol className="flex flex-col gap-6">
              {questions.map((question, number) => {
                const given = answers.get(question.id)
                const graded = review.get(question.id)
                return (
                  <li key={question.id} className="flex flex-col gap-3">
                    <p className="text-base leading-normal font-semibold text-ink">
                      <span className="text-muted">{number + 1}. </span>
                      <span lang="en">{question.prompt}</span>
                    </p>
                    {question.type === 'FILL_BLANK' ? (
                      <TextField
                        label="Đáp án của bạn"
                        placeholder="Nhập câu trả lời"
                        autoComplete="off"
                        spellCheck={false}
                        lang="en"
                        maxLength={200}
                        value={given?.answer ?? ''}
                        disabled={Boolean(result)}
                        onChange={(event) => answer(question, { answer: event.target.value })}
                      />
                    ) : (
                      <ChoiceOptions
                        name={`question-${question.id}`}
                        label={question.prompt}
                        options={question.options}
                        selectedId={given?.optionId ?? null}
                        onSelect={(optionId) => answer(question, { optionId })}
                        graded={graded ?? null}
                      />
                    )}
                    {graded && (
                      <AnswerFeedback correct={graded.correct} correctAnswer={graded.correctAnswer} explanation={graded.explanation}>
                        <button
                          type="button"
                          onClick={() => {
                            onChatContext({ questionId: question.id })
                            onAskAssistant()
                          }}
                          className="cursor-pointer self-start text-label font-semibold text-brand-dark hover:text-brand"
                        >
                          Hỏi trợ lý AI về câu này →
                        </button>
                      </AnswerFeedback>
                    )}
                  </li>
                )
              })}
            </ol>

            {!result && (
              <>
                {missing > 0 && <Alert variant="error">Bạn còn {missing} câu chưa trả lời.</Alert>}
                {complete.isError && <Alert variant="error">{describeApiError(complete.error, 'Chưa nộp được bài. Hãy thử lại.')}</Alert>}
                <Button type="submit" loading={complete.isPending}>
                  Nộp bài
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </Page>
  )
}
