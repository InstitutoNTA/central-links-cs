import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { CatalogLink } from './filters'
import { CourseAccess, LinkItem } from './components'

const calls: { table: string; op: string; payload?: unknown }[] = []
let favoriteRows: { link_id: string }[] = []

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ session: { user: { id: 'user-1' } } }) }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ eq: async () => ({ data: favoriteRows, error: null }) }),
      insert: async (payload: unknown) => {
        calls.push({ table, op: 'insert', payload })
        if (table === 'favorites') favoriteRows = [...favoriteRows, { link_id: (payload as { link_id: string }).link_id }]
        return { error: null }
      },
      delete: () => ({ eq: () => ({ eq: async () => { calls.push({ table, op: 'delete' }); return { error: null } } }) }),
    }),
  },
}))

const link = { id: 'l1', title: 'Matrículas', description: 'Planilha', url: 'https://exemplo.test/x', category_id: null, kind: 'standard', link_courses: [] } as unknown as CatalogLink

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ul>
          <LinkItem link={link} />
        </ul>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  calls.length = 0
  favoriteRows = []
})

describe('LinkItem', () => {
  it('abre em nova aba com rel seguro', () => {
    setup()
    const a = screen.getByRole('link', { name: /Abrir/ })
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toContain('noopener')
    expect(a.getAttribute('href')).toBe('https://exemplo.test/x')
  })
  it('registra o clique em link_clicks com o usuário logado', () => {
    setup()
    fireEvent.click(screen.getByRole('link', { name: /Abrir/ }))
    expect(calls).toContainEqual({ table: 'link_clicks', op: 'insert', payload: { link_id: 'l1', user_id: 'user-1' } })
  })
  it('copia o link sem registrar clique', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Copiar link de Matrículas/ }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://exemplo.test/x'))
    expect(await screen.findByText('Copiado!')).toBeTruthy()
    expect(calls.some((c) => c.table === 'link_clicks')).toBe(false)
  })
  it('favorita ao clicar na estrela', async () => {
    setup()
    const star = await screen.findByRole('button', { name: /Favoritar/ })
    fireEvent.click(star)
    await waitFor(() => expect(calls).toContainEqual({ table: 'favorites', op: 'insert', payload: { link_id: 'l1', user_id: 'user-1' } }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Remover/ }).getAttribute('aria-pressed')).toBe('true'))
  })
  it('mostra estrela marcada quando já é favorito e desfavorita', async () => {
    favoriteRows = [{ link_id: 'l1' }]
    setup()
    const star = await screen.findByRole('button', { name: /Remover/ })
    fireEvent.click(star)
    await waitFor(() => expect(calls).toContainEqual({ table: 'favorites', op: 'delete' }))
  })
  it('clicar na estrela não registra clique no link', async () => {
    setup()
    fireEvent.click(await screen.findByRole('button', { name: /Favoritar/ }))
    expect(calls.some((c) => c.table === 'link_clicks')).toBe(false)
  })
})

describe('LinkItem com dia da semana', () => {
  const aula = { ...link, weekday: 2 } as unknown as CatalogLink
  function setupAula(showWeekday?: boolean) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ul>
            <LinkItem link={aula} categoryName="Aulas ao vivo" showWeekday={showWeekday} />
          </ul>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }
  it('mostra o dia da semana da aula', () => {
    setupAula()
    expect(screen.getByText('Terça-feira')).toBeTruthy()
  })
  it('não repete o dia quando o bloco já é o dia', () => {
    setupAula(false)
    expect(screen.queryByText('Terça-feira')).toBeNull()
  })
})

describe('CourseAccess', () => {
  const plat = { ...link, id: 'p1', title: 'Plataforma', url: 'https://plataforma.test/login', kind: 'platform' } as unknown as CatalogLink
  function setupAccess(platform: CatalogLink | undefined) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <CourseAccess courseName="Curso X" platform={platform} mec={undefined} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }
  it('mostra Abrir e Copiar para a plataforma e aviso para o MEC não cadastrado', () => {
    setupAccess(plat)
    expect(screen.getByRole('link', { name: /Abrir Plataforma de Curso X/ }).getAttribute('href')).toBe('https://plataforma.test/login')
    expect(screen.getByRole('button', { name: /Copiar link de Plataforma de Curso X/ })).toBeTruthy()
    expect(screen.getByText('ainda não cadastrado')).toBeTruthy()
  })
  it('avisa quando a plataforma ainda não foi cadastrada', () => {
    setupAccess(undefined)
    expect(screen.getByText('ainda não cadastrada')).toBeTruthy()
  })
})
