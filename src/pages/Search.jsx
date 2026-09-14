import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, SearchX } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'

export default function SearchPage(){
  const [q, setQ] = useState('DERM-2026-000001')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')

  async function doSearch(query){
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setStatus('idle'); return }
    setStatus('searching')
    if (isDemoMode) {
      const r = demoStore.searchPatients(trimmed)
      setResults(r); setStatus(r.length ? 'found' : 'notfound')
    } else {
      const { data } = await supabase.from('patients').select('id, record_code, full_name, phone').or(`record_code.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`).limit(10)
      setResults(data||[]); setStatus((data||[]).length ? 'found' : 'notfound')
    }
  }
  useEffect(()=>{ doSearch(q) },[])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Search size={24} className="text-slate-700" /> Tìm hồ sơ</h1>
        <p className="text-sm text-slate-500">Ưu tiên tìm bằng <span className="font-mono font-semibold">mã hồ sơ</span> — paste mã như DERM-2026-000128 để mở ngay.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && doSearch(q)} placeholder="Nhập mã hồ sơ, tên hoặc SĐT..." className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          <button onClick={()=>doSearch(q)} className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2"><Search size={16} /> Tìm</button>
        </div>
        <div className="text-xs text-slate-500 mt-2">Phím tắt <span className="font-mono bg-slate-100 border px-1.5 py-0.5 rounded">Ctrl+K</span> để mở tìm kiếm nhanh ở header.</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[200px]">
        {status==='idle' && <div className="text-center py-8 text-slate-500 text-sm">Nhập mã hồ sơ để bắt đầu tìm kiếm</div>}
        {status==='searching' && <div className="text-center py-8 text-slate-500 text-sm">Đang tìm kiếm...</div>}
        {status==='notfound' && <div className="text-center py-8"><div className="flex justify-center mb-2 text-slate-400"><SearchX size={32} /></div><div className="text-sm font-medium">Không tìm thấy</div><div className="text-xs text-slate-500">Không có hồ sơ khớp với “{q}”</div></div>}
        {status==='found' && (
          <div className="space-y-3">
            <div className="text-xs tracking-widest text-slate-500 font-semibold">TÌM THẤY {results.length} HỒ SƠ</div>
            {results.map(p=>(
              <div key={p.id||p.record_code} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">{p.full_name[0]}</div>
                <div className="flex-1">
                  <div className="font-semibold">{p.full_name}</div>
                  <div className="font-mono text-xs text-slate-500">{p.record_code} {p.phone ? `· ${p.phone}`:''}</div>
                </div>
                <Link to={`/dashboard/patients/${p.id || p.record_code}`} className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-medium">Mở hồ sơ</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
