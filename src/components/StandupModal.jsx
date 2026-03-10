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

function markdownToHtml(markdown) {
  const escaped = escapeHtml(markdown)
  return escaped
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
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

function toggleStyleButton(active, label, onClick) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cyber-btn"
      style={{
        padding: '6px 10px',
        fontSize: '11px',
        background: active ? '#00f3ff' : 'transparent',
        color: active ? '#02131a' : '#8aa5b3',
        borderColor: active ? '#00f3ff' : '#355160',
        fontWeight: active ? 700 : 400,
        boxShadow: active ? '0 0 0 1px #00f3ff inset, 0 0 12px rgba(0,243,255,0.25)' : 'none',
      }}
    >
      {active ? `Ativo: ${label}` : label}
    </button>
  )
}

function styleEditor({ title, color, onColorChange, bold, italic, onBoldToggle, onItalicToggle }) {
  return (
    <div className="cyber-card" style={{ padding: 10, border: '1px solid rgba(0,243,255,0.12)' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999', marginBottom: 6 }}>{title}</p>
      <input
        className="cyber-input"
        value={color || ''}
        onChange={onColorChange}
        placeholder="#00f3ff"
        style={{ width: '100%', padding: '8px 10px', fontSize: '12px', marginBottom: 8 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        {toggleStyleButton(!!bold, 'Negrito', onBoldToggle)}
        {toggleStyleButton(!!italic, 'Italico', onItalicToggle)}
      </div>
    </div>
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
            taskLabelStyles: {
              ...prev.taskLabelStyles,
              ...(profile.standup_preferences.taskLabelStyles || {}),
            },
            elementStyles: {
              ...prev.elementStyles,
              ...(profile.standup_preferences.elementStyles || {}),
            },
            columnAliases: {
              ...prev.columnAliases,
              ...(profile.standup_preferences.columnAliases || {}),
            },
            columnStyles: {
              ...(prev.columnStyles || {}),
              ...(profile.standup_preferences.columnStyles || {}),
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

  const updateColumnStyle = (columnId, key, value) => {
    setPreferences((prev) => ({
      ...prev,
      format: key === 'color' && value ? 'html' : prev.format,
      columnStyles: {
        ...(prev.columnStyles || {}),
        [columnId]: {
          ...((prev.columnStyles || {})[columnId] || {}),
          [key]: value,
        },
      },
    }))
  }

  const updateStyleToggle = (group, key, styleKey) => {
    setPreferences((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] || {}),
        [key]: {
          ...((prev[group] || {})[key] || {}),
          [styleKey]: !((prev[group] || {})[key] || {})[styleKey],
        },
      },
    }))
  }

  const updateStyleColor = (group, key, color) => {
    setPreferences((prev) => ({
      ...prev,
      format: color ? 'html' : prev.format,
      [group]: {
        ...(prev[group] || {}),
        [key]: {
          ...((prev[group] || {})[key] || {}),
          color,
        },
      },
    }))
  }

  const previewBodyHtml = useMemo(() => {
    const previewTextColor = preferences.colors.text || '#e5e7eb'
    const baseStyle = [
      'all: initial',
      'display: block',
      'box-sizing: border-box',
      'font-family: Inter, Segoe UI, Arial, sans-serif',
      `color: ${previewTextColor}`,
      'font-size: 13px',
      'line-height: 1.7',
      'white-space: normal',
      'word-break: break-word',
    ].join('; ')

    const content = preferences.format === 'html'
      ? dailyMessage
      : preferences.format === 'markdown'
        ? markdownToHtml(dailyMessage)
        : escapeHtml(dailyMessage).replace(/\n/g, '<br />')

    return `<div style="${baseStyle}">${content}</div>`
  }, [dailyMessage, preferences.colors.text, preferences.format])

  const previewHtmlDoc = useMemo(() => {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        background: transparent;
      }
      a {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>${previewBodyHtml}</body>
</html>`
  }, [previewBodyHtml])

  const copy = async (text) => {
    if (preferences.format === 'html' && window.ClipboardItem && navigator.clipboard?.write) {
      const htmlBlob = new Blob([previewBodyHtml], { type: 'text/html' })
      const plainBlob = new Blob([stripHtml(previewBodyHtml)], { type: 'text/plain' })
      await navigator.clipboard.write([new window.ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': plainBlob,
      })])
    } else {
      await navigator.clipboard.writeText(text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyDailyMessage = () => {
    copy(dailyMessage).catch(console.error)
  }

  const copyWeeklySummary = () => {
    copy(weeklySummary).catch(console.error)
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

              <div className="cyber-card" style={{ padding: '14px', marginBottom: 16, border: '1px solid rgba(0,243,255,0.18)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999' }}>Formato visivel e de copia</span>
                    <select
                      className="cyber-input"
                      value={preferences.format}
                      onChange={(e) => updatePreference('format', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    >
                      <option value="html">HTML com cor</option>
                      <option value="markdown">Markdown</option>
                      <option value="plain">Texto puro</option>
                    </select>
                  </label>
                  {prefInput('Cor concluido', preferences.colors.done, (e) => updateNestedPreference('colors', 'done', e.target.value), '#22c55e')}
                  {prefInput('Cor pendente', preferences.colors.pending || preferences.colors.todo || '', (e) => updateNestedPreference('colors', 'pending', e.target.value), '#94a3b8')}
                  {prefInput('Cor destaque', preferences.colors.accent, (e) => updateNestedPreference('colors', 'accent', e.target.value), '#00f3ff')}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {styleEditor({
                    title: 'Cabecalho',
                    color: preferences.elementStyles?.header?.color,
                    onColorChange: (e) => updateStyleColor('elementStyles', 'header', e.target.value),
                    bold: preferences.elementStyles?.header?.bold,
                    italic: preferences.elementStyles?.header?.italic,
                    onBoldToggle: () => updateStyleToggle('elementStyles', 'header', 'bold'),
                    onItalicToggle: () => updateStyleToggle('elementStyles', 'header', 'italic'),
                  })}
                  {styleEditor({
                    title: 'Rodape',
                    color: preferences.elementStyles?.footer?.color,
                    onColorChange: (e) => updateStyleColor('elementStyles', 'footer', e.target.value),
                    bold: preferences.elementStyles?.footer?.bold,
                    italic: preferences.elementStyles?.footer?.italic,
                    onBoldToggle: () => updateStyleToggle('elementStyles', 'footer', 'bold'),
                    onItalicToggle: () => updateStyleToggle('elementStyles', 'footer', 'italic'),
                  })}
                  {styleEditor({
                    title: 'Titulo do card',
                    color: preferences.elementStyles?.cardTitle?.color,
                    onColorChange: (e) => updateStyleColor('elementStyles', 'cardTitle', e.target.value),
                    bold: preferences.elementStyles?.cardTitle?.bold,
                    italic: preferences.elementStyles?.cardTitle?.italic,
                    onBoldToggle: () => updateStyleToggle('elementStyles', 'cardTitle', 'bold'),
                    onItalicToggle: () => updateStyleToggle('elementStyles', 'cardTitle', 'italic'),
                  })}
                  {styleEditor({
                    title: 'Secao da coluna',
                    color: preferences.elementStyles?.section?.color,
                    onColorChange: (e) => updateStyleColor('elementStyles', 'section', e.target.value),
                    bold: preferences.elementStyles?.section?.bold,
                    italic: preferences.elementStyles?.section?.italic,
                    onBoldToggle: () => updateStyleToggle('elementStyles', 'section', 'bold'),
                    onItalicToggle: () => updateStyleToggle('elementStyles', 'section', 'italic'),
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
                  {styleEditor({
                    title: 'Task concluida',
                    color: preferences.colors.done,
                    onColorChange: (e) => updateNestedPreference('colors', 'done', e.target.value),
                    bold: preferences.taskLabelStyles?.done?.bold,
                    italic: preferences.taskLabelStyles?.done?.italic,
                    onBoldToggle: () => updateStyleToggle('taskLabelStyles', 'done', 'bold'),
                    onItalicToggle: () => updateStyleToggle('taskLabelStyles', 'done', 'italic'),
                  })}
                  {styleEditor({
                    title: 'Task pendente',
                    color: preferences.colors.pending || preferences.colors.todo,
                    onColorChange: (e) => updateNestedPreference('colors', 'pending', e.target.value),
                    bold: preferences.taskLabelStyles?.pending?.bold,
                    italic: preferences.taskLabelStyles?.pending?.italic,
                    onBoldToggle: () => updateStyleToggle('taskLabelStyles', 'pending', 'bold'),
                    onItalicToggle: () => updateStyleToggle('taskLabelStyles', 'pending', 'italic'),
                  })}
                  {['done', 'progress', 'review', 'blocked', 'todo'].map((statusKey) => styleEditor({
                    title: `Status ${statusKey}`,
                    color: preferences.colors?.[statusKey],
                    onColorChange: (e) => updateNestedPreference('colors', statusKey, e.target.value),
                    bold: preferences.statusStyles?.[statusKey]?.bold,
                    italic: preferences.statusStyles?.[statusKey]?.italic,
                    onBoldToggle: () => updateStyleToggle('statusStyles', statusKey, 'bold'),
                    onItalicToggle: () => updateStyleToggle('statusStyles', statusKey, 'italic'),
                  }))}
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
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999' }}>Formato da mensagem</span>
                      <select
                        className="cyber-input"
                        value={preferences.format}
                        onChange={(e) => updatePreference('format', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                      >
                        <option value="html">HTML</option>
                        <option value="markdown">Markdown</option>
                        <option value="plain">Texto puro</option>
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
                      Alias e estilo das colunas no standup
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      {columns.map((column) => (
                        <div key={column.id} className="cyber-card" style={{ padding: 10, border: '1px solid rgba(0,243,255,0.12)' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#777', display: 'block', marginBottom: 6 }}>{column.title}</span>
                          <input
                            className="cyber-input"
                            value={preferences.columnAliases?.[column.id] || ''}
                            onChange={(e) => updateColumnAlias(column.id, e.target.value)}
                            placeholder="Nome alternativo"
                            style={{ width: '100%', padding: '8px 10px', fontSize: '12px', marginBottom: 8 }}
                          />
                          <input
                            className="cyber-input"
                            value={preferences.columnStyles?.[column.id]?.color || ''}
                            onChange={(e) => updateColumnStyle(column.id, 'color', e.target.value)}
                            placeholder="Cor da coluna (#00f3ff)"
                            style={{ width: '100%', padding: '8px 10px', fontSize: '12px', marginBottom: 8 }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            {toggleStyleButton(!!preferences.columnStyles?.[column.id]?.bold, 'Negrito', () => updateColumnStyle(column.id, 'bold', !preferences.columnStyles?.[column.id]?.bold))}
                            {toggleStyleButton(!!preferences.columnStyles?.[column.id]?.italic, 'Italico', () => updateColumnStyle(column.id, 'italic', !preferences.columnStyles?.[column.id]?.italic))}
                          </div>
                        </div>
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

              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '16px',
                  border: '1px solid rgba(0,243,255,0.15)',
                  overflowX: 'auto',
                }}
              >
                <iframe
                  title="standup-preview"
                  srcDoc={previewHtmlDoc}
                  style={{
                    width: '100%',
                    minHeight: 260,
                    border: 'none',
                    background: 'transparent',
                  }}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#777', fontFamily: 'var(--font-body)', marginTop: 8 }}>
                Preview em {preferences.format === 'plain' ? 'texto puro' : preferences.format}. Para cor visivel e copia formatada, use `html`.
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
                onClick={copyDailyMessage}
                className="cyber-btn"
                style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
              >
                {copied ? 'Copiado!' : preferences.format === 'html' ? 'Copiar Rico' : 'Copiar Texto'}
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
              onClick={copyWeeklySummary}
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
