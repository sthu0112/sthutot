import { useState } from 'react'
import { User, Shield, FlaskConical, Settings as SettingsIcon, Phone, Mail, BadgeCheck, Edit3, Lock, Eye, EyeOff, Save, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { demoStore } from '../lib/demoStore'
import { isDemoMode } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function Settings(){
  const { profile, user, reauthenticate, updateProfile } = useAuth()
  const toast = useToast()

  // verify modal state
  const [showVerify, setShowVerify] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyPass, setVerifyPass] = useState('')
  const [showVerifyPass, setShowVerifyPass] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [editForm, setEditForm] = useState({ full_name:'', phone:'' })
  const [saving, setSaving] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  function openVerify(){
    setVerifyEmail(user?.email || '')
    setVerifyPass('')
    setShowVerifyPass(false)
    setShowVerify(true)
  }

  async function handleVerify(e){
    e.preventDefault()
    setVerifying(true)
    try{
      await reauthenticate(verifyEmail, verifyPass)
      setVerified(true)
      setShowVerify(false)
      // preload edit form with current profile
      setEditForm({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
      setShowEdit(true)
      toast.push('Xác thực thành công — bạn có thể chỉnh sửa thông tin','success')
    } catch(err){ toast.push(err.message,'error') }
    finally{ setVerifying(false) }
  }

  async function handleSave(e){
    e.preventDefault()
    if (!verified) return toast.push('Vui lòng xác thực email/mật khẩu trước','error')
    setSaving(true)
    try{
      await updateProfile(editForm)
      toast.push('Đã cập nhật thông tin cá nhân','success')
      setShowEdit(false)
      // keep verified for short time then reset
      setTimeout(()=> setVerified(false), 60000)
    } catch(err){ toast.push(err.message,'error') }
    finally{ setSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon size={24} className="text-slate-800" /> Cài đặt</h1>

      {/* Thông tin bác sĩ — card chính */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold border border-white/30">{profile?.full_name?.[0] || 'B'}</div>
            <div className="flex-1">
              <div className="font-bold text-lg leading-none">{profile?.full_name || 'Bác sĩ'}</div>
              <div className="text-sm text-white/80 flex items-center gap-1.5 mt-1"><Mail size={14} /> {user?.email}</div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-semibold"><BadgeCheck size={14} className="text-teal-600" /> {profile?.role || 'doctor'}</span>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><User size={18} className="text-teal-600" /> Thông tin cá nhân</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs tracking-widest text-slate-500 font-semibold">HỌ TÊN</div>
              <div className="font-medium text-slate-900 mt-1">{profile?.full_name || '—'}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs tracking-widest text-slate-500 font-semibold flex items-center gap-1"><Mail size={12} /> EMAIL</div>
              <div className="font-mono text-xs mt-1 truncate">{user?.email || '—'}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs tracking-widest text-slate-500 font-semibold flex items-center gap-1"><Phone size={12} /> SỐ ĐIỆN THOẠI DI ĐỘNG</div>
              <div className="font-medium mt-1">{profile?.phone ? <span className="font-mono">{profile.phone}</span> : <span className="text-slate-400 italic">Chưa cập nhật</span>}</div>
              <div className="text-xs text-slate-500 mt-1">Dùng để liên hệ khẩn cấp & xác thực</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs tracking-widest text-slate-500 font-semibold">VAI TRÒ</div>
              <div className="mt-1"><span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold capitalize">{profile?.role}</span></div>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">User ID: <span className="font-mono">{user?.id}</span></div>
              {verified && <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><BadgeCheck size={12} /> Đã xác thực</span>}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {!showEdit ? (
              <button onClick={openVerify} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
                <Edit3 size={16} /> Chỉnh sửa thông tin
              </button>
            ) : (
              <button onClick={()=>{ setShowEdit(false); setVerified(false) }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium"><X size={16} /> Hủy chỉnh sửa</button>
            )}
            <span className="text-xs text-slate-500 self-center">Cần xác thực email & mật khẩu trước khi sửa</span>
          </div>

          {/* Edit form — chỉ hiện sau khi verified */}
          {showEdit && verified && (
            <form onSubmit={handleSave} className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2"><Edit3 size={16} className="text-teal-600" /> Chỉnh sửa thông tin cá nhân</h4>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1"><Lock size={12} /> Đã xác thực</span>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></span>
                <input value={editForm.full_name} onChange={e=>setEditForm({...editForm, full_name:e.target.value})} placeholder="BS. Nguyễn Văn A" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><Phone size={14} /> Số điện thoại di động</span>
                <input value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} placeholder="0901234567 hoặc +84901234567" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono" />
                <p className="text-xs text-slate-500 mt-1">Số này sẽ hiển thị trong hồ sơ bác sĩ phụ trách. Để trống nếu không muốn cập nhật.</p>
              </label>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>Thông tin sẽ được cập nhật vào <span className="font-mono">profiles</span> (RLS: chỉ bạn hoặc admin sửa được). Thay đổi được ghi audit log.</div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>{ setShowEdit(false); setVerified(false) }} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium">Hủy</button>
                <button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"><Save size={16} /> {saving?'Đang lưu...':'Lưu thay đổi'}</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Verify modal */}
      {showVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={()=>setShowVerify(false)} />
          <form onSubmit={handleVerify} className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3"><Lock size={18} /></div>
            <h3 className="text-lg font-bold text-slate-900">Xác thực trước khi chỉnh sửa</h3>
            <p className="text-sm text-slate-500 mt-1">Vì đây là thông tin nhạy cảm, vui lòng xác nhận email và mật khẩu tài khoản của bạn.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input value={verifyEmail} onChange={e=>setVerifyEmail(e.target.value)} type="email" required placeholder="bacsi@benhvien.vn" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Mật khẩu</span>
                <div className="relative">
                  <input value={verifyPass} onChange={e=>setVerifyPass(e.target.value)} type={showVerifyPass ? 'text' : 'password'} required placeholder="••••••••" className="mt-1 w-full px-3 py-2.5 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  <button type="button" onClick={()=>setShowVerifyPass(s=>!s)} className="absolute right-1 top-1/2 -translate-y-1/2 mt-0.5 p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                    {showVerifyPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowVerify(false)} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium">Hủy</button>
              <button disabled={verifying} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{verifying?'Đang xác thực...':'Xác thực'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield size={18} className="text-emerald-600" /> Bảo mật</h3>
        <ul className="text-sm text-slate-600 space-y-1 list-disc ml-4">
          <li>Auth: Supabase Auth (email/password) — session tự động refresh</li>
          <li>RLS: Row Level Security bật cho tất cả bảng — chỉ authenticated mới đọc/ghi</li>
          <li>Storage: bucket <span className="font-mono">luutruhoso</span> PRIVATE — không public, cần auth</li>
          <li>Chỉnh sửa thông tin cá nhân yêu cầu xác thực lại email + mật khẩu</li>
          <li>Không lưu Service Role Key ở frontend — chỉ dùng anon key</li>
          <li>HTTPS bắt buộc khi deploy production</li>
          <li>Audit log ghi lại mọi thao tác quan trọng</li>
        </ul>
      </div>

      {isDemoMode && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2"><FlaskConical size={18} /> Demo Mode</h3>
          <p className="text-sm text-amber-800 mt-1">Dữ liệu lưu trong localStorage. Nhấn để reset về 5 bệnh nhân mẫu.</p>
          <button onClick={()=>{ if(confirm('Reset demo data?')) { demoStore.reset(); toast.push('Đã reset demo data','success'); location.reload() } }} className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold">Reset demo data</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold mb-2">Trạng thái kết nối</h3>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isDemoMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          {isDemoMode ? 'DEMO — lưu localStorage, chưa lưu Supabase' : 'SUPABASE — đang lưu tài khoản + lịch khám realtime'}
        </div>
        <h3 className="font-semibold mb-2 mt-5">Hướng dẫn kết nối Supabase thật (lưu tài khoản + lịch khám)</h3>
        <ol className="text-sm text-slate-600 list-decimal ml-4 space-y-1">
          <li>Chạy <span className="font-mono">supabase/schema.sql</span> trong SQL Editor</li>
          <li>Chạy <span className="font-mono">supabase/migration_booking.sql</span> (tạo lịch hẹn + thông báo)</li>
          <li>Chạy <span className="font-mono">supabase/migration_fix_auth_booking.sql</span> (vá lưu patient + khách vãng lai) — bắt buộc nếu DB cũ</li>
          <li>Kiểm tra bucket <span className="font-mono">luutruhoso</span> là Private</li>
          <li>Bật Auth → Email/Password ON. Tắt Confirm email khi test</li>
          <li>Copy URL + anon key vào Vercel Env: <span className="font-mono">VITE_SUPABASE_URL</span> / <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>, để <span className="font-mono">VITE_DEMO_MODE</span> rỗng</li>
          <li>Đăng ký tài khoản mới ở /register để test lưu vào <span className="font-mono">auth.users + profiles</span>, đặt lịch ở /dat-lich để test bảng <span className="font-mono">appointments</span></li>
        </ol>
      </div>
    </div>
  )
}
