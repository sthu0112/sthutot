import { Link, useLocation } from 'react-router-dom'
import { CalendarCheck, MessageCircle, BookOpen, Home, LogOut, Stethoscope, ClipboardList, ShieldCheck, X } from 'lucide-react'
import { useAuth, homeByRole } from '../contexts/AuthContext'
import { playClick } from '../utils/sound'

const LINKS = {
  patient: [
    { to: '/benh-nhan', label: 'Lịch của tôi', icon: CalendarCheck },
    { to: '/dat-lich', label: 'Đặt lịch khám', icon: Stethoscope },
    { to: '/tro-ly-ai', label: 'Hỏi AI', icon: MessageCircle },
    { to: '/cam-nang', label: 'Cẩm nang', icon: BookOpen },
    { to: '/', label: 'Trang chủ', icon: Home },
  ],
  doctor: [
    { to: '/bac-si', label: 'Lịch bệnh nhân', icon: CalendarCheck },
    { to: '/dashboard', label: 'Hồ sơ bệnh án', icon: ClipboardList },
    { to: '/tro-ly-ai', label: 'Hỏi AI', icon: MessageCircle },
    { to: '/cam-nang', label: 'Cẩm nang', icon: BookOpen },
    { to: '/', label: 'Trang chủ', icon: Home },
  ],
  admin: [
    { to: '/admin', label: 'Quản trị', icon: ShieldCheck },
    { to: '/dashboard', label: 'Hồ sơ bệnh án', icon: ClipboardList },
    { to: '/tro-ly-ai', label: 'Hỏi AI', icon: MessageCircle },
    { to: '/cam-nang', label: 'Cẩm nang', icon: BookOpen },
    { to: '/', label: 'Trang chủ', icon: Home },
  ],
}

const ROLE_LABEL = { patient: 'Bệnh nhân', doctor: 'Bác sĩ', staff: 'Bác sĩ', admin: 'Quản trị' }

export default function PortalSidebar({ mobileOpen, onClose }) {
  const { profile, user, role, signOut } = useAuth()
  const { pathname } = useLocation()
  const r = role || profile?.role || 'patient'
  const key = r === 'admin' ? 'admin' : r === 'doctor' || r === 'staff' ? 'doctor' : 'patient'
  const links = LINKS[key]
  const home = homeByRole(r)

  const body = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <Link to="/" onClick={() => { playClick('pop'); onClose?.() }} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest text-snow flex items-center justify-center"><Stethoscope size={16} /></div>
          <div>
            <div className="font-medium tracking-tight text-[15px] leading-none">DermaCare</div>
            <div className="text-[11px] text-pewter mt-0.5">{ROLE_LABEL[r] || 'Thành viên'}</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 rounded-full hover:bg-stone" aria-label="Đóng menu"><X size={18} /></button>
        )}
      </div>

      <nav className="px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-[0.14em] text-pewter font-medium px-3 pb-1">Tính năng</div>
        {links.map((l) => {
          const Icon = l.icon
          const activeItem = pathname === l.to || (l.to !== '/' && pathname.startsWith(l.to + '/')) || (l.to === home && pathname === home)
          return (
            <Link
              key={l.to + l.label}
              to={l.to}
              onClick={() => { playClick('tap'); onClose?.() }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14px] font-medium transition ${activeItem ? 'bg-forest text-snow' : 'text-forest hover:bg-stone'}`}
            >
              <Icon size={17} strokeWidth={1.5} /> {l.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-forest/10">
        <div className="text-[13px] font-medium truncate">{profile?.full_name || user?.full_name || 'Thành viên'}</div>
        <div className="text-[12px] text-pewter truncate">{user?.email || ''}</div>
        <button onClick={() => { playClick('tap'); signOut() }} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-pill bg-snow border-[1.5px] border-forest/20 text-[13px] font-medium hover:bg-stone">
          <LogOut size={15} /> Đăng xuất
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: dính trái, luôn thấy khi cuộn */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen bg-snow border-r border-forest/10">
        {body}
      </aside>
      {/* Mobile: ngăn kéo */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-forest/40" onClick={onClose} />
          <div className="relative w-[280px] max-w-[85vw] h-full bg-snow shadow-xl overflow-y-auto">
            {body}
          </div>
        </div>
      )}
    </>
  )
}
