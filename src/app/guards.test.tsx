import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AuthState, Profile } from '../features/auth/auth-context'
import { RequireActive, RequireAuth, RequireRole } from './guards'

const state: { current: Partial<AuthState> } = { current: {} }

vi.mock('../features/auth/useAuth', () => ({
  useAuth: () => state.current as AuthState,
}))

function profile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'u1',
    email: 'a@b.c',
    full_name: 'Teste',
    role: 'colaborador',
    active: true,
    created_at: '',
    updated_at: '',
    ...over,
  } as Profile
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>tela-login</p>} />
        <Route path="/aguardando-ativacao" element={<p>tela-pendente</p>} />
        <Route element={<RequireAuth />}>
          <Route element={<RequireActive />}>
            <Route path="/" element={<p>tela-inicio</p>} />
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin" element={<p>tela-admin</p>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const base = { loading: false, profileError: false, signOut: async () => {} }

beforeEach(() => {
  state.current = {}
})

describe('guardas de rota', () => {
  it('manda visitante sem sessão para o login', () => {
    state.current = { ...base, session: null, profile: null }
    renderAt('/')
    expect(screen.queryByText('tela-login')).not.toBeNull()
  })
  it('mostra carregando enquanto a sessão é verificada', () => {
    state.current = { ...base, loading: true, session: null, profile: null }
    renderAt('/')
    expect(screen.queryByText('Carregando…')).not.toBeNull()
    expect(screen.queryByText('tela-login')).toBeNull()
  })
  it('manda conta não ativada para a tela de espera', () => {
    state.current = { ...base, session: {} as never, profile: profile({ active: false }) }
    renderAt('/')
    expect(screen.queryByText('tela-pendente')).not.toBeNull()
  })
  it('libera conta ativa', () => {
    state.current = { ...base, session: {} as never, profile: profile() }
    renderAt('/')
    expect(screen.queryByText('tela-inicio')).not.toBeNull()
  })
  it('bloqueia colaborador na área de administrador', () => {
    state.current = { ...base, session: {} as never, profile: profile({ role: 'colaborador' }) }
    renderAt('/admin')
    expect(screen.queryByText('tela-admin')).toBeNull()
    expect(screen.queryByText('tela-inicio')).not.toBeNull()
  })
  it('bloqueia gestor na área de administrador', () => {
    state.current = { ...base, session: {} as never, profile: profile({ role: 'gestor' }) }
    renderAt('/admin')
    expect(screen.queryByText('tela-admin')).toBeNull()
  })
  it('libera administrador na área de administrador', () => {
    state.current = { ...base, session: {} as never, profile: profile({ role: 'admin' }) }
    renderAt('/admin')
    expect(screen.queryByText('tela-admin')).not.toBeNull()
  })
  it('mostra erro quando o perfil não carrega', () => {
    state.current = { ...base, session: {} as never, profile: null, profileError: true }
    renderAt('/')
    expect(screen.queryByText('Não foi possível carregar seu perfil')).not.toBeNull()
  })
})
