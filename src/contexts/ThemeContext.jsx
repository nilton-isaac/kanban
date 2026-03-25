import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, DEFAULT_THEME_ID, normalizeThemeId } from '../themes'

const THEME_KEY = 'synth-theme'
const LEGACY_THEME_KEY = 'cyberdaily-theme'

const ThemeContext = createContext({ theme: DEFAULT_THEME_ID, setTheme: () => {} })

function getStoredTheme() {
  const next = localStorage.getItem(THEME_KEY)
  const legacy = localStorage.getItem(LEGACY_THEME_KEY)
  return normalizeThemeId(next || legacy || DEFAULT_THEME_ID)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
    localStorage.setItem(LEGACY_THEME_KEY, theme)
  }, [theme])

  const setTheme = (id) => {
    setThemeState(normalizeThemeId(id))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
