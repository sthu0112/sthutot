import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Image as ImageIcon, ClipboardList, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { playClick } from '../utils/sound'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }

export default function Login() {
  const { signIn, resetPassword, isDemoMode, homeByRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const toast = useToast()
  const [attempts, setAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    playClick('tap')
    if (Date.now() < lockUntil) {
      const sec = Math.ceil((lockUntil - Date.now()) / 1000)
      setErr(`Tạm khóa ${sec}s do sai nhiều lần`)
      playClick('error')
      return
    }
    setErr(''); setLoading(true)
    try {
      const res = await signIn(email, password)
      setAttempts(0)
      playClick('success')
      toast.push('Đăng nhập thành công', 'success')
      let role = res?.user?.role || res?.role || null
      if (!role && !isDemoMode) {
        try {
          const uid = res?.user?.id || res?.id
          if (uid) {
            const { data } = await supabase.from('profiles').select('role').eq('user_id', uid).single()
            role = data?.role || 'patient'
          }
        } catch {}
      }
      nav(role ? homeByRole(role) : '/benh-nhan')
    } catch (e2) {
      playClick('error')
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) {
        setLockUntil(Date.now() + 60000)
        setErr('Sai 5 lần — khóa 60s')
      } else {
        let msg = e2.message || 'Đăng nhập thất bại'
        if (msg.includes('Email not confirmed')) msg = 'Email chưa xác thực — kiểm tra hộp thư'
        if (msg.includes('Invalid login')) msg = 'Email hoặc mật khẩu sai'
        setErr(msg)
      }
    } finally { setLoading(false) }
  }
  async function handleReset() {
    playClick('pop')
    if (!email) return setErr('Nhập email để đặt lại')
    try { await resetPassword(email); toast.push('Đã gửi email đặt lại (nếu tồn tại)', 'success'); playClick('success') }
    catch (e) { setErr(e.message); playClick('error') }
  }

  return (
    <div className="min-h-screen bg-snow flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[960px] grid md:grid-cols-2 rounded-[32px] overflow-hidden bg-stone"
      >
        {/* left - brand */}
        <motion.div variants={container} initial="hidden" animate="visible" className="bg-forest text-snow p-8 md:p-10 flex flex-col">
          <motion.div variants={item} className="flex items-center gap-2">
            <span className="font-medium tracking-tight text-[18px]">DermaCare</span>
            <span className="w-2 h-2 rounded-full bg-lime" />
          </motion.div>
          <motion.h1 variants={item} className="font-light text-[36px] md:text-[40px] leading-[1.1] tracking-[-0.4px] mt-8">Chào mừng<br />trở lại</motion.h1>
          <motion.p variants={item} className="text-[16px] mt-4 leading-[1.5] opacity-90">Bệnh nhân đặt lịch trong 2 phút. Bác sĩ & quản trị nhận thông báo realtime.</motion.p>
          <motion.div variants={container} className="mt-8 space-y-3 text-[16px]">
            <motion.div variants={item} className="flex items-center gap-3"><ShieldCheck size={16} strokeWidth={1.5} /> Xác thực + phân quyền theo hàng</motion.div>
            <motion.div variants={item} className="flex items-center gap-3"><ImageIcon size={16} strokeWidth={1.5} /> Ảnh riêng tư · liên kết có hạn</motion.div>
            <motion.div variants={item} className="flex items-center gap-3"><ClipboardList size={16} strokeWidth={1.5} /> Mã DERM-YYYY-XXXXXX</motion.div>
          </motion.div>
          <motion.div variants={item} className="mt-auto pt-10 text-[14px] opacity-70">
            <Link to="/" onClick={() => playClick('pop')} className="underline underline-offset-4 decoration-[1.5px]">← Về trang chủ</Link>
          </motion.div>
        </motion.div>

        {/* right - form */}
        <motion.div variants={container} initial="hidden" animate="visible" className="bg-snow p-8 md:p-10">
          <motion.h2 variants={item} className="font-light text-[32px] leading-[1.2] tracking-[-0.4px]">Đăng nhập</motion.h2>
          <motion.p variants={item} className="text-[16px] text-pewter mt-2">Dùng email của bạn để tiếp tục</motion.p>

          {isDemoMode && (
            <motion.div variants={item} className="mt-5 px-3 py-2.5 rounded-2xl bg-stone text-[14px] text-forest">
              <span className="px-2 py-[6px] rounded-pill bg-lime text-[12px] font-medium mr-2">Demo</span>
              Thử <span className="font-mono font-light">benhnhan@demo.vn</span> · <span className="font-mono font-light">bs@demo.vn</span> · <span className="font-mono font-light">admin@demo.vn</span> — mật khẩu bất kỳ ≥6 ký tự
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <motion.label variants={item} className="block">
              <span className="text-[12px] uppercase tracking-wide text-pewter font-medium">Email</span>
              <input onFocus={() => playClick('pop')} value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="ban@email.com" className="mt-2 w-full px-4 py-[14px] rounded-lg bg-transparent border-[1.5px] border-forest/30 text-[16px] text-forest placeholder:text-ash focus:outline-none focus:border-forest" />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className="text-[12px] uppercase tracking-wide text-pewter font-medium">Mật khẩu</span>
              <div className="relative mt-2">
                <input onFocus={() => playClick('pop')} value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full px-4 py-[14px] pr-12 rounded-lg bg-transparent border-[1.5px] border-forest/30 text-[16px] placeholder:text-ash focus:outline-none focus:border-forest" />
                <button type="button" onClick={() => { playClick('tap'); setShowPassword(s => !s) }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-stone text-pewter" aria-label="toggle">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.label>

            {err && <motion.div variants={item} className="text-[14px] text-forest bg-stone rounded-2xl px-4 py-3 flex gap-2"><Lock size={15} className="mt-0.5 shrink-0" />{err}</motion.div>}

            <motion.button variants={item} disabled={loading || Date.now() < lockUntil} className="w-full py-4 rounded-pill bg-forest text-snow text-[16px] hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading ? 'Đang đăng nhập…' : Date.now() < lockUntil ? `Khóa ${Math.ceil((lockUntil - Date.now()) / 1000)}s` : <>Đăng nhập <ArrowRight size={16} strokeWidth={1.5} /></>}
            </motion.button>

            <motion.div variants={item} className="flex items-center justify-between text-[16px] pt-1">
              <button type="button" onClick={handleReset} className="underline underline-offset-4 decoration-[1.5px]">Quên mật khẩu?</button>
              <Link to="/register" onClick={() => playClick('tap')} className="underline underline-offset-4 decoration-[1.5px] font-medium">Tạo tài khoản →</Link>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
