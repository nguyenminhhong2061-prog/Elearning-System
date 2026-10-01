import { useState } from 'react'

/**
 * "Xem gợi ý" under a question: shows the hint without the answer, and the question's points are not lowered
 * (scenarios 9 and 10, branches 7b and 5b). Remount it for each question so the hint starts hidden.
 *
 * @param {{ hint: string }} props
 */
export function HintToggle({ hint }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="text-label">
      {shown ? (
        <p className="rounded-lg bg-brand-tint px-3.5 py-2.5 text-brand-dark">
          <span className="font-semibold">Gợi ý: </span>
          {hint}
        </p>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="cursor-pointer font-semibold text-brand-dark hover:text-brand">
          Xem gợi ý
        </button>
      )}
    </div>
  )
}
