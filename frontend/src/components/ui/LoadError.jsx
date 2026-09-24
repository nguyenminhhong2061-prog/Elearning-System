import { describeApiError } from '@/api/errorMessages'
import { Alert } from './Alert'
import { Button } from './Button'

/** Failed load: a Vietnamese explanation of `error` and a retry button. */
export function LoadError({ error, onRetry, message = 'Không tải được dữ liệu. Vui lòng thử lại.' }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert variant="error" className="self-stretch">
        {describeApiError(error, message)}
      </Alert>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  )
}
