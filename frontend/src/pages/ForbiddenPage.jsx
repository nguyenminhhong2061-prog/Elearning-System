import { Link } from 'react-router'
import { CenteredCard } from '@/components/layout/CenteredCard'
import { Logo } from '@/components/ui/Logo'

/** Shown when a signed-in user opens a page their role is not allowed to see. */
export function ForbiddenPage() {
  return (
    <CenteredCard>
      <title>Không có quyền truy cập · LinguaStep</title>
      <Logo />
      <h1 className="text-title font-bold text-ink">Không có quyền truy cập</h1>
      <p className="text-sm text-muted">Tài khoản của bạn không được phép xem trang này.</p>
      <Link to="/" className="text-sm font-semibold">
        ← Về trang chủ
      </Link>
    </CenteredCard>
  )
}
