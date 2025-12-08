interface ScoreIndicatorProps {
  score: number
  size?: 'small' | 'medium' | 'large'
  className?: string
}

/**
 * ScoreIndicator component - displays ski resort score (0-100) with Ice Cyan gradient
 * Size variants: small (60px), medium (100px), large (150px)
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

  // Color gradient based on score
  // Low score (0-33): red-ish, Medium (33-66): yellow-ish, High (66-100): green-ish
  let backgroundColor: string
  if (normalizedScore < 33) {
    backgroundColor = '#FF6B6B' // Red
  } else if (normalizedScore < 66) {
    backgroundColor = '#FFD93D' // Yellow
  } else {
    backgroundColor = '#6BCB77' // Green
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
        backgroundColor,
        color: 'var(--snow-white)',
        fontWeight: '700',
        fontSize,
        boxShadow: 'var(--shadow-md)',
      }}
      aria-label={`Score: ${normalizedScore} out of 100`}
      role="img"
    >
      {Math.round(normalizedScore)}
    </div>
  )
}
