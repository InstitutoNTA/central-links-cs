import { useState } from 'react'
import { FormMessage } from '../../components/ui/AuthCard'
import { Button } from '../../components/ui/Button'
import { ROLE_LABELS, type Role } from '../../lib/roles'
import { useAuth } from '../auth/useAuth'
import { Badge, Panel } from './AdminLayout'
import { useAdminUsers, useUpdateUser } from './queries'
import { friendlyDbError } from './validation'

export function UsersAdminPage() {
  const users = useAdminUsers()
  const update = useUpdateUser()
  const { profile: me } = useAuth()
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null)

  return (
    <Panel title="Usuários">
      <p className="text-sm text-slate-400">
        Para criar um novo acesso, cadastre o e-mail em Authentication &gt; Users no painel do Supabase. A pessoa aparece aqui como
        “aguardando ativação”; escolha o perfil e ative.
      </p>
      {update.isError && <FormMessage kind="error">{friendlyDbError(update.error as { code?: string; message?: string })}</FormMessage>}
      {users.isPending ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <ul className="divide-y divide-grafite-700">
          {users.data?.map((u) => {
            const isMe = u.id === me?.id
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  {editingName?.id === u.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        update.mutate({ id: u.id, values: { full_name: editingName.value.trim() || null } }, { onSuccess: () => setEditingName(null) })
                      }}
                    >
                      <input
                        autoFocus
                        aria-label="Nome da pessoa"
                        value={editingName.value}
                        onChange={(e) => setEditingName({ id: u.id, value: e.target.value })}
                        className="min-w-0 flex-1 rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-1.5 text-sm text-slate-100 focus:border-azul focus:outline-none"
                      />
                      <Button type="submit" className="!px-3 !py-1.5">Salvar</Button>
                      <Button type="button" variant="ghost" onClick={() => setEditingName(null)} className="!px-3 !py-1.5">Cancelar</Button>
                    </form>
                  ) : (
                    <>
                      <p className="text-slate-100">
                        {u.full_name?.trim() || 'Sem nome'}{' '}
                        <button type="button" onClick={() => setEditingName({ id: u.id, value: u.full_name ?? '' })} className="text-xs text-azul hover:underline">
                          editar nome
                        </button>
                      </p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </>
                  )}
                  <div className="mt-1.5 flex gap-1.5">
                    {isMe && <Badge tone="azul">Você</Badge>}
                    {!u.active && <Badge tone="vermelho">{u.role === 'colaborador' ? 'Aguardando ativação' : 'Desativado'}</Badge>}
                  </div>
                </div>
                <select
                  aria-label={`Perfil de ${u.email}`}
                  value={u.role}
                  disabled={isMe || update.isPending}
                  onChange={(e) => update.mutate({ id: u.id, values: { role: e.target.value as Role } })}
                  className="rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-2 text-sm text-slate-100 disabled:opacity-60"
                >
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  disabled={isMe || update.isPending}
                  onClick={() => update.mutate({ id: u.id, values: { active: !u.active } })}
                  className="!px-3 !py-1.5"
                >
                  {u.active ? 'Desativar' : 'Ativar'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
