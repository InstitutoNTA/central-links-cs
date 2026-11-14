import { Navigate, Route, Routes } from 'react-router-dom'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { PendingPage } from '../features/auth/pages/PendingPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { CoursePage } from '../features/catalog/CoursePage'
import { HomePage } from '../features/home/HomePage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { AdminLayout } from '../features/admin/AdminLayout'
import { CategoriesAdminPage } from '../features/admin/CategoriesAdminPage'
import { CoursesAdminPage } from '../features/admin/CoursesAdminPage'
import { LinksAdminPage } from '../features/admin/LinksAdminPage'
import { UsersAdminPage } from '../features/admin/UsersAdminPage'
import { AppLayout } from './AppLayout'
import { RequireActive, RequireAuth, RequireRole } from './guards'
import { NotFoundPage } from './NotFoundPage'

export function App() {
  return (
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
  )
}
