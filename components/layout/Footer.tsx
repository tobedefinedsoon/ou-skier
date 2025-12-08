/**
 * Footer component
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      style={{
        backgroundColor: 'var(--deep-night-blue)',
        color: 'var(--snow-white)',
        padding: 'var(--spacing-2xl) 0',
        marginTop: 'var(--spacing-2xl)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
              À propos
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              Où Skier! classe les meilleures stations de ski suisses en
              fonction des conditions météorologiques et des données de neige.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
              Données
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                fontSize: '0.875rem',
              }}
            >
              <li style={{ marginBottom: '0.5rem' }}>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--ice-cyan)' }}
                >
                  Météo: Open-Meteo / MeteoSwiss
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--ice-cyan)' }}
                >
                  Code source
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
              Régions
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                fontSize: '0.875rem',
              }}
            >
              <li style={{ marginBottom: '0.5rem' }}>Valais</li>
              <li style={{ marginBottom: '0.5rem' }}>Vaud</li>
              <li>Bern</li>
            </ul>
          </div>
        </div>

        <hr
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            marginBottom: 'var(--spacing-lg)',
          }}
        />

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}
        >
          © {currentYear} Où Skier! - Classement des stations de ski suisses |
          Données météorologiques: Open-Meteo / MeteoSwiss
        </p>
      </div>
    </footer>
  )
}
