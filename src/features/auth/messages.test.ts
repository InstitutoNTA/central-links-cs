import { describe, expect, it } from 'vitest'
import { friendlyAuthError, validatePassword } from './messages'

describe('friendlyAuthError', () => {
  it('traduz credenciais inválidas', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
    expect(friendlyAuthError({ message: 'Invalid login credentials' })).toBe(
      'E-mail ou senha incorretos.',
    )
  })
  it('traduz limite de tentativas', () => {
    expect(friendlyAuthError({ status: 429 })).toContain('Muitas tentativas')
    expect(friendlyAuthError({ code: 'over_email_send_rate_limit' })).toContain('Muitas tentativas')
  })
  it('traduz senha repetida e fraca', () => {
    expect(friendlyAuthError({ code: 'same_password' })).toContain('diferente')
    expect(friendlyAuthError({ code: 'weak_password' })).toContain('fraca')
  })
  it('usa mensagem genérica para erros desconhecidos, sem vazar o texto técnico', () => {
    const msg = friendlyAuthError({ message: 'duplicate key value violates constraint' })
    expect(msg).toBe('Não foi possível concluir. Tente novamente.')
  })
  it('retorna vazio quando não há erro', () => {
    expect(friendlyAuthError(null)).toBe('')
  })
})

describe('validatePassword', () => {
  it('recusa senha curta', () => {
    expect(validatePassword('abc123')).not.toBeNull()
  })
  it('recusa senha sem número', () => {
    expect(validatePassword('somenteletrasaqui')).not.toBeNull()
  })
  it('recusa senha sem letra', () => {
    expect(validatePassword('1234567890123')).not.toBeNull()
  })
  it('aceita senha com 10+ caracteres, letra e número', () => {
    expect(validatePassword('cs-nta-2026ok')).toBeNull()
  })
})
