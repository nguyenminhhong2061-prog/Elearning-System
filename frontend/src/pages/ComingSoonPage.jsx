import { Page } from '@/components/layout/Page'
import { Card } from '@/components/ui/Card'

/**
 * Stand-in for a section whose module has no pages yet. When a module delivers its pages, replace this element
 * in app/router.jsx.
 */
export function ComingSoonPage({ title }) {
  return (
    <Page title={title}>
      <Card className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-ink">Sắp ra mắt</h2>
        <p className="text-sm text-muted">Phần này đang được phát triển và sẽ sớm có mặt trong LinguaStep.</p>
      </Card>
    </Page>
  )
}
