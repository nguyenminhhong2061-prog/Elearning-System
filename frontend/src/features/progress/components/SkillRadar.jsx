import { Link } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDayMonth, formatMoment, todayInVietnam } from '@/lib/dates'
import { useSkills } from '../api/progressQueries'
import { PLAN_PATH, SKILL_AXES, TESTS_PATH } from '../constants'

// The radar is plain SVG (no chart library): a diamond per quarter of the scale, one axis per skill.
const CENTER_X = 180
const CENTER_Y = 140
const RADIUS = 95
const DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]
// Where each axis's name and score go: above, right of, below and left of the diamond.
const LABELS = [
  { x: 180, y: 18, anchor: 'middle' },
  { x: 283, y: 136, anchor: 'start' },
  { x: 180, y: 256, anchor: 'middle' },
  { x: 77, y: 136, anchor: 'end' },
]

function point(axis, fraction) {
  const [dx, dy] = DIRECTIONS[axis]
  return [CENTER_X + dx * RADIUS * fraction, CENTER_Y + dy * RADIUS * fraction]
}

const ring = (fraction) => SKILL_AXES.map((_, axis) => point(axis, fraction).join(',')).join(' ')

/**
 * The four-skill radar alone (also drawn on the study plan page, D2).
 * @param {{ result: import('../types').SkillResult | null }} props
 */
export function Radar({ result }) {
  const scores = SKILL_AXES.map(({ key }) => result?.skills[key] ?? null)
  const graded = scores.every((skill) => skill?.score !== null && skill?.score !== undefined)
  const description = result
    ? SKILL_AXES.map(({ label }, axis) => (scores[axis].score === null ? `${label} đang chấm` : `${label} ${scores[axis].score} điểm (${scores[axis].level})`)).join(', ')
    : 'Biểu đồ kỹ năng trống'

  return (
    <svg role="img" aria-label={description} viewBox="0 0 360 280" className="h-auto max-h-70 w-full">
      <polygon points={ring(1)} fill="none" className="stroke-line" strokeWidth="1" strokeDasharray={result ? undefined : '4 4'} />
      {[0.75, 0.5, 0.25].map((fraction) => (
        <polygon key={fraction} points={ring(fraction)} fill="none" className="stroke-canvas" strokeWidth="1" />
      ))}
      <line x1={CENTER_X} y1={CENTER_Y - RADIUS} x2={CENTER_X} y2={CENTER_Y + RADIUS} className="stroke-canvas" strokeWidth="1" />
      <line x1={CENTER_X - RADIUS} y1={CENTER_Y} x2={CENTER_X + RADIUS} y2={CENTER_Y} className="stroke-canvas" strokeWidth="1" />
      {graded && (
        <polygon
          points={scores.map((skill, axis) => point(axis, skill.score / 100).join(',')).join(' ')}
          className="fill-brand/18 stroke-brand"
          strokeWidth="2"
        />
      )}
      {scores.map((skill, axis) => {
        if (skill?.score === null || skill?.score === undefined) return null
        const [x, y] = point(axis, skill.score / 100)
        return <circle key={SKILL_AXES[axis].key} cx={x} cy={y} r="4" className="fill-brand" />
      })}
      {SKILL_AXES.map(({ key, label }, axis) => {
        const { x, y, anchor } = LABELS[axis]
        const skill = scores[axis]
        return (
          <g key={key}>
            <text x={x} y={skill ? y : y + 8} textAnchor={anchor} fontSize="13" fontWeight="600" className="fill-ink">
              {label}
            </text>
            {skill && (
              <text x={x} y={y + 16} textAnchor={anchor} fontSize="12" className={skill.score === null ? 'fill-warning' : 'fill-ink-soft'}>
                {skill.score === null ? 'đang chấm' : `${skill.level} · ${skill.score}`}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Result of the latest comprehensive test (C2) as a four-skill radar: listening, reading, writing, speaking. */
export function SkillRadar() {
  const skills = useSkills()
  const result = skills.data

  let heading
  if (skills.isPending) {
    heading = <Skeleton className="h-7 w-40" />
  } else if (skills.isError) {
    heading = <LoadError error={skills.error} onRetry={() => skills.refetch()} message="Không tải được điểm kỹ năng." />
  } else if (!result) {
    heading = <p className="text-label text-ink-soft">Chưa có kết quả kiểm tra tổng hợp.</p>
  } else if (result.status === 'SUBMITTED') {
    const pending = SKILL_AXES.filter(({ key }) => result.skills[key].score === null).map(({ label }) => label)
    heading = (
      <div className="flex flex-col items-start gap-1.5">
        <span className="rounded-md bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">Đang chấm phần {pending.join(', ')}</span>
        <p className="text-label text-ink-soft">
          {result.testTitle} nộp lúc {formatMoment(result.takenAt)}. Phần {pending.join(', ')} do AI chấm, kết quả sẽ có sau. Điểm tổng và trình độ hiện khi
          chấm xong.
        </p>
      </div>
    )
  } else {
    heading = (
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold text-brand-dark">
          {result.overallScore}/100 · {result.level}
        </span>
        <span className="text-xs text-muted">
          {result.testTitle} · nộp ngày {formatDayMonth(todayInVietnam(new Date(result.takenAt)))}
        </span>
      </div>
    )
  }

  return (
    <section aria-labelledby="skills-title" className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 id="skills-title" className="text-lg font-semibold text-ink">
        Điểm theo kỹ năng
      </h2>
      {heading}
      {!skills.isError && <Radar result={result ?? null} />}
      {result ? (
        <Link to={PLAN_PATH} className="text-label font-semibold">
          Xem báo cáo và lộ trình trong Kế hoạch →
        </Link>
      ) : (
        !skills.isPending &&
        !skills.isError && (
          <>
            <p className="text-label text-ink-soft">Làm bài kiểm tra tổng hợp (nghe, nói, đọc, viết) để biết điểm từng kỹ năng và trình độ CEFR.</p>
            <ButtonLink to={TESTS_PATH} size="sm" className="self-start">
              Làm bài kiểm tra tổng hợp
            </ButtonLink>
          </>
        )
      )}
    </section>
  )
}
