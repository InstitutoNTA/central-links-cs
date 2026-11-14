import { describe, expect, it } from 'vitest'
import {
  filterLinks, generalLinks, groupByCategory, linksForCourse, mecFor, normalize,
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
