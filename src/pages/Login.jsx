import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Image as ImageIcon, ClipboardList, Eye, EyeOff, Stethoscope, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { playClick } from '../utils/sound'

const container = { hidden:{}, visible:{ transition:{ staggerChildren:0.07, delayChildren:0.15 } } }
const item = { hidden:{ opacity:0, y:12 }, visible:{ opacity:1, y:0, transition:{ duration:0.45, ease:[0.22,1,0.36,1] } } }

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

  async function handleSubmit(e){
    e.preventDefault()
    playClick('tap')
    if (Date.now() < lockUntil) {
      const sec = Math.ceil((lockUntil - Date.now())/1000)
      setErr(`Tạm khóa ${sec}s do sai nhiều lần`)
      playClick('error')
      return
    }
    setErr(''); setLoading(true)
    try {
      const res = await signIn(email, password)
      setAttempts(0)
      playClick('success')
      toast.push('Đăng nhập thành công','success')
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
    } catch (e2){
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
  async function handleReset(){
    playClick('pop')
    if (!email) return setErr('Nhập email để đặt lại')
    try { await resetPassword(email); toast.push('Đã gửi email đặt lại (nếu tồn tại)','success'); playClick('success') }
    catch(e){ setErr(e.message); playClick('error') }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-50 pointer-events-none" />
      <motion.div
        initial={{opacity:0, y:18, scale:0.98}}
        animate={{opacity:1, y:0, scale:1}}
        transition={{duration:0.6, ease:[0.22,1,0.36,1]}}
        className="relative w-full max-w-[860px] grid md:grid-cols-[1.02fr_0.98fr] gap-0 rounded-[24px] overflow-hidden border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.10)] bg-white"
      >
        {/* left - brand */}
        <motion.div variants={container} initial="hidden" animate="visible" className="bg-slate-900 text-white p-7 md:p-8 flex flex-col relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
          <motion.div variants={item} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center"><Stethoscope size={18} /></div>
            <div className="font-bold tracking-tight">DERMACARE</div>
            <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-teal-200">RECORDS</span>
          </motion.div>
          <motion.h1 variants={item} className="text-[26px] font-extrabold leading-none mt-7">Đăng nhập<br/>DermaCare</motion.h1>
          <motion.p variants={item} className="text-sm text-slate-300 mt-3 leading-relaxed">Bệnh nhân đặt lịch trong 2 phút. Bác sĩ & quản trị nhận thông báo realtime.</motion.p>
          <motion.div variants={container} className="mt-6 space-y-2.5 text-sm">
            <motion.div variants={item} className="flex items-center gap-2 text-slate-200"><ShieldCheck size={14} className="text-teal-400" /> Supabase Auth + RLS</motion.div>
            <motion.div variants={item} className="flex items-center gap-2 text-slate-200"><ImageIcon size={14} className="text-teal-400" /> Ảnh PRIVATE • signed URL</motion.div>
            <motion.div variants={item} className="flex items-center gap-2 text-slate-200"><ClipboardList size={14} className="text-teal-400" /> Mã DERM-YYYY-XXXXXX</motion.div>
          </motion.div>
          <motion.div variants={item} className="mt-auto pt-8 flex items-center gap-2 text-xs text-slate-400">
            <Link to="/" onClick={()=>playClick('pop')} className="hover:text-white inline-flex items-center gap-1">← Về trang chủ</Link>
            <span>•</span><span className="inline-flex items-center gap-1"><Sparkles size={12} /> DEMO DATA</span>
          </motion.div>
        </motion.div>

        {/* right - form */}
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 md:p-7">
          <motion.div variants={item} className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold tracking-tight">Chào mừng trở lại</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">Bệnh nhân • Bác sĩ • Admin</span>
          </motion.div>
          <motion.p variants={item} className="text-sm text-slate-500 mt-1">Dùng email phòng khám để tiếp tục</motion.p>

          {isDemoMode && (
            <motion.div variants={item} className="mt-4 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div><b>Demo:</b> thử <span className="font-mono">benhnhan@demo.vn</span> (bệnh nhân) • <span className="font-mono">bs@demo.vn</span> (bác sĩ) • <span className="font-mono">admin@demo.vn</span> (quản trị) — mật khẩu bất kỳ ≥6 ký tự</div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <motion.label variants={item} className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">EMAIL</span>
              <input onFocus={()=>playClick('pop')} value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="bacsi@benhvien.vn" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm transition" />
            </motion.label>
            <motion.label variants={item} className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">MẬT KHẨU</span>
              <div className="relative mt-1.5">
                <input onFocus={()=>playClick('pop')} value={password} onChange={e=>setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm transition" />
                <button type="button" onClick={()=>{ playClick('tap'); setShowPassword(s=>!s)}} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition" aria-label="toggle">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.label>

            {err && <motion.div variants={item} initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex gap-2"><Lock size={14} className="mt-0.5 shrink-0" />{err}</motion.div>}

            <motion.button variants={item} whileTap={{scale:0.98}} whileHover={{scale:1.01}} disabled={loading || Date.now() < lockUntil} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition">
              {loading ? 'Đang đăng nhập…' : Date.now() < lockUntil ? `Khóa ${Math.ceil((lockUntil-Date.now())/1000)}s` : <>Đăng nhập <ArrowRight size={16} /></>}
            </motion.button>

            <motion.div variants={item} className="flex items-center justify-between text-sm pt-1">
              <button type="button" onClick={handleReset} className="text-slate-600 hover:text-slate-900 hover:underline underline-offset-4">Quên mật khẩu?</button>
              <Link to="/register" onClick={()=>playClick('tap')} className="text-teal-700 font-semibold hover:underline underline-offset-4">Tạo tài khoản</Link>
            </motion.div>
          </form>

          <motion.div variants={item} className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <Lock size={12} /> Bảo vệ bởi <b>Supabase RLS</b> • Mã hoá • Audit
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
