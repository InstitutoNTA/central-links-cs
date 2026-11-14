import { useState } from 'react'
import { Select } from '../../components/ui/Select'
import { useUsage, type Period } from './queries'

const nf = new Intl.NumberFormat('pt-BR')
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-grafite-700 bg-grafite-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-100">{nf.format(value)}</p>
    </div>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color?: string | null }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <li className="space-y-1">
      <div className="flex justify-between gap-3 text-sm">
        <span className="truncate text-slate-200">{label}</span>
        <span className="text-slate-400">{nf.format(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-grafite-800">
        <div className="h-2 rounded-full" style={{ width: `${value > 0 ? width : 0}%`, background: color ?? '#6f9cf0' }} />
      </div>
    </li>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-grafite-700 bg-grafite-900 p-5">
      <h2 className="text-base font-medium text-slate-100">{title}</h2>
      {children}
    </section>
  )
}

export function UsagePage() {
  const [days, setDays] = useState<Period>(30)
  const usage = useUsage(days)

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <Select label="Período" value={days} onChange={(e) => setDays(Number(e.target.value) as Period)}>
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </Select>
      </div>

      {usage.isPending && <p role="status" className="text-sm text-slate-400">Carregando…</p>}
      {usage.isError && <p role="alert" className="text-sm text-vermelho">Não foi possível carregar as métricas. Atualize a página.</p>}

      {usage.data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Cliques em links" value={usage.data.overview.total_clicks} />
            <Kpi label="Pessoas que acessaram" value={usage.data.overview.active_users} />
            <Kpi label="Links diferentes acessados" value={usage.data.overview.links_clicked} />
          </div>

          {usage.data.overview.total_clicks === 0 ? (
            <p className="rounded-xl border border-dashed border-grafite-700 p-6 text-center text-sm text-slate-400">
              Ainda não há cliques registrados neste período.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Links mais acessados">
                <ul className="space-y-3">
                  {usage.data.top.map((l) => (
                    <Bar key={l.link_id} label={l.title} value={l.clicks} max={usage.data.top[0]?.clicks ?? 0} />
                  ))}
                </ul>
              </Card>
              <Card title="Cliques por curso">
                <ul className="space-y-3">
                  {usage.data.byCourse.map((c) => (
                    <Bar key={c.course_id ?? 'gerais'} label={c.name} value={c.clicks} max={usage.data.byCourse[0]?.clicks ?? 0} color={c.color} />
                  ))}
                </ul>
              </Card>
              <Card title="Cliques por dia">
                <div className="flex h-32 items-end gap-0.5" role="img" aria-label="Gráfico de cliques por dia">
                  {usage.data.byDay.map((d) => {
                    const max = Math.max(...usage.data.byDay.map((x) => x.clicks), 1)
                    return (
                      <div
                        key={d.day}
                        title={`${d.day.split('-').reverse().join('/')}: ${d.clicks}`}
                        className="flex-1 rounded-t bg-azul/70"
                        style={{ height: `${d.clicks > 0 ? Math.max(4, (d.clicks / max) * 100) : 0}%` }}
                      />
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          <Card title="Uso por pessoa">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2 pr-4 font-normal">Pessoa</th>
                    <th className="py-2 pr-4 font-normal">Cliques</th>
                    <th className="py-2 font-normal">Último acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grafite-700">
                  {usage.data.byUser.map((u) => (
                    <tr key={u.user_id}>
                      <td className="py-2 pr-4 text-slate-200">{u.full_name?.trim() || u.email}</td>
                      <td className="py-2 pr-4 text-slate-200">{nf.format(u.clicks)}</td>
                      <td className="py-2 text-slate-400">{u.last_click ? dateFmt.format(new Date(u.last_click)) : 'sem acesso no período'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
