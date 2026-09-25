import { z } from 'zod'
import { CEFR_LEVELS } from '@/api/constants'

// "Tự nhập từ mới" form (A3), matching NewWord in docs/api/custom-lists.md. Phonetics and example may stay empty.

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null)

export const newWordSchema = z.object({
  word: z.string().trim().min(1, 'Vui lòng nhập từ.').max(150, 'Từ tối đa 150 ký tự.'),
  meaning: z.string().trim().min(1, 'Vui lòng nhập nghĩa.').max(500, 'Nghĩa tối đa 500 ký tự.'),
  difficultyLevel: z.enum(CEFR_LEVELS, 'Vui lòng chọn trình độ.'),
  phonetic: optionalText(150, 'Phiên âm tối đa 150 ký tự.'),
  exampleSentence: optionalText(500, 'Câu ví dụ tối đa 500 ký tự.'),
})
