import { useState, type FormEvent } from 'react'
import { FormMessage } from '../../components/ui/AuthCard'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import type { Tables } from '../../types/database.types'
import { Badge, Panel } from './AdminLayout'
import { useAdminCategories, useSaveCategory } from './queries'
import { friendlyDbError, slugify } from './validation'

type Category = Tables<'categories'>

function CategoryForm({ initial, onDone }: { initial: Category | null; onDone: () => void }) {
  const save = useSaveCategory()
  const [name, setName] = useState(initial?.name ?? '')
  const [order, setOrder] = useState(String(initial?.sort_order ?? 0))
  const [active, setActive] = useState(initial?.active ?? true)
  const [problem, setProblem] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    const slug = initial?.slug ?? slugify(clean)
    if (!clean || !slug) return setProblem('Informe o nome da categoria.')
    setProblem(null)
    save.mutate(
      { id: initial?.id ?? null, values: { name: clean, slug, sort_order: Number.parseInt(order, 10) || 0, active } },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nome da categoria" required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      <Field label="Ordem de exibição" type="number" value={order} onChange={(e) => setOrder(e.target.value)} hint="Número menor aparece primeiro." />
      {initial && (
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Categoria ativa
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

export function CategoriesAdminPage() {
  const categories = useAdminCategories()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)

  if (editing) {
    return (
      <Panel title={editing === 'new' ? 'Nova categoria' : 'Editar categoria'}>
        <CategoryForm initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      </Panel>
    )
  }

  return (
    <Panel title="Categorias">
      <Button onClick={() => setEditing('new')}>Nova categoria</Button>
      {categories.isPending ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : categories.data?.length === 0 ? (
        <p className="rounded-xl border border-dashed border-grafite-700 p-6 text-center text-sm text-slate-400">Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <ul className="divide-y divide-grafite-700">
          {categories.data?.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <span className={`flex-1 ${c.active ? 'text-slate-100' : 'text-slate-500 line-through'}`}>{c.name}</span>
              {!c.active && <Badge tone="vermelho">Desativada</Badge>}
              <Button variant="ghost" onClick={() => setEditing(c)} className="!px-3 !py-1.5">Editar</Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
