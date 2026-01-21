import { CLASSES, START_POSITION, expForLevel, maxBagSlots } from './constants.js';
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
  const key = effectsKey(slot.effects);
  return key ? `${slot.id}#${key}` : slot.id;
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
  const mult = rarity === 'legendary'
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
    position: { ...START_POSITION },
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
  const cls = CLASSES[player.classId];
  const base = cls.base;
  const level = player.level;
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
    let atk = item.atk || 0;
    let mag = item.mag || 0;
    let spirit = item.spirit || 0;
    let def = item.def || 0;
    let mdef = item.mdef || 0;
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
    stats.dex += item.dex || 0;
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
    warrior: { hp: 3, mp: 10, atk: 0.5, def: 1, mag: 0, spirit: 0, mdef: 2 },
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
  player.evadeChance = evadeChance;

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

export function addItem(player, itemId, qty = 1, effects = null) {
  if (!player.inventory) player.inventory = [];
  const normalized = normalizeEffects(effects);
  const slot = player.inventory.find((i) => i.id === itemId && sameEffects(i.effects, normalized));
  if (slot) {
    slot.qty += qty;
  } else {
    player.inventory.push({ id: itemId, qty, effects: normalized });
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
    const key = `${id}|${effectsKey(effects)}`;
    const cur = merged.get(key) || { id, qty: 0, effects };
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
    addItem(player, player.equipment[slot].id, 1, player.equipment[slot].effects);
  }

  const maxDur = 100;
  player.equipment[slot] = { id: itemId, durability: maxDur, max_durability: maxDur, effects: has.effects || null };
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
  addItem(player, current.id, 1, current.effects);
  player.equipment[slot] = null;
  computeDerived(player);
  return { ok: true, msg: `\u5DF2\u5378\u4E0B${ITEM_TEMPLATES[current.id].name}\u3002` };
}
