'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  as?: 'div' | 'article' | 'section'
  style?: React.CSSProperties
}

/**
 * Glassmorphic Card component with backdrop blur
 */
export function Card({
  children,
  className = '',
  onClick,
  as: Component = 'div',
  style,
}: CardProps) {
  return (
    <Component
      className={`card ${className}`}
      onClick={onClick}
      style={{
        background: 'var(--glass-white)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        boxShadow: 'var(--shadow-glass-md)',
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.boxShadow = 'var(--shadow-glass-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.boxShadow = 'var(--shadow-glass-md)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Subtle top shine effect */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--snow-shimmer), transparent)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </Component>
  )
}
