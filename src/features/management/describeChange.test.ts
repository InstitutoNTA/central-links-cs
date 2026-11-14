import { describe, expect, it } from 'vitest'
import { describeChange, type AuditEntry } from './describeChange'

function entry(over: Partial<AuditEntry>): AuditEntry {
  return { id: 1, table_name: 'links', action: 'UPDATE', old_data: null, new_data: null, changed_at: '', changed_by: null, ...over }
}

describe('describeChange', () => {
  it('descreve criação com o nome do item', () => {
    const d = describeChange(entry({ action: 'INSERT', new_data: { title: 'Matrículas' } }))
    expect(d.summary).toBe('Link “Matrículas” criado')
    expect(d.changes).toEqual([])
  })
  it('descreve remoção usando os dados antigos', () => {
    const d = describeChange(entry({ table_name: 'categories', action: 'DELETE', old_data: { name: 'Relatórios' } }))
    expect(d.summary).toBe('Categoria “Relatórios” removido')
  })
  it('lista só os campos que mudaram e ignora updated_at', () => {
    const d = describeChange(entry({
      old_data: { title: 'A', url: 'https://x.test', active: true, updated_at: '1' },
      new_data: { title: 'B', url: 'https://x.test', active: false, updated_at: '2' },
    }))
    expect(d.changes.map((c) => c.field)).toEqual(['title', 'active'])
    expect(d.changes[1]).toMatchObject({ label: 'Ativo', from: 'Sim', to: 'Não' })
  })
  it('traduz perfil de acesso', () => {
    const d = describeChange(entry({
      table_name: 'profiles',
      old_data: { email: 'a@b.c', role: 'colaborador' },
      new_data: { email: 'a@b.c', role: 'gestor' },
    }))
    expect(d.changes).toEqual([{ field: 'role', label: 'Perfil', from: 'Colaborador', to: 'Gestor' }])
  })
  it('não mostra ids crus', () => {
    const d = describeChange(entry({ old_data: { title: 'A', category_id: null }, new_data: { title: 'A', category_id: 'abc-123' } }))
    expect(d.changes[0]).toMatchObject({ label: 'Categoria', from: '—', to: 'definida' })
  })
  it('funciona sem nome do item', () => {
    expect(describeChange(entry({ table_name: 'link_courses', action: 'INSERT', new_data: { link_id: 'x' } })).summary).toBe('Vínculo de curso criado')
  })
})
