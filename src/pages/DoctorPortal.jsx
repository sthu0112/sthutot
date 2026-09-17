import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, LogOut, Check, X, Calendar, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import PortalSidebar from '../components/PortalSidebar'
import { listAllAppointments, listAppointments, updateAppointment } from '../lib/bookingStore'
import { supabase, isDemoMode } from '../lib/supabase'
import NotificationsBell from '../components/NotificationsBell'
import { useToast } from '../components/Toast'

export default function DoctorPortal() {
  const { user, profile, signOut } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [menu, setMenu] = useState(false)

  const mySpecialty = profile?.specialty_slug || null
  const myId = profile?.user_id || user?.id

  async function load() {
    try {
      if (isDemoMode) {
        const all = await listAllAppointments()
        // bác sĩ thấy: lịch gán cho mình + lịch chờ cùng chuyên khoa + lịch chưa gán
        const mine = all.filter((a) => {
          if (a.doctor_user_id && (a.doctor_user_id === myId || a.doctor_name === (profile?.full_name || user?.full_name))) return true
          if (a.status !== 'pending') return false
          if (mySpecialty && a.specialty_slug === mySpecialty) return true
          if (!a.doctor_user_id) return true
          return false
        })
        setItems(mine)
      } else {
        const mine = await listAppointments({ doctorId: myId })
        const pending = (await listAllAppointments()).filter((a) => a.status === 'pending' && (!a.doctor_user_id || (mySpecialty && a.specialty_slug === mySpecialty)))
        const merged = [...mine, ...pending.filter((p) => !mine.some((m) => m.id === p.id))]
        setItems(merged)
      }
    } catch (e) {
      toast.push(e.message, 'error')
    }
  }

  useEffect(() => {
    load()
    if (!isDemoMode && supabase) {
      const ch = supabase.channel('doctor-books').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load()).subscribe()
      return () => { supabase.removeChannel(ch) }
    }
    const h = () => load()
    window.addEventListener('dermacare:bookings', h)
    return () => window.removeEventListener('dermacare:bookings', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, mySpecialty])

  async function setStatus(id, status) {
    try {
      await updateAppointment(id, { status, doctor_user_id: myId })
      toast.push(status === 'confirmed' ? 'Đã xác nhận lịch — bệnh nhân nhận thông báo' : 'Đã cập nhật lịch', 'success')
      load()
    } catch (e) {
      toast.push(e.message, 'error')
    }
  }

  const shown = useMemo(() => (filter === 'all' ? items : items.filter((a) => a.status === filter)), [items, filter])
  const keys = [myId, `doctor:specialty:${mySpecialty}`, 'role:doctor'].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#FAFAF9] lg:flex">
      <PortalSidebar mobileOpen={menu} onClose={() => setMenu(false)} />
      <div className="flex-1 min-w-0">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
          <button onClick={() => setMenu(true)} className="lg:hidden p-2.5 rounded-xl bg-white border border-slate-200" aria-label="Mở menu"><Menu size={17} /></button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Stethoscope size={16} /></div>
            <div className="font-extrabold tracking-tight text-sm">DERMACARE • Bác sĩ</div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsBell keys={keys} title="Lịch hẹn mới" />
            <button onClick={signOut} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50" aria-label="Đăng xuất"><LogOut size={17} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-display font-extrabold text-xl">Xin chào, {profile?.full_name || user?.full_name || 'Bác sĩ'}</div>
          <div className="text-sm text-slate-500 mt-1">
            Chuyên khoa: <b className="text-emerald-700">{profile?.specialty || 'Da liễu tổng quát'}</b> • Lịch mới đúng chuyên môn sẽ hiện ở đây realtime.
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['completed', 'Hoàn thành']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${filter === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {shown.length === 0 && <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">Chưa có lịch nào trong mục này.</div>}
          {shown.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <div className="font-bold">{a.full_name} • {a.phone}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Calendar size={12} /> {a.date} lúc {a.time_slot} • {a.specialty_name}</div>
                  <div className="text-[13px] text-slate-600 mt-1.5">Triệu chứng: {a.symptoms}</div>
                  {(a.skin_history_has || a.drug_allergy_has || a.current_meds_has) && (
                    <div className="text-xs text-slate-500 mt-1.5 space-y-0.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      {a.skin_history_has && <div><b>Tiền sử da:</b> {a.skin_history_detail}</div>}
                      {a.drug_allergy_has && <div><b>Dị ứng thuốc:</b> {a.drug_allergy_detail}</div>}
                      {a.current_meds_has && <div><b>Thuốc đang dùng:</b> {a.current_meds_detail}</div>}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-slate-50 border-slate-200 text-slate-600 whitespace-nowrap">{a.status}</span>
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setStatus(a.id, 'confirmed')} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 inline-flex items-center justify-center gap-1.5"><Check size={14} /> Xác nhận</button>
                  <button onClick={() => setStatus(a.id, 'cancelled')} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold hover:bg-red-50 hover:text-red-600 inline-flex items-center gap-1.5"><X size={14} /> Hủy</button>
                </div>
              )}
              {a.status === 'confirmed' && (
                <button onClick={() => setStatus(a.id, 'completed')} className="w-full mt-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">Hoàn thành khám</button>
              )}
            </div>
          ))}
        </div>

        <Link to="/dashboard" className="text-xs text-slate-400 hover:text-slate-600">→ Mở hồ sơ bệnh án chuyên sâu (Records)</Link>
      </main>
      </div>
    </div>
  )
}
