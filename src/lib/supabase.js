import { createClient } from '@supabase/supabase-js'

// Đọc cấu hình lúc chạy từ window.__DERMA_ENV__ (do scripts/gen-env.js sinh ra lúc build),
// fallback sang import.meta.env cho môi trường dev.
const RUNTIME = (typeof window !== 'undefined' && window.__DERMA_ENV__) || {}
const IM = (typeof import.meta !== 'undefined' && import.meta.env) || {}
const pick = (k) => RUNTIME[k] || IM[k] || ''

const url = pick('VITE_SUPABASE_URL')
const anonKey = pick('VITE_SUPABASE_ANON_KEY')
const demoMode = pick('VITE_DEMO_MODE') === 'demo' || !url || url.includes('placeholder') || !anonKey || anonKey.includes('placeholder')

export const isDemoMode = demoMode

let supabase = null
if (!demoMode) {
  supabase = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
} else {
  console.warn('[DermaCare] Running in DEMO mode — Supabase disabled. Set VITE_DEMO_MODE="" and provide keys to use real backend.')
}

export { supabase }
export const isSupabaseConfigured = !demoMode

// Gọi Edge Function với timeout + retry + phân loại lỗi rõ ràng.
// - Dùng token phiên đăng nhập nếu có (thành viên), không thì anon key.
// - Lỗi 'auth': phiên hết hạn/key sai -> UI yêu cầu đăng nhập lại.
// - Lỗi 'timeout'/'network'/'server': UI retry hoặc dùng dự phòng offline.
export async function invokeFunction(name, body, { timeoutMs = 25000, retries = 1 } = {}) {
  if (demoMode || !supabase) {
    const e = new Error('Chưa cấu hình Supabase')
    e.code = 'config'
    throw e
  }
  let token = anonKey
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) token = data.session.access_token
  } catch {}
  const endpoint = `${url.replace(/\/$/, '')}/functions/v1/${name}`
  let lastErr = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      if (res.status === 401 || res.status === 403) {
        const e = new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại')
        e.code = 'auth'
        throw e
      }
      let data = null
      try { data = await res.json() } catch {}
      if (!res.ok) {
        const e = new Error(data?.error || `Máy chủ bận (${res.status}), thử lại sau ít phút`)
        e.code = 'server'
        e.status = res.status
        throw e
      }
      if (data?.error && !data?.articles && !data?.reply && !data?.slug) {
        const e = new Error(data.error)
        e.code = 'server'
        throw e
      }
      return data
    } catch (e) {
      clearTimeout(timer)
      if (e?.code === 'auth') throw e
      lastErr = e?.name === 'AbortError'
        ? Object.assign(new Error('Quá thời gian chờ, đang thử lại…'), { code: 'timeout' })
        : Object.assign(new Error(e?.message || 'Lỗi mạng'), { code: 'network' })
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)))
    }
  }
  throw lastErr
}

export function isAuthError(e) {
  return e?.code === 'auth' || /hết hạn|401|jwt|expired|invalid.*(key|token)/i.test(e?.message || '')
}

// Helper: tạo signed URL cho bucket private luutruhoso (an toàn, có hạn)
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  if (demoMode || !supabase || !storagePath) return null
  try {
    const { data, error } = await supabase.storage.from('luutruhoso').createSignedUrl(storagePath, expiresIn)
    if (error) throw error
    return data.signedUrl
  } catch { return null }
}

// Batch signed URLs cho danh sách images
export async function withSignedUrls(images) {
  if (demoMode || !images?.length) return images
  const out = await Promise.all(images.map(async img=>{
    if (img.url) return img // demo already has url
    const signed = await getSignedUrl(img.storage_path, 3600)
    return { ...img, signedUrl: signed }
  }))
  return out
}
