import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Stethoscope, Eye, EyeOff, ShieldCheck, AlertCircle, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { playClick } from '../utils/sound'

const container = { hidden:{}, visible:{ transition:{ staggerChildren:0.06, delayChildren:0.12 } } }
const item = { hidden:{ opacity:0, y:10 }, visible:{ opacity:1, y:0, transition:{ duration:0.4, ease:[0.22,1,0.36,1] } } }

export default function Register(){
  const { signUp, isDemoMode } = useAuth()
  // role bác sĩ vẫn giữ ở backend (admin cấp trong trang Admin), UI chỉ đăng ký bệnh nhân
  const [form, setForm] = useState({ email:'', password:'', confirmPassword:'', full_name:'', phone:'', role:'patient' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const toast = useToast()

  function validate(){
    if (!form.full_name.trim()) return 'Họ và tên là bắt buộc'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không hợp lệ'
    if (!form.phone.trim()) return 'Vui lòng nhập số điện thoại để bệnh viện liên hệ'
    if (!/^(0|\+84)[0-9]{9,10}$/.test(form.phone.replace(/[\s.]/g,''))) return 'Số điện thoại không hợp lệ (VD: 0901234567)'
    if (form.password.length < 6) return 'Mật khẩu ít nhất 6 ký tự'
    if (form.password !== form.confirmPassword) return 'Xác nhận mật khẩu không khớp'
    return null
  }

  async function submit(e){
    e.preventDefault(); setErr('')
    playClick('tap')
    const v = validate(); if (v) { playClick('error'); return setErr(v) }
    setLoading(true)
    try {
      const result = await signUp(form.email.trim(), form.password, form.full_name.trim(), form.role, form.phone.trim())
      playClick('success')
      if (result?.needsEmailConfirmation) toast.push('Tạo tài khoản thành công — kiểm tra email để xác thực','success')
      else toast.push('Tạo tài khoản thành công — đăng nhập ngay','success')
      nav('/login')
    } catch(e2){ playClick('error'); setErr(e2.message) } finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-4 py-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-50 pointer-events-none" />
      <motion.div initial={{opacity:0, y:16, scale:0.98}} animate={{opacity:1, y:0, scale:1}} transition={{duration:0.6, ease:[0.22,1,0.36,1]}} className="relative w-full max-w-[680px] bg-white rounded-[24px] border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.10)] overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <motion.div variants={container} initial="hidden" animate="visible" className="flex items-center gap-3">
            <motion.div variants={item} className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center"><Stethoscope size={18} /></motion.div>
            <div>
              <motion.div variants={item} className="font-bold leading-none flex items-center gap-2">Tạo tài khoản bệnh nhân <Sparkles size={14} className="text-emerald-300" /></motion.div>
              <motion.div variants={item} className="text-xs text-slate-300">Đặt lịch da liễu • Bảo mật • Realtime</motion.div>
            </div>
          </motion.div>
          <Link to="/" onClick={()=>playClick('pop')} className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/15 text-white">← Trang chủ</Link>
        </div>

        <motion.form variants={container} initial="hidden" animate="visible" onSubmit={submit} className="p-6 space-y-4">
          {isDemoMode && (
            <motion.div variants={item} className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div><b>Demo:</b> lưu localStorage, không gửi Supabase. Khi có Supabase thật, tài khoản sẽ lưu realtime vào <span className="font-mono">auth.users</span> + <span className="font-mono">profiles</span>.</div>
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            <motion.label variants={item} className="block md:col-span-2">
              <span className="text-xs font-semibold tracking-widest text-slate-500">HỌ VÀ TÊN *</span>
              <input onFocus={()=>playClick('pop')} required value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} placeholder="Nguyễn Thị Thư" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm" />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">EMAIL *</span>
              <input onFocus={()=>playClick('pop')} type="email" required value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="ban@email.com" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm" />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">SĐT DI ĐỘNG *</span>
              <input onFocus={()=>playClick('pop')} required value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="0901234567" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm" />
            </motion.label>

            <motion.label variants={item} className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">MẬT KHẨU *</span>
              <div className="relative mt-1.5">
                <input onFocus={()=>playClick('pop')} required value={form.password} onChange={e=>setForm({...form, password:e.target.value})} type={showPassword?'text':'password'} placeholder="≥6 ký tự" className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm" />
                <button type="button" onClick={()=>{ playClick('tap'); setShowPassword(s=>!s)}} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 text-slate-500"><span className="sr-only">toggle</span>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </motion.label>
            <motion.label variants={item} className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">XÁC NHẬN *</span>
              <div className="relative mt-1.5">
                <input onFocus={()=>playClick('pop')} required value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword:e.target.value})} type={showConfirm?'text':'password'} placeholder="Nhập lại" className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm" />
                <button type="button" onClick={()=>{ playClick('tap'); setShowConfirm(s=>!s)}} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 text-slate-500">{showConfirm?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </motion.label>
          </div>

          <motion.div variants={item} className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs text-slate-600 flex gap-2">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>Tài khoản bệnh nhân dùng để đặt lịch & theo dõi. Tài khoản <b>bác sĩ do quản trị cấp</b> trong trang Admin (vẫn lưu cùng bảng <span className="font-mono">profiles</span> realtime).</div>
          </motion.div>

          {err && <motion.div variants={item} initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5" />{err}</motion.div>}

          <motion.button variants={item} whileTap={{scale:0.98}} whileHover={{scale:1.01}} disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading?'Đang tạo…':<>Tạo tài khoản <ArrowRight size={16} /></>}
          </motion.button>
          <motion.div variants={item} className="text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" onClick={()=>playClick('tap')} className="text-teal-700 font-semibold hover:underline">Đăng nhập</Link></motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
