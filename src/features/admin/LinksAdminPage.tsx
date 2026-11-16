import { useMemo, useState, type FormEvent } from 'react'
import { FormMessage } from '../../components/ui/AuthCard'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { CopyLinkButton } from '../catalog/components'
import { filterLinks, WEEKDAY_LABELS, type CatalogLink } from '../catalog/filters'
import { Badge, Panel } from './AdminLayout'
import { useAdminCategories, useAdminCourses, useAdminLinks, useSaveLink, useSetLinkActive } from './queries'
import { friendlyDbError, validateLink } from './validation'

function LinkForm({ initial, onDone }: { initial: CatalogLink | null; onDone: () => void }) {
  const courses = useAdminCourses()
  const categories = useAdminCategories()
  const save = useSaveLink()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [isMec, setIsMec] = useState(initial?.kind === 'mec')
  const [courseIds, setCourseIds] = useState<string[]>(initial?.link_courses.map((c) => c.course_id) ?? [])
  const [weekday, setWeekday] = useState(initial?.weekday ? String(initial.weekday) : '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [problems, setProblems] = useState<string[]>([])

  function toggleCourse(id: string) {
    if (isMec) return setCourseIds([id]) // MEC pertence a um único curso
    setCourseIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const kind = isMec ? 'mec' : 'standard'
    const found = validateLink({ title, url, description, kind, courseIds, weekday: weekday ? Number(weekday) : null })
    setProblems(found)
    if (found.length > 0) return
    save.mutate(
      { id: initial?.id ?? null, title, url, description, categoryId: categoryId || null, kind, active, courseIds, weekday: isMec || !weekday ? null : Number(weekday) },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nome do link" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      <Field label="Endereço (https://…)" required inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} hint="Cole o endereço oficial. O sistema só aceita https." />
      <Field label="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Sem categoria</option>
        {categories.data?.filter((c) => c.active || c.id === initial?.category_id).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>

      {!isMec && (
        <Select label="Dia da aula ao vivo (opcional)" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
          <option value="">Não é aula com dia fixo</option>
          {Object.entries(WEEKDAY_LABELS).map(([n, label]) => (
            <option key={n} value={n}>{label}</option>
          ))}
        </Select>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={isMec}
          onChange={(e) => {
            setIsMec(e.target.checked)
            if (e.target.checked) setCourseIds((prev) => prev.slice(0, 1))
          }}
        />
        Este é o link do MEC de um curso
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm text-slate-300">
          {isMec ? 'Curso do MEC (escolha um)' : 'Cursos (deixe em branco para link geral da equipe)'}
        </legend>
        {courses.data?.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type={isMec ? 'radio' : 'checkbox'}
              name="curso"
              checked={courseIds.includes(c.id)}
              onChange={() => toggleCourse(c.id)}
            />
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            {c.name}
          </label>
        ))}
      </fieldset>

      {initial && (
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Link ativo (visível para a equipe)
        </label>
      )}

      {problems.length > 0 && (
        <FormMessage kind="error">{problems.join(' ')}</FormMessage>
      )}
      {save.isError && <FormMessage kind="error">{friendlyDbError(save.error as { code?: string; message?: string })}</FormMessage>}

      <div className="flex gap-3">
        <Button type="submit" loading={save.isPending}>Salvar</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  )
}

export function LinksAdminPage() {
  const links = useAdminLinks()
  const courses = useAdminCourses()
  const categories = useAdminCategories()
  const setActive = useSetLinkActive()
  const [editing, setEditing] = useState<CatalogLink | 'new' | null>(null)
  const [query, setQuery] = useState('')

  const shown = useMemo(() => filterLinks(links.data ?? [], { query }), [links.data, query])
  const courseName = (id: string) => courses.data?.find((c) => c.id === id)?.name ?? ''
  const catName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name

  if (editing) {
    return (
      <Panel title={editing === 'new' ? 'Novo link' : 'Editar link'}>
        <LinkForm initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      </Panel>
    )
  }

  return (
    <Panel title="Links">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nos links cadastrados…"
          aria-label="Buscar nos links cadastrados"
          className="min-w-0 flex-1 rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-azul focus:outline-none"
        />
        <Button onClick={() => setEditing('new')}>Novo link</Button>
      </div>
      {setActive.isError && <FormMessage kind="error">{friendlyDbError(setActive.error as { code?: string; message?: string })}</FormMessage>}
      {links.isPending ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-grafite-700 p-6 text-center text-sm text-slate-400">
          {links.data?.length ? 'Nenhum link encontrado.' : 'Nenhum link cadastrado ainda. Clique em “Novo link” para começar.'}
        </p>
      ) : (
        <ul className="divide-y divide-grafite-700">
          {shown.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${l.active ? 'text-slate-100' : 'text-slate-400 line-through'}`}>{l.title}</p>
                <p className="truncate text-xs text-slate-400">{l.url}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {l.kind === 'mec' && <Badge tone="azul">MEC</Badge>}
                  {!l.active && <Badge tone="vermelho">Desativado</Badge>}
                  {catName(l.category_id) && <Badge>{catName(l.category_id)}</Badge>}
                  {l.weekday && <Badge tone="azul">{WEEKDAY_LABELS[l.weekday]}</Badge>}
                  {l.link_courses.length === 0 && l.kind !== 'mec' && !l.weekday && <Badge>Geral</Badge>}
                  {l.link_courses.map((lc) => <Badge key={lc.course_id}>{courseName(lc.course_id)}</Badge>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir ${l.title} em nova aba`}
                  className="inline-flex items-center rounded-md bg-azul px-3 py-1.5 text-xs font-medium text-grafite-950 transition hover:bg-azul/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-azul/60"
                >
                  Abrir ↗
                </a>
                <CopyLinkButton link={l} />
                <Button variant="ghost" onClick={() => setEditing(l)} className="!px-3 !py-1.5">Editar</Button>
                <Button
                  variant="ghost"
                  onClick={() => setActive.mutate({ id: l.id, active: !l.active })}
                  disabled={setActive.isPending}
                  className="!px-3 !py-1.5"
                >
                  {l.active ? 'Desativar' : 'Reativar'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
