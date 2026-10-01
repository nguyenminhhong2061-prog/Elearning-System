import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LessonCard } from './LessonCard'

const lesson = (skill, progress) => ({
  id: 1,
  skill,
  title: 'Bài mẫu',
  description: null,
  difficulty: 'EASY',
  estimatedMinutes: 5,
  itemCount: 5,
  progress: { attemptCount: 1, bestScorePercent: 80, lastCompletedAt: null, inProgress: null, ...progress },
})

const show = (value) =>
  render(
    <MemoryRouter>
      <LessonCard lesson={value} />
    </MemoryRouter>,
  )

describe('LessonCard', () => {
  it('says how many items of a pronunciation lesson were practised (scenario 12)', () => {
    show(lesson('PRONUNCIATION', { practicedCount: 3, lastResult: null }))
    expect(screen.getByText('Đã luyện 3/5 mục')).toBeInTheDocument()
    expect(screen.queryByText(/Tốt nhất/)).not.toBeInTheDocument()
  })

  it('shows the latest result of a listening lesson (scenario 11)', () => {
    show(lesson('LISTENING', { practicedCount: null, lastResult: { correctCount: 4, questionCount: 5 } }))
    expect(screen.getByText('Gần nhất 4/5')).toBeInTheDocument()
  })

  it('keeps the best score when the server does not send these fields yet', () => {
    show(lesson('LISTENING', {}))
    expect(screen.getByText('Tốt nhất 80% · 1 lần')).toBeInTheDocument()
  })
})
