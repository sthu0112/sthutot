import { supabase, isDemoMode } from './supabase'
import { FALLBACK_DOCTORS } from '../data/content'

const LS_BOOK = 'dermacare_bookings_v1'
const LS_NOTIF = 'dermacare_notifs_v1'
const LS_CONTACT = 'dermacare_contacts_v1'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {}
}
function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
export function emitLocalChange(name) {
  try {
    window.dispatchEvent(new CustomEvent(name))
  } catch {}
}

// ---------- APPOINTMENTS ----------
export async function createAppointment(payload) {
  if (isDemoMode || !supabase) {
    const all = read(LS_BOOK, [])
    const row = {
      id: uid('bk'),
      status: 'pending',
      created_at: new Date().toISOString(),
      ...payload,
    }
    all.unshift(row)
    write(LS_BOOK, all)
    // thông báo local cho bác sĩ + admin (web tự phân loại)
    pushLocalNotificationsForBooking(row)
    emitLocalChange('dermacare:bookings')
    emitLocalChange('dermacare:notifs')
    return row
  }
  const { data, error } = await supabase.from('appointments').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function listAppointments({ mineOnly = null, doctorId = null } = {}) {
  if (isDemoMode || !supabase) {
    let all = read(LS_BOOK, [])
    if (mineOnly) all = all.filter((a) => a.patient_user_id === mineOnly || a.phone === mineOnly)
    if (doctorId) all = all.filter((a) => a.doctor_user_id === doctorId || !a.doctor_user_id)
    return all
  }
  let q = supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(200)
  if (mineOnly) q = q.eq('patient_user_id', mineOnly)
  if (doctorId) q = q.eq('doctor_user_id', doctorId)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function listAllAppointments() {
  if (isDemoMode || !supabase) return read(LS_BOOK, [])
  const { data, error } = await supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(300)
  if (error) throw error
  return data || []
}

export async function updateAppointment(id, patch) {
  if (isDemoMode || !supabase) {
    const all = read(LS_BOOK, [])
    const idx = all.findIndex((a) => a.id === id)
    if (idx < 0) throw new Error('Không tìm thấy lịch hẹn')
    all[idx] = { ...all[idx], ...patch }
    write(LS_BOOK, all)
    // báo cho bệnh nhân khi trạng thái đổi
    const a = all[idx]
    pushLocalNotif({
      user_id: a.patient_user_id || `phone:${a.phone}`,
      type: patch.status === 'confirmed' ? 'booking_confirmed' : patch.status === 'cancelled' ? 'booking_cancelled' : 'booking_updated',
      title:
        patch.status === 'confirmed'
          ? 'Lịch hẹn đã được xác nhận'
          : patch.status === 'cancelled'
            ? 'Lịch hẹn đã bị hủy'
            : 'Lịch hẹn có cập nhật',
      body: `Lịch ${a.specialty_name || ''} ngày ${a.date} lúc ${a.time_slot} — ${patch.status === 'confirmed' ? 'bác sĩ đã xác nhận' : patch.status || 'đã cập nhật'}.`,
      related_id: a.id,
    })
    emitLocalChange('dermacare:bookings')
    emitLocalChange('dermacare:notifs')
    return all[idx]
  }
  const { data, error } = await supabase.from('appointments').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ---------- NOTIFICATIONS ----------
function pushLocalNotif(n) {
  const all = read(LS_NOTIF, [])
  all.unshift({ id: uid('nt'), is_read: false, created_at: new Date().toISOString(), ...n })
  write(LS_NOTIF, all.slice(0, 200))
}

function pushLocalNotificationsForBooking(bk) {
  // 1 notif cho kênh bác sĩ theo chuyên khoa + 1 cho admin
  pushLocalNotif({
    user_id: `doctor:specialty:${bk.specialty_slug}`,
    type: 'new_booking',
    title: 'Có lịch hẹn mới cần xác nhận',
    body: `${bk.full_name} — ${bk.specialty_name} — ${bk.date} lúc ${bk.time_slot}. Triệu chứng: ${(bk.symptoms || '').slice(0, 90)}`,
    related_id: bk.id,
  })
  pushLocalNotif({
    user_id: 'role:admin',
    type: 'new_booking',
    title: 'Lịch hẹn mới từ web',
    body: `${bk.full_name} (${bk.phone}) đặt ${bk.specialty_name} ngày ${bk.date}.`,
    related_id: bk.id,
  })
  // xác nhận cho bệnh nhân
  pushLocalNotif({
    user_id: bk.patient_user_id || `phone:${bk.phone}`,
    type: 'booking_received',
    title: 'Đặt lịch thành công',
    body: `DermaCare đã nhận lịch ${bk.specialty_name} ngày ${bk.date} lúc ${bk.time_slot}. Bác sĩ sẽ xác nhận sớm.`,
    related_id: bk.id,
  })
}

export async function notifyDoctorsOfBooking(bk) {
  // Supabase mode: tạo 1 notif broadcast để doctor portal realtime bắt được
  if (isDemoMode || !supabase) return
  try {
    await supabase.from('notifications').insert([
      {
        user_id: null,
        role_target: 'doctor',
        specialty_slug: bk.specialty_slug,
        type: 'new_booking',
        title: 'Có lịch hẹn mới cần xác nhận',
        body: `${bk.full_name} — ${bk.specialty_name} — ${bk.date} lúc ${bk.time_slot}`,
        related_id: bk.id,
      },
      {
        user_id: bk.patient_user_id || null,
        role_target: 'patient',
        type: 'booking_received',
        title: 'Đặt lịch thành công',
        body: `Đã nhận lịch ${bk.specialty_name} ngày ${bk.date} lúc ${bk.time_slot}.`,
        related_id: bk.id,
      },
    ])
  } catch (e) {
    console.warn('notify failed', e.message)
  }
}

export async function listNotifications(keys = []) {
  if (isDemoMode || !supabase) {
    const all = read(LS_NOTIF, [])
    if (!keys.length) return all
    return all.filter((n) => keys.includes(n.user_id))
  }
  // supabase: notif của user + broadcast theo role/specialty
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(80)
  if (!data) return []
  if (!keys.length) return data
  return data.filter((n) => {
    if (n.user_id && keys.includes(n.user_id)) return true
    if (n.role_target && keys.includes(`role:${n.role_target}`)) return true
    if (n.specialty_slug && keys.includes(`doctor:specialty:${n.specialty_slug}`)) return true
    return false
  })
}

export async function markNotifRead(id) {
  if (isDemoMode || !supabase) {
    const all = read(LS_NOTIF, [])
    const idx = all.findIndex((n) => n.id === id)
    if (idx >= 0) {
      all[idx].is_read = true
      write(LS_NOTIF, all)
      emitLocalChange('dermacare:notifs')
    }
    return
  }
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

// ---------- DOCTORS ----------
export async function listDoctors() {
  if (isDemoMode || !supabase) {
    let extra = []
    try { extra = JSON.parse(localStorage.getItem('dermacare_extra_doctors') || '[]') } catch {}
    return [...extra, ...FALLBACK_DOCTORS]
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'doctor').order('created_at', { ascending: true }).limit(50)
  if (error) throw error
  return (data || []).map((d) => ({
    user_id: d.user_id,
    full_name: d.full_name,
    specialty_slug: d.specialty_slug || 'nhiem-trung-da',
    specialty: d.specialty || 'Da liễu tổng quát',
    experience: d.experience || '',
    bio: d.bio || '',
    phone: d.phone || '',
  }))
}

// ---------- CONTACT ----------
export async function saveContact(payload) {
  if (isDemoMode || !supabase) {
    const all = read(LS_CONTACT, [])
    all.unshift({ id: uid('ct'), created_at: new Date().toISOString(), ...payload })
    write(LS_CONTACT, all)
    return
  }
  const { error } = await supabase.from('contact_messages').insert(payload)
  if (error) throw error
}

export async function listContacts() {
  if (isDemoMode || !supabase) return read(LS_CONTACT, [])
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100)
  return data || []
}
