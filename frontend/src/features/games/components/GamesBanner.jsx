import { Link } from 'react-router'

/** The design's teal banner under the topics and personal lists (A4 entry point). */
export function GamesBanner() {
  return (
    <Link
      to="/vocabulary/games"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[linear-gradient(155deg,var(--color-brand-dark),var(--color-brand))] px-6 py-5 text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="flex flex-col">
        <span className="text-[17px] leading-6 font-semibold">Trò chơi từ vựng &amp; Bảng xếp hạng</span>
        <span className="text-label text-white/80">Ôn từ vựng theo cách chơi có tính giờ, thi đua với bạn học khác</span>
      </span>
      <span className="flex-none rounded-lg bg-white/16 px-5 py-2.75 text-label font-semibold">Chơi ngay →</span>
    </Link>
  )
}
