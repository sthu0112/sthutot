import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
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
function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải...</div>
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/" element={<Protected><AppLayout /></Protected>}>
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
