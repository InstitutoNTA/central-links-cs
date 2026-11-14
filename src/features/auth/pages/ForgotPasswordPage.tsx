import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthCard, FormMessage } from '../../../components/ui/AuthCard'
import { Button } from '../../../components/ui/Button'
import { Field } from '../../../components/ui/Field'
import { supabase } from '../../../lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    // A resposta é sempre a mesma, exista ou não o e-mail, para não revelar quem tem conta.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setSubmitting(false)
    setSent(true)
  }

  return (
    <AuthCard title="Recuperar senha" subtitle="Informe seu e-mail para receber o link de redefinição.">
      {sent ? (
        <div className="space-y-4">
          <FormMessage kind="success">
            Se este e-mail estiver cadastrado, você receberá em instantes um link para criar uma nova senha. Confira também a caixa de spam.
          </FormMessage>
          <Link to="/login" className="block text-center text-sm text-azul hover:underline">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={submitting} className="w-full">
            Enviar link
          </Button>
          <Link to="/login" className="block text-center text-sm text-azul hover:underline">
            Voltar para o login
          </Link>
        </form>
      )}
    </AuthCard>
  )
}
