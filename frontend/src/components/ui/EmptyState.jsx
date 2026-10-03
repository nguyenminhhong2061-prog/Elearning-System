import { Card } from './Card'

/** A short grey sentence on a white card: "nothing here yet", "not found". */
export function EmptyState({ children }) {
  return (
    <Card>
      <p className="text-sm text-muted">{children}</p>
    </Card>
  )
}
