// lib/supabase/client.ts — Browser client (Vite / Next.js compatible)
// Spec: lib/supabase/client.ts — không để logic Supabase nằm lung tung trong component
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const demoMode = import.meta.env.VITE_DEMO_MODE === 'demo' || !url || url.includes('placeholder') || !anonKey || anonKey.includes('placeholder')

export const isDemoMode = demoMode
export const isSupabaseConfigured = !demoMode

let supabase = null
if (!demoMode) {
  supabase = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
} else {
  console.warn('[DermaCare] Running in DEMO mode — Supabase disabled. Set VITE_DEMO_MODE="" and provide keys to use real backend. Bucket: luutruhoso (private)')
}

export { supabase }

// Helper: create signed URL for private bucket luutruhoso
export async function getSignedUrl(storagePath, expiresIn = 3600) {
  if (demoMode || !supabase) return null
  const { data, error } = await supabase.storage.from('luutruhoso').createSignedUrl(storagePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}
