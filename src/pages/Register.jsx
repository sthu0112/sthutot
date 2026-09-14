import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Stethoscope, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function Register(){
  const { signUp, isDemoMode } = useAuth()
  const [form, setForm] = useState({ email:'', password:'', confirmPassword:'', full_name:'', phone:'', license_code:'', specialty:'', role:'doctor' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const toast = useToast()

  function validate(){
    if (!form.full_name.trim()) return 'Họ và tên là bắt buộc'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không hợp lệ'
    if (form.phone && !/^[0-9+ ]{9,15}$/.test(form.phone)) return 'Số điện thoại không hợp lệ'
    if (form.password.length < 6) return 'Mật khẩu ít nhất 6 ký tự'
    if (form.password !== form.confirmPassword) return 'Xác nhận mật khẩu không khớp'
    if (form.license_code && form.license_code.length < 4) return 'Mã CCHN không hợp lệ'
    return null
  }

  async function submit(e){
    e.preventDefault(); setErr('')
    const v = validate(); if (v) return setErr(v)
    setLoading(true)
    try {
      const result = await signUp(form.email.trim(), form.password, form.full_name.trim(), form.role, form.phone.trim())
      if (result?.needsEmailConfirmation) toast.push('Tạo tài khoản thành công — kiểm tra email để xác thực','success')
      else toast.push('Tạo tài khoản thành công — đăng nhập ngay','success')
      nav('/login')
    } catch(e2){ setErr(e2.message) } finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-50 pointer-events-none" />
      <motion.div initial={{opacity:0, y:14}} animate={{opacity:1, y:0}} transition={{duration:0.55, ease:[0.22,1,0.36,1]}} className="relative w-full max-w-[720px] bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-7 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center"><Stethoscope size={18} /></div>
            <div>
              <div className="font-bold leading-none">Đăng ký bác sĩ</div>
              <div className="text-xs text-slate-300">Da liễu • Private • RLS • Audit</div>
            </div>
          </div>
          <Link to="/" className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/15">← Trang chủ</Link>
        </div>

        <form onSubmit={submit} className="p-7 space-y-4">
          {isDemoMode && (
            <div className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div><b>Demo:</b> không gửi Supabase, lưu localStorage. Nhập bất kỳ email.</div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3.5">
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-slate-500">HỌ VÀ TÊN *</span>
              <input required value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} placeholder="BS. Nguyễn Văn A" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">EMAIL *</span>
              <input type="email" required value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="bacsi@benhvien.vn" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">SĐT DI ĐỘNG</span>
              <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="0901234567" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">MẬT KHẨU *</span>
              <div className="relative mt-1.5">
                <input required value={form.password} onChange={e=>setForm({...form, password:e.target.value})} type={showPassword?'text':'password'} placeholder="≥6 ký tự" className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 text-slate-500">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">XÁC NHẬN *</span>
              <div className="relative mt-1.5">
                <input required value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword:e.target.value})} type={showConfirm?'text':'password'} placeholder="Nhập lại" className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
                <button type="button" onClick={()=>setShowConfirm(s=>!s)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 text-slate-500">{showConfirm?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">CHUYÊN KHOA</span>
              <input value={form.specialty} onChange={e=>setForm({...form, specialty:e.target.value})} placeholder="Da liễu" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">MÃ CCHN</span>
              <input value={form.license_code} onChange={e=>setForm({...form, license_code:e.target.value})} placeholder="012345/CCHN" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-slate-500">VAI TRÒ</span>
              <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm">
                <option value="doctor">Bác sĩ da liễu</option>
                <option value="staff">Nhân viên y tế</option>
                <option value="admin">Quản trị (cần duyệt)</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-600 flex gap-2">
            <ShieldCheck size={14} className="text-teal-600 shrink-0 mt-0.5" />
            <div>Mật khẩu mã hoá • RLS • Audit. Chỉ nhân sự y tế được cấp quyền.</div>
          </div>

          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5" />{err}</div>}

          <button disabled={loading} className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
            {loading?'Đang tạo…':'Tạo tài khoản bác sĩ'}
          </button>
          <div className="text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" className="text-teal-700 font-semibold hover:underline">Đăng nhập</Link></div>
        </form>
      </motion.div>
    </div>
  )
}
