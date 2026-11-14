import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/useAuth'
import { ROLE_LABELS } from '../lib/roles'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition ${isActive ? 'bg-grafite-800 text-azul' : 'text-slate-300 hover:text-slate-100'}`

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const name = profile?.full_name?.trim() || profile?.email || ''

  return (
    <div className="min-h-screen bg-grafite-950">
      <header className="border-b border-grafite-700 bg-grafite-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-sm font-semibold tracking-wide text-slate-100">
            Central de Links <span className="text-azul">CS</span>
          </span>
          <nav className="flex flex-1 items-center gap-1" aria-label="Principal">
            <NavLink to="/" end className={linkClass}>
              Início
            </NavLink>
            {(profile?.role === 'admin' || profile?.role === 'gestor') && (
              <NavLink to="/gestao" className={linkClass}>
                Gestão
              </NavLink>
            )}
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>
                Administração
              </NavLink>
            )}
            <NavLink to="/perfil" className={linkClass}>
              Meu perfil
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm text-slate-200">{name}</p>
              {profile && <p className="text-xs text-vermelho/90">{ROLE_LABELS[profile.role]}</p>}
            </div>
            <Button variant="ghost" onClick={() => void signOut()} className="!px-3 !py-1.5">
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
