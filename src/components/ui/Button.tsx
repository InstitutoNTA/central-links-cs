import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'bg-azul text-grafite-950 hover:bg-azul/90 font-medium',
  ghost: 'border border-grafite-700 text-slate-200 hover:bg-grafite-800',
}

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-azul/60 ${styles[variant]} ${className}`}
    >
      {loading ? 'Aguarde…' : children}
    </button>
  )
}
