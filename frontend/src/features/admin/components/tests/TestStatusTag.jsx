import { Tag } from '@/components/ui/Tag'
import { daysUntil } from '../../utils/format'
import { displayStatus } from '../../utils/testDraft'

/**
 * Where a test stands for learners: "Nháp", "Sắp mở", "Đang mở · còn 3 ngày", "Đã đóng" or "Đã ẩn".
 *
 * @param {{ test: { status: string, phase?: string, endDate: string | null }, short?: boolean }} props `short` leaves out the days left
 */
export function TestStatusTag({ test, short = false }) {
  switch (displayStatus(test)) {
    case 'OPEN': {
      if (short || !test.endDate) return <Tag variant="success">Đang mở</Tag>
      const left = daysUntil(test.endDate)
      return <Tag variant="success">Đang mở · {left === 0 ? 'đóng hôm nay' : `còn ${left} ngày`}</Tag>
    }
    case 'UPCOMING':
      return <Tag variant="brand">Sắp mở</Tag>
    case 'DRAFT':
      return <Tag variant="warning">Nháp</Tag>
    case 'HIDDEN':
      return <Tag variant="neutral">Đã ẩn</Tag>
    default:
      return <Tag variant="neutral">Đã đóng</Tag>
  }
}
