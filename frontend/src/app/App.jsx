import { Logo } from '@/components/ui/Logo'

// Placeholder until routing and authentication are added (branch feature/auth-frontend).
export default function App() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="flex w-full max-w-[420px] animate-screen-in flex-col gap-5 rounded-xl border border-line bg-white p-10">
        <Logo />
        <h1 className="text-[26px] font-bold text-ink">Xin chào 👋</h1>
        <p className="text-sm text-muted">Giao diện đang được xây dựng.</p>
      </div>
    </main>
  )
}
