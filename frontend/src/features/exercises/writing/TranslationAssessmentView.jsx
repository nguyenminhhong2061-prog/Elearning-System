/** Detailed rubric feedback for an English-to-Vietnamese paragraph translation. */
export function TranslationAssessmentView({ assessment }) {
  if (!assessment) return null
  return (
    <section aria-label="Đánh giá bản dịch" className="flex flex-col gap-3 border-t border-current/15 pt-3">
      <p className="font-semibold">Đánh giá theo tiêu chí · {assessment.level}</p>
      <ul className="flex flex-col gap-2">
        {assessment.criteria.map((criterion) => (
          <li key={criterion.name} className="rounded-lg bg-white/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold">{criterion.name}</span>
              <span className="shrink-0 font-semibold">{criterion.scorePercent}/100</span>
            </div>
            <p className="mt-1 leading-relaxed text-ink-soft">{criterion.comment}</p>
          </li>
        ))}
      </ul>

      <div>
        <p className="font-semibold">Bản dịch gợi ý</p>
        <p lang="vi" className="mt-1 whitespace-pre-line rounded-lg bg-white/60 p-3 leading-relaxed text-ink">
          {assessment.suggestedTranslation}
        </p>
      </div>

      {assessment.suggestions?.length > 0 && (
        <div>
          <p className="font-semibold">Gợi ý cải thiện</p>
          <ol className="list-decimal space-y-1 pl-5 pt-1 text-ink">
            {assessment.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>{suggestion}</li>)}
          </ol>
        </div>
      )}

      {assessment.errors?.length > 0 ? (
        <div>
          <p className="font-semibold">Các lỗi cần chú ý</p>
          <ul className="mt-1 flex flex-col gap-2">
            {assessment.errors.map((error, index) => (
              <li key={`${index}-${error.sourcePhrase}`} className="rounded-lg bg-white/60 p-3">
                {error.sourcePhrase && <p className="text-xs font-semibold text-muted">Ý trong câu gốc: {error.sourcePhrase}</p>}
                <p lang="vi" className="mt-1"><span className="font-semibold">Bạn viết: </span>{error.learnerVersion}</p>
                <p lang="vi"><span className="font-semibold">Có thể sửa: </span>{error.correction}</p>
                <p className="mt-1 leading-relaxed text-ink-soft">{error.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Không phát hiện lỗi đáng kể trong bài làm.</p>
      )}
    </section>
  )
}
