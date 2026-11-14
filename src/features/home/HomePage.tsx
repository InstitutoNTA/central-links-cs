import { useAuth } from '../auth/useAuth'

export function HomePage() {
  const { profile } = useAuth()
  const firstName = (profile?.full_name?.trim() || profile?.email || '').split(/[\s@]/)[0]

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-100">Olá, {firstName}</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        A Central ainda não tem links cadastrados. Os cursos, as categorias e os links aparecerão aqui nas próximas etapas.
      </p>
    </section>
  )
}
