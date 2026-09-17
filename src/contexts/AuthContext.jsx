import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_PROFILE = { user_id:'demo-patient', full_name:'Khách Demo', role:'patient', phone:'0901234567' }

export function homeByRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'doctor' || role === 'staff') return '/bac-si'
  return '/benh-nhan'
}

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
      setProfile({ user_id: userId, full_name: user?.email || 'Khách hàng', role:'patient', phone:'' })
    } finally { setLoading(false) }
  }

  // ---- Demo auth: mật khẩu thật, băm SHA-256, sai là từ chối ----
  async function sha256hex(text) {
    const input = 'dermacare$' + text
    try {
      if (crypto?.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
        return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
      }
    } catch {}
    // Fallback sync khi không có SubtleCrypto
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16)
  }

  // Tài khoản demo có sẵn (mật khẩu cố định, đã băm — không chấp nhận mật khẩu bịa)
  const DEMO_SEEDS = [
    { id: 'demo-admin', email: 'admin@demo.vn', passHash: 'b79431da49cd76b6ada5e83e9c5ca45a104e52a385167f5e92c50d5a46156774', full_name: 'Quản trị Demo', role: 'admin', phone: '0900000001' },
    { id: 'demo-doctor', email: 'bs@demo.vn', passHash: 'f59c15440f5f9b4aaa66015c051e1aaf47eedd9945228641ce5c479b8187fd5e', full_name: 'BS. Demo', role: 'doctor', phone: '0900000002' },
    { id: 'demo-patient', email: 'benhnhan@demo.vn', passHash: 'a14997b88dc43b40d9b2acac6f3818da80033ac2c50f4d6ed7fe2a25309b5cde', full_name: 'Khách Demo', role: 'patient', phone: '0900000003' },
  ]
  function demoUsers() {
    try {
      const raw = JSON.parse(localStorage.getItem('dermacare_demo_users') || '[]')
      return Array.isArray(raw) ? raw : []
    } catch { return [] }
  }
  function saveDemoUsers(list) {
    try { localStorage.setItem('dermacare_demo_users', JSON.stringify(list)) } catch {}
  }
  function findDemoUser(email) {
    const lower = (email || '').trim().toLowerCase()
    return DEMO_SEEDS.find((u) => u.email === lower) || demoUsers().find((u) => u.email === lower) || null
  }

  async function signIn(email, password) {
    if (isDemoMode) {
      const em = (email || '').trim().toLowerCase()
      if (!em) throw new Error('Vui lòng nhập email')
      const record = findDemoUser(em)
      if (!record) throw new Error('Email này chưa được đăng ký. Vui lòng đăng ký tài khoản trước.')
      const hash = await sha256hex(password || '')
      if (hash !== record.passHash) throw new Error('Mật khẩu không chính xác. Vui lòng thử lại.')
      const u = { id: record.id, email: record.email, full_name: record.full_name, role: record.role, phone: record.phone }
      setUser(u); setProfile({ user_id: u.id, full_name: u.full_name, role: u.role, phone: u.phone })
      localStorage.setItem('dermacare_demo_auth', JSON.stringify(u))
      return { user: u }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, full_name, role='patient', phone='') {
    // role bác sĩ vẫn tồn tại ở backend (admin cấp), nhưng UI đăng ký chỉ cho patient
    if (!['patient','doctor','admin','staff'].includes(role)) role = 'patient'
    if (isDemoMode) {
      const em = (email || '').trim().toLowerCase()
      if (findDemoUser(em)) throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.')
      // role bác sĩ vẫn tồn tại ở backend (admin cấp), UI công khai chỉ tạo patient
      const finalRole = role === 'patient' ? 'patient' : role
      const record = {
        id: 'demo-u-' + Math.random().toString(36).slice(2, 10),
        email: em,
        passHash: await sha256hex(password),
        full_name,
        role: finalRole,
        phone: phone || '',
      }
      const list = demoUsers()
      list.push(record)
      saveDemoUsers(list)
      const u = { id: record.id, email: record.email, full_name: record.full_name, role: record.role, phone: record.phone }
      setUser(u); setProfile({ user_id: u.id, full_name: u.full_name, role: u.role, phone: u.phone })
      localStorage.setItem('dermacare_demo_auth', JSON.stringify(u))
      return { user: u }
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
      // Demo: so mật khẩu băm đã lưu, sai là từ chối
      const record = findDemoUser(email.trim())
      if (!record) throw new Error('Không tìm thấy tài khoản')
      const hash = await sha256hex(password)
      if (hash !== record.passHash) throw new Error('Mật khẩu không chính xác')
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
      // đồng bộ vào danh sách tài khoản demo để lần đăng nhập sau vẫn đúng tên/SĐT
      try {
        const list = demoUsers()
        const idx = list.findIndex((x) => x.email === (user?.email || '').toLowerCase())
        if (idx >= 0) {
          list[idx] = { ...list[idx], full_name: patch.full_name.trim(), phone }
          saveDemoUsers(list)
        }
      } catch {}
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

  const value = { user, profile, loading, signIn, signUp, signOut, resetPassword, reauthenticate, updateProfile, refreshProfile: ()=> user && fetchProfile(user.id), isDemoMode, isAuthenticated: !!user, homeByRole, role: profile?.role || null }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
