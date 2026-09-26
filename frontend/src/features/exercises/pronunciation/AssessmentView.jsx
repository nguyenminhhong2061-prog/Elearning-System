import { cx } from '@/lib/cx'
import { scoreBand } from '../constants'
import { ScoreRing } from '../components/ScoreRing'

// Word colours on the dark card; the design's green, orange and red reach at least 4.5:1 on it.
const WORD_TONE = { good: 'text-success-solid', fair: 'text-warning-solid', poor: 'text-danger-solid' }

const ERROR_TEXT = {
  MISPRONUNCIATION: 'đọc chưa chuẩn',
  OMISSION: 'bị bỏ sót',
  INSERTION: 'đọc thừa',
}

/** The words of the sample, coloured by score; wrong ones are also underlined or struck through (not colour only). */
function WordScores({ words }) {
  return (
    <p lang="en" className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-lg font-semibold">
      {words.map((word, index) => {
        const problem = word.errorType !== 'NONE'
        return (
          <span
            key={`${word.word}-${index}`}
            title={`${Math.round(word.accuracyScore)} điểm`}
            className={cx(
              WORD_TONE[scoreBand(word.accuracyScore)],
              word.errorType === 'OMISSION' && 'line-through opacity-80',
              (word.errorType === 'MISPRONUNCIATION' || word.errorType === 'INSERTION') && 'underline decoration-wavy underline-offset-4',
            )}
          >
            {word.word}
            <span className="sr-only">
              {` (${Math.round(word.accuracyScore)} điểm${problem ? `, ${ERROR_TEXT[word.errorType] ?? 'chưa chuẩn'}` : ''})`}
            </span>
          </span>
        )
      })}
    </p>
  )
}

/**
 * Result of one recording on the design's dark card: the score ring, the three sub-scores, the words coloured by how
 * well they were said, what the machine heard, and the tips (B3: "chấm điểm và gợi ý cải thiện").
 *
 * @param {{ assessment: import('../types').PronunciationAssessment, showWords: boolean }} props
 */
export function AssessmentView({ assessment, showWords }) {
  const overall = Math.round(assessment.overallScore)

  return (
    <div className="flex w-full flex-col items-center gap-3.5">
      <ScoreRing
        size="md"
        dark
        tone={scoreBand(overall)}
        fraction={overall / 100}
        label={`Điểm phát âm ${overall} trên 100`}
      >
        {overall}
      </ScoreRing>
      <p className="text-label text-muted-light">
        Chính xác {Math.round(assessment.accuracyScore)} · Trôi chảy {Math.round(assessment.fluencyScore)} · Đầy đủ{' '}
        {Math.round(assessment.completenessScore)}
      </p>
      {showWords && assessment.words.length > 0 && <WordScores words={assessment.words} />}
      {assessment.recognizedText && (
        <p className="text-label text-muted-light">
          Máy nghe được: <span lang="en" className="text-sidebar-text">“{assessment.recognizedText}”</span>
        </p>
      )}
      {assessment.tips.length > 0 && (
        <ul className="flex w-full flex-col gap-1.5 rounded-lg bg-sidebar-raised px-4 py-3 text-left text-label text-sidebar-text">
          {assessment.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden="true" className="text-brand">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
