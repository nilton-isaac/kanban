import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import {
  Zap,
  CalendarDays,
  Users,
  Trash2,
  CheckCircle2,
  Circle,
  OctagonAlert,
  Pencil,
  GripVertical,
} from 'lucide-react'

const QUADRANTS = [
  {
    id: 'q1',
    urgent: true,
    important: true,
    label: 'FAZER AGORA',
    sub: 'Urgente + Importante',
    color: 'var(--neon-pink)',
    bg: 'rgba(255,0,255,0.05)',
    border: 'rgba(255,0,255,0.5)',
    num: 'I',
    icon: Zap,
    hint: 'Crises, deadlines, problemas criticos',
  },
  {
    id: 'q2',
    urgent: false,
    important: true,
    label: 'AGENDAR',
    sub: 'Nao Urgente + Importante',
    color: 'var(--neon-cyan)',
    bg: 'rgba(0,243,255,0.05)',
    border: 'rgba(0,243,255,0.5)',
    num: 'II',
    icon: CalendarDays,
    hint: 'Planejamento, desenvolvimento, estrategia',
  },
  {
    id: 'q3',
    urgent: true,
    important: false,
    label: 'DELEGAR',
    sub: 'Urgente + Nao Importante',
    color: 'var(--neon-yellow)',
    bg: 'rgba(252,238,10,0.05)',
    border: 'rgba(252,238,10,0.5)',
    num: 'III',
    icon: Users,
    hint: 'Interrupcoes, reunioes desnecessarias',
  },
  {
    id: 'q4',
    urgent: false,
    important: false,
    label: 'ELIMINAR',
    sub: 'Nao Urgente + Nao Importante',
    color: '#444',
    bg: 'rgba(255,255,255,0.02)',
    border: '#333',
    num: 'IV',
    icon: Trash2,
    hint: 'Distracoes, tarefas sem valor',
  },
]

function getQuadrant(card) {
  return QUADRANTS.find(q => q.urgent === !!card.urgent && q.important === !!card.important) || QUADRANTS[3]
}

export default function EisenhowerMatrix({ cards, onEditCard, onDeleteCard, onUpdateCard, onInlineEdit }) {
  const [activeCard, setActiveCard] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragStart = ({ active }) => {
    const card = cards.find(c => c.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null)
    if (!over) return

    const draggedCard = cards.find(c => c.id === active.id)
    if (!draggedCard) return

    const targetQuadrant = QUADRANTS.find(q => q.id === over.id)
    if (targetQuadrant) {
      onUpdateCard(active.id, { urgent: targetQuadrant.urgent, important: targetQuadrant.important })
      return
    }

    const overCard = cards.find(c => c.id === over.id)
    if (overCard && overCard.id !== active.id) {
      const targetQ = getQuadrant(overCard)
      onUpdateCard(active.id, { urgent: targetQ.urgent, important: targetQ.important })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCard(null)}
    >
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', minHeight: 0 }}>
        <div className="flex items-center gap-4 mb-5">
          <h2 style={{ fontFamily: 'Orbitron', fontSize: '14px', color: 'var(--neon-cyan)', letterSpacing: '3px' }}>
            MATRIZ DE EISENHOWER
          </h2>
          <div className="flex gap-3">
            {[
              { label: 'Urgente ->', color: 'var(--neon-pink)' },
              { label: 'Importante ^', color: 'var(--neon-cyan)' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: '11px', fontFamily: 'monospace', color }}>{label}</span>
            ))}
          </div>
          <span style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace', marginLeft: 'auto' }}>
            Arraste cards entre quadrantes para reclassificar
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gap: '16px',
            minHeight: '70vh',
          }}
        >
          {QUADRANTS.map(quadrant => (
            <Quadrant
              key={quadrant.id}
              quadrant={quadrant}
              cards={cards.filter(c => getQuadrant(c).id === quadrant.id)}
              onEditCard={onEditCard}
              onDeleteCard={onDeleteCard}
              onInlineEdit={onInlineEdit}
            />
          ))}
        </div>
      </div>

      <DragOverlay>{activeCard ? <MatrixCardPreview card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  )
}

function Quadrant({ quadrant, cards, onEditCard, onDeleteCard, onInlineEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.id })
  const QuadrantIcon = quadrant.icon

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: isOver ? quadrant.bg : 'rgba(5,5,15,0.6)',
        border: `1px solid ${isOver ? quadrant.border : '#1a1a2e'}`,
        borderTop: `3px solid ${quadrant.color}`,
        transition: 'all 0.2s',
        boxShadow: isOver ? `0 0 20px ${quadrant.color}30` : 'none',
        minHeight: '280px',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${quadrant.color}22` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: 'Orbitron',
                fontSize: '11px',
                fontWeight: 900,
                color: quadrant.color,
                opacity: 0.5,
              }}
            >
              {quadrant.num}
            </span>
            <QuadrantIcon size={16} color={quadrant.color} />
            <span style={{ fontFamily: 'Orbitron', fontSize: '13px', color: quadrant.color, letterSpacing: '2px' }}>
              {quadrant.label}
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              background: quadrant.color + '22',
              color: quadrant.color,
              border: `1px solid ${quadrant.color}55`,
              padding: '1px 8px',
              borderRadius: '2px',
            }}
          >
            {cards.length}
          </span>
        </div>
        <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#444', marginTop: 4 }}>{quadrant.hint}</p>
      </div>

      <div ref={setNodeRef} style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <MatrixCard
              key={card.id}
              card={card}
              quadrantColor={quadrant.color}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
              onInlineEdit={onInlineEdit}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px dashed ${quadrant.color}22`,
              borderRadius: '2px',
              minHeight: '80px',
              color: '#2a2a2a',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            Arraste cards aqui
          </div>
        )}
      </div>
    </div>
  )
}

function MatrixCard({ card, quadrantColor, onEdit, onDelete, onInlineEdit }) {
  const [hovered, setHovered] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(card.title)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const saveTitle = () => {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== card.title) onInlineEdit(card.id, trimmed)
    else setDraftTitle(card.title)
    setIsEditingTitle(false)
  }

  const tasks = card.tasks || []
  const doneTasks = tasks.filter(t => t.done).length
  const banner = card.banner || (card.images && card.images[0]?.src) || null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cyber-card select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {banner && (
        <div style={{ height: '60px', overflow: 'hidden', borderBottom: `1px solid ${quadrantColor}33` }}>
          <img src={banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '9px', color: '#333', fontFamily: 'monospace' }}>#{card.id.slice(-4)}</span>
            {card.status === 'done' && <CheckCircle2 size={12} color="var(--neon-green)" />}
            {card.status === 'blocked' && <OctagonAlert size={12} color="var(--neon-pink)" />}
            {card.status === 'todo' && <Circle size={11} color="#555" />}
          </div>
          <div className="flex items-center gap-1" style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                onEdit()
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon-cyan)', display: 'inline-flex' }}
            >
              <Pencil size={12} />
            </button>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon-pink)', display: 'inline-flex' }}
            >
              <Trash2 size={12} />
            </button>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#555', padding: '0 2px', display: 'inline-flex' }}>
              <GripVertical size={13} />
            </div>
          </div>
        </div>

        {isEditingTitle ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') {
                setDraftTitle(card.title)
                setIsEditingTitle(false)
              }
            }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${quadrantColor}`,
              color: 'var(--neon-cyan)',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '12px',
              padding: '3px 6px',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        ) : (
          <p
            onClick={onEdit}
            onDoubleClick={e => {
              e.stopPropagation()
              setDraftTitle(card.title)
              setIsEditingTitle(true)
            }}
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#ddd',
              cursor: 'pointer',
              lineHeight: '1.3',
              marginBottom: 4,
            }}
            title="Click para abrir | Double-click para editar nome"
          >
            {card.title}
          </p>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {card.tags.slice(0, 3).map(tag => (
              <span key={tag.id} className={`tag-${tag.color}`} style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '2px' }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(doneTasks / tasks.length) * 100}%`,
                  background: doneTasks === tasks.length ? 'var(--neon-green)' : quadrantColor,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace' }}>
              {doneTasks}/{tasks.length} tasks
            </span>
          </div>
        )}

        {card.assignees && card.assignees.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {card.assignees.slice(0, 3).map(a => (
              <div
                key={a.id}
                title={a.name}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: `var(--neon-${a.color || 'cyan'})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: '#000',
                }}
              >
                {a.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MatrixCardPreview({ card }) {
  return (
    <div
      style={{
        width: '200px',
        padding: '10px 12px',
        background: 'rgba(10,15,30,0.98)',
        border: '2px dashed var(--neon-yellow)',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
        boxShadow: '0 0 20px rgba(252,238,10,0.3)',
        transform: 'rotate(1.5deg)',
        pointerEvents: 'none',
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#ddd', fontFamily: 'Orbitron' }}>{card.title}</p>
    </div>
  )
}
