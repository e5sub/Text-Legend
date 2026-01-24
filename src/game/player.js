import { CLASSES, getStartPosition, expForLevel, maxBagSlots } from './constants.js';
import { ITEM_TEMPLATES } from './items.js';
import { DEFAULT_SKILLS } from './skills.js';
import { clamp } from './utils.js';

function rarityByPrice(item) {
  if (!item) return 'common';
  const price = Number(item.price || 0);
  if (price >= 80000) return 'legendary';
  if (price >= 30000) return 'epic';
  if (price >= 10000) return 'rare';
  if (price >= 2000) return 'uncommon';
  return 'common';
}

function normalizeEffects(effects) {
  if (!effects || typeof effects !== 'object') return null;
  const normalized = {};
  if (effects.combo) normalized.combo = true;
  if (effects.fury) normalized.fury = true;
  if (effects.unbreakable) normalized.unbreakable = true;
  if (effects.defense) normalized.defense = true;
  if (effects.dodge) normalized.dodge = true;
  if (effects.poison) normalized.poison = true;
  if (effects.healblock) normalized.healblock = true;
  return Object.keys(normalized).length ? normalized : null;
}

function effectsKey(effects) {
  if (!effects) return '';
  const parts = [];
  if (effects.combo) parts.push('combo');
  if (effects.fury) parts.push('fury');
  if (effects.unbreakable) parts.push('unbreakable');
  if (effects.defense) parts.push('defense');
  if (effects.dodge) parts.push('dodge');
  if (effects.poison) parts.push('poison');
  if (effects.healblock) parts.push('healblock');
  return parts.join('+');
}

export function getItemKey(slot) {
  if (!slot || !slot.id) return '';
  const item = ITEM_TEMPLATES[slot.id];
  const isEquipment = item && item.slot;
  const key = effectsKey(slot.effects);
  let baseKey = key ? `${slot.id}#${key}` : slot.id;
  // 装备类型需要包含耐久度信息，避免不同耐久度的装备被合并
  if (isEquipment && (slot.durability != null || slot.max_durability != null)) {
    const dur = slot.durability ?? 100;
    const maxDur = slot.max_durability ?? 100;
    baseKey += `@${dur}/${maxDur}`;
  }
  return baseKey;
}

function sameEffects(a, b) {
  const na = normalizeEffects(a);
  const nb = normalizeEffects(b);
  return effectsKey(na) === effectsKey(nb);
}

function ensureDurability(equipped) {
  if (!equipped || !equipped.id) return;
  const item = ITEM_TEMPLATES[equipped.id];
  if (!item) return;
  if (!equipped.max_durability) {
    equipped.max_durability = 100;
  }
  if (equipped.durability == null) {
    equipped.durability = equipped.max_durability;
  }
  equipped.durability = clamp(equipped.durability, 0, equipped.max_durability);
}

export function getDurabilityMax(item) {
  if (!item) return 0;
  return 100;
}

export function getRepairCost(item, missing, player = null) {
  if (!item || missing <= 0) return 0;
  const base = item.type === 'weapon' ? 200 : item.type === 'armor' ? 180 : 160;
  const rarity = rarityByPrice(item);
  const mult = rarity === 'supreme'
    ? 6.0
    : rarity === 'legendary'
      ? 5.0
      : rarity === 'epic'
        ? 4.2
        : rarity === 'rare'
          ? 3.4
          : rarity === 'uncommon'
            ? 2.6
            : 2.0;
  let cost = Math.min(50000, Math.max(1, Math.floor(base * mult * missing)));
  if (player?.flags?.vip) {
    cost = Math.max(1, Math.floor(cost * 0.5));
  }
  return cost;
}

export function newCharacter(name, classId) {
  const cls = CLASSES[classId];
  const level = 1;
  const stats = { ...cls.base, vit: cls.base.con };
  const maxHp = cls.base.con * 10 + cls.hpPerLevel;
  const maxMp = cls.base.spirit * 8 + cls.mpPerLevel;

  return {
    name,
    classId,
    level,
    exp: 0,
    gold: 100,
    hp: maxHp,
    mp: maxMp,
    max_hp: maxHp,
    max_mp: maxMp,
    stats,
    position: { ...getStartPosition() },
    inventory: [
      { id: 'potion_small', qty: 3 },
      { id: 'potion_mana', qty: 2 }
    ],
    equipment: {
      weapon: null,
      chest: null,
      feet: null,
      ring_left: null,
      ring_right: null,
      neck: null,
      head: null,
      waist: null,
      bracelet_left: null,
      bracelet_right: null
    },
    quests: {},
    skills: [DEFAULT_SKILLS[classId]].filter(Boolean),
    flags: {
      tutorial: true,
      pkValue: 0,
      vip: false,
      offlineAt: null,
      autoSkillId: null,
      autoHpPct: null,
      autoMpPct: null,
      training: { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0, dex: 0 }
    },
    status: {}
  };
}

export function computeDerived(player) {
  if (!player.flags) player.flags = {};
  if (!player.flags.training) {
    player.flags.training = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  }
  const SET_BONUS_RATE = 1.2;
  const SET_DEFS = [
    {
      id: 'holy',
      bonusRate: SET_BONUS_RATE,
      head: 'helm_holy',
      waist: 'belt_holy',
      feet: 'boots_holy',
      neck: 'necklace_soldier',
      ring: 'ring_holy',
      bracelet: 'bracelet_soldier'
    },
    {
      id: 'fashen',
      bonusRate: SET_BONUS_RATE,
      head: 'helm_mage',
      waist: 'belt_mage',
      feet: 'boots_mage',
      neck: 'necklace_fashen',
      ring: 'ring_fashen',
      bracelet: 'bracelet_fashen'
    },
    {
      id: 'tianzun',
      bonusRate: SET_BONUS_RATE,
      head: 'helm_tao',
      waist: 'belt_tao',
      feet: 'boots_tao',
      neck: 'necklace_tianzun',
      ring: 'ring_tianzun',
      bracelet: 'bracelet_tianzun'
    },
    {
      id: 'thunder',
      bonusRate: 1.4,
      head: 'helm_wargod',
      waist: 'belt_wargod',
      feet: 'boots_wargod',
      neck: 'necklace_wargod',
      ring: 'ring_wargod',
      bracelet: 'bracelet_wargod'
    },
    {
      id: 'holyflame',
      bonusRate: 1.4,
      head: 'helm_sacred',
      waist: 'belt_sacred',
      feet: 'boots_sacred',
      neck: 'necklace_sacred',
      ring: 'ring_sacred',
      bracelet: 'bracelet_sacred'
    },
    {
      id: 'soultrue',
      bonusRate: 1.4,
      head: 'helm_true',
      waist: 'belt_true',
      feet: 'boots_true',
      neck: 'necklace_true',
      ring: 'ring_true',
      bracelet: 'bracelet_true'
    },
    {
      id: 'rochie_war',
      bonusRate: 2.0,
      head: 'helm_rochie_war',
      waist: 'belt_rochie_war',
      feet: 'boots_rochie_war',
      neck: 'necklace_rochie_war',
      ring: 'ring_rochie_war',
      bracelet: 'bracelet_rochie_war'
    },
    {
      id: 'rochie_mage',
      bonusRate: 2.0,
      head: 'helm_rochie_mage',
      waist: 'belt_rochie_mage',
      feet: 'boots_rochie_mage',
      neck: 'necklace_rochie_mage',
      ring: 'ring_rochie_mage',
      bracelet: 'bracelet_rochie_mage'
    },
    {
      id: 'rochie_tao',
      bonusRate: 2.0,
      head: 'helm_rochie_tao',
      waist: 'belt_rochie_tao',
      feet: 'boots_rochie_tao',
      neck: 'necklace_rochie_tao',
      ring: 'ring_rochie_tao',
      bracelet: 'bracelet_rochie_tao'
    }
  ];
  const cls = CLASSES[player.classId];
  const base = cls.base;
  const level = player.level;
  const equipped = player.equipment || {};
  const activeSetIds = new Set();
  const activeSetBonusRates = new Map();
  SET_DEFS.forEach((setDef) => {
    const partialSet =
      equipped.head?.id === setDef.head &&
      equipped.waist?.id === setDef.waist &&
      equipped.feet?.id === setDef.feet &&
      equipped.neck?.id === setDef.neck &&
      (equipped.ring_left?.id === setDef.ring || equipped.ring_right?.id === setDef.ring) &&
      equipped.bracelet_left?.id === setDef.bracelet &&
      equipped.bracelet_right?.id === setDef.bracelet;
    if (partialSet) {
      const bonusRate = setDef.bonusRate || SET_BONUS_RATE;
      [
        setDef.head,
        setDef.waist,
        setDef.feet,
        setDef.neck,
        setDef.ring,
        setDef.bracelet
      ].forEach((id) => {
        activeSetIds.add(id);
        activeSetBonusRates.set(id, bonusRate);
      });
    }
  });
  player.flags.setBonusActive = activeSetIds.size > 0;
  const bonus = Object.values(player.equipment)
    .filter((equipped) => equipped && equipped.id && (equipped.durability == null || equipped.durability > 0))
    .map((equipped) => ({
      item: ITEM_TEMPLATES[equipped.id],
      effects: equipped.effects || null
    }))
    .filter((entry) => entry.item);

  const stats = { ...base };
  let mdefBonus = 0;
  let evadeChance = 0;
  for (const entry of bonus) {
    const item = entry.item;
    const setBonus = activeSetIds.has(item.id) ? (activeSetBonusRates.get(item.id) || SET_BONUS_RATE) : 1;
    let atk = Math.floor((item.atk || 0) * setBonus);
    let mag = Math.floor((item.mag || 0) * setBonus);
    let spirit = Math.floor((item.spirit || 0) * setBonus);
    let def = Math.floor((item.def || 0) * setBonus);
    let mdef = Math.floor((item.mdef || 0) * setBonus);
    const dex = Math.floor((item.dex || 0) * setBonus);
    if (entry.effects?.fury && item.type === 'weapon') {
      atk = Math.floor(atk * 1.25);
      mag = Math.floor(mag * 1.25);
      spirit = Math.floor(spirit * 1.25);
    }
    if (entry.effects?.defense && item.type !== 'weapon') {
      def = Math.floor(def * 1.5);
      mdef = Math.floor(mdef * 1.5);
    }
    if (entry.effects?.dodge) {
      evadeChance = 0.2;
    }
    stats.str += atk ? Math.floor(atk / 2) : 0;
    stats.dex += dex || 0;
    stats.int += mag ? Math.floor(mag / 2) : 0;
    stats.con += def ? Math.floor(def / 2) : 0;
    stats.spirit += spirit || 0;
    mdefBonus += mdef;
  }
  const training = player.flags.training;
  stats.spirit += training.spirit || 0;
  stats.dex += training.dex || 0;

  player.stats = stats;
  const levelUp = Math.max(0, level - 1);
  const levelBonusMap = {
    warrior: { hp: 3, mp: 10, atk: 0.5, def: 3, mag: 0, spirit: 0, mdef: 3 },
    mage: { hp: 5, mp: 10, atk: 0, def: 2, mag: 2, spirit: 0, mdef: 1 },
    taoist: { hp: 5, mp: 10, atk: 0, def: 2, mag: 0, spirit: 2, mdef: 1 }
  };
  const levelBonus = levelBonusMap[player.classId] || levelBonusMap.warrior;
  const bonusHp = levelBonus.hp * levelUp;
  const bonusMp = levelBonus.mp * levelUp;
  const bonusAtk = levelBonus.atk * levelUp;
  const bonusDef = levelBonus.def * levelUp;
  const bonusMag = levelBonus.mag * levelUp;
  const bonusSpirit = levelBonus.spirit * levelUp;
  const bonusMdef = levelBonus.mdef * levelUp;

  player.max_hp = base.con * 10 + cls.hpPerLevel * level + stats.con * 2 + (training.hp || 0) + bonusHp;
  player.max_mp = base.spirit * 8 + cls.mpPerLevel * level + stats.spirit * 2 + (training.mp || 0) + bonusMp;

  player.atk = stats.str * 1.6 + level * 1.2 + (training.atk || 0) + bonusAtk;
  player.def = stats.con * 1.1 + level * 0.8 + (training.def || 0) + bonusDef;
  player.dex = stats.dex;
  player.mag = stats.int * 1.4 + stats.spirit * 0.6 + (training.mag || 0) + bonusMag;
  player.spirit = stats.spirit + bonusSpirit;
  player.mdef = stats.spirit * 1.1 + level * 0.8 + (training.mdef || 0) + mdefBonus + bonusMdef;
  player.evadeChance = evadeChance + (player.dex || 0) * 0.001; // 1点敏捷增加0.001闪避

  player.hp = clamp(player.hp, 1, player.max_hp);
  player.mp = clamp(player.mp, 0, player.max_mp);
}

export function gainExp(player, amount) {
  player.exp += amount;
  let leveled = false;
  while (player.exp >= expForLevel(player.level)) {
    player.exp -= expForLevel(player.level);
    player.level += 1;
    leveled = true;
  }
  if (leveled) {
    computeDerived(player);
    player.hp = player.max_hp;
    player.mp = player.max_mp;
  }
  return leveled;
}

export function bagLimit(player) {
  return maxBagSlots(player.level);
}

export function addItem(player, itemId, qty = 1, effects = null, durability = null, max_durability = null) {
  if (!player.inventory) player.inventory = [];
  const normalized = normalizeEffects(effects);
  const itemTemplate = ITEM_TEMPLATES[itemId];
  const isEquipment = itemTemplate && itemTemplate.slot;
  
  // 装备类型根据耐久度分开存储，不堆叠
  if (isEquipment) {
    const maxDur = 100;
    const finalDur = durability !== null ? durability : maxDur;
    const finalMaxDur = max_durability !== null ? max_durability : maxDur;
    
    // 尝试找到耐久度完全相同的装备进行堆叠
    const slot = player.inventory.find((i) => 
      i.id === itemId && 
      sameEffects(i.effects, normalized) &&
      i.durability === finalDur &&
      i.max_durability === finalMaxDur
    );
    
    if (slot) {
      slot.qty += qty;
    } else {
      player.inventory.push({ 
        id: itemId, 
        qty, 
        effects: normalized,
        durability: finalDur,
        max_durability: finalMaxDur
      });
    }
  } else {
    // 非装备类型物品正常堆叠
    const slot = player.inventory.find((i) => i.id === itemId && sameEffects(i.effects, normalized));
    if (slot) {
      slot.qty += qty;
    } else {
      const item = { id: itemId, qty, effects: normalized };
      if (durability !== null) item.durability = durability;
      if (max_durability !== null) item.max_durability = max_durability;
      player.inventory.push(item);
    }
  }
}

export function normalizeInventory(player) {
  const merged = new Map();
  (player.inventory || []).forEach((slot) => {
    if (!slot || !slot.id) return;
    const id = slot.id;
    const qty = Number(slot.qty || 0);
    if (qty <= 0) return;
    const effects = normalizeEffects(slot.effects);
    const itemTemplate = ITEM_TEMPLATES[id];
    const isEquipment = itemTemplate && itemTemplate.slot;
    
    let finalDur = slot.durability;
    let finalMaxDur = slot.max_durability;
    
    // 只为装备添加默认耐久度
    if (isEquipment) {
      finalDur = slot.durability !== null ? slot.durability : 100;
      finalMaxDur = slot.max_durability !== null ? slot.max_durability : 100;
    }
    
    const key = `${id}|${effectsKey(effects)}|${finalDur}|${finalMaxDur}`;
    const cur = merged.get(key) || { id, qty: 0, effects };
    if (isEquipment) {
      cur.durability = finalDur;
      cur.max_durability = finalMaxDur;
    }
    cur.qty += qty;
    merged.set(key, cur);
  });
  player.inventory = Array.from(merged.values());
}
export function normalizeEquipment(player) {
  if (!player.equipment) player.equipment = {};
  if (player.equipment.ring && !player.equipment.ring_left && !player.equipment.ring_right) {
    player.equipment.ring_left = player.equipment.ring;
  }
  if (player.equipment.bracelet && !player.equipment.bracelet_left && !player.equipment.bracelet_right) {
    player.equipment.bracelet_left = player.equipment.bracelet;
  }
  delete player.equipment.ring;
  delete player.equipment.bracelet;
  player.equipment.ring_left = player.equipment.ring_left || null;
  player.equipment.ring_right = player.equipment.ring_right || null;
  player.equipment.bracelet_left = player.equipment.bracelet_left || null;
  player.equipment.bracelet_right = player.equipment.bracelet_right || null;
  Object.values(player.equipment).forEach((equipped) => ensureDurability(equipped));
}

function resolveEquipSlot(player, item) {
  const slot = item.slot;
  if (slot === 'ring') {
    if (!player.equipment.ring_left) return 'ring_left';
    if (!player.equipment.ring_right) return 'ring_right';
    return 'ring_left';
  }
  if (slot === 'bracelet') {
    if (!player.equipment.bracelet_left) return 'bracelet_left';
    if (!player.equipment.bracelet_right) return 'bracelet_right';
    return 'bracelet_left';
  }
  return slot;
}

export function removeItem(player, itemId, qty = 1, effects = null) {
  const normalized = normalizeEffects(effects);
  const slot = normalized
    ? player.inventory.find((i) => i.id === itemId && sameEffects(i.effects, normalized))
    : player.inventory.find((i) => i.id === itemId);
  if (!slot) return false;
  if (slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) {
    player.inventory = player.inventory.filter((i) => i !== slot);
  }
  return true;
}

export function equipItem(player, itemId, effects = null) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !item.slot) return { ok: false, msg: '\u8BE5\u7269\u54C1\u65E0\u6CD5\u88C5\u5907\u3002' };
  const has = effects
    ? player.inventory.find((i) => i.id === itemId && sameEffects(i.effects, effects))
    : player.inventory.find((i) => i.id === itemId);
  if (!has) return { ok: false, msg: '\u80CC\u5305\u91CC\u6CA1\u6709\u8BE5\u7269\u54C1\u3002' };

  normalizeEquipment(player);
  const slot = resolveEquipSlot(player, item);
  if (player.equipment[slot]) {
    addItem(player, player.equipment[slot].id, 1, player.equipment[slot].effects, player.equipment[slot].durability, player.equipment[slot].max_durability);
  }

  const maxDur = 100;
  // 保留背包中物品的耐久度，如果没有则初始化为满值
  const itemDur = has.durability != null ? has.durability : maxDur;
  const itemMaxDur = has.max_durability != null ? has.max_durability : maxDur;
  player.equipment[slot] = { id: itemId, durability: itemDur, max_durability: itemMaxDur, effects: has.effects || null };
  removeItem(player, itemId, 1, has.effects);
  computeDerived(player);
  return { ok: true, msg: `\u5DF2\u88C5\u5907${item.name}\u3002` };
}

export function unequipItem(player, slot) {
  normalizeEquipment(player);
  if (slot === 'ring') {
    slot = player.equipment.ring_left ? 'ring_left' : 'ring_right';
  }
  if (slot === 'bracelet') {
    slot = player.equipment.bracelet_left ? 'bracelet_left' : 'bracelet_right';
  }
  const current = player.equipment[slot];
  if (!current) return { ok: false, msg: '\u8BE5\u90E8\u4F4D\u6CA1\u6709\u88C5\u5907\u3002' };
  addItem(player, current.id, 1, current.effects, current.durability, current.max_durability);
  player.equipment[slot] = null;
  computeDerived(player);
  return { ok: true, msg: `\u5DF2\u5378\u4E0B${ITEM_TEMPLATES[current.id].name}\u3002` };
}
