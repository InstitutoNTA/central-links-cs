/** Validações e mensagens do painel administrativo (puras, testáveis). */

export interface LinkInput {
  title: string
  url: string
  description: string
  kind: 'standard' | 'mec' | 'platform'
  courseIds: string[]
  weekday?: number | null
}

/** Retorna a lista de problemas; vazia = pode salvar. Espelha as regras do banco. */
export function validateLink(input: LinkInput): string[] {
  const errors: string[] = []
  const title = input.title.trim()
  const url = input.url.trim()
  if (title.length === 0) errors.push('Informe o nome do link.')
  if (title.length > 160) errors.push('O nome do link pode ter no máximo 160 caracteres.')
  if (!/^https:\/\/[^\s]+$/i.test(url)) errors.push('O endereço precisa começar com https:// e não pode ter espaços.')
  if (url.length > 2048) errors.push('O endereço é longo demais.')
  if (input.description.trim().length > 500) errors.push('A descrição pode ter no máximo 500 caracteres.')
  if (input.kind === 'mec' && input.courseIds.length !== 1) {
    errors.push('O link do MEC precisa estar ligado a exatamente um curso.')
  }
  if (input.kind === 'platform' && input.courseIds.length === 0) {
    errors.push('O link da plataforma precisa estar ligado a pelo menos um curso.')
  }
  if (input.weekday != null && (!Number.isInteger(input.weekday) || input.weekday < 1 || input.weekday > 7)) {
    errors.push('Dia da semana inválido.')
  }
  if (input.kind === 'mec' && input.weekday != null) errors.push('O link do MEC não tem dia da semana.')
  if (input.kind === 'platform' && input.weekday != null) errors.push('O link da plataforma não tem dia da semana.')
  return errors
}

/** "Relatórios & Painéis" -> "relatorios-paineis" (formato exigido pelo banco). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface DbErrorLike {
  code?: string
  message?: string
}

const OWN_MESSAGES = ['MEC', 'último administrador']

/** Traduz erros do banco para português simples. */
export function friendlyDbError(error: DbErrorLike | null | undefined): string {
  if (!error) return ''
  const message = error.message ?? ''
  // Mensagens que nós mesmos escrevemos no banco já são claras.
  if (OWN_MESSAGES.some((m) => message.includes(m)) && error.code === '23514') return message
  if (error.code === '23505') return 'Já existe um registro com esse nome.'
  if (error.code === '42501') return 'Você não tem permissão para esta ação.'
  if (error.code === '23514') return 'Algum campo está com valor inválido. Confira e tente de novo.'
  return 'Não foi possível salvar. Tente novamente.'
}
