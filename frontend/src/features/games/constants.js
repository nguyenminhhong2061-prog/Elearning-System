/** What each kind of game asks, shown on the game list and before a round starts. */
export const GAME_TYPE_INFO = Object.freeze({
  GUESS_MEANING: {
    summary: 'Chọn nghĩa đúng của từ tiếng Anh.',
    instructions: 'Mỗi câu hiện một từ tiếng Anh. Chọn nghĩa tiếng Việt đúng trong 4 đáp án.',
  },
  QUICK_QUIZ: {
    summary: 'Nhìn nghĩa, chọn thật nhanh từ tiếng Anh.',
    instructions: 'Mỗi câu hiện một nghĩa tiếng Việt. Chọn từ tiếng Anh đúng trước khi hết giờ.',
  },
  WORD_MATCH: {
    summary: 'Ghép mỗi từ với nghĩa của nó.',
    instructions: 'Bấm một ô tiếng Anh rồi một ô nghĩa tiếng Việt để ghép. Ghép đúng sẽ sáng xanh.',
  },
})

/** Points shown while playing: each right answer is worth points × 10 (the server adds the time bonus at the end). */
export const POINTS_PER_UNIT = 10

/** How long the right/wrong colours stay before the next question. */
export const FEEDBACK_MS = 900
