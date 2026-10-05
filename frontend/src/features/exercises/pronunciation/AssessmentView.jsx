import { scoreBand } from '../constants'
import { ScoreRing } from '../components/ScoreRing'

function WordErrors({ errors }) {
  return (
    <ul aria-label="Các từ OpenPronounce đánh dấu cần xem lại" className="flex w-full flex-col gap-2">
      {errors.map((error, index) => (
        <li key={`${error.word}-${index}`} className="rounded-lg bg-sidebar-raised px-4 py-3 text-left">
          <p lang="en" className="font-semibold text-sidebar-text">{error.word}</p>
          <p className="mt-1 text-sm text-muted-light">
            Âm dự kiến <span className="font-mono text-sidebar-text">/{error.expectedIpa}/</span>
            {' · '}nhận diện được{' '}
            <span className="font-mono text-sidebar-text">{error.heardIpa ? `/${error.heardIpa}/` : 'không nghe rõ'}</span>
          </p>
          {error.phones.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={`So sánh âm trong từ ${error.word}`}>
              {error.phones.filter((phone) => phone.expected !== phone.heard).map((phone, phoneIndex) => (
                <li key={`${phone.expected}-${phoneIndex}`} className="rounded bg-sidebar px-2 py-1 font-mono text-xs text-sidebar-text">
                  /{phone.expected}/ → {phone.heard ? `/${phone.heard}/` : '∅'}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-light">
            Mức tin cậy của cảnh báo: {Math.round(error.confidence)}%
          </p>
        </li>
      ))}
    </ul>
  )
}

/**
 * OpenPronounce result: its overall score, phoneme/word match rates, detected IPA differences and transcription.
 *
 * @param {{ assessment: import('../types').PronunciationAssessment }} props
 */
export function AssessmentView({ assessment }) {
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
        Khớp âm vị ≈{Math.round(assessment.phonemeAccuracyScore)}% · Khớp từ ≈{Math.round(assessment.wordAccuracyScore)}%
      </p>
      {assessment.recognizedText && (
        <p className="text-label text-muted-light">
          Máy nghe được: <span lang="en" className="text-sidebar-text">“{assessment.recognizedText}”</span>
        </p>
      )}
      {assessment.errors.length > 0 ? (
        <WordErrors errors={assessment.errors} />
      ) : (
        <p className="text-center text-label text-muted-light">Không phát hiện lỗi âm vị nổi bật trong bản ghi này.</p>
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
