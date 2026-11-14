import { Link, NavLink, Outlet } from 'react-router-dom'
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
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-azul focus:px-3 focus:py-2 focus:text-sm focus:text-grafite-950">
        Pular para o conteúdo
      </a>
      <header className="border-b border-grafite-700 bg-grafite-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="flex items-center gap-3">
            <img src="/logo-nta.png" alt="Instituto NTA" width={53} height={36} className="h-9 w-auto rounded-md min-[1500px]:hidden" />
            <span className="text-sm font-semibold tracking-wide text-slate-100">
              Central de Links <span className="text-azul">CS</span>
            </span>
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
      {/* Telas largas: a logo ocupa o espaço vazio à esquerda do conteúdo e acompanha a rolagem. */}
      <Link
        to="/"
        aria-label="Instituto NTA — ir para o início"
        className="fixed left-6 top-20 hidden min-[1500px]:block"
        style={{ width: 'min(11rem, calc((100vw - 72rem) / 2 - 3rem))' }}
      >
        <img src="/logo-nta.png" alt="" width={212} height={144} className="h-auto w-full rounded-xl" />
      </Link>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">
        <Outlet />
      </main>
    </div>
  )
}
