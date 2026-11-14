import { NavLink, Outlet } from 'react-router-dom'

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition ${isActive ? 'bg-grafite-800 text-azul' : 'text-slate-300 hover:text-slate-100'}`

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Administração</h1>
        <nav className="mt-3 flex flex-wrap gap-1 border-b border-grafite-700 pb-3" aria-label="Administração">
          <NavLink to="/admin/links" className={tab}>Links</NavLink>
          <NavLink to="/admin/cursos" className={tab}>Cursos</NavLink>
          <NavLink to="/admin/categorias" className={tab}>Categorias</NavLink>
          <NavLink to="/admin/usuarios" className={tab}>Usuários</NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  )
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-grafite-700 bg-grafite-900 p-5">
      <h2 className="text-lg font-medium text-slate-100">{title}</h2>
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'azul' | 'vermelho' }) {
  const color = { neutral: 'bg-grafite-700 text-slate-300', azul: 'bg-azul/15 text-azul', vermelho: 'bg-vermelho/15 text-vermelho' }[tone]
  return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{children}</span>
}
