import { Link } from 'react-router'
import { Page } from '@/components/layout/Page'

/**
 * Page frame of the admin area: the section name (or a breadcrumb) above the title, a summary line below it, and the
 * page actions on the right, as in the design.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.section] group of the sidebar ("Nội dung học", "Hệ thống")
 * @param {{ label: string, to: string }[]} [props.breadcrumb] parent pages; the title is the last step
 * @param {string} [props.crumb] last step of the breadcrumb when it is not the title ("Bài tập / Ngữ pháp")
 * @param {import('react').ReactNode} [props.titleAddon] tags next to the title ("Nháp")
 * @param {import('react').ReactNode} [props.summary] line under the title
 * @param {import('react').ReactNode} [props.actions]
 * @param {boolean} [props.titleInContent] only the breadcrumb is drawn here; the page puts its own <h1> in its content
 *   (a profile card whose heading is the person's name)
 */
export function AdminPage({ title, section, breadcrumb, crumb, titleAddon, summary, actions, titleInContent = false, children }) {
  const heading = (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        {breadcrumb ? (
          <nav aria-label="Vị trí" className="text-label font-medium text-muted-strong">
            {breadcrumb.map((step) => (
              <span key={step.to}>
                <Link to={step.to} className="font-semibold">
                  {step.label}
                </Link>
                {' / '}
              </span>
            ))}
            <span aria-current="page">{crumb ?? title}</span>
          </nav>
        ) : (
          section && <span className="text-label font-medium text-muted-strong">{section}</span>
        )}
        {!titleInContent && (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title font-bold text-ink">{title}</h1>
            {titleAddon}
          </div>
        )}
        {summary && <p className="text-label leading-4.5 text-muted-strong">{summary}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )

  return (
    <Page title={`${title} · Quản trị`} heading={heading}>
      {children}
    </Page>
  )
}
