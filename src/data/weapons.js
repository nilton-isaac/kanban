// Weapons for the dungeon system
// rarity: common, uncommon, rare, epic, legendary
// element: null, fire, ice, lightning, shadow, holy, poison, arcane, chaos

export const WEAPON_TYPES = {
  sword: 'Espada', axe: 'Machado', mace: 'Maça', spear: 'Lança', dagger: 'Adaga',
  staff: 'Cajado', wand: 'Varinha', tome: 'Tomo', bow: 'Arco', crossbow: 'Besta',
  scythe: 'Foice', greatsword: 'Espada Grande', greataxe: 'Machado Grande',
  hammer: 'Martelo', fist: 'Punho', lance: 'Lança de Torneio', shield: 'Escudo',
  instrument: 'Instrumento', totem: 'Totem', nature_focus: 'Foco Natural',
  nunchaku: 'Nunchaku', blowgun: 'Zarabatana', twin_blade: 'Lâminas Duplas',
  warglaive: 'Glaive de Guerra', scimitar: 'Cimitarra', short_sword: 'Espada Curta',
}

export const WEAPONS = [
  // ─── SWORDS ──────────────────────────────────────────────────────────────
  { id:'iron_sword',       name:'Espada de Ferro',         type:'sword',     dmg:[4,8],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Espada forjada em ferro comum. Confiável.',             bonus:{} },
  { id:'steel_sword',      name:'Espada de Aço',           type:'sword',     dmg:[7,12],  element:null,      rarity:'common',   levelReq:5,  classReq:[],           desc:'Aço bem temperado. Padrão de mercenário.',             bonus:{} },
  { id:'silver_sword',     name:'Espada de Prata',         type:'sword',     dmg:[8,14],  element:'holy',    rarity:'uncommon', levelReq:8,  classReq:[],           desc:'Letal contra mortos-vivos e lobisomens.',               bonus:{undead_dmg:25,demon_dmg:25} },
  { id:'flame_sword',      name:'Espada Flamejante',       type:'sword',     dmg:[10,16], element:'fire',    rarity:'uncommon', levelReq:10, classReq:[],           desc:'Lâmina impregnada com essência de fogo.',               bonus:{fire_dmg:15} },
  { id:'frost_sword',      name:'Espada Gélida',           type:'sword',     dmg:[10,16], element:'ice',     rarity:'uncommon', levelReq:10, classReq:[],           desc:'Congela ao tocar.',                                     bonus:{freeze_chance:15} },
  { id:'thunder_sword',    name:'Espada do Trovão',        type:'sword',     dmg:[11,18], element:'lightning',rarity:'rare',   levelReq:14, classReq:[],           desc:'Elétrica e imprevisível.',                              bonus:{lightning_dmg:20} },
  { id:'shadow_blade',     name:'Lâmina Sombria',          type:'sword',     dmg:[13,20], element:'shadow',  rarity:'rare',    levelReq:16, classReq:['ladino','assassino'], desc:'Forjada nas sombras mais profundas.',          bonus:{crit_chance:15,shadow_dmg:20} },
  { id:'holy_avenger',     name:'Vingador Sagrado',        type:'sword',     dmg:[14,22], element:'holy',    rarity:'epic',    levelReq:20, classReq:['paladino','clerigo','templario'], desc:'Abençoada por deuses guerreiros.',       bonus:{holy_dmg:30,undead_dmg:50,demon_dmg:50} },
  { id:'obsidian_sword',   name:'Espada Obsidiana',        type:'sword',     dmg:[16,25], element:null,      rarity:'rare',    levelReq:18, classReq:[],           desc:'Dureza absoluta. Afiada eternamente.',                  bonus:{armor_pierce:20} },
  { id:'demon_blade',      name:'Lâmina Demoníaca',        type:'sword',     dmg:[18,28], element:'chaos',   rarity:'epic',    levelReq:22, classReq:['demonhunter','bruxo'], desc:'Absorve alma dos mortos.',                  bonus:{lifesteal:10,chaos_dmg:25} },
  { id:'excalibur',        name:'Excalibur',               type:'sword',     dmg:[25,38], element:'holy',    rarity:'legendary',levelReq:30,classReq:['guerreiro','cavaleiro','templario'],desc:'A espada sagrada suprema.',bonus:{all_stats:15,holy_dmg:40} },
  { id:'moonfire_sword',   name:'Espada do Fogo Lunar',    type:'sword',     dmg:[20,32], element:'arcane',  rarity:'epic',    levelReq:24, classReq:[],           desc:'Brilha à luz da lua.',                                  bonus:{arcane_dmg:30,mp_regen:5} },
  { id:'void_edge',        name:'Borda do Vazio',          type:'sword',     dmg:[22,35], element:'shadow',  rarity:'legendary',levelReq:35,classReq:[],           desc:'Corta através de armaduras como se não existissem.',    bonus:{armor_pierce:50,shadow_dmg:35} },

  // ─── AXES ─────────────────────────────────────────────────────────────────
  { id:'hand_axe',         name:'Machado de Mão',          type:'axe',       dmg:[5,9],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Pequeno mas eficiente.',                                bonus:{} },
  { id:'battle_axe',       name:'Machado de Batalha',      type:'axe',       dmg:[9,15],  element:null,      rarity:'common',   levelReq:6,  classReq:[],           desc:'Arma favorita dos guerreiros nórdicos.',                bonus:{} },
  { id:'greataxe',         name:'Grande Machado',          type:'greataxe',  dmg:[14,22], element:null,      rarity:'uncommon', levelReq:10, classReq:['guerreiro','berserker'], desc:'Devastador mas pesado.',                bonus:{str_bonus:5} },
  { id:'fire_axe',         name:'Machado de Fogo',         type:'axe',       dmg:[12,18], element:'fire',    rarity:'uncommon', levelReq:12, classReq:[],           desc:'Golpes causam queimaduras.',                            bonus:{burn_chance:20} },
  { id:'dwarven_axe',      name:'Machado Anão',            type:'axe',       dmg:[11,17], element:null,      rarity:'rare',     levelReq:15, classReq:[],           desc:'Precisão anã: +15% chance de crítico.',                bonus:{crit_chance:15,armor_pierce:15} },
  { id:'rage_axe',         name:'Machado da Fúria',        type:'greataxe',  dmg:[20,30], element:'chaos',   rarity:'epic',     levelReq:22, classReq:['berserker'], desc:'Aumenta fúria a cada golpe.',                         bonus:{str_bonus:10,rage_stack:true} },
  { id:'executioner_axe',  name:'Machado do Carrasco',     type:'greataxe',  dmg:[24,36], element:null,      rarity:'legendary',levelReq:32, classReq:['guerreiro','berserker'], desc:'Feito para decapitar.',              bonus:{crit_dmg:100,execute_chance:10} },

  // ─── STAVES ───────────────────────────────────────────────────────────────
  { id:'wooden_staff',     name:'Cajado de Madeira',       type:'staff',     dmg:[3,6],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Cajado básico de aprendiz.',                            bonus:{mp_bonus:10} },
  { id:'crystal_staff',    name:'Cajado de Cristal',       type:'staff',     dmg:[6,11],  element:'arcane',  rarity:'uncommon', levelReq:7,  classReq:[],           desc:'Amplifica magia arcana.',                               bonus:{magic_dmg:15,mp_bonus:20} },
  { id:'fire_staff',       name:'Cajado de Fogo',          type:'staff',     dmg:[7,13],  element:'fire',    rarity:'uncommon', levelReq:9,  classReq:['mago','piromante'], desc:'Raios de fogo a cada gesto.',               bonus:{fire_dmg:25,mp_bonus:15} },
  { id:'ice_staff',        name:'Cajado de Gelo',          type:'staff',     dmg:[7,13],  element:'ice',     rarity:'uncommon', levelReq:9,  classReq:['mago','criomante'], desc:'Congela o ar ao redor.',                    bonus:{ice_dmg:25,freeze_chance:10,mp_bonus:15} },
  { id:'lightning_staff',  name:'Cajado do Trovão',        type:'staff',     dmg:[8,14],  element:'lightning',rarity:'rare',   levelReq:13, classReq:['mago','xamã'],  desc:'Trovão canalizado na madeira.',                bonus:{lightning_dmg:30,mp_bonus:20} },
  { id:'death_staff',      name:'Cajado da Morte',         type:'staff',     dmg:[9,16],  element:'shadow',  rarity:'rare',    levelReq:15, classReq:['necromante'],   desc:'Feito de osso de lich.',                               bonus:{necrotic_dmg:30,lifesteal:10} },
  { id:'archmage_staff',   name:'Cajado do Arquimago',     type:'staff',     dmg:[14,22], element:'arcane',  rarity:'epic',    levelReq:25, classReq:['mago'],         desc:'Pertenceu ao maior mago que já viveu.',                bonus:{all_magic_dmg:30,mp_bonus:50,int_bonus:5} },
  { id:'staff_of_the_void',name:'Cajado do Vazio',         type:'staff',     dmg:[20,30], element:'shadow',  rarity:'legendary',levelReq:35,classReq:[],              desc:'Absorve a própria realidade.',                         bonus:{all_magic_dmg:40,mp_bonus:80,nullify_chance:10} },

  // ─── DAGGERS ──────────────────────────────────────────────────────────────
  { id:'iron_dagger',      name:'Adaga de Ferro',          type:'dagger',    dmg:[3,6],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Pequena, rápida, barata.',                              bonus:{crit_chance:5} },
  { id:'steel_dagger',     name:'Adaga de Aço',            type:'dagger',    dmg:[5,9],   element:null,      rarity:'common',   levelReq:5,  classReq:[],           desc:'Melhor equilíbrio para lançamentos.',                   bonus:{crit_chance:8} },
  { id:'poison_dagger',    name:'Adaga Venenosa',          type:'dagger',    dmg:[5,9],   element:'poison',  rarity:'uncommon', levelReq:8,  classReq:[],           desc:'Lâmina tratada com veneno raro.',                       bonus:{poison_chance:35,crit_chance:5} },
  { id:'shadow_fang',      name:'Presas das Sombras',      type:'dagger',    dmg:[8,14],  element:'shadow',  rarity:'rare',    levelReq:14, classReq:['ladino','assassino'], desc:'Invisível no escuro.',                        bonus:{crit_chance:15,first_strike:true} },
  { id:'assassin_blade',   name:'Lâmina do Assassino',     type:'dagger',    dmg:[10,17], element:'shadow',  rarity:'rare',    levelReq:16, classReq:['assassino'], desc:'Cada ponto vital exposto é uma oportunidade.',          bonus:{crit_chance:20,crit_dmg:50} },
  { id:'dream_dagger',     name:'Adaga dos Sonhos',        type:'dagger',    dmg:[12,20], element:'arcane',  rarity:'epic',    levelReq:22, classReq:[],           desc:'Ataca no plano astral também.',                         bonus:{armor_pierce:30,crit_chance:15} },
  { id:'reaper_fang',      name:'Presa do Ceifador',       type:'dagger',    dmg:[18,28], element:'shadow',  rarity:'legendary',levelReq:35,classReq:['assassino','ladino'], desc:'A morte em forma de lâmina.',              bonus:{insta_kill_chance:5,crit_chance:25,crit_dmg:100} },

  // ─── BOWS ─────────────────────────────────────────────────────────────────
  { id:'hunting_bow',      name:'Arco de Caça',            type:'bow',       dmg:[4,8],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Arco simples para caçadores.',                          bonus:{} },
  { id:'composite_bow',    name:'Arco Composto',           type:'bow',       dmg:[7,12],  element:null,      rarity:'common',   levelReq:6,  classReq:[],           desc:'Maior alcance e força.',                                bonus:{range_bonus:true} },
  { id:'elven_bow',        name:'Arco Élfico',             type:'bow',       dmg:[9,15],  element:null,      rarity:'uncommon', levelReq:10, classReq:['arqueiro'], desc:'Leve e precisíssimo.',                                  bonus:{crit_chance:10,dex_bonus:3} },
  { id:'flame_bow',        name:'Arco Flamejante',         type:'bow',       dmg:[10,16], element:'fire',    rarity:'rare',    levelReq:14, classReq:['arqueiro'], desc:'Flechas tomam fogo ao serem disparadas.',               bonus:{fire_dmg:20} },
  { id:'shadow_bow',       name:'Arco das Sombras',        type:'bow',       dmg:[11,18], element:'shadow',  rarity:'rare',    levelReq:16, classReq:['arqueiro'], desc:'Flechas espectrais atravessam armaduras.',              bonus:{armor_pierce:25,shadow_dmg:15} },
  { id:'storm_bow',        name:'Arco da Tempestade',      type:'bow',       dmg:[14,22], element:'lightning',rarity:'epic',   levelReq:22, classReq:['arqueiro'], desc:'Cada flecha conduz relâmpago.',                         bonus:{lightning_dmg:30,multi_shot_bonus:true} },
  { id:'divine_bow',       name:'Arco Divino',             type:'bow',       dmg:[18,28], element:'holy',    rarity:'legendary',levelReq:32,classReq:['arqueiro'], desc:'Nunca erra. Nunca falha.',                              bonus:{accuracy:100,holy_dmg:35,crit_chance:20} },

  // ─── WANDS ────────────────────────────────────────────────────────────────
  { id:'oak_wand',         name:'Varinha de Carvalho',     type:'wand',      dmg:[3,7],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Varinha básica de aprendiz mago.',                      bonus:{mp_bonus:8} },
  { id:'fire_wand',        name:'Varinha de Fogo',         type:'wand',      dmg:[5,10],  element:'fire',    rarity:'uncommon', levelReq:7,  classReq:[],           desc:'Cospe pequenas chamas.',                                bonus:{fire_dmg:20} },
  { id:'ice_wand',         name:'Varinha Gélida',          type:'wand',      dmg:[5,10],  element:'ice',     rarity:'uncommon', levelReq:7,  classReq:[],           desc:'Congela o ar à frente.',                                bonus:{ice_dmg:20,freeze_chance:10} },
  { id:'lightning_wand',   name:'Varinha do Raio',         type:'wand',      dmg:[6,11],  element:'lightning',rarity:'rare',   levelReq:11, classReq:[],           desc:'Raio em miniatura.',                                    bonus:{lightning_dmg:25} },
  { id:'death_wand',       name:'Varinha da Morte',        type:'wand',      dmg:[7,13],  element:'shadow',  rarity:'rare',    levelReq:14, classReq:['necromante','bruxo'], desc:'Canali necromância em forma compacta.',         bonus:{necrotic_dmg:25,lifesteal:8} },
  { id:'chaos_wand',       name:'Varinha do Caos',         type:'wand',      dmg:[5,18],  element:'chaos',   rarity:'epic',    levelReq:20, classReq:[],           desc:'Dano completamente aleatório.',                         bonus:{chaos_dmg:20,wild_magic:true} },

  // ─── TOMES / GRIMOIRES ────────────────────────────────────────────────────
  { id:'spell_primer',     name:'Primário de Feitiços',    type:'tome',      dmg:[2,5],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Fundamentos da magia.',                                 bonus:{mp_bonus:15,magic_dmg:5} },
  { id:'arcane_tome',      name:'Tomo Arcano',             type:'tome',      dmg:[4,8],   element:'arcane',  rarity:'uncommon', levelReq:8,  classReq:[],           desc:'Segredos arcanos antigos.',                             bonus:{magic_dmg:15,mp_bonus:25} },
  { id:'forbidden_tome',   name:'Tomo Proibido',           type:'tome',      dmg:[7,13],  element:'shadow',  rarity:'rare',    levelReq:15, classReq:['necromante','bruxo'], desc:'Proibido por boas razões.',                    bonus:{necrotic_dmg:25,death_magic:true,mp_bonus:30} },
  { id:'eldritch_grimoire',name:'Grimório Eldritch',       type:'tome',      dmg:[9,16],  element:'void',    rarity:'epic',    levelReq:22, classReq:['bruxo'],    desc:'Contém conhecimentos que não deveriam existir.',        bonus:{eldritch_dmg:30,mp_bonus:40,sanity_cost:true} },
  { id:'ancient_codex',    name:'Códice Ancestral',        type:'tome',      dmg:[14,22], element:'arcane',  rarity:'legendary',levelReq:35,classReq:[],           desc:'Contém toda a magia de uma era perdida.',               bonus:{all_magic_dmg:35,mp_bonus:70,spell_free_chance:15} },

  // ─── SCYTHES ──────────────────────────────────────────────────────────────
  { id:'bone_scythe',      name:'Foice de Osso',           type:'scythe',    dmg:[8,14],  element:'shadow',  rarity:'uncommon', levelReq:10, classReq:['necromante'], desc:'Entalhada em osso de dragão morto-vivo.',             bonus:{necrotic_dmg:15,undead_dmg:20} },
  { id:'death_scythe',     name:'Foice da Morte',          type:'scythe',    dmg:[14,22], element:'shadow',  rarity:'rare',    levelReq:18, classReq:['necromante'], desc:'A foice do ceifador de almas.',                       bonus:{necrotic_dmg:25,lifesteal:15,crit_chance:10} },
  { id:'grim_reaper',      name:'Ceifador',                type:'scythe',    dmg:[22,34], element:'shadow',  rarity:'legendary',levelReq:30,classReq:['necromante'], desc:'A própria morte forjada em metal.',                   bonus:{necrotic_dmg:40,insta_kill_chance:5,lifesteal:20} },

  // ─── HAMMERS/MACES ────────────────────────────────────────────────────────
  { id:'iron_mace',        name:'Maça de Ferro',           type:'mace',      dmg:[5,9],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Quebra ossos com facilidade.',                          bonus:{undead_dmg:15} },
  { id:'holy_mace',        name:'Maça Sagrada',            type:'mace',      dmg:[8,14],  element:'holy',    rarity:'uncommon', levelReq:9,  classReq:['clerigo','paladino','templario'], desc:'Abençoada para combater o mal.',         bonus:{holy_dmg:20,undead_dmg:30} },
  { id:'thunder_hammer',   name:'Martelo do Trovão',       type:'hammer',    dmg:[12,20], element:'lightning',rarity:'rare',   levelReq:14, classReq:['guerreiro'], desc:'Golpes geram trovões.',                                bonus:{lightning_dmg:25,stun_chance:15} },
  { id:'mjolnir',          name:'Mjölnir',                 type:'hammer',    dmg:[20,30], element:'lightning',rarity:'legendary',levelReq:30,classReq:['guerreiro','berserker'], desc:'O martelo dos deuses trovejantes.',       bonus:{lightning_dmg:40,stun_chance:25,return:true} },

  // ─── SPEARS/LANCES ────────────────────────────────────────────────────────
  { id:'iron_spear',       name:'Lança de Ferro',          type:'spear',     dmg:[5,9],   element:null,      rarity:'common',   levelReq:1,  classReq:[],           desc:'Alcance estendido.',                                    bonus:{first_strike:true} },
  { id:'poisoned_spear',   name:'Lança Venenosa',          type:'spear',     dmg:[7,12],  element:'poison',  rarity:'uncommon', levelReq:9,  classReq:[],           desc:'Ponta impregnada com veneno de víbora.',                bonus:{poison_chance:30} },
  { id:'dragon_lance',     name:'Lança do Dragão',         type:'lance',     dmg:[14,22], element:'fire',    rarity:'epic',    levelReq:22, classReq:['cavaleiro'], desc:'Forjada com escamas de dragão vermelho.',              bonus:{fire_dmg:25,crit_chance:15} },
  { id:'gungir',           name:'Gungnir',                 type:'spear',     dmg:[22,34], element:'lightning',rarity:'legendary',levelReq:35,classReq:[],           desc:'Lança do deus dos deuses. Nunca erra.',                bonus:{accuracy:100,lightning_dmg:35,all_stats:10} },

  // ─── SPECIAL / UNIQUE ─────────────────────────────────────────────────────
  { id:'twin_blades',      name:'Lâminas Gêmeas',          type:'twin_blade',dmg:[12,18], element:'shadow',  rarity:'epic',    levelReq:20, classReq:['demonhunter','ladino'], desc:'Dança de aço: dois ataques por turno.',        bonus:{double_attack:true,crit_chance:10} },
  { id:'warglaive',        name:'Glaive de Guerra',        type:'warglaive', dmg:[16,25], element:'chaos',   rarity:'epic',    levelReq:24, classReq:['demonhunter'], desc:'Arma dos caçadores de demônios.',                     bonus:{demon_dmg:30,armor_pierce:20,crit_chance:10} },
  { id:'ki_gloves',        name:'Luvas de Ki',             type:'fist',      dmg:[6,11],  element:'arcane',  rarity:'uncommon', levelReq:8,  classReq:['monge'],    desc:'Concentra ki nos punhos.',                              bonus:{ki_dmg:25,stun_chance:10} },
  { id:'iron_knuckles',    name:'Soco de Ferro',           type:'fist',      dmg:[4,8],   element:null,      rarity:'common',   levelReq:3,  classReq:['monge','berserker'], desc:'Punhos endurecidos com metal.',                   bonus:{stun_chance:8} },
  { id:'void_fist',        name:'Punho do Vazio',          type:'fist',      dmg:[18,28], element:'void',    rarity:'legendary',levelReq:32,classReq:['monge'],     desc:'Atinge em dois planos simultaneamente.',               bonus:{armor_pierce:40,ki_dmg:40,phasing:true} },
  { id:'dragonslayer',     name:'Mata-Dragões',            type:'greatsword',dmg:[22,34], element:'holy',    rarity:'legendary',levelReq:30,classReq:['guerreiro','cavaleiro'], desc:'Forjada especificamente para matar dragões.',    bonus:{dragon_dmg:100,holy_dmg:20,crit_chance:15} },
  { id:'chaos_sword',      name:'Espada do Caos',          type:'sword',     dmg:[15,35], element:'chaos',   rarity:'legendary',levelReq:35,classReq:[],           desc:'Dano completamente aleatório. Alto risco, alta recompensa.',bonus:{chaos_dmg:50,wild_crit:true} },
]

export function getWeaponsByType(type) {
  return WEAPONS.filter(w => w.type === type)
}

export function getWeaponsForClass(classId) {
  return WEAPONS.filter(w => w.classReq.length === 0 || w.classReq.includes(classId))
}

export function getWeaponsByRarity(rarity) {
  return WEAPONS.filter(w => w.rarity === rarity)
}

export function getStartingWeapon(classId) {
  const classWeaponMap = {
    guerreiro: 'iron_sword', mago: 'wooden_staff', ladino: 'iron_dagger',
    paladino: 'iron_mace', necromante: 'bone_scythe', arqueiro: 'hunting_bow',
    bardo: 'iron_dagger', druida: 'wooden_staff', berserker: 'hand_axe',
    monge: 'iron_knuckles', bruxo: 'oak_wand', clerigo: 'iron_mace',
    assassino: 'iron_dagger', xamã: 'wooden_staff', piromante: 'fire_wand',
    criomante: 'ice_wand', alquimista: 'iron_dagger', invocador: 'oak_wand',
    cavaleiro: 'iron_spear', demonhunter: 'iron_dagger', templario: 'iron_sword',
    feiticeiro: 'oak_wand',
  }
  const id = classWeaponMap[classId] || 'iron_sword'
  return WEAPONS.find(w => w.id === id) || WEAPONS[0]
}

// Loot drops - weapons that can be found in the dungeon by floor
export function getLootPool(floor) {
  const minLevel = Math.max(1, floor - 3)
  const maxLevel = floor + 2
  return WEAPONS.filter(w => w.levelReq >= minLevel && w.levelReq <= maxLevel)
}

export const RARITY_COLORS = {
  common: '#aaaaaa',
  uncommon: '#44ff88',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00',
}

export const RARITY_LABELS = {
  common: 'Comum', uncommon: 'Incomum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário',
}
