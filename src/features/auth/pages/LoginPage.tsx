import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthCard, FormMessage } from '../../../components/ui/AuthCard'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { useAuth } from '../useAuth'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <AuthCard title="Entrar" subtitle="Use o e-mail e a senha cadastrados para você.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <Button type="submit" loading={submitting} className="w-full">
          Entrar
        </Button>
        <p className="text-center text-sm">
          <Link to="/esqueci-senha" className="text-azul hover:underline">
            Esqueci minha senha
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
