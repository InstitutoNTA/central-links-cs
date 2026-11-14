import { NavLink, Outlet } from 'react-router-dom'

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition ${isActive ? 'bg-grafite-800 text-azul' : 'text-slate-300 hover:text-slate-100'}`

export function ManagementLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Gestão</h1>
        <nav className="mt-3 flex gap-1 border-b border-grafite-700 pb-3" aria-label="Gestão">
          <NavLink to="/gestao/uso" className={tab}>Uso da Central</NavLink>
          <NavLink to="/gestao/historico" className={tab}>Histórico de alterações</NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
