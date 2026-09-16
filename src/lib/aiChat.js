import { supabase, isDemoMode } from './supabase'
import { SPECIALTIES, guessSpecialtyFromText, specialtyBySlug } from '../data/content'

const LS_CHAT = 'dermacare_ai_chat_v1'

// Gọi Edge Function ai-chat (key Gemini giữ server-side). Hết quota/chưa cấu hình -> offline fallback.
export async function askAI(messages) {
  if (!isDemoMode && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: messages.slice(-10) },
      })
      if (error) throw error
      if (data?.reply) return { reply: data.reply, suggested_specialty: data.suggested_specialty || null, source: 'ai' }
      throw new Error('AI trống')
    } catch (e) {
      console.warn('ai-chat fallback (offline):', e.message)
    }
  }
  return offlineReply(messages)
}

function offlineReply(messages) {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const slug = guessSpecialtyFromText(last)
  const spec = slug ? specialtyBySlug(slug) : null
  if (spec) {
    return {
      reply:
        `Mô tả của bạn giống nhóm “${spec.name}” (${spec.diseases.slice(0, 3).join(', ')}). ` +
        `Bạn nên tránh nặn/cào, giữ da sạch và chống nắng. ` +
        `Muốn chắc chắn, đặt lịch để bác sĩ chuyên khoa khám trực tiếp nhé.`,
      suggested_specialty: slug,
      source: 'offline',
    }
  }
  const list = SPECIALTIES.map((s) => s.name).join(', ')
  return {
    reply:
      `Mình chưa nhận diện được nhóm bệnh từ mô tả. DermaCare có 8 nhóm: ${list}. ` +
      `Bạn mô tả thêm (vị trí, màu sắc, ngứa/đau, bao lâu rồi) để mình gợi ý đúng hơn nhé.`,
    suggested_specialty: null,
    source: 'offline',
  }
}

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_CHAT) || '[]')
  } catch {
    return []
  }
}

export function saveHistory(messages) {
  try {
    localStorage.setItem(LS_CHAT, JSON.stringify(messages.slice(-40)))
  } catch {}
}

export function clearHistory() {
  try {
    localStorage.removeItem(LS_CHAT)
  } catch {}
}
