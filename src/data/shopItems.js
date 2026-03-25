// Shop catalog: everything the player can buy with gold
// Categories: weapon, potion, scroll, armor, accessory, special

import { RARITY_COLORS, RARITY_LABELS } from './weapons'

export const SHOP_CATEGORIES = {
  weapon:    { label: '⚔️ Armas',       color: 'var(--neon-cyan)' },
  potion:    { label: '🧪 Poções',      color: 'var(--neon-green)' },
  scroll:    { label: '📜 Pergaminhos', color: 'var(--neon-purple)' },
  armor:     { label: '🛡️ Armaduras',  color: 'var(--neon-yellow)' },
  accessory: { label: '💍 Acessórios',  color: 'var(--neon-pink)' },
  special:   { label: '✨ Especiais',   color: 'var(--neon-orange)' },
}

// ─── POTIONS ──────────────────────────────────────────────────────────────
export const POTIONS = [
  { id:'pot_hp_sm',    name:'Poção de Cura Menor',    category:'potion', icon:'🧪', price:30,   desc:'Restaura 30 HP.',           effect:'heal_hp', value:30,   rarity:'common'   },
  { id:'pot_hp_med',   name:'Poção de Cura Média',    category:'potion', icon:'🧪', price:80,   desc:'Restaura 80 HP.',           effect:'heal_hp', value:80,   rarity:'common'   },
  { id:'pot_hp_lg',    name:'Poção de Cura Maior',    category:'potion', icon:'🧪', price:180,  desc:'Restaura 200 HP.',          effect:'heal_hp', value:200,  rarity:'uncommon' },
  { id:'pot_hp_max',   name:'Élixi de Vida',          category:'potion', icon:'✨', price:500,  desc:'Restaura HP ao máximo.',    effect:'heal_full',value:1,   rarity:'rare'     },
  { id:'pot_mp_sm',    name:'Poção de Mana Menor',    category:'potion', icon:'💧', price:35,   desc:'Restaura 20 MP.',           effect:'heal_mp', value:20,   rarity:'common'   },
  { id:'pot_mp_med',   name:'Poção de Mana Média',    category:'potion', icon:'💧', price:100,  desc:'Restaura 60 MP.',           effect:'heal_mp', value:60,   rarity:'uncommon' },
  { id:'pot_mp_max',   name:'Néctar Arcano',          category:'potion', icon:'💠', price:450,  desc:'Restaura MP ao máximo.',    effect:'mp_full',  value:1,   rarity:'rare'     },
  { id:'pot_antidote', name:'Antídoto',               category:'potion', icon:'💊', price:40,   desc:'Remove veneno e queimadura.',effect:'cleanse', value:0,   rarity:'common'   },
  { id:'pot_strength', name:'Poção de Força',         category:'potion', icon:'💪', price:150,  desc:'+30% ATK por 3 turnos.',    effect:'buff_atk', value:30,  rarity:'uncommon' },
  { id:'pot_shield',   name:'Poção de Escudo',        category:'potion', icon:'🛡️',price:150,  desc:'+30% DEF por 3 turnos.',    effect:'buff_def', value:30,  rarity:'uncommon' },
  { id:'pot_speed',    name:'Poção de Velocidade',    category:'potion', icon:'⚡', price:200,  desc:'+40% DEX e age primeiro.',  effect:'buff_dex', value:40,  rarity:'uncommon' },
  { id:'pot_berserk',  name:'Poção Berserker',        category:'potion', icon:'🔥', price:300,  desc:'+60% ATK, -20% DEF por 4t.',effect:'buff_berserk',value:0,rarity:'rare'   },
  { id:'pot_invis',    name:'Poção de Invisibilidade',category:'potion', icon:'👻', price:350,  desc:'Garante esquiva do próximo ataque.',effect:'buff_dodge',value:0,rarity:'rare'},
  { id:'pot_elixir',   name:'Grande Elixir',          category:'potion', icon:'🌟', price:800,  desc:'Cura HP e MP completamente.', effect:'heal_both',value:1,  rarity:'epic'    },
  { id:'pot_philo',    name:'Pedra Filosofal Líquida',category:'potion', icon:'💎', price:2000, desc:'+1 em todos atributos permanentemente.', effect:'perm_stat', value:1, rarity:'legendary'},
]

// ─── SCROLLS ──────────────────────────────────────────────────────────────
export const SCROLLS = [
  { id:'scr_fireball',  name:'Pergaminho: Bola de Fogo',  category:'scroll', icon:'📜', price:120,  desc:'Usa Bola de Fogo uma vez sem custo de MP.',  effect:'skill_once', skillId:'fireball',       rarity:'common'   },
  { id:'scr_lightning', name:'Pergaminho: Raio',          category:'scroll', icon:'📜', price:180,  desc:'Usa Raio uma vez sem custo de MP.',           effect:'skill_once', skillId:'lightning_bolt', rarity:'common'   },
  { id:'scr_heal',      name:'Pergaminho: Cura',          category:'scroll', icon:'📜', price:100,  desc:'Cura 50% HP instantaneamente.',               effect:'heal_hp',    value:999,                rarity:'common'   },
  { id:'scr_meteor',    name:'Pergaminho: Meteoro',       category:'scroll', icon:'📜', price:500,  desc:'Invoca meteoro: 350% dano.',                  effect:'skill_once', skillId:'meteor',         rarity:'rare'     },
  { id:'scr_revive',    name:'Pergaminho: Ressurreição',  category:'scroll', icon:'📜', price:600,  desc:'Revive com 50% HP se morrer (uso automático).',effect:'auto_revive',value:50,                rarity:'rare'     },
  { id:'scr_freeze',    name:'Pergaminho: Congelamento',  category:'scroll', icon:'📜', price:150,  desc:'Congela inimigo por 2 turnos.',               effect:'debuff',     debuff:'freeze', turns:2,  rarity:'common'   },
  { id:'scr_silence',   name:'Pergaminho: Silêncio',      category:'scroll', icon:'📜', price:180,  desc:'Silencia inimigo por 3 turnos.',              effect:'debuff',     debuff:'silence',turns:3,  rarity:'uncommon' },
  { id:'scr_bless',     name:'Pergaminho: Bênção Divina', category:'scroll', icon:'📜', price:300,  desc:'+25% em todos atributos por 5 turnos.',       effect:'buff_all',   value:25,                 rarity:'uncommon' },
  { id:'scr_doom',      name:'Pergaminho: Ruína',         category:'scroll', icon:'📜', price:1000, desc:'Mata inimigo não-chefe instantaneamente.',    effect:'insta_kill', chance:0.7,               rarity:'epic'     },
  { id:'scr_teleport',  name:'Pergaminho: Teletransporte',category:'scroll', icon:'📜', price:200,  desc:'Fuga garantida do combate.',                  effect:'flee_sure',  value:0,                  rarity:'uncommon' },
  { id:'scr_summon',    name:'Pergaminho: Grande Invocação',category:'scroll',icon:'📜',price:700, desc:'Invoca aliado poderoso por 5 turnos.',         effect:'summon',     summonId:'hero_spirit',   rarity:'rare'     },
  { id:'scr_copy',      name:'Pergaminho: Cópia',         category:'scroll', icon:'📜', price:400,  desc:'Copia a última habilidade usada pelo inimigo.',effect:'copy_skill',value:0,                  rarity:'rare'     },
]

// ─── ARMORS ───────────────────────────────────────────────────────────────
export const ARMORS = [
  { id:'arm_leather',   name:'Armadura de Couro',       category:'armor', icon:'🛡️', price:100,  desc:'+3 DEF permanente.',          effect:'perm_def', value:3,  rarity:'common',   levelReq:1  },
  { id:'arm_chain',     name:'Cota de Malha',           category:'armor', icon:'🛡️', price:250,  desc:'+6 DEF permanente.',          effect:'perm_def', value:6,  rarity:'common',   levelReq:5  },
  { id:'arm_plate',     name:'Armadura de Placa',       category:'armor', icon:'🛡️', price:600,  desc:'+12 DEF permanente.',         effect:'perm_def', value:12, rarity:'uncommon', levelReq:10 },
  { id:'arm_mage_robe', name:'Manto do Mago',           category:'armor', icon:'👘', price:300,  desc:'+5 DEF e +20 MP permanente.', effect:'perm_mp',  value:20, rarity:'uncommon', levelReq:8  },
  { id:'arm_shadow',    name:'Armadura das Sombras',    category:'armor', icon:'🖤', price:800,  desc:'+8 DEF e +15% esquiva.',      effect:'perm_dodge',value:15, rarity:'rare',     levelReq:15 },
  { id:'arm_dragonscale',name:'Escama de Dragão',       category:'armor', icon:'🐉', price:2000, desc:'+20 DEF e resistência a fogo.',effect:'perm_def', value:20, rarity:'epic',     levelReq:25 },
  { id:'arm_holy',      name:'Armadura Sagrada',        category:'armor', icon:'✨', price:3000, desc:'+18 DEF e imune a maldições.', effect:'perm_def', value:18, rarity:'epic',     levelReq:30 },
  { id:'arm_void',      name:'Armadura do Vazio',       category:'armor', icon:'🌑', price:5000, desc:'+25 DEF e absorve 10% de magia.',effect:'perm_def',value:25,rarity:'legendary',levelReq:40 },
  { id:'arm_monk',      name:'Vestes do Monge',         category:'armor', icon:'👊', price:400,  desc:'+4 DEF e +10% velocidade.',   effect:'perm_dex', value:5,  rarity:'uncommon', levelReq:6  },
  { id:'arm_berserker', name:'Couraça do Berserker',    category:'armor', icon:'🪓', price:700,  desc:'+5 DEF e +10% ATK em fúria.', effect:'perm_def', value:5,  rarity:'rare',     levelReq:12 },
]

// ─── ACCESSORIES ──────────────────────────────────────────────────────────
export const ACCESSORIES = [
  { id:'acc_ring_str',   name:'Anel da Força',          category:'accessory', icon:'💍', price:200,  desc:'+3 STR permanente.',          effect:'perm_str', value:3,  rarity:'common'   },
  { id:'acc_ring_dex',   name:'Anel da Destreza',       category:'accessory', icon:'💍', price:200,  desc:'+3 DEX permanente.',          effect:'perm_dex', value:3,  rarity:'common'   },
  { id:'acc_ring_int',   name:'Anel da Inteligência',   category:'accessory', icon:'💍', price:200,  desc:'+3 INT permanente.',          effect:'perm_int', value:3,  rarity:'common'   },
  { id:'acc_ring_con',   name:'Anel da Constituição',   category:'accessory', icon:'💍', price:200,  desc:'+3 CON e +15 HP.',            effect:'perm_hp',  value:15, rarity:'common'   },
  { id:'acc_amulet_hp',  name:'Amuleto da Vida',        category:'accessory', icon:'📿', price:500,  desc:'+40 HP máximo permanente.',   effect:'perm_hp',  value:40, rarity:'uncommon' },
  { id:'acc_amulet_mp',  name:'Amuleto da Mana',        category:'accessory', icon:'📿', price:500,  desc:'+40 MP máximo permanente.',   effect:'perm_mp',  value:40, rarity:'uncommon' },
  { id:'acc_charm_crit', name:'Talismã Crítico',        category:'accessory', icon:'⭐', price:700,  desc:'+10% chance de crítico.',     effect:'perm_crit',value:10, rarity:'rare'     },
  { id:'acc_belt_power', name:'Cinto de Poder',         category:'accessory', icon:'⚙️', price:600,  desc:'+5 STR e +5 CON.',           effect:'perm_str', value:5,  rarity:'uncommon' },
  { id:'acc_cloak_magic',name:'Manto Mágico',           category:'accessory', icon:'🧣', price:800,  desc:'+10% resistência a magia.',   effect:'perm_magic_res',value:10,rarity:'rare' },
  { id:'acc_boots_speed',name:'Botas do Vento',         category:'accessory', icon:'👢', price:600,  desc:'+5 DEX e sempre age primeiro.',effect:'perm_dex',value:5, rarity:'rare'     },
  { id:'acc_crown_wis',  name:'Coroa da Sabedoria',     category:'accessory', icon:'👑', price:1500, desc:'+8 WIS e +8 INT.',            effect:'perm_wis', value:8,  rarity:'epic'     },
  { id:'acc_ring_god',   name:'Anel dos Deuses',        category:'accessory', icon:'🌟', price:8000, desc:'+5 em todos os atributos.',   effect:'perm_all', value:5,  rarity:'legendary'},
]

// ─── SPECIAL ITEMS ────────────────────────────────────────────────────────
export const SPECIAL_ITEMS = [
  { id:'spc_map_floor',  name:'Mapa do Andar',          category:'special', icon:'🗺️', price:150,  desc:'Revela o inimigo do próximo andar.',  effect:'reveal_next',  rarity:'common'   },
  { id:'spc_compass',    name:'Bússola Mágica',         category:'special', icon:'🧭', price:300,  desc:'Aumenta ouro ganho em combate +50%.',  effect:'gold_boost',   rarity:'uncommon' },
  { id:'spc_soul_stone', name:'Pedra de Alma',          category:'special', icon:'💎', price:1000, desc:'Guarda a alma: revive uma vez com 75% HP.', effect:'auto_revive', value:75, rarity:'rare'},
  { id:'spc_exp_tome',   name:'Tomo de Experiência',    category:'special', icon:'📚', price:500,  desc:'+500 XP instantâneo.',               effect:'bonus_xp',     value:500, rarity:'uncommon'},
  { id:'spc_exp_tome_lg',name:'Tomo de Exp. Maior',     category:'special', icon:'📚', price:2000, desc:'+2000 XP instantâneo.',              effect:'bonus_xp',     value:2000,rarity:'rare'   },
  { id:'spc_respec',     name:'Orbe de Respecialização',category:'special', icon:'🔮', price:1500, desc:'Redefine sua classe e atributos.',    effect:'respec',       rarity:'epic'     },
  { id:'spc_dungeon_key',name:'Chave do Andar Secreto', category:'special', icon:'🗝️', price:800,  desc:'Acesso a andar bônus com recompensas extras.', effect:'secret_floor', rarity:'rare'},
  { id:'spc_megapotion', name:'Mega Poção Suprema',     category:'special', icon:'🌈', price:3000, desc:'Restaura HP, MP e remove todos os debuffs.', effect:'heal_both', rarity:'epic'},
  { id:'spc_class_token',name:'Ficha de Classe Extra',  category:'special', icon:'🎴', price:5000, desc:'Adiciona mais uma classe (máx 3 classes).',effect:'add_class', rarity:'epic'},
]

// All shop items combined
export const ALL_SHOP_ITEMS = [
  ...POTIONS,
  ...SCROLLS,
  ...ARMORS,
  ...ACCESSORIES,
  ...SPECIAL_ITEMS,
]

// Weapons sold in shop (subset from weapons.js with prices)
export const WEAPON_PRICES = {
  iron_sword:30, steel_sword:80, silver_sword:200, flame_sword:350, frost_sword:350,
  thunder_sword:600, shadow_blade:900, holy_avenger:2500, obsidian_sword:700, demon_blade:1800,
  hand_axe:25, battle_axe:90, greataxe:280, fire_axe:420, dwarven_axe:600,
  wooden_staff:20, crystal_staff:180, fire_staff:280, ice_staff:280, lightning_staff:500,
  death_staff:700, archmage_staff:3000,
  iron_dagger:20, steel_dagger:70, poison_dagger:220, shadow_fang:800, assassin_blade:1200,
  hunting_bow:25, composite_bow:80, elven_bow:300, flame_bow:500, shadow_bow:700,
  oak_wand:15, fire_wand:160, ice_wand:160, lightning_wand:350, death_wand:600,
  iron_mace:30, holy_mace:250, thunder_hammer:700,
  iron_spear:30, poisoned_spear:250, twin_blades:1500, ki_gloves:300, iron_knuckles:30,
}

export function getWeaponPrice(weaponId) {
  return WEAPON_PRICES[weaponId] || 999
}

export function getShopInventory(playerLevel) {
  // Filter items that make sense for this level
  const weapons_for_sale = Object.entries(WEAPON_PRICES)
    .filter(([id]) => {
      const reqLevel = parseInt(id.split('_').pop()) || 1
      return true // show all, player decides
    })
  return ALL_SHOP_ITEMS
}

export function canAfford(gold, price) {
  return gold >= price
}
