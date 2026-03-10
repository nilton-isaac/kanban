import { useState, useEffect, useMemo, useRef } from 'react'
import {
  DEFAULT_DAILY_TEMPLATE,
  DEFAULT_STANDUP_PREFERENCES,
  generateStandupMessage,
  generateWeeklySummary,
} from '../lib/standup'
import { fetchWeeklyLogs, fetchProfile, updateProfile } from '../lib/db'
import { useTheme } from '../contexts/ThemeContext'

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
  const [preferences, setPreferences] = useState(DEFAULT_STANDUP_PREFERENCES)

  const textareaRef = useRef(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoadingTemplate(true)
    fetchProfile(userId)
      .then((profile) => {
        if (profile?.standup_template) {
          setTemplateText(profile.standup_template)
        }
        if (profile?.standup_template_date) {
          setDateText(profile.standup_template_date)
        }
        if (profile?.standup_preferences) {
          setPreferences((prev) => ({
            ...prev,
            ...profile.standup_preferences,
            colors: {
              ...prev.colors,
              ...(profile.standup_preferences.colors || {}),
            },
            statusLabels: {
              ...prev.statusLabels,
              ...(profile.standup_preferences.statusLabels || {}),
            },
            statusStyles: {
              ...prev.statusStyles,
              ...(profile.standup_preferences.statusStyles || {}),
            },
            columnAliases: {
              ...prev.columnAliases,
              ...(profile.standup_preferences.columnAliases || {}),
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
      preferences,
    })
  }, [columns, cards, theme, templateText, dateText, preferences])

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
                  {tokenChip('js: cols.length', '{js: cols.length}', insertToken)}
                  {tokenChip("js: cards.map(c => c.tasks.map(t => t.link)).flat().filter(Boolean).join('\\n')", '{links}', insertToken)}
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

              {isEditingTemplate && (
                <div className="cyber-card" style={{ padding: '14px', marginBottom: 16, border: '1px solid rgba(252,238,10,0.35)' }}>
                  {loadingTemplate && (
                    <p style={{ color: '#777', fontSize: '11px', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                      Carregando template salvo...
                    </p>
                  )}

                  <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    {prefInput('Data variavel ({date})', dateText, (e) => setDateText(e.target.value))}
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999' }}>Formato da mensagem</span>
                      <select
                        className="cyber-input"
                        value={preferences.format}
                        onChange={(e) => updatePreference('format', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                      >
                        <option value="plain">Texto puro</option>
                        <option value="markdown">Markdown</option>
                        <option value="html">HTML</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                    {prefInput('Cor base do texto', preferences.colors.text, (e) => updateNestedPreference('colors', 'text', e.target.value), '#e5e7eb')}
                    {prefInput('Cor de destaque', preferences.colors.accent, (e) => updateNestedPreference('colors', 'accent', e.target.value), '#00f3ff')}
                    {prefInput('Cor de concluido', preferences.colors.done, (e) => updateNestedPreference('colors', 'done', e.target.value), '#22c55e')}
                    {prefInput('Cor de pendente', preferences.colors.pending || preferences.colors.todo || '', (e) => updateNestedPreference('colors', 'pending', e.target.value), '#94a3b8')}
                    {prefInput('Cor de bloqueado', preferences.colors.blocked, (e) => updateNestedPreference('colors', 'blocked', e.target.value), '#ef4444')}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                    {prefInput('Texto status concluido', preferences.statusLabels.done, (e) => updateNestedPreference('statusLabels', 'done', e.target.value))}
                    {prefInput('Texto task concluida', preferences.completedTaskLabel, (e) => updatePreference('completedTaskLabel', e.target.value))}
                    {prefInput('Texto task pendente', preferences.pendingTaskLabel, (e) => updatePreference('pendingTaskLabel', e.target.value))}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
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
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#7f7f7f', marginBottom: 6 }}>
                    Scripts: {'{{js: expressao}}'} ou {'{{#script}} return ... {{/script}}'}.
                    Variaveis: cols, cards, prefs, date, header, footer, columns, col('ID_OU_NOME'), style(), link(), statusText().
                  </p>
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

              <pre
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: preferences.colors.text || 'var(--neon-cyan)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '16px',
                  border: '1px solid rgba(0,243,255,0.15)',
                }}
              >
                {dailyMessage}
              </pre>
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
                onClick={() => copy(dailyMessage)}
                className="cyber-btn"
                style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
              >
                {copied ? 'Copiado!' : 'Copiar Texto'}
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
              {copied ? 'Copiado!' : 'Copiar Resumo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
