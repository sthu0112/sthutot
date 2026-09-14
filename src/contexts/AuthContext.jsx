import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_PROFILE = { user_id:'demo-doctor', full_name:'BS. Demo (Da liễu)', role:'doctor', phone:'0901234567' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if (isDemoMode) {
      const saved = localStorage.getItem('dermacare_demo_auth')
      if (saved) {
        try { const u = JSON.parse(saved); setUser(u); setProfile({ ...DEMO_PROFILE, ...u }) } catch {}
      }
      setLoading(false)
      return
    }
    let mounted = true
    supabase.auth.getSession().then(({data})=>{
      if (!mounted) return
      const u = data.session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session)=>{
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else { setProfile(null); setLoading(false) }
    })
    return ()=> { mounted=false; sub.subscription.unsubscribe() }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
      if (error) throw error
      setProfile(data)
    } catch (e) {
      console.warn('fetchProfile failed', e)
      setProfile({ user_id: userId, full_name: user?.email || 'Doctor', role:'doctor', phone:'' })
    } finally { setLoading(false) }
  }

  async function signIn(email, password) {
    if (isDemoMode) {
      const role = email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'doctor'
      const saved = localStorage.getItem('dermacare_demo_auth')
      let existingPhone = '0901234567'
      try { if (saved) { const p = JSON.parse(saved); if (p.phone) existingPhone = p.phone; if (p.email === email && p.phone) existingPhone = p.phone } } catch {}
      const u = { id:'demo-doctor', email, full_name: role==='admin' ? 'Admin Demo' : role==='staff' ? 'Staff Demo' : 'BS. Demo', role, phone: existingPhone }
      // preserve full_name/phone if previously edited
      try {
        const prev = saved ? JSON.parse(saved) : null
        if (prev && prev.email === email) { if (prev.full_name) u.full_name = prev.full_name; if (prev.phone) u.phone = prev.phone }
      } catch {}
      setUser(u); setProfile({ user_id:u.id, full_name:u.full_name, role, phone: u.phone })
      localStorage.setItem('dermacare_demo_auth', JSON.stringify(u))
      return { user: u }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, full_name, role='doctor', phone='') {
    if (isDemoMode) {
      // demo: lưu phone vào demo auth
      const u = await signIn(email, password)
      // patch phone/full_name vào demo storage
      try {
        const saved = JSON.parse(localStorage.getItem('dermacare_demo_auth') || '{}')
        saved.full_name = full_name
        if (phone) saved.phone = phone
        localStorage.setItem('dermacare_demo_auth', JSON.stringify(saved))
        setUser(prev=> prev? {...prev, full_name, phone}: prev)
        setProfile(prev=> prev? {...prev, full_name, phone}: prev)
      } catch {}
      return u
    }
    // Validate phone before Supabase call
    if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g,''))) throw new Error('Số điện thoại không hợp lệ')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role, phone } }
    })
    if (error) throw error
    // Nếu Supabase yêu cầu xác thực email, data.user nhưng không có session
    if (data.user && !data.session) {
      // Ghi chú cho UI: cần check email
      return { ...data, needsEmailConfirmation: true }
    }
    if (data.user) {
      // Tạo profile (nếu trigger chưa tự tạo)
      try {
        await supabase.from('profiles').insert({ user_id: data.user.id, full_name, role, phone: phone || null })
      } catch (e) {
        // Nếu đã có trigger, ignore duplicate
        if (!e.message?.includes('duplicate')) console.warn('profile insert', e.message)
      }
    }
    return data
  }

  async function signOut() {
    if (isDemoMode) {
      setUser(null); setProfile(null)
      localStorage.removeItem('dermacare_demo_auth')
      return
    }
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  async function resetPassword(email) {
    if (isDemoMode) {
      alert('[DEMO] Tính năng gửi email đặt lại mật khẩu bị vô hiệu hoá trong chế độ demo.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' })
    if (error) throw error
  }

  // Xác thực lại email + mật khẩu trước khi cho phép chỉnh sửa thông tin nhạy cảm
  async function reauthenticate(email, password) {
    if (!email || !password) throw new Error('Vui lòng nhập email và mật khẩu')
    if (email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) throw new Error('Email xác thực không khớp với tài khoản đang đăng nhập')
    if (isDemoMode) {
      // Demo: chỉ cần password >=6, email khớp là pass (không check thật)
      if (password.length < 6) throw new Error('Mật khẩu phải ít nhất 6 ký tự')
      return true
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error('Mật khẩu không chính xác')
    if (data.user?.id !== user?.id) throw new Error('Xác thực thất bại')
    return true
  }

  async function updateProfile(patch) {
    // patch: { full_name, phone }
    const phone = (patch.phone || '').trim()
    if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g,''))) throw new Error('Số điện thoại di động không hợp lệ (VD: 0901234567 hoặc +84901234567)')
    if (!patch.full_name || !patch.full_name.trim()) throw new Error('Họ tên không được để trống')

    if (isDemoMode) {
      const updatedUser = { ...user, full_name: patch.full_name.trim(), phone }
      const updatedProfile = { ...profile, full_name: patch.full_name.trim(), phone }
      setUser(updatedUser)
      setProfile(updatedProfile)
      localStorage.setItem('dermacare_demo_auth', JSON.stringify(updatedUser))
      // audit local
      try {
        const raw = localStorage.getItem('dermacare_demo_v3')
        // no audit needed here, Settings will push toast
      } catch {}
      return updatedProfile
    }
    const { data, error } = await supabase.from('profiles').update({ full_name: patch.full_name.trim(), phone, updated_at: new Date().toISOString() }).eq('user_id', user.id).select().single()
    if (error) throw error
    setProfile(data)
    // keep user.email consistent, update local user object full_name
    setUser(prev => prev ? { ...prev, full_name: data.full_name } : prev)
    // audit
    await supabase.from('audit_logs').insert({ user_id: user.id, action:'update_profile', table_name:'profiles', resource_type:'profile', record_id: data.id, metadata:{ full_name: data.full_name, phone: data.phone } })
    return data
  }

  const value = { user, profile, loading, signIn, signUp, signOut, resetPassword, reauthenticate, updateProfile, refreshProfile: ()=> user && fetchProfile(user.id), isDemoMode, isAuthenticated: !!user }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
