import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Image as ImageIcon, ClipboardList, Eye, EyeOff, Stethoscope, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function Login() {
  const { signIn, resetPassword, isDemoMode } = useAuth()
  const [email, setEmail] = useState('doctor@dermacare.demo')
  const [password, setPassword] = useState('demo1234')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const toast = useToast()
  const [attempts, setAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)

  async function handleSubmit(e){
    e.preventDefault()
    if (Date.now() < lockUntil) {
      const sec = Math.ceil((lockUntil - Date.now())/1000)
      setErr(`Tạm khóa ${sec}s do sai nhiều lần`)
      return
    }
    setErr(''); setLoading(true)
    try {
      await signIn(email, password)
      setAttempts(0)
      toast.push('Đăng nhập thành công','success')
      nav('/dashboard')
    } catch (e2){
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
    if (!email) return setErr('Nhập email để đặt lại')
    try { await resetPassword(email); toast.push('Đã gửi email đặt lại (nếu tồn tại)','success') }
    catch(e){ setErr(e.message) }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-50 pointer-events-none" />
      <motion.div
        initial={{opacity:0, y:14}}
        animate={{opacity:1, y:0}}
        transition={{duration:0.6, ease:[0.22,1,0.36,1]}}
        className="relative w-full max-w-[880px] grid md:grid-cols-[1.05fr_0.95fr] gap-0 rounded-[24px] overflow-hidden border border-slate-200 shadow-xl bg-white"
      >
        {/* left - brand */}
        <div className="bg-slate-900 text-white p-8 md:p-9 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center"><Stethoscope size={18} /></div>
            <div className="font-bold tracking-tight">DERMACARE</div>
            <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-teal-200">RECORDS</span>
          </div>
          <h1 className="text-[28px] font-extrabold leading-none mt-8">Đăng nhập<br/>bác sĩ</h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">Hệ thống an toàn cho phòng khám da liễu. RLS, bucket PRIVATE, audit.</p>
          <div className="mt-6 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-slate-200"><ShieldCheck size={14} className="text-teal-400" /> Supabase Auth + RLS</div>
            <div className="flex items-center gap-2 text-slate-200"><ImageIcon size={14} className="text-teal-400" /> Ảnh PRIVATE • signed URL</div>
            <div className="flex items-center gap-2 text-slate-200"><ClipboardList size={14} className="text-teal-400" /> Mã DERM-YYYY-XXXXXX</div>
          </div>
          <div className="mt-auto pt-8 flex items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="hover:text-white">← Về trang chủ</Link>
            <span>•</span><span>DEMO DATA</span>
          </div>
        </div>

        {/* right - form */}
        <div className="p-7 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Chào mừng trở lại</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">Bác sĩ</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Dùng email phòng khám để tiếp tục</p>

          {isDemoMode && (
            <div className="mt-4 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div><b>Demo:</b> <span className="font-mono">doctor@dermacare.demo</span> / <span className="font-mono">demo1234</span> — nhập bất kỳ email cũng được</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">EMAIL</span>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="bacsi@benhvien.vn" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">MẬT KHẨU</span>
              <div className="relative mt-1.5">
                <input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm" />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="toggle">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex gap-2"><Lock size={14} className="mt-0.5 shrink-0" />{err}</div>}

            <button disabled={loading || Date.now() < lockUntil} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition">
              {loading ? 'Đang đăng nhập…' : Date.now() < lockUntil ? `Khóa ${Math.ceil((lockUntil-Date.now())/1000)}s` : <>Đăng nhập <ArrowRight size={16} /></>}
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <button type="button" onClick={handleReset} className="text-slate-600 hover:text-slate-900">Quên mật khẩu?</button>
              <Link to="/register" className="text-teal-700 font-semibold hover:underline">Đăng ký bác sĩ</Link>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
            Bảo vệ bởi <b>Supabase RLS</b> • Mật khẩu mã hoá • Audit đầy đủ
          </div>
        </div>
      </motion.div>
    </div>
  )
}
