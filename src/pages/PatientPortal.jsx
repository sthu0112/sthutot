import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Plus, Stethoscope, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { listAppointments, listAllAppointments } from '../lib/bookingStore'
import { supabase, isDemoMode } from '../lib/supabase'
import NotificationsBell from '../components/NotificationsBell'

const STATUS = {
  pending: { label: 'Chờ xác nhận', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Đã xác nhận', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Đã khám xong', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-50 text-red-600 border-red-200' },
}

export default function PatientPortal() {
  const { user, profile, signOut } = useAuth()
  const [items, setItems] = useState([])

  async function load() {
    try {
      const mine = await listAppointments({ mineOnly: user?.id || profile?.phone || user?.phone })
      // demo fallback: khớp cả phone
      let all = mine
      if (isDemoMode) {
        const every = await listAllAppointments()
        const phone = user?.phone || profile?.phone
        all = every.filter((a) => a.patient_user_id === user?.id || (phone && a.phone === phone))
      }
      setItems(all)
    } catch {}
  }

  useEffect(() => {
    load()
    if (!isDemoMode && supabase) {
      const ch = supabase.channel('patient-books').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load()).subscribe()
      return () => { supabase.removeChannel(ch) }
    }
    const h = () => load()
    window.addEventListener('dermacare:bookings', h)
    return () => window.removeEventListener('dermacare:bookings', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const keys = [user?.id, `phone:${user?.phone || profile?.phone}`, 'role:patient'].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Stethoscope size={16} /></div>
            <div className="font-extrabold tracking-tight text-sm">DERMACARE • Bệnh nhân</div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsBell keys={keys} title="Thông báo lịch khám" />
            <button onClick={signOut} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50" aria-label="Đăng xuất"><LogOut size={17} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-slate-900 text-white rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="font-display font-extrabold text-xl">Chào Thư iu, da hôm nay thế nào?</div>
            <div className="text-sm text-slate-300 mt-1">Đặt lịch mới hoặc theo dõi lịch đã đặt — bác sĩ xác nhận sẽ báo ngay ở chuông thông báo.</div>
          </div>
          <Link to="/dat-lich" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 shrink-0">
            <Plus size={16} /> Đặt lịch mới
          </Link>
        </div>

        <div>
          <h2 className="font-bold flex items-center gap-2"><Calendar size={17} className="text-emerald-600" /> Lịch hẹn của tôi ({items.length})</h2>
          <div className="grid gap-3 mt-3">
            {items.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">
                Chưa có lịch nào. <Link to="/dat-lich" className="text-emerald-700 font-bold hover:underline">Đặt lịch đầu tiên →</Link>
              </div>
            )}
            {items.map((a) => {
              const st = STATUS[a.status] || STATUS.pending
              return (
                <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px]">{a.specialty_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.date} lúc {a.time_slot} • {a.doctor_name || 'Hệ thống tự gán bác sĩ'}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{a.symptoms}</div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${st.cls}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm">
          <div className="font-bold">Hồ sơ của bạn</div>
          <div className="text-slate-600 mt-1">{profile?.full_name || user?.full_name} • {user?.email} • {user?.phone || profile?.phone || 'chưa có SĐT'}</div>
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 mt-2 inline-block">← Về trang chủ</Link>
        </div>
      </main>
    </div>
  )
}
