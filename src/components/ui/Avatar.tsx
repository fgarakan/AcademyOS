import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  src?: string | null
}

const sizes = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
}

export function Avatar({ name, size = 'md', className, src }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center',
      'font-semibold text-lime shrink-0',
      'bg-lime/10 border border-lime/20',
      sizes[size],
      className
    )}>
      {initials}
    </div>
  )
}
