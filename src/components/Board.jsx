import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import CardPreview from './CardPreview'
import Column from './Column'

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
        opacity: isDragging ? 0.55 : 1,
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
  onArchiveCard,
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

  const columnIds = useMemo(() => columns.map((column) => columnSortableId(column.id)), [columns])

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

    const card = cards.find((item) => item.id === active.id)
    setActiveCard(card || null)
    setActiveColumnId(null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null)
    setActiveColumnId(null)
    if (!over || active.id === over.id) return

    const activeColumn = parseColumnSortableId(active.id)
    const overColumn = parseColumnSortableId(over.id)

    if (activeColumn) {
      if (overColumn && activeColumn !== overColumn) {
        onReorderColumns(activeColumn, overColumn)
      }
      return
    }

    const draggedCard = cards.find((item) => item.id === active.id)
    if (!draggedCard) return

    const targetColumnId = overColumn || columns.find((column) => column.id === over.id)?.id || null
    if (targetColumnId) {
      if (draggedCard.columnId !== targetColumnId) {
        const columnCards = cards.filter((item) => item.columnId === targetColumnId)
        onMoveCard(active.id, targetColumnId, columnCards.length)
      }
      return
    }

    const overCard = cards.find((item) => item.id === over.id)
    if (!overCard) return

    if (draggedCard.columnId === overCard.columnId) {
      onReorderColumn(draggedCard.columnId, active.id, over.id)
    } else {
      const columnCards = cards.filter((item) => item.columnId === overCard.columnId)
      const nextIndex = columnCards.findIndex((item) => item.id === over.id)
      onMoveCard(active.id, overCard.columnId, nextIndex)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveCard(null)
        setActiveColumnId(null)
      }}
    >
      <main className="workspace-stage workspace-stage--board" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <div className="workspace-summary">
          <div>
            <span className="workspace-summary__eyebrow">Whiteboard flow</span>
            <h2 className="workspace-summary__title">Organize delivery in a calm split-view canvas.</h2>
          </div>

          <div className="workspace-summary__meta">
            <span>{columns.length} colunas</span>
            <span>{cards.filter((card) => !card.archived).length} cards ativos</span>
          </div>
        </div>

        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <div className="workspace-board-row">
            {columns.map((column) => {
              const columnCards = cards.filter((card) => card.columnId === column.id && !card.archived)
              return (
                <SortableColumnItem key={column.id} column={column}>
                  {(dragHandleProps) => (
                    <Column
                      column={column}
                      cards={columnCards}
                      onAddCard={() => onAddCard(column.id)}
                      onEditCard={onEditCard}
                      onDeleteCard={onDeleteCard}
                      onArchiveCard={onArchiveCard}
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

            <button type="button" onClick={onAddColumn} className="workspace-add-column">
              <Plus size={18} />
              <span>Nova coluna</span>
            </button>
          </div>
        </SortableContext>
      </main>

      <DragOverlay>{activeCard ? <CardPreview card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  )
}
