export const DEFAULT_THEME_ID = 'dark'

const LEGACY_THEME_ALIAS = {
  cyberpunk: 'dark',
  fallout: 'dark',
  darkest: 'dark',
  detective: 'dark',
  darkwouls: 'dark',
  darksouls_theme: 'dark',
  darksouls: 'dark',
  frostpunk: 'dark',
  royale: 'dark',
  liquidglass: 'light',
  nier: 'light',
  'synth-dark': 'dark',
  'synth-light': 'light',
}

export function normalizeThemeId(themeId) {
  const normalized = LEGACY_THEME_ALIAS[String(themeId || '').toLowerCase()] || String(themeId || '').toLowerCase()
  return normalized === 'light' || normalized === 'dark' ? normalized : DEFAULT_THEME_ID
}

export const THEMES = {
  light: {
    id: 'light',
    label: 'Synth Light',
    icon: 'LT',
    vars: {
      '--brand-cyan': '#47BFFF',
      '--brand-violet': '#7E14FF',
      '--brand-violet-soft': '#863BFF',
      '--brand-lilac': '#EDE6FF',
      '--neon-cyan': '#47BFFF',
      '--neon-pink': '#7E14FF',
      '--neon-yellow': '#F5B85C',
      '--neon-green': '#3BC4A1',
      '--neon-orange': '#FB8A6B',
      '--neon-purple': '#863BFF',
      '--bg-dark': '#EEF3FB',
      '--bg-gradient': 'linear-gradient(180deg, #F7FBFF 0%, #EEF3FB 100%)',
      '--panel-bg': 'rgba(255, 255, 255, 0.78)',
      '--panel-bg-strong': 'rgba(255, 255, 255, 0.9)',
      '--surface-elevated': 'rgba(255, 255, 255, 0.66)',
      '--surface-raised': 'rgba(255, 255, 255, 0.86)',
      '--surface-card': 'rgba(255, 255, 255, 0.74)',
      '--surface-soft': 'rgba(15, 23, 42, 0.04)',
      '--surface-contrast': 'rgba(255, 255, 255, 0.94)',
      '--field-bg': 'rgba(255, 255, 255, 0.72)',
      '--field-border': 'rgba(148, 163, 184, 0.34)',
      '--field-placeholder': 'rgba(15, 23, 42, 0.42)',
      '--panel-border': 'rgba(148, 163, 184, 0.26)',
      '--panel-border-strong': 'rgba(15, 23, 42, 0.16)',
      '--grid-color': 'rgba(148, 163, 184, 0.18)',
      '--col-accent': '#47BFFF',
      '--text-primary': '#0F172A',
      '--text-secondary': 'rgba(15, 23, 42, 0.74)',
      '--text-muted': 'rgba(15, 23, 42, 0.46)',
      '--line-soft': 'rgba(148, 163, 184, 0.18)',
      '--line-strong': 'rgba(148, 163, 184, 0.32)',
      '--font-heading': "'Space Grotesk', sans-serif",
      '--font-body': "'JetBrains Mono', monospace",
      '--shadow-md': '0 18px 44px rgba(15, 23, 42, 0.1)',
      '--shadow-lg': '0 30px 80px rgba(15, 23, 42, 0.16)',
      '--header-glow': 'rgba(71, 191, 255, 0.16)',
      '--overlay-vignette': 'radial-gradient(circle at 16% 16%, rgba(125, 211, 252, 0.28), transparent 24%), radial-gradient(circle at 82% 14%, rgba(196, 181, 253, 0.22), transparent 24%), radial-gradient(circle at 74% 82%, rgba(251, 191, 183, 0.16), transparent 22%)',
    },
  },
  dark: {
    id: 'dark',
    label: 'Synth Dark',
    icon: 'DK',
    vars: {
      '--brand-cyan': '#47BFFF',
      '--brand-violet': '#7E14FF',
      '--brand-violet-soft': '#863BFF',
      '--brand-lilac': '#EDE6FF',
      '--neon-cyan': '#47BFFF',
      '--neon-pink': '#7E14FF',
      '--neon-yellow': '#F5B85C',
      '--neon-green': '#49D8B5',
      '--neon-orange': '#FB8A6B',
      '--neon-purple': '#863BFF',
      '--bg-dark': '#030712',
      '--bg-gradient': 'linear-gradient(180deg, #08101D 0%, #030712 100%)',
      '--panel-bg': 'rgba(9, 15, 28, 0.72)',
      '--panel-bg-strong': 'rgba(8, 15, 28, 0.9)',
      '--surface-elevated': 'rgba(10, 18, 32, 0.82)',
      '--surface-raised': 'rgba(15, 23, 42, 0.9)',
      '--surface-card': 'rgba(9, 15, 28, 0.78)',
      '--surface-soft': 'rgba(255, 255, 255, 0.04)',
      '--surface-contrast': 'rgba(6, 11, 24, 0.92)',
      '--field-bg': 'rgba(7, 13, 24, 0.78)',
      '--field-border': 'rgba(148, 163, 184, 0.18)',
      '--field-placeholder': 'rgba(226, 232, 240, 0.4)',
      '--panel-border': 'rgba(148, 163, 184, 0.16)',
      '--panel-border-strong': 'rgba(226, 232, 240, 0.2)',
      '--grid-color': 'rgba(148, 163, 184, 0.16)',
      '--col-accent': '#7E14FF',
      '--text-primary': '#F8FAFC',
      '--text-secondary': 'rgba(226, 232, 240, 0.8)',
      '--text-muted': 'rgba(148, 163, 184, 0.68)',
      '--line-soft': 'rgba(148, 163, 184, 0.14)',
      '--line-strong': 'rgba(148, 163, 184, 0.24)',
      '--font-heading': "'Space Grotesk', sans-serif",
      '--font-body': "'JetBrains Mono', monospace",
      '--shadow-md': '0 18px 44px rgba(0, 0, 0, 0.34)',
      '--shadow-lg': '0 30px 90px rgba(0, 0, 0, 0.5)',
      '--header-glow': 'rgba(126, 20, 255, 0.16)',
      '--overlay-vignette': 'radial-gradient(circle at 14% 14%, rgba(56, 189, 248, 0.16), transparent 24%), radial-gradient(circle at 82% 14%, rgba(129, 140, 248, 0.14), transparent 24%), radial-gradient(circle at 78% 84%, rgba(244, 114, 182, 0.08), transparent 20%)',
    },
  },
}

export function applyTheme(themeId) {
  const normalizedId = normalizeThemeId(themeId)
  const theme = THEMES[normalizedId] || THEMES[DEFAULT_THEME_ID]
  const root = document.documentElement

  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val)
  })

  root.style.colorScheme = theme.id === 'light' ? 'light' : 'dark'
  root.setAttribute('data-theme', theme.id)
  document.body.setAttribute('data-theme', theme.id)
}
