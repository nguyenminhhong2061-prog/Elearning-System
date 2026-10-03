import { Link } from 'react-router'

/** "← Chủ đề": the link back to the parent page, at the top left of a page heading. */
export function BackLink({ to, children }) {
  return (
    <Link to={to} className="self-start text-label font-medium">
      ← {children}
    </Link>
  )
}
