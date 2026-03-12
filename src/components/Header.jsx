import { useState, useEffect } from 'react'
import { ClipboardList, CalendarDays, Check, Palette, LogOut, AlertTriangle, Sword } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { THEMES } from '../themes'
import { ThemeIcon } from '../lib/themeIcons'
import { GamificationStrip } from './GamificationHUD'
import { computeLevel } from '../lib/gamification'

export default function Header({ viewMode, onViewModeChange, session, onStandup, onNextDay, nextDayDone, onLogout, syncError, archivedCount, gameState }) {
  const [time, setTime] = useState(new Date())
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const userInitial = session?.user?.email?.charAt(0).toUpperCase() || '?'
  const t = THEMES[theme]

  const disableScanline = theme === 'nier' || theme === 'darksouls' || theme === 'royale'

  return (
    <header style={{
      position: 'relative', width: '100%', overflow: 'hidden', flexShrink: 0,
      height: '145px',
      borderBottom: '1px solid var(--neon-cyan)',
      boxShadow: '0 0 20px rgba(0,0,0,0.3)',
      background: 'linear-gradient(to bottom, var(--bg-dark), var(--bg-dark))',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {!disableScanline && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)', animation: 'scanLine 4s linear infinite', pointerEvents: 'none' }} />
          <style>{`@keyframes scanLine { 0%{top:0%;opacity:1} 95%{top:100%;opacity:.3} 100%{top:0%;opacity:0} }`}</style>
        </>
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-dark) 0%, transparent 80%)' }} />

      <div style={{ position: 'absolute', bottom: 12, left: 24, zIndex: 10 }}>
        <h1 className="glitch-wrapper" data-text="KANBAN_NINE" style={{
          fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff',
          fontSize: 'clamp(20px, 3.5vw, 36px)', letterSpacing: '4px',
          textShadow: '0 0 20px var(--neon-cyan)',
        }}>
          KANBAN_NINE
        </h1>
        <p style={{ marginTop: 2, fontSize: '10px', letterSpacing: '2px', fontFamily: 'var(--font-body)', color: 'var(--neon-cyan)' }}>
          <ThemeIcon themeId={theme} size={12} style={{ display: 'inline', verticalAlign: 'text-top', marginRight: 4 }} />
          {t?.label} // KANBAN NINE v2.2
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', border: '1px solid rgba(0,243,255,0.2)', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
            {[
              { id: 'kanban', label: 'KANBAN' },
              { id: 'eisenhower', label: 'EISENHOWER' },
              { id: 'archived', label: 'ARQUIVO' },
              { id: 'dungeon', label: '⚔️ DUNGEON' },
            ].map(({ id, label }, idx, arr) => (
              <button key={id} onClick={() => onViewModeChange(id)} style={{
                padding: '6px 16px',
                background: viewMode === id
                  ? id === 'dungeon' ? 'rgba(255,0,128,0.15)' : 'rgba(0,243,255,0.12)'
                  : 'transparent',
                border: 'none',
                borderRight: idx < arr.length - 1 ? '1px solid rgba(0,243,255,0.2)' : 'none',
                color: viewMode === id
                  ? id === 'dungeon' ? 'var(--neon-pink)' : 'var(--neon-cyan)'
                  : '#444',
                fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '1px', cursor: 'pointer',
                transition: 'all 0.2s', textTransform: 'uppercase',
                boxShadow: viewMode === id
                  ? `inset 0 -2px 0 ${id === 'dungeon' ? 'var(--neon-pink)' : 'var(--neon-cyan)'}`
                  : 'none',
                position: 'relative',
              }}>
                {label}
                {id === 'archived' && archivedCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--neon-yellow)',
                    boxShadow: '0 0 4px var(--neon-yellow)',
                  }} />
                )}
              </button>
            ))}
          </div>
          {/* XP strip */}
          {gameState && <GamificationStrip gameState={gameState} />}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 10, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-body)', color: 'var(--neon-yellow)' }}>{time.toLocaleDateString('pt-BR')}</div>
          <div style={{ fontSize: '15px', fontFamily: 'var(--font-heading)', color: 'var(--neon-pink)', letterSpacing: '2px' }}>{time.toLocaleTimeString('pt-BR')}</div>
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={onStandup} title="Gerar Standup" style={hdrBtn('var(--neon-cyan)')}>
            <ClipboardList size={12} /> STANDUP
          </button>
          <button onClick={() => onViewModeChange('dungeon')} title="Entrar na Dungeon" style={hdrBtn('var(--neon-pink)')}>
            <Sword size={12} /> DUNGEON
          </button>

          <button onClick={onNextDay} title="Virar o dia" style={hdrBtn(nextDayDone ? 'var(--neon-green)' : 'var(--neon-yellow)')}>
            {nextDayDone ? <><Check size={12} /> VIRADO</> : <><CalendarDays size={12} /> PROX. DIA</>}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setThemeMenuOpen(v => !v)}
              onBlur={() => setTimeout(() => setThemeMenuOpen(false), 200)}
              style={hdrBtn('var(--neon-purple)')}
            >
              <Palette size={12} /> <ThemeIcon themeId={theme} size={12} /> TEMA
            </button>
            {themeMenuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--panel-bg)', border: '1px solid #333', zIndex: 200, minWidth: '180px' }}>
                {Object.values(THEMES).map(th => (
                  <button key={th.id} onClick={() => { setTheme(th.id); setThemeMenuOpen(false) }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left',
                      background: theme === th.id ? 'rgba(255,255,255,0.05)' : 'none',
                      border: 'none', cursor: 'pointer',
                      color: theme === th.id ? 'var(--neon-cyan)' : '#777',
                      fontFamily: 'var(--font-body)', fontSize: '12px',
                      borderLeft: theme === th.id ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                    }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ThemeIcon themeId={th.id} size={12} />
                      {th.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {session && (
            <>
              <div title={session.user?.email} style={{
                width: 26, height: 26, borderRadius: '50%', background: 'var(--neon-cyan)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 'bold', color: '#000', cursor: 'default',
              }}>{userInitial}</div>
              <button onClick={onLogout} style={{ ...hdrBtn('var(--neon-pink)'), fontSize: '9px', padding: '4px 8px' }}>
                <LogOut size={11} /> SAIR
              </button>
            </>
          )}
        </div>

        {syncError && (
          <p style={{ fontSize: '9px', color: 'var(--neon-pink)', fontFamily: 'var(--font-body)', maxWidth: '200px', textAlign: 'right' }}>
            <AlertTriangle size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-top' }} />
            {syncError}
          </p>
        )}
      </div>
    </header>
  )
}

function hdrBtn(color) {
  return {
    padding: '5px 10px',
    background: 'rgba(0,0,0,0.5)',
    border: `1px solid ${color}55`,
    color,
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }
}
