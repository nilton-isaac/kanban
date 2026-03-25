import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GripVertical, MoreHorizontal, Paintbrush, Plus, Trash2, Wand2 } from 'lucide-react'
import Card from './Card'

const COLOR_MAP = {
  pink: { border: 'var(--neon-pink)', bg: 'color-mix(in srgb, var(--neon-pink) 8%, transparent)' },
  cyan: { border: 'var(--neon-cyan)', bg: 'color-mix(in srgb, var(--neon-cyan) 8%, transparent)' },
  yellow: { border: 'var(--neon-yellow)', bg: 'color-mix(in srgb, var(--neon-yellow) 10%, transparent)' },
  green: { border: 'var(--neon-green)', bg: 'color-mix(in srgb, var(--neon-green) 8%, transparent)' },
  orange: { border: 'var(--neon-orange)', bg: 'color-mix(in srgb, var(--neon-orange) 10%, transparent)' },
  purple: { border: 'var(--neon-purple)', bg: 'color-mix(in srgb, var(--neon-purple) 10%, transparent)' },
}

const COLUMN_COLORS = ['pink', 'cyan', 'yellow', 'green', 'orange', 'purple']

export default function Column({
  column,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onArchiveCard,
  onUpdateColumn,
  onDeleteColumn,
  onClearColumn,
  onInlineEdit,
  dragHandleProps,
}) {
  const colors = COLOR_MAP[column.color] || COLOR_MAP.cyan
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const saveTitle = () => {
    if (editTitle.trim()) {
      onUpdateColumn(column.id, { title: editTitle.trim().toUpperCase() })
    }
    setEditing(false)
  }

  return (
    <section
      className="kanban-column"
      style={{
        width: 316,
        maxHeight: 'calc(100vh - 250px)',
        borderTopColor: colors.border,
        background: 'color-mix(in srgb, var(--doc-surface) 88%, transparent)',
        boxShadow: isOver ? `0 18px 46px color-mix(in srgb, ${colors.border} 18%, transparent)` : 'var(--shadow-md)',
        transition: 'box-shadow 0.22s ease, transform 0.22s ease',
      }}
    >
      <div
        style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid var(--line-soft)',
          background: colors.bg,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
            <button
              type="button"
              title="Arrastar coluna"
              {...dragHandleProps}
              style={{
                marginTop: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'grab',
                padding: 0,
                display: 'inline-flex',
              }}
            >
              <GripVertical size={16} />
            </button>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {column.index}
                </span>

                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.border,
                    boxShadow: `0 0 18px color-mix(in srgb, ${colors.border} 32%, transparent)`,
                  }}
                />
              </div>

              {editing ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveTitle()
                    if (event.key === 'Escape') setEditing(false)
                  }}
                  className="cyber-input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
                />
              ) : (
                <>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      letterSpacing: '-0.04em',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {column.title}
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {cards.length} {cards.length === 1 ? 'card em foco' : 'cards em foco'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                minWidth: 34,
                padding: '7px 10px',
                borderRadius: 999,
                border: `1px solid color-mix(in srgb, ${colors.border} 22%, transparent)`,
                background: 'color-mix(in srgb, var(--surface-raised) 82%, transparent)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                fontSize: '11px',
                fontFamily: 'var(--font-body)',
              }}
            >
              {cards.length}
            </span>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 140)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                }}
                aria-label="Abrir menu da coluna"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 220,
                    padding: 10,
                    borderRadius: 18,
                    border: '1px solid var(--panel-border)',
                    background: 'color-mix(in srgb, var(--panel-bg-strong) 92%, transparent)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 90,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitle(column.title)
                      setEditing(true)
                      setMenuOpen(false)
                    }}
                    style={menuItemStyle}
                  >
                    <Wand2 size={14} />
                    Renomear
                  </button>

                  <div style={{ margin: '8px 0 6px', padding: '0 6px', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                    Cor da coluna
                  </div>

                  <div style={{ display: 'grid', gap: 6 }}>
                    {COLUMN_COLORS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          onUpdateColumn(column.id, { color: item })
                          setMenuOpen(false)
                        }}
                        style={menuItemStyle}
                      >
                        <Paintbrush size={14} />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: `var(--neon-${item})`, display: 'inline-block' }} />
                        {item}
                      </button>
                    ))}
                  </div>

                  <div style={{ height: 1, margin: '10px 0', background: 'var(--line-soft)' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setConfirmClear(true)
                    }}
                    style={{ ...menuItemStyle, color: 'var(--neon-yellow)' }}
                  >
                    <Trash2 size={14} />
                    Limpar cards
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setConfirmDelete(true)
                    }}
                    style={{ ...menuItemStyle, color: 'var(--neon-pink)' }}
                  >
                    <Trash2 size={14} />
                    Excluir coluna
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {confirmClear ? (
        <div className="workspace-inline-alert">
          <span>Limpar {cards.length} cards e manter a coluna?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="workspace-inline-alert__ok" onClick={() => { onClearColumn(column.id); setConfirmClear(false) }}>
              Sim
            </button>
            <button type="button" className="workspace-inline-alert__cancel" onClick={() => setConfirmClear(false)}>
              Nao
            </button>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="workspace-inline-alert is-danger">
          <span>Excluir a coluna permanentemente?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="workspace-inline-alert__danger" onClick={() => onDeleteColumn(column.id)}>
              Excluir
            </button>
            <button type="button" className="workspace-inline-alert__cancel" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'grid',
          gap: 12,
          minHeight: 110,
          background: isOver ? 'color-mix(in srgb, var(--brand-cyan) 6%, transparent)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
      >
        <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
              onArchive={onArchiveCard ? () => onArchiveCard(card.id) : undefined}
              onInlineEdit={onInlineEdit}
            />
          ))}
        </SortableContext>

        {cards.length === 0 ? (
          <div className="workspace-empty-drop">
            <span>Arraste cards aqui ou crie uma nova tarefa.</span>
          </div>
        ) : null}
      </div>

      <div style={{ padding: '14px', borderTop: '1px solid var(--line-soft)' }}>
        <button type="button" onClick={onAddCard} className="cyber-btn" style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={16} /> Nova tarefa
        </button>
      </div>
    </section>
  )
}

const menuItemStyle = {
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 14,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
}
