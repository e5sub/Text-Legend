import { CLASSES, START_POSITION, expForLevel, maxBagSlots } from './constants.js';
import { ITEM_TEMPLATES } from './items.js';
import { DEFAULT_SKILLS } from './skills.js';
import { clamp } from './utils.js';

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
      ring: null,
      neck: null,
      head: null,
      waist: null,
      bracelet: null
    },
    quests: {},
    skills: [DEFAULT_SKILLS[classId]].filter(Boolean),
    flags: { tutorial: true, pkValue: 0, vip: false, offlineAt: null, autoSkillId: null, autoHpPct: null, autoMpPct: null },
    status: {}
  };
}

export function computeDerived(player) {
  const cls = CLASSES[player.classId];
  const base = cls.base;
  const level = player.level;
  const bonus = Object.values(player.equipment)
    .filter(Boolean)
    .map((item) => ITEM_TEMPLATES[item.id]);

  const stats = { ...base };
  for (const item of bonus) {
    stats.str += item.atk ? Math.floor(item.atk / 2) : 0;
    stats.dex += item.dex || 0;
    stats.int += item.mag ? Math.floor(item.mag / 2) : 0;
    stats.con += item.def ? Math.floor(item.def / 2) : 0;
    stats.spirit += item.spirit || 0;
  }

  player.stats = stats;
  player.max_hp = base.con * 10 + cls.hpPerLevel * level + stats.con * 2;
  player.max_mp = base.spirit * 8 + cls.mpPerLevel * level + stats.spirit * 2;
  player.hp = clamp(player.hp, 1, player.max_hp);
  player.mp = clamp(player.mp, 0, player.max_mp);

  player.atk = stats.str * 1.6 + level * 1.2;
  player.def = stats.con * 1.1 + level * 0.8;
  player.dex = stats.dex;
  player.mag = stats.int * 1.4 + stats.spirit * 0.6;
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

export function addItem(player, itemId, qty = 1) {
  if (!player.inventory) player.inventory = [];
  const slot = player.inventory.find((i) => i.id === itemId);
  if (slot) {
    slot.qty += qty;
  } else {
    player.inventory.push({ id: itemId, qty });
  }
}

export function normalizeInventory(player) {
  const merged = new Map();
  (player.inventory || []).forEach((slot) => {
    if (!slot || !slot.id) return;
    const id = slot.id;
    const qty = Number(slot.qty || 0);
    if (qty <= 0) return;
    const cur = merged.get(id) || { id, qty: 0 };
    cur.qty += qty;
    merged.set(id, cur);
  });
  player.inventory = Array.from(merged.values());
}

export function removeItem(player, itemId, qty = 1) {
  const slot = player.inventory.find((i) => i.id === itemId);
  if (!slot) return false;
  if (slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) {
    player.inventory = player.inventory.filter((i) => i !== slot);
  }
  return true;
}

export function equipItem(player, itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !item.slot) return { ok: false, msg: '该物品无法装备。' };
  const has = player.inventory.find((i) => i.id === itemId);
  if (!has) return { ok: false, msg: '背包里没有该物品。' };

  if (player.equipment[item.slot]) {
    addItem(player, player.equipment[item.slot].id, 1);
  }

  player.equipment[item.slot] = { id: itemId };
  removeItem(player, itemId, 1);
  computeDerived(player);
  return { ok: true, msg: `已装备 ${item.name}。` };
}

export function unequipItem(player, slot) {
  const current = player.equipment[slot];
  if (!current) return { ok: false, msg: '该部位没有装备。' };
  addItem(player, current.id, 1);
  player.equipment[slot] = null;
  computeDerived(player);
  return { ok: true, msg: `已卸下 ${ITEM_TEMPLATES[current.id].name}。` };
}
