// lib/supabase/server.ts — Server-side client (for Next.js API routes / Edge Functions)
// KHÔNG được hard-code service_role key ở frontend — chỉ dùng ở server
// Usage: import { createServerClient } from '@/lib/supabase/server'

import { createClient } from '@supabase/supabase-js'

// For Vite dev, these are same as client but in Next.js you'd use process.env.SUPABASE_SERVICE_ROLE_KEY
export function createServerClient() {
  // Prefer server-side env (no VITE_ prefix in Next.js)
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('Missing SUPABASE_URL')
  // Use service_role only on server for privileged ops (signed URL, audit bypass, etc.)
  const key = serviceKey || anonKey
  if (!key) throw new Error('Missing SUPABASE anon/service key')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

// Example secure operation: create signed URL server-side without exposing service key
export async function createSignedUrlServer(storagePath, expiresIn = 3600) {
  const supabase = createServerClient()
  const { data, error } = await supabase.storage.from('luutruhoso').createSignedUrl(storagePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}
