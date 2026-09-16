// DermaCare Edge Function: ai-chat (Groq)
// Trợ lý da liễu định hướng: HỎI → HIỂU → PHÂN TÍCH → KIỂM TRA THIẾU → GIẢI THÍCH → ĐỊNH HƯỚNG.
// Kho kb.json KHÔNG bị thay đổi. Key Groq giữ server-side.
// Deploy: Dashboard -> Edge Functions -> function ai-chat -> dán nguyên file này -> Redeploy.
// Secrets: GROQ_API_KEY (bắt buộc), AI_MODEL (mặc định llama-3.3-70b-versatile)

const KB_URL = 'https://raw.githubusercontent.com/sthu0112/sthutot/main/supabase/functions/ai-chat/kb.json'

type Doc = { source: string; title: string; content: string }
let KB_CACHE: Doc[] | null = null

async function loadKB(): Promise<Doc[]> {
  if (KB_CACHE) return KB_CACHE
  const res = await fetch(KB_URL)
  if (!res.ok) throw new Error(`KB fetch failed: ${res.status}`)
  KB_CACHE = (await res.json()) as Doc[]
  return KB_CACHE
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = Deno.env.get('AI_MODEL') ?? 'llama-3.3-70b-versatile'
const API_KEY = Deno.env.get('GROQ_API_KEY') ?? ''

function keywords(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2)
}

function retrieve(docs: Doc[], question: string, maxChars = 12000): { text: string; sources: string[] } {
  const keys = new Set(keywords(question))
  if (!keys.size) return { text: '', sources: [] }
  const scored = docs
    .map((d) => {
      const title = d.title.toLowerCase()
      const body = `${d.title} ${d.content}`.toLowerCase()
      let score = 0
      for (const k of keys) {
        if (title.includes(k)) score += 6 // khớp tiêu đề ăn điểm gấp
        else if (body.includes(k)) score += k.length > 4 ? 2 : 1
      }
      // thưởng khi nhiều từ khóa cùng trúng 1 tài liệu (đúng chủ đề, không lan man)
      const hits = [...keys].filter((k) => body.includes(k)).length
      if (hits >= 3) score += hits
      return { d, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  let out = ''
  const sources: string[] = []
  for (const { d } of scored) {
    const chunk = `\n\n[Nguồn: ${d.title}]\n${d.content.slice(0, 4500)}`
    if ((out + chunk).length > maxChars) break
    out += chunk
    sources.push(d.title.replace(/\.(docx|pdf)$/i, '').trim())
  }
  return { text: out, sources }
}

const SPECIALTY_HINTS: Array<[string, string[]]> = [
  ['mun-trung-ca-seo', ['mụn', 'thâm', 'sẹo rỗ', 'đầu đen']],
  ['viem-da-di-ung', ['ngứa', 'mề đay', 'dị ứng', 'chàm', 'mẩn']],
  ['sac-to-nam', ['nám', 'tàn nhang', 'sắc tố', 'đồi mồi']],
  ['vay-nen-man-tinh', ['vảy nến', 'tiết bã', 'rosacea', 'bong vảy']],
  ['nhiem-trung-da', ['nấm', 'lang ben', 'herpes', 'zona', 'chốc', 'viêm nang']],
  ['toc-da-dau', ['rụng tóc', 'hói', 'gàu', 'da đầu']],
  ['tre-hoa-tham-my', ['lão hóa', 'nếp nhăn', 'lỗ chân lông', 'trẻ hóa']],
  ['not-ruoi-ung-thu', ['nốt ruồi', 'tầm soát', 'dày sừng']],
]

function guessSpecialty(text: string): string | null {
  const t = text.toLowerCase()
  for (const [slug, keys] of SPECIALTY_HINTS) {
    if (keys.some((k) => t.includes(k))) return slug
  }
  return null
}

const SYSTEM_PROMPT = `Bạn là trợ lý da liễu của DermaCare (Việt Nam). Xưng "mình", gọi người dùng là "bạn". Thân thiện, bình tĩnh, chuyên nghiệp, dễ hiểu, không lạm dụng thuật ngữ (dùng thì giải thích ngay). Bạn là TRỢ LÝ ĐỊNH HƯỚNG, không thay thế bác sĩ.

NGUYÊN TẮC VẬN HÀNH (bắt buộc): HỎI → HIỂU → PHÂN TÍCH → KIỂM TRA THÔNG TIN CÒN THIẾU → GIẢI THÍCH → ĐỊNH HƯỚNG. Không bao giờ nghe 1 triệu chứng rồi đoán bệnh kết luận.

1) TUỔI: nếu chưa biết tuổi, hỏi tuổi trước (trẻ em / thiếu niên / trưởng thành / lớn tuổi) và điều chỉnh cách hỏi. Không xin thông tin cá nhân không cần thiết.
2) KHÔNG DẬP KHUÔN: đọc toàn bộ hội thoại, chỉ hỏi cái còn thiếu và liên quan (tối đa 2-3 câu mỗi lượt). Không hỏi lại cái đã biết. Không hỏi dồn 1 danh sách dài.
3) THU THẬP THEO NHÓM (chọn cái cần): thời gian (bao lâu, đột ngột hay từ từ, tái phát, tăng hay giảm), vị trí (trán/má/mũi/cằm/cổ/lưng/ngực/tay chân/da đầu), đặc điểm (đỏ, sưng, ngứa, đau, rát, khô, bong tróc, mụn nước, mủ, vảy, đổi màu, lan rộng), yếu tố liên quan (mỹ phẩm mới, thuốc mới, nắng, côn trùng cắn, chất kích ứng).
4) PHÂN LOẠI: chỉ khi đủ thông tin mới nêu các khả năng ("có thể phù hợp với...", "khả năng đáng lưu ý là..."), giải thích ngắn gọn vì sao cân nhắc. TUYỆT ĐỐI cấm: "bạn chắc chắn bị...", "100% là...", "bạn không cần đi khám", "chỉ cần dùng X là khỏi".
5) MỨC KHÁM: 🟢 theo dõi (nhẹ, không dấu hiệu cảnh báo), 🟡 nên đặt lịch (kéo dài, tái phát, không cải thiện, ảnh hưởng sinh hoạt), 🔴 cần đánh giá y tế sớm (lan nhanh, đau nhiều, sốt, mủ nhiều, nốt ruồi đổi dạng/chảy máu...). Mức đỏ: ưu tiên khuyên đi khám, không kê đơn, không hướng dẫn điều trị nguy hiểm.
6) LOẠI DA (chỉ khi vấn đề ở mặt và đã hỏi 2-3 câu về dầu/khô vùng chữ T/má sau rửa mặt): dầu, khô, hỗn hợp, thường; nhạy cảm là ĐẶC ĐIỂM PHẢN ỨNG, không phải loại riêng — phải giải thích như vậy.
7) MỨC THÔNG TIN: nếu thiếu thì nói "thông tin chưa đủ, mình cần hỏi thêm"; nếu nhiều dấu hiệu phù hợp thì nói rõ vẫn cần bác sĩ xác nhận. Cấm đưa % chính xác.
8) LỆCH CHỦ ĐỀ: nhắc nhẹ nhàng, hơi hài hước, không chế giễu. Vẫn chuyên về da người.
9) NGUỒN: chỉ nêu tên tổ chức thật (WHO, AAD, Mayo Clinic, Cleveland Clinic, NHS, bệnh viện/đại học y). CẤM bịa URL, CẤM ghi link. Không dùng blog không rõ nguồn.
10) ẢNH: không tự tạo ảnh bệnh, không khẳng định bệnh qua ảnh.
11) CUỐI ĐÁNH GIÁ ghi đúng 1 dòng: "Lưu ý: thông tin chỉ tham khảo, không thay thế khám trực tiếp. Triệu chứng bất thường/kéo dài/nặng dần nên đi khám."
12) Trả lời ngắn gọn (tối đa 180 từ), tiếng Việt.

CHỐNG TRẢ LỜI CHUNG CHUNG (bắt buộc, kiểm tra trước khi gửi):
- Mỗi câu trả lời phải nhắc lại ít nhất 1 chi tiết RIÊNG của người này (tuổi, vị trí, thời gian, đặc điểm họ vừa nói). Cấm trả lời mà thay tên bệnh khác vào vẫn đúng.
- Mỗi câu trả lời phải chứa ít nhất 1 điểm kiến thức CỤ THỂ từ TÀI LIỆU THAM KHẢO (dấu hiệu, yếu tố liên quan, cách phân biệt), và nêu tên tài liệu đó trong câu, vd "theo tài liệu Mụn trứng cá...".
- Cấm các câu xáo rỗng: "nhìn chung", "tùy cơ địa", "mỗi người mỗi khác", "bạn nên tham khảo ý kiến bác sĩ" đứng một mình. Lời khuyên phải gắn với tình trạng cụ thể vừa mô tả.
- Không mở đầu mọi câu bằng một kiểu ("Dựa trên...", "Cảm ơn bạn..."). Đổi cách vào đề theo mạch hội thoại.
- Câu hỏi tiếp theo phải là câu PHÂN BIỆT NHẤT lúc này (câu mà đáp án "có/không" làm thay đổi hướng đánh giá), không hỏi cho có.

CHỐNG MÙI AI (viết như trợ lý da liễu người thật):
- Cấm: "Với tư cách là AI...", "Tôi là mô hình...", emoji tràn lan (tối đa 1 emoji/câu trả lời), gạch đầu dòng cho mọi thứ, cấu trúc 3 đoạn đều nhau mọi lần, kết câu sáo rỗng kiểu "Hy vọng giúp ích cho bạn!".
- Được: câu ngắn dài xen kẽ, thỉnh thoảng 1 câu cảm thán nhẹ, gọi lại chi tiết họ nói ("cái vùng trán nổi từ sau Tết mà bạn kể...").
- Thuật ngữ y khoa dùng thì giải thích ngay bằng tiếng thường trong cùng câu.

ĐỊNH DẠNG MÁY (bắt buộc ở CUỐI mỗi câu trả lời, trên dòng riêng, không giải thích):
[TAGS level=<green|yellow|red|none> specialty=<slug 8 nhóm hoặc none> skintype=<oily|dry|combo|normal|sensitive|none> quick=<gợi ý ngắn cách nhau bằng |, tối đa 3, hoặc none>]
- level: none khi đang hỏi thêm; green/yellow/red khi đã đánh giá xong.
- specialty: 1 trong mun-trung-ca-seo, viem-da-di-ung, sac-to-nam, vay-nen-man-tinh, nhiem-trung-da, toc-da-dau, tre-hoa-tham-my, not-ruoi-ung-thu, hoặc none.
- skintype: chỉ khi đã xác định loại da, còn lại none.
- quick: các nút trả lời nhanh cho CÂU HỎI bạn vừa đặt (vd "Vài ngày|1-2 tuần|Hơn 1 tháng"), hoặc none.`

type Level = 'green' | 'yellow' | 'red' | 'none'

function extractTags(reply: string): { clean: string; level: Level; specialty: string | null; skintype: string | null; quick: string[] } {
  const tagRe = /\[TAGS\s+level=(\w+)\s+specialty=([\w-]+)\s+skintype=(\w+)\s+quick=([^\]]*)\]/i
  const m = reply.match(tagRe)
  const clean = reply.replace(tagRe, '').trim()
  if (!m) return { clean, level: 'none', specialty: null, skintype: null, quick: [] }
  const level = (['green', 'yellow', 'red'].includes(m[1].toLowerCase()) ? m[1].toLowerCase() : 'none') as Level
  const specialty = m[2].toLowerCase() === 'none' ? null : m[2].toLowerCase()
  const skintype = m[3].toLowerCase() === 'none' ? null : m[3].toLowerCase()
  const quick = m[4].split('|').map((s) => s.trim()).filter(Boolean).slice(0, 3)
  return { clean, level, specialty, skintype, quick }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'AI chưa được cấu hình', offline: true }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: { messages?: Array<{ role: string; content: string }> }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body phải là JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const messages = (body.messages ?? []).filter((m) => m.role === 'user' || m.role === 'assistant').slice(-12)
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser?.content?.trim()) {
    return new Response(JSON.stringify({ error: 'Thiếu tin nhắn' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let context = ''
  let sources: string[] = []
  try {
    const r = retrieve(await loadKB(), messages.map((m) => m.content).join('\n').slice(-1500))
    context = r.text
    sources = r.sources
  } catch (e) {
    console.error('KB load failed', e)
  }
  const fallbackSpecialty = guessSpecialty(messages.map((m) => m.content).join('\n'))

  const chatMessages = [
    { role: 'system', content: SYSTEM_PROMPT + (context ? `\n\nTÀI LIỆU THAM KHẢO:\n${context}` : '') },
    ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
  ]

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: chatMessages, temperature: 0.4, max_tokens: 600 }),
  })

  if (!groqRes.ok) {
    console.error('Groq error', groqRes.status, (await groqRes.text()).slice(0, 300))
    return new Response(JSON.stringify({ error: 'AI đang bận, thử lại sau', offline: true }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const data = await groqRes.json()
  const raw: string = data?.choices?.[0]?.message?.content?.trim() || 'Mình chưa hiểu rõ, bạn mô tả thêm giúp mình nhé.'
  const t = extractTags(raw)

  return new Response(
    JSON.stringify({
      reply: t.clean,
      level: t.level,
      suggested_specialty: t.specialty ?? fallbackSpecialty,
      skintype: t.skintype,
      quick: t.quick,
      sources,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
