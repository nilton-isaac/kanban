import { useEffect, useState } from 'react'
import { ClipboardList, CalendarDays, LogOut, AlertTriangle } from 'lucide-react'
import ThemeSwitcher from './ThemeSwitcher'

const NAV_ITEMS = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'eisenhower', label: 'Matriz' },
  { id: 'archived', label: 'Arquivo' },
]

export default function Header({
  viewMode,
  onViewModeChange,
  session,
  onStandup,
  onNextDay,
  nextDayDone,
  onLogout,
  syncError,
  archivedCount,
}) {
  const [time, setTime] = useState(new Date())
  const userInitial = session?.user?.email?.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '22px 24px 18px',
        borderBottom: '1px solid var(--panel-border)',
        background: 'color-mix(in srgb, var(--panel-bg-strong) 82%, transparent)',
        backdropFilter: 'blur(28px) saturate(160%)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 6, minWidth: 'min(100%, 320px)' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Synth KV Workspace
          </span>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(24px, 4vw, 38px)',
                lineHeight: 0.96,
                letterSpacing: '-0.05em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Synth Kanban
            </h1>
            <p
              style={{
                marginTop: 8,
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Glass workflow com foco em clareza, ritmo e glow ciano-violeta
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, justifyItems: 'end', flex: 1, minWidth: 'min(100%, 420px)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div
              style={{
                padding: '10px 14px',
                border: '1px solid var(--panel-border)',
                borderRadius: 18,
                background: 'var(--surface-elevated)',
                minWidth: 152,
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {time.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.04em' }}>
                {time.toLocaleTimeString('pt-BR')}
              </div>
            </div>

            <button onClick={onStandup} style={actionBtnStyle()}>
              <ClipboardList size={14} /> Standup
            </button>
            <button onClick={onNextDay} style={actionBtnStyle(nextDayDone ? 'var(--neon-green)' : 'var(--neon-yellow)')}>
              <CalendarDays size={14} /> {nextDayDone ? 'Dia virado' : 'Próx. dia'}
            </button>

            <ThemeSwitcher align="end" />

            <div
              title={session.user?.email}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid var(--panel-border)',
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand-cyan) 20%, transparent), color-mix(in srgb, var(--brand-violet) 26%, transparent))',
                color: 'var(--text-primary)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
              }}
            >
              {userInitial}
            </div>

            <button onClick={onLogout} style={actionBtnStyle('var(--neon-pink)')}>
              <LogOut size={14} /> Sair
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                gap: 6,
                padding: 6,
                borderRadius: 999,
                border: '1px solid var(--panel-border)',
                background: 'var(--surface-elevated)',
              }}
            >
              {NAV_ITEMS.map(({ id, label }) => {
                const active = viewMode === id
                return (
                  <button
                    key={id}
                    onClick={() => onViewModeChange(id)}
                    style={{
                      position: 'relative',
                      padding: '9px 14px',
                      border: 'none',
                      borderRadius: 999,
                      cursor: 'pointer',
                      background: active ? 'linear-gradient(135deg, color-mix(in srgb, var(--brand-cyan) 18%, transparent), color-mix(in srgb, var(--brand-violet) 20%, transparent))' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                    }}
                  >
                    {label}
                    {id === 'archived' && archivedCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: 'var(--neon-yellow)',
                          boxShadow: '0 0 10px color-mix(in srgb, var(--neon-yellow) 62%, transparent)',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {syncError ? (
              <p
                style={{
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '11px',
                  color: 'var(--neon-orange)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <AlertTriangle size={13} />
                {syncError}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {session.user?.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function actionBtnStyle(color = 'var(--neon-cyan)') {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 14px',
    borderRadius: 16,
    cursor: 'pointer',
    border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
    background: 'var(--surface-elevated)',
    color,
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
  }
}
