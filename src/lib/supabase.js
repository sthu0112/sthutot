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
