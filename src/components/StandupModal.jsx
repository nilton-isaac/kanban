import { useState, useEffect, useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { generateStandupMessage, generateWeeklySummary } from '../lib/standup'
import { fetchWeeklyLogs } from '../lib/db'
import { useTheme } from '../contexts/ThemeContext'

function SortableColumnChip({ column, enabled, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.preventDefault()
        onToggle(column.id)
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '6px 10px',
        borderRadius: '999px',
        border: `1px solid ${enabled ? 'var(--neon-cyan)' : '#555'}`,
        background: enabled ? 'rgba(0,243,255,0.12)' : 'rgba(255,255,255,0.04)',
        color: enabled ? 'var(--neon-cyan)' : '#888',
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        opacity: isDragging ? 0.5 : 1,
      }}
      title="Arraste para reordenar | Double-click para ativar/desativar"
      type="button"
    >
      {column.title}
    </button>
  )
}

export default function StandupModal({ columns, cards, userId, onSaveLog, onClose }) {
  const { theme } = useTheme()
  const [tab, setTab] = useState('daily') // 'daily' | 'weekly'
  const [copied, setCopied] = useState(false)
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editTemplate, setEditTemplate] = useState(false)
  const [headerTemplate, setHeaderTemplate] = useState('')
  const [footerTemplate, setFooterTemplate] = useState('')
  const [dateVariable, setDateVariable] = useState(() =>
    new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  )
  const [columnOrder, setColumnOrder] = useState(() =>
    [...columns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((c) => c.id)
  )
  const [enabledColumns, setEnabledColumns] = useState(() => columns.map((c) => c.id))

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => {
    if (tab === 'weekly' && userId) {
      setLoadingWeekly(true)
      fetchWeeklyLogs(userId)
        .then(setWeeklyLogs)
        .catch(console.error)
        .finally(() => setLoadingWeekly(false))
    }
  }, [tab, userId])

  useEffect(() => {
    const ids = columns.map((c) => c.id)
    setColumnOrder((prev) => {
      const filtered = prev.filter((id) => ids.includes(id))
      const missing = ids.filter((id) => !filtered.includes(id))
      return [...filtered, ...missing]
    })
    setEnabledColumns((prev) => {
      const filtered = prev.filter((id) => ids.includes(id))
      const missing = ids.filter((id) => !filtered.includes(id))
      return [...filtered, ...missing]
    })
  }, [columns])

  const orderedColumns = useMemo(() => {
    const map = new Map(columns.map((c) => [c.id, c]))
    return columnOrder.map((id) => map.get(id)).filter(Boolean)
  }, [columns, columnOrder])

  const dailyMessage = useMemo(() => {
    return generateStandupMessage(columns, cards, theme, {
      orderedColumnIds: columnOrder,
      includeColumnIds: enabledColumns,
      customDateText: dateVariable,
      customHeader: headerTemplate,
      customFooter: footerTemplate,
    })
  }, [columns, cards, theme, columnOrder, enabledColumns, dateVariable, headerTemplate, footerTemplate])

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

  const toggleColumn = (columnId) => {
    setEnabledColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    )
  }

  const handleChipDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setColumnOrder((prev) => {
      const oldIndex = prev.indexOf(active.id)
      const newIndex = prev.indexOf(over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      const updated = [...prev]
      const [moved] = updated.splice(oldIndex, 1)
      updated.splice(newIndex, 0, moved)
      return updated
    })
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
          maxWidth: '760px',
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
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditTemplate((v) => !v)}
                  className="cyber-btn"
                  style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}
                >
                  {editTemplate ? 'Fechar edicao' : 'Editar template'}
                </button>
              </div>

              {editTemplate && (
                <div className="cyber-card" style={{ padding: '14px', marginBottom: 16, border: '1px solid rgba(252,238,10,0.35)' }}>
                  <p style={{ marginBottom: 8, fontFamily: 'var(--font-body)', fontSize: '11px', color: '#999' }}>
                    Header/Footer aceitam {'{date}'} como variavel.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <input
                      className="cyber-input"
                      style={{ padding: '8px 10px', fontSize: '12px' }}
                      placeholder="Header custom (opcional)"
                      value={headerTemplate}
                      onChange={(e) => setHeaderTemplate(e.target.value)}
                    />
                    <input
                      className="cyber-input"
                      style={{ padding: '8px 10px', fontSize: '12px' }}
                      placeholder="Footer custom (opcional)"
                      value={footerTemplate}
                      onChange={(e) => setFooterTemplate(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#888', display: 'block', marginBottom: 6 }}>
                      Data (chip variavel editavel)
                    </label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--neon-cyan)', borderRadius: '999px', background: 'rgba(0,243,255,0.08)' }}>
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '11px' }}>{'{date}'}</span>
                      <input
                        className="cyber-input"
                        style={{ padding: '4px 8px', fontSize: '11px', minWidth: 280 }}
                        value={dateVariable}
                        onChange={(e) => setDateVariable(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#888', display: 'block', marginBottom: 6 }}>
                      Colunas em chips (arraste para mudar ordem, double-click para ocultar/exibir)
                    </label>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChipDragEnd}>
                      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {orderedColumns.map((col) => (
                            <SortableColumnChip
                              key={col.id}
                              column={col}
                              enabled={enabledColumns.includes(col.id)}
                              onToggle={toggleColumn}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              )}

              <pre
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--neon-cyan)',
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
