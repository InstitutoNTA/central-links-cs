import { Navigate } from 'react-router-dom'
import { AuthCard } from '../../../components/ui/AuthCard'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../useAuth'

export function PendingPage() {
  const { profile, signOut, refreshProfile } = useAuth()
  if (profile?.active) return <Navigate to="/" replace />

  return (
    <AuthCard title="Conta aguardando ativação" subtitle="Seu acesso foi criado, mas ainda não foi liberado.">
      <p className="text-sm text-slate-300">
        Peça a um administrador da Central para ativar sua conta. Assim que ele fizer isso, clique em “Verificar novamente”.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => void refreshProfile()} className="flex-1">
          Verificar novamente
        </Button>
        <Button variant="ghost" onClick={() => void signOut()} className="flex-1">
          Sair
        </Button>
      </div>
    </AuthCard>
  )
}
