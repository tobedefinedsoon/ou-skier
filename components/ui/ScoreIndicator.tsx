interface ScoreIndicatorProps {
  score: number
  size?: 'small' | 'medium' | 'large'
  className?: string
}

/**
 * ScoreIndicator component - displays ski resort score (0-100) with muted gradient colors
 * Size variants: small (60px), medium (100px), large (150px)
 * Colors: Soft coral (low), soft amber (medium), soft mint (high)
 */
export function ScoreIndicator({
  score,
  size = 'medium',
  className = '',
}: ScoreIndicatorProps) {
  // Clamp score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, score))

  // Size mapping
  const sizes = {
    small: { diameter: '60px', fontSize: '1.25rem' },
    medium: { diameter: '100px', fontSize: '1.875rem' },
    large: { diameter: '150px', fontSize: '2.5rem' },
  }

  const { diameter, fontSize } = sizes[size]

  // Muted, sophisticated color gradient based on score
  // Low score (0-33): soft coral, Medium (33-66): soft amber, High (66-100): soft mint
  let backgroundColor: string
  let backgroundColorLight: string
  if (normalizedScore < 33) {
    backgroundColor = '#FF8A8A' // Soft coral
    backgroundColorLight = '#FFB0B0'
  } else if (normalizedScore < 66) {
    backgroundColor = '#FFB347' // Soft amber
    backgroundColorLight = '#FFCB7A'
  } else {
    backgroundColor = '#66D9A8' // Soft mint
    backgroundColorLight = '#8FE4BD'
  }

  return (
    <div
      className={`score-indicator ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${backgroundColor}, ${backgroundColorLight})`,
        color: 'white',
        fontWeight: '700',
        fontSize,
        boxShadow: `
          0 4px 12px rgba(0, 0, 0, 0.08),
          inset 0 1px 2px rgba(255, 255, 255, 0.3)
        `,
        border: '2px solid rgba(255, 255, 255, 0.2)',
        fontVariantNumeric: 'tabular-nums',
      }}
      aria-label={`Score: ${normalizedScore} out of 100`}
      role="img"
    >
      {Math.round(normalizedScore)}
    </div>
  )
}
