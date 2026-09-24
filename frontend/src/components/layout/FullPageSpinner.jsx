import { Spinner } from '@/components/ui/Spinner'

export function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner label="Đang tải" className="size-8" />
    </div>
  )
}
