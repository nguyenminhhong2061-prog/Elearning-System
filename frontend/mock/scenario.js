import { addDays, todayInVietnam } from '../src/lib/dates.js'
import { resetChatData } from './routes/chat.js'
import { resetExerciseData } from './routes/exercises.js'
import { gradingSkillsReply, newLearnerReply, resetProgressData } from './routes/progress.js'
import { planScenarioEffect, resetPlanData } from './routes/plan.js'

// Scenarios of `npm run dev:mock` for module B (exercises and the AI assistant) and the home page (module D), so that
// loading, empty and error screens can be seen without a backend. The chosen scenario lives in a cookie, so it applies
// to every tab of the browser; http://localhost:5173/__mock shows the control page.

const COOKIE = 'mockScenario'

export const SCENARIOS = [
  { id: 'normal', label: 'Bình thường', description: 'Mọi thứ chạy như có backend thật.' },
  { id: 'slow', label: 'Mạng chậm', description: 'Mọi API của module Bài tập chậm thêm 2,5 giây: xem khung chờ tải và nút đang xử lý.' },
  { id: 'empty', label: 'Chưa có bài', description: 'Danh sách bài của cả ba kỹ năng và lịch sử trò chuyện trống: xem màn "Chưa có bài tập".' },
  { id: 'load-error', label: 'Lỗi tải', description: 'Tải danh sách, nội dung bài, bắt đầu bài và lịch sử trò chuyện trả lỗi 500: xem thông báo lỗi và nút "Thử lại".' },
  { id: 'save-error', label: 'Lỗi lưu bài', description: 'Chấm câu và nộp bài trả lỗi 500 (bài vẫn mở được). Chuyển về "Bình thường" rồi bấm lại để thấy thử lại được.' },
  { id: 'ai-down', label: 'AI lỗi', description: 'Chấm phát âm và trợ lý AI trả lỗi 503: xem thông báo "chưa chấm được" và "không thể trả lời lúc này".' },
  { id: 'new-learner', label: 'Người mới', description: 'Trang chủ của người chưa học gì: số liệu bằng 0, biểu đồ trống, chưa có điểm kỹ năng và thành tích, không có bài đang dở.' },
  { id: 'grading', label: 'Đang chấm Nói, Viết', description: 'Bài kiểm tra tổng hợp gần nhất đang chờ AI chấm phần Nói và Viết: xem biểu đồ kỹ năng "Đang chấm".' },
]

// Endpoints the scenarios may change: module B and module D. Module A is left alone, except the learning summary the
// home page shows, which "Người mới" empties.
const AFFECTED = /^\/api\/(exercises|exercise-attempts|chat|progress)(\/|$)/

/** The learning summary (module A) of someone who has not learned a word yet. */
function emptyLearningSummary() {
  const today = todayInVietnam()
  return {
    dueToday: 0,
    learningCount: 0,
    masteredCount: 0,
    reviewedToday: 0,
    upcoming: Array.from({ length: 7 }, (_, index) => ({ date: addDays(today, index + 1), count: 0 })),
  }
}

/** The scenario chosen on the control page ("normal" when none or an unknown one). */
export function scenarioOf(req) {
  const value = new RegExp(`(?:^|;\\s*)${COOKIE}=([\\w-]+)`).exec(req.headers.cookie ?? '')?.[1]
  return SCENARIOS.some((scenario) => scenario.id === value) ? value : 'normal'
}

/**
 * What a scenario changes for one API request: extra waiting time, or a reply that replaces the normal one
 * ({ status, body } or { status, message } for an error). Only the AFFECTED endpoints change.
 */
export function scenarioEffect(scenario, method, pathname, searchParams = new URLSearchParams()) {
  if (scenario === 'new-learner' && method === 'GET' && pathname === '/api/learning/summary') {
    return { reply: { status: 200, body: emptyLearningSummary() } }
  }
  const planEffect = planScenarioEffect(scenario, method, pathname)
  if (planEffect) return planEffect
  if (!AFFECTED.test(pathname)) return {}
  const is = (verb, pattern) => method === verb && pattern.test(pathname)
  switch (scenario) {
    case 'slow':
      return { extraDelayMs: 2500 }
    case 'empty':
      if (is('GET', /^\/api\/exercises$/)) return { reply: { status: 200, body: [] } }
      if (is('GET', /^\/api\/chat\/sessions$/)) return { reply: { status: 200, body: { content: [], last: true, totalElements: 0 } } }
      return is('GET', /^\/api\/exercise-attempts\/current$/) ? { reply: { status: 200, body: { current: null } } } : {}
    case 'load-error':
      return is('GET', /^\/api\/exercises(\/\d+)?$/) ||
        is('POST', /^\/api\/exercises\/\d+\/attempts$/) ||
        is('GET', /^\/api\/exercise-attempts\/current$/) ||
        is('GET', /^\/api\/chat\/sessions(\/\d+\/messages)?$/) ||
        is('GET', /^\/api\/progress\//)
        ? { reply: { status: 500, message: 'Simulated server error (mock scenario "load-error")' } }
        : {}
    case 'save-error':
      return is('POST', /^\/api\/exercise-attempts\/\d+\/(responses|complete)$/)
        ? { reply: { status: 500, message: 'Simulated server error (mock scenario "save-error")' } }
        : {}
    case 'ai-down':
      return is('POST', /^\/api\/exercise-attempts\/\d+\/pronunciation\/\d+$/) || is('POST', /^\/api\/chat\/sessions\/\d+\/messages$/)
        ? { reply: { status: 503, message: 'Simulated AI outage (mock scenario "ai-down")' } }
        : {}
    case 'new-learner': {
      if (is('GET', /^\/api\/exercise-attempts\/current$/)) return { reply: { status: 200, body: { current: null } } }
      const body = method === 'GET' ? newLearnerReply(pathname, searchParams) : undefined
      return body ? { reply: { status: 200, body } } : {}
    }
    case 'grading':
      return is('GET', /^\/api\/progress\/skills$/) ? { reply: { status: 200, body: gradingSkillsReply() } } : {}
    default:
      return {}
  }
}

// --- Control page --------------------------------------------------------------------------------------------------

const APP_LINKS = [
  ['/', 'Trang chủ Tiến độ (module D): số liệu, biểu đồ, điểm kỹ năng, thành tích, thẻ "Tiếp tục"'],
  ['/exercises', 'Danh sách bài ngữ pháp (đủ 6 trình độ A1 đến C2)'],
  ['/exercises?skill=listening', 'Danh sách bài nghe'],
  ['/exercises?skill=pronunciation', 'Danh sách bài phát âm'],
  ['/exercises/lessons/1', 'Ngữ pháp "Thì hiện tại đơn" (đã có lịch sử tốt nhất 80%)'],
  ['/exercises/lessons/3', 'Ngữ pháp "Thì hiện tại hoàn thành" (đang làm dở 2/6 câu: mở ra là làm tiếp từ câu 3)'],
  ['/exercises/lessons/23', 'Phát âm "Trọng âm từ 2 âm tiết" (đang làm dở 2/6 mục)'],
  ['/exercises/lessons/7', 'Ngữ pháp C2 "Thức giả định" (bài cuối: nút "Về danh sách" thay cho "Bài tiếp theo")'],
  ['/exercises/lessons/14', 'Nghe C1 "Bài giảng ngắn về giấc ngủ" (phụ đề dài, không có tên người nói)'],
  ['/exercises/lessons/25', 'Phát âm C1 "Câu dài và ngữ điệu" (tô màu từng từ, từ bị bỏ sót)'],
  ['/exercises/lessons/99', 'Bài chưa có câu hỏi nào'],
  ['/exercises/lessons/999', 'Bài không tồn tại'],
  ['/plan', 'Kế hoạch học cá nhân (module D, D2): trình độ, việc nên làm, kế hoạch đang ở tuần 3, đặt lại mục tiêu, nhắc học'],
]

const CHECKLIST = [
  ['Khung chờ tải, nút đang xử lý', 'Chọn tình huống "Mạng chậm", rồi mở danh sách, mở bài, bấm "Kiểm tra".'],
  ['Màn "Chưa có bài tập"', 'Chọn "Chưa có bài".'],
  ['Lỗi tải và nút "Thử lại"', 'Chọn "Lỗi tải", mở danh sách hoặc một bài. Chuyển về "Bình thường" rồi bấm "Thử lại".'],
  ['Lỗi khi chấm câu hoặc nộp bài', 'Chọn "Lỗi lưu bài", mở một bài rồi bấm "Kiểm tra" (ngữ pháp) hoặc "Nộp bài" (nghe).'],
  ['"Kỷ lục mới!"', 'Làm đúng hết bài "Thì hiện tại đơn" (lịch sử có sẵn là 80%). Lần đầu hoàn thành một bài thì không hiện.'],
  ['Làm tiếp bài dở', 'Mở bài "Thì hiện tại hoàn thành" hoặc "Trọng âm từ 2 âm tiết": vào thẳng câu, mục chưa làm, câu cũ còn đáp án. Bấm "Làm lại từ đầu" để làm từ câu 1. Bài "Câu điều kiện loại 2" có lượt dở quá 7 ngày nên không hiện "Đang làm dở".'],
  ['"Câu cần xem lại"', 'Làm sai ít nhất một câu ngữ pháp rồi bấm "Xem kết quả".'],
  ['Phản hồi không có giải thích', 'Bài C1 "Đảo ngữ", câu 6.'],
  ['Điểm phát âm đỏ, cam, xanh', 'Mỗi mục có điểm lần đầu khác nhau (45 đến 84), mỗi lần "Thử lại" cộng 9 điểm.'],
  ['Từ đọc chưa chuẩn, từ bị bỏ sót', 'Bài C1 "Câu dài và ngữ điệu", mục 2, lần ghi âm đầu.'],
  ['"Bản ghi quá ngắn"', 'Bấm micro rồi bấm dừng ngay.'],
  ['"Không nhận diện được giọng nói"', 'Ghi âm trong lúc im lặng (hoặc tắt tiếng micro trong Windows).'],
  ['Micro bị chặn', 'Bấm biểu tượng ổ khóa cạnh thanh địa chỉ, chặn Micro, tải lại trang rồi bấm ghi âm.'],
  ['Chấm phát âm, trợ lý AI lỗi', 'Chọn "AI lỗi"; hoặc gõ tin nhắn có "#503" (AI lỗi) hay "#429" (gửi quá nhanh).'],
  ['Trợ lý: gợi ý và giải thích', 'Hỏi về một câu trước khi trả lời (chỉ gợi ý), rồi hỏi lại sau khi đã trả lời (giải thích đầy đủ).'],
  ['Trợ lý: lịch sử trò chuyện', 'Chat vài câu, bấm "Lịch sử" rồi mở lại phiên cũ (còn cả sau khi tải lại trang). "Lỗi tải" làm lịch sử báo lỗi, "Chưa có bài" làm lịch sử trống.'],
  ['Trang chủ: người mới', 'Chọn "Người mới": lời chào và nút bắt đầu, biểu đồ trống, radar trống, thẻ "Học tiếp" thay cho "Tiếp tục". Hành trình trình độ trống cần trình độ rỗng trong DB (xem lệnh bên dưới).'],
  ['Trang chủ: đang chấm Nói, Viết', 'Chọn "Đang chấm Nói, Viết": radar chỉ có Nghe, Đọc và nhãn "Đang chấm".'],
  ['Trang chủ: biểu đồ Ngày, Tuần, Tháng', 'Đổi khoảng thời gian và chỉ số. "Điểm kiểm tra": kỳ không làm bài để trống (—), không vẽ cột 0.'],
  ['Trang chủ: thời gian học', 'Mở một bài tập hoặc phiên flashcard, thao tác trong hơn 1 phút rồi quay về trang chủ: cột hôm nay có thêm phút học và streak được giữ.'],
  ['Nhãn "Trình độ của bạn"', 'Cần trình độ trong DB thật (xem lệnh bên dưới), rồi tải lại trang.'],
  ['Kế hoạch: theo dõi tuần này', 'Mở /plan: kế hoạch mẫu "Đạt B1 trong 3 tháng" đang ở tuần 3, số từ và bài tập mỗi tuần khớp biểu đồ trang chủ. Tuần vừa qua chưa đạt thì có cảnh báo nhẹ "chưa đạt mục tiêu" (tùy tài khoản).'],
  ['Kế hoạch: đặt mục tiêu, xem trước, áp dụng', 'Bấm "Đặt lại mục tiêu", chọn mục tiêu (hoặc "Mục tiêu khác"), bấm "Gợi ý lộ trình" (AI nghĩ khoảng 1 giây), rồi "Áp dụng kế hoạch". Chọn "Người mới" để thấy màn chưa có kế hoạch.'],
  ['Kế hoạch: AI lỗi, lỗi lưu, lỗi tải', 'Chọn "AI lỗi" rồi bấm "Gợi ý lộ trình"; "Lỗi lưu bài" rồi áp dụng kế hoạch, tạm dừng hoặc đổi giờ nhắc; "Lỗi tải" để thấy từng khối báo lỗi riêng.'],
]

function page(current, notice) {
  const scenarioButtons = SCENARIOS.map(
    (scenario) => `
      <a class="scenario${scenario.id === current ? ' active' : ''}" href="/__mock/scenario/${scenario.id}">
        <strong>${scenario.label}</strong><span>${scenario.description}</span>
      </a>`,
  ).join('')
  const links = APP_LINKS.map(([href, label]) => `<li><a href="${href}" target="_blank">${label}</a> <code>${href}</code></li>`).join('')
  const rows = CHECKLIST.map(([what, how]) => `<tr><td>${what}</td><td>${how}</td></tr>`).join('')
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dữ liệu giả · LinguaStep</title>
<style>
  body { margin: 0; background: #EDF0EF; color: #16211F; font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; display: flex; flex-direction: column; gap: 20px; }
  h1 { margin: 0; font-size: 26px; } h2 { margin: 0 0 10px; font-size: 18px; }
  section { background: #fff; border: 1px solid #D4DAD8; border-radius: 12px; padding: 20px; }
  .muted { color: #77857F; font-size: 13px; margin: 4px 0 0; }
  .notice { background: #EAF7EE; border: 1px solid #BEEBC9; color: #146C32; border-radius: 10px; padding: 10px 14px; font-weight: 600; }
  .scenarios { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
  .scenario { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid #D4DAD8; border-radius: 10px; color: #475551; text-decoration: none; }
  .scenario:hover { border-color: #12A594; }
  .scenario strong { color: #16211F; } .scenario span { font-size: 13px; }
  .scenario.active { border: 2px solid #12A594; background: #E2F5F2; }
  .scenario.active strong::after { content: " (đang chọn)"; color: #0B7B70; font-weight: 600; }
  a { color: #0B7B70; } ul { margin: 0; padding-left: 20px; } li { margin: 4px 0; }
  code { background: #EDF0EF; border-radius: 4px; padding: 1px 5px; font-size: 13px; }
  pre { background: #16211F; color: #D4DAD8; border-radius: 8px; padding: 12px; overflow-x: auto; font-size: 13px; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { border-top: 1px solid #D4DAD8; padding: 8px 6px; vertical-align: top; } td:first-child { font-weight: 600; width: 34%; }
  .reset { display: inline-block; margin-top: 8px; padding: 10px 16px; border-radius: 8px; background: #B02A2A; color: #fff; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<main>
  <div>
    <h1>Dữ liệu giả của module Bài tập</h1>
    <p class="muted">Chỉ có khi chạy <code>npm run dev:mock</code>. Tình huống lưu trong cookie nên áp dụng cho mọi tab của trình duyệt này; tải lại trang ứng dụng sau khi đổi. Dữ liệu làm bài nằm trong bộ nhớ, mất khi tắt server.</p>
  </div>
  ${notice ? `<p class="notice">${notice}</p>` : ''}
  <section>
    <h2>1. Chọn tình huống</h2>
    <div class="scenarios">${scenarioButtons}</div>
  </section>
  <section>
    <h2>2. Mở các màn trong ứng dụng</h2>
    <ul>${links}</ul>
  </section>
  <section>
    <h2>3. Muốn xem màn nào thì làm gì</h2>
    <table>${rows}</table>
  </section>
  <section>
    <h2>4. Nhãn "Trình độ của bạn"</h2>
    <p class="muted">Trình độ lấy từ tài khoản thật trong DB (đăng nhập luôn qua backend thật). Chạy trong Git Bash, thay email của bạn, rồi tải lại trang (F5):</p>
    <pre>docker exec datn-postgres psql -U datn -d datn -c "UPDATE users SET current_level = 'B1' WHERE email = 'email-cua-ban@example.com';"</pre>
    <p class="muted">Muốn bỏ trình độ: thay <code>'B1'</code> bằng <code>NULL</code>.</p>
  </section>
  <section>
    <h2>5. Làm lại từ đầu</h2>
    <p class="muted">Xóa mọi lượt làm bài và cuộc trò chuyện đã lưu trong bộ nhớ; mỗi tài khoản lại có lịch sử mẫu như lúc mới chạy.</p>
    <a class="reset" href="/__mock/reset">Xóa dữ liệu làm bài</a>
  </section>
</main>
</body>
</html>`
}

function redirect(res, location, cookie) {
  res.statusCode = 302
  if (cookie) res.setHeader('Set-Cookie', cookie)
  res.setHeader('Location', location)
  res.end()
}

/** Answers /__mock (the control page) and its actions; returns false for any other request. */
export function serveControlPanel(req, res) {
  const url = new URL(req.url, 'http://localhost')
  if (req.method !== 'GET' || !url.pathname.startsWith('/__mock')) return false

  const chosen = /^\/__mock\/scenario\/([\w-]+)$/.exec(url.pathname)?.[1]
  if (chosen && SCENARIOS.some((scenario) => scenario.id === chosen)) {
    redirect(res, `/__mock?set=${chosen}`, `${COOKIE}=${chosen}; Path=/; SameSite=Lax`)
    return true
  }
  if (url.pathname === '/__mock/reset') {
    resetExerciseData()
    resetChatData()
    resetProgressData()
    resetPlanData()
    redirect(res, '/__mock?reset=1')
    return true
  }

  // A redirect sets the cookie in the same response, so read the new value from the query string first.
  const current = url.searchParams.get('set') ?? scenarioOf(req)
  const label = SCENARIOS.find((scenario) => scenario.id === current)?.label
  const notice = url.searchParams.has('reset')
    ? 'Đã xóa dữ liệu làm bài.'
    : url.searchParams.has('set') && label
      ? `Đã chọn tình huống "${label}". Tải lại trang ứng dụng để áp dụng.`
      : ''
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(page(current, notice))
  return true
}
