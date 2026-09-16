// DermaCare Edge Function: cam-nang
// Cẩm nang da liễu — bài viết lấy từ chính kho kb.json (không đụng dữ liệu gốc).
// Deploy: Dashboard -> Edge Functions -> New Function (tên cam-nang) -> dán nguyên file này -> Deploy.
// POST { action: 'list' } -> [{ slug, title, excerpt, category }]
// POST { action: 'get', slug } -> { slug, title, content, category, source }

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

function slugify(text: string, i: number): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${base || 'bai-viet'}-${i}`
}

function categoryOf(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('mụn')) return 'Mụn trứng cá & Sẹo mụn'
  if (t.includes('viêm da') || t.includes('mề đay') || t.includes('mẩn ngứa')) return 'Viêm da & Dị ứng'
  if (t.includes('nám') || t.includes('sắc tố') || t.includes('tàn nhang')) return 'Nám & Sắc tố'
  if (t.includes('vảy nến')) return 'Vảy nến & Viêm da mạn'
  if (t.includes('nấm') || t.includes('lang ben') || t.includes('herpes') || t.includes('zona') || t.includes('hpv') || t.includes('giang mai') || t.includes('sùi mào gà')) return 'Nhiễm trùng da'
  if (t.includes('rụng tóc') || t.includes('tóc')) return 'Tóc & Da đầu'
  if (t.includes('chăm sóc') || t.includes('cham soc')) return 'Chăm sóc da'
  return 'Da liễu tổng quát'
}

function excerptOf(content: string): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  return clean.length > 180 ? clean.slice(0, 180).trim() + '…' : clean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  let body: { action?: string; slug?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body phải là JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let docs: Doc[]
  try {
    docs = await loadKB()
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Không tải được cẩm nang', articles: [] }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const articles = docs.map((d, i) => ({
    slug: slugify(d.title, i),
    title: d.title.replace(/\.(docx|pdf)$/i, '').trim(),
    excerpt: excerptOf(d.content),
    category: categoryOf(d.title),
    source: d.source,
  }))

  if (body.action === 'get') {
    const found = articles.find((a) => a.slug === body.slug)
    if (!found) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy bài viết' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const idx = articles.indexOf(found)
    return new Response(JSON.stringify({ ...found, content: docs[idx].content.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ articles }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
