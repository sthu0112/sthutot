export function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) } catch { return d }
}
export function formatDateTime(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('vi-VN') } catch { return d }
}
export function ageFromDob(dob) {
  if (!dob) return '—'
  const now = new Date()
  const b = new Date(dob)
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m<0 || (m===0 && now.getDate() < b.getDate())) age--
  return age + ' tuổi'
}
export async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}
export const bodyAreaLabel = {
  forehead: 'Trán',
  left_cheek: 'Má trái',
  right_cheek: 'Má phải',
  chin: 'Cằm',
  nose: 'Mũi',
  neck: 'Cổ',
  other: 'Khác'
}
export const skinTypeLabel = {
  dry: 'Da khô', oily: 'Da dầu', combination: 'Da hỗn hợp', sensitive: 'Da nhạy cảm', normal: 'Da thường', unknown: 'Không rõ'
}
export const genderLabel = { male:'Nam', female:'Nữ', other:'Khác', unknown:'Không rõ' }
