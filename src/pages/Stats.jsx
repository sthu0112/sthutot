import { useEffect, useState } from 'react'
import { BarChart3, Shield } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'

export default function Stats(){
  const [data, setData] = useState(null)
  const [audit, setAudit] = useState([])
  useEffect(()=>{
    async function load(){
      if (isDemoMode) { setData(demoStore.stats()); setAudit(demoStore.listAudit()) }
      else {
        const [{count: p}, {count: v}, {count: i}] = await Promise.all([
          supabase.from('patients').select('*',{count:'exact', head:true}).eq('is_archived', false),
          supabase.from('visits').select('*',{count:'exact', head:true}),
          supabase.from('patient_images').select('*',{count:'exact', head:true}),
        ])
        setData({ totalPatients:p||0, totalVisits:v||0, totalImages:i||0 })
        const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(20)
        setAudit(logs||[])
      }
    }
    load()
  },[])
  if (!data) return <div className="animate-pulse h-64 bg-slate-200 rounded-2xl" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 size={24} className="text-slate-700" /> Thống kê</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Tổng bệnh nhân" value={data.totalPatients} />
        <Stat label="Tổng lượt khám" value={data.totalVisits} />
        <Stat label="Tổng hình ảnh" value={data.totalImages} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={18} className="text-emerald-600" /> Audit Log — Nhật ký truy cập</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs tracking-widest text-slate-500 border-b"><tr><th className="text-left py-2">THỜI GIAN</th><th className="text-left py-2">USER</th><th className="text-left py-2">ACTION</th><th className="text-left py-2">TABLE</th><th className="text-left py-2">RECORD</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {audit.map(l=>(
                <tr key={l.id}><td className="py-2 text-xs font-mono">{new Date(l.created_at).toLocaleString('vi-VN')}</td><td className="py-2 text-xs font-mono">{(l.user_id||'').slice(0,8)}</td><td className="py-2"><span className="px-2 py-1 rounded-full bg-slate-100 border text-xs">{l.action}</span></td><td className="py-2 text-xs">{l.table_name}</td><td className="py-2 font-mono text-xs">{(l.record_id||'—').toString().slice(0,8)}</td></tr>
              ))}
              {audit.length===0 && <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có log</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-slate-500 mt-3">Ghi lại: ai tạo/sửa hồ sơ, ai upload ảnh, ai archive — phục vụ truy vết bảo mật.</div>
      </div>
    </div>
  )
}
function Stat({ label, value }){ return <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center"><div className="text-3xl font-bold text-slate-900">{value}</div><div className="text-sm text-slate-500 mt-1">{label}</div></div> }
