import { addDays } from '../src/lib/dates.js'

// Sample data of the admin area for `npm run dev:mock` (docs/api/admin.md): the learners of the users page and the
// tests of the tests page. Everything is dated relative to today, so the pages look the same whenever they are opened
// (on 29/09/2026 they match the design and scenarios 24–25 of Analysis/Scenarios.md).

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** Learners of the design, in order of registration (newest first). [name, email, level, days ago, status, active] */
const NAMED_LEARNERS = [
  ['Lê Minh Châu', 'chau.le@example.com', null, 1, 'ACTIVE', { daysAgo: 1, time: '20:15' }],
  ['Ngô Đức Huy', 'huy.ngo@example.com', 'B1', 5, 'ACTIVE', { daysAgo: 2, time: '19:40' }],
  ['Hoàng Gia Linh', 'linh.hoang@example.com', 'B1', 7, 'ACTIVE', { daysAgo: 0, time: '09:55' }],
  ['Nguyễn Văn An', 'an.nguyen@example.com', 'A2', 9, 'ACTIVE', { daysAgo: 1, time: '21:03' }],
  ['Trần Thị Hoa', 'hoa.tran@example.com', 'B1', 11, 'ACTIVE', { daysAgo: 0, time: '08:12' }],
  ['Phạm Văn Nam', 'nam.pv@gmail.com', 'A2', 14, 'ACTIVE', { daysAgo: 1, time: '23:40' }],
  ['Phạm Quốc Bảo', 'bao.pham@example.com', 'B2', 17, 'LOCKED', { daysAgo: 8, time: '18:20' }],
  ['Vũ Hải Nam', 'nam.vu@example.com', 'C1', 19, 'ACTIVE', { daysAgo: 3, time: '07:45' }],
  ['Trần Thị Lan', 'lan.tran@example.com', 'A2', 21, 'ACTIVE', { daysAgo: 0, time: '07:30' }],
  ['Bùi Thanh Tâm', 'tam.bui@example.com', 'A2', 24, 'LOCKED', { daysAgo: 15, time: '22:10' }],
]

const FAMILY = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý']
const MIDDLE = ['Văn', 'Thị', 'Minh', 'Đức', 'Thu', 'Ngọc', 'Quang', 'Thanh', 'Gia', 'Hải', 'Bảo', 'Khánh']
const GIVEN = ['Anh', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Kiên', 'Linh', 'Long', 'Mai', 'My', 'Nga', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Trang', 'Tú', 'Uyên', 'Việt', 'Yến']

// Level distribution of the overview (128 learners): A1 22, A2 31, B1 38, B2 19, C1 6, C2 2, not determined 10.
const LEVEL_TOTALS = { A1: 22, A2: 31, B1: 38, B2: 19, C1: 6, C2: 2, NONE: 10 }
const TOTAL_LEARNERS = Object.values(LEVEL_TOTALS).reduce((sum, count) => sum + count, 0)

/** Removes Vietnamese accents for e-mail addresses. */
function plain(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

function instant(today, daysAgo, time) {
  // Vietnam is UTC+7 all year: 08:12 there is 01:12 UTC the same day, 03:40 there is 20:40 UTC the day before.
  const [hour, minute] = time.split(':').map(Number)
  const utcHour = hour - 7
  const day = addDays(today, -daysAgo + (utcHour < 0 ? -1 : 0))
  return `${day}T${String((utcHour + 24) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`
}

/** Every learner of the mock, newest registration first. Admin accounts are not listed. */
export function buildLearners(today) {
  const remaining = { ...LEVEL_TOTALS }
  const named = NAMED_LEARNERS.map(([fullName, email, level, daysAgo, status, active], index) => {
    remaining[level ?? 'NONE'] -= 1
    return {
      id: 1000 + index,
      fullName,
      email,
      currentLevel: level,
      status,
      createdAt: instant(today, daysAgo, '09:00'),
      lastActiveAt: instant(today, active.daysAgo, active.time),
    }
  })

  // The rest, in a stable order: levels are dealt from what the named learners left, one of them is locked.
  const pool = Object.entries(remaining).flatMap(([level, count]) => Array.from({ length: count }, () => level))
  const usedEmails = new Set(named.map((learner) => learner.email))
  const others = pool.map((level, index) => {
    const n = index + 7
    const fullName = `${FAMILY[(n * 7) % FAMILY.length]} ${MIDDLE[(n * 5) % MIDDLE.length]} ${GIVEN[(n * 3) % GIVEN.length]}`
    const words = plain(fullName).split(' ')
    let email = `${words.at(-1)}.${words[0]}${n}@example.com`
    while (usedEmails.has(email)) email = `x${email}`
    usedEmails.add(email)
    const daysAgo = 26 + Math.floor(index * 1.6)
    return {
      id: 1100 + index,
      fullName,
      email,
      currentLevel: level === 'NONE' ? null : level,
      status: index === 40 ? 'LOCKED' : 'ACTIVE',
      createdAt: instant(today, daysAgo, `${String(8 + (index % 12)).padStart(2, '0')}:${String((index * 13) % 60).padStart(2, '0')}`),
      // Some never came back after registering.
      lastActiveAt: index % 9 === 4 ? null : instant(today, 1 + (index % 17), `${String(6 + (index % 16)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`),
    }
  })
  return [...named, ...others]
}

export { LEVELS, TOTAL_LEARNERS }

/** Details of Phạm Văn Nam as in scenario 25; other learners get numbers derived from their id. */
export function learnerDetail(learner, today) {
  if (learner.email === 'nam.pv@gmail.com') {
    return {
      stats: {
        wordsLearned: 12,
        wordsMastered: 0,
        streakDays: 0,
        lastStudyDate: addDays(today, -9),
        exercisesCompleted: 1,
        exerciseAverageScore: 50,
        testsSubmitted: 1,
        lastTestDate: addDays(today, -13),
        chatSessions: 37,
        lastChatDate: addDays(today, -1),
      },
      recentActivity: [
        { at: instant(today, 1, '23:40'), type: 'CHAT', title: 'Trò chuyện với trợ lý AI', detail: '14 tin nhắn' },
        { at: instant(today, 1, '22:05'), type: 'CHAT', title: 'Trò chuyện với trợ lý AI', detail: '11 tin nhắn' },
        { at: instant(today, 2, '21:10'), type: 'CHAT', title: 'Trò chuyện với trợ lý AI', detail: '12 tin nhắn' },
        { at: instant(today, 9, '19:30'), type: 'EXERCISE', title: 'Thì hiện tại đơn', detail: '50%' },
        { at: instant(today, 13, '20:05'), type: 'TEST', title: 'Kiểm tra tổng hợp tháng 9', detail: '38 điểm · trình độ A2' },
      ],
      levelHistory: [
        { level: 'A2', changedAt: instant(today, 13, '20:05'), source: 'Kiểm tra tổng hợp tháng 9 · 38 điểm' },
        { level: null, changedAt: learner.createdAt, source: 'Đăng ký tài khoản' },
      ],
      plan: null,
    }
  }

  const seed = learner.id
  const learned = learner.lastActiveAt ? 8 + ((seed * 37) % 160) : 0
  const exercises = learner.lastActiveAt ? (seed * 7) % 24 : 0
  const tests = learner.currentLevel ? 1 + (seed % 5) : 0
  const chats = learner.lastActiveAt ? (seed * 5) % 13 : 0
  const levelHistory = [{ level: null, changedAt: learner.createdAt, source: 'Đăng ký tài khoản' }]
  if (learner.currentLevel) {
    levelHistory.unshift({
      level: learner.currentLevel,
      changedAt: learner.lastActiveAt ?? learner.createdAt,
      source: `Kiểm tra tổng hợp · ${20 + LEVELS.indexOf(learner.currentLevel) * 12 + (seed % 9)} điểm`,
    })
  }
  const recentActivity = learner.lastActiveAt
    ? [
        { at: learner.lastActiveAt, type: 'REVIEW', title: 'Ôn tập từ vựng', detail: `${10 + (seed % 15)} thẻ` },
        ...(exercises > 0 ? [{ at: learner.lastActiveAt, type: 'EXERCISE', title: 'Câu bị động', detail: `${50 + (seed % 50)}%` }] : []),
      ]
    : []
  return {
    stats: {
      wordsLearned: learned,
      wordsMastered: Math.floor(learned / 3),
      streakDays: learner.lastActiveAt ? seed % 21 : 0,
      lastStudyDate: learner.lastActiveAt ? learner.lastActiveAt.slice(0, 10) : null,
      exercisesCompleted: exercises,
      exerciseAverageScore: exercises > 0 ? 55 + (seed % 40) : null,
      testsSubmitted: tests,
      lastTestDate: tests > 0 ? addDays(today, -(seed % 20)) : null,
      chatSessions: chats,
      lastChatDate: chats > 0 ? learner.lastActiveAt.slice(0, 10) : null,
    },
    recentActivity,
    levelHistory,
    plan: seed % 3 === 0 && learner.currentLevel ? { title: 'Đạt B2 trong 3 tháng', currentWeek: 1 + (seed % 12), weekCount: 13, status: 'ACTIVE' } : null,
  }
}

// --- Tests -------------------------------------------------------------------------------------------------------------

const choice = (id, skill, content, options, correctIndex, type = 'MULTIPLE_CHOICE', points = 1) => ({
  id,
  skill,
  type,
  points,
  audioUrl: null,
  content,
  options: options.map((text, index) => ({ id: id * 10 + index + 1, text, correct: index === correctIndex })),
  acceptedAnswers: [],
})
const text = (id, skill, content, accepted, type = 'FILL_BLANK', points = 1) => ({
  id,
  skill,
  type,
  points,
  audioUrl: null,
  content,
  options: [],
  acceptedAnswers: accepted,
})

/** The five questions of the seeded "tuần 40" test (V202610010910__seed_tests.sql). */
const WEEK_40_QUESTIONS = [
  choice(1001, 'READING', 'Choose the correct form: She ___ (live) in Hanoi for five years.', ['lives', 'has lived', 'is living', 'lived'], 1),
  choice(1002, 'READING', 'Choose the correct form: If it ___ tomorrow, we will stay home.', ['rains', 'rained', 'will rain', 'raining'], 0),
  text(1003, 'WRITING', 'I have never ___ (see) such a beautiful beach.', ['seen']),
  text(1004, 'WRITING', 'They ___ (go) to the cinema last night.', ['went']),
  choice(1005, 'READING', 'Choose the correct word: She has worked here ___ 2010.', ['since', 'for', 'during', 'from'], 0),
]

/** Earlier weeks: the same kind of questions with other sentences. */
function olderWeek(base) {
  return [
    choice(base + 1, 'READING', 'Choose the correct form: He ___ (work) here since 2019.', ['works', 'has worked', 'worked', 'is working'], 1),
    choice(base + 2, 'READING', 'Choose the correct word: We arrived ___ Monday morning.', ['on', 'in', 'at', 'by'], 0),
    text(base + 3, 'WRITING', 'She ___ (buy) a new phone yesterday.', ['bought']),
    text(base + 4, 'WRITING', 'Have you ever ___ (be) to Da Nang?', ['been']),
    choice(base + 5, 'READING', 'Choose the correct form: If I ___ you, I would study harder.', ['am', 'were', 'will be', 'being'], 1),
  ]
}

const COMPREHENSIVE_QUESTIONS = [
  choice(2001, 'LISTENING', 'Announcement: "Flight VN209 is now boarding at Gate 5. All passengers should proceed to the gate." Question: What should passengers do?', ['Go to Gate 5', 'Wait at the check-in counter', 'Collect luggage', 'Leave the airport'], 0, 'LISTENING', 2),
  choice(2002, 'READING', 'Read the text: "Hanoi is the capital of Vietnam. It is known for its Old Quarter and Hoan Kiem Lake." Question: What is Hanoi known for?', ['Its beaches', 'Its Old Quarter and lake', 'Its mountains', 'Its desert'], 1, 'READING', 2),
  text(2003, 'WRITING', 'Complete the sentence with a reason: I stayed home ___ it was raining.', ['because'], 'WRITING', 2),
  { ...text(2004, 'SPEAKING', 'Read this sentence aloud: "Sustainability is a shared responsibility."', [], 'SPEAKING', 5) },
  choice(2005, 'READING', 'Read the text: "The museum opens at 9 a.m. and closes at 5 p.m. every day except Monday." Question: When is the museum closed?', ['Monday', 'Tuesday', 'Sunday', 'Every day'], 0, 'READING', 2),
]

/** ISO week number of a "YYYY-MM-DD" date (the tests are named after the week they close in). */
export function isoWeek(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  const weekday = (date.getUTCDay() + 6) % 7 // Monday = 0
  date.setUTCDate(date.getUTCDate() - weekday + 3) // Thursday of this week decides the year
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3)
  return 1 + Math.round((date - firstThursday) / (7 * 24 * 3600 * 1000))
}

/**
 * The tests of the mock: the open weekly test (opened 3 days ago for 7 days, like the seed), the two before it, and
 * the comprehensive test, which is always open.
 */
export function buildTests(today) {
  const start = addDays(today, -3)
  const end = addDays(today, 4)
  const periodic = (id, offsetWeeks, questions, submissions, averageScore) => {
    const startDate = addDays(start, -7 * offsetWeeks)
    const endDate = addDays(end, -7 * offsetWeeks)
    return {
      id,
      title: `Kiểm tra định kỳ — tuần ${isoWeek(endDate)}`,
      type: 'PERIODIC',
      startDate,
      endDate,
      draft: false,
      submissions,
      averageScore,
      duplicatedFrom: null,
      questions,
    }
  }
  return [
    periodic(100, 0, WEEK_40_QUESTIONS, 28, 72),
    {
      id: 200,
      title: 'Kiểm tra tổng hợp tháng 9',
      type: 'COMPREHENSIVE',
      startDate: null,
      endDate: null,
      draft: false,
      submissions: 15,
      averageScore: 58,
      duplicatedFrom: null,
      questions: COMPREHENSIVE_QUESTIONS,
    },
    periodic(99, 1, olderWeek(990), 31, 69),
    periodic(98, 2, olderWeek(980), 22, 74),
  ]
}
