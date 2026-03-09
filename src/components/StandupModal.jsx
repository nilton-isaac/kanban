import { useState, useEffect } from 'react'
import { generateStandupMessage, generateWeeklySummary } from '../lib/standup'
import { fetchWeeklyLogs } from '../lib/db'
import { useTheme } from '../contexts/ThemeContext'

export default function StandupModal({ columns, cards, userId, onSaveLog, onClose }) {
  const { theme } = useTheme()
  const [tab, setTab] = useState('daily') // 'daily' | 'weekly'
  const [copied, setCopied] = useState(false)
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [saved, setSaved] = useState(false)

  const dailyMessage = generateStandupMessage(columns, cards, theme)

  useEffect(() => {
    if (tab === 'weekly' && userId) {
      setLoadingWeekly(true)
      fetchWeeklyLogs(userId)
        .then(setWeeklyLogs)
        .catch(console.error)
        .finally(() => setLoadingWeekly(false))
    }
  }, [tab, userId])

  const weeklySummary = generateWeeklySummary(weeklyLogs, theme)

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const saveAndCopy = async () => {
    copy(dailyMessage)
    if (userId && onSaveLog) {
      await onSaveLog(dailyMessage)
      setSaved(true)
    }
  }

  const tabStyle = (t) => ({
    fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '1px', padding: '8px 18px', cursor: 'pointer', border: 'none',
    background: tab === t ? 'rgba(0,243,255,0.12)' : 'transparent',
    color: tab === t ? 'var(--neon-cyan)' : '#555',
    borderBottom: tab === t ? '2px solid var(--neon-cyan)' : '2px solid transparent',
    transition: 'all 0.2s',
  })

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cyber-card fade-in" style={{
        background: 'var(--panel-bg)', width: '100%', maxWidth: '640px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            📋 Standup
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '18px' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
          <button style={tabStyle('daily')} onClick={() => setTab('daily')}>Daily de Hoje</button>
          <button style={tabStyle('weekly')} onClick={() => setTab('weekly')}>Resumo Semanal</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {tab === 'daily' && (
            <>
              <pre style={{
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: 'var(--neon-cyan)', lineHeight: '1.7',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: 'rgba(0,0,0,0.4)', padding: '16px',
                border: '1px solid rgba(0,243,255,0.15)',
              }}>
                {dailyMessage}
              </pre>
              {saved && (
                <p style={{ fontSize: '11px', color: 'var(--neon-green)', fontFamily: 'var(--font-body)', marginTop: 8 }}>
                  ✓ Standup salvo no histórico semanal.
                </p>
              )}
            </>
          )}

          {tab === 'weekly' && (
            <>
              {loadingWeekly ? (
                <p style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Carregando histórico...</p>
              ) : (
                <pre style={{
                  fontFamily: 'var(--font-body)', fontSize: '12px',
                  color: 'var(--neon-yellow)', lineHeight: '1.7',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: 'rgba(0,0,0,0.4)', padding: '16px',
                  border: '1px solid rgba(252,238,10,0.15)',
                }}>
                  {weeklySummary}
                </pre>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #222', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="cyber-btn" style={{ padding: '8px 16px', fontSize: '12px' }}>Fechar</button>
          {tab === 'daily' && (
            <>
              <button
                onClick={() => copy(dailyMessage)}
                className="cyber-btn"
                style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
              >
                {copied ? '✓ Copiado!' : 'Copiar Texto'}
              </button>
              {userId && !saved && (
                <button
                  onClick={saveAndCopy}
                  className="cyber-btn"
                  style={{ padding: '8px 20px', fontSize: '12px', background: 'var(--neon-cyan)', color: '#000' }}
                >
                  Copiar + Salvar
                </button>
              )}
            </>
          )}
          {tab === 'weekly' && !loadingWeekly && (
            <button
              onClick={() => copy(weeklySummary)}
              className="cyber-btn"
              style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
            >
              {copied ? '✓ Copiado!' : 'Copiar Resumo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
