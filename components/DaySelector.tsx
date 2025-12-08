'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

interface DayLabel {
  day: number
  date: string
  label: string
}

/**
 * Day selector component - allows users to switch between forecast days
 * Uses URL query params for state (?day=0) with optimistic UI updates
 */
export function DaySelector({
  currentDay,
  dayLabels
}: {
  currentDay: number
  dayLabels: DayLabel[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [optimisticDay, setOptimisticDay] = useState(currentDay)

  const handleDayChange = (day: number) => {
    // Optimistic update for instant UI feedback
    setOptimisticDay(day)

    // Update URL and trigger server re-render
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('day', day.toString())
      router.push(`/?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 'var(--spacing-lg)',
        zIndex: 10,
        marginBottom: 'var(--spacing-2xl)',
      }}
    >
      <div
        data-component="day-selector"
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          background: 'var(--glass-white)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'var(--shadow-glass-lg)',
          overflowX: 'auto',
          justifyContent: 'center',
        }}
      >
        {dayLabels.map(({ day, label }) => (
          <button
            key={day}
            onClick={() => handleDayChange(day)}
            disabled={isPending}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background:
                optimisticDay === day
                  ? 'var(--glacier-blue-primary)'
                  : 'transparent',
              color: optimisticDay === day ? 'white' : 'var(--charcoal)',
              fontWeight: optimisticDay === day ? '600' : '500',
              fontSize: '0.9rem',
              cursor: isPending ? 'wait' : 'pointer',
              transition: 'all var(--transition-base)',
              whiteSpace: 'nowrap',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
