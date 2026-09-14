import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Users, Stethoscope, ClipboardClock, Images, Plus, ClipboardList, Search, Calendar, FileText } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'
import { formatDate } from '../utils/format'

export default function Dashboard(){
  const [stats, setStats] = useState(null)

  useEffect(()=>{
    async function load(){
      if (isDemoMode) setStats(demoStore.stats())
      else {
        const [{count: pCount}, {count: vCount}, {count: iCount}] = await Promise.all([
          supabase.from('patients').select('*', {count:'exact', head:true}).eq('is_archived', false),
          supabase.from('visits').select('*', {count:'exact', head:true}),
          supabase.from('patient_images').select('*', {count:'exact', head:true}),
        ])
        const { data: recentVisits } = await supabase.from('visits').select('*, patients(full_name, record_code)').order('visit_date',{ascending:false}).limit(5)
        const { data: newPatients } = await supabase.from('patients').select('*').eq('is_archived', false).order('created_at',{ascending:false}).limit(5)
        const { count: followUp } = await supabase.from('patients').select('*',{count:'exact', head:true}).eq('status','follow_up').eq('is_archived', false)
        setStats({ totalPatients: pCount||0, totalVisits: vCount||0, totalImages: iCount||0, followUp: followUp||0, recentVisits: recentVisits||[], newPatients: newPatients||[] })
      }
    }
    load()
  },[])

  if (!stats) return <div className="animate-pulse space-y-4"><div className="h-32 bg-slate-200 rounded-2xl" /><div className="h-64 bg-slate-200 rounded-2xl" /></div>

  const cards = [
    { label:'Tổng số bệnh nhân', value: stats.totalPatients, icon: Users, color:'bg-slate-900 text-white' },
    { label:'Số lượt khám', value: stats.totalVisits, icon: Stethoscope, color:'bg-teal-600 text-white' },
    { label:'Hồ sơ cần theo dõi', value: stats.followUp, icon: ClipboardClock, color:'bg-amber-500 text-white' },
    { label:'Hình ảnh đã lưu', value: stats.totalImages, icon: Images, color:'bg-white border border-slate-200 text-slate-900' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Tổng quan hệ thống DermaCare — Secure Dermatology Records</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">DEMO DATA — NOT REAL PATIENT</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c=>{
          const Icon = c.icon
          return (
            <div key={c.label} className={`rounded-2xl p-5 ${c.color} shadow-sm`}>
              <Icon size={24} className={c.color.includes('bg-white')?'text-teal-600':'text-white'} />
              <div className={`text-3xl font-bold mt-2 ${c.color.includes('bg-white')?'text-slate-900':'text-white'}`}>{c.value}</div>
              <div className={`text-xs mt-1 ${c.color.includes('bg-white')?'text-slate-500':'text-white/80'}`}>{c.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/dashboard/patients/new" className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto"><Plus size={20} /></div>
          <div className="text-sm font-semibold mt-2">Thêm bệnh nhân</div>
          <div className="text-xs text-slate-500">Tạo hồ sơ mới</div>
        </Link>
        <Link to="/dashboard/patients" className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto"><ClipboardList size={18} /></div>
          <div className="text-sm font-semibold mt-2">Danh sách bệnh nhân</div><div className="text-xs text-slate-500">Xem & quản lý</div>
        </Link>
        <Link to="/dashboard/search" className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mx-auto"><Search size={18} /></div>
          <div className="text-sm font-semibold mt-2">Tìm hồ sơ</div><div className="text-xs text-slate-500">Bằng mã hồ sơ</div>
        </Link>
        <Link to="/dashboard/images" className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto"><Images size={18} /></div>
          <div className="text-sm font-semibold mt-2">Thư viện ảnh</div><div className="text-xs text-slate-500">Quản lý hình ảnh</div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Calendar size={16} className="text-teal-600" /> Lịch khám gần đây</h3>
            <Link to="/dashboard/visits" className="text-xs font-medium text-teal-700 hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {(stats.recentVisits||[]).map(v=>(
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-700"><Stethoscope size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{v.patients?.full_name || demoStore.getPatient(v.patient_id)?.full_name || v.patient_id}</div>
                  <div className="text-xs text-slate-500 truncate">{v.reason || v.diagnosis || '—'} · {formatDate(v.visit_date)}</div>
                </div>
                <span className="text-xs font-mono bg-white border px-2 py-1 rounded-full">{formatDate(v.visit_date)}</span>
              </div>
            ))}
            {(!stats.recentVisits || stats.recentVisits.length===0) && <div className="text-sm text-slate-500 text-center py-8">Chưa có lượt khám</div>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText size={16} className="text-slate-700" /> Hồ sơ mới</h3>
            <Link to="/dashboard/patients" className="text-xs font-medium text-teal-700 hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-2">
            {(stats.newPatients||[]).map(p=>(
              <Link key={p.id} to={`/dashboard/patients/${p.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">{p.full_name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.full_name}</div>
                  <div className="text-xs font-mono text-slate-500">{p.record_code}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status==='follow_up' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{p.status==='follow_up'?'Theo dõi':'Hoạt động'}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
