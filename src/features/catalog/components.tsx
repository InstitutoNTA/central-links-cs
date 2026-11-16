import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFavoriteIds, useToggleFavorite, useTrackClick } from './favorites'
import { WEEKDAY_LABELS, type CatalogLink, type Category, type LinkGroup, type WeekdayGroup } from './filters'

/** Link externo: abre em nova aba, sem repassar a origem da Central, e registra o clique. */
export function ExternalLink({ link, className = '', children }: { link: CatalogLink; className?: string; children: React.ReactNode }) {
  const track = useTrackClick()
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track(link.id)}
      onAuxClick={(e) => {
        if (e.button === 1) track(link.id)
      }}
    >
      {children}
    </a>
  )
}

/** Copia o endereço do link para a área de transferência e avisa "Copiado!" por 2 segundos. Não conta como clique. */
export function CopyLinkButton({ link, label, className = '' }: { link: CatalogLink; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url)
      setState('copied')
    } catch {
      setState('error')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar link de ${label ?? link.title}`}
      className={`rounded-md border border-grafite-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-grafite-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-azul/60 ${className}`}
    >
      <span aria-live="polite">{state === 'copied' ? 'Copiado!' : state === 'error' ? 'Não foi possível copiar' : 'Copiar link'}</span>
    </button>
  )
}

/** Botão "Abrir": abre em nova aba e registra o clique. */
export function OpenLinkButton({ link, label, className = '' }: { link: CatalogLink; label?: string; className?: string }) {
  return (
    <ExternalLink
      link={link}
      className={`rounded-md bg-azul px-3 py-1.5 text-xs font-medium text-grafite-950 transition hover:bg-azul/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-azul/60 ${className}`}
    >
      <span className="sr-only">Abrir {label ?? link.title} em nova aba</span>
      <span aria-hidden>Abrir ↗</span>
    </ExternalLink>
  )
}

function AccessRow({ name, courseName, link, emptyText }: { name: string; courseName: string; link: CatalogLink | undefined; emptyText: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-xs font-medium text-slate-300">{name}</span>
      {link ? (
        <>
          <OpenLinkButton link={link} label={`${name} de ${courseName}`} className="!px-2 !py-0.5" />
          <CopyLinkButton link={link} label={`${name} de ${courseName}`} className="!px-2 !py-0.5" />
        </>
      ) : (
        <span className="text-xs text-slate-400">{emptyText}</span>
      )}
    </div>
  )
}

/** Acessos do curso logo abaixo do nome: Plataforma e MEC. Sem link cadastrado, mostra aviso (nada é inventado). */
export function CourseAccess({ courseName, platform, mec }: { courseName: string; platform: CatalogLink | undefined; mec: CatalogLink | undefined }) {
  return (
    <div className="space-y-1.5">
      <AccessRow name="Plataforma" courseName={courseName} link={platform} emptyText="ainda não cadastrada" />
      <AccessRow name="MEC" courseName={courseName} link={mec} emptyText="ainda não cadastrado" />
    </div>
  )
}

export function LinkItem({ link, categoryName }: { link: CatalogLink; categoryName?: string }) {
  const favorites = useFavoriteIds()
  const toggle = useToggleFavorite()
  const isFavorite = favorites.data?.includes(link.id) ?? false

  return (
    <li className="relative rounded-xl border border-grafite-700 bg-grafite-900 p-4 transition hover:border-azul/60">
      <div className="pr-8">
        <span className="font-medium text-slate-100">{link.title}</span>
        {link.description && <span className="mt-1 block text-sm text-slate-400">{link.description}</span>}
        {categoryName && <span className="mt-2 inline-block rounded-full bg-grafite-700 px-2 py-0.5 text-xs text-slate-300">{categoryName}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <OpenLinkButton link={link} />
        <CopyLinkButton link={link} />
      </div>
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remover ${link.title} dos favoritos` : `Favoritar ${link.title}`}
        onClick={() => toggle.mutate({ linkId: link.id, favorite: !isFavorite })}
        className={`absolute right-3 top-3 rounded-md p-1 text-lg leading-none transition focus:outline-none focus-visible:ring-2 focus-visible:ring-azul/60 ${isFavorite ? 'text-vermelho' : 'text-slate-400 hover:text-slate-300'}`}
      >
        {isFavorite ? '★' : '☆'}
      </button>
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

/** Aulas ao vivo por dia da semana; o dia de hoje (Brasília) vem destacado. */
export function LiveClasses({ groups, today }: { groups: WeekdayGroup[]; today: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => {
        const isToday = g.weekday === today
        return (
          <section
            key={g.weekday}
            aria-label={WEEKDAY_LABELS[g.weekday]}
            className={`rounded-xl border p-3 ${isToday ? 'border-azul bg-azul/5' : 'border-grafite-700'}`}
          >
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
              {WEEKDAY_LABELS[g.weekday]}
              {isToday && <span className="rounded-full bg-azul/20 px-2 py-0.5 text-xs text-azul">Hoje</span>}
            </h3>
            <ul className="space-y-2">
              {g.links.map((l) => (
                <LinkItem key={l.id} link={l} />
              ))}
            </ul>
          </section>
        )
      })}
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
      className="w-full rounded-lg border border-grafite-700 bg-grafite-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-azul focus:outline-none focus:ring-1 focus:ring-azul"
    />
  )
}

export function CourseCard({ course, platform, mec, count }: { course: { slug: string; name: string; color: string }; platform: CatalogLink | undefined; mec: CatalogLink | undefined; count: number }) {
  return (
    <li className="rounded-xl border border-grafite-700 bg-grafite-900 p-4" style={{ borderLeft: `4px solid ${course.color}` }}>
      <Link to={`/cursos/${course.slug}`} className="font-medium text-slate-100 hover:underline">
        {course.name}
      </Link>
      <div className="mt-2">
        <CourseAccess courseName={course.name} platform={platform} mec={mec} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{count === 1 ? '1 link' : `${count} links`}</p>
    </li>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-grafite-700 p-6 text-center text-sm text-slate-400">{children}</p>
}
