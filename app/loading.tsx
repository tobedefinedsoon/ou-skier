/**
 * Loading skeleton for homepage
 */
export default function Loading() {
  return (
    <div className="container">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--frost-gray)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-lg)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            <div
              style={{
                height: '1.5rem',
                backgroundColor: 'var(--snow-white)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-md)',
              }}
            />
            <div
              style={{
                height: '4rem',
                backgroundColor: 'var(--snow-white)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-md)',
              }}
            />
            <div
              style={{
                height: '1rem',
                backgroundColor: 'var(--snow-white)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
