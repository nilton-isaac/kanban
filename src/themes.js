const LEGACY_THEME_ALIAS = {
  detective: 'darkest',
  darkwouls: 'darksouls',
  darksouls_theme: 'darksouls',
}

export function normalizeThemeId(themeId) {
  return LEGACY_THEME_ALIAS[themeId] || themeId
}

export const THEMES = {
  cyberpunk: {
    id: 'cyberpunk',
    label: 'CYBERPUNK',
    icon: 'CP',
    vars: {
      '--neon-cyan': '#00f3ff',
      '--neon-pink': '#ff00ff',
      '--neon-yellow': '#fcee0a',
      '--neon-green': '#00ff88',
      '--neon-orange': '#ff6600',
      '--neon-purple': '#9b00ff',
      '--bg-dark': '#050510',
      '--panel-bg': 'rgba(10,15,30,0.9)',
      '--grid-color': 'rgba(0,243,255,0.03)',
      '--scanline': 'rgba(0,0,0,0.2)',
      '--col-accent': '#ff00ff',
      '--font-heading': "'Orbitron', sans-serif",
      '--font-body': "'Share Tech Mono', monospace",
    },
  },

  fallout: {
    id: 'fallout',
    label: 'FALLOUT',
    icon: 'FO',
    vars: {
      '--neon-cyan': '#4cff00',
      '--neon-pink': '#00cc00',
      '--neon-yellow': '#ffcc00',
      '--neon-green': '#88ff44',
      '--neon-orange': '#ff9900',
      '--neon-purple': '#00ffaa',
      '--bg-dark': '#000d00',
      '--panel-bg': 'rgba(0,22,0,0.92)',
      '--grid-color': 'rgba(76,255,0,0.04)',
      '--scanline': 'rgba(0,0,0,0.3)',
      '--col-accent': '#4cff00',
      '--font-heading': "'VT323', monospace",
      '--font-body': "'VT323', monospace",
    },
  },

  darkest: {
    id: 'darkest',
    label: 'DARKEST',
    icon: 'DK',
    vars: {
      '--neon-cyan': '#c9a959',
      '--neon-pink': '#8b1a1a',
      '--neon-yellow': '#e8dcc5',
      '--neon-green': '#8f9a62',
      '--neon-orange': '#a65c2a',
      '--neon-purple': '#6e4b3a',
      '--bg-dark': '#0a0a0a',
      '--panel-bg': 'rgba(26,15,8,0.92)',
      '--grid-color': 'rgba(201,169,89,0.04)',
      '--scanline': 'rgba(0,0,0,0.18)',
      '--col-accent': '#c9a959',
      '--font-heading': "'Cinzel', serif",
      '--font-body': "'IM Fell English SC', serif",
    },
  },

  liquidglass: {
    id: 'liquidglass',
    label: 'LIQUID',
    icon: 'LG',
    vars: {
      '--neon-cyan': '#cfeaff',
      '--neon-pink': '#ff9fcf',
      '--neon-yellow': '#ffe6b3',
      '--neon-green': '#b7ffea',
      '--neon-orange': '#ffc7a3',
      '--neon-purple': '#d2c3ff',
      '--bg-dark': '#111a30',
      '--panel-bg': 'rgba(255,255,255,0.1)',
      '--grid-color': 'rgba(255,255,255,0.05)',
      '--scanline': 'rgba(0,0,0,0)',
      '--col-accent': '#d9e9ff',
      '--font-heading': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
    },
  },

  frostpunk: {
    id: 'frostpunk',
    label: 'FROSTPUNK',
    icon: 'FR',
    vars: {
      '--neon-cyan': '#9fd3e8',
      '--neon-pink': '#c46f5d',
      '--neon-yellow': '#c9a959',
      '--neon-green': '#9fcfbe',
      '--neon-orange': '#b9804e',
      '--neon-purple': '#7f9ca8',
      '--bg-dark': '#0b0f13',
      '--panel-bg': 'rgba(20,30,40,0.78)',
      '--grid-color': 'rgba(143,171,191,0.05)',
      '--scanline': 'rgba(0,0,0,0.12)',
      '--col-accent': '#4a6b7a',
      '--font-heading': "'Cinzel', serif",
      '--font-body': "'Rajdhani', sans-serif",
    },
  },

  nier: {
    id: 'nier',
    label: 'NIER',
    icon: 'NR',
    vars: {
      '--neon-cyan': '#4f4b46',
      '--neon-pink': '#67625c',
      '--neon-yellow': '#7d735f',
      '--neon-green': '#5f7260',
      '--neon-orange': '#8c7259',
      '--neon-purple': '#918a80',
      '--bg-dark': '#e9e4d8',
      '--panel-bg': 'rgba(223,216,201,0.92)',
      '--grid-color': 'rgba(79,75,70,0.04)',
      '--scanline': 'rgba(0,0,0,0.04)',
      '--col-accent': '#4f4b46',
      '--font-heading': "'Rajdhani', 'Noto Sans JP', sans-serif",
      '--font-body': "'Rajdhani', 'Noto Sans JP', sans-serif",
    },
  },

  darksouls: {
    id: 'darksouls',
    label: 'DARKSOULS',
    icon: 'DS',
    vars: {
      '--neon-cyan': '#c9a959',
      '--neon-pink': '#8b0000',
      '--neon-yellow': '#e3c98b',
      '--neon-green': '#8d9a6d',
      '--neon-orange': '#b56b3d',
      '--neon-purple': '#5d6879',
      '--bg-dark': '#090909',
      '--panel-bg': 'rgba(19,19,19,0.88)',
      '--grid-color': 'rgba(201,169,89,0.05)',
      '--scanline': 'rgba(0,0,0,0.2)',
      '--col-accent': '#c9a959',
      '--font-heading': "'Cinzel', serif",
      '--font-body': "'Lato', 'Rajdhani', sans-serif",
    },
  },

  royale: {
    id: 'royale',
    label: 'ROYALE',
    icon: 'RY',
    vars: {
      '--neon-cyan': '#4fc3f7',
      '--neon-pink': '#f06292',
      '--neon-yellow': '#ffd166',
      '--neon-green': '#74d680',
      '--neon-orange': '#ff9e57',
      '--neon-purple': '#7c8cff',
      '--bg-dark': '#0b1830',
      '--panel-bg': 'rgba(17,34,63,0.84)',
      '--grid-color': 'rgba(79,195,247,0.05)',
      '--scanline': 'rgba(0,0,0,0.08)',
      '--col-accent': '#ffd166',
      '--font-heading': "'Cinzel', serif",
      '--font-body': "'Rajdhani', sans-serif",
    },
  },
}

export function applyTheme(themeId) {
  const normalizedId = normalizeThemeId(themeId)
  const theme = THEMES[normalizedId] || THEMES.cyberpunk
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val)
  })
  document.body.setAttribute('data-theme', theme.id)
}
