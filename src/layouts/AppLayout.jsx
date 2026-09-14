import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={()=>setMobileOpen(false)} />
          <div className="relative w-[280px] h-full bg-white shadow-xl overflow-auto"><Sidebar onClose={()=>setMobileOpen(false)} collapsed /></div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenu={()=>setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">© 2026 DermaCare — Secure Dermatology Patient Records · Privacy by Design</footer>
      </div>
    </div>
  )
}
