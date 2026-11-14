import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

type Status = 'verificando' | 'conectado' | 'erro'

export default function App() {
  const [status, setStatus] = useState<Status>('verificando')

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => setStatus(error ? 'erro' : 'conectado'))
      .catch(() => setStatus('erro'))
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-sm uppercase tracking-widest text-azul">InstitutoNTA · Customer Success</p>
      <h1 className="text-4xl font-semibold">Central de Links CS</h1>
      <p className="text-slate-300">
        Estrutura inicial (etapa 0). O login e os links chegam nas próximas etapas.
      </p>
      <p className="text-sm text-slate-400">
        Conexão com o banco:{' '}
        <span className={status === 'erro' ? 'text-vermelho' : 'text-azul'}>{status}</span>
      </p>
    </main>
  )
}
