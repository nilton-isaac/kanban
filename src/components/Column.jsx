import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Card from './Card'

const COLOR_MAP = {
  pink:   { border: 'var(--neon-pink)',   text: 'var(--neon-pink)',   bg: 'rgba(255,0,255,0.05)',  badge: 'var(--neon-pink)' },
  cyan:   { border: 'var(--neon-cyan)',   text: 'var(--neon-cyan)',   bg: 'rgba(0,243,255,0.05)',  badge: 'var(--neon-cyan)' },
  yellow: { border: 'var(--neon-yellow)', text: 'var(--neon-yellow)', bg: 'rgba(252,238,10,0.05)', badge: 'var(--neon-yellow)' },
  green:  { border: 'var(--neon-green)',  text: 'var(--neon-green)',  bg: 'rgba(0,255,136,0.05)',  badge: 'var(--neon-green)' },
  orange: { border: 'var(--neon-orange)', text: 'var(--neon-orange)', bg: 'rgba(255,102,0,0.05)',  badge: 'var(--neon-orange)' },
  purple: { border: 'var(--neon-purple)', text: 'var(--neon-purple)', bg: 'rgba(155,0,255,0.05)',  badge: 'var(--neon-purple)' },
}

export default function Column({ column, cards, onAddCard, onEditCard, onDeleteCard, onUpdateColumn, onDeleteColumn, onInlineEdit }) {
  const colors = COLOR_MAP[column.color] || COLOR_MAP.cyan
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const saveTitle = () => {
    if (editTitle.trim()) onUpdateColumn(column.id, { title: editTitle.trim().toUpperCase() })
    setEditing(false)
  }

  return (
    <div
      className="kanban-column flex flex-col rounded-t-lg flex-shrink-0"
      style={{
        width: '300px',
        maxHeight: 'calc(100vh - 230px)',
        borderTopColor: colors.border,
        boxShadow: isOver ? `0 0 20px ${colors.border}40` : undefined,
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div
        className="p-3 flex justify-between items-center flex-shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}55`, background: colors.bg }}
      >
        {editing ? (
          <input
            autoFocus value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false) }}
            className="cyber-input flex-1 p-1 text-sm rounded-sm mr-2"
            style={{ fontFamily: 'Orbitron', fontSize: '13px', color: colors.text }}
          />
        ) : (
          <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onDoubleClick={() => { setEditTitle(column.title); setEditing(true) }}
            title="Double-click para renomear"
          >
            <span className="text-xs font-mono" style={{ color: colors.text, opacity: 0.5 }}>{column.index}.</span>
            <h2 className="font-orbitron font-bold truncate" style={{ color: colors.text, fontSize: '14px' }}>
              {column.title}
            </h2>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs px-1.5 py-0.5 rounded font-bold font-mono"
            style={{ background: colors.badge, color: '#000', minWidth: '20px', textAlign: 'center' }}>
            {cards.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
            >⋮</button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#0d1020', border: '1px solid #333', zIndex: 100, minWidth: '150px' }}>
                <button onClick={() => { setEditTitle(column.title); setEditing(true); setMenuOpen(false) }} style={menuItemStyle}>Renomear</button>
                <div style={{ padding: '4px 12px 2px', fontSize: '10px', color: '#444', fontFamily: 'monospace' }}>COR</div>
                {['pink','cyan','yellow','green','orange','purple'].map(c => (
                  <button key={c} onClick={() => { onUpdateColumn(column.id, { color: c }); setMenuOpen(false) }}
                    style={{ ...menuItemStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: `var(--neon-${c})`, display: 'inline-block' }} />
                    {c}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #1a1a2e', margin: '4px 0' }} />
                <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} style={{ ...menuItemStyle, color: 'var(--neon-pink)' }}>
                  Excluir coluna
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="p-2 flex items-center gap-2 flex-shrink-0"
          style={{ background: 'rgba(255,0,255,0.08)', borderBottom: '1px solid rgba(255,0,255,0.2)' }}>
          <span style={{ fontSize: '11px', color: 'var(--neon-pink)', fontFamily: 'monospace' }}>
            Excluir + {cards.length} cards?
          </span>
          <button onClick={() => onDeleteColumn(column.id)} style={smallBtnStyle('#ff00ff')}>Sim</button>
          <button onClick={() => setConfirmDelete(false)} style={smallBtnStyle('#555')}>Não</button>
        </div>
      )}

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{
          minHeight: '80px',
          background: isOver ? 'rgba(0,243,255,0.02)' : 'transparent',
          transition: 'background 0.2s',
        }}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              columnColor={column.color}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
              onInlineEdit={onInlineEdit}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '24px 0', color: '#2a2a2a',
            border: '1px dashed #1a1a2e', fontSize: '11px', fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.2)',
          }}>
            Sem tarefas
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${colors.border}33` }}>
        <button
          onClick={onAddCard}
          className="cyber-btn w-full py-2 text-xs flex items-center justify-center gap-1"
          style={{ color: colors.text, borderColor: colors.border }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> ADD TASK
        </button>
      </div>
    </div>
  )
}

const menuItemStyle = {
  display: 'block', width: '100%', padding: '7px 12px',
  textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
  color: '#aaa', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px',
}

function smallBtnStyle(color) {
  return {
    padding: '2px 10px', background: 'none', border: `1px solid ${color}`,
    color, cursor: 'pointer', fontSize: '11px', fontFamily: "'Share Tech Mono', monospace", borderRadius: '2px',
  }
}
