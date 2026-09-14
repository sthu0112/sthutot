import { createContext, useContext, useState } from 'react'
const Ctx = createContext(null)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  function push(msg, type='info') {
    const id = Date.now()+Math.random()
    setToasts(t=> [...t, { id, msg, type }])
    setTimeout(()=> setToasts(t=> t.filter(x=>x.id!==id)), 3000)
  }
  return <Ctx.Provider value={{ push }}><>{children}<div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map(t=><div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${t.type==='error' ? 'bg-red-50 border-red-200 text-red-800' : t.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-800'}`}>{t.msg}</div>)}</div></></Ctx.Provider>
}
export function useToast(){ const c=useContext(Ctx); if(!c) throw new Error('useToast missing'); return c }
