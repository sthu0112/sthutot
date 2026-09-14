import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'
import { formatDate } from '../utils/format'
import RecordCode from '../components/RecordCode'

export default function Patients(){
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ data:[], total:0 })
  const perPage = 10

  async function load(){
    if (isDemoMode) setData(demoStore.listPatients({ search, status, sort, page, perPage }))
    else {
      let q = supabase.from('patients').select('*', {count:'exact'}).eq('is_archived', false)
      if (search) q = q.or(`record_code.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`)
      if (status!=='all') q = q.eq('status', status)
      if (sort==='newest') q = q.order('created_at',{ascending:false})
      else if (sort==='oldest') q = q.order('created_at',{ascending:true})
      else if (sort==='name') q = q.order('full_name')
      q = q.range((page-1)*perPage, page*perPage-1)
      const { data: rows, count, error } = await q
      if (!error) setData({ data: rows||[], total: count||0 })
    }
  }
  useEffect(()=>{ load() },[search,status,sort,page])
  useEffect(()=> setPage(1),[search,status,sort])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Bệnh nhân</h1>
        <Link to="/patients/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"><Plus size={16} /> Thêm bệnh nhân</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={16} /></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm bằng mã hồ sơ, tên, SĐT..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="follow_up">Theo dõi</option>
          <option value="archived">Đã lưu trữ</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="name">Tên A-Z</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs tracking-widest text-slate-500">
              <tr><th className="text-left px-4 py-3">MÃ HỒ SƠ</th><th className="text-left px-4 py-3">BỆNH NHÂN</th><th className="text-left px-4 py-3">LẦN KHÁM GẦN NHẤT</th><th className="text-left px-4 py-3">TRẠNG THÁI</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map(p=>(
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{p.record_code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.full_name}</div>
                    <div className="text-xs text-slate-500">{p.phone || '—'} {p.email ? `· ${p.email}`:''}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDate(p.updated_at || p.created_at)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full border font-medium ${p.status==='follow_up' ? 'bg-amber-50 text-amber-700 border-amber-200' : p.status==='archived' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{p.status==='follow_up'?'Theo dõi':p.status==='archived'?'Lưu trữ':'Hoạt động'}</span></td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Link to={`/patients/${p.id}`} className="inline-flex px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-800">Xem hồ sơ</Link>
                  </td>
                </tr>
              ))}
              {data.data.length===0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500">Không tìm thấy bệnh nhân. Thử tìm bằng mã hồ sơ chính xác như <span className="font-mono font-semibold">DERM-2026-000001</span></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm">
          <div className="text-slate-600">Tổng {data.total} hồ sơ</div>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 disabled:opacity-40">Trước</button>
            <span className="px-3 py-1.5">Trang {page} / {Math.max(1, Math.ceil(data.total/perPage))}</span>
            <button disabled={page*perPage >= data.total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 disabled:opacity-40">Sau</button>
          </div>
        </div>
      </div>
    </div>
  )
}
