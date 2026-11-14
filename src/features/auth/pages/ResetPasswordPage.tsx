import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard, FormMessage } from '../../../components/ui/AuthCard'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../useAuth'
import { friendlyAuthError, validatePassword } from '../messages'

export function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <AuthCard title="Redefinir senha">
        <p className="text-sm text-slate-400">Verificando o link…</p>
      </AuthCard>
    )
  }

  if (!session) {
    return (
      <AuthCard title="Link inválido ou expirado">
        <p className="mb-4 text-sm text-slate-400">Solicite um novo link de recuperação para continuar.</p>
        <Link to="/esqueci-senha" className="text-sm text-azul hover:underline">
          Pedir novo link
        </Link>
      </AuthCard>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const problem = validatePassword(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('As duas senhas não são iguais.')
    setSubmitting(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (err) return setError(friendlyAuthError(err))
    navigate('/', { replace: true })
  }

  return (
    <AuthCard title="Criar nova senha" subtitle="Escolha uma senha com pelo menos 10 caracteres, com letras e números.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nova senha" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Repita a nova senha" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <Button type="submit" loading={submitting} className="w-full">
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  )
}
