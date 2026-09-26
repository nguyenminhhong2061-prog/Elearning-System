import { describe, expect, it } from 'vitest'
import { encodeWav } from './wav'

const text = (view, offset, length) => String.fromCharCode(...Array.from({ length }, (_, index) => view.getUint8(offset + index)))

describe('encodeWav', () => {
  it('writes a 16-bit mono PCM header for the given sample rate', () => {
    const view = new DataView(encodeWav(new Float32Array(3), 16000))

    expect(view.byteLength).toBe(44 + 6)
    expect(text(view, 0, 4)).toBe('RIFF')
    expect(view.getUint32(4, true)).toBe(36 + 6)
    expect(text(view, 8, 8)).toBe('WAVEfmt ')
    expect(view.getUint16(20, true)).toBe(1) // PCM
    expect(view.getUint16(22, true)).toBe(1) // mono
    expect(view.getUint32(24, true)).toBe(16000)
    expect(view.getUint32(28, true)).toBe(32000) // bytes per second
    expect(view.getUint16(34, true)).toBe(16)
    expect(text(view, 36, 4)).toBe('data')
    expect(view.getUint32(40, true)).toBe(6)
  })

  it('converts samples to 16-bit integers and clips values outside -1..1', () => {
    const view = new DataView(encodeWav(new Float32Array([0, 1, -1, 0.5, 2, -3]), 16000))
    const samples = Array.from({ length: 6 }, (_, index) => view.getInt16(44 + index * 2, true))

    expect(samples).toEqual([0, 32767, -32768, 16383, 32767, -32768])
  })
})
