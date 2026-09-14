import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
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
    if (form.password.length < 6) return 'Mật khẩu phải ít nhất 6 ký tự'
    if (form.password !== form.confirmPassword) return 'Xác nhận mật khẩu không khớp'
    if (form.license_code && form.license_code.length < 4) return 'Mã chứng chỉ hành nghề không hợp lệ'
    return null
  }

  async function submit(e){
    e.preventDefault(); setErr('')
    const v = validate()
    if (v) return setErr(v)
    setLoading(true)
    try {
      const result = await signUp(form.email.trim(), form.password, form.full_name.trim(), form.role, form.phone.trim())
      if (result?.needsEmailConfirmation) {
        toast.push('Tạo tài khoản thành công — vui lòng kiểm tra email để xác thực trước khi đăng nhập','success')
      } else {
        toast.push('Tạo tài khoản bác sĩ thành công — vui lòng đăng nhập','success')
      }
      nav('/login')
    }
    catch(e2){ setErr(e2.message) } finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white p-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center"><Stethoscope size={20} /></div>
              <div>
                <h2 className="text-2xl font-bold">Đăng ký tài khoản bác sĩ</h2>
                <p className="text-sm text-slate-300">Dành cho bác sĩ da liễu / chuyên gia được cấp phép</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 inline-flex items-center gap-1"><ShieldCheck size={12}/> Duyệt bởi Admin</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">Bảo mật RLS</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">Mã hồ sơ DERM-…</span>
            </div>
          </div>

          <form onSubmit={submit} className="p-8 space-y-5">
            {isDemoMode && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div><span className="font-semibold">Chế độ demo</span> — tài khoản lưu cục bộ (localStorage), không gửi lên Supabase. Nhập bất kỳ email để tạo tài khoản.</div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></span>
                <input placeholder="BS. Nguyễn Văn A" required value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></span>
                <input placeholder="bacsi@benhvien.vn" type="email" required value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
                <input placeholder="0901234567" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Mật khẩu <span className="text-red-500">*</span></span>
                <div className="relative">
                  <input placeholder="Ít nhất 6 ký tự" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="mt-1 w-full px-3 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-1 top-1/2 -translate-y-1/2 mt-0.5 p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Xác nhận mật khẩu <span className="text-red-500">*</span></span>
                <div className="relative">
                  <input placeholder="Nhập lại mật khẩu" type={showConfirm ? 'text' : 'password'} required value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword:e.target.value})} className="mt-1 w-full px-3 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  <button type="button" onClick={()=>setShowConfirm(s=>!s)} className="absolute right-1 top-1/2 -translate-y-1/2 mt-0.5 p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                    {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Chuyên khoa</span>
                <input placeholder="Da liễu, Thẩm mỹ da..." value={form.specialty} onChange={e=>setForm({...form, specialty:e.target.value})} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Mã CCHN / Chứng chỉ</span>
                <input placeholder="012345/CCHN" value={form.license_code} onChange={e=>setForm({...form, license_code:e.target.value})} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Vai trò</span>
                <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white">
                  <option value="doctor">Bác sĩ / Chuyên gia da liễu</option>
                  <option value="staff">Nhân viên y tế (hạn chế quyền)</option>
                  <option value="admin">Quản trị viên (cần phê duyệt)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Tài khoản <b>admin</b> cần được admin hiện tại phê duyệt qua SQL.</p>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-700 flex items-center gap-1"><CheckCircle2 size={14} className="text-teal-600"/> Điều khoản bảo mật</div>
              <ul className="list-disc ml-4 space-y-0.5">
                <li>Tài khoản chỉ cấp cho nhân sự y tế được xác thực</li>
                <li>Mật khẩu được mã hoá (Supabase Auth), không lưu plaintext</li>
                <li>Mọi truy cập hồ sơ được ghi audit log</li>
              </ul>
            </div>

            {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5"/>{err}</div>}
            <button disabled={loading} className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Stethoscope size={18}/> {loading?'Đang tạo tài khoản...':'Đăng ký tài khoản bác sĩ'}
            </button>
            <div className="text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" className="text-teal-700 font-medium hover:underline">Đăng nhập</Link></div>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">DEMO DATA — NOT REAL PATIENT INFORMATION · Chỉ dùng cho đào tạo</p>
      </div>
    </div>
  )
}
