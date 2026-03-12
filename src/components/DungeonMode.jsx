import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { CLASS_LIST, getClassById, getAvailableSkills, createCharacter } from '../data/classes'
import { WEAPONS, getStartingWeapon, RARITY_COLORS, RARITY_LABELS } from '../data/weapons'
import { ENEMY_CATEGORIES } from '../data/enemies'
import { loadGameState, saveGameState, computeLevel, getLevelTitle, getLevelColor, awardTaskXp, xpForNextLevel } from '../lib/gamification'
import { startDungeonRun, processPlayerAction, applyLoot } from '../lib/dungeonEngine'

// ─── HP/MP BAR ─────────────────────────────────────────────────────────────
function StatBar({ current, max, color, label }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100))
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: '#888', fontFamily: 'var(--font-body)', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color, fontFamily: 'var(--font-body)' }}>{current}/{max}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, background: color, transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  )
}

// ─── BATTLE LOG ────────────────────────────────────────────────────────────
function BattleLog({ log }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [log])

  return (
    <div ref={ref} style={{
      height: 220, overflowY: 'auto', padding: '8px 12px',
      background: 'rgba(0,0,0,0.6)', border: '1px solid var(--neon-cyan)',
      fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.7,
    }}>
      {log.map((entry, i) => (
        <div key={i} style={{
          color: entry.actor === 'enemy' ? 'var(--neon-pink)'
            : entry.actor === 'system' ? (entry.victory ? 'var(--neon-green)' : entry.defeat ? '#ff4444' : 'var(--neon-yellow)')
            : entry.error ? '#ff4444'
            : entry.flavor ? '#666'
            : 'var(--neon-cyan)',
          fontStyle: entry.flavor ? 'italic' : 'normal',
          opacity: i < log.length - 6 ? 0.5 : 1,
        }}>
          {entry.text}
        </div>
      ))}
    </div>
  )
}

// ─── CLASS SELECTION SCREEN ────────────────────────────────────────────────
function ClassSelect({ onSelect, existingClasses = [] }) {
  const [hover, setHover] = useState(null)
  const available = CLASS_LIST.filter(c => !existingClasses.includes(c.id))

  return (
    <div>
      <p style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 11, marginBottom: 12, letterSpacing: 1 }}>
        ESCOLHA SUA CLASSE:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {available.map(cls => (
          <button key={cls.id}
            onClick={() => onSelect(cls.id)}
            onMouseEnter={() => setHover(cls.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              padding: '10px 8px', cursor: 'pointer', textAlign: 'left',
              background: hover === cls.id ? 'rgba(0,243,255,0.1)' : 'rgba(0,0,0,0.5)',
              border: `1px solid ${hover === cls.id ? 'var(--neon-cyan)' : '#333'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{cls.icon}</div>
            <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: 1 }}>{cls.name}</div>
            <div style={{ color: '#666', fontFamily: 'var(--font-body)', fontSize: 10, marginTop: 3 }}>{cls.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── COMBAT SCREEN ─────────────────────────────────────────────────────────
function CombatScreen({ run, onAction, onFinish, gameState }) {
  const { character, enemy, log, finished, result } = run
  const skills = getAvailableSkills(character)
  const potions = (gameState.inventory || []).filter(i => i.type === 'potion')
  const [activeTab, setActiveTab] = useState('actions')

  const hp = character.currentHp ?? character.maxHp
  const mp = character.mp ?? character.maxMp
  const enemyHpPct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100)

  return (
    <div>
      {/* Enemy section */}
      <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #333', marginBottom: 12 }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>
          {enemy.category === 'undead' ? '💀' : enemy.category === 'demon' ? '😈' : enemy.category === 'dragon' ? '🐉'
           : enemy.category === 'beast' ? '🐺' : enemy.category === 'golem' ? '🪨' : enemy.category === 'elemental' ? '🔥'
           : enemy.category === 'humanoid' ? '👤' : enemy.category === 'plant' ? '🌿' : enemy.category === 'slime' ? '🫧'
           : enemy.category === 'giant' ? '🗿' : enemy.category === 'fey' ? '✨' : enemy.category === 'aberration' ? '👁️'
           : enemy.category === 'insect' ? '🦂' : enemy.category === 'aquatic' ? '🐙' : enemy.category === 'shadow' ? '🌑'
           : enemy.category === 'boss' ? '💢' : '👾'}
        </div>
        <div style={{ color: 'var(--neon-pink)', fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: 2 }}>
          {enemy.name}
        </div>
        <div style={{ color: '#666', fontFamily: 'var(--font-body)', fontSize: 10, marginTop: 2 }}>
          {ENEMY_CATEGORIES[enemy.category] || enemy.category} • Nível {enemy.tier * 5 - 2}
        </div>
        <div style={{ margin: '8px auto', maxWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 3, fontFamily: 'var(--font-body)' }}>
            <span>HP</span><span>{enemy.currentHp}/{enemy.maxHp}</span>
          </div>
          <div style={{ height: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid #333', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${enemyHpPct}%`, background: enemyHpPct > 50 ? 'var(--neon-green)' : enemyHpPct > 25 ? 'var(--neon-yellow)' : 'var(--neon-pink)', transition: 'width 0.4s', boxShadow: `0 0 8px currentColor` }} />
          </div>
        </div>
        {/* Status effects on enemy */}
        {enemy.statusEffects?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            {enemy.statusEffects.map((e, i) => (
              <span key={i} style={{ padding: '2px 6px', background: 'rgba(255,0,128,0.2)', border: '1px solid var(--neon-pink)', fontSize: 9, color: 'var(--neon-pink)', fontFamily: 'var(--font-body)' }}>
                {e.id} ({e.turns}t)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Player section */}
      <div style={{ marginBottom: 12 }}>
        <StatBar current={hp} max={character.maxHp} color="var(--neon-green)" label="HP" />
        <StatBar current={mp} max={character.maxMp} color="var(--neon-cyan)" label="MP" />
        {/* Player status effects */}
        {character.statusEffects?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {character.statusEffects.map((e, i) => (
              <span key={i} style={{ padding: '2px 6px', background: 'rgba(0,243,255,0.1)', border: '1px solid var(--neon-cyan)', fontSize: 9, color: 'var(--neon-cyan)', fontFamily: 'var(--font-body)' }}>
                {e.id} ({e.turns}t)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Battle log */}
      <BattleLog log={log} />

      {/* Actions */}
      {!finished ? (
        <div style={{ marginTop: 12 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: 8 }}>
            {[['actions','⚔️ Ações'],['skills','✨ Skills'],['items','🧪 Items']].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '5px 12px', background: 'none',
                border: 'none', borderBottom: activeTab === tab ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--neon-cyan)' : '#555',
                fontFamily: 'var(--font-heading)', fontSize: 10, cursor: 'pointer', letterSpacing: 1,
              }}>{label}</button>
            ))}
          </div>

          {activeTab === 'actions' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <ActionBtn label="⚔️ Atacar" sub="Ataque físico" color="var(--neon-cyan)" onClick={() => onAction({ type: 'attack' })} />
              <ActionBtn label="🏃 Fugir" sub="Tentar escapar" color="var(--neon-yellow)" onClick={() => onAction({ type: 'flee' })} />
            </div>
          )}

          {activeTab === 'skills' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
              {skills.length === 0 && <p style={{ color: '#555', fontSize: 11, fontFamily: 'var(--font-body)', gridColumn: '1/-1' }}>Nenhuma skill disponível.</p>}
              {skills.map(skill => (
                <ActionBtn key={skill.id}
                  label={`${skill.name}`}
                  sub={`${skill.mpCost} MP • ${skill.desc.slice(0, 30)}...`}
                  color={mp >= skill.mpCost ? 'var(--neon-purple)' : '#444'}
                  disabled={mp < skill.mpCost}
                  onClick={() => onAction({ type: 'skill', skill })}
                />
              ))}
            </div>
          )}

          {activeTab === 'items' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {potions.length === 0 && <p style={{ color: '#555', fontSize: 11, fontFamily: 'var(--font-body)', gridColumn: '1/-1' }}>Sem itens.</p>}
              {potions.slice(0, 6).map((item, i) => (
                <ActionBtn key={i}
                  label={`🧪 Poção de Cura`}
                  sub={`+${item.amount} HP`}
                  color="var(--neon-green)"
                  onClick={() => onAction({ type: 'item', item, itemIndex: i })}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{
            padding: '12px',
            background: result === 'win' ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,0,0.1)',
            border: `1px solid ${result === 'win' ? 'var(--neon-green)' : '#ff4444'}`,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{result === 'win' ? '🏆' : result === 'flee' ? '🏃' : '💀'}</div>
            <div style={{ color: result === 'win' ? 'var(--neon-green)' : result === 'flee' ? 'var(--neon-yellow)' : '#ff4444', fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: 2 }}>
              {result === 'win' ? 'VITÓRIA!' : result === 'flee' ? 'FUGIU!' : 'DERROTA'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => onFinish('next')} style={primaryBtn('var(--neon-cyan)')}>
              {result === 'win' ? '▶ Próximo Andar' : '↩ Tentar Novamente'}
            </button>
            <button onClick={() => onFinish('exit')} style={primaryBtn('#555')}>🚪 Sair</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ label, sub, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 10px', cursor: disabled ? 'not-allowed' : 'pointer',
      background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${disabled ? '#333' : color}44`,
      textAlign: 'left', transition: 'all 0.15s', opacity: disabled ? 0.4 : 1,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `${color}11` }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)' }}
    >
      <div style={{ color: disabled ? '#555' : color, fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: 1 }}>{label}</div>
      {sub && <div style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: 9, marginTop: 2 }}>{sub}</div>}
    </button>
  )
}

// ─── INVENTORY PANEL ───────────────────────────────────────────────────────
function InventoryPanel({ gameState, onEquip }) {
  const weapons = (gameState.inventory || []).filter(i => i.dmg)
  const potions = (gameState.inventory || []).filter(i => i.type === 'potion')
  const equipped = gameState.equippedWeapon

  return (
    <div>
      <p style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 11, marginBottom: 10, letterSpacing: 1 }}>INVENTÁRIO</p>
      {equipped && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', fontSize: 10, fontFamily: 'var(--font-body)', marginBottom: 4 }}>EQUIPADO:</p>
          <div style={{ padding: '8px 10px', background: 'rgba(0,243,255,0.05)', border: '1px solid var(--neon-cyan)' }}>
            <span style={{ color: RARITY_COLORS[equipped.rarity], fontFamily: 'var(--font-body)', fontSize: 12 }}>⚔️ {equipped.name}</span>
            <span style={{ color: '#555', fontSize: 10, marginLeft: 8 }}>{equipped.dmg[0]}-{equipped.dmg[1]} dano</span>
          </div>
        </div>
      )}
      <p style={{ color: '#666', fontSize: 10, fontFamily: 'var(--font-body)', marginBottom: 6 }}>ARMAS ({weapons.length})</p>
      {weapons.length === 0 && <p style={{ color: '#444', fontSize: 11, fontFamily: 'var(--font-body)' }}>Sem armas no inventário.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {weapons.map((w, i) => (
          <div key={i} style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.4)', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ color: RARITY_COLORS[w.rarity], fontFamily: 'var(--font-body)', fontSize: 11 }}>{w.name}</span>
              <span style={{ color: '#444', fontSize: 9, marginLeft: 6 }}>{RARITY_LABELS[w.rarity]} • {w.dmg[0]}-{w.dmg[1]} dano</span>
            </div>
            <button onClick={() => onEquip(w)} style={{ ...primaryBtn('var(--neon-cyan)'), padding: '3px 8px', fontSize: 9 }}>
              {equipped?.id === w.id ? '✓ Equipado' : 'Equipar'}
            </button>
          </div>
        ))}
      </div>
      <p style={{ color: '#666', fontSize: 10, fontFamily: 'var(--font-body)', marginBottom: 6 }}>POÇÕES ({potions.length})</p>
      {potions.map((p, i) => (
        <div key={i} style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', fontSize: 10, color: 'var(--neon-green)', fontFamily: 'var(--font-body)', marginBottom: 3 }}>
          🧪 Poção de Cura +{p.amount} HP
        </div>
      ))}
      <div style={{ marginTop: 12, padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444' }}>
        <span style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 12 }}>💰 Ouro: {gameState.gold || 0}</span>
      </div>
    </div>
  )
}

// ─── MAIN DUNGEON COMPONENT ────────────────────────────────────────────────
export default function DungeonMode({ gameState: externalState, onGameStateChange }) {
  const { theme } = useTheme()
  const [gameState, setGameStateLocal] = useState(externalState || loadGameState())
  const [screen, setScreen] = useState('hub') // hub | class_select | combat | inventory | character
  const [run, setRun] = useState(null)
  const [notification, setNotification] = useState(null)
  const [multiclassStep, setMulticlassStep] = useState(null)

  const updateState = (newState) => {
    setGameStateLocal(newState)
    saveGameState(newState)
    onGameStateChange?.(newState)
  }

  // Sync external state changes
  useEffect(() => {
    if (externalState) setGameStateLocal(externalState)
  }, [externalState])

  const xpInfo = computeLevel(gameState.totalXp || 0)
  const hasClass = gameState.classIds?.length > 0
  const character = hasClass ? buildCharacter(gameState) : null
  const isSetup = !hasClass

  function showNotif(msg, color = 'var(--neon-green)') {
    setNotification({ msg, color })
    setTimeout(() => setNotification(null), 3000)
  }

  function handleClassSelect(classId) {
    const cls = getClassById(classId)
    if (!cls) return
    const char = createCharacter(classId, gameState.characterName || 'Herói')
    const startWeapon = getStartingWeapon(classId)
    const newState = {
      ...gameState,
      classIds: [...(gameState.classIds || []), classId],
      characterName: gameState.characterName || 'Herói',
      equippedWeapon: gameState.equippedWeapon || startWeapon,
      inventory: gameState.equippedWeapon ? (gameState.inventory || []) : [startWeapon],
      characterStats: char.stats,
      characterMaxHp: char.maxHp,
      characterHp: char.maxHp,
      characterMaxMp: char.maxMp,
      characterMp: char.maxMp,
    }
    updateState(newState)
    setScreen('hub')
    setMulticlassStep(null)
    showNotif(`${cls.icon} ${cls.name} selecionado!`)
  }

  function handleEnterDungeon() {
    if (!hasClass) { setScreen('class_select'); return }
    const char = buildCharacter(gameState)
    const newRun = startDungeonRun(char, gameState.dungeonFloor || 1)
    setRun(newRun)
    setScreen('combat')
  }

  function handleAction(action) {
    if (!run || run.finished) return
    const res = processPlayerAction(action, run.character, run.enemy, gameState)
    const newLog = [...run.log, ...res.log]

    if (res.result === 'win') {
      const xpGained = res.xpGained || 0
      let newState = applyLoot(gameState, res.loot)
      newState = { ...newState, totalXp: (newState.totalXp || 0) + xpGained }
      const newXpInfo = computeLevel(newState.totalXp)
      if (newXpInfo.level > xpInfo.level) {
        newLog.push({ actor: 'system', text: `⬆️ NÍVEL UP! Você chegou ao nível ${newXpInfo.level}!`, victory: true })
      }
      newLog.push({ actor: 'system', text: `⭐ +${xpGained} XP ganhos!` })
      updateState({ ...newState, level: newXpInfo.level })
      setRun({ ...run, character: res.character, enemy: res.enemy, log: newLog, finished: true, result: 'win' })
    } else if (res.result === 'lose') {
      const penaltyFloor = Math.max(1, (gameState.dungeonFloor || 1) - 2)
      updateState({ ...gameState, dungeonFloor: penaltyFloor })
      setRun({ ...run, character: res.character, enemy: res.enemy, log: newLog, finished: true, result: 'lose' })
    } else if (res.result === 'flee') {
      setRun({ ...run, character: res.character, enemy: res.enemy, log: newLog, finished: true, result: 'flee' })
    } else {
      setRun({ ...run, character: res.character, enemy: res.enemy, log: newLog, turn: run.turn + 1 })
    }
  }

  function handleFinish(choice) {
    if (choice === 'next' && run?.result === 'win') {
      const nextFloor = (gameState.dungeonFloor || 1) + 1
      updateState({ ...gameState, dungeonFloor: nextFloor })
      const char = buildCharacter({ ...gameState, dungeonFloor: nextFloor })
      // Restore HP from run character partially
      char.currentHp = Math.max(
        Math.round(char.maxHp * 0.3),
        run.character.currentHp
      )
      const newRun = startDungeonRun(char, nextFloor)
      setRun(newRun)
    } else {
      setRun(null)
      setScreen('hub')
    }
  }

  function handleEquip(weapon) {
    updateState({ ...gameState, equippedWeapon: weapon })
    showNotif(`⚔️ ${weapon.name} equipada!`)
  }

  // Build runtime character from game state
  function buildCharacter(gs) {
    const classId = gs.classIds?.[0] || 'guerreiro'
    const cls = getClassById(classId)
    if (!cls) return null
    const level = computeLevel(gs.totalXp || 0).level
    const hpPerLevel = cls.hpPerLevel || 5
    const mpPerLevel = cls.mpPerLevel || 3
    return {
      name: gs.characterName || 'Herói',
      classIds: gs.classIds || [classId],
      level,
      hp: gs.characterHp ?? gs.characterMaxHp ?? (cls.hpBase + (level - 1) * hpPerLevel),
      maxHp: gs.characterMaxHp ?? (cls.hpBase + (level - 1) * hpPerLevel),
      mp: gs.characterMp ?? gs.characterMaxMp ?? (cls.mpBase + (level - 1) * mpPerLevel),
      maxMp: gs.characterMaxMp ?? (cls.mpBase + (level - 1) * mpPerLevel),
      stats: gs.characterStats ?? { ...cls.stats },
      equippedWeapon: gs.equippedWeapon || null,
      inventory: gs.inventory || [],
      statusEffects: [],
    }
  }

  const panelStyle = {
    background: 'var(--panel-bg)',
    border: '1px solid var(--neon-cyan)',
    padding: 20,
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', background: 'rgba(0,0,0,0.9)',
          border: `1px solid ${notification.color}`, color: notification.color,
          fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: 2,
          zIndex: 1000, animation: 'fadeInOut 3s ease',
        }}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--neon-pink)', fontFamily: 'var(--font-heading)', fontSize: 22, letterSpacing: 4, margin: 0 }}>
            ⚔️ DUNGEON MODE
          </h2>
          <p style={{ color: '#666', fontFamily: 'var(--font-body)', fontSize: 10, marginTop: 4, letterSpacing: 2 }}>
            ANDAR {gameState.dungeonFloor || 1} • {gameState.gold || 0} OURO
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: getLevelColor(xpInfo.level), fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: 2 }}>
            Lv.{xpInfo.level} {getLevelTitle(xpInfo.level)}
          </div>
          <div style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-body)', marginTop: 2 }}>
            {xpInfo.currentXp} / {xpInfo.xpForNext} XP
          </div>
          {/* XP bar */}
          <div style={{ width: 150, height: 4, background: '#222', border: '1px solid #333', marginTop: 4 }}>
            <div style={{ height: '100%', width: `${xpInfo.progress * 100}%`, background: 'var(--neon-cyan)', boxShadow: '0 0 4px var(--neon-cyan)' }} />
          </div>
        </div>
      </div>

      {/* Nav when not in combat */}
      {screen !== 'combat' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['hub','🏰 Hub'],['inventory','🎒 Inventário'],['character','📜 Personagem']].map(([s, label]) => (
            <button key={s} onClick={() => setScreen(s)} style={{
              padding: '5px 12px', background: 'none',
              border: `1px solid ${screen === s ? 'var(--neon-cyan)' : '#333'}`,
              color: screen === s ? 'var(--neon-cyan)' : '#555',
              fontFamily: 'var(--font-heading)', fontSize: 10, cursor: 'pointer', letterSpacing: 1,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* SCREENS */}
      {screen === 'class_select' && (
        <div style={panelStyle}>
          <ClassSelect onSelect={handleClassSelect} existingClasses={gameState.classIds || []} />
          {gameState.classIds?.length > 0 && (
            <button onClick={() => setScreen('hub')} style={{ ...primaryBtn('#555'), marginTop: 12 }}>← Voltar</button>
          )}
        </div>
      )}

      {screen === 'hub' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Character card */}
          <div style={panelStyle}>
            <p style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>PERSONAGEM</p>
            {!hasClass ? (
              <div>
                <p style={{ color: '#666', fontFamily: 'var(--font-body)', fontSize: 11, marginBottom: 10 }}>
                  Você ainda não escolheu uma classe.
                </p>
                <button onClick={() => setScreen('class_select')} style={primaryBtn('var(--neon-cyan)')}>
                  ⚔️ Escolher Classe
                </button>
              </div>
            ) : (
              <div>
                {gameState.classIds.map(id => {
                  const cls = getClassById(id)
                  return cls ? (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{cls.icon}</span>
                      <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: 1 }}>{cls.name}</span>
                    </div>
                  ) : null
                })}
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {character && Object.entries(character.stats).map(([stat, val]) => (
                    <div key={stat} style={{ fontSize: 10, fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: '#555' }}>{stat.toUpperCase()} </span>
                      <span style={{ color: 'var(--neon-cyan)' }}>{val}</span>
                    </div>
                  ))}
                </div>
                {xpInfo.level >= 10 && gameState.classIds.length < 2 && (
                  <button onClick={() => setScreen('class_select')} style={{ ...primaryBtn('var(--neon-purple)'), marginTop: 8, fontSize: 9 }}>
                    + Adicionar Multiclasse
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dungeon entry */}
          <div style={panelStyle}>
            <p style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>MASMORRA</p>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏰</div>
              <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: 2 }}>
                ANDAR {gameState.dungeonFloor || 1}
              </div>
              <div style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: 10, marginTop: 4, marginBottom: 16 }}>
                {getDungeonDesc(gameState.dungeonFloor || 1)}
              </div>
              <button onClick={handleEnterDungeon} style={primaryBtn('var(--neon-pink)')}>
                ⚔️ ENTRAR NA MASMORRA
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>ESTATÍSTICAS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                ['Tarefas Concluídas', gameState.completedTasks || 0, 'var(--neon-cyan)'],
                ['Total XP', gameState.totalXp || 0, 'var(--neon-yellow)'],
                ['Dias Seguidos', gameState.streak || 0, 'var(--neon-green)'],
                ['Andar Máximo', gameState.dungeonFloor || 1, 'var(--neon-pink)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333' }}>
                  <div style={{ color, fontFamily: 'var(--font-heading)', fontSize: 18 }}>{val}</div>
                  <div style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: 9, marginTop: 4, letterSpacing: 1 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === 'combat' && run && (
        <div style={panelStyle}>
          <CombatScreen run={run} onAction={handleAction} onFinish={handleFinish} gameState={gameState} />
        </div>
      )}

      {screen === 'inventory' && (
        <div style={panelStyle}>
          <InventoryPanel gameState={gameState} onEquip={handleEquip} />
        </div>
      )}

      {screen === 'character' && (
        <div style={panelStyle}>
          <CharacterSheet gameState={gameState} character={character} xpInfo={xpInfo} />
        </div>
      )}
    </div>
  )
}

function CharacterSheet({ gameState, character, xpInfo }) {
  if (!character) return <p style={{ color: '#555', fontFamily: 'var(--font-body)' }}>Escolha uma classe primeiro.</p>

  return (
    <div>
      <p style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>FICHA DO PERSONAGEM</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p style={{ color: '#666', fontSize: 10, fontFamily: 'var(--font-body)', marginBottom: 8 }}>ATRIBUTOS</p>
          {Object.entries(character.stats).map(([stat, val]) => (
            <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #222' }}>
              <span style={{ color: '#888', fontFamily: 'var(--font-body)', fontSize: 11 }}>{statName(stat)}</span>
              <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', fontSize: 12 }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <p style={{ color: '#666', fontSize: 10, fontFamily: 'var(--font-body)', marginBottom: 8 }}>SKILLS DISPONÍVEIS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 250, overflowY: 'auto' }}>
            {getAvailableSkills(character).map(skill => (
              <div key={skill.id} style={{ padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333' }}>
                <div style={{ color: 'var(--neon-purple)', fontFamily: 'var(--font-heading)', fontSize: 11 }}>{skill.name}</div>
                <div style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: 9, marginTop: 2 }}>{skill.desc} • {skill.mpCost} MP</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ color: '#666', fontSize: 10, fontFamily: 'var(--font-body)', marginBottom: 8 }}>CLASSES ({gameState.classIds?.join(', ')})</p>
        {(gameState.classIds || []).map(id => {
          const cls = getClassById(id)
          if (!cls) return null
          return (
            <div key={id} style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', marginBottom: 6 }}>
              <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-heading)', fontSize: 13 }}>{cls.icon} {cls.name}</div>
              <div style={{ color: '#555', fontFamily: 'var(--font-body)', fontSize: 10, marginTop: 3 }}>{cls.passive}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getDungeonDesc(floor) {
  if (floor <= 5) return 'Corredores de pedra. Inimigos comuns te espreitam.'
  if (floor <= 10) return 'As paredes sangram. Criaturas mais fortes acordam.'
  if (floor <= 18) return 'Escuridão absoluta. O ar cheira a enxofre e morte.'
  if (floor <= 28) return 'Território dos antigos. Poucos chegaram aqui.'
  return 'O abismo eterno. Somente os mais fortes sobrevivem.'
}

function statName(stat) {
  const names = { str: 'Força', dex: 'Destreza', int: 'Inteligência', wis: 'Sabedoria', con: 'Constituição', cha: 'Carisma' }
  return names[stat] || stat
}

function primaryBtn(color) {
  return {
    padding: '8px 14px', cursor: 'pointer',
    background: 'rgba(0,0,0,0.5)',
    border: `1px solid ${color}`,
    color,
    fontFamily: 'var(--font-heading)',
    fontSize: 11, letterSpacing: 1,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  }
}
