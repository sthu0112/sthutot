import { supabase, isDemoMode, invokeFunction } from './supabase'
import { SPECIALTIES } from '../data/content'

// Cẩm nang 3 tầng, KHÔNG bao giờ trắng trang:
//   1) Edge Function cam-nang (bài trong kho Supabase/kb.json)
//   2) Bảng `articles` trên Supabase (nếu bạn tạo thêm bài trực tiếp)
//   3) Bài có sẵn trong app (từ 8 nhóm chuyên khoa) — luôn có
function categoryOf(name, diseases = []) {
  const t = `${name} ${(diseases || []).join(' ')}`.toLowerCase()
  if (t.includes('mụn') || t.includes('sẹo')) return 'Mụn trứng cá & Sẹo mụn'
  if (t.includes('viêm da') || t.includes('dị ứng') || t.includes('mề đay')) return 'Viêm da & Dị ứng'
  if (t.includes('nám') || t.includes('sắc tố') || t.includes('tàn nhang')) return 'Nám & Sắc tố'
  if (t.includes('vảy nến') || t.includes('rosacea')) return 'Vảy nến & Viêm da mạn'
  if (t.includes('nấm') || t.includes('nhiễm trùng') || t.includes('herpes') || t.includes('zona')) return 'Nhiễm trùng da'
  if (t.includes('tóc')) return 'Tóc & Da đầu'
  return 'Da liễu tổng quát'
}

function localArticles() {
  return (SPECIALTIES || []).map((s) => {
    const benh = (s.diseases || []).join(', ')
    const content = [
      s.desc || '',
      benh ? `Các tình trạng thường gặp: ${benh}.` : '',
      'Bài viết ngắn gọn, dễ hiểu. Thông tin chỉ tham khảo, không thay thế khám trực tiếp. Nếu tổn thương lan rộng, đau nhiều, chảy mủ/máu hoặc kèm sốt, bạn nên đi khám sớm.',
      'Muốn được định hướng cho trường hợp của mình, bạn có thể hỏi trợ lý AI hoặc đặt lịch khám da liễu.',
    ].filter(Boolean).join('\n\n')
    return {
      slug: s.slug,
      title: s.name,
      excerpt: (s.desc || '').slice(0, 180),
      category: categoryOf(s.name, s.diseases),
      content,
      source: 'local',
    }
  })
}

async function tableArticles() {
  if (isDemoMode || !supabase) return null
  // Bảng do bạn tự tạo trên Supabase (nếu có): articles(slug,title,excerpt,content,category)
  const { data, error } = await supabase.from('articles').select('slug,title,excerpt,content,category').limit(100)
  if (error || !data?.length) return null
  return data
}

export async function listArticles() {
  const errors = []
  if (!isDemoMode && supabase) {
    try {
      const data = await invokeFunction('cam-nang', { action: 'list' }, { timeoutMs: 20000, retries: 1 })
      if (data?.articles?.length) return data.articles
    } catch (e) { errors.push(e.message) }
    try {
      const rows = await tableArticles()
      if (rows) return rows
    } catch (e) { errors.push(e.message) }
  }
  const local = localArticles()
  if (local.length) return local
  throw new Error(errors[0] || 'Chưa tải được cẩm nang')
}

export async function getArticle(slug) {
  if (!isDemoMode && supabase) {
    try {
      const data = await invokeFunction('cam-nang', { action: 'get', slug }, { timeoutMs: 20000, retries: 1 })
      if (data && (data.content || data.title)) return data
    } catch {}
    try {
      const { data, error } = await supabase.from('articles').select('slug,title,excerpt,content,category').eq('slug', slug).maybeSingle()
      if (!error && data) return data
    } catch {}
  }
  const found = localArticles().find((a) => a.slug === slug)
  if (found) return found
  throw new Error('Không tìm thấy bài viết')
}
