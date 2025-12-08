# Où Skier! ❄️

Où Skier! est une application web moderne qui classe les **3 meilleures stations de ski suisses** pour les prochains jours en fonction des conditions météorologiques, des prévisions de neige, de l'ensoleillement et du taux d'ouverture des pistes.

## 🎯 Objectif

Aider les skieurs et snowboardeurs à décider **où aller skier** en Suisse romande (Valais, Vaud, Bern) en affichant les meilleures stations classées par un algorithme de scoring intelligent basé sur les données météorologiques officielles suisses.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ (LTS recommandé)
- npm ou yarn

### Installation

```bash
# 1. Cloner le repository
git clone <repository-url>
cd ou-skier

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Build pour Production

```bash
# Build
npm run build

# Démarrer le serveur production
npm start
```

## 📊 Système de Scoring

### Algorithme de Ranking

Chaque station de ski reçoit un **score de 0 à 100** basé sur 7 facteurs pondérés :

| Facteur | Poids | Explication |
|---------|-------|-------------|
| **Neige récente (48h)** | 25% | Fraîche poudreuse = meilleures conditions |
| **Profondeur de neige** | 15% | Base solide = sécurité et longévité |
| **Pistes ouvertes** | 20% | Terrain disponible pour skier |
| **Vent** | 10% | Faible vent = meilleures conditions (inverse) |
| **Température** | 5% | Optimal -10°C à -2°C (courbe Gaussienne) |
| **Ensoleillement** | 25% | Beau temps = meilleure expérience |

## 🏗️ Architecture & Décisions Techniques

### Pourquoi Next.js 16?

- **Turbopack**: 5-10x plus rapide en développement, 2-5x plus rapide en production
- **Server Components par défaut**: Moins de JavaScript client, meilleure sécurité
- **App Router**: Structure moderne et intuitive
- **Caching explicite**: `'use cache'` + `cacheLife` pour un contrôle granulaire

### Pourquoi OpenMeteo MeteoSwiss API?

- Données **officielles MeteoSwiss** (ICON-CH1/CH2)
- Format **JSON** (vs GRIB2 binaire complexe)
- **Disponible maintenant** (API direct MeteoSwiss pas avant Q2 2026)
- **Résolution 1-2km** optimale pour les Alpes suisses
- **Gratuit**, pas d'authentification

## 📁 Structure du Projet

```
ou-skier/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # Page d'accueil (Top 3)
│   ├── layout.tsx                 # Layout racine
│   ├── loading.tsx                # Skeleton loading
│   ├── error.tsx                  # Error boundary
│   └── resorts/[id]/page.tsx      # Détail station
├── components/                    # Composants réutilisables
│   ├── ui/
│   │   ├── Card.tsx               # Conteneur Frost Gray
│   │   ├── Badge.tsx              # Labels
│   │   └── ScoreIndicator.tsx     # Score 0-100
│   └── layout/
│       ├── Header.tsx             # En-tête
│       └── Footer.tsx             # Pied de page
├── lib/
│   ├── weather/                   # OpenMeteo integration
│   │   ├── client.ts              # Client API
│   │   ├── types.ts               # Types
│   │   └── schemas.ts             # Zod validation
│   ├── resorts/                   # Données stations
│   │   ├── data.ts                # Loader JSON
│   │   ├── types.ts               # Types
│   │   └── schemas.ts             # Zod validation
│   └── scoring/
│       └── engine.ts              # Algorithme scoring
├── data/
│   └── resorts.json               # 10 stations Swiss
├── styles/
│   └── globals.css                # Alpine Clean palette
├── next.config.ts                 # Next.js 16 config
└── package.json                   # Dependencies
```

## 🎨 Système de Design - "Alpine Clean"

### Palette de Couleurs

```css
--glacier-blue:    #5AA3D6  /* Primaire (CTA, composants) */
--deep-night-blue: #0C1C2C  /* Texte principal */
--snow-white:      #FFFFFF  /* Arrière-plan */
--frost-gray:      #E8EEF2  /* Cartes, surfaces */
--ice-cyan:        #A7E3F5  /* Accents, scores */
```

## 🔌 API

### OpenMeteo MeteoSwiss

- **Endpoint**: `https://api.open-meteo.com/v1/meteoswiss`
- **Modèles**: ICON-CH1 (3h), ICON-CH2 (6h)
- **Résolution**: 1-2km
- **Limites**: 10k appels/jour (gratuit)

## 🛠️ Stack Technique

- **Framework**: Next.js 16 (Turbopack)
- **Language**: TypeScript (strict)
- **Validation**: Zod
- **Styling**: CSS vanilla
- **UI**: Composants custom

---

Construit avec ❄️ pour les amoureux du ski suisse.
