import { Link } from 'react-router'
import { CenteredCard } from '@/components/layout/CenteredCard'
import { Logo } from '@/components/ui/Logo'

export function NotFoundPage() {
  return (
    <CenteredCard>
      <title>Không tìm thấy trang · LinguaStep</title>
      <Logo />
      <h1 className="text-title font-bold text-ink">Không tìm thấy trang</h1>
      <p className="text-sm text-muted">Địa chỉ bạn truy cập không tồn tại hoặc đã được chuyển đi.</p>
      <Link to="/" className="text-sm font-semibold">
        ← Về trang chủ
      </Link>
    </CenteredCard>
  )
}
