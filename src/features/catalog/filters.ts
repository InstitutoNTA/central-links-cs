/** Regras puras do catálogo (sem acesso ao banco), fáceis de testar. */
import type { Tables } from '../../types/database.types'

export type Course = Tables<'courses'>
export type Category = Tables<'categories'>
export type CatalogLink = Tables<'links'> & { link_courses: { course_id: string }[] }

export interface LinkFilter {
  query?: string
  categoryId?: string | null
}

/** Minúsculas e sem acento, para a busca achar "matricula" ao procurar "matrícula". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function filterLinks(links: CatalogLink[], { query = '', categoryId = null }: LinkFilter): CatalogLink[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return links.filter((link) => {
    if (categoryId && link.category_id !== categoryId) return false
    if (terms.length === 0) return true
    const haystack = normalize(`${link.title} ${link.description ?? ''}`)
    return terms.every((t) => haystack.includes(t))
  })
}

/** Link MEC de um curso (no máximo um, garantido pelo banco). */
export function mecFor(links: CatalogLink[], courseId: string): CatalogLink | undefined {
  return links.find((l) => l.kind === 'mec' && l.link_courses.some((lc) => lc.course_id === courseId))
}

/** Link da plataforma dos alunos (o mesmo link pode valer para vários cursos). */
export function platformFor(links: CatalogLink[], courseId: string): CatalogLink | undefined {
  return links.find((l) => l.kind === 'platform' && l.link_courses.some((lc) => lc.course_id === courseId))
}

/** Links comuns de um curso (MEC e Plataforma aparecem sob o nome do curso, não na lista). */
export function linksForCourse(links: CatalogLink[], courseId: string): CatalogLink[] {
  return links.filter((l) => l.kind === 'standard' && l.link_courses.some((lc) => lc.course_id === courseId))
}

/** Links sem curso vinculado = links gerais da equipe. */
export function generalLinks(links: CatalogLink[]): CatalogLink[] {
  return links.filter((l) => l.kind === 'standard' && l.link_courses.length === 0 && l.weekday == null)
}

/** 1 = segunda ... 7 = domingo (padrão ISO, o mesmo gravado no banco). */
export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
}

/** Dia da semana de hoje no horário de Brasília (1 = segunda ... 7 = domingo). */
export function todayWeekday(now: Date = new Date()): number {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).format(now)
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[name] ?? 1
}

export interface WeekdayGroup {
  weekday: number
  links: CatalogLink[]
}

/** Aulas ao vivo: links que têm dia da semana, agrupados de segunda a domingo (só dias com link). */
export function liveClassesByDay(links: CatalogLink[]): WeekdayGroup[] {
  const groups: WeekdayGroup[] = []
  for (let weekday = 1; weekday <= 7; weekday++) {
    const inDay = links.filter((l) => l.kind === 'standard' && l.weekday === weekday)
    if (inDay.length > 0) groups.push({ weekday, links: inDay })
  }
  return groups
}

export interface LinkGroup {
  category: Category | null
  links: CatalogLink[]
}

/** Agrupa por categoria (na ordem das categorias); links sem categoria vão para o fim. */
export function groupByCategory(links: CatalogLink[], categories: Category[]): LinkGroup[] {
  const groups: LinkGroup[] = []
  for (const category of categories) {
    const inCategory = links.filter((l) => l.category_id === category.id)
    if (inCategory.length > 0) groups.push({ category, links: inCategory })
  }
  const known = new Set(categories.map((c) => c.id))
  const loose = links.filter((l) => !l.category_id || !known.has(l.category_id))
  if (loose.length > 0) groups.push({ category: null, links: loose })
  return groups
}
