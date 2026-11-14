import { describe, expect, it } from 'vitest'
import { friendlyDbError, slugify, validateLink, type LinkInput } from './validation'

const ok: LinkInput = { title: 'Matrículas', url: 'https://exemplo.test/x', description: '', kind: 'standard', courseIds: [] }

describe('validateLink', () => {
  it('aceita link válido', () => expect(validateLink(ok)).toEqual([]))
  it('exige nome', () => expect(validateLink({ ...ok, title: '   ' })).toHaveLength(1))
  it('recusa http sem s', () => expect(validateLink({ ...ok, url: 'http://exemplo.test' }).length).toBeGreaterThan(0))
  it('recusa endereço com espaço', () => expect(validateLink({ ...ok, url: 'https://exemplo .test' }).length).toBeGreaterThan(0))
  it('recusa endereço sem protocolo', () => expect(validateLink({ ...ok, url: 'exemplo.test' }).length).toBeGreaterThan(0))
  it('MEC exige exatamente um curso', () => {
    expect(validateLink({ ...ok, kind: 'mec', courseIds: [] }).length).toBe(1)
    expect(validateLink({ ...ok, kind: 'mec', courseIds: ['a', 'b'] }).length).toBe(1)
    expect(validateLink({ ...ok, kind: 'mec', courseIds: ['a'] })).toEqual([])
  })
  it('limita a descrição a 500 caracteres', () => {
    expect(validateLink({ ...ok, description: 'x'.repeat(501) }).length).toBe(1)
  })
})

describe('slugify', () => {
  it('remove acento, símbolos e espaços', () => expect(slugify(' Relatórios & Painéis ')).toBe('relatorios-paineis'))
})

describe('friendlyDbError', () => {
  it('mantém a mensagem clara do MEC duplicado', () => {
    expect(friendlyDbError({ code: '23514', message: 'Este curso já tem um link do MEC ativo.' })).toContain('MEC')
  })
  it('mantém a mensagem do último administrador', () => {
    expect(friendlyDbError({ code: '23514', message: 'Não é possível remover ou desativar o último administrador ativo.' })).toContain('último administrador')
  })
  it('traduz nome repetido', () => expect(friendlyDbError({ code: '23505', message: 'duplicate key' })).toBe('Já existe um registro com esse nome.'))
  it('traduz falta de permissão', () => expect(friendlyDbError({ code: '42501' })).toContain('permissão'))
  it('não vaza texto técnico', () => expect(friendlyDbError({ message: 'relation x does not exist' })).toBe('Não foi possível salvar. Tente novamente.'))
})
