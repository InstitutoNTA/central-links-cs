import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { PendingPage } from '../features/auth/pages/PendingPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { CoursePage } from '../features/catalog/CoursePage'
import { HomePage } from '../features/home/HomePage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { AppLayout } from './AppLayout'
import { RequireActive, RequireAuth, RequireRole } from './guards'
import { NotFoundPage } from './NotFoundPage'

// Áreas de gestão e administração carregam só quando abertas (o colaborador não baixa esse código).
const AdminLayout = lazy(() => import('../features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const CategoriesAdminPage = lazy(() => import('../features/admin/CategoriesAdminPage').then((m) => ({ default: m.CategoriesAdminPage })))
const CoursesAdminPage = lazy(() => import('../features/admin/CoursesAdminPage').then((m) => ({ default: m.CoursesAdminPage })))
const LinksAdminPage = lazy(() => import('../features/admin/LinksAdminPage').then((m) => ({ default: m.LinksAdminPage })))
const UsersAdminPage = lazy(() => import('../features/admin/UsersAdminPage').then((m) => ({ default: m.UsersAdminPage })))
const HistoryPage = lazy(() => import('../features/management/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const ManagementLayout = lazy(() => import('../features/management/ManagementLayout').then((m) => ({ default: m.ManagementLayout })))
const UsagePage = lazy(() => import('../features/management/UsagePage').then((m) => ({ default: m.UsagePage })))

export function App() {
  return (
    <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-400">Carregando…</p>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/aguardando-ativacao" element={<PendingPage />} />
        <Route element={<RequireActive />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="cursos/:slug" element={<CoursePage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route element={<RequireRole roles={['admin', 'gestor']} />}>
              <Route path="gestao" element={<ManagementLayout />}>
                <Route index element={<Navigate to="uso" replace />} />
                <Route path="uso" element={<UsagePage />} />
                <Route path="historico" element={<HistoryPage />} />
              </Route>
            </Route>
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="links" replace />} />
                <Route path="links" element={<LinksAdminPage />} />
                <Route path="cursos" element={<CoursesAdminPage />} />
                <Route path="categorias" element={<CategoriesAdminPage />} />
                <Route path="usuarios" element={<UsersAdminPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
