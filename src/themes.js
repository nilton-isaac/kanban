export const THEMES = {
  cyberpunk: {
    id: 'cyberpunk',
    label: 'CYBERPUNK',
    icon: '⚡',
    fonts: {
      heading: "'Orbitron', sans-serif",
      body: "'Share Tech Mono', monospace",
    },
    vars: {
      '--neon-cyan':   '#00f3ff',
      '--neon-pink':   '#ff00ff',
      '--neon-yellow': '#fcee0a',
      '--neon-green':  '#00ff88',
      '--neon-orange': '#ff6600',
      '--neon-purple': '#9b00ff',
      '--bg-dark':     '#050510',
      '--panel-bg':    'rgba(10,15,30,0.9)',
      '--grid-color':  'rgba(0,243,255,0.03)',
      '--scanline':    'rgba(0,0,0,0.2)',
      '--col-accent':  '#ff00ff',
      '--font-heading': "'Orbitron', sans-serif",
      '--font-body':   "'Share Tech Mono', monospace",
    },
  },

  fallout: {
    id: 'fallout',
    label: 'FALLOUT',
    icon: '☢',
    fonts: {
      heading: "'VT323', monospace",
      body: "'Share Tech Mono', monospace",
    },
    vars: {
      '--neon-cyan':   '#4cff00',
      '--neon-pink':   '#00cc00',
      '--neon-yellow': '#ffcc00',
      '--neon-green':  '#88ff44',
      '--neon-orange': '#ff9900',
      '--neon-purple': '#00ffaa',
      '--bg-dark':     '#000d00',
      '--panel-bg':    'rgba(0,22,0,0.92)',
      '--grid-color':  'rgba(76,255,0,0.04)',
      '--scanline':    'rgba(0,0,0,0.3)',
      '--col-accent':  '#4cff00',
      '--font-heading': "'VT323', monospace",
      '--font-body':   "'Share Tech Mono', monospace",
    },
  },

  detective: {
    id: 'detective',
    label: 'DETETIVE',
    icon: '🔎',
    fonts: {
      heading: "'Special Elite', cursive",
      body: "'Courier New', Courier, monospace",
    },
    vars: {
      '--neon-cyan':   '#d4a84b',
      '--neon-pink':   '#8b5e3c',
      '--neon-yellow': '#e8c88c',
      '--neon-green':  '#6b8c42',
      '--neon-orange': '#c7652d',
      '--neon-purple': '#7a5c8b',
      '--bg-dark':     '#120f0b',
      '--panel-bg':    'rgba(28,20,10,0.92)',
      '--grid-color':  'rgba(212,168,75,0.04)',
      '--scanline':    'rgba(0,0,0,0.15)',
      '--col-accent':  '#d4a84b',
      '--font-heading': "'Special Elite', cursive",
      '--font-body':   "'Courier New', Courier, monospace",
    },
  },
}

export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.cyberpunk
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val)
  })
  document.body.setAttribute('data-theme', themeId)
}
