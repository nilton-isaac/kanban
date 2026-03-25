import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'

const STATUS_ICONS = {
  todo:     { icon: '○', color: '#555' },
  progress: { icon: '◐', color: 'var(--neon-cyan)' },
  review:   { icon: '◑', color: 'var(--neon-yellow)' },
  blocked:  { icon: '✕', color: 'var(--neon-pink)' },
  done:     { icon: '●', color: 'var(--neon-green)' },
}

const PRIORITY_DOTS = {
  low:      { color: 'var(--neon-green)',  label: 'Baixa' },
  medium:   { color: 'var(--neon-yellow)', label: 'Média' },
  high:     { color: 'var(--neon-orange)', label: 'Alta' },
  critical: { color: 'var(--neon-pink)',   label: 'Crítica' },
}

export default function Card({ card, onEdit, onDelete, onInlineEdit, onArchive }) {
  const [hovered, setHovered] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(card.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const saveTitle = () => {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== card.title) onInlineEdit(card.id, trimmed)
    else setDraftTitle(card.title)
    setIsEditingTitle(false)
  }

  const status = STATUS_ICONS[card.status] || STATUS_ICONS.todo
  const priority = PRIORITY_DOTS[card.priority] || PRIORITY_DOTS.medium

  const tasks = card.tasks || []
  const doneTasks = tasks.filter(t => t.done).length
  const taskProgress = tasks.length > 0 ? doneTasks / tasks.length : null

  const banner = card.banner || (card.images && card.images[0]?.src) || null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cyber-card select-none${isDragging ? ' dragging' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Banner image */}
      {banner && (
        <div
          style={{
            width: 'calc(100% + 0px)',
            height: '110px',
            marginBottom: '8px',
            overflow: 'hidden',
            borderBottom: '1px solid var(--panel-border)',
            position: 'relative',
          }}
        >
          <img
            src={banner}
            alt="banner"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Gradient overlay at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
            background: 'linear-gradient(to top, var(--panel-bg), transparent)',
          }} />
        </div>
      )}

      {/* Top row: meta + drag handle + actions */}
      <div
        className="flex justify-between items-center mb-1.5 px-3"
        style={{ paddingTop: banner ? 0 : '12px' }}
      >
        {/* Status + Priority */}
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'monospace' }}>
            #{card.id.slice(-4)}
          </span>
          <span title={card.status} style={{ color: status.color, fontSize: '12px', lineHeight: 1 }}>
            {status.icon}
          </span>
          <span
            title={priority.label}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: priority.color,
              display: 'inline-block',
              boxShadow: `0 0 5px ${priority.color}`,
            }}
          />
          {card.urgent && (
            <span style={{ fontSize: '9px', color: 'var(--neon-pink)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>URG</span>
          )}
        </div>

        {/* Action buttons (visible on hover) + Drag handle */}
        <div className="flex items-center gap-1">
          <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', display: 'flex', gap: 2 }}>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              style={actionBtnStyle('var(--neon-cyan)')}
              title="Editar"
            >✎</button>
            {onArchive && (
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onArchive() }}
                style={actionBtnStyle('var(--neon-yellow)')}
                title="Arquivar tarefa"
              >⊙</button>
            )}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={actionBtnStyle('var(--neon-pink)')}
              title="Deletar"
            >✕</button>
          </div>
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            title="Arrastar"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              color: hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontSize: '16px',
              padding: '2px 4px',
              lineHeight: 1,
              userSelect: 'none',
              transition: 'color 0.15s',
            }}
          >⠿</div>
        </div>
      </div>

      {/* Title — click to open modal, double-click to edit inline */}
      <div className="px-3 mb-1">
        {isEditingTitle ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') { setDraftTitle(card.title); setIsEditingTitle(false) }
            }}
            onPointerDown={e => e.stopPropagation()}
            className="cyber-input w-full p-1 rounded-sm text-sm font-bold"
            style={{ fontFamily: 'inherit', fontSize: '13px' }}
          />
        ) : (
          <h4
            onClick={() => onEdit()}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setDraftTitle(card.title)
              setIsEditingTitle(true)
            }}
            className="font-bold leading-tight cursor-pointer transition-colors"
            style={{ fontSize: '13px', color: 'var(--text-primary)' }}
            title="Click para abrir · Double-click para editar nome"
          >
            {card.title}
          </h4>
        )}
      </div>

      {/* Description */}
      {card.description && (
        <p
          className="px-3 text-xs font-mono mb-2 leading-relaxed"
          style={{
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {card.description}
        </p>
      )}

      {/* Task progress bar */}
      {tasks.length > 0 && (
        <div className="px-3 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              TASKS
            </span>
            <span style={{ fontSize: '10px', color: taskProgress === 1 ? 'var(--neon-green)' : 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {doneTasks}/{tasks.length}
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--line-soft)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(doneTasks / tasks.length) * 100}%`,
                background: taskProgress === 1 ? 'var(--neon-green)' : 'var(--neon-cyan)',
                boxShadow: `0 0 6px ${taskProgress === 1 ? 'var(--neon-green)' : 'var(--neon-cyan)'}`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="px-3 flex flex-wrap gap-1 mb-2">
          {card.tags.map(tag => (
            <span
              key={tag.id}
              className={`tag-${tag.color} rounded font-mono`}
              style={{ fontSize: '10px', padding: '1px 6px' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-3 pb-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--line-soft)', paddingTop: '8px' }}
      >
        {/* Assignees */}
        <div className="flex items-center gap-1">
          {card.assignees && card.assignees.slice(0, 3).map(a => (
            <div
              key={a.id}
              title={a.name}
              className="flex items-center justify-center rounded-full text-black font-bold"
              style={{
                width: 22, height: 22, fontSize: '9px',
                background: `var(--neon-${a.color || 'cyan'})`,
                border: '1px solid rgba(0,0,0,0.3)',
                flexShrink: 0,
              }}
            >
              {a.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {card.assignees && card.assignees.length > 3 && (
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>+{card.assignees.length - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {card.dueDate && (
            <span style={{
              fontSize: '10px', fontFamily: 'monospace',
              color: isOverdue(card.dueDate) ? 'var(--neon-pink)' : 'var(--text-secondary)',
            }}>
              {formatDate(card.dueDate)}
            </span>
          )}
          {card.images && card.images.length > 0 && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              🖼 {card.images.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function actionBtnStyle(color) {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    color, fontSize: '14px', lineHeight: 1, padding: '2px 3px',
  }
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
