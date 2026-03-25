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
import { useMemo, useState } from 'react'
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

function buildQuadrants() {

  return [
    {
      id: 'q1',
      urgent: true,
      important: true,
      label: 'FAZER AGORA',
      color: 'var(--neon-pink)',
      bg: 'color-mix(in srgb, var(--neon-pink) 8%, transparent)',
      border: 'color-mix(in srgb, var(--neon-pink) 36%, transparent)',
      num: 'I',
      icon: Zap,
      hint: 'Crises, deadlines, problemas crÃ­ticos',
    },
    {
      id: 'q2',
      urgent: false,
      important: true,
      label: 'AGENDAR',
      color: 'var(--neon-cyan)',
      bg: 'color-mix(in srgb, var(--neon-cyan) 8%, transparent)',
      border: 'color-mix(in srgb, var(--neon-cyan) 36%, transparent)',
      num: 'II',
      icon: CalendarDays,
      hint: 'Planejamento, desenvolvimento, estratÃ©gia',
    },
    {
      id: 'q3',
      urgent: true,
      important: false,
      label: 'DELEGAR',
      color: 'var(--neon-yellow)',
      bg: 'color-mix(in srgb, var(--neon-yellow) 10%, transparent)',
      border: 'color-mix(in srgb, var(--neon-yellow) 36%, transparent)',
      num: 'III',
      icon: Users,
      hint: 'InterrupÃ§Ãµes, reuniÃµes desnecessÃ¡rias',
    },
    {
      id: 'q4',
      urgent: false,
      important: false,
      label: 'ELIMINAR',
      color: 'var(--text-muted)',
      bg: 'var(--surface-soft)',
      border: 'var(--line-strong)',
      num: 'IV',
      icon: Trash2,
      hint: 'DistraÃ§Ãµes, tarefas sem valor',
    },
  ]
}

function getQuadrant(card, quadrants) {
  return quadrants.find(q => q.urgent === !!card.urgent && q.important === !!card.important) || quadrants[3]
}

export default function EisenhowerMatrix({ cards, onEditCard, onDeleteCard, onUpdateCard, onInlineEdit }) {
  const quadrants = useMemo(() => buildQuadrants(), [])
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

    const targetQuadrant = quadrants.find(q => q.id === over.id)
    if (targetQuadrant) {
      onUpdateCard(active.id, { urgent: targetQuadrant.urgent, important: targetQuadrant.important })
      return
    }

    const overCard = cards.find(c => c.id === over.id)
    if (overCard && overCard.id !== active.id) {
      const targetQ = getQuadrant(overCard, quadrants)
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
      <div className="workspace-stage workspace-stage--board" style={{ overflowY: 'auto', minHeight: 0 }}>
        <div className="flex items-center gap-4 mb-5">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.04em', margin: 0 }}>
            Matriz de Eisenhower
          </h2>
          <div className="flex gap-3">
            {[
              { label: 'Urgente ->', color: 'var(--neon-pink)' },
              { label: 'Importante ^', color: 'var(--brand-cyan)' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: '11px', fontFamily: 'var(--font-body)', color }}>{label}</span>
            ))}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
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
          {quadrants.map(quadrant => (
            <Quadrant
              key={quadrant.id}
              quadrant={quadrant}
              cards={cards.filter(c => getQuadrant(c, quadrants).id === quadrant.id)}
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
        background: isOver ? quadrant.bg : 'var(--surface-elevated)',
        border: `1px solid ${isOver ? quadrant.border : 'var(--panel-border)'}`,
        borderTop: `3px solid ${quadrant.color}`,
        transition: 'all 0.2s',
        boxShadow: isOver ? `0 0 20px color-mix(in srgb, ${quadrant.color} 28%, transparent)` : 'var(--shadow-md)',
        minHeight: '280px',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${quadrant.color}33` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 900,
                color: quadrant.color,
                opacity: 0.65,
              }}
            >
              {quadrant.num}
            </span>
            <QuadrantIcon size={16} color={quadrant.color} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', color: quadrant.color, letterSpacing: '2px' }}>
              {quadrant.label}
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-body)',
               background: `color-mix(in srgb, ${quadrant.color} 12%, transparent)`,
               color: quadrant.color,
               border: `1px solid color-mix(in srgb, ${quadrant.color} 28%, transparent)`,
               padding: '4px 10px',
               borderRadius: '999px',
            }}
          >
            {cards.length}
          </span>
        </div>
        <p style={{ fontSize: '10px', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', marginTop: 4 }}>
          {quadrant.hint}
        </p>
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
              border: `1px dashed ${quadrant.color}33`,
               borderRadius: 18,
              minHeight: '80px',
              color: 'var(--text-muted)',
              fontSize: '11px',
              fontFamily: 'var(--font-body)',
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
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>#{card.id.slice(-4)}</span>
            {card.status === 'done' && <CheckCircle2 size={12} color="var(--neon-green)" />}
            {card.status === 'blocked' && <OctagonAlert size={12} color="var(--neon-pink)" />}
            {card.status === 'todo' && <Circle size={11} color="var(--text-muted)" />}
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
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-secondary)', padding: '0 2px', display: 'inline-flex' }}>
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
              background: 'var(--field-bg)',
              border: `1px solid ${quadrantColor}`,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
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
              color: 'var(--text-primary)',
              cursor: 'pointer',
              lineHeight: '1.3',
              marginBottom: 4,
            }}
            title="Clique para abrir | Duplo-clique para editar nome"
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
            <div style={{ height: 2, background: 'var(--line-soft)', borderRadius: 1, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(doneTasks / tasks.length) * 100}%`,
                  background: doneTasks === tasks.length ? 'var(--neon-green)' : quadrantColor,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
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
        background: 'var(--surface-contrast)',
        border: '2px dashed var(--panel-border-strong)',
        clipPath: 'none',
        boxShadow: 'var(--shadow-lg)',
        transform: 'rotate(1.5deg)',
        pointerEvents: 'none',
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
        {card.title}
      </p>
    </div>
  )
}
