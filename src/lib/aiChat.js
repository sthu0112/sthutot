import { supabase, isDemoMode, invokeFunction, isAuthError } from './supabase'
import { SPECIALTIES, guessSpecialtyFromText, specialtyBySlug } from '../data/content'

const LS_THREADS = 'dermacare_ai_threads_v1'

// Từ khóa NGOÀI chủ đề web (học tập, code, tài chính, thể thao, game, chính trị...).
// Chỉ chặn khi chắc chắn lạc đề + không dính từ khóa da liễu/đặt lịch.
const OFFTOPIC_KEYS = [
  'toán', 'vật lý', 'hóa học', 'ngữ văn', 'văn học', 'lịch sử', 'địa lý', 'tiếng anh',
  'phương trình', 'tích phân', 'đạo hàm', 'hình học', 'giải bài', 'làm hộ bài',
  'code', 'python', 'java', 'javascript', 'lập trình', 'html', 'sql',
  'chứng khoán', 'cổ phiếu', 'bitcoin', 'tiền ảo', 'forex',
  'bóng đá', 'ngoại hạng', 'world cup', 'cá độ',
  'liên quân', 'pubg', 'free fire', 'game ',
  'bầu cử', 'tổng thống', 'chính trị', 'đảng ',
  'thời tiết', 'tỷ giá', 'giá vàng', 'xổ số', 'lô đề',
  'phim ', 'ca sĩ', 'diễn viên', 'nhạc ',
  'ô tô', 'xe máy', 'nhà đất', 'bất động sản',
  'nấu ăn', 'công thức nấu', 'du lịch', 'vé máy bay', 'khách sạn',
]
const INTOPIC_KEYS = [
  'da', 'mụn', 'nám', 'ngứa', 'dị ứng', 'khám', 'bác sĩ', 'đặt lịch', 'phòng khám',
  'thuốc', 'kem', 'dưỡng', 'chống nắng', 'tóc', 'dị ứng', 'sẹo', 'thâm', 'nốt ruồi',
  'viêm', 'nấm', 'rôm', 'chàm', 'vảy', 'đỏ', 'rát', 'khô', 'dầu', 'nhờn', 'lão hóa',
  'soi da', 'cẩm nang', 'bảo hiểm y tế', 'giá khám', 'địa chỉ',
]

function isOffTopic(text = '') {
  const t = ` ${text.toLowerCase().trim()} `
  if (t.trim().length < 8) return false // tin quá ngắn (tuổi, vâng...) -> cho qua để hỏi tiếp
  if (INTOPIC_KEYS.some((k) => t.includes(k))) return false
  return OFFTOPIC_KEYS.some((k) => t.includes(k))
}

function offTopicReply() {
  return {
    reply: 'Mình là trợ lý da liễu nên chỉ tư vấn được chuyện về da, đặt lịch khám, soi da và cẩm nang thôi. Bạn đang gặp vấn đề da gì (ở vị trí nào, bao lâu rồi, có ngứa/đau không)? Kể mình nghe nhé.',
    level: 'none',
    suggested_specialty: null,
    skintype: null,
    quick: ['Tôi bị mụn', 'Da bị ngứa', 'Đặt lịch khám'],
    sources: [],
    source: 'offline',
  }
}

// Gọi Edge Function ai-chat (key giữ server-side).
// - timeout 25s + retry 1 lần: mạng chập chờn vẫn trả lời được
// - hết hạn phiên (401/token hết hạn): báo rõ để đăng nhập lại
// - mọi lỗi khác: dự phòng offline, KHÔNG bao giờ treo/không trả lời
export async function askAI(messages) {
  const lastUserText = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || ''
  if (isOffTopic(lastUserText)) return offTopicReply()
  if (!isDemoMode && supabase) {
    try {
      const data = await invokeFunction('ai-chat', { messages: messages.slice(-12) }, { timeoutMs: 30000, retries: 2 })
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
      // Lý do thật để UI báo đúng (timeout/bận/chưa cấu hình) thay vì đoán bừa
      const offlineReason =
        e?.code === 'timeout' ? 'timeout' :
        /chưa được cấu hình|503/i.test(e?.message || '') ? 'config' : 'busy'
      console.warn('ai-chat fallback (offline):', e.message)
      const fb = offlineReply(messages)
      fb.offlineReason = offlineReason
      return fb
    }
  }
  const fb = offlineReply(messages)
  fb.offlineReason = 'config'
  return fb
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
      `Mình chưa nhận diện được nhóm bệnh. DermaCare có ${SPECIALTIES.length} nhóm: ${list}. ` +
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
