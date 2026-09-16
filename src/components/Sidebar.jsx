import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Users, UserPlus, ClipboardList, Images, Search, BarChart3, Settings, LogOut, X, Calendar, ShieldCheck, Stethoscope } from 'lucide-react'
import { useAuth, homeByRole } from '../contexts/AuthContext'

const nav = [
  { to:'/dashboard', label:'Dashboard', icon: LayoutDashboard },
  { to:'/dashboard/patients', label:'Bệnh nhân', icon: Users },
  { to:'/dashboard/patients/new', label:'Thêm bệnh nhân', icon: UserPlus },
  { to:'/dashboard/visits', label:'Lịch sử khám', icon: ClipboardList },
  { to:'/dashboard/images', label:'Hình ảnh', icon: Images },
  { to:'/dashboard/search', label:'Tìm hồ sơ', icon: Search },
  { to:'/dashboard/stats', label:'Thống kê', icon: BarChart3 },
  { to:'/dashboard/settings', label:'Cài đặt', icon: Settings },
]

export default function Sidebar({ collapsed=false, onClose }) {
  const { profile, signOut, role } = useAuth()
  const home = homeByRole(role || profile?.role)
  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col ${collapsed ? 'w-full' : 'w-[260px] shrink-0'} min-h-screen`}>
      <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white"><ClipboardList size={18} /></div>
          <div>
            <div className="font-bold text-slate-900 leading-none">DERMA CARE</div>
            <div className="text-[11px] tracking-widest text-teal-600 font-medium">SECURE RECORDS</div>
          </div>
        </Link>
        {onClose && <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>}
      </div>

      <div className="px-3 py-3">
        <div className="text-[11px] font-semibold tracking-widest text-slate-400 px-3 py-2">MENU</div>
        <nav className="space-y-1">
          <NavLink to={home} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            {role === 'admin' ? <ShieldCheck size={18} /> : role === 'doctor' ? <Stethoscope size={18} /> : <Calendar size={18} />} Trang của tôi
          </NavLink>
          {nav.map(item=>{
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className={({isActive})=> `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon size={18} /> {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">{profile?.full_name?.[0] || 'D'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{profile?.full_name || 'Bác sĩ'}</div>
            <div className="text-xs text-slate-500 capitalize">{profile?.role || 'doctor'}</div>
          </div>
        </div>
        <button onClick={signOut} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
          <LogOut size={16} /> Đăng xuất
        </button>
        <div className="text-[11px] text-center text-slate-400 mt-3">DEMO DATA — NOT REAL PATIENT</div>
      </div>
    </aside>
  )
}
