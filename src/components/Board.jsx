import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { useState } from 'react'
import Column from './Column'
import CardPreview from './CardPreview'

export default function Board({
  columns,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onMoveCard,
  onReorderColumn,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onInlineEdit,
}) {
  const [activeCard, setActiveCard] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragStart = ({ active }) => {
    const card = cards.find(c => c.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null)
    if (!over || active.id === over.id) return

    const draggedCard = cards.find(c => c.id === active.id)
    if (!draggedCard) return

    // Dropped onto a column (empty area)
    const targetColumn = columns.find(col => col.id === over.id)
    if (targetColumn) {
      if (draggedCard.columnId !== targetColumn.id) {
        const colCards = cards.filter(c => c.columnId === targetColumn.id)
        onMoveCard(active.id, targetColumn.id, colCards.length)
      }
      return
    }

    // Dropped onto another card
    const overCard = cards.find(c => c.id === over.id)
    if (!overCard) return

    if (draggedCard.columnId === overCard.columnId) {
      onReorderColumn(draggedCard.columnId, active.id, over.id)
    } else {
      const colCards = cards.filter(c => c.columnId === overCard.columnId)
      const idx = colCards.findIndex(c => c.id === over.id)
      onMoveCard(active.id, overCard.columnId, idx)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCard(null)}
    >
      <main className="flex-1 overflow-x-auto p-6" style={{ minHeight: 0 }}>
        <div className="flex gap-5 pb-4" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
          {columns.map((col) => {
            const colCards = cards.filter(c => c.columnId === col.id)
            return (
              <Column
                key={col.id}
                column={col}
                cards={colCards}
                onAddCard={() => onAddCard(col.id)}
                onEditCard={onEditCard}
                onDeleteCard={onDeleteCard}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
                onInlineEdit={onInlineEdit}
              />
            )
          })}

          {/* Add Column button */}
          <button
            onClick={onAddColumn}
            className="cyber-btn flex flex-col items-center justify-center gap-2 flex-shrink-0"
            style={{
              width: '60px', minHeight: '120px', fontSize: '22px',
              clipPath: 'none', borderStyle: 'dashed',
            }}
            title="Adicionar coluna"
          >
            <span>+</span>
            <span style={{ fontSize: '8px', fontFamily: 'Orbitron', letterSpacing: '1px', writingMode: 'vertical-rl' }}>COLUNA</span>
          </button>
        </div>
      </main>

      <DragOverlay>
        {activeCard ? <CardPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
