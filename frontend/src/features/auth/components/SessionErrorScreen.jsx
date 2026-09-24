import { CenteredCard } from '@/components/layout/CenteredCard'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

/** Shown instead of the app when the stored session could not be checked because the server was unreachable. */
export function SessionErrorScreen({ onRetry }) {
  return (
    <CenteredCard>
      <title>Không kết nối được máy chủ · LinguaStep</title>
      <Logo />
      <h1 className="text-title font-bold text-ink">Không kết nối được máy chủ</h1>
      <p className="text-sm text-muted">
        Chưa kiểm tra được phiên đăng nhập của bạn. Vui lòng kiểm tra kết nối rồi thử lại.
      </p>
      <Button onClick={onRetry}>Thử lại</Button>
    </CenteredCard>
  )
}
