import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  linked?: boolean
}

const iconSizes = {
  sm: { box: 'h-7 w-7', radius: 'rounded-lg', text: 'text-[11px]' },
  md: { box: 'h-8 w-8', radius: 'rounded-lg', text: 'text-xs' },
  lg: { box: 'h-10 w-10', radius: 'rounded-xl', text: 'text-sm' },
}

const wordSizes = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-xl',
}

function NPIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = iconSizes[size]
  return (
    <div className={`${s.box} ${s.radius} bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0`}>
      <span className={`text-white font-extrabold ${s.text} leading-none tracking-tighter`}>NP</span>
    </div>
  )
}

export default function Logo({ size = 'md', linked = true }: LogoProps) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <NPIcon size={size} />
      <span className={`font-bold tracking-tight ${wordSizes[size]}`}>
        <span className="text-primary">Novate</span>
        <span className="bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent font-extrabold">Persona</span>
      </span>
    </span>
  )

  if (!linked) return content

  return (
    <Link to="/" className="transition-opacity hover:opacity-80">
      {content}
    </Link>
  )
}

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={`${className} rounded-lg bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20`}>
      <span className="text-white font-extrabold text-xs tracking-tighter">NP</span>
    </div>
  )
}
