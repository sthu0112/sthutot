import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Lock, Image as ImageIcon, ClipboardList, Eye, EyeOff, Stethoscope } from 'lucide-react'
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
      setErr(`Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ${sec}s`)
      return
    }
    setErr(''); setLoading(true)
    try {
      await signIn(email, password)
      setAttempts(0)
      toast.push('Đăng nhập thành công','success')
      nav('/')
    }
    catch (e2){
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) {
        setLockUntil(Date.now() + 60000)
        setErr('Sai mật khẩu quá 5 lần — khóa 60s để bảo vệ tài khoản')
      } else {
        let msg = e2.message || 'Đăng nhập thất bại'
        if (msg.includes('Email not confirmed')) msg = 'Email chưa xác thực — vui lòng kiểm tra hộp thư'
        if (msg.includes('Invalid login')) msg = 'Email hoặc mật khẩu không chính xác'
        setErr(msg)
      }
    }
    finally { setLoading(false) }
  }
  async function handleReset(){
    if (!email) return setErr('Nhập email để đặt lại mật khẩu')
    try { await resetPassword(email); toast.push('Đã gửi email đặt lại mật khẩu (nếu tồn tại)','success') }
    catch(e){ setErr(e.message) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center"><Stethoscope size={24} /></div>
            <h1 className="text-3xl font-bold mt-6">DERMA CARE</h1>
            <p className="text-teal-200 text-sm tracking-widest">Secure Dermatology Patient Records</p>
            <p className="text-slate-300 text-sm mt-6 leading-relaxed">Hệ thống quản lý hồ sơ da liễu bảo mật — chỉ dành cho bác sĩ/chuyên gia được cấp quyền. Security First → Data Integrity → Authorization.</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-teal-400" /> Supabase Auth + RLS</li>
              <li className="flex items-center gap-2"><ImageIcon size={16} className="text-teal-400" /> Private Storage cho hình ảnh</li>
              <li className="flex items-center gap-2"><ClipboardList size={16} className="text-teal-400" /> Mã hồ sơ duy nhất DERM-YYYY-XXXXXX</li>
              <li className="flex items-center gap-2"><Lock size={16} className="text-teal-400" /> Audit log đầy đủ</li>
            </ul>
          </div>
          <div className="text-xs text-slate-400 mt-8">DEMO DATA — NOT REAL PATIENT INFORMATION</div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
          <p className="text-sm text-slate-500 mt-1">Dành cho bác sĩ / chuyên gia da liễu</p>

          {isDemoMode && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <div className="font-semibold">Chế độ DEMO</div>
              <div>Nhập bất kỳ email nào để đăng nhập. Ví dụ:</div>
              <div className="font-mono text-xs mt-1">doctor@dermacare.demo / admin@dermacare.demo / staff@dermacare.demo</div>
              <div className="text-xs mt-1">Mật khẩu bất kỳ (demo1234)</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="bacsi@benhvien.vn" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="mt-1 w-full px-3 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex gap-2"><Lock size={14} className="shrink-0 mt-0.5" />{err}</div>}
            <button disabled={loading || Date.now() < lockUntil} className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 transition">{Date.now() < lockUntil ? `Khóa ${Math.ceil((lockUntil-Date.now())/1000)}s` : loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={handleReset} className="text-teal-700 hover:underline font-medium">Quên mật khẩu?</button>
              <span className="text-slate-400">Chưa có tài khoản? <Link to="/register" className="text-teal-700 font-medium">Đăng ký bác sĩ</Link></span>
            </div>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="font-semibold">Tài khoản demo gợi ý</div>
            <div className="grid grid-cols-1 gap-1 mt-1 font-mono">
              <div>doctor@dermacare.demo — Doctor</div>
              <div>admin@dermacare.demo — Admin</div>
              <div>staff@dermacare.demo — Staff (hạn chế)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
