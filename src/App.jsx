import { useState, useEffect, useCallback, useRef } from 'react'
import Board from './components/Board'
import Header from './components/Header'
import EisenhowerMatrix from './components/EisenhowerMatrix'
import ArchivedView from './components/ArchivedView'
import AuthScreen from './components/AuthScreen'
import StandupModal from './components/StandupModal'
import FloatingThemeSelector from './components/FloatingThemeSelector'
import ThemeEffects from './components/ThemeEffects'
import DungeonMode from './components/DungeonMode'
import GamificationHUD from './components/GamificationHUD'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { fetchColumns, fetchCards, upsertColumn, upsertCard, deleteColumn as dbDeleteColumn, deleteCard as dbDeleteCard, saveStandupLog } from './lib/db'
import { applyNextDay, getNextDayImpact } from './lib/standup'
import { loadGameState, saveGameState, awardTaskXp, computeLevel } from './lib/gamification'

const LOCAL_KEY = 'cyberdaily-kanban-v4'
const LOCAL_IMAGES_KEY = 'cyberdaily-images-v1'

const DEFAULT_COLUMNS = []
const DEFAULT_CARDS = []

function loadLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { columns: DEFAULT_COLUMNS, cards: DEFAULT_CARDS }
}

function loadLocalImages() {
  try {
    const raw = localStorage.getItem(LOCAL_IMAGES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveLocalImages(images) {
  try { localStorage.setItem(LOCAL_IMAGES_KEY, JSON.stringify(images)) } catch {}
}

export default function App() {
  const [session, setSession] = useState(undefined)  // undefined = loading
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [localImages, setLocalImages] = useState(loadLocalImages) // { cardId: { banner, images[] } }
  const [viewMode, setViewMode] = useState('kanban')
  const [loadingData, setLoadingData] = useState(false)
  const [syncError, setSyncError] = useState(null)

  // Modals
  const [addCardModal, setAddCardModal] = useState(null)
  const [editCardModal, setEditCardModal] = useState(null)
  const [addColumnModal, setAddColumnModal] = useState(false)
  const [standupOpen, setStandupOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [nextDayConfirm, setNextDayConfirm] = useState(false)
  const [nextDayDone, setNextDayDone] = useState(false)

  // Gamification
  const [gameState, setGameState] = useState(() => loadGameState())
  const [lastXpEvent, setLastXpEvent] = useState(null)

  const syncTimer = useRef(null)
  const isCloud = !!session?.user

  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // â”€â”€ Load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (session === undefined) return

    if (session?.user) {
      // Cloud mode
      setLoadingData(true)
      Promise.all([fetchColumns(session.user.id), fetchCards(session.user.id)])
        .then(([cols, cds]) => {
          setColumns(cols)
          // Merge cloud cards with local images
          const imgs = loadLocalImages()
          setCards(cds.map(c => ({
            ...c,
            banner: imgs[c.id]?.banner || null,
            images: imgs[c.id]?.images || [],
          })))
        })
        .catch(err => setSyncError(err.message))
        .finally(() => setLoadingData(false))
    } else {
      // Offline/guest mode
      const local = loadLocalState()
      setColumns(local.columns)
      setCards(local.cards)
    }
  }, [session])

  // â”€â”€ Persist locally (always) + sync to cloud (debounced) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (columns.length === 0 && cards.length === 0) return
    // Always save to localStorage (fast)
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ columns, cards })) } catch {}
    // Debounced cloud sync
    if (isCloud) {
      clearTimeout(syncTimer.current)
      syncTimer.current = setTimeout(() => {
        columns.forEach(c => upsertColumn(c, session.user.id).catch(console.error))
        cards.forEach(c => upsertCard(c, session.user.id).catch(console.error))
      }, 1500)
    }
  }, [columns, cards, isCloud]) // eslint-disable-line

  // â”€â”€ Save images locally only (too big for DB) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    saveLocalImages(localImages)
  }, [localImages])

  // â”€â”€ Column actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addColumn = useCallback((title, color) => {
    const newCol = {
      id: 'col-' + Date.now(),
      title: title.toUpperCase(),
      color,
      index: String(columns.length + 1).padStart(2, '0'),
      role: null,
      position: columns.length,
    }
    setColumns(prev => [...prev, newCol])
    if (isCloud) upsertColumn(newCol, session.user.id)
  }, [columns.length, isCloud, session])

  const updateColumn = useCallback((colId, patch) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, ...patch } : c))
  }, [])

  const removeColumn = useCallback((colId) => {
    setColumns(prev => prev.filter(c => c.id !== colId))
    setCards(prev => prev.filter(c => c.columnId !== colId))
    if (isCloud && session?.user?.id) dbDeleteColumn(colId, session.user.id).catch(console.error)
  }, [isCloud, session])

  const clearColumnCards = useCallback((colId) => {
    const toRemove = cards.filter(c => c.columnId === colId).map(c => c.id)
    setCards(prev => prev.filter(c => c.columnId !== colId))
    if (isCloud && session?.user?.id) {
      toRemove.forEach(cardId => dbDeleteCard(cardId, session.user.id).catch(console.error))
    }
  }, [cards, isCloud, session])

  // â”€â”€ Card actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addCard = useCallback((cardData) => {
    const newCard = {
      id: 'card-' + Date.now(),
      banner: null, images: [], tags: [], assignees: [], tasks: [],
      status: 'todo', priority: 'medium', urgent: false, important: false,
      dueDate: '', excluded_from_standup: false, position: 0,
      createdAt: new Date().toISOString(),
      ...cardData,
    }
    setCards(prev => [...prev, newCard])
    if (isCloud) upsertCard(newCard, session.user.id)
    return newCard
  }, [isCloud, session])

  const updateCard = useCallback((cardId, patch) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...patch } : c))
    // Images & banner: store locally only
    if (patch.images !== undefined || patch.banner !== undefined) {
      setLocalImages(prev => ({
        ...prev,
        [cardId]: {
          banner: patch.banner ?? prev[cardId]?.banner ?? null,
          images: patch.images ?? prev[cardId]?.images ?? [],
        },
      }))
    }
  }, [])

  const removeCard = useCallback((cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    if (isCloud && session?.user?.id) dbDeleteCard(cardId, session.user.id).catch(console.error)
  }, [isCloud, session])

  const archiveCard = useCallback((cardId) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (card) {
        // Award XP for completing a task
        const { newState, earned, leveledUp, newLevel } = awardTaskXp(gameState, card)
        setGameState(newState)
        saveGameState(newState)
        setLastXpEvent({ earned, leveledUp, newLevel, ts: Date.now() })
      }
      return prev.map(c =>
        c.id === cardId ? { ...c, archived: true, archivedAt: new Date().toISOString() } : c
      )
    })
  }, [gameState])

  const unarchiveCard = useCallback((cardId) => {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, archived: false, archivedAt: null } : c
    ))
  }, [])

  const clearArchive = useCallback(() => {
    const archivedIds = cards.filter(c => c.archived).map(c => c.id)
    setCards(prev => prev.filter(c => !c.archived))
    if (isCloud && session?.user?.id) {
      archivedIds.forEach(id => dbDeleteCard(id, session.user.id).catch(console.error))
    }
  }, [cards, isCloud, session])

  const moveCard = useCallback((cardId, newColumnId, newIndex) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card) return prev
      const others = prev.filter(c => c.id !== cardId)
      const sameCol = others.filter(c => c.columnId === newColumnId)
      const otherCols = others.filter(c => c.columnId !== newColumnId)
      sameCol.splice(newIndex, 0, { ...card, columnId: newColumnId })
      return [...otherCols, ...sameCol]
    })
  }, [])

  const reorderColumn = useCallback((columnId, activeId, overId) => {
    setCards(prev => {
      const colCards = prev.filter(c => c.columnId === columnId)
      const rest = prev.filter(c => c.columnId !== columnId)
      const oldIdx = colCards.findIndex(c => c.id === activeId)
      const newIdx = colCards.findIndex(c => c.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const reordered = [...colCards]
      const [removed] = reordered.splice(oldIdx, 1)
      reordered.splice(newIdx, 0, removed)
      return [...rest, ...reordered]
    })
  }, [])

  const reorderColumns = useCallback((activeColumnId, overColumnId) => {
    setColumns(prev => {
      const oldIndex = prev.findIndex(c => c.id === activeColumnId)
      const newIndex = prev.findIndex(c => c.id === overColumnId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev

      const reordered = [...prev]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      return reordered.map((col, idx) => ({
        ...col,
        position: idx,
        index: String(idx + 1).padStart(2, '0'),
      }))
    })
  }, [])

  const handleOpenEdit = useCallback((card) => {
    setCards(prev => {
      const latest = prev.find(c => c.id === card.id) || card
      const imgs = localImages[latest.id] || {}
      setEditCardModal({ ...latest, banner: imgs.banner || null, images: imgs.images || [] })
      return prev
    })
  }, [localImages])

  // â”€â”€ Next Day logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleNextDay = () => {
    const updatedCards = applyNextDay(columns, cards)
    setCards(updatedCards)
    setNextDayConfirm(false)
    setNextDayDone(true)
    setTimeout(() => setNextDayDone(false), 3000)
  }

  // â”€â”€ Standup log save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveStandupLog = useCallback(async (message) => {
    if (!session?.user) return
    await saveStandupLog(session.user.id, message)
  }, [session])

  // â”€â”€ Loading / Auth guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="cyber-card" style={{ maxWidth: 720, width: '100%', padding: 24, background: 'var(--panel-bg)' }}>
          <h2 style={{ color: 'var(--neon-pink)', fontFamily: 'var(--font-heading)', letterSpacing: '2px', fontSize: '16px', marginBottom: 12 }}>
            SUPABASE NAO CONFIGURADO
          </h2>
          <p style={{ color: '#b7b7b7', fontFamily: 'var(--font-body)', fontSize: '13px', marginBottom: 8 }}>
            Defina estas variaveis:
          </p>
          <p style={{ color: 'var(--neon-cyan)', fontFamily: 'monospace', fontSize: '12px', marginBottom: 6 }}>
            VITE_SUPABASE_URL
          </p>
          <p style={{ color: 'var(--neon-cyan)', fontFamily: 'monospace', fontSize: '12px', marginBottom: 14 }}>
            VITE_SUPABASE_ANON_KEY
          </p>
          <p style={{ color: '#8a8a8a', fontFamily: 'var(--font-body)', fontSize: '12px', marginBottom: 6 }}>
            Local: arquivo .env.local na raiz do projeto + reiniciar o servidor.
          </p>
          <p style={{ color: '#8a8a8a', fontFamily: 'var(--font-body)', fontSize: '12px' }}>
            Vercel: Project Settings {'>'} Environment Variables (Production e Preview).
          </p>
        </div>
      </div>
    )
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00f3ff', fontFamily: 'Orbitron', letterSpacing: '4px', fontSize: '14px' }}>INICIALIZANDO...</p>
      </div>
    )
  }

  if (!session) return <AuthScreen />

  if (loadingData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', letterSpacing: '4px', fontSize: '14px' }}>CARREGANDO DADOS...</p>
        <p style={{ color: '#333', fontFamily: 'var(--font-body)', fontSize: '11px' }}>{session.user.email}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      <ThemeEffects />
      <FloatingThemeSelector />
      <GamificationHUD gameState={gameState} lastXpEvent={lastXpEvent} />
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        session={session}
        onStandup={() => setStandupOpen(true)}
        onNextDay={() => setNextDayConfirm(true)}
        nextDayDone={nextDayDone}
        onLogout={() => supabase.auth.signOut()}
        syncError={syncError}
        archivedCount={cards.filter(c => c.archived).length}
        gameState={gameState}
      />

      {viewMode === 'kanban' ? (
        <Board
          columns={columns}
          cards={cards}
          onAddCard={(columnId) => setAddCardModal({ columnId })}
          onEditCard={handleOpenEdit}
          onDeleteCard={removeCard}
          onArchiveCard={archiveCard}
          onMoveCard={moveCard}
          onReorderColumn={reorderColumn}
          onReorderColumns={reorderColumns}
          onAddColumn={() => setAddColumnModal(true)}
          onUpdateColumn={updateColumn}
          onDeleteColumn={removeColumn}
          onClearColumn={clearColumnCards}
          onInlineEdit={(id, title) => updateCard(id, { title })}
        />
      ) : viewMode === 'eisenhower' ? (
        <EisenhowerMatrix
          cards={cards.filter(c => !c.archived)}
          onEditCard={handleOpenEdit}
          onDeleteCard={removeCard}
          onUpdateCard={updateCard}
          onInlineEdit={(id, title) => updateCard(id, { title })}
        />
      ) : viewMode === 'archived' ? (
        <ArchivedView
          cards={cards}
          columns={columns}
          onUnarchive={unarchiveCard}
          onView={handleOpenEdit}
          onClearArchive={clearArchive}
        />
      ) : viewMode === 'dungeon' ? (
        <DungeonMode
          gameState={gameState}
          onGameStateChange={(newState) => {
            setGameState(newState)
            saveGameState(newState)
          }}
        />
      ) : null}

      {/* â”€â”€ Modals â”€â”€ */}
      {addCardModal && (
        <AddCardModal
          columnId={addCardModal.columnId}
          columns={columns}
          onSave={(data) => { addCard(data); setAddCardModal(null) }}
          onClose={() => setAddCardModal(null)}
        />
      )}

      {editCardModal && (
        <EditCardModal
          card={editCardModal}
          columns={columns}
          onSave={(patch) => { updateCard(editCardModal.id, patch); setEditCardModal(null) }}
          onDelete={() => { removeCard(editCardModal.id); setEditCardModal(null) }}
          onClose={() => setEditCardModal(null)}
          onPreviewImage={setImagePreview}
        />
      )}

      {addColumnModal && (
        <AddColumnModal
          onSave={(title, color) => { addColumn(title, color); setAddColumnModal(false) }}
          onClose={() => setAddColumnModal(false)}
        />
      )}

      {standupOpen && (
        <StandupModal
          columns={columns}
          cards={cards}
          userId={session?.user?.id}
          onSaveLog={handleSaveStandupLog}
          onClose={() => setStandupOpen(false)}
        />
      )}

      {nextDayConfirm && (
        <ConfirmNextDayModal
          columns={columns}
          cards={cards}
          onConfirm={handleNextDay}
          onClose={() => setNextDayConfirm(false)}
        />
      )}

      {imagePreview && (
        <div className="modal-backdrop" style={{ zIndex: 2000 }} onClick={() => setImagePreview(null)}>
          <img src={imagePreview} alt="preview" style={{
            maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
            border: '1px solid var(--neon-cyan)', boxShadow: '0 0 40px rgba(0,243,255,0.4)',
          }} />
        </div>
      )}
    </div>
  )
}

// â”€â”€ Confirm Next Day Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ConfirmNextDayModal({ columns, cards, onConfirm, onClose }) {
  const impact = getNextDayImpact(columns, cards)

  // Troque apenas a ordem desses IDs para mudar a ordem da lista no modal.
  const NEXT_DAY_RULES_ORDER = ['done', 'limbo', 'keep']

  const rulesMap = {
    done: {
      color: 'var(--neon-green)',
      text: `✓ ${impact.doneCount} tarefa(s) concluida(s) -> movem para ${impact.doneTargetTitle || 'coluna de ontem'}`,
    },
    limbo: {
      color: 'var(--neon-pink)',
      text: `✕ ${impact.limboCount} tarefa(s) nao iniciada(s) -> saem dos proximos standups`,
    },
    keep: {
      color: 'var(--neon-cyan)',
      text: `⟳ ${impact.keepCount} tarefa(s) em andamento/review/bloqueio -> permanecem em ${impact.sourceColumnTitle || 'coluna atual'}`,
    },
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cyber-card fade-in" style={{ background: 'var(--panel-bg)', padding: '28px', maxWidth: '520px', width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon-yellow)', fontSize: '16px', letterSpacing: '2px', marginBottom: 16 }}>
          VIRAR DIA
        </h3>
        {!impact.hasSourceColumn ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#bbb', lineHeight: 1.7, marginBottom: 20 }}>
            <p>Nenhuma coluna com role <strong>today</strong> foi encontrada.</p>
            <p style={{ color: '#888', marginTop: 8 }}>
              Defina uma coluna como "today" para habilitar a virada de dia automaticamente.
            </p>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#aaa', lineHeight: 1.8, marginBottom: 20 }}>
            <p style={{ marginBottom: 10 }}>O que vai acontecer:</p>
            {NEXT_DAY_RULES_ORDER.map(ruleId => (
              <p key={ruleId} style={{ color: rulesMap[ruleId].color }}>
                {rulesMap[ruleId].text}
              </p>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="cyber-btn" style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)' }}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!impact.hasSourceColumn}
            className="cyber-btn"
            style={{
              padding: '8px 20px',
              fontSize: '12px',
              background: impact.hasSourceColumn ? 'var(--neon-yellow)' : 'rgba(255,255,255,0.15)',
              color: impact.hasSourceColumn ? '#000' : '#666',
              borderColor: impact.hasSourceColumn ? 'var(--neon-yellow)' : '#555',
              cursor: impact.hasSourceColumn ? 'pointer' : 'not-allowed',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Add Card Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddCardModal({ columnId, columns, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeName, setAssigneeName] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [targetCol, setTargetCol] = useState(columnId)
  const [urgent, setUrgent] = useState(false)
  const [important, setImportant] = useState(false)

  const handleSave = () => {
    if (!title.trim()) return
    const assignees = assigneeName.trim()
      ? [{ id: 'a-' + Date.now(), name: assigneeName.trim(), color: 'cyan' }] : []
    onSave({ columnId: targetCol, title: title.trim(), description, assignees, priority, dueDate, urgent, important })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cyber-card fade-in w-full max-w-lg p-6" style={{ background: 'var(--panel-bg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20, borderBottom: '1px solid #222', paddingBottom: 12 }}>
          + Nova Tarefa
        </h3>
        <div className="space-y-4">
          <Field label="Coluna" color="var(--neon-cyan)">
            <select value={targetCol} onChange={e => setTargetCol(e.target.value)} className="cyber-input w-full p-2 rounded-sm">
              {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
          <Field label="Título *" color="var(--neon-cyan)">
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="cyber-input w-full p-3 rounded-sm" placeholder="Título da tarefa..." />
          </Field>
          <Field label="Descrição" color="var(--neon-pink)">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="cyber-input w-full p-3 rounded-sm h-20 resize-none" placeholder="Detalhes..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Responsável" color="var(--neon-yellow)">
              <input type="text" value={assigneeName} onChange={e => setAssigneeName(e.target.value)}
                className="cyber-input w-full p-2 rounded-sm" placeholder="@usuario" />
            </Field>
            <Field label="Prioridade" color="var(--neon-green)">
              <select value={priority} onChange={e => setPriority(e.target.value)} className="cyber-input w-full p-2 rounded-sm">
                <option value="low">Baixa</option><option value="medium">Média</option>
                <option value="high">Alta</option><option value="critical">Crítica</option>
              </select>
            </Field>
          </div>
          <Field label="Data Limite" color="var(--neon-purple)">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="cyber-input w-full p-2 rounded-sm" />
          </Field>
          <div>
            <label style={LABEL_STYLE('var(--neon-yellow)')}>Eisenhower</label>
            <div className="flex gap-3">
              <ToggleBtn active={urgent} onClick={() => setUrgent(v => !v)} color="var(--neon-pink)">URGENTE</ToggleBtn>
              <ToggleBtn active={important} onClick={() => setImportant(v => !v)} color="var(--neon-cyan)">IMPORTANTE</ToggleBtn>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="cyber-btn" style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)' }}>Cancelar</button>
          <button onClick={handleSave} className="cyber-btn" style={{ padding: '8px 20px', fontSize: '12px', background: 'var(--neon-cyan)', color: '#000' }}>Criar Tarefa</button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Edit Card Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TAG_COLORS = ['cyan', 'pink', 'yellow', 'green', 'orange', 'purple']
const STATUS_OPTIONS = [
  { value: 'todo', label: 'A Fazer' }, { value: 'progress', label: 'Em Progresso' },
  { value: 'review', label: 'Em Review' }, { value: 'blocked', label: 'Bloqueado' },
  { value: 'done', label: 'Concluído' },
]
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' },
]

function EditCardModal({ card, columns, onSave, onDelete, onClose, onPreviewImage }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [status, setStatus] = useState(card.status || 'todo')
  const [priority, setPriority] = useState(card.priority || 'medium')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [columnId, setColumnId] = useState(card.columnId)
  const [tags, setTags] = useState(card.tags || [])
  const [assignees, setAssignees] = useState(card.assignees || [])
  const [images, setImages] = useState(card.images || [])
  const [banner, setBanner] = useState(card.banner || null)
  const [tasks, setTasks] = useState(card.tasks || [])
  const [urgent, setUrgent] = useState(card.urgent || false)
  const [important, setImportant] = useState(card.important || false)
  const [excluded, setExcluded] = useState(card.excluded_from_standup || false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('cyan')
  const [newAssigneeName, setNewAssigneeName] = useState('')
  const [newAssigneeColor, setNewAssigneeColor] = useState('cyan')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  const handleBannerUpload = e => {
    const file = e.target.files[0]
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => setBanner(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleImageUpload = e => {
    Array.from(e.target.files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = ev => setImages(prev => [...prev, { id: 'img-' + Date.now() + Math.random(), src: ev.target.result, name: file.name }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const addTag = () => { if (newTagName.trim()) { setTags(p => [...p, { id: 't-' + Date.now(), name: newTagName.trim(), color: newTagColor }]); setNewTagName('') } }
  const addAssignee = () => { if (newAssigneeName.trim()) { setAssignees(p => [...p, { id: 'a-' + Date.now(), name: newAssigneeName.trim(), color: newAssigneeColor }]); setNewAssigneeName('') } }
  const addTask = () => { if (newTaskTitle.trim()) { setTasks(p => [...p, { id: 'task-' + Date.now(), title: newTaskTitle.trim(), done: false }]); setNewTaskTitle('') } }

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description, status, priority, dueDate, columnId, tags, assignees, images, banner, tasks, urgent, important, excluded_from_standup: excluded })
  }

  const doneTasks = tasks.filter(t => t.done).length
  const TAB = (id, label) => (
    <button key={id} onClick={() => setActiveTab(id)} style={{
      fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase',
      letterSpacing: '1px', padding: '7px 12px', cursor: 'pointer', border: 'none',
      background: activeTab === id ? 'rgba(0,243,255,0.1)' : 'transparent',
      color: activeTab === id ? 'var(--neon-cyan)' : '#555',
      borderBottom: activeTab === id ? '2px solid var(--neon-cyan)' : '2px solid transparent',
      transition: 'all 0.2s',
    }}>{label}</button>
  )

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cyber-card fade-in w-full max-w-2xl" style={{ background: 'var(--panel-bg)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Banner */}
        {banner && (
          <div style={{ width: '100%', height: '130px', position: 'relative', flexShrink: 0 }}>
            <img src={banner} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--panel-bg) 0%, transparent 60%)' }} />
            <button onClick={() => setBanner(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', cursor: 'pointer', width: 24, height: 24, fontSize: '12px', borderRadius: '2px' }}>✕</button>
          </div>
        )}

        {/* Title header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', flexShrink: 0, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} className="cyber-input flex-1 p-2 rounded-sm font-bold"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '15px' }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #222', flexShrink: 0, overflowX: 'auto' }}>
          {TAB('info', 'Info')}
          {TAB('tasks', `Tasks${tasks.length > 0 ? ` ${doneTasks}/${tasks.length}` : ''}`)}
          {TAB('tags', 'Tags')}
          {TAB('people', 'Equipe')}
          {TAB('images', `Imagens${images.length > 0 ? ` (${images.length})` : ''}`)}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <Field label="Descrição" color="var(--neon-pink)">
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  className="cyber-input w-full p-3 rounded-sm resize-none" rows={4} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Status" color="var(--neon-cyan)">
                  <select value={status} onChange={e => setStatus(e.target.value)} className="cyber-input w-full p-2 rounded-sm">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="Prioridade" color="var(--neon-orange)">
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="cyber-input w-full p-2 rounded-sm">
                    {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Field>
                <Field label="Coluna" color="var(--neon-green)">
                  <select value={columnId} onChange={e => setColumnId(e.target.value)} className="cyber-input w-full p-2 rounded-sm">
                    {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </Field>
                <Field label="Data Limite" color="var(--neon-purple)">
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="cyber-input w-full p-2 rounded-sm" />
                </Field>
              </div>
              <div>
                <label style={LABEL_STYLE('var(--neon-yellow)')}>Eisenhower</label>
                <div className="flex gap-3">
                  <ToggleBtn active={urgent} onClick={() => setUrgent(v => !v)} color="var(--neon-pink)">URGENTE</ToggleBtn>
                  <ToggleBtn active={important} onClick={() => setImportant(v => !v)} color="var(--neon-cyan)">IMPORTANTE</ToggleBtn>
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE('#555')}>Visibilidade no Standup</label>
                <ToggleBtn active={excluded} onClick={() => setExcluded(v => !v)} color="var(--neon-pink)">
                  {excluded ? 'EXCLUÍDO DO STANDUP' : 'INCLUÍDO NO STANDUP'}
                </ToggleBtn>
              </div>
              <p style={{ fontSize: '10px', color: '#333', fontFamily: 'var(--font-body)' }}>
                ID: {card.id} · {new Date(card.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          )}

          {/* TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {tasks.length > 0 && (
                <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%`, background: doneTasks === tasks.length ? 'var(--neon-green)' : 'var(--neon-cyan)', transition: 'width 0.3s' }} />
                </div>
              )}
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 group" style={{ padding: '5px 0', borderBottom: '1px solid #111' }}>
                  <button onClick={() => setTasks(p => p.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                    style={{ width: 18, height: 18, borderRadius: 3, flexShrink: 0, cursor: 'pointer', border: `1px solid ${task.done ? 'var(--neon-green)' : '#444'}`, background: task.done ? 'var(--neon-green)' : 'transparent', color: '#000', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {task.done ? '✓' : ''}
                  </button>
                  <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-body)', color: task.done ? '#444' : '#ccc', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
                  <button onClick={() => setTasks(p => p.filter(t => t.id !== task.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', fontSize: '12px' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-pink)'}
                    onMouseLeave={e => e.currentTarget.style.color = '#333'}>✕</button>
                </div>
              ))}
              {tasks.length === 0 && <p style={{ color: '#333', fontSize: '12px', fontFamily: 'var(--font-body)', textAlign: 'center', padding: '16px 0' }}>Sem subtasks.</p>}
              <div className="flex gap-2 pt-3 border-t border-gray-800">
                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  className="cyber-input flex-1 p-2 rounded-sm text-sm" placeholder="Nova subtask..." />
                <button onClick={addTask} className="cyber-btn px-4 py-2 text-xs">+</button>
              </div>
            </div>
          )}

          {/* TAGS */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag.id} className={`tag-${tag.color} px-2 py-1 rounded text-xs flex items-center gap-1`}>
                    {tag.name}
                    <button onClick={() => setTags(p => p.filter(t => t.id !== tag.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '11px' }}>✕</button>
                  </span>
                ))}
                {tags.length === 0 && <p style={{ color: '#444', fontSize: '12px' }}>Sem tags.</p>}
              </div>
              <div className="flex gap-2 border-t border-gray-800 pt-3">
                <input value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                  className="cyber-input flex-1 p-2 rounded-sm text-sm" placeholder="Nova tag..." />
                <select value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="cyber-input p-2 rounded-sm text-sm">
                  {TAG_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={addTag} className="cyber-btn px-3 py-2 text-xs">+</button>
              </div>
            </div>
          )}

          {/* PEOPLE */}
          {activeTab === 'people' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {assignees.map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #222' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `var(--neon-${a.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>{a.name.charAt(0).toUpperCase()}</div>
                    <span style={{ fontSize: '13px', color: `var(--neon-${a.color})` }}>{a.name}</span>
                    <button onClick={() => setAssignees(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: '12px' }}>✕</button>
                  </div>
                ))}
                {assignees.length === 0 && <p style={{ color: '#444', fontSize: '12px' }}>Sem responsáveis.</p>}
              </div>
              <div className="flex gap-2 border-t border-gray-800 pt-3">
                <input value={newAssigneeName} onChange={e => setNewAssigneeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAssignee()}
                  className="cyber-input flex-1 p-2 rounded-sm text-sm" placeholder="@nome..." />
                <select value={newAssigneeColor} onChange={e => setNewAssigneeColor(e.target.value)} className="cyber-input p-2 rounded-sm text-sm">
                  {TAG_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={addAssignee} className="cyber-btn px-3 py-2 text-xs">+</button>
              </div>
            </div>
          )}

          {/* IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div>
                <label style={LABEL_STYLE('var(--neon-yellow)')}>Banner do Card</label>
                {banner ? (
                  <div style={{ position: 'relative', height: 90 }}>
                    <img src={banner} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(0,243,255,0.3)' }} />
                    <button onClick={() => setBanner(null)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.8)', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', cursor: 'pointer', width: 22, height: 22, fontSize: '11px', borderRadius: 2 }}>✕</button>
                  </div>
                ) : (
                  <label className="cyber-btn flex items-center justify-center gap-2 py-2 cursor-pointer text-sm" style={{ display: 'flex', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)' }}>
                    📷 Upload Banner
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <label style={LABEL_STYLE('var(--neon-cyan)')}>Galeria</label>
                <label className="cyber-btn flex items-center justify-center gap-2 py-2 cursor-pointer text-sm" style={{ display: 'flex' }}>
                  + Adicionar Imagens
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {images.map(img => (
                      <div key={img.id} className="relative group">
                        <img src={img.src} alt={img.name} onClick={() => onPreviewImage(img.src)}
                          style={{ width: '100%', height: 80, objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(0,243,255,0.2)', borderRadius: 2 }} />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 2 }}>
                          <button onClick={() => setBanner(img.src)} style={{ background: 'rgba(252,238,10,0.2)', border: '1px solid var(--neon-yellow)', color: 'var(--neon-yellow)', cursor: 'pointer', fontSize: '9px', padding: '3px 5px', borderRadius: 2, fontFamily: 'var(--font-heading)' }}>BANNER</button>
                          <button onClick={() => setImages(p => p.filter(i => i.id !== img.id))} style={{ background: 'rgba(255,0,255,0.2)', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', cursor: 'pointer', width: 22, height: 22, fontSize: '11px', borderRadius: 2 }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="cyber-btn" style={{ padding: '7px 14px', fontSize: '11px', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)' }}>Deletar</button>
          ) : (
            <div className="flex gap-2 items-center">
              <span style={{ fontSize: '11px', color: 'var(--neon-pink)', fontFamily: 'var(--font-body)' }}>Confirmar?</span>
              <button onClick={onDelete} style={{ padding: '5px 10px', background: 'none', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-body)' }}>Sim</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '5px 10px', background: 'none', border: '1px solid #444', color: '#888', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-body)' }}>Não</button>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="cyber-btn" style={{ padding: '8px 16px', fontSize: '12px' }}>Fechar</button>
            <button onClick={handleSave} className="cyber-btn" style={{ padding: '8px 20px', fontSize: '12px', background: 'var(--neon-cyan)', color: '#000' }}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Add Column Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COL_COLORS = ['pink', 'cyan', 'yellow', 'green', 'orange', 'purple']

function AddColumnModal({ onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState('pink')
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cyber-card fade-in w-full max-w-sm p-6" style={{ background: 'var(--panel-bg)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon-cyan)', fontSize: '14px', letterSpacing: '2px', marginBottom: 20, borderBottom: '1px solid #222', paddingBottom: 12, textTransform: 'uppercase' }}>Nova Coluna</h3>
        <div className="space-y-4">
          <Field label="Nome" color="var(--neon-cyan)">
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && title.trim() && onSave(title.trim(), color)}
              className="cyber-input w-full p-3 rounded-sm" placeholder="Ex: BACKLOG..." />
          </Field>
          <div>
            <label style={LABEL_STYLE('var(--neon-pink)')}>Cor</label>
            <div className="flex gap-2">
              {COL_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 4, background: `var(--neon-${c})`, border: color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: color === c ? `0 0 10px var(--neon-${c})` : 'none' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="cyber-btn" style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)' }}>Cancelar</button>
          <button onClick={() => title.trim() && onSave(title.trim(), color)} className="cyber-btn" style={{ padding: '8px 20px', fontSize: '12px', background: `var(--neon-${color})`, color: '#000' }}>Criar</button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Shared small components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Field({ label, color, children }) {
  return (
    <div>
      <label style={LABEL_STYLE(color)}>{label}</label>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, color, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-heading)', cursor: 'pointer',
      border: `1px solid ${active ? color : '#333'}`,
      background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : 'transparent',
      color: active ? color : '#555',
      transition: 'all 0.2s', borderRadius: '2px',
    }}>{children}</button>
  )
}

const LABEL_STYLE = (color) => ({
  display: 'block', fontSize: '10px', color,
  fontFamily: 'var(--font-body)', textTransform: 'uppercase',
  letterSpacing: '2px', marginBottom: 6,
})



