import { useId, type SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export function Select({ label, children, className = '', ...rest }: Props) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-slate-300">
        {label}
      </label>
      <select
        id={id}
        {...rest}
        className={`w-full rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-2.5 text-sm text-slate-100 focus:border-azul focus:outline-none focus:ring-1 focus:ring-azul ${className}`}
      >
        {children}
      </select>
    </div>
  )
}
