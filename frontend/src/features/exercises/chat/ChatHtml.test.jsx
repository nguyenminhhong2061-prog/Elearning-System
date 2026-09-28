import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatHtml } from './ChatHtml'

describe('ChatHtml', () => {
  it('renders compact HTML lists without accepting provider attributes', () => {
    const { container } = render(<ChatHtml text={'<p class="unsafe">Dùng <strong>has lived</strong>.</p><ul><li>Ví dụ ngắn</li></ul>'} />)
    expect(screen.getByText('has lived', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Ví dụ ngắn')
    expect(container.querySelector('.unsafe')).toBeNull()
  })

  it('keeps old Markdown answers readable', () => {
    render(<ChatHtml text={'**Lưu ý**\n\n- Mẹo một'} />)
    expect(screen.getByText('Lưu ý', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Mẹo một')
  })
})
