import { useState, type FormEvent } from 'react'
import { FormMessage } from '../../components/ui/AuthCard'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { supabase } from '../../lib/supabase'
import { ROLE_LABELS } from '../../lib/roles'
import { useAuth } from '../auth/useAuth'
import { friendlyAuthError, validatePassword } from '../auth/messages'

export function ProfilePage() {
  const { profile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    const problem = validatePassword(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('As duas senhas não são iguais.')
    setSubmitting(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (err) return setError(friendlyAuthError(err))
    setPassword('')
    setConfirm('')
    setDone(true)
  }

  return (
    <section className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Meu perfil</h1>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-400">Nome</dt>
            <dd className="text-slate-200">{profile?.full_name?.trim() || 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">E-mail</dt>
            <dd className="text-slate-200">{profile?.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Perfil de acesso</dt>
            <dd className="text-slate-200">{profile ? ROLE_LABELS[profile.role] : ''}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-grafite-700 bg-grafite-900 p-6">
        <h2 className="text-lg font-medium text-slate-100">Trocar senha</h2>
        <Field label="Nova senha" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo de 10 caracteres, com letras e números." />
        <Field label="Repita a nova senha" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <FormMessage kind="error">{error}</FormMessage>}
        {done && <FormMessage kind="success">Senha alterada com sucesso.</FormMessage>}
        <Button type="submit" loading={submitting}>
          Salvar nova senha
        </Button>
      </form>
    </section>
  )
}
