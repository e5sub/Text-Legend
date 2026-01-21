import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

import config from './config.js';
import knex from './db/index.js';
import { createUser, verifyUser, createSession, getSession, getUserByName, setAdminFlag } from './db/users.js';
import { listCharacters, loadCharacter, saveCharacter, findCharacterByName } from './db/characters.js';
import { addGuildMember, createGuild, getGuildByName, getGuildMember, getSabakOwner, isGuildLeader, listGuildMembers, listSabakRegistrations, registerSabak, removeGuildMember, setSabakOwner, clearSabakRegistrations } from './db/guilds.js';
import { createAdminSession, listUsers, verifyAdminSession } from './db/admin.js';
import { sendMail, listMail, markMailRead } from './db/mail.js';
import { createVipCodes, listVipCodes, useVipCode } from './db/vip.js';
import { listMobRespawns, upsertMobRespawn, clearMobRespawn } from './db/mobs.js';
import {
  listConsignments,
  listConsignmentsBySeller,
  getConsignment,
  createConsignment,
  updateConsignmentQty,
  deleteConsignment
} from './db/consignments.js';
import { runMigrations } from './db/migrate.js';
import { newCharacter, computeDerived, gainExp, addItem, removeItem, getItemKey } from './game/player.js';
import { handleCommand, awardKill, summonStats } from './game/commands.js';
import {
  DEFAULT_SKILLS,
  getLearnedSkills,
  getSkill,
  getSkillLevel,
  gainSkillMastery,
  scaledSkillPower,
  hasSkill,
  ensurePlayerSkills
} from './game/skills.js';
import { MOB_TEMPLATES } from './game/mobs.js';
import { ITEM_TEMPLATES } from './game/items.js';
import { WORLD } from './game/world.js';
import { getRoomMobs, getAliveMobs, spawnMobs, removeMob, seedRespawnCache, setRespawnStore } from './game/state.js';
import { calcHitChance, calcDamage, applyDamage, applyPoison, tickStatus } from './game/combat.js';
import { randInt, clamp } from './game/utils.js';
import { expForLevel } from './game/constants.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  const exists = await knex('users').where({ username }).first();
  if (exists) return res.status(400).json({ error: '账号已存在。' });
  await createUser(username, password);
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  const user = await verifyUser(username, password);
  if (!user) return res.status(401).json({ error: '账号或密码错误。' });
  const token = await createSession(user.id);
  const chars = await listCharacters(user.id);
  res.json({ ok: true, token, characters: chars });
});

app.post('/api/character', async (req, res) => {
  const { token, name, classId } = req.body || {};
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  if (!name || !classId) return res.status(400).json({ error: '角色名或职业缺失。' });

  const player = newCharacter(name, classId);
  computeDerived(player);
  await saveCharacter(session.user_id, player);
  res.json({ ok: true });
});

app.get('/api/mail', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  const mails = await listMail(session.user_id);
  res.json({ ok: true, mails });
});

app.post('/api/mail/read', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  const { mailId } = req.body || {};
  await markMailRead(session.user_id, mailId);
  res.json({ ok: true });
});

async function requireAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  return verifyAdminSession(token);
}

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  const user = await verifyUser(username, password);
  if (!user || !user.is_admin) return res.status(401).json({ error: '无管理员权限。' });
  const token = await createAdminSession(user.id);
  res.json({ ok: true, token });
});

app.post('/admin/bootstrap', async (req, res) => {
  const { secret, username } = req.body || {};
  if (!config.adminBootstrapSecret || secret !== config.adminBootstrapSecret) {
    return res.status(401).json({ error: '无权限。' });
  }
  const admins = await knex('users').where({ is_admin: true }).first();
  if (admins) return res.status(400).json({ error: '已存在管理员。' });
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });
  await setAdminFlag(user.id, true);
  res.json({ ok: true });
});

app.get('/admin/users', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const users = await listUsers();
  res.json({ ok: true, users });
});

app.post('/admin/users/promote', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { username, isAdmin } = req.body || {};
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });
  await setAdminFlag(user.id, Boolean(isAdmin));
  res.json({ ok: true });
});

app.post('/admin/characters/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { username, name, patch } = req.body || {};
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });
  const player = await loadCharacter(user.id, name);
  if (!player) return res.status(404).json({ error: '角色不存在。' });
  Object.assign(player, patch || {});
  await saveCharacter(user.id, player);
  res.json({ ok: true });
});

app.post('/admin/mail/send', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { username, title, body } = req.body || {};
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });
  await sendMail(user.id, 'GM', title, body);
  res.json({ ok: true });
});

app.post('/admin/vip/create', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { count } = req.body || {};
  const codes = await createVipCodes(Math.min(Number(count || 1), 100));
  res.json({ ok: true, codes });
});

app.get('/admin/vip/list', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const codes = await listVipCodes();
  res.json({ ok: true, codes });
});

const players = new Map();
const parties = new Map();
const partyInvites = new Map();
const guildInvites = new Map();
const tradeInvites = new Map();
const tradesByPlayer = new Map();

const sabakConfig = {
  startHour: 20,
  durationMinutes: 30,
  siegeMinutes: 30
};
let sabakState = {
  active: false,
  ownerGuildId: null,
  ownerGuildName: null,
  captureGuildId: null,
  captureGuildName: null,
  captureStart: null,
  siegeEndsAt: null,
  killStats: {}
};

function listOnlinePlayers() {
  return Array.from(players.values());
}

function listSabakMembersOnline() {
  if (!sabakState.ownerGuildId) return [];
  return listOnlinePlayers().filter((p) => p.guild && p.guild.id === sabakState.ownerGuildId);
}

function sendTo(player, message) {
  player.socket.emit('output', { text: message });
}

function emitAnnouncement(text, color, location) {
  const payload = { text, prefix: '公告', prefixColor: 'announce', color, location };
  io.emit('output', payload);
  io.emit('chat', payload);
}

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
const RARITY_NORMAL = {
  legendary: 0.001,
  epic: 0.005,
  rare: 0.02,
  uncommon: 0.06,
  common: 0.15
};
const RARITY_BOSS = {
  legendary: 0.007,
  epic: 0.03,
  rare: 0.08,
  uncommon: 0.18,
  common: 0.35
};
const RARITY_LABELS = {
  legendary: '传说',
  epic: '史诗',
  rare: '稀有',
  uncommon: '高级',
  common: '普通'
};

function rarityByPrice(item) {
  if (item.rarity) return item.rarity;
  const price = Number(item.price || 0);
  if (price >= 80000) return 'legendary';
  if (price >= 30000) return 'epic';
  if (price >= 10000) return 'rare';
  if (price >= 2000) return 'uncommon';
  return 'common';
}

const ITEM_POOLS = (() => {
  const pools = { common: [], uncommon: [], rare: [], epic: [], legendary: [] };
  Object.values(ITEM_TEMPLATES).forEach((item) => {
    if (item.type === 'currency') return;
    if (!['weapon', 'armor', 'accessory', 'book', 'material', 'consumable'].includes(item.type)) return;
    const rarity = rarityByPrice(item);
    pools[rarity].push(item.id);
  });
  return pools;
})();

function isSetItem(itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !item.name) return false;
  return item.name.includes('(套)');
}

const EFFECT_SINGLE_CHANCE = 0.005;
const EFFECT_DOUBLE_CHANCE = 0.001;
const COMBO_PROC_CHANCE = 0.1;
const SABAK_TAX_RATE = 0.2;

function buildItemView(itemId, effects = null) {
  const item = ITEM_TEMPLATES[itemId] || { id: itemId, name: itemId, type: 'unknown' };
  return {
    id: itemId,
    name: item.name,
    type: item.type,
    slot: item.slot || null,
    rarity: rarityByPrice(item),
    is_set: isSetItem(itemId),
    price: item.price || 0,
    hp: item.hp || 0,
    mp: item.mp || 0,
    atk: item.atk || 0,
    def: item.def || 0,
    mdef: item.mdef || 0,
    mag: item.mag || 0,
    spirit: item.spirit || 0,
    dex: item.dex || 0,
    effects: effects || null
  };
}

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatItemLabel(itemId, effects = null) {
  const item = ITEM_TEMPLATES[itemId] || { name: itemId };
  if (!effects) return item.name;
  const tags = [];
  if (effects.combo) tags.push('连击');
  if (effects.fury) tags.push('狂攻');
  if (effects.unbreakable) tags.push('不磨');
  if (effects.defense) tags.push('守护');
  if (effects.dodge) tags.push('闪避');
  if (effects.poison) tags.push('毒');
  return tags.length ? `${item.name}·${tags.join('·')}` : item.name;
}

function rollEquipmentEffects(itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return null;
  const candidates = [];
  if (item.type === 'weapon') {
    candidates.push('combo', 'fury');
    candidates.push('poison');
  }
  if (item.type !== 'weapon') {
    candidates.push('defense');
  }
  candidates.push('dodge');
  candidates.push('unbreakable');
  if (candidates.length < 1) return null;
  if (Math.random() <= EFFECT_DOUBLE_CHANCE && candidates.length >= 2) {
    const first = randInt(0, candidates.length - 1);
    let second = randInt(0, candidates.length - 1);
    if (second === first) second = (second + 1) % candidates.length;
    return {
      [candidates[first]]: true,
      [candidates[second]]: true
    };
  }
  if (Math.random() <= EFFECT_SINGLE_CHANCE) {
    const pick = candidates[randInt(0, candidates.length - 1)];
    return { [pick]: true };
  }
  return null;
}

function forceEquipmentEffects(itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return null;
  const existing = rollEquipmentEffects(itemId);
  if (existing) return existing;
  const candidates = [];
  if (item.type === 'weapon') {
    candidates.push('combo', 'fury');
    candidates.push('poison');
  }
  if (item.type !== 'weapon') {
    candidates.push('defense');
  }
  candidates.push('dodge');
  candidates.push('unbreakable');
  const pick = candidates[randInt(0, candidates.length - 1)];
  return { [pick]: true };
}

function isBossMob(mobTemplate) {
  const id = mobTemplate.id;
  return (
    mobTemplate.worldBoss ||
    id.includes('leader') ||
    id.includes('boss') ||
    id.includes('demon') ||
    ['bug_queen', 'huangquan', 'evil_snake', 'pig_white'].includes(id)
  );
}

function isEquipmentItem(item) {
  return Boolean(item && ['weapon', 'armor', 'accessory'].includes(item.type));
}

function hasSpecialEffects(effects) {
  return effects && Object.keys(effects).length > 0;
}

function rollRarityDrop(mobTemplate, bonus = 1) {
  if (!isBossMob(mobTemplate)) return null;
  const table = RARITY_BOSS;
  const allowSet = true;
  for (const rarity of RARITY_ORDER) {
    if (Math.random() <= Math.min(1, table[rarity] * bonus)) {
      const pool = allowSet
        ? ITEM_POOLS[rarity]
        : ITEM_POOLS[rarity].filter((id) => !isSetItem(id));
      if (!pool.length) return null;
      return pool[randInt(0, pool.length - 1)];
    }
  }
  return null;
}

function rollRarityEquipmentDrop(mobTemplate, bonus = 1) {
  if (!isBossMob(mobTemplate)) return null;
  const table = RARITY_BOSS;
  const allowSet = true;
  for (const rarity of RARITY_ORDER) {
    if (Math.random() <= Math.min(1, table[rarity] * bonus)) {
      const pool = allowSet
        ? ITEM_POOLS[rarity]
        : ITEM_POOLS[rarity].filter((id) => !isSetItem(id));
      const equipPool = pool.filter((id) => {
        const item = ITEM_TEMPLATES[id];
        return item && ['weapon', 'armor', 'accessory'].includes(item.type);
      });
      if (!equipPool.length) return null;
      return equipPool[randInt(0, equipPool.length - 1)];
    }
  }
  return null;
}

const WORLD_BOSS_DROP_BONUS = 1.5;

function dropLoot(mobTemplate, bonus = 1) {
  const loot = [];
  const sabakBonus = mobTemplate.sabakBoss ? 3.0 : 1.0;
  const finalBonus = (mobTemplate.worldBoss ? bonus * WORLD_BOSS_DROP_BONUS : bonus) * sabakBonus;
  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      const chance = Math.min(1, (drop.chance || 0) * finalBonus);
      if (Math.random() <= chance) {
        loot.push({ id: drop.id, effects: rollEquipmentEffects(drop.id) });
      }
    });
  }
  const rarityDrop = rollRarityDrop(mobTemplate, finalBonus);
  if (rarityDrop) {
    loot.push({ id: rarityDrop, effects: rollEquipmentEffects(rarityDrop) });
  }
  return loot;
}

async function savePlayer(player) {
  if (!player.userId) return;
  await saveCharacter(player.userId, player);
}

function createParty(leaderName) {
  const partyId = `party-${Date.now()}-${randInt(100, 999)}`;
  parties.set(partyId, { id: partyId, members: [leaderName], lootIndex: 0 });
  return parties.get(partyId);
}

function getPartyByMember(name) {
  for (const party of parties.values()) {
    if (party.members.includes(name)) return party;
  }
  return null;
}

function removeFromParty(name) {
  const party = getPartyByMember(name);
  if (!party) return;
  party.members = party.members.filter((m) => m !== name);
  if (party.members.length === 0) {
    parties.delete(party.id);
  }
}

function getTradeByPlayer(name) {
  return tradesByPlayer.get(name);
}

function clearTrade(trade, reason) {
  const names = [trade.a.name, trade.b.name];
  names.forEach((n) => tradesByPlayer.delete(n));
  if (reason) {
    names.forEach((n) => {
      const p = playersByName(n);
      if (p) p.send(reason);
    });
  }
}

function playersByName(name) {
  return Array.from(players.values()).find((p) => p.name === name);
}

function ensureOffer(trade, playerName) {
  if (!trade.offers[playerName]) {
    trade.offers[playerName] = { gold: 0, items: [] };
  }
  return trade.offers[playerName];
}

function offerText(offer) {
  const parts = [];
  if (offer.gold) parts.push(`金币 ${offer.gold}`);
  offer.items.forEach((i) => {
    const name = formatItemLabel(i.id, i.effects);
    parts.push(`${name} x${i.qty}`);
  });
  return parts.length ? parts.join(', ') : '无';
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
  return Object.keys(normalized).length ? normalized : null;
}

function sameEffects(a, b) {
  const na = normalizeEffects(a);
  const nb = normalizeEffects(b);
  return Boolean((na?.combo || false) === (nb?.combo || false))
    && Boolean((na?.fury || false) === (nb?.fury || false))
    && Boolean((na?.unbreakable || false) === (nb?.unbreakable || false));
}

function findInventorySlot(player, itemId, effects = null) {
  if (!player || !player.inventory) return null;
  const normalized = normalizeEffects(effects);
  if (normalized) {
    return player.inventory.find((i) => i.id === itemId && sameEffects(i.effects, normalized));
  }
  return player.inventory.find((i) => i.id === itemId);
}

function hasOfferItems(player, offer) {
  return offer.items.every((slot) => {
    const inv = findInventorySlot(player, slot.id, slot.effects);
    return inv && inv.qty >= slot.qty;
  });
}

function applyOfferItems(from, to, offer) {
  offer.items.forEach((slot) => {
    removeItem(from, slot.id, slot.qty, slot.effects);
    addItem(to, slot.id, slot.qty, slot.effects);
  });
}

function createTrade(player, target) {
  const trade = {
    id: `trade-${Date.now()}-${randInt(100, 999)}`,
    a: { name: player.name },
    b: { name: target.name },
    offers: {
      [player.name]: { gold: 0, items: [] },
      [target.name]: { gold: 0, items: [] }
    },
    locked: { [player.name]: false, [target.name]: false },
    confirmed: { [player.name]: false, [target.name]: false }
  };
  tradesByPlayer.set(player.name, trade);
  tradesByPlayer.set(target.name, trade);
  return trade;
}

const tradeApi = {
  requestTrade(player, targetName) {
    if (getTradeByPlayer(player.name)) return { ok: false, msg: '你正在交易中。' };
    const target = playersByName(targetName);
    if (!target) return { ok: false, msg: '玩家不在线。' };
    if (target.name === player.name) return { ok: false, msg: '不能和自己交易。' };
    if (getTradeByPlayer(target.name)) return { ok: false, msg: '对方正在交易中。' };
    const existing = tradeInvites.get(target.name);
    if (existing && existing.from !== player.name) {
      return { ok: false, msg: '对方已有交易请求。' };
    }
    tradeInvites.set(target.name, { from: player.name, at: Date.now() });
    target.send(`${player.name} 请求交易，输入 trade accept ${player.name} 接受。`);
    return { ok: true, msg: `交易请求已发送给 ${target.name}。` };
  },
  acceptTrade(player, fromName) {
    const invite = tradeInvites.get(player.name);
    if (!invite || invite.from !== fromName) return { ok: false, msg: '没有该交易请求。' };
    if (getTradeByPlayer(player.name)) return { ok: false, msg: '你正在交易中。' };
    const inviter = playersByName(fromName);
    if (!inviter) return { ok: false, msg: '对方不在线。' };
    if (getTradeByPlayer(inviter.name)) return { ok: false, msg: '对方正在交易中。' };
    tradeInvites.delete(player.name);
    const trade = createTrade(inviter, player);
    const tip = '交易建立。使用 trade add item <物品> <数量> / trade add gold <数量> / trade lock / trade confirm / trade cancel。';
    inviter.send(tip);
    player.send(tip);
    return { ok: true, trade };
  },
  addItem(player, itemId, qty, effects = null) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (trade.locked[player.name] || trade.locked[trade.a.name === player.name ? trade.b.name : trade.a.name]) {
      return { ok: false, msg: '交易已锁定，无法修改。' };
    }
    if (!qty || qty <= 0) return { ok: false, msg: '数量无效。' };
    const inv = findInventorySlot(player, itemId, effects);
    if (!inv || inv.qty < qty) return { ok: false, msg: '背包里没有足够的物品。' };
    const offer = ensureOffer(trade, player.name);
    const existing = offer.items.find((i) => i.id === itemId && sameEffects(i.effects, effects));
    if (existing) existing.qty += qty;
    else offer.items.push({ id: itemId, qty, effects: normalizeEffects(effects) });
    return { ok: true, trade };
  },
  addGold(player, amount) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (trade.locked[player.name] || trade.locked[trade.a.name === player.name ? trade.b.name : trade.a.name]) {
      return { ok: false, msg: '交易已锁定，无法修改。' };
    }
    if (!amount || amount <= 0) return { ok: false, msg: '数量无效。' };
    if (player.gold < amount) return { ok: false, msg: '金币不足。' };
    const offer = ensureOffer(trade, player.name);
    offer.gold += amount;
    return { ok: true, trade };
  },
  lock(player) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    trade.locked[player.name] = true;
    return { ok: true, trade };
  },
  confirm(player) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (!trade.locked[trade.a.name] || !trade.locked[trade.b.name]) {
      return { ok: false, msg: '双方都锁定后才能确认。' };
    }
    trade.confirmed[player.name] = true;
    return { ok: true, trade };
  },
  cancel(player, reason) {
    const trade = getTradeByPlayer(player.name);
    if (trade) {
      clearTrade(trade, reason || `交易已取消（${player.name}）。`);
      return { ok: true };
    }
    if (tradeInvites.get(player.name)) {
      tradeInvites.delete(player.name);
      return { ok: true, msg: '已取消交易请求。' };
    }
    for (const [targetName, invite] of tradeInvites.entries()) {
      if (invite.from === player.name) {
        tradeInvites.delete(targetName);
        return { ok: true, msg: '已取消交易请求。' };
      }
    }
    return { ok: false, msg: '没有可取消的交易。' };
  },
  finalize(trade) {
    const playerA = playersByName(trade.a.name);
    const playerB = playersByName(trade.b.name);
    if (!playerA || !playerB) {
      clearTrade(trade, '交易失败，对方已离线。');
      return { ok: false };
    }
    const offerA = ensureOffer(trade, playerA.name);
    const offerB = ensureOffer(trade, playerB.name);
    if (playerA.gold < offerA.gold || playerB.gold < offerB.gold ||
      !hasOfferItems(playerA, offerA) || !hasOfferItems(playerB, offerB)) {
      clearTrade(trade, '交易失败，物品或金币不足。');
      return { ok: false };
    }
    playerA.gold -= offerA.gold;
    playerB.gold += offerA.gold;
    playerB.gold -= offerB.gold;
    playerA.gold += offerB.gold;
    applyOfferItems(playerA, playerB, offerA);
    applyOfferItems(playerB, playerA, offerB);
    clearTrade(trade, '交易完成。');
    return { ok: true };
  },
  getTrade(playerName) {
    return getTradeByPlayer(playerName);
  },
  offerText
};

const CONSIGN_EQUIPMENT_TYPES = new Set(['weapon', 'armor', 'accessory', 'book']);

const consignApi = {
    async listMarket(player) {
      const rows = await listConsignments();
      const items = rows.map((row) => ({
        id: row.id,
        seller: row.seller_name,
        qty: row.qty,
        price: row.price,
        item: buildItemView(row.item_id, parseJson(row.effects_json))
      }));
      player.socket.emit('consign_list', { type: 'market', items });
      return items;
    },
    async listMine(player) {
      const rows = await listConsignmentsBySeller(player.name);
      const items = rows.map((row) => ({
        id: row.id,
        seller: row.seller_name,
        qty: row.qty,
        price: row.price,
        item: buildItemView(row.item_id, parseJson(row.effects_json))
      }));
      player.socket.emit('consign_list', { type: 'mine', items });
      return items;
    },
    async sell(player, itemId, qty, price, effects = null) {
      const item = ITEM_TEMPLATES[itemId];
      if (!item) return { ok: false, msg: '未找到物品。' };
      if (!CONSIGN_EQUIPMENT_TYPES.has(item.type)) return { ok: false, msg: '仅可寄售装备。' };
      if (qty <= 0 || price <= 0) return { ok: false, msg: '数量或价格无效。' };
      if (!removeItem(player, itemId, qty, effects)) return { ok: false, msg: '背包里没有足够数量。' };
      const id = await createConsignment({
        sellerName: player.name,
        itemId,
        qty,
        price,
        effectsJson: effects ? JSON.stringify(effects) : null
      });
      await consignApi.listMine(player);
      await consignApi.listMarket(player);
      return { ok: true, msg: `寄售成功，编号 ${id}。` };
    },
  async buy(player, listingId, qty) {
    if (qty <= 0) return { ok: false, msg: '购买数量无效。' };
    const row = await getConsignment(listingId);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name === player.name) return { ok: false, msg: '不能购买自己的寄售。' };
    if (row.qty < qty) return { ok: false, msg: '寄售数量不足。' };
    const total = row.price * qty;
    if (player.gold < total) return { ok: false, msg: '金币不足。' };

    player.gold -= total;
      addItem(player, row.item_id, qty, parseJson(row.effects_json));

    const remain = row.qty - qty;
    if (remain > 0) {
      await updateConsignmentQty(listingId, remain);
    } else {
      await deleteConsignment(listingId);
    }

    const seller = playersByName(row.seller_name);
    if (seller) {
      seller.gold += total;
      seller.send(`寄售成交: ${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qty}，获得 ${total} 金币。`);
      savePlayer(seller);
      await consignApi.listMine(seller);
      await consignApi.listMarket(seller);
    } else {
      const sellerRow = await findCharacterByName(row.seller_name);
      if (sellerRow) {
        const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name);
        if (sellerPlayer) {
          sellerPlayer.gold += total;
          await saveCharacter(sellerRow.user_id, sellerPlayer);
        }
      }
    }
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    return { ok: true, msg: `购买成功，花费 ${total} 金币。` };
  },
  async cancel(player, listingId) {
    const row = await getConsignment(listingId);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name !== player.name) return { ok: false, msg: '只能取消自己的寄售。' };
      addItem(player, row.item_id, row.qty, parseJson(row.effects_json));
    await deleteConsignment(listingId);
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    return { ok: true, msg: '寄售已取消，物品已返回背包。' };
  }
};

function partyMembersInRoom(party, playersList, zone, room) {
  return party.members
    .map((name) => playersList.find((p) => p.name === name))
    .filter((p) => p && p.position.zone === zone && p.position.room === room);
}

function distributeLoot(party, partyMembers, drops) {
  if (!drops.length || !party || partyMembers.length === 0) return [];
  const results = [];
  drops.forEach((entry) => {
    const itemId = entry.id || entry;
    const effects = entry.effects || null;
    const target = partyMembers[randInt(0, partyMembers.length - 1)];
    addItem(target, itemId, 1, effects);
    results.push({ id: itemId, effects, target });
    partyMembers.forEach((member) => {
      member.send(`队伍掉落: ${formatItemLabel(itemId, effects)} -> ${target.name}`);
    });
  });
  return results;
}

async function loadSabakState() {
  const owner = await getSabakOwner();
  if (owner) {
    sabakState.ownerGuildId = owner.owner_guild_id || null;
    sabakState.ownerGuildName = owner.owner_guild_name || null;
  }
}

function isSabakZone(zoneId) {
  return typeof zoneId === 'string' && zoneId.startsWith('sb_');
}

function sabakWindowRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(sabakConfig.startHour, 0, 0, 0);
  const end = new Date(start.getTime() + sabakConfig.durationMinutes * 60 * 1000);
  return { start, end };
}

function isSabakActive(now = new Date()) {
  const { start, end } = sabakWindowRange(now);
  return now >= start && now <= end;
}

function sabakWindowInfo() {
  const startHour = String(sabakConfig.startHour).padStart(2, '0');
  const endMinute = sabakConfig.durationMinutes;
  return `每天 ${startHour}:00-${startHour}:${String(endMinute).padStart(2, '0')}`;
}

async function autoCaptureSabak(player) {
  if (!player || !player.guild || !isSabakZone(player.position.zone)) return false;
  if (sabakState.ownerGuildId) return false;
  sabakState.ownerGuildId = player.guild.id;
  sabakState.ownerGuildName = player.guild.name;
  await setSabakOwner(player.guild.id, player.guild.name);
  emitAnnouncement(`沙巴克无人占领，${player.guild.name} 已占领沙巴克。`, 'announce');
  return true;
}

function startSabakSiege(attackerGuild) {
  if (sabakState.active || !sabakState.ownerGuildId) return;
  if (!isSabakActive()) return;
  const { end } = sabakWindowRange(new Date());
  sabakState.active = true;
  sabakState.siegeEndsAt = end.getTime();
  sabakState.killStats = {};
  if (sabakState.ownerGuildId) {
    sabakState.killStats[sabakState.ownerGuildId] = {
      name: sabakState.ownerGuildName || '守城行会',
      kills: 0
    };
  }
  if (attackerGuild && attackerGuild.id) {
    sabakState.killStats[attackerGuild.id] = {
      name: attackerGuild.name || '攻城行会',
      kills: 0
    };
  }
  emitAnnouncement(`沙巴克攻城战开始！时长 ${sabakConfig.siegeMinutes} 分钟。`, 'announce');
}

async function finishSabakSiege() {
  sabakState.active = false;
  sabakState.siegeEndsAt = null;
  const entries = Object.entries(sabakState.killStats || {});
  let winnerId = sabakState.ownerGuildId;
  let winnerName = sabakState.ownerGuildName;
  let topKills = -1;
  let tie = false;
  entries.forEach(([guildId, info]) => {
    const kills = info?.kills || 0;
    if (kills > topKills) {
      topKills = kills;
      winnerId = guildId;
      winnerName = info?.name || winnerName;
      tie = false;
    } else if (kills === topKills) {
      tie = true;
    }
  });
  if (entries.length === 0 || tie) {
    emitAnnouncement('沙巴克攻城战结束，守城方继续守城。', 'announce');
  } else if (winnerId && winnerId !== sabakState.ownerGuildId) {
    sabakState.ownerGuildId = winnerId;
    sabakState.ownerGuildName = winnerName;
    await setSabakOwner(winnerId, winnerName || '未知行会');
    emitAnnouncement(`沙巴克被 ${winnerName} 占领！`, 'announce');
  } else {
    emitAnnouncement('沙巴克攻城战结束，守城方成功守住。', 'announce');
  }
  sabakState.killStats = {};
}

function recordSabakKill(attacker, target) {
  if (!attacker || !target) return;
  if (!isSabakZone(attacker.position.zone)) return;
  if (!attacker.guild) return;
  if (attacker.guild && target.guild && attacker.guild.id === target.guild.id) return;
  if (!sabakState.ownerGuildId) return;
  if (attacker.guild.id !== sabakState.ownerGuildId && !sabakState.active) {
    startSabakSiege(attacker.guild);
  }
  const entry = sabakState.killStats[attacker.guild.id] || {
    name: attacker.guild.name,
    kills: 0
  };
  entry.kills += 1;
  sabakState.killStats[attacker.guild.id] = entry;
}

async function handleSabakEntry(player) {
  if (!player || !player.guild) return;
  if (!isSabakZone(player.position.zone)) return;
  if (!sabakState.ownerGuildId) {
    await autoCaptureSabak(player);
    return;
  }
  if (player.guild.id !== sabakState.ownerGuildId && !sabakState.active) {
    startSabakSiege(player.guild);
  }
}

function isRedName(player) {
  return (player.flags?.pkValue || 0) >= 100;
}

function hasEquipped(player, itemId) {
  return Object.values(player.equipment || {}).some((eq) => eq && eq.id === itemId);
}

function hasComboWeapon(player) {
  const weapon = player?.equipment?.weapon;
  return Boolean(weapon && weapon.effects && weapon.effects.combo);
}

function applyDamageToPlayer(target, dmg) {
  if (target.status?.buffs?.magicShield) {
    const buff = target.status.buffs.magicShield;
    if (buff.expiresAt && buff.expiresAt < Date.now()) {
      delete target.status.buffs.magicShield;
    } else if (target.mp > 0) {
      const ratio = Math.max(0, Math.min(0.9, buff.ratio || 0.6));
      const convert = Math.min(Math.floor(dmg * ratio), target.mp);
      target.mp = Math.max(0, target.mp - convert);
      dmg -= convert;
    }
  }
  if (hasEquipped(target, 'ring_protect') && target.mp > 0) {
    const convert = Math.min(Math.floor(dmg * 0.7), target.mp);
    target.mp = Math.max(0, target.mp - convert);
    dmg -= convert;
  }
  applyDamage(target, dmg);
}

function tryRevive(player) {
  if (player.hp > 0) return false;
  if (hasEquipped(player, 'ring_revival')) {
    for (const [slot, equipped] of Object.entries(player.equipment)) {
      if (equipped && equipped.id === 'ring_revival') {
        player.equipment[slot] = null;
        break;
      }
    }
    player.hp = Math.max(1, Math.floor(player.max_hp * 0.1));
    player.mp = Math.max(0, Math.floor(player.max_mp * 0.1));
    player.send('复活戒指生效，你重新站了起来。');
    return true;
  }
  return false;
}

function regenOutOfCombat(player) {
  if (player.hp <= 0) return;
  const now = Date.now();
  if (!player.flags) player.flags = {};
  const lastCombatAt = player.flags.lastCombatAt || 0;
  if (now - lastCombatAt < 5000) return;
  const hpRegen = Math.max(1, Math.floor(player.max_hp * 0.01));
  const mpRegen = Math.max(1, Math.floor(player.max_mp * 0.015));
  player.hp = clamp(player.hp + hpRegen, 1, player.max_hp);
  player.mp = clamp(player.mp + mpRegen, 0, player.max_mp);
}

function processPotionRegen(player) {
  if (!player.status) return;
  const regen = player.status.regen;
  if (!regen) {
    return;
  }
  if (regen.ticksRemaining <= 0) {
    delete player.status.regen;
    return;
  }
  if (regen.hpRemaining && regen.hpRemaining > 0) {
    const amount = Math.ceil(regen.hpRemaining / regen.ticksRemaining);
    player.hp = clamp(player.hp + amount, 1, player.max_hp);
    regen.hpRemaining -= amount;
  }
  if (regen.mpRemaining && regen.mpRemaining > 0) {
    const amount = Math.ceil(regen.mpRemaining / regen.ticksRemaining);
    player.mp = clamp(player.mp + amount, 0, player.max_mp);
    regen.mpRemaining -= amount;
  }
  regen.ticksRemaining -= 1;
  if (regen.ticksRemaining <= 0) {
    delete player.status.regen;
  }
}
function applyOfflineRewards(player) {
  if (!player.flags) player.flags = {};
  const offlineAt = player.flags.offlineAt;
  if (!offlineAt) return;
  const maxHours = player.flags.vip ? 24 : 12;
  const offlineMinutes = Math.min(Math.floor((Date.now() - offlineAt) / 60000), maxHours * 60);
  if (offlineMinutes <= 0) return;
  const expGain = Math.floor(offlineMinutes * (6 + player.level * 2));
  const goldGain = Math.floor(offlineMinutes * (4 + player.level));
  gainExp(player, expGain);
  player.gold += goldGain;
  player.flags.offlineAt = null;
  player.send(`离线挂机收益: ${expGain} 经验, ${goldGain} 金币。`);
}

function transferAllInventory(from, to) {
  const items = from.inventory.map((i) => `${formatItemLabel(i.id, i.effects)} x${i.qty}`);
  from.inventory.forEach((slot) => {
    addItem(to, slot.id, slot.qty, slot.effects);
  });
  from.inventory = [];
  return items;
}

function transferOneEquipmentChance(from, to, chance) {
  if (Math.random() > chance) return [];
  const equippedList = Object.entries(from.equipment).filter(([, equipped]) => equipped);
  if (!equippedList.length) return [];
  const [slot, equipped] = equippedList[randInt(0, equippedList.length - 1)];
  addItem(to, equipped.id, 1, equipped.effects);
  from.equipment[slot] = null;
  return [formatItemLabel(equipped.id, equipped.effects)];
}

function buildState(player) {
  const zone = WORLD[player.position.zone];
  const room = zone?.rooms[player.position.room];
  if (zone && room) spawnMobs(player.position.zone, player.position.room);
  const mobs = getAliveMobs(player.position.zone, player.position.room).map((m) => ({
    id: m.id,
    name: m.name,
    hp: m.hp,
    max_hp: m.max_hp,
    mdef: m.mdef || 0
  }));
  const exits = room ? Object.keys(room.exits).map((dir) => {
    const dest = room.exits[dir];
    let zoneId = player.position.zone;
    let roomId = dest;
    if (dest.includes(':')) {
      [zoneId, roomId] = dest.split(':');
    }
    const destZone = WORLD[zoneId];
    const destRoom = destZone?.rooms[roomId];
    const label = destRoom
      ? (zoneId === player.position.zone ? destRoom.name : `${destZone.name} - ${destRoom.name}`)
      : dest;
    return { dir, label };
  }) : [];
  const skills = getLearnedSkills(player).map((s) => ({
    id: s.id,
    name: s.name,
    mp: s.mp,
    type: s.type,
    level: getSkillLevel(player, s.id)
  }));
  const items = player.inventory.map((i) => {
    const item = ITEM_TEMPLATES[i.id] || { id: i.id, name: i.id, type: 'unknown' };
    const effects = i.effects || null;
    return {
      id: i.id,
      key: getItemKey(i),
      name: item.name,
      qty: i.qty,
      type: item.type,
      slot: item.slot || null,
      rarity: rarityByPrice(item),
      is_set: isSetItem(item.id),
      price: item.price || 0,
      hp: item.hp || 0,
      mp: item.mp || 0,
      atk: item.atk || 0,
      def: item.def || 0,
      mdef: item.mdef || 0,
      mag: item.mag || 0,
      spirit: item.spirit || 0,
      dex: item.dex || 0,
      effects
    };
  });
  const equipment = Object.entries(player.equipment || {})
    .filter(([, equipped]) => equipped && equipped.id)
    .map(([slot, equipped]) => ({
      slot,
      durability: equipped.durability ?? null,
      max_durability: equipped.max_durability ?? null,
      item: buildItemView(equipped.id, equipped.effects || null)
    }));
  const party = getPartyByMember(player.name);
  const partyMembers = party
    ? party.members.map((name) => ({
        name,
        online: Boolean(playersByName(name))
      }))
    : null;
  const sabakBonus = Boolean(
    player.guild && sabakState.ownerGuildId && player.guild.id === sabakState.ownerGuildId
  );
  const onlineCount = players.size;
  const roomPlayers = listOnlinePlayers()
    .filter((p) => p.position.zone === player.position.zone && p.position.room === player.position.room)
    .map((p) => ({
      name: p.name,
      classId: p.classId,
      level: p.level,
      guild: p.guild?.name || null,
      guildId: p.guild?.id || null
    }));
  let worldBossRank = [];
  const bossMob = getAliveMobs(player.position.zone, player.position.room).find((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.worldBoss;
  });
  if (bossMob && bossMob.status?.damageBy) {
    const { entries } = buildDamageRankMap(bossMob);
    worldBossRank = entries.slice(0, 5).map(([name, damage]) => ({ name, damage }));
  }
  return {
    player: {
      name: player.name,
      classId: player.classId,
      level: player.level,
      guildId: player.guild?.id || null
    },
    room: {
      zone: zone?.name || player.position.zone,
      name: room?.name || player.position.room,
      zoneId: player.position.zone,
      roomId: player.position.room
    },
    exits,
    mobs,
    skills,
    items,
    stats: {
      hp: player.hp,
      max_hp: player.max_hp,
      mp: player.mp,
      max_mp: player.max_mp,
      exp: player.exp,
      exp_next: expForLevel(player.level),
      gold: player.gold,
      atk: Math.floor(player.atk || 0),
      def: Math.floor(player.def || 0),
      mag: Math.floor(player.mag || 0),
      spirit: Math.floor(player.spirit || 0),
      mdef: Math.floor(player.mdef || 0),
      pk: player.flags?.pkValue || 0,
      vip: Boolean(player.flags?.vip),
      autoSkillId: player.flags?.autoSkillId || null,
      sabak_bonus: sabakBonus
    },
    summon: player.summon
      ? {
          name: player.summon.name,
          level: player.summon.level,
          levelMax: SUMMON_MAX_LEVEL,
          hp: player.summon.hp,
          max_hp: player.summon.max_hp,
          atk: player.summon.atk,
          def: player.summon.def
        }
      : null,
    equipment,
    guild: player.guild?.name || null,
    guild_role: player.guild?.role || null,
    party: party ? { size: party.members.length, members: partyMembers } : null,
    training: player.flags?.training || { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 },
    online: { count: onlineCount },
    sabak: {
      inZone: isSabakZone(player.position.zone),
      active: sabakState.active,
      ownerGuildId: sabakState.ownerGuildId,
      ownerGuildName: sabakState.ownerGuildName
    },
    worldBossRank,
    players: roomPlayers,
    server_time: Date.now()
  };
}

function sendState(player) {
  if (!player.socket) return;
  player.socket.emit('state', buildState(player));
}

function sendRoomState(zoneId, roomId) {
  listOnlinePlayers()
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId)
    .forEach((p) => sendState(p));
}

const WORLD_BOSS_ROOM = { zoneId: 'wb', roomId: 'lair' };
const SUMMON_MAX_LEVEL = 8;
const SUMMON_EXP_PER_LEVEL = 5;

function checkWorldBossRespawn() {
  const { zoneId, roomId } = WORLD_BOSS_ROOM;
  const mobs = spawnMobs(zoneId, roomId);
  const respawned = mobs.filter((m) => m.justRespawned);
  if (!respawned.length) return;
  respawned.forEach((mob) => {
    mob.justRespawned = false;
  });
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  const bossName = respawned[0]?.name || '世界BOSS';
  emitAnnouncement(
    `${bossName} 已刷新，点击 世界BOSS领域 - 炎龙巢穴 前往。`,
    'announce',
    {
      zoneId,
      roomId,
      label: zone && room ? `${zone.name} - ${room.name}` : `${zoneId}:${roomId}`
    }
  );
}

function recordMobDamage(mob, attackerName, dmg) {
  if (!mob) return;
  if (!mob.status) mob.status = {};
  if (!mob.status.damageBy) mob.status.damageBy = {};
  if (!mob.status.firstHitBy) mob.status.firstHitBy = attackerName;
  if (!attackerName) return;
  mob.status.damageBy[attackerName] = (mob.status.damageBy[attackerName] || 0) + dmg;
  const damageBy = mob.status.damageBy;
  let maxName = attackerName;
  let maxDamage = -1;
  Object.entries(damageBy).forEach(([name, total]) => {
    if (total > maxDamage) {
      maxDamage = total;
      maxName = name;
    }
  });
  mob.status.aggroTarget = maxName;
}

function gainSummonExp(player) {
  if (!player.summon) return;
  const skill = getSkill(player.classId, player.summon.id);
  if (!skill) return;
  const skillLevel = getSkillLevel(player, skill.id);
  let summonLevel = player.summon.summonLevel || player.summon.level || skillLevel || 1;
  let exp = player.summon.exp || 0;
  exp += 1;
  let leveled = false;
  while (summonLevel < SUMMON_MAX_LEVEL && exp >= SUMMON_EXP_PER_LEVEL) {
    exp -= SUMMON_EXP_PER_LEVEL;
    summonLevel += 1;
    leveled = true;
  }
  if (leveled) {
    const ratio = player.summon.max_hp ? player.summon.hp / player.summon.max_hp : 1;
    const nextSummon = summonStats(player, skill, summonLevel);
    player.summon = { ...nextSummon, exp };
    player.summon.hp = clamp(Math.floor(player.summon.max_hp * ratio), 1, player.summon.max_hp);
    player.send(`${player.summon.name} 升到 ${summonLevel} 级。`);
  } else {
    player.summon.exp = exp;
  }
}

function applyDamageToMob(mob, dmg, attackerName) {
  recordMobDamage(mob, attackerName, dmg);
  applyDamage(mob, dmg);
}

function getMagicDefenseMultiplier(target) {
  const debuffs = target.status?.debuffs || {};
  const now = Date.now();
  let multiplier = 1;
  const poison = debuffs.poison;
  if (poison) {
    if (poison.expiresAt && poison.expiresAt < now) {
      delete debuffs.poison;
    } else {
      multiplier *= poison.mdefMultiplier || 1;
    }
  }
  const poisonEffect = debuffs.poisonEffect;
  if (poisonEffect) {
    if (poisonEffect.expiresAt && poisonEffect.expiresAt < now) {
      delete debuffs.poisonEffect;
    } else {
      multiplier *= poisonEffect.mdefMultiplier || 1;
    }
  }
  return multiplier;
}

function tryConsumePoisonPowders() {
  return true;
}

function applyPoisonDebuff(target) {
  if (!target.status) target.status = {};
  if (!target.status.debuffs) target.status.debuffs = {};
  target.status.debuffs.poison = {
    defMultiplier: 0.8,
    mdefMultiplier: 0.8,
    expiresAt: Date.now() + 8000
  };
}

function applyPoisonEffectDebuff(target) {
  if (!target.status) target.status = {};
  if (!target.status.debuffs) target.status.debuffs = {};
  target.status.debuffs.poisonEffect = {
    defMultiplier: 0.95,
    mdefMultiplier: 0.95,
    expiresAt: Date.now() + 10000
  };
}

function calcPoisonTickDamage(target) {
  const maxHp = Math.max(1, target.max_hp || 1);
  const total = Math.max(1, Math.floor(maxHp * 0.2));
  return Math.max(1, Math.floor(total / 30));
}

function calcPoisonEffectTickDamage(target) {
  const maxHp = Math.max(1, target.max_hp || 1);
  const total = Math.max(1, Math.floor(maxHp * 0.05));
  return Math.max(1, Math.floor(total / 10));
}

function tryApplyPoisonEffect(attacker, target) {
  if (!attacker || !target) return false;
  const weapon = attacker.equipment?.weapon;
  if (!weapon || !weapon.effects || !weapon.effects.poison) return false;
  if (Math.random() > 0.1) return false;
  applyPoison(target, 10, calcPoisonEffectTickDamage(target), attacker.name);
  applyPoisonEffectDebuff(target);
  return true;
}

function buildDamageRankMap(mob, damageByOverride = null) {
  const damageBy = damageByOverride || mob.status?.damageBy || {};
  const entries = Object.entries(damageBy).sort((a, b) => b[1] - a[1]);
  const rankMap = {};
  entries.forEach(([name], idx) => {
    rankMap[name] = idx + 1;
  });
  return { rankMap, entries };
}

function rankDropBonus(rank) {
  if (!rank || rank <= 0) return 1;
  if (rank === 1) return 2.0;
  if (rank === 2) return 1.6;
  if (rank === 3) return 1.3;
  if (rank <= 5) return 1.15;
  return 1.0;
}

function consumeItem(player, itemId) {
  const slot = player.inventory.find((i) => i.id === itemId);
  if (!slot) return false;
  slot.qty -= 1;
  if (slot.qty <= 0) {
    player.inventory = player.inventory.filter((i) => i !== slot);
  }
  return true;
}

function tryAutoPotion(player) {
  const hpPct = player.flags?.autoHpPct;
  const mpPct = player.flags?.autoMpPct;
  if (!hpPct && !mpPct) return;
  const now = Date.now();
  const instantIds = new Set(['sun_water', 'snow_frost']);
  const ticks = 5;

  const hpRate = player.hp / player.max_hp;
  const mpRate = player.mp / player.max_mp;

  const hpList = ['snow_frost', 'potion_super', 'potion_big', 'potion_mid', 'potion_small', 'sun_water'];
  const mpList = ['snow_frost', 'potion_mana_super', 'potion_mana_big', 'potion_mana_mid', 'potion_mana', 'sun_water'];

  if (!player.status) player.status = {};
  if (!player.status.potionLock) player.status.potionLock = {};
  const potionLock = player.status.potionLock;

  if (hpPct && hpRate <= hpPct / 100) {
    const lockActive = potionLock.hp && potionLock.hp > now;
    const candidates = hpList.filter((pid) => player.inventory.find((i) => i.id === pid));
    const id = (lockActive ? candidates.filter((pid) => instantIds.has(pid)) : candidates)[0];
    if (id && consumeItem(player, id)) {
      const item = ITEM_TEMPLATES[id];
      const isInstant = instantIds.has(id);
      if (isInstant) {
        if (item.hp) player.hp = clamp(player.hp + item.hp, 1, player.max_hp);
        if (item.mp) player.mp = clamp(player.mp + item.mp, 0, player.max_mp);
      } else if (!lockActive) {
        player.status.regen = {
          ticksRemaining: ticks,
          hpRemaining: item.hp || 0,
          mpRemaining: item.mp || 0
        };
        potionLock.hp = now + ticks * 1000;
      }
      player.send(`自动使用 ${item.name}。`);
    }
  }

  if (mpPct && mpRate <= mpPct / 100) {
    const lockActive = potionLock.mp && potionLock.mp > now;
    const candidates = mpList.filter((pid) => player.inventory.find((i) => i.id === pid));
    const id = (lockActive ? candidates.filter((pid) => instantIds.has(pid)) : candidates)[0];
    if (id && consumeItem(player, id)) {
      const item = ITEM_TEMPLATES[id];
      const isInstant = instantIds.has(id);
      if (isInstant) {
        if (item.hp) player.hp = clamp(player.hp + item.hp, 1, player.max_hp);
        if (item.mp) player.mp = clamp(player.mp + item.mp, 0, player.max_mp);
      } else if (!lockActive) {
        player.status.regen = {
          ticksRemaining: ticks,
          hpRemaining: item.hp || 0,
          mpRemaining: item.mp || 0
        };
        potionLock.mp = now + ticks * 1000;
      }
      player.send(`自动使用 ${item.name}。`);
    }
  }
}

io.on('connection', (socket) => {
  socket.on('auth', async ({ token, name }) => {
    const session = await getSession(token);
    if (!session) {
      socket.emit('auth_error', { error: '登录已过期。' });
      socket.disconnect();
      return;
    }

    const loaded = await loadCharacter(session.user_id, name);
    if (!loaded) {
      socket.emit('auth_error', { error: '角色不存在。' });
      socket.disconnect();
      return;
    }

    computeDerived(loaded);
    loaded.userId = session.user_id;
    loaded.socket = socket;
    loaded.send = (msg) => sendTo(loaded, msg);
    loaded.combat = null;
    loaded.guild = null;

    const member = await getGuildMember(session.user_id, name);
    if (member && member.guild) {
      loaded.guild = { id: member.guild.id, name: member.guild.name, role: member.role };
    }

    players.set(socket.id, loaded);
    loaded.send(`欢迎回来，${loaded.name}。`);
    loaded.send('输入 help 查看指令。');
    loaded.send(`金币: ${loaded.gold}`);
    if (loaded.guild) loaded.send(`行会: ${loaded.guild.name}`);
    applyOfflineRewards(loaded);
    spawnMobs(loaded.position.zone, loaded.position.room);
    await handleSabakEntry(loaded);
    const zone = WORLD[loaded.position.zone];
    const room = zone?.rooms[loaded.position.room];
    const locationName = zone && room ? `${zone.name} - ${room.name}` : `${loaded.position.zone}:${loaded.position.room}`;
    loaded.send(`你位于 ${locationName}。输入 look 查看。`);
    sendState(loaded);
  });

  socket.on('cmd', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const prevZone = player.position.zone;
    const prevRoom = player.position.room;
    await handleCommand({
      player,
      players: listOnlinePlayers(),
      input: payload.text || '',
      send: (msg) => sendTo(player, msg),
      partyApi: {
        parties,
        invites: partyInvites,
        createParty,
        getPartyByMember,
        removeFromParty
      },
      guildApi: {
        invites: guildInvites,
        createGuild,
        getGuildByName,
        addGuildMember,
        removeGuildMember,
        listGuildMembers,
        isGuildLeader,
        registerSabak,
        listSabakRegistrations,
        sabakState,
        sabakConfig,
        sabakWindowInfo,
        useVipCode
      },
      tradeApi,
      consignApi,
      mailApi: {
        listMail,
        markMailRead
      }
    });
    if (
      (player.position.zone !== prevZone || player.position.room !== prevRoom) &&
      isSabakZone(player.position.zone)
    ) {
      await handleSabakEntry(player);
    }
    sendState(player);
    await savePlayer(player);
  });

  socket.on('guild_members', async () => {
    const player = players.get(socket.id);
    if (!player || !player.guild) {
      socket.emit('guild_members', { ok: false, error: '你不在行会中。' });
      return;
    }
    const members = await listGuildMembers(player.guild.id);
    const online = listOnlinePlayers();
    const memberList = members.map((m) => ({
      name: m.char_name,
      role: m.role,
      online: online.some((p) => p.name === m.char_name)
    }));
    socket.emit('guild_members', {
      ok: true,
      guild: { id: player.guild.id, name: player.guild.name },
      role: player.guild.role || 'member',
      members: memberList
    });
  });

  socket.on('disconnect', async () => {
    const player = players.get(socket.id);
    if (player) {
      if (!player.flags) player.flags = {};
      player.flags.offlineAt = Date.now();
      player.summon = null;
      const trade = getTradeByPlayer(player.name);
      if (trade) {
        clearTrade(trade, `交易已取消（${player.name} 离线）。`);
      }
      await savePlayer(player);
      players.delete(socket.id);
    }
  });
});

function skillForPlayer(player, skillId) {
  ensurePlayerSkills(player);
  if (skillId && hasSkill(player, skillId)) {
    return getSkill(player.classId, skillId);
  }
  const fallbackId = DEFAULT_SKILLS[player.classId];
  return getSkill(player.classId, fallbackId);
}

function notifyMastery(player, skill) {
  const levelUp = gainSkillMastery(player, skill.id, 1);
  if (levelUp) {
    const level = getSkillLevel(player, skill.id);
    player.send(`技能熟练度提升: ${skill.name} Lv${level}`);
  }
}

function refreshBuffs(target) {
  const buffs = target.status?.buffs;
  if (!buffs) return;
  const now = Date.now();
  Object.entries(buffs).forEach(([key, buff]) => {
    if (buff && buff.expiresAt && buff.expiresAt < now) {
      delete buffs[key];
    }
  });
}

function updateRedNameAutoClear(player) {
  if (!player.flags) player.flags = {};
  const pkValue = player.flags.pkValue || 0;
  if (pkValue <= 0) {
    player.flags.pkReduceAt = null;
    return;
  }
  if (!player.flags.autoSkillId) {
    player.flags.pkReduceAt = null;
    return;
  }
  if (!player.flags.pkReduceAt) {
    player.flags.pkReduceAt = Date.now() + 60 * 60 * 1000;
  }
  if (Date.now() >= player.flags.pkReduceAt) {
    player.flags.pkValue = Math.max(0, pkValue - 100);
    player.flags.pkReduceAt = Date.now() + 60 * 60 * 1000;
    player.send('PK值降低 100。');
    savePlayer(player);
  }
}

function selectAutoSkill(player) {
  const learned = getLearnedSkills(player).filter((skill) =>
    ['attack', 'spell', 'cleave', 'dot', 'aoe'].includes(skill.type)
  );
  const usable = learned.filter((skill) => player.mp >= skill.mp);
  if (!usable.length) return null;
  usable.sort((a, b) => (b.power || 1) - (a.power || 1));
  return usable[0].id;
}

function pickCombatSkillId(player, combatSkillId) {
  if (player.flags?.autoSkillId) {
    const autoSkill = player.flags.autoSkillId;
    if (Array.isArray(autoSkill)) {
      const choices = autoSkill
        .map((id) => getSkill(player.classId, id))
        .filter((skill) => skill && player.mp >= skill.mp);
      if (!choices.length) return combatSkillId;
      return choices[randInt(0, choices.length - 1)].id;
    }
    const autoId = autoSkill === 'all'
      ? selectAutoSkill(player)
      : autoSkill;
    return autoId || combatSkillId;
  }
  return combatSkillId;
}

function consumeFirestrikeCrit(player, targetType, isNormalAttack) {
  if (!player.status || !player.status.firestrikeCrit) return 1;
  if (!isNormalAttack) return 1;
  delete player.status.firestrikeCrit;
  if (targetType === 'mob') return 2.0;
  if (targetType === 'player') return Math.random() <= 0.5 ? 1.2 : 1.0;
  return 1;
}

function autoResummon(player) {
  if (!player || player.hp <= 0) return false;
  const skills = getLearnedSkills(player).filter((skill) => skill.type === 'summon');
  if (!skills.length) return false;
  const summonSkill = skills.sort((a, b) => getSkillLevel(player, b.id) - getSkillLevel(player, a.id))[0];
  if (!summonSkill || player.mp < summonSkill.mp) return false;
  player.mp = clamp(player.mp - summonSkill.mp, 0, player.max_mp);
  const skillLevel = getSkillLevel(player, summonSkill.id);
  const summon = summonStats(player, summonSkill, skillLevel);
  player.summon = { ...summon, exp: 0 };
  player.send(`召唤物被击败，自动召唤 ${summon.name} (等级 ${summon.level})。`);
  return true;
}

function reduceDurabilityOnAttack(player) {
  if (!player || !player.equipment) return;
  if (!player.flags) player.flags = {};
  player.flags.attackCount = (player.flags.attackCount || 0) + 1;
  const threshold = player.flags.vip ? 100 : 50;
  if (player.flags.attackCount < threshold) return;
  player.flags.attackCount = 0;
  let broken = false;
    Object.values(player.equipment).forEach((equipped) => {
      if (!equipped || !equipped.id || equipped.durability == null || equipped.durability <= 0) return;
      if (equipped.effects && equipped.effects.unbreakable) return;
      equipped.durability = Math.max(0, equipped.durability - 1);
      if (equipped.durability === 0) broken = true;
    });
  if (broken) {
    computeDerived(player);
    player.send('有装备持久度归零，属性已失效，请修理。');
  }
}

function handleDeath(player) {
  player.hp = Math.floor(player.max_hp * 0.5);
  player.mp = Math.floor(player.max_mp * 0.3);
  player.position = { zone: 'bq_town', room: 'gate' };
  player.combat = null;
  player.send('你被击败，返回了城里。');
}

function processMobDeath(player, mob, online) {
  const damageSnapshot = mob.status?.damageBy ? { ...mob.status.damageBy } : {};
  const firstHitSnapshot = mob.status?.firstHitBy || null;
  const template = MOB_TEMPLATES[mob.templateId];
  removeMob(player.position.zone, player.position.room, mob.id);
  gainSummonExp(player);
  const exp = template.exp;
  const gold = randInt(template.gold[0], template.gold[1]);

  const party = getPartyByMember(player.name);
  let partyMembers = party ? partyMembersInRoom(party, online, player.position.zone, player.position.room) : [];
  const inRoomCount = partyMembers.length || 1;
  const allInRoom = partyMembers.length > 1;
  const isBoss = isBossMob(template);
  const isWorldBoss = Boolean(template.worldBoss);
  const { rankMap, entries } = isWorldBoss ? buildDamageRankMap(mob, damageSnapshot) : { rankMap: {}, entries: [] };
  let lootOwner = player;
  if (!party || partyMembers.length === 0) {
    let ownerName = null;
    if (isBoss) {
      const damageBy = damageSnapshot;
      let maxDamage = -1;
      Object.entries(damageBy).forEach(([name, dmg]) => {
        if (dmg > maxDamage) {
          maxDamage = dmg;
          ownerName = name;
        }
      });
    } else {
      ownerName = firstHitSnapshot;
    }
    if (!ownerName) ownerName = player.name;
    lootOwner = playersByName(ownerName) || player;
    partyMembers = [lootOwner];
  }
  const eligibleCount = allInRoom ? 1 : inRoomCount;
  const bonus = inRoomCount > 1 ? Math.min(0.2 * inRoomCount, 1.0) : 0;
  const totalExp = Math.floor(exp * (1 + bonus));
  const totalGold = Math.floor(gold * (1 + bonus));
  const shareExp = allInRoom ? totalExp : Math.floor(totalExp / eligibleCount);
  const shareGold = allInRoom ? totalGold : Math.floor(totalGold / eligibleCount);

    let sabakTaxExp = 0;
    let sabakTaxGold = 0;
    const sabakMembers = listSabakMembersOnline();
    partyMembers.forEach((member) => {
      const isSabakMember = member.guild && sabakState.ownerGuildId && member.guild.id === sabakState.ownerGuildId;
      const sabakBonus = isSabakMember ? 2 : 1;
      const vipBonus = member.flags?.vip ? 2 : 1;
      let finalExp = Math.floor(shareExp * sabakBonus * vipBonus);
      let finalGold = Math.floor(shareGold * sabakBonus * vipBonus);
      if (sabakState.ownerGuildId && !isSabakMember) {
        const taxExp = Math.floor(finalExp * SABAK_TAX_RATE);
        const taxGold = Math.floor(finalGold * SABAK_TAX_RATE);
        finalExp -= taxExp;
        finalGold -= taxGold;
        sabakTaxExp += taxExp;
        sabakTaxGold += taxGold;
      }
      member.gold += finalGold;
      const leveled = gainExp(member, finalExp);
      awardKill(member, mob.templateId);
      member.send(`队伍分配: 获得 ${finalExp} 经验和 ${finalGold} 金币。`);
      if (leveled) member.send('你升级了！');
    });
    if (sabakMembers.length && (sabakTaxExp > 0 || sabakTaxGold > 0)) {
      const expShare = Math.floor(sabakTaxExp / sabakMembers.length);
      const goldShare = Math.floor(sabakTaxGold / sabakMembers.length);
      if (expShare > 0 || goldShare > 0) {
        sabakMembers.forEach((member) => {
          member.gold += goldShare;
          if (expShare > 0) {
            const leveled = gainExp(member, expShare);
            if (leveled) member.send('你升级了！');
          }
        });
      }
    }

    const dropTargets = [];
    if (isWorldBoss) {
      entries
        .map(([name]) => playersByName(name))
        .filter(Boolean)
        .forEach((p) => dropTargets.push({ player: p, bonus: rankDropBonus(rankMap[p.name]) }));
      if (!dropTargets.length) {
        dropTargets.push({ player: lootOwner, bonus: 1 });
      }
    } else {
      const bonus = 1;
      dropTargets.push({ player: lootOwner, bonus });
    }

    if (isWorldBoss && entries.length) {
      const topName = entries[0][0];
      const topPlayer = playersByName(topName);
      if (topPlayer) {
        let forcedId = rollRarityEquipmentDrop(template, WORLD_BOSS_DROP_BONUS) || rollRarityEquipmentDrop(template, 1);
        if (!forcedId) {
          const equipPool = Object.values(ITEM_TEMPLATES)
            .filter((i) => i && ['weapon', 'armor', 'accessory'].includes(i.type))
            .map((i) => i.id);
          if (equipPool.length) {
            forcedId = equipPool[randInt(0, equipPool.length - 1)];
          }
        }
        if (forcedId) {
          const forcedEffects = forceEquipmentEffects(forcedId);
          addItem(topPlayer, forcedId, 1, forcedEffects);
          topPlayer.send(`世界BOSS排名第1奖励：${formatItemLabel(forcedId, forcedEffects)}。`);
          const forcedItem = ITEM_TEMPLATES[forcedId];
          if (forcedItem) {
            const forcedRarity = rarityByPrice(forcedItem);
            if (['epic', 'legendary'].includes(forcedRarity)) {
              emitAnnouncement(`${topPlayer.name} 获得世界BOSS首位奖励 ${formatItemLabel(forcedId, forcedEffects)}！`, forcedRarity);
            }
            if (isEquipmentItem(forcedItem) && hasSpecialEffects(forcedEffects)) {
              emitAnnouncement(`${topPlayer.name} 获得特效装备 ${formatItemLabel(forcedId, forcedEffects)}！`, 'announce');
            }
          }
        }
      }
    }

    dropTargets.forEach(({ player: owner, bonus }) => {
      const drops = dropLoot(template, bonus);
      if (!drops.length) return;
      if (!isWorldBoss && party && partyMembers.length > 0) {
        const distributed = distributeLoot(party, partyMembers, drops);
        distributed.forEach(({ id, effects, target }) => {
          const item = ITEM_TEMPLATES[id];
          if (!item) return;
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary'].includes(rarity)) {
            emitAnnouncement(`${target.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(id, effects)}！`, rarity);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(effects)) {
            emitAnnouncement(`${target.name} 获得特效装备 ${formatItemLabel(id, effects)}！`, 'announce');
          }
        });
      } else {
        drops.forEach((entry) => {
          addItem(owner, entry.id, 1, entry.effects);
        });
        owner.send(`掉落: ${drops.map((entry) => formatItemLabel(entry.id, entry.effects)).join(', ')}`);
        drops.forEach((entry) => {
          const item = ITEM_TEMPLATES[entry.id];
          if (!item) return;
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary'].includes(rarity)) {
            emitAnnouncement(`${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`, rarity);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce');
          }
        });
      }
    });
}

function combatTick() {
  const online = listOnlinePlayers();
  online.forEach((player) => {
    if (player.hp <= 0) {
      handleDeath(player);
      return;
    }

    refreshBuffs(player);
    processPotionRegen(player);
    updateRedNameAutoClear(player);
    const poisonSource = player.status?.poison?.sourceName;
      const playerPoisonTick = tickStatus(player);
      if (playerPoisonTick && playerPoisonTick.type === 'poison') {
        player.send(`你受到 ${playerPoisonTick.dmg} 点中毒伤害。`);
        if (poisonSource) {
          const source = playersByName(poisonSource);
          if (source) {
            source.send(`你的施毒对 ${player.name} 造成 ${playerPoisonTick.dmg} 点伤害。`);
          }
        }
      }
      if (player.summon && player.summon.hp <= 0) {
        player.summon = null;
        if (!player.flags) player.flags = {};
        player.flags.summonAggro = true;
        autoResummon(player);
      }

    if (!player.combat) {
      regenOutOfCombat(player);
      const mobs = getAliveMobs(player.position.zone, player.position.room);
      const aggroMob = mobs.find((m) => m.status?.aggroTarget === player.name);
      if (aggroMob) {
        player.combat = { targetId: aggroMob.id, targetType: 'mob', skillId: null };
      }
      if (player.flags?.autoSkillId) {
        if (!player.combat) {
          const target = mobs.length ? mobs[randInt(0, mobs.length - 1)] : null;
          if (target) {
            player.combat = { targetId: target.id, targetType: 'mob', skillId: null };
          }
        }
      }
      if (!player.combat) return;
    }
    if (!player.flags) player.flags = {};
    player.flags.lastCombatAt = Date.now();

    tryAutoPotion(player);

    if (player.status && player.status.stunTurns > 0) {
      player.status.stunTurns -= 1;
      player.send('你被麻痹，无法行动。');
      return;
    }

      if (player.combat.targetType === 'player') {
        const target = online.find((p) => p.name === player.combat.targetId);
        if (!target || target.position.zone !== player.position.zone || target.position.room !== player.position.room) {
          player.combat = null;
          player.send('目标已消失。');
          return;
        }
        if (isSabakZone(player.position.zone)) {
          const sameGuild = player.guild && target.guild && player.guild.id === target.guild.id;
          if (sameGuild) {
            player.combat = null;
            player.send('沙巴克内不能攻击同一行会成员。');
            return;
          }
        }
        if (!target.flags) target.flags = {};
        target.flags.lastCombatAt = Date.now();

      reduceDurabilityOnAttack(player);
      player.flags.lastAttackAt = Date.now();
        player.flags.lastAttackAt = Date.now();

      let chosenSkillId = pickCombatSkillId(player, player.combat.skillId);
    let skill = skillForPlayer(player, chosenSkillId);
    if (skill && player.mp < skill.mp) {
      skill = skillForPlayer(player, DEFAULT_SKILLS[player.classId]);
    }

    const hitChance = calcHitChance(player, target);
    if (Math.random() <= hitChance) {
      if (target.evadeChance && Math.random() <= target.evadeChance) {
        player.send(`${target.name} 闪避了你的攻击。`);
        target.send(`你闪避了 ${player.name} 的攻击。`);
        return;
      }
      let dmg = 0;
      let skillPower = 1;
        if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave' || skill.type === 'dot' || skill.type === 'aoe')) {
          const skillLevel = getSkillLevel(player, skill.id);
          skillPower = scaledSkillPower(skill, skillLevel);
        if (skill.type === 'spell' || skill.type === 'aoe') {
          const mdefMultiplier = getMagicDefenseMultiplier(target);
          const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
          const powerStat = skill.id === 'soul' ? (player.spirit || 0) : (player.mag || 0);
          dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6);
          if (dmg < 1) dmg = 1;
        } else if (skill.type === 'dot') {
          dmg = Math.max(1, Math.floor(player.mag * 0.5 * skillPower));
        } else {
          const isNormal = !skill || skill.id === 'slash';
          const crit = consumeFirestrikeCrit(player, 'player', isNormal);
          dmg = Math.floor(calcDamage(player, target, skillPower) * crit);
        }
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
      } else {
        const crit = consumeFirestrikeCrit(player, 'player', true);
        dmg = Math.floor(calcDamage(player, target, 1) * crit);
      }

        applyDamageToPlayer(target, dmg);
        target.flags.lastCombatAt = Date.now();
        player.send(`你对 ${target.name} 造成 ${dmg} 点伤害。`);
        target.send(`${player.name} 对你造成 ${dmg} 点伤害。`);
        if (hasComboWeapon(player) && target.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          applyDamageToPlayer(target, dmg);
          target.flags.lastCombatAt = Date.now();
          player.send(`连击触发，对 ${target.name} 造成 ${dmg} 点伤害。`);
          target.send(`${player.name} 连击对你造成 ${dmg} 点伤害。`);
        }
        if (!target.combat || target.combat.targetType !== 'player' || target.combat.targetId !== player.name) {
          target.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
        }
      if (skill && skill.type === 'dot') {
        if (!target.status) target.status = {};
        applyPoison(target, 30, calcPoisonTickDamage(target), player.name);
        applyPoisonDebuff(target);
        player.send('施毒成功。');
        target.send('你中了施毒术。');
      } else if (tryApplyPoisonEffect(player, target)) {
        target.send('你中了毒特效。');
        player.send(`你的毒特效作用于 ${target.name}。`);
      }
      if (skill && skill.id === 'firestrike') {
        if (!player.status) player.status = {};
        player.status.firestrikeCrit = true;
      }
      if (skill && ['attack', 'spell', 'cleave', 'dot', 'aoe'].includes(skill.type)) {
        notifyMastery(player, skill);
      }
      if (hasEquipped(player, 'ring_magic') && Math.random() <= 0.1) {
        if (!target.status) target.status = {};
        target.status.stunTurns = 2;
        player.send(`${target.name} 被麻痹戒指定身。`);
        target.send('你被麻痹了，无法行动。');
      }
    } else {
      player.send(`${target.name} 躲过了你的攻击。`);
      target.send(`你躲过了 ${player.name} 的攻击。`);
      if (skill && skill.type === 'dot') {
        player.send('施毒失败。');
      }
      if (!target.combat || target.combat.targetType !== 'player' || target.combat.targetId !== player.name) {
        target.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
      }
    }

      if (target.hp <= 0 && !tryRevive(target)) {
        const wasRed = isRedName(target);
        if (!player.flags) player.flags = {};
        if (!wasRed && !isSabakZone(player.position.zone)) {
          player.flags.pkValue = (player.flags.pkValue || 0) + 100;
          savePlayer(player);
        }
        if (isSabakZone(player.position.zone)) {
          recordSabakKill(player, target);
        }
        const droppedBag = wasRed ? transferAllInventory(target, player) : [];
        const droppedEquip = wasRed ? transferOneEquipmentChance(target, player, 0.1) : [];
        target.send('你被击败，返回了城里。');
        if (wasRed) {
          target.send('你是红名，背包物品全部掉落。');
          if (droppedEquip.length) target.send(`装备掉落: ${droppedEquip.join(', ')}`);
        }
        player.send(`你击败了 ${target.name}。`);
        if (wasRed && droppedBag.length) {
          player.send(`${target.name} 掉落了: ${droppedBag.join(', ')}`);
        }
        handleDeath(target);
      }
      sendState(player);
      sendState(target);
      return;
    }

    const mobs = getAliveMobs(player.position.zone, player.position.room);
    const mob = mobs.find((m) => m.id === player.combat.targetId);
    if (!mob) {
      player.combat = null;
      player.send('目标已消失。');
      return;
    }

    reduceDurabilityOnAttack(player);

    if (mob.status && mob.status.stunTurns > 0) {
      mob.status.stunTurns -= 1;
    }
    let chosenSkillId = pickCombatSkillId(player, player.combat.skillId);
    let skill = skillForPlayer(player, chosenSkillId);
    if (skill && player.mp < skill.mp) {
      player.send('魔法不足，改用普通攻击。');
      skill = skillForPlayer(player, DEFAULT_SKILLS[player.classId]);
    }

    const hitChance = calcHitChance(player, mob);
    if (Math.random() <= hitChance) {
      let dmg = 0;
      let skillPower = 1;
      if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave' || skill.type === 'dot' || skill.type === 'aoe')) {
        const skillLevel = getSkillLevel(player, skill.id);
        skillPower = scaledSkillPower(skill, skillLevel);
        if (skill.type === 'spell' || skill.type === 'aoe') {
          const mdefMultiplier = getMagicDefenseMultiplier(mob);
          const mdef = Math.floor((mob.mdef || 0) * mdefMultiplier);
          const powerStat = skill.id === 'soul' ? (player.spirit || 0) : (player.mag || 0);
          dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6);
          if (dmg < 1) dmg = 1;
        } else if (skill.type === 'dot') {
          dmg = Math.max(1, Math.floor(player.mag * 0.5 * skillPower));
        } else {
          const isNormal = !skill || skill.id === 'slash';
          const crit = consumeFirestrikeCrit(player, 'mob', isNormal);
          dmg = Math.floor(calcDamage(player, mob, skillPower) * crit);
        }
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
      } else {
        const crit = consumeFirestrikeCrit(player, 'mob', true);
        dmg = Math.floor(calcDamage(player, mob, 1) * crit);
      }

      if (skill && skill.type === 'aoe') {
        mobs.forEach((target) => {
          applyDamageToMob(target, dmg, player.name);
        });
        player.send(`你施放了 ${skill.name}，造成范围伤害 ${dmg}。`);
        const deadTargets = mobs.filter((target) => target.hp <= 0);
        if (deadTargets.length) {
          deadTargets.forEach((target) => processMobDeath(player, target, online));
          if (deadTargets.some((target) => target.id === mob.id)) {
            player.combat = null;
          }
          sendRoomState(player.position.zone, player.position.room);
          return;
        }
        sendRoomState(player.position.zone, player.position.room);
      } else {
        applyDamageToMob(mob, dmg, player.name);
        player.send(`你对 ${mob.name} 造成 ${dmg} 点伤害。`);
        if (hasComboWeapon(player) && mob.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          applyDamageToMob(mob, dmg, player.name);
          player.send(`连击触发，对 ${mob.name} 造成 ${dmg} 点伤害。`);
        }
        if (mob.hp > 0) {
          sendRoomState(player.position.zone, player.position.room);
        }
      }

      if (hasEquipped(player, 'ring_magic') && Math.random() <= 0.1) {
        if (!mob.status) mob.status = {};
        mob.status.stunTurns = 2;
        player.send(`${mob.name} 被麻痹戒指定身。`);
      }
      if (skill && skill.type === 'dot') {
        if (!mob.status) mob.status = {};
        applyPoison(mob, 30, calcPoisonTickDamage(mob), player.name);
        applyPoisonDebuff(mob);
        player.send(`施毒成功：${mob.name} 中毒。`);
      } else if (tryApplyPoisonEffect(player, mob)) {
        player.send(`你的毒特效作用于 ${mob.name}。`);
      }
      if (skill && skill.id === 'firestrike') {
        if (!player.status) player.status = {};
        player.status.firestrikeCrit = true;
      }
      if (skill && skill.type === 'cleave') {
        mobs.filter((m) => m.id !== mob.id).forEach((other) => {
          applyDamageToMob(other, Math.floor(dmg * 0.3), player.name);
        });
      }
      if (skill && ['attack', 'spell', 'cleave', 'dot', 'aoe'].includes(skill.type)) {
        notifyMastery(player, skill);
      }
    } else {
      player.send(`${mob.name} 躲过了你的攻击。`);
      if (skill && skill.type === 'dot') {
        player.send('施毒失败。');
      }
    }

    const statusTick = tickStatus(mob);
    if (statusTick && statusTick.type === 'poison') {
      player.send(`${mob.name} 受到 ${statusTick.dmg} 点中毒伤害。`);
      const sourceName = mob.status?.poison?.sourceName;
      if (sourceName) {
        recordMobDamage(mob, sourceName, statusTick.dmg);
        const source = playersByName(sourceName);
        if (source && source.name !== player.name) {
          source.send(`你的施毒对 ${mob.name} 造成 ${statusTick.dmg} 点伤害。`);
        }
      }
    }

    if (player.summon && mob.hp > 0) {
      const summon = player.summon;
      const hitChance = calcHitChance(summon, mob);
      if (Math.random() <= hitChance) {
        const dmg = calcDamage(summon, mob, 1);
        applyDamageToMob(mob, dmg, player.name);
        player.send(`${summon.name} 对 ${mob.name} 造成 ${dmg} 点伤害。`);
      }
    }

    if (mob.hp <= 0) {
      processMobDeath(player, mob, online);
      player.combat = null;
      sendRoomState(player.position.zone, player.position.room);
      return;
    }

    if (mob.status && mob.status.stunTurns > 0) {
      player.send(`${mob.name} 被麻痹，无法行动。`);
      return;
    }

    const now = Date.now();
    const summonAlive = Boolean(player.summon && player.summon.hp > 0);
    if (player.flags?.summonAggro && summonAlive) {
      const lastAttackAt = player.flags.lastAttackAt || 0;
      if (now - lastAttackAt >= 5000) {
        player.flags.summonAggro = false;
      }
    }
    const mobTemplate = MOB_TEMPLATES[mob.templateId];
    const isBossAggro = Boolean(mobTemplate?.worldBoss || mobTemplate?.sabakBoss);
    let mobTarget = player.flags?.summonAggro || !summonAlive ? player : player.summon;
    if (isBossAggro) {
      const targetName = mob.status?.aggroTarget;
      const aggroPlayer = targetName
        ? online.find(
            (p) =>
              p.name === targetName &&
              p.position.zone === player.position.zone &&
              p.position.room === player.position.room
          )
        : null;
      if (aggroPlayer) {
        mobTarget = aggroPlayer;
      } else {
        mobTarget = summonAlive ? player.summon : player;
      }
    }
    const mobHitChance = calcHitChance(mob, mobTarget);
    if (Math.random() <= mobHitChance) {
      if (mobTarget && mobTarget.evadeChance && Math.random() <= mobTarget.evadeChance) {
        if (mobTarget.userId) {
          mobTarget.send(`你闪避了 ${mob.name} 的攻击。`);
        } else {
          player.send(`${mobTarget.name} 闪避了 ${mob.name} 的攻击。`);
        }
        return;
      }
      const dmg = calcDamage(mob, mobTarget, 1);
      if (mobTarget && mobTarget.userId) {
        applyDamageToPlayer(mobTarget, dmg);
        mobTarget.send(`${mob.name} 对你造成 ${dmg} 点伤害。`);
        if (mobTarget !== player) {
          player.send(`${mob.name} 攻击 ${mobTarget.name}，造成 ${dmg} 点伤害。`);
        }
        if (mobTarget.hp <= 0 && mobTarget !== player && !tryRevive(mobTarget)) {
          handleDeath(mobTarget);
        }
      } else {
        applyDamage(mobTarget, dmg);
        player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
        if (mobTarget.hp <= 0) {
          player.send(`${mobTarget.name} 被击败。`);
          player.summon = null;
          if (!player.flags) player.flags = {};
          player.flags.summonAggro = true;
          autoResummon(player);
          const followChance = calcHitChance(mob, player);
          if (Math.random() <= followChance) {
            const followDmg = calcDamage(mob, player, 1);
            applyDamageToPlayer(player, followDmg);
            player.send(`${mob.name} 追击你，造成 ${followDmg} 点伤害。`);
          } else {
            player.send(`${mob.name} 追击落空。`);
          }
        }
      }
    } else {
      player.send(`${mob.name} 攻击落空。`);
    }

    if (player.hp <= 0 && !tryRevive(player)) {
      handleDeath(player);
    }
    sendState(player);
  });
}

setInterval(combatTick, 1000);

async function sabakTick() {
  if (!sabakState.active) return;
  if (!isSabakActive() || (sabakState.siegeEndsAt && Date.now() >= sabakState.siegeEndsAt)) {
    await finishSabakSiege();
  }
}

async function start() {
  if (config.db.client === 'sqlite') {
    const dir = path.dirname(config.db.filename);
    await mkdir(dir, { recursive: true });
  }
  await runMigrations();
  setRespawnStore({
    set: (zoneId, roomId, slotIndex, templateId, respawnAt) =>
      upsertMobRespawn(zoneId, roomId, slotIndex, templateId, respawnAt),
    clear: (zoneId, roomId, slotIndex) =>
      clearMobRespawn(zoneId, roomId, slotIndex)
  });
  const respawnRows = await listMobRespawns();
  const now = Date.now();
  const activeRespawns = [];
  for (const row of respawnRows) {
    if (row.respawn_at && Number(row.respawn_at) > now) {
      activeRespawns.push(row);
    } else {
      await clearMobRespawn(row.zone_id, row.room_id, row.slot_index);
    }
  }
  seedRespawnCache(activeRespawns);
  await loadSabakState();
  checkWorldBossRespawn();
  setInterval(() => checkWorldBossRespawn(), 5000);
  setInterval(() => sabakTick().catch(() => {}), 5000);
  if (config.adminBootstrapSecret && config.adminBootstrapUser) {
    const admins = await knex('users').where({ is_admin: true }).first();
    if (!admins) {
      const user = await getUserByName(config.adminBootstrapUser);
      if (user) {
        await setAdminFlag(user.id, true);
        console.log(`Admin bootstrapped for ${config.adminBootstrapUser}`);
      } else {
        console.warn('ADMIN_BOOTSTRAP_USER not found, cannot bootstrap admin.');
      }
    }
  }
  server.listen(config.port, () => {
    console.log(`Server on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
