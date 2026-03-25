import { useState, useEffect, useMemo, useRef } from 'react'
import {
  DEFAULT_DAILY_TEMPLATE,
  DEFAULT_STANDUP_PREFERENCES,
  generateStandupMessage,
  generateWeeklySummary,
} from '../lib/standup'
import { fetchWeeklyLogs, fetchProfile, updateProfile } from '../lib/db'
import { useTheme } from '../contexts/ThemeContext'

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
}

function markdownToHtml(markdown) {
  return escapeHtml(markdown)
    .replace(/\*\*_([^\n*]+)_\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^\n*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^\n_]+)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

function tokenChip(token, label, onInsert) {
  return (
    <button
      key={token}
      onClick={() => onInsert(token)}
      type="button"
      style={{
        padding: '6px 10px',
        borderRadius: '999px',
        border: '1px solid var(--neon-cyan)',
        background: 'rgba(0,243,255,0.1)',
        color: 'var(--neon-cyan)',
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        cursor: 'pointer',
      }}
      title={`Inserir ${token}`}
    >
      {label}
    </button>
  )
}

function prefInput(label, value, onChange, placeholder = '') {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999' }}>{label}</span>
      <input
        className="cyber-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
      />
    </label>
  )
}

export default function StandupModal({ columns, cards, userId, onSaveLog, onClose }) {
  const { theme } = useTheme()
  const [tab, setTab] = useState('daily')
  const [copied, setCopied] = useState(false)
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)
  const [templateText, setTemplateText] = useState(DEFAULT_DAILY_TEMPLATE)
  const [dateText, setDateText] = useState(() =>
    new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  )
  const [preferences, setPreferences] = useState({ ...DEFAULT_STANDUP_PREFERENCES, format: 'markdown' })

  const textareaRef = useRef(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoadingTemplate(true)
    fetchProfile(userId)
      .then((profile) => {
        if (profile?.standup_template) setTemplateText(profile.standup_template)
        if (profile?.standup_template_date) setDateText(profile.standup_template_date)
        if (profile?.standup_preferences) {
          setPreferences((prev) => ({
            ...prev,
            ...profile.standup_preferences,
            format: 'markdown',
            columnAliases: {
              ...prev.columnAliases,
              ...(profile.standup_preferences.columnAliases || {}),
            },
            statusLabels: {
              ...prev.statusLabels,
              ...(profile.standup_preferences.statusLabels || {}),
            },
          }))
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTemplate(false))
  }, [userId])

  useEffect(() => {
    if (tab === 'weekly' && userId) {
      setLoadingWeekly(true)
      fetchWeeklyLogs(userId)
        .then(setWeeklyLogs)
        .catch(console.error)
        .finally(() => setLoadingWeekly(false))
    }
  }, [tab, userId])

  const dailyMessage = useMemo(() => {
    return generateStandupMessage(columns, cards, theme, {
      template: templateText,
      customDateText: dateText,
      preferences: { ...preferences, format: 'markdown' },
    })
  }, [columns, cards, theme, templateText, dateText, preferences])

  const previewHtml = useMemo(() => markdownToHtml(dailyMessage), [dailyMessage])

  const weeklySummary = generateWeeklySummary(weeklyLogs, theme)

  const insertToken = (token) => {
    const fullToken = `{{${token}}}`
    const el = textareaRef.current
    if (!el) {
      setTemplateText((prev) => `${prev}${fullToken}`)
      return
    }

    const start = el.selectionStart ?? templateText.length
    const end = el.selectionEnd ?? templateText.length
    const next = `${templateText.slice(0, start)}${fullToken}${templateText.slice(end)}`
    setTemplateText(next)

    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + fullToken.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const updateNestedPreference = (group, key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] || {}),
        [key]: value,
      },
    }))
  }

  const updateColumnAlias = (columnId, value) => {
    setPreferences((prev) => ({
      ...prev,
      columnAliases: {
        ...(prev.columnAliases || {}),
        [columnId]: value,
      },
    }))
  }

  const copy = async (text) => {
    await navigator.clipboard.writeText(stripHtml(text))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveAndCopy = async () => {
    await copy(dailyMessage)
    if (userId && onSaveLog) {
      await onSaveLog(dailyMessage)
      setSaved(true)
    }
  }

  const saveTemplate = async () => {
    if (!userId) return
    setSavingTemplate(true)
    try {
      await updateProfile(userId, {
        standup_template: templateText,
        standup_template_date: dateText,
        standup_preferences: preferences,
      })
      setTemplateSaved(true)
      setTimeout(() => setTemplateSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingTemplate(false)
    }
  }

  const tabStyle = (t) => ({
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 18px',
    cursor: 'pointer',
    border: 'none',
    background: tab === t ? 'rgba(0,243,255,0.12)' : 'transparent',
    color: tab === t ? 'var(--neon-cyan)' : '#555',
    borderBottom: tab === t ? '2px solid var(--neon-cyan)' : '2px solid transparent',
    transition: 'all 0.2s',
  })

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="cyber-card fade-in"
        style={{
          background: 'var(--panel-bg)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Standup
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '18px' }}>x</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
          <button style={tabStyle('daily')} onClick={() => setTab('daily')}>Daily de Hoje</button>
          <button style={tabStyle('weekly')} onClick={() => setTab('weekly')}>Resumo Semanal</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {tab === 'daily' && (
            <>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tokenChip('date', '{date}', insertToken)}
                  {tokenChip('header', '{header}', insertToken)}
                  {tokenChip('columns', '{columns}', insertToken)}
                  {tokenChip('footer', '{footer}', insertToken)}
                  {columns.map((c) => tokenChip(`col:${c.id}`, `{${preferences.columnAliases?.[c.id] || c.title}}`, insertToken))}
                </div>
                <button
                  onClick={() => setIsEditingTemplate((v) => !v)}
                  className="cyber-btn"
                  style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
                >
                  {isEditingTemplate ? 'Fechar edicao' : 'Editar template'}
                </button>
              </div>

              <div className="cyber-card" style={{ padding: '14px', marginBottom: 16, border: '1px solid rgba(0,243,255,0.18)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                  {prefInput('Texto de concluido', preferences.statusLabels.done, (e) => updateNestedPreference('statusLabels', 'done', e.target.value))}
                  {prefInput('Texto de bloqueado', preferences.statusLabels.blocked, (e) => updateNestedPreference('statusLabels', 'blocked', e.target.value))}
                  {prefInput('Texto de review', preferences.statusLabels.review, (e) => updateNestedPreference('statusLabels', 'review', e.target.value))}
                  {prefInput('Texto de andamento', preferences.statusLabels.progress, (e) => updateNestedPreference('statusLabels', 'progress', e.target.value))}
                  {prefInput('Texto de a fazer', preferences.statusLabels.todo, (e) => updateNestedPreference('statusLabels', 'todo', e.target.value))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#bbb', fontSize: '12px' }}>
                    <input type="checkbox" checked={preferences.showCompletedTasks} onChange={(e) => updatePreference('showCompletedTasks', e.target.checked)} />
                    Mostrar tasks concluidas
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#bbb', fontSize: '12px' }}>
                    <input type="checkbox" checked={preferences.showPendingTasks} onChange={(e) => updatePreference('showPendingTasks', e.target.checked)} />
                    Mostrar tasks pendentes
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#bbb', fontSize: '12px' }}>
                    <input type="checkbox" checked={preferences.includeTaskLinks} onChange={(e) => updatePreference('includeTaskLinks', e.target.checked)} />
                    Incluir hyperlinks das tasks
                  </label>
                </div>
              </div>

              {isEditingTemplate && (
                <div className="cyber-card" style={{ padding: '14px', marginBottom: 16, border: '1px solid rgba(252,238,10,0.35)' }}>
                  {loadingTemplate && (
                    <p style={{ color: '#777', fontSize: '11px', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                      Carregando template salvo...
                    </p>
                  )}

                  <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    {prefInput('Data variavel ({date})', dateText, (e) => setDateText(e.target.value))}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999', display: 'block', marginBottom: 6 }}>
                      Alias das colunas no standup
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      {columns.map((column) => (
                        <label key={column.id} style={{ display: 'grid', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#777' }}>{column.title}</span>
                          <input
                            className="cyber-input"
                            value={preferences.columnAliases?.[column.id] || ''}
                            onChange={(e) => updateColumnAlias(column.id, e.target.value)}
                            placeholder="Nome alternativo"
                            style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <label style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999', display: 'block', marginBottom: 6 }}>
                    Template (use os chips para inserir variaveis no texto)
                  </label>
                  <textarea
                    ref={textareaRef}
                    className="cyber-input"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    rows={9}
                    style={{ width: '100%', padding: '10px', resize: 'vertical', fontSize: '12px', whiteSpace: 'pre' }}
                  />
                  {userId && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        onClick={saveTemplate}
                        className="cyber-btn"
                        disabled={savingTemplate}
                        style={{ padding: '7px 14px', fontSize: '11px', background: 'var(--neon-green)', color: '#000' }}
                      >
                        {savingTemplate ? 'Salvando...' : templateSaved ? 'Template salvo!' : 'Salvar template'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  lineHeight: '1.7',
                  wordBreak: 'break-word',
                  color: '#e5e7eb',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '16px',
                  border: '1px solid rgba(0,243,255,0.15)',
                  whiteSpace: 'normal',
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              >
              </div>
              <p style={{ fontSize: '11px', color: '#777', fontFamily: 'var(--font-body)', marginTop: 8 }}>
                Standup travado em markdown. Colunas ficam em negrito. Estados ficam em negrito e italico.
              </p>
              {saved && (
                <p style={{ fontSize: '11px', color: 'var(--neon-green)', fontFamily: 'var(--font-body)', marginTop: 8 }}>
                  Standup salvo no historico semanal.
                </p>
              )}
            </>
          )}

          {tab === 'weekly' && (
            <>
              {loadingWeekly ? (
                <p style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Carregando historico...</p>
              ) : (
                <pre
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--neon-yellow)',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '16px',
                    border: '1px solid rgba(252,238,10,0.15)',
                  }}
                >
                  {weeklySummary}
                </pre>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #222', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="cyber-btn" style={{ padding: '8px 16px', fontSize: '12px' }}>Fechar</button>
          {tab === 'daily' && (
            <>
              <button
                onClick={() => copy(dailyMessage).catch(console.error)}
                className="cyber-btn"
                style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
              >
                {copied ? 'Copiado!' : 'Copiar Markdown'}
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
              onClick={() => navigator.clipboard.writeText(weeklySummary).catch(console.error)}
              className="cyber-btn"
              style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
            >
              Copiar Resumo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
