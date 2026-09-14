import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'
import { formatDate } from '../utils/format'

export default function Visits(){
  const [visits, setVisits] = useState([])
  const [patientsMap, setPatientsMap] = useState({})

  useEffect(()=>{
    async function load(){
      if (isDemoMode) {
        const vs = demoStore.listAllVisits()
        setVisits(vs)
        const map={}
        demoStore.listPatients({perPage:100}).data.forEach(p=> map[p.id]=p)
        setPatientsMap(map)
      } else {
        const { data } = await supabase.from('visits').select('*, patients(id, full_name, record_code)').order('visit_date',{ascending:false}).limit(50)
        setVisits(data||[])
      }
    }
    load()
  },[])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList size={22} className="text-slate-700" /> Lịch sử khám</h1>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b text-xs tracking-widest text-slate-500">
              <tr><th className="text-left px-4 py-3">NGÀY</th><th className="text-left px-4 py-3">BỆNH NHÂN</th><th className="text-left px-4 py-3">MÃ HỒ SƠ</th><th className="text-left px-4 py-3">CHẨN ĐOÁN</th><th className="text-left px-4 py-3">TÁI KHÁM</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map(v=>{
                const p = isDemoMode ? patientsMap[v.patient_id] : v.patients
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{formatDate(v.visit_date)}</td>
                    <td className="px-4 py-3 font-medium">
                      {p ? <Link to={`/patients/${p.id}`} className="text-teal-700 hover:underline">{p.full_name}</Link> : v.patient_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p?.record_code || '—'}</td>
                    <td className="px-4 py-3 max-w-[320px] truncate" title={v.diagnosis}>{v.diagnosis || '—'}</td>
                    <td className="px-4 py-3 text-xs">{v.follow_up_date ? formatDate(v.follow_up_date) : '—'}</td>
                  </tr>
                )
              })}
              {visits.length===0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500">Chưa có lần khám</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
