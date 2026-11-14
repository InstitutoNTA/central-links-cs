/** Mensagens de erro de autenticação em português, sem expor detalhes técnicos. */

interface AuthErrorLike {
  code?: string
  message?: string
  status?: number
}

export function friendlyAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return ''
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (code === 'email_not_confirmed') {
    return 'Este e-mail ainda não foi confirmado. Procure a mensagem de confirmação na sua caixa de entrada.'
  }
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    error.status === 429
  ) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'
  }
  if (code === 'same_password') {
    return 'A nova senha precisa ser diferente da senha atual.'
  }
  if (code === 'weak_password') {
    return 'Essa senha é fraca demais. Use pelo menos 10 caracteres, com letras e números.'
  }
  return 'Não foi possível concluir. Tente novamente.'
}

export const MIN_PASSWORD_LENGTH = 10

/** Retorna a mensagem de erro, ou null se a senha for válida. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'A senha precisa ter pelo menos uma letra e um número.'
  }
  return null
}
