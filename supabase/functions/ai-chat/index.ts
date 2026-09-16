// DermaCare Edge Function: ai-chat
// Trợ lý da liễu AI — key Groq giữ server-side, web chỉ gọi qua đây.
// Kho kiến thức kb.json KHÔNG bị thay đổi khi đổi nhà cung cấp AI.
// Deploy: Supabase Dashboard -> Edge Functions -> New Function (tên ai-chat) -> dán nguyên file này
//         + thêm secret GROQ_API_KEY (Project Settings -> Edge Functions -> Secrets)
// Kho kb.json được function tự tải từ repo GitHub (đã public), KHÔNG cần upload thêm file nào.
// Secrets (optional): GROQ_API_KEY (bắt buộc), AI_MODEL (mặc định llama-3.3-70b-versatile)

// Nguồn sự thật của kho kiến thức (file kb.json cùng thư mục, đã push GitHub)
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

// Tách từ tiếng Việt đơn giản để chấm điểm tài liệu liên quan
function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function retrieve(docs: Doc[], question: string, maxChars = 6000): string {
  const keys = new Set(keywords(question))
  if (!keys.size) return ''
  const scored = docs.map((d) => {
    const body = `${d.title} ${d.content}`.toLowerCase()
    let score = 0
    for (const k of keys) if (body.includes(k)) score += k.length > 4 ? 2 : 1
    return { d, score }
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
  let out = ''
  for (const { d } of scored) {
    const chunk = `\n\n[Nguồn: ${d.title}]\n${d.content.slice(0, 3000)}`
    if ((out + chunk).length > maxChars) break
    out += chunk
  }
  return out
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

const SYSTEM_PROMPT = `Bạn là trợ lý da liễu của DermaCare (Việt Nam), tư vấn sơ bộ, thân thiện, xưng "mình", gọi người dùng là "bạn".
Quy tắc:
- Trả lời NGẮN GỌN (tối đa 150 từ), tiếng Việt, dễ hiểu, dùng gạch đầu dòng khi liệt kê.
- Chỉ dựa vào TÀI LIỆU THAM KHẢO dưới đây + kiến thức da liễu phổ thông. Không bịa tên thuốc liều lượng cụ thể.
- KHÔNG chẩn đoán chắc chắn ("bạn bị X"); chỉ nói "có thể liên quan đến...", "giống biểu hiện của...".
- Dấu hiệu nặng (lan nhanh, đau nhiều, sốt, mủ nhiều, nốt ruồi đổi dạng/chảy máu) -> khuyên đi khám sớm.
- Kết thúc bằng 1 câu gợi ý đặt lịch đúng chuyên khoa khi phù hợp.
- Từ chối lịch sự các câu hỏi ngoài da liễu/sức khỏe da.`

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
  const messages = (body.messages ?? []).filter((m) => m.role === 'user' || m.role === 'assistant').slice(-10)
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser?.content?.trim()) {
    return new Response(JSON.stringify({ error: 'Thiếu tin nhắn' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const context = retrieve(await loadKB().catch(() => [] as Doc[]), lastUser.content)
  const suggested_specialty = guessSpecialty(lastUser.content)

  // Groq dùng API tương thích OpenAI: system + lịch sử hội thoại
  const chatMessages = [
    { role: 'system', content: SYSTEM_PROMPT + (context ? `\n\nTÀI LIỆU THAM KHẢO:${context}` : '') },
    ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
  ]

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: chatMessages,
      temperature: 0.4,
      max_tokens: 500,
    }),
  })

  if (!groqRes.ok) {
    const errText = await groqRes.text()
    console.error('Groq error', groqRes.status, errText.slice(0, 300))
    return new Response(JSON.stringify({ error: 'AI đang bận, thử lại sau', offline: true }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const data = await groqRes.json()
  const reply: string =
    data?.choices?.[0]?.message?.content?.trim() ||
    'Mình chưa hiểu rõ, bạn mô tả thêm triệu chứng giúp mình nhé.'

  return new Response(JSON.stringify({ reply, suggested_specialty }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
