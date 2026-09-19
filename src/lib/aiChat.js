import { supabase, isDemoMode, invokeFunction, isAuthError } from './supabase'
import { SPECIALTIES, guessSpecialtyFromText, specialtyBySlug } from '../data/content'

const LS_THREADS = 'dermacare_ai_threads_v1'

// Gọi Edge Function ai-chat (key giữ server-side).
// - timeout 25s + retry 1 lần: mạng chập chờn vẫn trả lời được
// - hết hạn phiên (401/token hết hạn): báo rõ để đăng nhập lại
// - mọi lỗi khác: dự phòng offline, KHÔNG bao giờ treo/không trả lời
export async function askAI(messages) {
  if (!isDemoMode && supabase) {
    try {
      const data = await invokeFunction('ai-chat', { messages: messages.slice(-12) }, { timeoutMs: 25000, retries: 1 })
      if (data?.reply) {
        return {
          reply: data.reply,
          level: data.level || 'none',
          suggested_specialty: data.suggested_specialty || null,
          skintype: data.skintype || null,
          quick: Array.isArray(data.quick) ? data.quick.slice(0, 3) : [],
          sources: Array.isArray(data.sources) ? data.sources.slice(0, 3) : [],
          source: 'ai',
        }
      }
      throw new Error('AI trống')
    } catch (e) {
      if (isAuthError(e)) {
        return {
          reply: 'Phiên đăng nhập của bạn đã hết hạn nên mình chưa gọi được AI đầy đủ. Bạn đăng nhập lại giúp mình nhé, rồi hỏi tiếp.',
          level: 'none',
          suggested_specialty: null,
          skintype: null,
          quick: [],
          sources: [],
          source: 'offline',
          authExpired: true,
        }
      }
      console.warn('ai-chat fallback (offline):', e.message)
    }
  }
  return offlineReply(messages)
}

function offlineReply(messages) {
  const userMsgs = messages.filter((m) => m.role === 'user')
  const last = userMsgs[userMsgs.length - 1]?.content || ''

  // Chào hỏi xã giao: không đoán bệnh bừa
  if (/^(xin chào|chào|chao|hello|hi|hey|alo|yo|hola|chào bạn|chao ban)[\s!.,]*$/i.test(last.trim())) {
    return {
      reply: 'Chào bạn, mình là trợ lý da liễu DermaCare. Bạn bao nhiêu tuổi và đang gặp vấn đề da gì? Kể càng cụ thể (vị trí, bao lâu, ngứa/đau) mình định hướng càng chuẩn nhé.',
      level: 'none',
      suggested_specialty: null,
      skintype: null,
      quick: ['Tôi bị mụn', 'Da bị ngứa', 'Tư vấn loại da'],
      sources: [],
      source: 'offline',
    }
  }

  // Chỉ đoán theo tin nhắn MỚI NHẤT, không lôi chuyện cũ vào
  const slug = guessSpecialtyFromText(last)
  const spec = slug ? specialtyBySlug(slug) : null
  if (spec) {
    return {
      reply:
        `Mô tả của bạn giống nhóm “${spec.name}” (${spec.diseases.slice(0, 3).join(', ')}). ` +
        `Bạn cho mình biết thêm: bao lâu rồi, ở vị trí nào, có ngứa/đau/mủ không, và bạn bao nhiêu tuổi để mình định hướng kỹ hơn nhé.`,
      level: 'none',
      suggested_specialty: slug,
      skintype: null,
      quick: ['Vài ngày', '1-2 tuần', 'Hơn 1 tháng'],
      sources: [],
      source: 'offline',
    }
  }
  const list = SPECIALTIES.map((s) => s.name).join(', ')
  return {
    reply:
      `Mình chưa nhận diện được nhóm bệnh. DermaCare có 8 nhóm: ${list}. ` +
      `Bạn bao nhiêu tuổi và mô tả thêm (vị trí, màu sắc, ngứa/đau, bao lâu rồi) giúp mình nhé.`,
    level: 'none',
    suggested_specialty: null,
    skintype: null,
    quick: ['Mụn', 'Ngứa / dị ứng', 'Nám / sắc tố'],
    sources: [],
    source: 'offline',
  }
}

// ---- Nhiều đoạn chat (lưu local, không đụng dữ liệu server) ----
export function loadThreads() {
  try {
    const t = JSON.parse(localStorage.getItem(LS_THREADS) || '[]')
    return Array.isArray(t) ? t : []
  } catch {
    return []
  }
}

export function saveThread(thread) {
  try {
    const all = loadThreads()
    const idx = all.findIndex((t) => t.id === thread.id)
    const row = { ...thread, updatedAt: new Date().toISOString(), messages: thread.messages.slice(-60) }
    if (idx >= 0) all[idx] = row
    else all.unshift(row)
    localStorage.setItem(LS_THREADS, JSON.stringify(all.slice(0, 20)))
  } catch {}
}

export function deleteThread(id) {
  try {
    localStorage.setItem(LS_THREADS, JSON.stringify(loadThreads().filter((t) => t.id !== id)))
  } catch {}
}

export function newThreadId() {
  return `th-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function threadTitle(messages) {
  const first = messages.find((m) => m.role === 'user')?.content || 'Đoạn chat mới'
  return first.slice(0, 42) + (first.length > 42 ? '…' : '')
}

// Tóm tắt hội thoại để truyền sang trang đặt lịch (không ghi chẩn đoán vào hồ sơ)
export function summarizeForBooking(messages) {
  const lines = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter(Boolean)
    .slice(0, 6)
  if (!lines.length) return ''
  return `Mô tả từ trợ lý AI: ${lines.join(' | ')}`.slice(0, 500)
}
