import { Route, Routes } from 'react-router-dom'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { PendingPage } from '../features/auth/pages/PendingPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { HomePage } from '../features/home/HomePage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { AppLayout } from './AppLayout'
import { RequireActive, RequireAuth } from './guards'
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
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
