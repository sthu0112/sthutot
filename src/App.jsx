import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, homeByRole } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Booking from './pages/Booking'
import SoiDa from './pages/SoiDa'
import AIChatPage from './pages/AIChat'
import { CamNangList, CamNangDetail } from './pages/CamNang'
import PatientPortal from './pages/PatientPortal'
import DoctorPortal from './pages/DoctorPortal'
import AdminPortal from './pages/AdminPortal'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientNew from './pages/PatientNew'
import PatientDetail from './pages/PatientDetail'
import VisitNew from './pages/VisitNew'
import Search from './pages/Search'
import Visits from './pages/Visits'
import Images from './pages/Images'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang kiểm tra phiên...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RoleGuard({ allow, children }) {
  const { profile, loading, isAuthenticated } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const role = profile?.role || 'patient'
  if (!allow.includes(role)) return <Navigate to={homeByRole(role)} replace />
  return children
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading, role, profile } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải...</div>
  if (isAuthenticated) return <Navigate to={homeByRole(role || profile?.role)} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/dat-lich" element={<Booking />} />
      <Route path="/soi-da" element={<SoiDa />} />
      <Route path="/tro-ly-ai" element={<AIChatPage />} />
      <Route path="/cam-nang" element={<CamNangList />} />
      <Route path="/cam-nang/:slug" element={<CamNangDetail />} />

      {/* 3 trang theo vai trò — đăng nhập tự vào đúng trang */}
      <Route path="/benh-nhan" element={<RoleGuard allow={['patient', 'admin']}><PatientPortal /></RoleGuard>} />
      <Route path="/bac-si" element={<RoleGuard allow={['doctor', 'staff', 'admin']}><DoctorPortal /></RoleGuard>} />
      <Route path="/admin" element={<RoleGuard allow={['admin']}><AdminPortal /></RoleGuard>} />

      {/* Hồ sơ bệnh án chuyên sâu (giữ lại cho bác sĩ/admin) */}
      <Route path="/dashboard" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/new" element={<PatientNew />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/visit/new" element={<VisitNew />} />
        <Route path="search" element={<Search />} />
        <Route path="visits" element={<Visits />} />
        <Route path="images" element={<Images />} />
        <Route path="stats" element={<Stats />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/app" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
