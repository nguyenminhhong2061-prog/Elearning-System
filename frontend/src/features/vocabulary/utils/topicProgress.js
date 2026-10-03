import { formatCount } from '@/lib/format'

/**
 * Share of learned words as a whole percentage, never rounded to a misleading 0% or 100%: one word learned out of
 * 240 shows 1%, and 239 out of 240 shows 99%.
 */
export function learnedPercent(learnedCount, wordCount) {
  if (wordCount <= 0 || learnedCount <= 0) return 0
  if (learnedCount >= wordCount) return 100
  return Math.min(99, Math.max(1, Math.round((learnedCount / wordCount) * 100)))
}

/** Line under a topic card's name: "240 từ · 45% đã học". */
export function describeTopicProgress({ wordCount, learnedCount }) {
  if (wordCount <= 0) return 'Chưa có từ'
  const words = `${formatCount(wordCount)} từ`
  if (learnedCount <= 0) return `${words} · Chưa học`
  return `${words} · ${learnedPercent(learnedCount, wordCount)}% đã học`
}

/** Totals over every topic, for the header of the vocabulary page. */
export function summarizeTopics(topics) {
  return topics.reduce(
    (total, topic) => ({
      wordCount: total.wordCount + topic.wordCount,
      learnedCount: total.learnedCount + topic.learnedCount,
    }),
    { wordCount: 0, learnedCount: 0 },
  )
}
