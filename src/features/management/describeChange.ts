/** Transforma uma linha crua do histórico em texto legível. */
import { ROLE_LABELS, type Role } from '../../lib/roles'
import { WEEKDAY_LABELS } from '../catalog/filters'

export interface AuditEntry {
  id: number
  table_name: string
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_at: string
  changed_by: string | null
}

export const TABLE_LABELS: Record<string, string> = {
  links: 'Link',
  courses: 'Curso',
  categories: 'Categoria',
  profiles: 'Usuário',
  link_courses: 'Vínculo de curso',
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Nome',
  name: 'Nome',
  url: 'Endereço',
  description: 'Descrição',
  category_id: 'Categoria',
  kind: 'Tipo',
  active: 'Ativo',
  weekday: 'Dia da aula',
  sort_order: 'Ordem',
  color: 'Cor',
  slug: 'Identificador',
  icon: 'Ícone',
  role: 'Perfil',
  full_name: 'Nome',
  email: 'E-mail',
}

const IGNORED = new Set(['id', 'created_at', 'updated_at', 'created_by'])
const VERBS: Record<string, string> = { INSERT: 'criado', UPDATE: 'alterado', DELETE: 'removido' }

export interface FieldChange {
  field: string
  label: string
  from: string
  to: string
}

export interface ChangeDescription {
  summary: string
  changes: FieldChange[]
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (field === 'role') return ROLE_LABELS[value as Role] ?? String(value)
  if (field === 'weekday') return WEEKDAY_LABELS[Number(value)] ?? String(value)
  if (field === 'kind') return value === 'mec' ? 'MEC' : 'Comum'
  if (field.endsWith('_id')) return 'definida' // ids não dizem nada para a pessoa
  return String(value)
}

export function describeChange(entry: AuditEntry): ChangeDescription {
  const data = entry.new_data ?? entry.old_data ?? {}
  const itemName = [data.title, data.name, data.email].find((v) => typeof v === 'string' && v.trim() !== '') as string | undefined
  const label = TABLE_LABELS[entry.table_name] ?? entry.table_name
  const verb = VERBS[entry.action] ?? entry.action.toLowerCase()
  const summary = itemName ? `${label} “${itemName}” ${verb}` : `${label} ${verb}`

  const changes: FieldChange[] = []
  if (entry.action === 'UPDATE' && entry.old_data && entry.new_data) {
    for (const field of Object.keys(entry.new_data)) {
      if (IGNORED.has(field)) continue
      const before = entry.old_data[field]
      const after = entry.new_data[field]
      if (JSON.stringify(before) === JSON.stringify(after)) continue
      changes.push({ field, label: FIELD_LABELS[field] ?? field, from: formatValue(field, before), to: formatValue(field, after) })
    }
  }
  return { summary, changes }
}
