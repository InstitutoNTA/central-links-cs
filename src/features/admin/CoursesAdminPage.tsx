import { useState, type FormEvent } from 'react'
import { FormMessage } from '../../components/ui/AuthCard'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import type { Tables } from '../../types/database.types'
import { Badge, Panel } from './AdminLayout'
import { useAdminCourses, useSaveCourse } from './queries'
import { friendlyDbError, slugify } from './validation'

type Course = Tables<'courses'>

function CourseForm({ initial, onDone }: { initial: Course | null; onDone: () => void }) {
  const save = useSaveCourse()
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? '#6f9cf0')
  const [order, setOrder] = useState(String(initial?.sort_order ?? 0))
  const [active, setActive] = useState(initial?.active ?? true)
  const [problem, setProblem] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    const slug = initial?.slug ?? slugify(clean)
    if (!clean || !slug) return setProblem('Informe o nome do curso.')
    setProblem(null)
    save.mutate(
      { id: initial?.id ?? null, values: { name: clean, slug, color, sort_order: Number.parseInt(order, 10) || 0, active } },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nome do curso" required value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
      <div className="space-y-1.5">
        <label htmlFor="cor-curso" className="block text-sm text-slate-300">Cor do curso</label>
        <input id="cor-curso" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 cursor-pointer rounded border border-grafite-700 bg-grafite-950" />
      </div>
      <Field label="Ordem de exibição" type="number" value={order} onChange={(e) => setOrder(e.target.value)} hint="Número menor aparece primeiro." />
      {initial && (
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Curso ativo
        </label>
      )}
      {problem && <FormMessage kind="error">{problem}</FormMessage>}
      {save.isError && <FormMessage kind="error">{friendlyDbError(save.error as { code?: string; message?: string })}</FormMessage>}
      <div className="flex gap-3">
        <Button type="submit" loading={save.isPending}>Salvar</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  )
}

export function CoursesAdminPage() {
  const courses = useAdminCourses()
  const [editing, setEditing] = useState<Course | 'new' | null>(null)

  if (editing) {
    return (
      <Panel title={editing === 'new' ? 'Novo curso' : 'Editar curso'}>
        <CourseForm initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      </Panel>
    )
  }

  return (
    <Panel title="Cursos">
      <Button onClick={() => setEditing('new')}>Novo curso</Button>
      {courses.isPending ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <ul className="divide-y divide-grafite-700">
          {courses.data?.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <span aria-hidden className="h-3.5 w-3.5 rounded-full" style={{ background: c.color }} />
              <span className={`flex-1 ${c.active ? 'text-slate-100' : 'text-slate-500 line-through'}`}>{c.name}</span>
              {!c.active && <Badge tone="vermelho">Desativado</Badge>}
              <Button variant="ghost" onClick={() => setEditing(c)} className="!px-3 !py-1.5">Editar</Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
