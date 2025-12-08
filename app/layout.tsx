import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SnowfallOverlay } from '@/components/SnowfallOverlay'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Où Skier? - Comparez, choisissez, skiez',
  description:
    'Découvrez les meilleures stations de ski suisses pour les prochains jours basé sur les conditions météorologiques, la neige et l\'ouverture des pistes.',
  keywords: ['ski', 'suisse', 'valais', 'vaud', 'bern', 'neige', 'météo'],
  authors: [{ name: 'Où Skier?' }],
  openGraph: {
    title: 'Où Skier? - Comparez, choisissez, skiez',
    description:
      'Découvrez les meilleures stations de ski suisses pour les prochains jours.',
    type: 'website',
    locale: 'fr_CH',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <SnowfallOverlay />
        <Header />
        <main
          style={{
            flex: 1,
            padding: 'var(--spacing-2xl) 0',
          }}
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
