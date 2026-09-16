import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, LogOut, UserPlus, Calendar, Bell, Phone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { listAllAppointments, updateAppointment, listDoctors, listContacts } from '../lib/bookingStore'
import { supabase, isDemoMode } from '../lib/supabase'
import { SPECIALTIES } from '../data/content'
import NotificationsBell from '../components/NotificationsBell'
import { useToast } from '../components/Toast'
import { playClick } from '../utils/sound'

export default function AdminPortal() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('books')
  const [books, setBooks] = useState([])
  const [doctors, setDoctors] = useState([])
  const [contacts, setContacts] = useState([])
  const [docForm, setDocForm] = useState({ full_name: '', email: '', password: '', phone: '', specialty_slug: 'mun-trung-ca-seo', license_code: '' })
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      setBooks(await listAllAppointments())
      setDoctors(await listDoctors())
      setContacts(await listContacts())
    } catch {}
  }

  useEffect(() => {
    load()
    if (!isDemoMode && supabase) {
      const ch = supabase.channel('admin-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => load())
        .subscribe()
      return () => { supabase.removeChannel(ch) }
    }
    const h = () => load()
    window.addEventListener('dermacare:bookings', h)
    window.addEventListener('dermacare:notifs', h)
    return () => { window.removeEventListener('dermacare:bookings', h); window.removeEventListener('dermacare:notifs', h) }
  }, [])

  async function assignDoctor(bookId, doctor) {
    playClick('tap')
    try {
      await updateAppointment(bookId, { doctor_user_id: doctor.user_id, doctor_name: doctor.full_name, status: 'confirmed' })
      toast.push(`Đã gán ${doctor.full_name} — bệnh nhân nhận thông báo`, 'success')
      load()
    } catch (e) {
      toast.push(e.message, 'error')
    }
  }

  async function createDoctor(e) {
    e.preventDefault()
    playClick('tap')
    if (docForm.full_name.trim().length < 2) return toast.push('Nhập tên bác sĩ', 'error')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(docForm.email)) return toast.push('Email chưa đúng', 'error')
    if (docForm.password.length < 6) return toast.push('Mật khẩu ≥6 ký tự', 'error')
    setCreating(true)
    try {
      const spec = SPECIALTIES.find((s) => s.slug === docForm.specialty_slug)
      if (isDemoMode || !supabase) {
        const extra = JSON.parse(localStorage.getItem('dermacare_extra_doctors') || '[]')
        extra.unshift({
          user_id: `doc-${Date.now()}`,
          full_name: docForm.full_name.trim(),
          specialty_slug: docForm.specialty_slug,
          specialty: spec?.name || '',
          experience: docForm.license_code ? `CCHN ${docForm.license_code}` : 'Bác sĩ da liễu',
          bio: `Tài khoản do quản trị cấp • ${spec?.name || ''}`,
          phone: docForm.phone,
          email: docForm.email,
        })
        localStorage.setItem('dermacare_extra_doctors', JSON.stringify(extra))
        window.dispatchEvent(new CustomEvent('dermacare:bookings'))
        toast.push('Đã tạo tài khoản bác sĩ (demo) — hiển thị realtime ở trang chủ', 'success')
      } else {
        // Supabase thật: tạo auth user với role=doctor (backend giữ role này), trigger tự tạo profile
        const { data, error } = await supabase.auth.signUp({
          email: docForm.email.trim(),
          password: docForm.password,
          options: { data: { full_name: docForm.full_name.trim(), role: 'doctor', phone: docForm.phone } },
        })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            full_name: docForm.full_name.trim(),
            role: 'doctor',
            phone: docForm.phone || null,
            specialty: spec?.name || null,
            specialty_slug: docForm.specialty_slug,
            license_code: docForm.license_code || null,
          }, { onConflict: 'user_id' })
        }
        toast.push('Đã cấp tài khoản bác sĩ — realtime trên toàn hệ thống', 'success')
      }
      setDocForm({ full_name: '', email: '', password: '', phone: '', specialty_slug: 'mun-trung-ca-seo', license_code: '' })
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const pending = books.filter((b) => b.status === 'pending')

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1060px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Stethoscope size={16} /></div>
            <div className="font-extrabold tracking-tight text-sm">DERMACARE • Quản trị</div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsBell keys={['role:admin', user?.id].filter(Boolean)} title="Thông báo quản trị" />
            <button onClick={signOut} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50" aria-label="Đăng xuất"><LogOut size={17} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1060px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Tổng lịch hẹn', books.length],
            ['Chờ phân loại', pending.length],
            ['Bác sĩ', doctors.length],
            ['Liên hệ mới', contacts.length],
          ].map(([k, v]) => (
            <div key={k} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-2xl font-extrabold">{v}</div>
              <div className="text-xs text-slate-500">{k}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {[['books', 'Phân loại lịch'], ['doctors', 'Cấp tài khoản bác sĩ'], ['contacts', 'Liên hệ']].map(([v, l]) => (
            <button key={v} onClick={() => { playClick('tap'); setTab(v) }} className={`px-4 py-2.5 rounded-xl text-xs font-bold border whitespace-nowrap ${tab === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}>{l}</button>
          ))}
        </div>

        {tab === 'books' && (
          <div className="grid gap-3">
            {books.length === 0 && <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">Chưa có lịch nào. Lịch bệnh nhân đặt sẽ hiện realtime tại đây.</div>}
            {books.map((b) => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-[15px]">{b.full_name} • {b.phone}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Calendar size={12} /> {b.specialty_name} • {b.date} lúc {b.time_slot} • {b.doctor_name ? `BS: ${b.doctor_name}` : 'Chưa gán BS'}</div>
                    <div className="text-[13px] text-slate-600 mt-1">{b.symptoms}</div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">{b.status}</span>
                </div>
                {b.status === 'pending' && (
                  <div className="mt-3">
                    <div className="text-xs font-bold text-slate-500 mb-1.5">GÁN BÁC SĨ ĐÚNG CHUYÊN KHOA “{b.specialty_name}”:</div>
                    <div className="flex flex-wrap gap-2">
                      {doctors.filter((d) => d.specialty_slug === b.specialty_slug).concat(doctors.filter((d) => d.specialty_slug !== b.specialty_slug).slice(0, 2)).map((d) => (
                        <button key={d.user_id} onClick={() => assignDoctor(b.id, d)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${d.specialty_slug === b.specialty_slug ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' : 'bg-white border-slate-200 hover:border-slate-400'}`}>
                          {d.full_name} {d.specialty_slug === b.specialty_slug ? '✓ đúng khoa' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'doctors' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <form onSubmit={createDoctor} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="font-bold flex items-center gap-2"><UserPlus size={17} className="text-emerald-600" /> Cấp tài khoản bác sĩ</div>
              <p className="text-xs text-slate-500">Role <span className="font-mono font-bold">doctor</span> vẫn lưu ở backend (bảng profiles), chỉ ẩn khỏi form đăng ký công khai.</p>
              <input value={docForm.full_name} onChange={(e) => setDocForm({ ...docForm, full_name: e.target.value })} placeholder="Họ tên bác sĩ *" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} placeholder="Email đăng nhập *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input type="password" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} placeholder="Mật khẩu ≥6 ký tự *" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} placeholder="SĐT bác sĩ" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input value={docForm.license_code} onChange={(e) => setDocForm({ ...docForm, license_code: e.target.value })} placeholder="Mã CCHN" className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <select value={docForm.specialty_slug} onChange={(e) => setDocForm({ ...docForm, specialty_slug: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
                {SPECIALTIES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
              <button disabled={creating} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">{creating ? 'Đang tạo…' : 'Tạo tài khoản bác sĩ'}</button>
            </form>
            <div className="space-y-2">
              {doctors.map((d) => (
                <div key={d.user_id} className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold">{d.full_name?.replace('BS. ', '').charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{d.full_name}</div>
                    <div className="text-xs text-emerald-700 font-semibold">{d.specialty}</div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-mono">doctor</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'contacts' && (
          <div className="grid gap-2">
            {contacts.length === 0 && <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">Chưa có liên hệ nào.</div>}
            {contacts.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 text-sm">
                <div className="font-bold flex items-center gap-2"><Phone size={14} className="text-emerald-600" /> {c.full_name} • {c.phone}</div>
                <div className="text-slate-600 mt-1">{c.message}</div>
                <div className="text-[11px] text-slate-400 mt-1">{new Date(c.created_at).toLocaleString('vi-VN')}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 text-xs">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 font-semibold">→ Hồ sơ bệnh án (Records)</Link>
          <span className="text-slate-300">•</span>
          <Link to="/" className="text-slate-500 hover:text-slate-800 font-semibold">← Trang chủ</Link>
        </div>
      </main>
    </div>
  )
}
