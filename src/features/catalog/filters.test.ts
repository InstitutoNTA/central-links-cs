import { describe, expect, it } from 'vitest'
import {
  filterLinks, generalLinks, groupByCategory, linksForCourse, liveClassesByDay, mecFor, normalize, todayWeekday,
  type CatalogLink, type Category,
} from './filters'

function link(over: Partial<CatalogLink> & { id: string }): CatalogLink {
  return {
    title: 'Link', url: 'https://exemplo.test', description: null, category_id: null,
    kind: 'standard', active: true, sort_order: 0, created_by: null, created_at: '', updated_at: '',
    link_courses: [], ...over,
  } as CatalogLink
}
const cat = (id: string, name: string): Category =>
  ({ id, name, slug: id, icon: null, sort_order: 0, active: true, created_at: '', updated_at: '' }) as Category

describe('normalize', () => {
  it('remove acentos e caixa', () => expect(normalize('  Matrícula ')).toBe('matricula'))
})

describe('filterLinks', () => {
  const links = [
    link({ id: '1', title: 'Matrícula de alunos', category_id: 'a' }),
    link({ id: '2', title: 'Relatório', description: 'Painel semanal', category_id: 'b' }),
  ]
  it('busca sem diferenciar acento', () => expect(filterLinks(links, { query: 'matricula' }).map((l) => l.id)).toEqual(['1']))
  it('busca na descrição', () => expect(filterLinks(links, { query: 'painel' }).map((l) => l.id)).toEqual(['2']))
  it('exige todas as palavras', () => expect(filterLinks(links, { query: 'painel matricula' })).toEqual([]))
  it('filtra por categoria', () => expect(filterLinks(links, { categoryId: 'b' }).map((l) => l.id)).toEqual(['2']))
  it('sem filtro devolve tudo', () => expect(filterLinks(links, {})).toHaveLength(2))
})

describe('cursos e MEC', () => {
  const mec = link({ id: 'm', kind: 'mec', link_courses: [{ course_id: 'c1' }] })
  const normal = link({ id: 'n', link_courses: [{ course_id: 'c1' }] })
  const geral = link({ id: 'g' })
  const all = [mec, normal, geral]
  it('acha o MEC do curso', () => expect(mecFor(all, 'c1')?.id).toBe('m'))
  it('não acha MEC de outro curso', () => expect(mecFor(all, 'c2')).toBeUndefined())
  it('MEC não entra na lista do curso', () => expect(linksForCourse(all, 'c1').map((l) => l.id)).toEqual(['n']))
  it('link sem curso é geral', () => expect(generalLinks(all).map((l) => l.id)).toEqual(['g']))
  it('link de dois cursos aparece nos dois', () => {
    const dois = link({ id: 'd', link_courses: [{ course_id: 'c1' }, { course_id: 'c2' }] })
    expect(linksForCourse([dois], 'c1')).toHaveLength(1)
    expect(linksForCourse([dois], 'c2')).toHaveLength(1)
    expect(generalLinks([dois])).toHaveLength(0)
  })
})

describe('groupByCategory', () => {
  it('agrupa na ordem das categorias e deixa sem categoria no fim', () => {
    const cats = [cat('a', 'A'), cat('b', 'B')]
    const groups = groupByCategory(
      [link({ id: '1', category_id: 'b' }), link({ id: '2' }), link({ id: '3', category_id: 'a' })],
      cats,
    )
    expect(groups.map((g) => g.category?.name ?? null)).toEqual(['A', 'B', null])
  })
})

describe('aulas ao vivo', () => {
  it('agrupa por dia da semana, de segunda a domingo, só dias com link', () => {
    const groups = liveClassesByDay([
      link({ id: 'q', weekday: 4 }), link({ id: 's', weekday: 1 }), link({ id: 's2', weekday: 1 }), link({ id: 'x' }),
    ])
    expect(groups.map((g) => [g.weekday, g.links.length])).toEqual([[1, 2], [4, 1]])
  })

  it('link com dia da semana não aparece em links gerais', () => {
    expect(generalLinks([link({ id: 'a', weekday: 2 }), link({ id: 'b' })]).map((l) => l.id)).toEqual(['b'])
  })

  it('descobre o dia de hoje no horário de Brasília', () => {
    // Brasília é UTC-3: 15/11/2026 04:30 UTC = domingo 01:30; 16/11 02:00 UTC ainda é domingo; 16/11 04:00 UTC já é segunda.
    expect(todayWeekday(new Date('2026-11-15T04:30:00Z'))).toBe(7)
    expect(todayWeekday(new Date('2026-11-16T02:00:00Z'))).toBe(7)
    expect(todayWeekday(new Date('2026-11-16T04:00:00Z'))).toBe(1)
  })
})
