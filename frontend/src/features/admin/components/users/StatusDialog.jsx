import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/toastContext'
import { useSetUserStatus } from '../../api/usersQueries'

function Point({ tone, children }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden="true" className={`mt-2 size-1.5 flex-none rounded-full ${tone === 'keep' ? 'bg-brand-dark' : 'bg-danger'}`} />
      <span>{children}</span>
    </li>
  )
}

/**
 * Scenario 25, steps 7–10 and branches 2a, 7a, 8a: confirm locking or unlocking an account.
 *
 * @param {object} props
 * @param {import('../../types').AdminUserDetail} props.learner
 * @param {'LOCKED' | 'ACTIVE' | null} props.status the state asked for; null keeps the dialog closed
 * @param {() => void} props.onClose
 */
export function StatusDialog({ learner, status, onClose }) {
  const setStatus = useSetUserStatus()
  const toast = useToast()
  const locking = status === 'LOCKED'

  function close() {
    setStatus.reset()
    onClose()
  }

  function confirm() {
    setStatus.mutate(
      { id: learner.id, status },
      {
        onSuccess: () => {
          toast(locking ? `Đã khóa tài khoản ${learner.fullName}` : `Đã mở khóa tài khoản ${learner.fullName}`)
          close()
        },
      },
    )
  }

  return (
    <Dialog open={status !== null} onClose={close} title={locking ? `Khóa tài khoản ${learner.fullName}?` : `Mở khóa tài khoản ${learner.fullName}?`}>
      {locking ? (
        <>
          <p className="-mt-2 text-label text-muted-strong">{learner.email}</p>
          <ul className="flex flex-col gap-2.5 text-sm leading-5.5 text-ink-soft">
            <Point>
              Người học bị <strong className="text-ink">đăng xuất ngay</strong> trên mọi thiết bị.
            </Point>
            <Point>Không đăng nhập được; màn đăng nhập báo tài khoản đã bị khóa.</Point>
            <Point tone="keep">
              Toàn bộ dữ liệu học tập <strong className="text-ink">được giữ nguyên</strong>; mở khóa là học tiếp được.
            </Point>
          </ul>
        </>
      ) : (
        <p className="text-sm leading-5.5 text-ink-soft">Người học đăng nhập lại được bình thường và học tiếp với dữ liệu cũ.</p>
      )}
      {setStatus.isError && (
        <Alert variant="error">
          {setStatus.error?.status === 403
            ? 'Không thể khóa tài khoản quản trị.'
            : describeApiError(setStatus.error, locking ? 'Chưa khóa được tài khoản. Vui lòng thử lại.' : 'Chưa mở khóa được tài khoản. Vui lòng thử lại.')}
        </Alert>
      )}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Button variant="outline" size="xs" onClick={close}>
          Hủy
        </Button>
        <Button variant={locking ? 'danger' : 'strong'} size="xs" loading={setStatus.isPending} onClick={confirm}>
          {locking ? 'Khóa tài khoản' : 'Mở khóa'}
        </Button>
      </div>
    </Dialog>
  )
}
