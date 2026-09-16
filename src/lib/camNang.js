import { supabase, isDemoMode } from './supabase'

// Cẩm nang lấy từ Edge Function cam-nang (nguồn: kho kb.json, không đụng dữ liệu gốc).
export async function listArticles() {
  if (isDemoMode || !supabase) throw new Error('Cẩm nang cần kết nối Supabase')
  const { data, error } = await supabase.functions.invoke('cam-nang', { body: { action: 'list' } })
  if (error) throw error
  return data?.articles || []
}

export async function getArticle(slug) {
  if (isDemoMode || !supabase) throw new Error('Cẩm nang cần kết nối Supabase')
  const { data, error } = await supabase.functions.invoke('cam-nang', { body: { action: 'get', slug } })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
