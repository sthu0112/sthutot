import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, Lock, Menu } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export default function Header({ onMenu }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useRef(null)

  useEffect(()=>{
    function onKey(e){
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); document.getElementById('global-search')?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[])

  useEffect(()=>{
    if (!q.trim()) { setResults([]); setOpen(false); return }
    const t = setTimeout(async()=>{
      if (isDemoMode) {
        setResults(demoStore.searchPatients(q))
        setOpen(true)
      } else {
        const { data } = await supabase.from('patients').select('id, record_code, full_name, phone').or(`record_code.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(8)
        setResults(data||[]); setOpen(true)
      }
    }, 250)
    return ()=> clearTimeout(t)
  },[q])

  useEffect(()=>{
    function handleClickOutside(e){ if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return ()=> document.removeEventListener('mousedown', handleClickOutside)
  },[])

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        <button onClick={onMenu} className="lg:hidden p-2 rounded-xl bg-slate-900 text-white"><Menu size={18} /></button>
        <div className="flex-1 max-w-2xl relative" ref={ref}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={16} /></span>
            <input id="global-search" value={q} onChange={e=>setQ(e.target.value)} onFocus={()=> q && setOpen(true)} placeholder="Tìm hồ sơ bằng mã (DERM-2026-…) , tên hoặc SĐT — Ctrl+K" className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 rounded-lg px-1.5 py-1">⌘ K</span>
          </div>
          {open && (
            <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
              {results.length===0 ? (
                <div className="p-4 text-sm text-slate-500">
                  {q.trim().startsWith('DERM-') ? 'Không tìm thấy hồ sơ với mã này.' : 'Không tìm thấy. Thử mã hồ sơ chính xác.'}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-80 overflow-auto">
                  {results.map(p=>(
                    <li key={p.id||p.record_code} className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between" onClick={()=>{ setOpen(false); setQ(''); nav(`/patients/${p.id || p.record_code}`)}}>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{p.full_name}</div>
                        <div className="text-xs font-mono text-slate-500">{p.record_code} {p.phone? `· ${p.phone}`:''}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Mở hồ sơ</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-3 py-2 bg-slate-50 text-[11px] text-slate-500">Ưu tiên tìm bằng <span className="font-mono font-semibold">mã hồ sơ</span></div>
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 inline-flex items-center gap-1"><Lock size={12} /> Private</span>
          <span className="px-2 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 inline-flex items-center gap-1"><ShieldCheck size={12} /> {isDemoMode ? 'DEMO MODE' : 'SUPABASE'}</span>
        </div>
      </div>
    </header>
  )
}
