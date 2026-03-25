// Dungeon Combat Engine - Turn-based RPG

import { pickRandomEnemy } from '../data/enemies'
import { getClassById, getSkillById } from '../data/classes'
import { getLootPool } from '../data/weapons'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function hasEffect(target, effectId) {
  return target.statusEffects?.some(effect => effect.id === effectId)
}

function getEffectValue(target, effectId) {
  return target.statusEffects?.find(effect => effect.id === effectId)?.value || 0
}

export function getMaxHp(character) {
  return character.maxHp
}

export function getAtk(character) {
  const base = character.stats.str * 2
  const weapon = character.equippedWeapon
  const weaponDmg = weapon ? rand(weapon.dmg[0], weapon.dmg[1]) : rand(3, 6)
  let total = base + weaponDmg

  if (hasEffect(character, 'atk_up')) total *= 1 + (getEffectValue(character, 'atk_up') || 30) / 100
  if (hasEffect(character, 'rage')) total *= 1.6
  if (hasEffect(character, 'war_fury')) total *= 1.5
  if (hasEffect(character, 'bloodlust')) total *= 1.4
  if (hasEffect(character, 'all_up')) total *= 1.25
  if (hasEffect(character, 'bless')) total *= 1.2

  return Math.round(total)
}

export function getDef(character) {
  const armorDef = { cloth: 2, light: 5, medium: 8, heavy: 14, plate: 18 }
  const cls = getClassById(character.classIds[0])
  let total = (armorDef[cls?.armor] || 5) + Math.floor(character.stats.con / 3) + (character.bonusDef || 0)

  if (hasEffect(character, 'def_up')) total *= 1 + (getEffectValue(character, 'def_up') || 30) / 100
  if (hasEffect(character, 'bless')) total *= 1.2
  if (hasEffect(character, 'all_up')) total *= 1.25
  if (hasEffect(character, 'shadow_armor')) total *= 1.6
  if (hasEffect(character, 'ice_armor')) total *= 1.7
  if (hasEffect(character, 'fortify')) total *= 1.8
  if (hasEffect(character, 'rage')) total *= 0.8

  return Math.round(total)
}

export function getMagicPower(character) {
  let total = character.stats.int * 2 + character.stats.wis
  if (hasEffect(character, 'all_up')) total *= 1.25
  return Math.round(total)
}

export function getCritChance(character) {
  const base = 5
  const dexBonus = Math.floor(character.stats.dex / 2)
  const weaponBonus = character.equippedWeapon?.bonus?.crit_chance || 0
  const statusBonus = hasEffect(character, 'eagle_eye') ? 100 : 0
  return base + dexBonus + weaponBonus + (character.bonusCrit || 0) + statusBonus
}

export function spawnEnemy(floor) {
  const template = pickRandomEnemy(floor)
  return {
    ...template,
    currentHp: rand(template.hp[0], template.hp[1]),
    maxHp: template.hp[1],
    statusEffects: [],
  }
}

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

  if ([
    'magic', 'fire', 'ice', 'lightning', 'arcane', 'holy', 'necrotic', 'eldritch',
    'ki', 'chaos', 'void', 'sonic', 'shadow', 'nature', 'wild', 'fel', 'earth',
    'poison', 'acid',
  ].includes(skill.type)) {
    baseDmg = getMagicPower(character) + rand(5, 15)
  } else {
    baseDmg = getAtk(character)
  }

  const weapon = character.equippedWeapon
  if (weapon?.element === skill.type) {
    const bonus = weapon.bonus?.[`${weapon.element}_dmg`] || 0
    baseDmg += Math.round(baseDmg * bonus / 100)
  }

  let totalMult = mult
  if (enemy.weak?.includes(skill.type)) totalMult *= 1.5
  if (enemy.resist?.includes(skill.type)) totalMult *= 0.5

  return {
    damage: Math.max(1, Math.round(baseDmg * totalMult)) * hits,
    hits,
    mult: totalMult,
    isCrit: false,
  }
}

export function applyStatusEffect(target, effect, value, turns) {
  const existing = (target.statusEffects || []).find(entry => entry.id === effect)
  if (existing) {
    existing.turns = Math.max(existing.turns, turns || 3)
    existing.value = Math.max(existing.value || 0, value || 0)
    return target
  }

  return {
    ...target,
    statusEffects: [
      ...(target.statusEffects || []),
      { id: effect, value: value || 0, turns: turns || 3 },
    ],
  }
}

export function tickStatusEffects(target) {
  const events = []
  let hp = target.currentHp
  const effects = (target.statusEffects || [])
    .map(effect => {
      const updated = { ...effect, turns: effect.turns - 1 }
      if (['poison', 'burn', 'bleed', 'deadly_poison'].includes(effect.id)) {
        hp -= effect.value || 10
        events.push({ type: 'dot', effect: effect.id, damage: effect.value || 10 })
      }
      if (effect.id === 'regen') {
        hp += effect.value || 10
        events.push({ type: 'heal', effect: effect.id, amount: effect.value || 10 })
      }
      return updated
    })
    .filter(effect => effect.turns > 0)

  return {
    target: { ...target, currentHp: hp, statusEffects: effects },
    events,
  }
}

function enemyAction(enemy, character) {
  const atk = rand(enemy.atk[0], enemy.atk[1])
  const def = getDef(character)
  const isCrit = Math.random() < 0.08
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

export function calcFleeChance(character, enemy) {
  const playerSpd = character.stats.dex
  const enemyTier = enemy.tier || 1
  return clamp(40 + playerSpd * 2 - enemyTier * 10, 10, 90)
}

function generateLoot(enemy, floorMeta) {
  const loot = []
  const floor = typeof floorMeta === 'number' ? floorMeta : floorMeta?.value || 1
  const gameState = typeof floorMeta === 'number' ? null : floorMeta?.gameState

  const gold = Math.round(rand(enemy.gold[0], enemy.gold[1]) * (1 + ((gameState?.goldBoostPct || 0) / 100)))
  if (gold > 0) loot.push({ type: 'gold', amount: gold })

  const weaponDropChance = 0.08 + (enemy.tier - 1) * 0.04
  if (Math.random() < weaponDropChance) {
    const pool = getLootPool(floor)
    if (pool.length > 0) loot.push({ type: 'weapon', weapon: randFrom(pool) })
  }

  if (Math.random() < 0.3) {
    loot.push({ type: 'potion', potionType: 'health', amount: rand(20, 50) })
  }

  return loot
}

function resolveItemUse(item, character, enemy, log) {
  let newCharacter = character
  let newEnemy = enemy
  let consumed = true
  let forcedResult = null

  if (item.effect === 'heal_hp' || item.potionType === 'health') {
    const amount = item.value || item.amount || 30
    newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + amount)
    log.push({ actor: 'player', text: `${item.name || 'Pocao'}: +${amount} HP`, heal: amount })
  } else if (item.effect === 'heal_full') {
    newCharacter.currentHp = newCharacter.maxHp
    log.push({ actor: 'player', text: `${item.name}: HP restaurado completamente!` })
  } else if (item.effect === 'heal_mp' || item.effect === 'mp_full') {
    const amount = item.effect === 'mp_full' ? newCharacter.maxMp : (item.value || 20)
    newCharacter.mp = Math.min(newCharacter.maxMp, (newCharacter.mp || 0) + amount)
    log.push({ actor: 'player', text: `${item.name}: MP restaurado!` })
  } else if (item.effect === 'heal_both') {
    newCharacter.currentHp = newCharacter.maxHp
    newCharacter.mp = newCharacter.maxMp
    newCharacter.statusEffects = []
    log.push({ actor: 'player', text: `${item.name}: HP e MP restaurados!` })
  } else if (item.effect === 'cleanse') {
    newCharacter.statusEffects = []
    log.push({ actor: 'player', text: `${item.name}: efeitos negativos removidos!` })
  } else if (item.effect === 'buff_atk') {
    newCharacter = applyStatusEffect(newCharacter, 'atk_up', item.value || 30, 3)
    log.push({ actor: 'player', text: `${item.name}: ataque aumentado!` })
  } else if (item.effect === 'buff_def') {
    newCharacter = applyStatusEffect(newCharacter, 'def_up', item.value || 30, 3)
    log.push({ actor: 'player', text: `${item.name}: defesa aumentada!` })
  } else if (item.effect === 'buff_dex') {
    newCharacter = applyStatusEffect(newCharacter, 'all_up', Math.round((item.value || 40) / 2), 3)
    newCharacter = applyStatusEffect(newCharacter, 'dodge', 40, 1)
    log.push({ actor: 'player', text: `${item.name}: reflexos aprimorados!` })
  } else if (item.effect === 'buff_berserk') {
    newCharacter = applyStatusEffect(newCharacter, 'rage', 60, 4)
    log.push({ actor: 'player', text: `${item.name}: furia ativada!` })
  } else if (item.effect === 'buff_dodge') {
    newCharacter = applyStatusEffect(newCharacter, 'dodge', 100, 1)
    log.push({ actor: 'player', text: `${item.name}: proximo ataque sera evitado!` })
  } else if (item.effect === 'buff_all') {
    newCharacter = applyStatusEffect(newCharacter, 'all_up', item.value || 25, 5)
    log.push({ actor: 'player', text: `${item.name}: todos os atributos aumentados!` })
  } else if (item.effect === 'debuff') {
    newEnemy = applyStatusEffect(newEnemy, item.debuff, 0, item.turns || 2)
    log.push({ actor: 'player', text: `${item.name}: ${formatSpecialName(item.debuff)} aplicado!` })
  } else if (item.effect === 'insta_kill') {
    const success = enemy.category !== 'boss' && Math.random() < (item.chance || 0.7)
    if (success) {
      newEnemy.currentHp = 0
      log.push({ actor: 'player', text: `${item.name}: ${enemy.name} foi obliterado!` })
    } else {
      consumed = false
      log.push({ actor: 'player', text: `${item.name} falhou!`, error: true })
    }
  } else if (item.effect === 'flee_sure') {
    log.push({ actor: 'player', text: `${item.name}: fuga garantida!` })
    forcedResult = 'flee'
  } else if (item.effect === 'skill_once') {
    const skill = getSkillById(item.skillId)
    if (!skill) {
      consumed = false
      log.push({ actor: 'player', text: `${item.name}: feitico indisponivel.`, error: true })
    } else {
      const { damage } = calcSkillDamage(skill, newCharacter, newEnemy)
      newEnemy.currentHp -= damage
      log.push({ actor: 'player', text: `${item.name}: ${skill.name} causa ${damage} de dano!`, damage })
    }
  } else if (item.effect === 'summon') {
    const damage = rand(18, 32) + Math.round(getMagicPower(newCharacter) * 0.7)
    newEnemy.currentHp -= damage
    newCharacter = applyStatusEffect(newCharacter, 'all_up', 15, 2)
    log.push({ actor: 'player', text: `${item.name}: aliado invocado causa ${damage} de dano!`, damage })
  } else if (item.effect === 'copy_skill') {
    const damage = rand(Math.max(4, enemy.atk[0]), Math.max(8, enemy.atk[1])) * 2
    newEnemy.currentHp -= damage
    log.push({ actor: 'player', text: `${item.name}: voce copia o inimigo e causa ${damage} de dano!`, damage })
  } else {
    consumed = false
    log.push({ actor: 'player', text: `${item.name || 'Item'} nao pode ser usado agora.`, error: true })
  }

  return { character: newCharacter, enemy: newEnemy, consumed, forcedResult }
}

export function processPlayerAction(action, character, enemy, gameState) {
  let newCharacter = { ...character, statusEffects: [...(character.statusEffects || [])] }
  let newEnemy = { ...enemy, statusEffects: [...(enemy.statusEffects || [])] }
  const log = []
  const extra = {}

  if (action.type === 'attack') {
    const { damage, isCrit } = calcPhysicalDamage(newCharacter, newEnemy)
    newEnemy.currentHp -= damage
    log.push({
      actor: 'player',
      text: isCrit
        ? `CRITICO! Voce ataca ${enemy.name} por ${damage} de dano!`
        : `Voce ataca ${enemy.name} por ${damage} de dano.`,
      damage,
      isCrit,
    })
  } else if (action.type === 'skill') {
    const skill = action.skill
    if ((newCharacter.mp || 0) < skill.mpCost) {
      log.push({ actor: 'player', text: 'MP insuficiente!', error: true })
    } else {
      newCharacter.mp = (newCharacter.mp || 0) - skill.mpCost

      if (skill.type === 'heal') {
        const healAmt = Math.round((newCharacter.maxHp || 30) * (skill.healPct || 0.3))
        newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + healAmt)
        if (skill.cleanse) newCharacter.statusEffects = []
        if (skill.effect === 'regen') newCharacter = applyStatusEffect(newCharacter, 'regen', 20, 3)
        log.push({ actor: 'player', text: `${skill.name}: voce se cura por ${healAmt} HP!`, heal: healAmt })
      } else if (skill.target === 'self' && skill.type === 'buff') {
        newCharacter = applyStatusEffect(newCharacter, skill.effect, 0, skill.turns || 3)
        log.push({ actor: 'player', text: `${skill.name}: buff ativado!` })
      } else if (skill.target === 'enemy') {
        if (skill.condition === 'enemy_low' && newEnemy.currentHp / newEnemy.maxHp > 0.25) {
          log.push({ actor: 'player', text: `${skill.name} nao pode ser usado ainda.`, error: true })
        } else if (skill.condition === 'frozen_target' && !newEnemy.statusEffects?.some(effect => effect.id === 'freeze')) {
          log.push({ actor: 'player', text: `${skill.name} requer um alvo congelado.`, error: true })
        } else {
          const tunedSkill = { ...skill }
          if (skill.condition === 'undead_target' && enemy.category !== 'undead') tunedSkill.dmgMult = (skill.dmgMult || 1) * 0.5
          if (skill.condition === 'evil_target' && !['undead', 'demon'].includes(enemy.category)) tunedSkill.dmgMult = (skill.dmgMult || 1) * 0.5
          const { damage } = calcSkillDamage(tunedSkill, newCharacter, newEnemy)
          newEnemy.currentHp -= damage

          if (skill.effect && ['poison', 'burn', 'freeze', 'stun', 'blind', 'silence', 'root', 'confuse', 'hex', 'deadly_poison'].includes(skill.effect)) {
            const dotDmg = skill.type === 'poison' || skill.effect?.includes('poison') ? 15 : 10
            newEnemy = applyStatusEffect(newEnemy, skill.effect, dotDmg, skill.turns || 3)
          }

          if (skill.lifesteal) {
            const healed = Math.round(damage * skill.lifesteal)
            newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + healed)
          }

          if (skill.healPct) {
            const selfHeal = Math.round(newCharacter.maxHp * skill.healPct)
            newCharacter.currentHp = Math.min(newCharacter.maxHp, (newCharacter.currentHp || 0) + selfHeal)
          }

          log.push({
            actor: 'player',
            text: `${skill.name}: ${damage} de dano em ${enemy.name}!`,
            damage,
            skillType: skill.type,
          })
        }
      } else if (skill.type === 'debuff') {
        newEnemy = applyStatusEffect(newEnemy, skill.effect, 0, skill.turns || 3)
        log.push({ actor: 'player', text: `${skill.name}: debuff aplicado em ${enemy.name}!` })
      }
    }
  } else if (action.type === 'item') {
    const used = resolveItemUse(action.item, newCharacter, newEnemy, log)
    newCharacter = used.character
    newEnemy = used.enemy
    if (used.consumed) extra.consumeItem = true
    if (used.forcedResult) return { character: newCharacter, enemy: newEnemy, log, result: used.forcedResult, loot: [], ...extra }
  } else if (action.type === 'flee') {
    const chance = calcFleeChance(newCharacter, enemy)
    if (Math.random() * 100 < chance) {
      log.push({ actor: 'player', text: 'Voce fugiu com sucesso!' })
      return { character: newCharacter, enemy: newEnemy, log, result: 'flee', loot: [], ...extra }
    }
    log.push({ actor: 'player', text: 'Tentativa de fuga falhou!' })
  }

  if (newEnemy.currentHp <= 0) {
    newEnemy.currentHp = 0
    const loot = generateLoot(newEnemy, { value: gameState?.dungeonFloor || 1, gameState })
    const xpGained = rand(newEnemy.xp[0], newEnemy.xp[1])
    log.push({ actor: 'system', text: `${enemy.name} foi derrotado!`, victory: true })
    loot.forEach(entry => {
      if (entry.type === 'gold') log.push({ actor: 'system', text: `Ouro obtido: ${entry.amount}` })
      if (entry.type === 'weapon') log.push({ actor: 'system', text: `Item encontrado: ${entry.weapon.name}!`, item: entry.weapon })
      if (entry.type === 'potion') log.push({ actor: 'system', text: `Pocao encontrada: +${entry.amount} HP` })
    })
    return { character: newCharacter, enemy: newEnemy, log, result: 'win', loot, xpGained, ...extra }
  }

  const playerTick = tickStatusEffects(newCharacter)
  newCharacter = { ...playerTick.target }
  playerTick.events.forEach(entry => {
    if (entry.type === 'dot') log.push({ actor: 'player', text: `${entry.effect}: -${entry.damage} HP`, damage: entry.damage })
    if (entry.type === 'heal') log.push({ actor: 'player', text: `Regen: +${entry.amount} HP`, heal: entry.amount })
  })

  const enemyTick = tickStatusEffects(newEnemy)
  newEnemy = { ...enemyTick.target }
  enemyTick.events.forEach(entry => {
    if (entry.type === 'dot') log.push({ actor: 'enemy', text: `${enemy.name} sofre ${entry.damage} de ${entry.effect}`, damage: entry.damage })
  })

  if (newEnemy.currentHp <= 0) {
    newEnemy.currentHp = 0
    const loot = generateLoot(newEnemy, { value: gameState?.dungeonFloor || 1, gameState })
    const xpGained = rand(newEnemy.xp[0], newEnemy.xp[1])
    log.push({ actor: 'system', text: `${enemy.name} foi derrotado pelo efeito!`, victory: true })
    return { character: newCharacter, enemy: newEnemy, log, result: 'win', loot, xpGained, ...extra }
  }

  const stunned = newEnemy.statusEffects?.some(effect => effect.id === 'stun')
  if (!stunned) {
    const eAction = enemyAction(newEnemy, newCharacter)
    let incomingDamage = eAction.damage
    const dodgeChance = (newCharacter.bonusDodge || 0) + getEffectValue(newCharacter, 'dodge')
    const dodged = hasEffect(newCharacter, 'immunity')
      || hasEffect(newCharacter, 'ethereal')
      || dodgeChance >= 100
      || (dodgeChance > 0 && Math.random() * 100 < dodgeChance)

    if (dodged) {
      newCharacter.statusEffects = (newCharacter.statusEffects || []).filter(effect => effect.id !== 'dodge')
      log.push({ actor: 'player', text: 'Voce evitou completamente o ataque!' })
    } else if (eAction.type === 'special') {
      incomingDamage = Math.max(1, Math.round(incomingDamage * (1 - ((newCharacter.bonusMagicRes || 0) / 100))))
      newCharacter.currentHp = (newCharacter.currentHp || newCharacter.maxHp) - incomingDamage
      log.push({
        actor: 'enemy',
        text: `${enemy.name} usa ${formatSpecialName(eAction.ability)}! ${incomingDamage} de dano!`,
        damage: incomingDamage,
        special: true,
      })
    } else {
      newCharacter.currentHp = (newCharacter.currentHp || newCharacter.maxHp) - incomingDamage
      log.push({
        actor: 'enemy',
        text: eAction.isCrit
          ? `CRITICO! ${enemy.name} ataca por ${incomingDamage} de dano!`
          : `${enemy.name} ataca por ${incomingDamage} de dano.`,
        damage: incomingDamage,
        isCrit: eAction.isCrit,
      })
    }
  } else {
    log.push({ actor: 'enemy', text: `${enemy.name} esta atordoado e perde o turno!` })
  }

  if ((newCharacter.currentHp || 0) <= 0) {
    newCharacter.currentHp = 0
    log.push({ actor: 'system', text: 'Voce foi derrotado...', defeat: true })
    return { character: newCharacter, enemy: newEnemy, log, result: 'lose', loot: [], ...extra }
  }

  return { character: newCharacter, enemy: newEnemy, log, result: null, loot: [], ...extra }
}

function formatSpecialName(id) {
  if (!id) return 'Habilidade Especial'
  return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function applyLoot(gameState, loot) {
  let newState = { ...gameState }
  for (const item of loot) {
    if (item.type === 'gold') {
      newState.gold = (newState.gold || 0) + item.amount
    } else if (item.type === 'weapon') {
      const already = newState.inventory?.some(entry => entry.id === item.weapon.id)
      if (!already) newState.inventory = [...(newState.inventory || []), item.weapon]
    } else if (item.type === 'potion') {
      newState.inventory = [
        ...(newState.inventory || []),
        {
          id: `potion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          uid: `potion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: 'Pocao de Cura',
          type: 'potion',
          potionType: 'health',
          effect: 'heal_hp',
          amount: item.amount,
          value: item.amount,
        },
      ]
    }
  }
  return newState
}

export function startDungeonRun(character, floor) {
  const enemy = spawnEnemy(floor)
  return {
    active: true,
    enemy,
    character: {
      ...character,
      currentHp: character.currentHp ?? character.hp,
      currentMp: character.currentMp ?? character.mp,
      statusEffects: [],
    },
    floor,
    turn: 1,
    log: [
      { actor: 'system', text: `Andar ${floor} - ${enemy.name} aparece!`, encounter: true },
      { actor: 'system', text: enemy.desc, flavor: true },
    ],
    finished: false,
    result: null,
  }
}
