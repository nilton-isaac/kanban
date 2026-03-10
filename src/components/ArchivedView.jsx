import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Archive, RotateCcw, ChevronDown, ChevronRight, Eye } from 'lucide-react'

const STATUS_ICONS = {
  todo:     { icon: '○', color: '#555' },
  progress: { icon: '◐', color: 'var(--neon-cyan)' },
  review:   { icon: '◑', color: 'var(--neon-yellow)' },
  blocked:  { icon: '✕', color: 'var(--neon-pink)' },
  done:     { icon: '●', color: 'var(--neon-green)' },
}

const PRIORITY_COLORS = {
  low:      'var(--neon-green)',
  medium:   'var(--neon-yellow)',
  high:     'var(--neon-orange)',
  critical: 'var(--neon-pink)',
}

const STATUS_LABELS = {
  todo: 'A Fazer', progress: 'Em Progresso',
  review: 'Revisão', blocked: 'Bloqueado', done: 'Concluído',
}

const PRIORITY_LABELS = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica',
}

const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getWeekKey(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

function getWeekRange(mondayStr) {
  const monday = new Date(mondayStr + 'T00:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${MONTH_NAMES_PT[d.getMonth()]}`
  return `${fmt(monday)} — ${fmt(sunday)}`
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES_PT[d.getDay()]
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTH_NAMES_PT[d.getMonth()]
  const year = d.getFullYear()
  return { dayName, date: `${day} ${month} ${year}` }
}

function formatArchivedTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function groupCardsByWeekAndDay(cards) {
  const groups = {}
  cards.forEach(card => {
    const dt = card.archivedAt || card.createdAt || new Date().toISOString()
    const dateOnly = dt.split('T')[0]
    const weekKey = getWeekKey(dt)

    if (!groups[weekKey]) groups[weekKey] = {}
    if (!groups[weekKey][dateOnly]) groups[weekKey][dateOnly] = []
    groups[weekKey][dateOnly].push(card)
  })

  // Sort weeks descending
  const sortedWeeks = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  return sortedWeeks.map(weekKey => ({
    weekKey,
    days: Object.keys(groups[weekKey])
      .sort((a, b) => b.localeCompare(a))
      .map(dayKey => ({
        dayKey,
        cards: groups[weekKey][dayKey].sort((a, b) => {
          const ta = a.archivedAt || a.createdAt || ''
          const tb = b.archivedAt || b.createdAt || ''
          return tb.localeCompare(ta)
        }),
      })),
  }))
}

// ── Archived Card Row ────────────────────────────────────────────────────────

function ArchivedCardRow({ card, columns, onUnarchive, onView, theme }) {
  const [hovered, setHovered] = useState(false)
  const status = STATUS_ICONS[card.status] || STATUS_ICONS.todo
  const priorityColor = PRIORITY_COLORS[card.priority] || PRIORITY_COLORS.medium
  const originalColumn = columns.find(c => c.id === card.columnId)
  const isNier = theme === 'nier'
  const time = formatArchivedTime(card.archivedAt)
  const tasksDone = (card.tasks || []).filter(t => t.done).length
  const tasksTotal = (card.tasks || []).length

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderLeft: `2px solid ${status.color}`,
        background: hovered
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(0,0,0,0.15)',
        marginBottom: 4,
        transition: 'background 0.15s',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {/* Time */}
      {time && (
        <span style={{
          fontSize: '10px',
          fontFamily: 'var(--font-body)',
          color: '#444',
          minWidth: 34,
          flexShrink: 0,
        }}>{time}</span>
      )}

      {/* Status icon */}
      <span title={STATUS_LABELS[card.status]} style={{ color: status.color, fontSize: '13px', flexShrink: 0 }}>
        {status.icon}
      </span>

      {/* Priority dot */}
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: priorityColor,
        boxShadow: `0 0 4px ${priorityColor}`,
        flexShrink: 0,
      }} title={PRIORITY_LABELS[card.priority]} />

      {/* Title */}
      <span style={{
        flex: 1,
        fontSize: '13px',
        fontFamily: 'var(--font-body)',
        color: isNier ? '#2f2b27' : '#ccc',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{card.title}</span>

      {/* Tags */}
      {card.tags && card.tags.slice(0, 2).map(tag => (
        <span
          key={tag.id}
          className={`tag-${tag.color}`}
          style={{ fontSize: '9px', padding: '1px 5px', borderRadius: 2, flexShrink: 0 }}
        >{tag.name}</span>
      ))}

      {/* Subtasks */}
      {tasksTotal > 0 && (
        <span style={{ fontSize: '10px', color: tasksDone === tasksTotal ? 'var(--neon-green)' : '#444', fontFamily: 'monospace', flexShrink: 0 }}>
          {tasksDone}/{tasksTotal}
        </span>
      )}

      {/* Original column */}
      {originalColumn && (
        <span style={{
          fontSize: '9px',
          fontFamily: 'var(--font-body)',
          color: `var(--neon-${originalColumn.color || 'cyan'})`,
          border: `1px solid var(--neon-${originalColumn.color || 'cyan'})44`,
          padding: '1px 5px',
          flexShrink: 0,
          letterSpacing: '0.5px',
          opacity: 0.7,
        }}>{originalColumn.title}</span>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 4,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s',
        flexShrink: 0,
      }}>
        <button
          onClick={() => onView(card)}
          style={rowBtnStyle('var(--neon-cyan)')}
          title="Visualizar"
        >
          <Eye size={11} />
        </button>
        <button
          onClick={() => onUnarchive(card.id)}
          style={rowBtnStyle('var(--neon-yellow)')}
          title="Restaurar card ao kanban"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* ID */}
      <span style={{ fontSize: '9px', color: '#2a2a2a', fontFamily: 'monospace', flexShrink: 0 }}>
        #{card.id.slice(-4)}
      </span>
    </div>
  )
}

// ── Week Block ───────────────────────────────────────────────────────────────

function WeekBlock({ weekKey, days, columns, onUnarchive, onView, theme, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const totalCards = days.reduce((s, d) => s + d.cards.length, 0)
  const isNier = theme === 'nier'

  return (
    <div style={{
      marginBottom: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.2)',
    }}>
      {/* Week header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: 'var(--neon-cyan)', flexShrink: 0 }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '11px',
          letterSpacing: '2px',
          color: isNier ? '#2f2b27' : '#aaa',
          flex: 1,
        }}>
          SEMANA DE {getWeekRange(weekKey)}
        </span>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-body)',
          color: 'var(--neon-cyan)',
          background: 'rgba(0,243,255,0.06)',
          border: '1px solid rgba(0,243,255,0.15)',
          padding: '1px 8px',
          flexShrink: 0,
        }}>
          {totalCards} {totalCards === 1 ? 'tarefa' : 'tarefas'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '12px 0' }}>
          {days.map(({ dayKey, cards }) => {
            const { dayName, date } = formatDayHeader(dayKey)
            return (
              <div key={dayKey} style={{ marginBottom: 12 }}>
                {/* Day header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '4px 16px 6px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '11px',
                    color: 'var(--neon-yellow)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}>{dayName}</span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    color: '#444',
                    letterSpacing: '0.5px',
                  }}>{date}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ paddingLeft: 0 }}>
                  {cards.map(card => (
                    <ArchivedCardRow
                      key={card.id}
                      card={card}
                      columns={columns}
                      onUnarchive={onUnarchive}
                      onView={onView}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main ArchivedView ────────────────────────────────────────────────────────

export default function ArchivedView({ cards, columns, onUnarchive, onView, onClearArchive }) {
  const { theme } = useTheme()
  const isNier = theme === 'nier'
  const [confirmClear, setConfirmClear] = useState(false)

  const archivedCards = cards.filter(c => c.archived)

  const THEME_LABELS = {
    cyberpunk:   { title: 'ARQUIVO DE MISSÕES',    subtitle: '// HISTÓRICO DE OPERAÇÕES CONCLUÍDAS' },
    fallout:     { title: 'REGISTROS DO PIP-BOY',  subtitle: '>_ MISSÕES ARQUIVADAS NO VAULT-TEC' },
    darkest:     { title: 'TOMO DA GUILDA',        subtitle: '* Registros de façanhas passadas *' },
    liquidglass: { title: 'ARQUIVO',               subtitle: 'Histórico de tarefas realizadas' },
    frostpunk:   { title: 'DIÁRIO DA CIDADE',      subtitle: '— Decisões e tarefas do passado —' },
    nier:        { title: 'MEMÓRIAS ARQUIVADAS',   subtitle: 'Registros de missões concluídas' },
    darksouls:   { title: 'CRÔNICAS DO CINZEIRO',  subtitle: '— Relíquias de batalhas passadas —' },
    royale:      { title: 'ARQUIVO REAL',          subtitle: '— Decretos e feitos realizados —' },
  }

  const labels = THEME_LABELS[theme] || THEME_LABELS.cyberpunk

  if (archivedCards.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 40, gap: 16,
      }}>
        <Archive size={48} style={{ color: '#2a2a2a' }} />
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '14px',
          letterSpacing: '3px',
          color: '#333',
          textAlign: 'center',
        }}>
          {labels.title}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: '#2a2a2a',
          textAlign: 'center',
        }}>
          Nenhuma tarefa arquivada ainda.<br />
          Arquive cards do kanban para visualizá-los aqui como agenda.
        </p>
      </div>
    )
  }

  const grouped = groupCardsByWeekAndDay(archivedCards)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(16px, 2.5vw, 24px)',
            color: isNier ? '#2f2b27' : '#fff',
            letterSpacing: '3px',
            textShadow: '0 0 18px var(--neon-cyan)',
            marginBottom: 4,
          }}>
            {labels.title}
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--neon-cyan)',
            letterSpacing: '1.5px',
          }}>
            {labels.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 16,
            padding: '8px 16px',
            border: '1px solid rgba(0,243,255,0.12)',
            background: 'rgba(0,0,0,0.3)',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', color: 'var(--neon-cyan)' }}>
                {archivedCards.length}
              </div>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-body)', color: '#444', letterSpacing: '1px' }}>TAREFAS</div>
            </div>
            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', color: 'var(--neon-yellow)' }}>
                {grouped.length}
              </div>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-body)', color: '#444', letterSpacing: '1px' }}>SEMANAS</div>
            </div>
            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', color: 'var(--neon-green)' }}>
                {archivedCards.filter(c => c.status === 'done').length}
              </div>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-body)', color: '#444', letterSpacing: '1px' }}>CONCLUÍDAS</div>
            </div>
          </div>

          {/* Clear all button */}
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                padding: '7px 12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,50,50,0.25)',
                color: '#663333',
                fontFamily: 'var(--font-heading)',
                fontSize: '10px',
                letterSpacing: '0.5px',
                cursor: 'pointer',
              }}
              title="Limpar todo o arquivo"
            >
              LIMPAR ARQUIVO
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--neon-pink)', fontFamily: 'var(--font-body)' }}>Confirmar?</span>
              <button
                onClick={() => { onClearArchive(); setConfirmClear(false) }}
                style={{ padding: '5px 10px', background: 'rgba(255,0,80,0.15)', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', fontFamily: 'var(--font-heading)', fontSize: '10px', cursor: 'pointer' }}
              >SIM</button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #333', color: '#555', fontFamily: 'var(--font-heading)', fontSize: '10px', cursor: 'pointer' }}
              >NÃO</button>
            </div>
          )}
        </div>
      </div>

      {/* Column legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 14px 4px 52px',
        marginBottom: 8,
        fontSize: '9px',
        fontFamily: 'var(--font-body)',
        color: '#333',
        letterSpacing: '1px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <span style={{ flex: 1 }}>HORA &nbsp;&nbsp; STATUS &nbsp; TAREFA</span>
        <span>TAGS</span>
        <span style={{ marginLeft: 12 }}>SUBTAREFAS</span>
        <span style={{ marginLeft: 12 }}>COLUNA ORIGINAL</span>
        <span style={{ marginLeft: 12, minWidth: 60 }}></span>
      </div>

      {/* Weeks */}
      {grouped.map(({ weekKey, days }, idx) => (
        <WeekBlock
          key={weekKey}
          weekKey={weekKey}
          days={days}
          columns={columns}
          onUnarchive={onUnarchive}
          onView={onView}
          theme={theme}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  )
}

function rowBtnStyle(color) {
  return {
    background: 'none',
    border: `1px solid ${color}44`,
    color,
    cursor: 'pointer',
    padding: '2px 5px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 2,
    transition: 'border-color 0.15s',
  }
}
