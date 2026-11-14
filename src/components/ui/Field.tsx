import { useId, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function Field({ label, hint, className = '', ...rest }: Props) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-slate-300">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        className={`w-full rounded-lg border border-grafite-700 bg-grafite-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-azul focus:outline-none focus:ring-1 focus:ring-azul ${className}`}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
