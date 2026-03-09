import { createContext, useContext, useState, useEffect } from 'react'
import { applyTheme } from '../themes'

const ThemeContext = createContext({ theme: 'cyberpunk', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('cyberdaily-theme') || 'cyberpunk'
  })

  const setTheme = (id) => {
    setThemeState(id)
    localStorage.setItem('cyberdaily-theme', id)
    applyTheme(id)
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
