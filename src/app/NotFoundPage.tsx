import { Link } from 'react-router-dom'
import { AuthCard } from '../components/ui/AuthCard'

export function NotFoundPage() {
  return (
    <AuthCard title="Página não encontrada" subtitle="O endereço não existe ou foi movido.">
      <Link to="/" className="text-sm text-azul hover:underline">
        Ir para o início
      </Link>
    </AuthCard>
  )
}
