import { Component, type ReactNode } from 'react'

/** Último recurso: se uma tela quebrar, a pessoa vê uma mensagem em vez de uma página em branco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="flex min-h-screen items-center justify-center bg-grafite-950 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-slate-100">Algo deu errado</h1>
          <p className="mt-2 text-sm text-slate-400">Atualize a página. Se o problema continuar, avise um administrador.</p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="mt-5 rounded-lg bg-azul px-4 py-2.5 text-sm font-medium text-grafite-950"
          >
            Voltar ao início
          </button>
        </div>
      </main>
    )
  }
}
