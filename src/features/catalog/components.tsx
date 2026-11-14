import { Link } from 'react-router-dom'
import type { CatalogLink, Category, LinkGroup } from './filters'

/** Link externo: abre em nova aba, sem repassar a origem da Central ao site de destino. */
export function ExternalLink({ link, className = '', children }: { link: CatalogLink; className?: string; children: React.ReactNode }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

/** "MEC" logo abaixo do nome do curso. Sem link cadastrado, mostra aviso (nada é inventado). */
export function MecLink({ mec }: { mec: CatalogLink | undefined }) {
  if (!mec) return <span className="text-xs text-slate-500">MEC: ainda não cadastrado</span>
  return (
    <ExternalLink link={mec} className="text-xs font-medium text-azul hover:underline">
      MEC ↗
    </ExternalLink>
  )
}

export function LinkItem({ link, categoryName }: { link: CatalogLink; categoryName?: string }) {
  return (
    <li>
      <ExternalLink
        link={link}
        className="block rounded-xl border border-grafite-700 bg-grafite-900 p-4 transition hover:border-azul/60 hover:bg-grafite-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-azul/60"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="font-medium text-slate-100">{link.title}</span>
          <span aria-hidden className="text-azul">↗</span>
        </span>
        {link.description && <span className="mt-1 block text-sm text-slate-400">{link.description}</span>}
        {categoryName && <span className="mt-2 inline-block rounded-full bg-grafite-700 px-2 py-0.5 text-xs text-slate-300">{categoryName}</span>}
      </ExternalLink>
    </li>
  )
}

export function GroupedLinks({ groups }: { groups: LinkGroup[] }) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.category?.id ?? 'sem-categoria'}>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">{g.category?.name ?? 'Sem categoria'}</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.links.map((l) => (
              <LinkItem key={l.id} link={l} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function CategoryChips({ categories, value, onChange }: { categories: Category[]; value: string | null; onChange: (id: string | null) => void }) {
  if (categories.length === 0) return null
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition ${active ? 'border-azul bg-azul/15 text-azul' : 'border-grafite-700 text-slate-300 hover:border-slate-500'}`
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
      <button type="button" className={chip(value === null)} onClick={() => onChange(null)}>
        Todas
      </button>
      {categories.map((c) => (
        <button key={c.id} type="button" className={chip(value === c.id)} onClick={() => onChange(c.id)}>
          {c.name}
        </button>
      ))}
    </div>
  )
}

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar links por nome ou descrição…"
      aria-label="Buscar links"
      className="w-full rounded-lg border border-grafite-700 bg-grafite-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-azul focus:outline-none focus:ring-1 focus:ring-azul"
    />
  )
}

export function CourseCard({ course, mec, count }: { course: { slug: string; name: string; color: string }; mec: CatalogLink | undefined; count: number }) {
  return (
    <li className="rounded-xl border border-grafite-700 bg-grafite-900 p-4" style={{ borderLeft: `4px solid ${course.color}` }}>
      <Link to={`/cursos/${course.slug}`} className="font-medium text-slate-100 hover:underline">
        {course.name}
      </Link>
      <div className="mt-1">
        <MecLink mec={mec} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{count === 1 ? '1 link' : `${count} links`}</p>
    </li>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-grafite-700 p-6 text-center text-sm text-slate-400">{children}</p>
}
