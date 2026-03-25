import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { DEFAULT_THEME_ID, PRIMARY_THEME_IDS, SECONDARY_THEME_IDS, THEMES } from '../themes'
import { ThemeIcon } from '../lib/themeIcons'

export default function ThemeSwitcher({ align = 'end' }) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const primaryThemes = useMemo(
    () => PRIMARY_THEME_IDS.map((id) => THEMES[id]).filter(Boolean),
    []
  )
  const secondaryThemes = useMemo(
    () => SECONDARY_THEME_IDS.map((id) => THEMES[id]).filter(Boolean),
    []
  )

  const activeTheme = THEMES[theme] || THEMES[DEFAULT_THEME_ID]
  const activeSecondary = secondaryThemes.some((item) => item.id === activeTheme.id)
  const justifyContent = align === 'center' ? 'center' : 'flex-end'
  const panelPosition =
    align === 'center'
      ? { left: '50%', transform: 'translateX(-50%)' }
      : { right: 0 }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        display: 'grid',
        gap: 8,
        justifyItems: align === 'center' ? 'center' : 'end',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent,
          alignItems: 'center',
        }}
      >
        {primaryThemes.map((item) => {
          const active = item.id === theme
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTheme(item.id)
                setOpen(false)
              }}
              style={chipStyle({ active, featured: true })}
              title={item.label}
            >
              <ThemeIcon themeId={item.id} size={14} />
              {item.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={chipStyle({ active: activeSecondary || open, featured: false })}
          title="Abrir outros temas"
        >
          <ThemeIcon themeId={activeTheme.id} size={14} />
          {activeSecondary ? activeTheme.label : 'Mais temas'}
        </button>
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            zIndex: 60,
            width: 'min(420px, calc(100vw - 32px))',
            padding: 12,
            borderRadius: 20,
            border: '1px solid var(--panel-border)',
            background: 'color-mix(in srgb, var(--panel-bg-strong) 92%, transparent)',
            backdropFilter: 'blur(24px) saturate(150%)',
            boxShadow: 'var(--shadow-lg)',
            ...panelPosition,
          }}
        >
          <div
            style={{
              marginBottom: 10,
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Colecao de temas
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {secondaryThemes.map((item) => {
              const active = item.id === theme
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id)
                    setOpen(false)
                  }}
                  style={chipStyle({ active, featured: false })}
                  title={item.label}
                >
                  <ThemeIcon themeId={item.id} size={14} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function chipStyle({ active, featured }) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: featured ? '9px 13px' : '8px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? 'color-mix(in srgb, var(--brand-cyan) 28%, transparent)' : 'var(--panel-border)'}`,
    background: active
      ? 'linear-gradient(135deg, color-mix(in srgb, var(--brand-cyan) 18%, transparent), color-mix(in srgb, var(--brand-violet) 20%, transparent))'
      : 'var(--surface-elevated)',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  }
}
