import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import Column from './Column'
import CardPreview from './CardPreview'

const COLUMN_PREFIX = 'column:'

function columnSortableId(columnId) {
  return `${COLUMN_PREFIX}${columnId}`
}

function parseColumnSortableId(sortableId) {
  return String(sortableId).startsWith(COLUMN_PREFIX)
    ? String(sortableId).slice(COLUMN_PREFIX.length)
    : null
}

function SortableColumnItem({ column, children }) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({
    id: columnSortableId(column.id),
    data: { type: 'column', columnId: column.id },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

export default function Board({
  columns,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onMoveCard,
  onReorderColumn,
  onReorderColumns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onClearColumn,
  onInlineEdit,
}) {
  const [activeCard, setActiveCard] = useState(null)
  const [activeColumnId, setActiveColumnId] = useState(null)

  const columnIds = useMemo(() => columns.map((c) => columnSortableId(c.id)), [columns])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  )

  const handleDragStart = ({ active }) => {
    const asColumnId = parseColumnSortableId(active.id)
    if (asColumnId) {
      setActiveColumnId(asColumnId)
      setActiveCard(null)
      return
    }

    const card = cards.find((c) => c.id === active.id)
    setActiveCard(card || null)
    setActiveColumnId(null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null)
    setActiveColumnId(null)
    if (!over || active.id === over.id) return

    const activeColumnId = parseColumnSortableId(active.id)
    const overColumnSortableId = parseColumnSortableId(over.id)
    if (activeColumnId) {
      if (overColumnSortableId && activeColumnId !== overColumnSortableId) {
        onReorderColumns(activeColumnId, overColumnSortableId)
      }
      return
    }

    const draggedCard = cards.find((c) => c.id === active.id)
    if (!draggedCard) return

    const overColumnId = overColumnSortableId || columns.find((col) => col.id === over.id)?.id || null
    if (overColumnId) {
      if (draggedCard.columnId !== overColumnId) {
        const colCards = cards.filter((c) => c.columnId === overColumnId)
        onMoveCard(active.id, overColumnId, colCards.length)
      }
      return
    }

    const overCard = cards.find((c) => c.id === over.id)
    if (!overCard) return

    if (draggedCard.columnId === overCard.columnId) {
      onReorderColumn(draggedCard.columnId, active.id, over.id)
    } else {
      const colCards = cards.filter((c) => c.columnId === overCard.columnId)
      const idx = colCards.findIndex((c) => c.id === over.id)
      onMoveCard(active.id, overCard.columnId, idx)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveCard(null); setActiveColumnId(null) }}
    >
      <main className="flex-1 overflow-x-auto p-6" style={{ minHeight: 0 }}>
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-5 pb-4" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
            {columns.map((col) => {
              const colCards = cards.filter((c) => c.columnId === col.id)
              return (
                <SortableColumnItem key={col.id} column={col}>
                  {(dragHandleProps) => (
                    <Column
                      column={col}
                      cards={colCards}
                      onAddCard={() => onAddCard(col.id)}
                      onEditCard={onEditCard}
                      onDeleteCard={onDeleteCard}
                      onUpdateColumn={onUpdateColumn}
                      onDeleteColumn={onDeleteColumn}
                      onClearColumn={onClearColumn}
                      onInlineEdit={onInlineEdit}
                      dragHandleProps={dragHandleProps}
                    />
                  )}
                </SortableColumnItem>
              )
            })}

            <button
              onClick={onAddColumn}
              className="cyber-btn flex flex-col items-center justify-center gap-2 flex-shrink-0"
              style={{
                width: '60px',
                minHeight: '120px',
                fontSize: '22px',
                clipPath: 'none',
                borderStyle: 'dashed',
              }}
              title="Adicionar coluna"
            >
              <span>+</span>
              <span style={{ fontSize: '8px', fontFamily: 'var(--font-heading)', letterSpacing: '1px', writingMode: 'vertical-rl' }}>
                COLUNA
              </span>
            </button>
          </div>
        </SortableContext>
      </main>

      <DragOverlay>
        {activeCard ? <CardPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
