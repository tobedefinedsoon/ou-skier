/**
 * Format a date for display in the day selector
 * Returns "Aujourd'hui", "Demain", or a formatted date
 */
export function formatDayLabel(isoDate: string, dayIndex: number): string {
  const date = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  const diffDays = Math.round(
    (dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Demain"

  // Format: "Lun 9 déc"
  return date.toLocaleDateString('fr-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}
