import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { playClick } from '../utils/sound'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } }
const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }

export default function Register() {
  const { signUp, isDemoMode } = useAuth()
  // role bác sĩ vẫn giữ ở backend (admin cấp trong trang Admin), UI chỉ đăng ký bệnh nhân
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', full_name: '', phone: '', role: 'patient' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const toast = useToast()

  function validate() {
    if (!form.full_name.trim()) return 'Họ và tên là bắt buộc'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không hợp lệ'
    if (!form.phone.trim()) return 'Vui lòng nhập số điện thoại để liên hệ'
    if (!/^(0|\+84)[0-9]{9,10}$/.test(form.phone.replace(/[\s.]/g, ''))) return 'Số điện thoại không hợp lệ (VD: 0901234567)'
    if (form.password.length < 6) return 'Mật khẩu ít nhất 6 ký tự'
    if (form.password !== form.confirmPassword) return 'Xác nhận mật khẩu không khớp'
    return null
  }

  async function submit(e) {
    e.preventDefault(); setErr('')
    playClick('tap')
    const v = validate(); if (v) { playClick('error'); return setErr(v) }
    setLoading(true)
    try {
      const result = await signUp(form.email.trim(), form.password, form.full_name.trim(), form.role, form.phone.trim())
      playClick('success')
      if (result?.needsEmailConfirmation) toast.push('Tạo tài khoản thành công — kiểm tra email để xác thực', 'success')
      else toast.push('Tạo tài khoản thành công — đăng nhập ngay', 'success')
      nav('/login')
    } catch (e2) { playClick('error'); setErr(e2.message) } finally { setLoading(false) }
  }

  const inputCls = 'mt-2 w-full px-4 py-[14px] rounded-lg bg-transparent border-[1.5px] border-forest/30 text-[16px] text-forest placeholder:text-ash focus:outline-none focus:border-forest'
  const labelCls = 'text-[12px] uppercase tracking-wide text-pewter font-medium'

  return (
    <div className="min-h-screen bg-snow flex items-center justify-center p-4 md:p-8 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[640px] bg-stone rounded-[32px] p-4">
        <div className="bg-forest text-snow rounded-2xl px-6 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium tracking-tight text-[18px]">Tạo tài khoản</span>
              <span className="w-2 h-2 rounded-full bg-lime" />
            </div>
            <div className="text-[14px] opacity-70 mt-1">Đặt lịch da liễu · Bảo mật · Realtime</div>
          </div>
          <Link to="/" onClick={() => playClick('pop')} className="text-[14px] px-4 py-2 rounded-pill bg-transparent border-[1.5px] border-snow hover:opacity-80">← Trang chủ</Link>
        </div>

        <motion.form variants={container} initial="hidden" animate="visible" onSubmit={submit} className="bg-snow rounded-2xl mt-4 p-6 space-y-4">
          {isDemoMode && (
            <motion.div variants={item} className="px-4 py-3 rounded-2xl bg-stone text-[14px]">
              <span className="px-2 py-[6px] rounded-pill bg-lime text-[12px] font-medium mr-2">Demo</span>
              Lưu local, không gửi Supabase. Bản thật lưu realtime vào <span className="font-mono font-light">auth.users</span> + <span className="font-mono font-light">profiles</span>.
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <motion.label variants={item} className="block md:col-span-2">
              <span className={labelCls}>Họ và tên *</span>
              <input onFocus={() => playClick('pop')} required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Thị Thư" className={inputCls} />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className={labelCls}>Email *</span>
              <input onFocus={() => playClick('pop')} type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ban@email.com" className={inputCls} />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className={labelCls}>Số điện thoại *</span>
              <input onFocus={() => playClick('pop')} required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" className={inputCls} />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className={labelCls}>Mật khẩu *</span>
              <div className="relative mt-2">
                <input onFocus={() => playClick('pop')} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type={showPassword ? 'text' : 'password'} placeholder="≥6 ký tự" className="w-full px-4 py-[14px] pr-12 rounded-lg bg-transparent border-[1.5px] border-forest/30 text-[16px] placeholder:text-ash focus:outline-none focus:border-forest" />
                <button type="button" onClick={() => { playClick('tap'); setShowPassword(s => !s) }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-stone text-pewter"><span className="sr-only">toggle</span>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </motion.label>
            <motion.label variants={item} className="block">
              <span className={labelCls}>Xác nhận *</span>
              <div className="relative mt-2">
                <input onFocus={() => playClick('pop')} required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} type={showConfirm ? 'text' : 'password'} placeholder="Nhập lại" className="w-full px-4 py-[14px] pr-12 rounded-lg bg-transparent border-[1.5px] border-forest/30 text-[16px] placeholder:text-ash focus:outline-none focus:border-forest" />
                <button type="button" onClick={() => { playClick('tap'); setShowConfirm(s => !s) }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-stone text-pewter">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </motion.label>
          </div>

          <motion.div variants={item} className="rounded-2xl bg-stone px-4 py-3 text-[14px] text-forest flex gap-2">
            <ShieldCheck size={15} className="shrink-0 mt-0.5" />
            <div>Tài khoản bệnh nhân dùng để đặt lịch & theo dõi. Tài khoản <b>bác sĩ do quản trị cấp</b> trong trang Admin.</div>
          </motion.div>

          {err && <motion.div variants={item} className="text-[14px] bg-stone rounded-2xl px-4 py-3 flex gap-2"><AlertCircle size={15} className="shrink-0 mt-0.5" />{err}</motion.div>}

          <motion.button variants={item} disabled={loading} className="w-full py-4 rounded-pill bg-forest text-snow text-[16px] hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading ? 'Đang tạo…' : <>Tạo tài khoản <ArrowRight size={16} strokeWidth={1.5} /></>}
          </motion.button>
          <motion.div variants={item} className="text-center text-[16px] text-pewter">Đã có tài khoản? <Link to="/login" onClick={() => playClick('tap')} className="text-forest font-medium underline underline-offset-4 decoration-[1.5px]">Đăng nhập</Link></motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
