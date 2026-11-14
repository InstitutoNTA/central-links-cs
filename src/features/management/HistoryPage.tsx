import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { describeChange } from './describeChange'
import { useAuditLog, useProfileNames } from './queries'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })

export function HistoryPage() {
  const [table, setTable] = useState('')
  const log = useAuditLog(table)
  const names = useProfileNames()
  const entries = log.data?.pages.flat() ?? []

  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <Select label="Mostrar" value={table} onChange={(e) => setTable(e.target.value)}>
          <option value="">Todas as alterações</option>
          <option value="links">Links</option>
          <option value="courses">Cursos</option>
          <option value="categories">Categorias</option>
          <option value="profiles">Usuários</option>
          <option value="link_courses">Vínculos de curso</option>
        </Select>
      </div>

      {log.isPending && <p role="status" className="text-sm text-slate-400">Carregando…</p>}
      {log.isError && <p role="alert" className="text-sm text-vermelho">Não foi possível carregar o histórico. Atualize a página.</p>}
      {log.data && entries.length === 0 && (
        <p className="rounded-xl border border-dashed border-grafite-700 p-6 text-center text-sm text-slate-400">Nenhuma alteração registrada.</p>
      )}

      <ul className="space-y-3">
        {entries.map((e) => {
          const d = describeChange(e)
          const who = e.changed_by ? (names.data?.get(e.changed_by) ?? 'Usuário removido') : 'Sistema'
          return (
            <li key={e.id} className="rounded-xl border border-grafite-700 bg-grafite-900 p-4">
              <p className="text-slate-100">{d.summary}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {dateFmt.format(new Date(e.changed_at))} · por {who}
              </p>
              {d.changes.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {d.changes.map((c) => (
                    <li key={c.field} className="text-slate-300">
                      <span className="text-slate-400">{c.label}:</span> {c.from} <span className="text-azul">→</span> {c.to}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {log.hasNextPage && (
        <Button variant="ghost" onClick={() => void log.fetchNextPage()} loading={log.isFetchingNextPage}>
          Carregar mais
        </Button>
      )}
    </div>
  )
}
