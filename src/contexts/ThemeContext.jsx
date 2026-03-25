import { createContext, useContext, useState, useEffect } from 'react'
import { applyTheme, normalizeThemeId } from '../themes'

const ThemeContext = createContext({ theme: 'cyberpunk', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('cyberdaily-theme') || 'cyberpunk'
    return normalizeThemeId(savedTheme)
  })

  const setTheme = (id) => {
    const normalizedId = normalizeThemeId(id)
    setThemeState(normalizedId)
    localStorage.setItem('cyberdaily-theme', normalizedId)
    applyTheme(normalizedId)
  }

  useEffect(() => {
    applyTheme(theme)
  }, []) // eslint-disable-line

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
