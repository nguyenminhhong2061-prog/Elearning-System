import { Card } from '@/components/ui/Card'

/**
 * Full-screen page with a single card in the middle: login, register and standalone error pages.
 * The design declares "max-width: 420px; padding: 40px" in content-box sizing, so its card is really 500px
 * wide; Tailwind uses border-box, hence 500px here.
 */
export function CenteredCard({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-10">
      <Card className="flex w-full max-w-125 animate-screen-in flex-col gap-5 p-6 sm:p-10">{children}</Card>
    </main>
  )
}
