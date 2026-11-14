import type { Enums } from '../types/database.types'

export type Role = Enums<'app_role'>

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}
