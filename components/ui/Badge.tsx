interface BadgeProps {
  label: string
  variant?: 'primary' | 'accent'
  className?: string
}

/**
 * Glassmorphic Badge component for labels (regions, status)
 * Variants: primary (Glacier Blue tint), accent (Ice Cyan tint)
 */
export function Badge({
  label,
  variant = 'primary',
  className = '',
}: BadgeProps) {
  const styles = variant === 'primary'
    ? {
        background: 'rgba(74, 144, 226, 0.12)',
        color: 'var(--glacier-blue-primary)',
        border: '1px solid rgba(74, 144, 226, 0.2)',
      }
    : {
        background: 'rgba(148, 217, 234, 0.12)',
        color: 'var(--ice-cyan-accent)',
        border: '1px solid rgba(148, 217, 234, 0.2)',
      }

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-block',
        ...styles,
        padding: '0.375rem 0.875rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.8125rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </span>
  )
}
