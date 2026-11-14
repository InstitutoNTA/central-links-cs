import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthCard({ title, subtitle, children }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-grafite-950 px-4 py-10">
      <div className="w-full max-w-md">
        <img src="/logo-nta.png" alt="Instituto NTA" width={106} height={72} className="mx-auto mb-4 h-[72px] w-auto rounded-lg" />
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-azul">
          InstitutoNTA · Customer Success
        </p>
        <div className="rounded-2xl border border-grafite-700 bg-grafite-900 p-7 shadow-xl">
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  )
}

export function FormMessage({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const color = kind === 'error' ? 'border-vermelho/40 bg-vermelho/10 text-vermelho' : 'border-azul/40 bg-azul/10 text-azul'
  return (
    <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${color}`}>
      {children}
    </p>
  )
}
