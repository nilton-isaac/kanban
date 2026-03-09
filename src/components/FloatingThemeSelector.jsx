import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { THEMES } from '../themes'
import { ThemeIcon } from '../lib/themeIcons'

export default function FloatingThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const current = THEMES[theme] || THEMES.cyberpunk

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Theme options panel — slides in from the right */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: open ? '10px 8px' : '0',
          background: 'var(--panel-bg)',
          border: `1px solid var(--col-accent)`,
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          overflow: 'hidden',
          maxWidth: open ? '160px' : '0',
          opacity: open ? 1 : 0,
          transition: 'max-width 0.25s ease, opacity 0.2s ease, padding 0.2s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {Object.values(THEMES).map(t => (
          <button
            key={t.id}
            onClick={() => { setTheme(t.id); setOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              background: theme === t.id ? 'var(--col-accent)22' : 'none',
              border: `1px solid ${theme === t.id ? 'var(--col-accent)' : 'transparent'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: theme === t.id ? 'var(--col-accent)' : '#888',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <ThemeIcon themeId={t.id} size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Toggle pill */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Trocar tema"
        style={{
          width: '36px',
          height: '80px',
          background: 'var(--panel-bg)',
          border: `1px solid var(--col-accent)`,
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          color: 'var(--col-accent)',
          boxShadow: open ? `0 0 18px var(--col-accent)55` : `0 0 8px var(--col-accent)33`,
          transition: 'box-shadow 0.2s',
          flexShrink: 0,
        }}
      >
        <ThemeIcon themeId={current.id} size={15} />
        <span style={{
          fontSize: '7px',
          fontFamily: 'var(--font-body)',
          letterSpacing: '1px',
          writingMode: 'vertical-rl',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}>TEMA</span>
      </button>
    </div>
  )
}
