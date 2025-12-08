import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  as?: 'div' | 'article' | 'section'
}

/**
 * Card component with Frost Gray background
 */
export function Card({
  children,
  className = '',
  onClick,
  as: Component = 'div',
}: CardProps) {
  return (
    <Component
      className={`card ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--frost-gray)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow var(--transition-base)',
      }}
      onMouseEnter={(e) => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
      }}
      onMouseLeave={(e) => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }
      }}
    >
      {children}
    </Component>
  )
}
