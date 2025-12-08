interface BadgeProps {
  label: string
  variant?: 'primary' | 'accent'
  className?: string
}

/**
 * Badge component for labels (regions, status)
 * Variants: primary (Glacier Blue), accent (Ice Cyan)
 */
export function Badge({
  label,
  variant = 'primary',
  className = '',
}: BadgeProps) {
  const backgroundColor =
    variant === 'primary' ? 'var(--glacier-blue)' : 'var(--ice-cyan)'

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-block',
        backgroundColor,
        color: variant === 'primary' ? 'var(--snow-white)' : 'var(--deep-night-blue)',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875rem',
        fontWeight: '600',
      }}
    >
      {label}
    </span>
  )
}
