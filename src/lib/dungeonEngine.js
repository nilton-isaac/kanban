// Dungeon Combat Engine - Turn-based RPG

import { pickRandomEnemy } from '../data/enemies'
import { getAvailableSkills, getClassById } from '../data/classes'
import { WEAPONS, getLootPool } from '../data/weapons'
import { computeLevel } from './gamification'

// ─── HELPERS ──────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

// ─── CHARACTER HELPERS ─────────────────────────────────────────────────────

export function getMaxHp(character) {
  return character.maxHp
}

export function getAtk(character) {
  const base = character.stats.str * 2
  const weapon = character.equippedWeapon
  const weaponDmg = weapon ? rand(weapon.dmg[0], weapon.dmg[1]) : rand(3, 6)
  return base + weaponDmg
}

export function getDef(character) {
  const armorDef = { cloth: 2, light: 5, medium: 8, heavy: 14, plate: 18 }
  const cls = getClassById(character.classIds[0])
  return (armorDef[cls?.armor] || 5) + Math.floor(character.stats.con / 3)
}

export function getMagicPower(character) {
  return character.stats.int * 2 + character.stats.wis
}

export function getCritChance(character) {
  const base = 5
  const dexBonus = Math.floor(character.stats.dex / 2)
  const weaponBonus = character.equippedWeapon?.bonus?.crit_chance || 0
  return base + dexBonus + weaponBonus
}

// ─── ENEMY SPAWN ───────────────────────────────────────────────────────────

export function spawnEnemy(floor) {
  const template = pickRandomEnemy(floor)
  return {
    ...template,
    currentHp: rand(template.hp[0], template.hp[1]),
    maxHp: template.hp[1],
    statusEffects: [],
  }
}

// ─── DAMAGE CALCULATION ────────────────────────────────────────────────────

function calcPhysicalDamage(attacker, defender) {
  const atk = getAtk(attacker)
  const def = typeof defender.def === 'number' ? defender.def : getDef(defender)
  const isCrit = Math.random() * 100 < getCritChance(attacker)
  const base = Math.max(1, atk - def)
  return { damage: isCrit ? Math.round(base * 2) : base, isCrit }
}

function calcSkillDamage(skill, character, enemy) {
  const mult = skill.dmgMult || 1.0
  const hits = skill.hits || 1
  let baseDmg = 0

  if (skill.type === 'magic' || skill.type === 'fire' || skill.type === 'ice' ||
      skill.type === 'lightning' || skill.type === 'arcane' || skill.type === 'holy' ||
      skill.type === 'necrotic' || skill.type === 'eldritch' || skill.type === 'ki' ||
      skill.type === 'chaos' || skill.type === 'void' || skill.type === 'sonic' ||
      skill.type === 'shadow' || skill.type === 'nature' || skill.type === 'wild' ||
      skill.type === 'fel' || skill.type === 'earth' || skill.type === 'poison') {
    baseDmg = getMagicPower(character) + rand(5, 15)
  } else {
    baseDmg = getAtk(character)
  }

  // element bonus from weapon
  const weapon = character.equippedWeapon
  if (weapon?.element === skill.type) {
    const bonus = weapon.bonus?.[`${weapon.element}_dmg`] || 0
    baseDmg += Math.round(baseDmg * bonus / 100)
  }

  // weakness/resistance
  let totalMult = mult
  if (enemy.weak?.includes(skill.type)) totalMult *= 1.5
  if (enemy.resist?.includes(skill.type)) totalMult *= 0.5

  const totalDmg = Math.max(1, Math.round(baseDmg * totalMult)) * hits
  return { damage: totalDmg, hits, mult: totalMult, isCrit: false }
}

// ─── STATUS EFFECTS ────────────────────────────────────────────────────────

export function applyStatusEffect(target, effect, value, turns) {
  const existing = target.statusEffects.find(e => e.id === effect)
  if (existing) {
    existing.turns = Math.max(existing.turns, turns || 3)
    return target
  }
  return {
    ...target,
    statusEffects: [
      ...(target.statusEffects || []),
      { id: effect, value: value || 0, turns: turns || 3 }
    ]
  }
}

export function tickStatusEffects(target) {
  const events = []
  let hp = target.currentHp
  const effects = (target.statusEffects || [])
    .map(e => {
      const updated = { ...e, turns: e.turns - 1 }
      if (e.id === 'poison' || e.id === 'burn' || e.id === 'bleed') {
        hp -= e.value || 10
        events.push({ type: 'dot', effect: e.id, damage: e.value || 10 })
      }
      if (e.id === 'regen') {
        hp += e.value || 10
        events.push({ type: 'heal', effect: e.id, amount: e.value || 10 })
      }
      return updated
    })
    .filter(e => e.turns > 0)

  return {
    target: { ...target, currentHp: hp, statusEffects: effects },
    events,
  }
}

// ─── ENEMY AI ─────────────────────────────────────────────────────────────

function enemyAction(enemy, character) {
  const atk = rand(enemy.atk[0], enemy.atk[1])
  const def = getDef(character)
  const isCrit = Math.random() < 0.08

  // Use special ability sometimes
  const useSpecial = enemy.special && Math.random() < 0.25

  if (useSpecial) {
    return {
      type: 'special',
      ability: enemy.special,
      damage: Math.max(1, Math.round(atk * 1.4) - def),
      isCrit: false,
    }
  }

  return {
    type: 'attack',
    damage: isCrit ? Math.max(1, Math.round(atk * 1.8) - def) : Math.max(1, atk - def),
    isCrit,
  }
}

// ─── FLEE CHANCE ──────────────────────────────────────────────────────────

export function calcFleeChance(character, enemy) {
  const playerSpd = character.stats.dex
  const enemyTier = enemy.tier || 1
  return clamp(40 + playerSpd * 2 - enemyTier * 10, 10, 90)
}

// ─── LOOT GENERATION ──────────────────────────────────────────────────────

function generateLoot(enemy, floor) {
  const loot = []

  // Gold
  const gold = rand(enemy.gold[0], enemy.gold[1])
  if (gold > 0) loot.push({ type: 'gold', amount: gold })

  // Weapon drop (rare)
  const weaponDropChance = 0.08 + (enemy.tier - 1) * 0.04
  if (Math.random() < weaponDropChance) {
    const pool = getLootPool(floor)
    if (pool.length > 0) {
      loot.push({ type: 'weapon', weapon: randFrom(pool) })
    }
  }

  // Potion drop
  if (Math.random() < 0.3) {
    loot.push({ type: 'potion', potionType: 'health', amount: rand(20, 50) })
  }

  return loot
}

// ─── MAIN COMBAT PROCESSOR ────────────────────────────────────────────────

// Process a single player action, returns new state + log entry
export function processPlayerAction(action, character, enemy, gameState) {
  let newCharacter = { ...character, statusEffects: [...(character.statusEffects || [])] }
  let newEnemy = { ...enemy, statusEffects: [...(enemy.statusEffects || [])] }
  let log = []
  let result = null // 'win' | 'lose' | 'flee' | null

  // ── Player turn ──
  if (action.type === 'attack') {
    const { damage, isCrit } = calcPhysicalDamage(newCharacter, newEnemy)
    newEnemy.currentHp -= damage
    log.push({
      actor: 'player',
      text: isCrit
        ? `⚔️ CRÍTICO! Você ataca ${enemy.name} por ${damage} de dano!`
        : `⚔️ Você ataca ${enemy.name} por ${damage} de dano.`,
      damage,
      isCrit,
    })
  } else if (action.type === 'skill') {
    const skill = action.skill
    if ((newCharacter.mp || 0) < skill.mpCost) {
      log.push({ actor: 'player', text: '❌ MP insuficiente!', error: true })
      // skip turn
    } else {
      newCharacter.mp = (newCharacter.mp || 0) - skill.mpCost

      if (skill.type === 'heal') {
        const healAmt = Math.round((newCharacter.maxHp || 30) * (skill.healPct || 0.3))
        newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + healAmt)
        log.push({ actor: 'player', text: `✨ ${skill.name}: Você se cura por ${healAmt} HP!`, heal: healAmt })
      } else if (skill.target === 'self' && skill.type === 'buff') {
        // Apply buff
        newCharacter = applyStatusEffect(newCharacter, skill.effect, 0, 3)
        log.push({ actor: 'player', text: `✨ ${skill.name}: Buff ativado!` })
      } else if (skill.target === 'enemy') {
        // Condition check
        let conditionMet = true
        if (skill.condition === 'enemy_low' && newEnemy.currentHp / newEnemy.maxHp > 0.25) conditionMet = false
        if (skill.condition === 'frozen_target' && !newEnemy.statusEffects?.some(e => e.id === 'freeze')) conditionMet = false
        if (skill.condition === 'undead_target' && enemy.category !== 'undead') skill.dmgMult = (skill.dmgMult || 1) * 0.5
        if (skill.condition === 'evil_target' && !['undead','demon'].includes(enemy.category)) skill.dmgMult = (skill.dmgMult || 1) * 0.5
        if (skill.condition === 'first_attack') conditionMet = action.isFirstAttack !== false

        const { damage } = calcSkillDamage(skill, newCharacter, newEnemy)
        newEnemy.currentHp -= damage

        // Apply debuffs
        if (skill.effect && ['poison','burn','freeze','stun','blind','silence','root','confuse','hex','poison','deadly_poison'].includes(skill.effect)) {
          const dotDmg = skill.type === 'poison' || skill.effect?.includes('poison') ? 15 : 10
          newEnemy = applyStatusEffect(newEnemy, skill.effect, dotDmg, skill.turns || 3)
        }

        // Lifesteal
        if (skill.lifesteal) {
          const healed = Math.round(damage * skill.lifesteal)
          newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + healed)
        }

        log.push({
          actor: 'player',
          text: `✨ ${skill.name}: ${damage} de dano em ${enemy.name}!`,
          damage,
          skillType: skill.type,
        })
      } else if (skill.type === 'debuff') {
        newEnemy = applyStatusEffect(newEnemy, skill.effect, 0, skill.turns || 3)
        log.push({ actor: 'player', text: `💫 ${skill.name}: Debuff aplicado em ${enemy.name}!` })
      }
    }
  } else if (action.type === 'item') {
    const item = action.item
    if (item.potionType === 'health') {
      newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + item.amount)
      log.push({ actor: 'player', text: `🧪 Poção usada: +${item.amount} HP`, heal: item.amount })
    }
  } else if (action.type === 'flee') {
    const chance = calcFleeChance(newCharacter, enemy)
    if (Math.random() * 100 < chance) {
      log.push({ actor: 'player', text: `🏃 Você fugiu com sucesso!` })
      result = 'flee'
      return { character: newCharacter, enemy: newEnemy, log, result, loot: [] }
    } else {
      log.push({ actor: 'player', text: `❌ Tentativa de fuga falhou!` })
    }
  }

  // Check if enemy died
  if (newEnemy.currentHp <= 0) {
    newEnemy.currentHp = 0
    const loot = generateLoot(newEnemy, gameState?.dungeonFloor || 1)
    const xpGained = rand(newEnemy.xp[0], newEnemy.xp[1])
    log.push({ actor: 'system', text: `💀 ${enemy.name} foi derrotado!`, victory: true })
    loot.forEach(l => {
      if (l.type === 'gold') log.push({ actor: 'system', text: `💰 Ouro obtido: ${l.amount}` })
      if (l.type === 'weapon') log.push({ actor: 'system', text: `⚔️ Item encontrado: ${l.weapon.name}!`, item: l.weapon })
      if (l.type === 'potion') log.push({ actor: 'system', text: `🧪 Poção encontrada: +${l.amount} HP` })
    })
    return { character: newCharacter, enemy: newEnemy, log, result: 'win', loot, xpGained }
  }

  // ── Tick player status effects ──
  const playerTick = tickStatusEffects(newCharacter)
  newCharacter = { ...playerTick.target }
  playerTick.events.forEach(e => {
    if (e.type === 'dot') log.push({ actor: 'player', text: `🩸 ${e.effect}: -${e.damage} HP`, damage: e.damage })
    if (e.type === 'heal') log.push({ actor: 'player', text: `💚 Regen: +${e.amount} HP`, heal: e.amount })
  })

  // ── Tick enemy status effects ──
  const enemyTick = tickStatusEffects(newEnemy)
  newEnemy = { ...enemyTick.target }
  enemyTick.events.forEach(e => {
    if (e.type === 'dot') log.push({ actor: 'enemy', text: `🩸 ${enemy.name} sofre ${e.damage} de ${e.effect}`, damage: e.damage })
  })

  // Check if enemy died from DoT
  if (newEnemy.currentHp <= 0) {
    newEnemy.currentHp = 0
    const loot = generateLoot(newEnemy, gameState?.dungeonFloor || 1)
    const xpGained = rand(newEnemy.xp[0], newEnemy.xp[1])
    log.push({ actor: 'system', text: `💀 ${enemy.name} foi derrotado pelo efeito!`, victory: true })
    return { character: newCharacter, enemy: newEnemy, log, result: 'win', loot, xpGained }
  }

  // Check if player is stunned
  const stunned = newEnemy.statusEffects?.some(e => e.id === 'stun')

  if (!stunned) {
    // ── Enemy turn ──
    const eAction = enemyAction(newEnemy, newCharacter)

    if (eAction.type === 'special') {
      newCharacter.currentHp = (newCharacter.currentHp || newCharacter.maxHp) - eAction.damage
      log.push({
        actor: 'enemy',
        text: `💥 ${enemy.name} usa ${formatSpecialName(eAction.ability)}! ${eAction.damage} de dano!`,
        damage: eAction.damage,
        special: true,
      })
    } else {
      newCharacter.currentHp = (newCharacter.currentHp || newCharacter.maxHp) - eAction.damage
      log.push({
        actor: 'enemy',
        text: eAction.isCrit
          ? `⚡ CRÍTICO! ${enemy.name} ataca por ${eAction.damage} de dano!`
          : `🗡️ ${enemy.name} ataca por ${eAction.damage} de dano.`,
        damage: eAction.damage,
        isCrit: eAction.isCrit,
      })
    }
  } else {
    log.push({ actor: 'enemy', text: `😵 ${enemy.name} está atordoado e perde o turno!` })
  }

  // Check player death
  if ((newCharacter.currentHp || 0) <= 0) {
    newCharacter.currentHp = 0
    log.push({ actor: 'system', text: `💀 Você foi derrotado...`, defeat: true })
    return { character: newCharacter, enemy: newEnemy, log, result: 'lose', loot: [] }
  }

  return { character: newCharacter, enemy: newEnemy, log, result: null, loot: [] }
}

function formatSpecialName(id) {
  if (!id) return 'Habilidade Especial'
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Apply loot to game state
export function applyLoot(gameState, loot) {
  let newState = { ...gameState }
  for (const item of loot) {
    if (item.type === 'gold') {
      newState.gold = (newState.gold || 0) + item.amount
    } else if (item.type === 'weapon') {
      const already = newState.inventory?.some(i => i.id === item.weapon.id)
      if (!already) {
        newState.inventory = [...(newState.inventory || []), item.weapon]
      }
    } else if (item.type === 'potion') {
      newState.inventory = [...(newState.inventory || []), { type: 'potion', potionType: 'health', amount: item.amount, id: `potion_${Date.now()}` }]
    }
  }
  return newState
}

// Initialize a dungeon run
export function startDungeonRun(character, floor) {
  const enemy = spawnEnemy(floor)
  return {
    active: true,
    enemy,
    character: {
      ...character,
      currentHp: character.hp,
      statusEffects: [],
    },
    floor,
    turn: 1,
    log: [
      { actor: 'system', text: `⚔️ Andar ${floor} — ${enemy.name} aparece!`, encounter: true },
      { actor: 'system', text: enemy.desc, flavor: true },
    ],
    finished: false,
    result: null,
  }
}
