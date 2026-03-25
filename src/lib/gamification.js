// Gamification system: XP, levels, rewards

// XP needed to reach next level from current level
export function xpForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.4))
}

// Total cumulative XP to reach a given level
export function totalXpForLevel(level) {
  let total = 0
  for (let i = 1; i < level; i++) total += xpForNextLevel(i)
  return total
}

// Given total XP, compute current level and progress
export function computeLevel(totalXp) {
  let level = 1
  let remaining = totalXp
  while (true) {
    const needed = xpForNextLevel(level)
    if (remaining < needed) break
    remaining -= needed
    level++
    if (level >= 200) break
  }
  return {
    level,
    currentXp: remaining,
    xpForNext: xpForNextLevel(level),
    progress: remaining / xpForNextLevel(level),
  }
}

// XP gained for completing a task
export function getTaskXp(card) {
  const priorityMult = { low: 0.8, medium: 1.0, high: 1.5, critical: 2.5 }
  const base = 50
  const mult = priorityMult[card.priority] || 1.0
  const taskBonus = (card.tasks || []).filter(t => t.done).length * 5
  return Math.round(base * mult + taskBonus)
}

// Level title brackets
export function getLevelTitle(level) {
  if (level < 5)  return 'Novato'
  if (level < 10) return 'Aventureiro'
  if (level < 20) return 'Explorador'
  if (level < 30) return 'Veterano'
  if (level < 40) return 'Elite'
  if (level < 50) return 'Especialista'
  if (level < 60) return 'Mestre'
  if (level < 75) return 'Grão-Mestre'
  if (level < 90) return 'Lendário'
  return 'Imortal'
}

// Color for level ranges
export function getLevelColor(level) {
  if (level < 10) return '#aaaaaa'
  if (level < 20) return '#44ff88'
  if (level < 30) return '#4488ff'
  if (level < 50) return '#aa44ff'
  if (level < 75) return '#ffaa00'
  return '#ff4444'
}

// Rewards unlocked at specific levels
export const LEVEL_REWARDS = {
  2:  { type: 'weapon',  id: 'steel_sword',      msg: 'Espada de Aço desbloqueada!' },
  5:  { type: 'dungeon', id: 'dungeon_access',   msg: 'DUNGEON desbloqueada! Hora de explorar...' },
  8:  { type: 'weapon',  id: 'silver_sword',     msg: 'Espada de Prata desbloqueada!' },
  10: { type: 'class',   id: 'class_2',          msg: 'Multiclasse desbloqueada! Escolha uma 2ª classe.' },
  12: { type: 'weapon',  id: 'flame_sword',      msg: 'Espada Flamejante desbloqueada!' },
  15: { type: 'title',   id: 'veteran',          msg: 'Título "Veterano" conquistado!' },
  18: { type: 'weapon',  id: 'thunder_sword',    msg: 'Espada do Trovão desbloqueada!' },
  20: { type: 'class',   id: 'class_3',          msg: 'Triple-classe desbloqueada!' },
  25: { type: 'weapon',  id: 'shadow_blade',     msg: 'Lâmina Sombria desbloqueada!' },
  30: { type: 'title',   id: 'master',           msg: 'Título "Mestre" conquistado!' },
  35: { type: 'weapon',  id: 'holy_avenger',     msg: 'Vingador Sagrado desbloqueado!' },
  40: { type: 'weapon',  id: 'void_edge',        msg: 'Borda do Vazio desbloqueada!' },
  50: { type: 'title',   id: 'legendary',        msg: 'Título "Lendário" conquistado!' },
  60: { type: 'weapon',  id: 'excalibur',        msg: 'EXCALIBUR desbloqueada! Incrível!' },
  75: { type: 'title',   id: 'grandmaster',      msg: 'Título "Grão-Mestre" conquistado!' },
  100:{ type: 'title',   id: 'immortal',         msg: 'TÍTULO SUPREMO: Imortal!' },
}

// Get all rewards for levels between oldLevel and newLevel
export function getNewRewards(oldLevel, newLevel) {
  const rewards = []
  for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
    if (LEVEL_REWARDS[lv]) rewards.push({ level: lv, ...LEVEL_REWARDS[lv] })
  }
  return rewards
}

// Stat gains per level for a class
export function getStatGainPerLevel(cls) {
  const gains = {}
  const primary = cls?.primaryStat || 'str'
  gains[primary] = 2
  // secondary stat gets +1
  const all = ['str','dex','int','wis','con','cha']
  all.filter(s => s !== primary).forEach(s => { gains[s] = 0 })
  // CON always +1 (more HP indirectly)
  gains.con = (gains.con || 0) + 1
  return gains
}

// Apply level up to character state
export function applyLevelUp(character, newLevel, cls) {
  const gains = getStatGainPerLevel(cls)
  const newStats = { ...character.stats }
  for (const [stat, val] of Object.entries(gains)) {
    newStats[stat] = (newStats[stat] || 0) + val
  }
  const hpGain = cls.hpPerLevel || 5
  const mpGain = cls.mpPerLevel || 3
  return {
    ...character,
    level: newLevel,
    stats: newStats,
    maxHp: character.maxHp + hpGain,
    hp: character.maxHp + hpGain, // full heal on level up
    maxMp: character.maxMp + mpGain,
    mp: character.maxMp + mpGain,
  }
}

// Streak bonuses: consecutive days completing tasks
export function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0
  if (streak >= 14) return 1.75
  if (streak >= 7)  return 1.5
  if (streak >= 3)  return 1.25
  return 1.0
}

// Default player game state (localStorage based, not Supabase)
export function defaultGameState() {
  return {
    totalXp: 0,
    level: 1,
    classIds: [],
    characterName: '',
    characterStats: null,
    characterMaxHp: null,
    characterHp: null,
    characterMaxMp: null,
    characterMp: null,
    equippedWeapon: null,
    unlockedWeapons: [],
    unlockedRewards: [],
    completedTasks: 0,
    streak: 0,
    lastTaskDate: null,
    dungeonFloor: 1,
    gold: 0,
    inventory: [],
    bonusDef: 0,
    bonusCrit: 0,
    bonusDodge: 0,
    bonusMagicRes: 0,
    goldBoostPct: 0,
    revealCharges: 0,
    reviveCharges: 0,
    revivePowerPct: 50,
    secretFloorKeys: 0,
    bonusClassUnlocks: 0,
    ownedShopItems: [],
  }
}

const GAME_STATE_KEY = 'cyberdaily-game-state'

export function loadGameState() {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY)
    if (raw) return { ...defaultGameState(), ...JSON.parse(raw) }
  } catch {}
  return defaultGameState()
}

export function saveGameState(state) {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
  } catch {}
}

// Award XP for completing a card, return updated state + events
export function awardTaskXp(gameState, card) {
  const baseXp = getTaskXp(card)
  const streakMult = getStreakMultiplier(gameState.streak)
  const earned = Math.round(baseXp * streakMult)

  const oldXpInfo = computeLevel(gameState.totalXp)
  const newTotalXp = gameState.totalXp + earned
  const newXpInfo = computeLevel(newTotalXp)

  const leveledUp = newXpInfo.level > oldXpInfo.level
  const rewards = leveledUp ? getNewRewards(oldXpInfo.level, newXpInfo.level) : []

  // Update streak
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let newStreak = gameState.streak
  if (gameState.lastTaskDate === yesterday) {
    newStreak = gameState.streak + 1
  } else if (gameState.lastTaskDate !== today) {
    newStreak = 1
  }

  const newState = {
    ...gameState,
    totalXp: newTotalXp,
    level: newXpInfo.level,
    completedTasks: (gameState.completedTasks || 0) + 1,
    streak: newStreak,
    lastTaskDate: today,
    unlockedRewards: [
      ...(gameState.unlockedRewards || []),
      ...rewards.map(r => r.id),
    ],
  }

  return {
    newState,
    earned,
    leveledUp,
    newLevel: newXpInfo.level,
    rewards,
    streakMult,
  }
}
