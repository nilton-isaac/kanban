import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  GripVertical,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Trash2,
} from 'lucide-react'

const STATUS_META = {
  todo: { label: 'A fazer', icon: Circle, color: 'var(--text-muted)' },
  progress: { label: 'Em andamento', icon: LoaderCircle, color: 'var(--brand-cyan)' },
  review: { label: 'Em revisao', icon: Clock3, color: 'var(--neon-yellow)' },
  blocked: { label: 'Bloqueado', icon: AlertTriangle, color: 'var(--neon-pink)' },
  done: { label: 'Concluido', icon: CheckCircle2, color: 'var(--neon-green)' },
}

const PRIORITY_META = {
  low: { color: 'var(--neon-green)', label: 'Baixa' },
  medium: { color: 'var(--neon-yellow)', label: 'Media' },
  high: { color: 'var(--neon-orange)', label: 'Alta' },
  critical: { color: 'var(--neon-pink)', label: 'Critica' },
}

export default function Card({ card, onEdit, onDelete, onInlineEdit, onArchive }) {
  const [hovered, setHovered] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(card.title)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const status = STATUS_META[card.status] || STATUS_META.todo
  const StatusIcon = status.icon
  const priority = PRIORITY_META[card.priority] || PRIORITY_META.medium

  const tasks = card.tasks || []
  const doneTasks = tasks.filter((task) => task.done).length
  const taskProgress = tasks.length > 0 ? doneTasks / tasks.length : null
  const banner = card.banner || (card.images && card.images[0]?.src) || null

  const saveTitle = () => {
    const trimmed = draftTitle.trim()

    if (trimmed && trimmed !== card.title) {
      onInlineEdit(card.id, trimmed)
    } else {
      setDraftTitle(card.title)
    }

    setIsEditingTitle(false)
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`cyber-card${isDragging ? ' dragging' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {banner ? (
        <div className="workspace-card-banner">
          <img src={banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="workspace-card-banner__fade" />
        </div>
      ) : null}

      <div style={{ padding: '14px 16px 16px', display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="workspace-card-chip">#{card.id.slice(-4)}</span>

            <span
              className="workspace-card-chip"
              style={{
                color: status.color,
                borderColor: `color-mix(in srgb, ${status.color} 24%, transparent)`,
                background: `color-mix(in srgb, ${status.color} 10%, transparent)`,
              }}
              title={status.label}
            >
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              title={priority.label}
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: priority.color,
                boxShadow: `0 0 18px color-mix(in srgb, ${priority.color} 32%, transparent)`,
              }}
            />

            <div
              style={{
                opacity: hovered ? 1 : 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'opacity 0.18s ease',
              }}
            >
              <button type="button" onClick={onEdit} style={actionBtnStyle} aria-label="Editar card">
                <Pencil size={14} />
              </button>

              {onArchive ? (
                <button type="button" onClick={onArchive} style={actionBtnStyle} aria-label="Arquivar card">
                  <Archive size={14} />
                </button>
              ) : null}

              <button type="button" onClick={onDelete} style={actionBtnStyle} aria-label="Excluir card">
                <Trash2 size={14} />
              </button>
            </div>

            <button
              type="button"
              {...attributes}
              {...listeners}
              style={{
                ...actionBtnStyle,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              aria-label="Arrastar card"
            >
              <GripVertical size={14} />
            </button>
          </div>
        </div>

        <div>
          {isEditingTitle ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={saveTitle}
              onKeyDown={(event) => {
                if (event.key === 'Enter') saveTitle()
                if (event.key === 'Escape') {
                  setDraftTitle(card.title)
                  setIsEditingTitle(false)
                }
              }}
              className="cyber-input"
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
            />
          ) : (
            <h3
              onClick={onEdit}
              onDoubleClick={() => {
                setDraftTitle(card.title)
                setIsEditingTitle(true)
              }}
              style={{
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.25,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
              }}
              title="Clique para abrir. Duplo clique para editar o titulo."
            >
              {card.title}
            </h3>
          )}

          {card.description ? (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: '12px',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {card.description}
            </p>
          ) : null}
        </div>

        {taskProgress !== null ? (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              <span>Checklist</span>
              <span>{doneTasks}/{tasks.length}</span>
            </div>

            <div className="workspace-progress-track">
              <span
                className="workspace-progress-fill"
                style={{
                  width: `${taskProgress * 100}%`,
                  background: taskProgress === 1 ? 'var(--neon-green)' : 'linear-gradient(90deg, var(--brand-cyan), var(--brand-violet))',
                }}
              />
            </div>
          </div>
        ) : null}

        {card.tags && card.tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {card.tags.map((tag) => (
              <span key={tag.id} className={`tag-${tag.color}`} style={{ fontSize: '10px', padding: '4px 9px' }}>
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {card.assignees && card.assignees.length > 0
              ? card.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    title={assignee.name}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: `var(--neon-${assignee.color || 'cyan'})`,
                      color: '#06111d',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                ))
              : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-body)' }}>
            {card.dueDate ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: isOverdue(card.dueDate) ? 'var(--neon-pink)' : 'var(--text-secondary)' }}>
                <CalendarDays size={13} />
                {formatDate(card.dueDate)}
              </span>
            ) : null}

            {card.images && card.images.length > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ImageIcon size={13} />
                {card.images.length}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

const actionBtnStyle = {
  background: 'transparent',
  border: '1px solid var(--line-soft)',
  borderRadius: 999,
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

function isOverdue(dateString) {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
