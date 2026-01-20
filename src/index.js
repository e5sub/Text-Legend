import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

import config from './config.js';
import knex from './db/index.js';
import { createUser, verifyUser, createSession, getSession, getUserByName, setAdminFlag } from './db/users.js';
import { listCharacters, loadCharacter, saveCharacter } from './db/characters.js';
import { addGuildMember, createGuild, getGuildByName, getGuildMember, getSabakOwner, isGuildLeader, listGuildMembers, listSabakRegistrations, registerSabak, removeGuildMember, setSabakOwner, clearSabakRegistrations } from './db/guilds.js';
import { createAdminSession, listUsers, verifyAdminSession } from './db/admin.js';
import { sendMail, listMail, markMailRead } from './db/mail.js';
import { createVipCodes, listVipCodes, useVipCode } from './db/vip.js';
import { runMigrations } from './db/migrate.js';
import { newCharacter, computeDerived, gainExp, addItem, removeItem } from './game/player.js';
import { handleCommand, awardKill } from './game/commands.js';
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
import { getRoomMobs, getAliveMobs, spawnMobs, removeMob } from './game/state.js';
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
  durationHours: 2,
  captureMinutes: 10
};
let sabakState = {
  active: false,
  ownerGuildId: null,
  ownerGuildName: null,
  captureGuildId: null,
  captureGuildName: null,
  captureStart: null
};

function listOnlinePlayers() {
  return Array.from(players.values());
}

function sendTo(player, message) {
  player.socket.emit('output', { text: message });
}

function emitAnnouncement(text, color, location) {
  io.emit('output', { text, prefix: '公告', prefixColor: 'announce', color, location });
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

function dropLoot(mobTemplate, bonus = 1) {
  const loot = [];
  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      const chance = Math.min(1, (drop.chance || 0) * bonus);
      if (Math.random() <= chance) loot.push(drop.id);
    });
  }
  const rarityDrop = rollRarityDrop(mobTemplate, bonus);
  if (rarityDrop) loot.push(rarityDrop);
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
    const name = ITEM_TEMPLATES[i.id]?.name || i.id;
    parts.push(`${name} x${i.qty}`);
  });
  return parts.length ? parts.join(', ') : '无';
}

function hasOfferItems(player, offer) {
  return offer.items.every((slot) => {
    const inv = player.inventory.find((i) => i.id === slot.id);
    return inv && inv.qty >= slot.qty;
  });
}

function applyOfferItems(from, to, offer) {
  offer.items.forEach((slot) => {
    removeItem(from, slot.id, slot.qty);
    addItem(to, slot.id, slot.qty);
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
  addItem(player, itemId, qty) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (trade.locked[player.name] || trade.locked[trade.a.name === player.name ? trade.b.name : trade.a.name]) {
      return { ok: false, msg: '交易已锁定，无法修改。' };
    }
    if (!qty || qty <= 0) return { ok: false, msg: '数量无效。' };
    const inv = player.inventory.find((i) => i.id === itemId);
    if (!inv || inv.qty < qty) return { ok: false, msg: '背包里没有足够的物品。' };
    const offer = ensureOffer(trade, player.name);
    const existing = offer.items.find((i) => i.id === itemId);
    if (existing) existing.qty += qty;
    else offer.items.push({ id: itemId, qty });
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

function partyMembersInRoom(party, playersList, zone, room) {
  return party.members
    .map((name) => playersList.find((p) => p.name === name))
    .filter((p) => p && p.position.zone === zone && p.position.room === room);
}

function distributeLoot(party, partyMembers, drops) {
  if (!drops.length || !party || partyMembers.length === 0) return [];
  const results = [];
  drops.forEach((itemId) => {
    const target = partyMembers[randInt(0, partyMembers.length - 1)];
    addItem(target, itemId, 1);
    results.push({ id: itemId, target });
    partyMembers.forEach((member) => {
      member.send(`队伍掉落: ${ITEM_TEMPLATES[itemId].name} -> ${target.name}`);
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

function isSabakActive() {
  const now = new Date();
  const start = new Date();
  start.setHours(sabakConfig.startHour, 0, 0, 0);
  const end = new Date(start.getTime() + sabakConfig.durationHours * 60 * 60 * 1000);
  return now >= start && now <= end;
}

function sabakWindowInfo() {
  return `每天 ${sabakConfig.startHour}:00-${sabakConfig.startHour + sabakConfig.durationHours}:00`;
}

function isRedName(player) {
  return (player.flags?.pkValue || 0) >= 100;
}

function hasEquipped(player, itemId) {
  return Object.values(player.equipment || {}).some((eq) => eq && eq.id === itemId);
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
    if (player.status.potionUntil && player.status.potionUntil <= Date.now()) {
      delete player.status.potionUntil;
    }
    return;
  }
  if (regen.ticksRemaining <= 0) {
    delete player.status.regen;
    return;
  }
  if (regen.hpPerTick) {
    player.hp = clamp(player.hp + regen.hpPerTick, 1, player.max_hp);
  }
  if (regen.mpPerTick) {
    player.mp = clamp(player.mp + regen.mpPerTick, 0, player.max_mp);
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

function dropAllInventory(player) {
  const items = player.inventory.map((i) => `${ITEM_TEMPLATES[i.id]?.name || i.id} x${i.qty}`);
  player.inventory = [];
  return items;
}

function dropEquippedChance(player, chance) {
  const dropped = [];
  for (const [slot, equipped] of Object.entries(player.equipment)) {
    if (!equipped) continue;
    if (Math.random() <= chance) {
      dropped.push(ITEM_TEMPLATES[equipped.id]?.name || equipped.id);
      player.equipment[slot] = null;
    }
  }
  return dropped;
}

function buildState(player) {
  const zone = WORLD[player.position.zone];
  const room = zone?.rooms[player.position.room];
  if (zone && room) spawnMobs(player.position.zone, player.position.room);
  const mobs = getAliveMobs(player.position.zone, player.position.room).map((m) => ({
    id: m.id,
    name: m.name,
    hp: m.hp,
    max_hp: m.max_hp
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
    return {
      id: i.id,
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
      mag: item.mag || 0,
      spirit: item.spirit || 0,
      dex: item.dex || 0
    };
  });
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
      guild: p.guild?.name || null
    }));
  return {
    player: {
      name: player.name,
      classId: player.classId,
      level: player.level
    },
    room: {
      zone: zone?.name || player.position.zone,
      name: room?.name || player.position.room
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
    guild: player.guild?.name || null,
    party: party ? { size: party.members.length, members: partyMembers } : null,
    training: player.flags?.training || { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0 },
    online: { count: onlineCount },
    players: roomPlayers
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
    `${bossName} 已刷新，点击前往。`,
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
  if (attackerName) {
    mob.status.damageBy[attackerName] = (mob.status.damageBy[attackerName] || 0) + dmg;
  }
}

function applyDamageToMob(mob, dmg, attackerName) {
  recordMobDamage(mob, attackerName, dmg);
  applyDamage(mob, dmg);
}

function buildDamageRankMap(mob) {
  const damageBy = mob.status?.damageBy || {};
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
  if (player.status?.potionUntil && player.status.potionUntil > Date.now()) return;
  const hpPct = player.flags?.autoHpPct;
  const mpPct = player.flags?.autoMpPct;
  if (!hpPct && !mpPct) return;

  const hpRate = player.hp / player.max_hp;
  const mpRate = player.mp / player.max_mp;

  const hpList = ['snow_frost', 'potion_super', 'potion_big', 'potion_mid', 'potion_small', 'sun_water'];
  const mpList = ['snow_frost', 'potion_mana_super', 'potion_mana_big', 'potion_mana_mid', 'potion_mana', 'sun_water'];

  if (hpPct && hpRate <= hpPct / 100) {
    const id = hpList.find((pid) => player.inventory.find((i) => i.id === pid));
    if (id && consumeItem(player, id)) {
      const item = ITEM_TEMPLATES[id];
      if (item.hp) player.hp = clamp(player.hp + item.hp, 1, player.max_hp);
      if (item.mp) player.mp = clamp(player.mp + item.mp, 0, player.max_mp);
      player.send(`自动使用 ${item.name}。`);
    }
  }

  if (mpPct && mpRate <= mpPct / 100) {
    const id = mpList.find((pid) => player.inventory.find((i) => i.id === pid));
    if (id && consumeItem(player, id)) {
      const item = ITEM_TEMPLATES[id];
      if (item.hp) player.hp = clamp(player.hp + item.hp, 1, player.max_hp);
      if (item.mp) player.mp = clamp(player.mp + item.mp, 0, player.max_mp);
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
    const zone = WORLD[loaded.position.zone];
    const room = zone?.rooms[loaded.position.room];
    const locationName = zone && room ? `${zone.name} - ${room.name}` : `${loaded.position.zone}:${loaded.position.room}`;
    loaded.send(`你位于 ${locationName}。输入 look 查看。`);
    sendState(loaded);
  });

  socket.on('cmd', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
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
      mailApi: {
        listMail,
        markMailRead
      }
    });
    sendState(player);
    await savePlayer(player);
  });

  socket.on('disconnect', async () => {
    const player = players.get(socket.id);
    if (player) {
      if (!player.flags) player.flags = {};
      player.flags.offlineAt = Date.now();
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

function handleDeath(player) {
  player.hp = Math.floor(player.max_hp * 0.5);
  player.mp = Math.floor(player.max_mp * 0.3);
  player.position = { zone: 'bq_town', room: 'gate' };
  player.combat = null;
  player.send('你被击败，返回了城里。');
}

function processMobDeath(player, mob, online) {
  const template = MOB_TEMPLATES[mob.templateId];
  removeMob(player.position.zone, player.position.room, mob.id);
  const exp = template.exp;
  const gold = randInt(template.gold[0], template.gold[1]);

  const party = getPartyByMember(player.name);
  let partyMembers = party ? partyMembersInRoom(party, online, player.position.zone, player.position.room) : [];
  const inRoomCount = partyMembers.length || 1;
  const allInRoom = partyMembers.length > 1;
  const isBoss = isBossMob(template);
  const isWorldBoss = Boolean(template.worldBoss);
  const { rankMap, entries } = isWorldBoss ? buildDamageRankMap(mob) : { rankMap: {}, entries: [] };
  let lootOwner = player;
  if (!party || partyMembers.length === 0) {
    let ownerName = null;
    if (isBoss) {
      const damageBy = mob.status?.damageBy || {};
      let maxDamage = -1;
      Object.entries(damageBy).forEach(([name, dmg]) => {
        if (dmg > maxDamage) {
          maxDamage = dmg;
          ownerName = name;
        }
      });
    } else {
      ownerName = mob.status?.firstHitBy || null;
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

  partyMembers.forEach((member) => {
    const sabakBonus = member.guild && sabakState.ownerGuildId && member.guild.id === sabakState.ownerGuildId ? 2 : 1;
    const vipBonus = member.flags?.vip ? 2 : 1;
    const finalExp = Math.floor(shareExp * sabakBonus * vipBonus);
    const finalGold = Math.floor(shareGold * sabakBonus * vipBonus);
    member.gold += finalGold;
    const leveled = gainExp(member, finalExp);
    awardKill(member, mob.templateId);
    member.send(`队伍分配: 获得 ${finalExp} 经验和 ${finalGold} 金币。`);
    if (leveled) member.send('你升级了！');
  });

  const dropTargets = [];
  if (isWorldBoss && (!party || partyMembers.length === 0)) {
    const top = entries
      .map(([name]) => playersByName(name))
      .filter(Boolean)
      .slice(0, 3);
    if (top.length) {
      dropTargets.push(...top.map((p) => ({ player: p, bonus: rankDropBonus(rankMap[p.name]) })));
    } else {
      dropTargets.push({ player: lootOwner, bonus: 1 });
    }
  } else {
    const bestRank = isWorldBoss
      ? Math.min(...partyMembers.map((m) => rankMap[m.name] || 9999))
      : 0;
    const bonus = isWorldBoss ? rankDropBonus(bestRank) : 1;
    dropTargets.push({ player: lootOwner, bonus });
  }

  dropTargets.forEach(({ player: owner, bonus }) => {
    const drops = dropLoot(template, bonus);
    if (!drops.length) return;
    if (party && partyMembers.length > 0) {
      const distributed = distributeLoot(party, partyMembers, drops);
      distributed.forEach(({ id, target }) => {
        const item = ITEM_TEMPLATES[id];
        if (!item) return;
        const rarity = rarityByPrice(item);
        if (['uncommon', 'rare', 'epic', 'legendary'].includes(rarity)) {
          emitAnnouncement(`${target.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${item.name}！`, rarity);
        }
      });
    } else {
      drops.forEach((id) => {
        addItem(owner, id, 1);
      });
      owner.send(`掉落: ${drops.map((id) => ITEM_TEMPLATES[id].name).join(', ')}`);
      drops.forEach((id) => {
        const item = ITEM_TEMPLATES[id];
        if (!item) return;
        const rarity = rarityByPrice(item);
        if (['uncommon', 'rare', 'epic', 'legendary'].includes(rarity)) {
          emitAnnouncement(`${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${item.name}！`, rarity);
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

    if (!player.combat) {
      regenOutOfCombat(player);
      if (player.flags?.autoSkillId) {
        const mobs = getAliveMobs(player.position.zone, player.position.room);
        const target = mobs.length ? mobs[randInt(0, mobs.length - 1)] : null;
        if (target) {
          player.combat = { targetId: target.id, targetType: 'mob', skillId: null };
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
      if (!target.flags) target.flags = {};
      target.flags.lastCombatAt = Date.now();

    let chosenSkillId = pickCombatSkillId(player, player.combat.skillId);
    let skill = skillForPlayer(player, chosenSkillId);
    if (skill && player.mp < skill.mp) {
      skill = skillForPlayer(player, DEFAULT_SKILLS[player.classId]);
    }

    const hitChance = calcHitChance(player, target);
    if (Math.random() <= hitChance) {
      let dmg = 0;
      let skillPower = 1;
      if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave' || skill.type === 'dot' || skill.type === 'aoe')) {
        const skillLevel = getSkillLevel(player, skill.id);
        skillPower = scaledSkillPower(skill, skillLevel);
        if (skill.type === 'spell' || skill.type === 'aoe') {
          dmg = Math.floor((player.mag + randInt(0, player.mag / 2)) * skillPower);
        } else if (skill.type === 'dot') {
          dmg = Math.max(1, Math.floor(player.mag * 0.5 * skillPower));
        } else {
          dmg = calcDamage(player, target, skillPower);
        }
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
      } else {
        dmg = calcDamage(player, target, 1);
      }

      applyDamageToPlayer(target, dmg);
      target.flags.lastCombatAt = Date.now();
      player.send(`你对 ${target.name} 造成 ${dmg} 点伤害。`);
      target.send(`${player.name} 对你造成 ${dmg} 点伤害。`);
      if (!target.combat || target.combat.targetType !== 'player' || target.combat.targetId !== player.name) {
        target.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
      }
  if (skill && skill.type === 'dot') {
        if (!target.status) target.status = {};
        applyPoison(target, 4, Math.max(2, Math.floor(player.mag * 0.3 * skillPower)), player.name);
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
      if (!target.combat || target.combat.targetType !== 'player' || target.combat.targetId !== player.name) {
        target.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
      }
    }

      if (target.hp <= 0 && !tryRevive(target)) {
        const wasRed = isRedName(target);
        if (!player.flags) player.flags = {};
        if (!wasRed) {
          player.flags.pkValue = (player.flags.pkValue || 0) + 100;
          savePlayer(player);
        }
        const droppedBag = wasRed ? dropAllInventory(target) : [];
        const droppedEquip = wasRed ? dropEquippedChance(target, 0.1) : [];
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
          dmg = Math.floor((player.mag + randInt(0, player.mag / 2)) * skillPower);
        } else if (skill.type === 'dot') {
          dmg = Math.max(1, Math.floor(player.mag * 0.5 * skillPower));
        } else {
          dmg = calcDamage(player, mob, skillPower);
        }
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
      } else {
        dmg = calcDamage(player, mob, 1);
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
        applyPoison(mob, 4, Math.max(2, Math.floor(player.mag * 0.3 * skillPower)), player.name);
      }
      if (skill && skill.type === 'cleave') {
        mobs.filter((m) => m.id !== mob.id).forEach((other) => {
          applyDamageToMob(other, Math.floor(dmg * 0.5), player.name);
        });
      }
      if (skill && ['attack', 'spell', 'cleave', 'dot', 'aoe'].includes(skill.type)) {
        notifyMastery(player, skill);
      }
    } else {
      player.send(`${mob.name} 躲过了你的攻击。`);
    }

    const statusTick = tickStatus(mob);
    if (statusTick && statusTick.type === 'poison') {
      player.send(`${mob.name} 受到 ${statusTick.dmg} 点中毒伤害。`);
      const sourceName = mob.status?.poison?.sourceName;
      if (sourceName) {
        recordMobDamage(mob, sourceName, statusTick.dmg);
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

    const mobHitChance = calcHitChance(mob, player);
      if (Math.random() <= mobHitChance) {
        const dmg = calcDamage(mob, player, 1);
        applyDamageToPlayer(player, dmg);
        player.send(`${mob.name} 对你造成 ${dmg} 点伤害。`);
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
  const active = isSabakActive();
  if (active && !sabakState.active) {
    sabakState.active = true;
    sabakState.captureGuildId = null;
    sabakState.captureGuildName = null;
    sabakState.captureStart = null;
    emitAnnouncement('沙巴克攻城战开始！', 'announce');
  }
  if (!active && sabakState.active) {
    sabakState.active = false;
    sabakState.captureGuildId = null;
    sabakState.captureGuildName = null;
    sabakState.captureStart = null;
    await clearSabakRegistrations();
    emitAnnouncement('沙巴克攻城战结束。', 'announce');
  }

  if (!sabakState.active) return;

  const palacePlayers = listOnlinePlayers().filter(
    (p) => p.position.zone === 'sb_town' && p.position.room === 'palace' && p.guild
  );
  if (palacePlayers.length === 0) {
    sabakState.captureGuildId = null;
    sabakState.captureGuildName = null;
    sabakState.captureStart = null;
    return;
  }

  const guildIds = new Set(palacePlayers.map((p) => p.guild.id));
  if (guildIds.size !== 1) {
    sabakState.captureGuildId = null;
    sabakState.captureGuildName = null;
    sabakState.captureStart = null;
    return;
  }

  const guildId = palacePlayers[0].guild.id;
  const guildName = palacePlayers[0].guild.name;
  const registered = (await listSabakRegistrations()).some((r) => r.guild_id === guildId);
  if (!registered) return;

  if (sabakState.captureGuildId !== guildId) {
    sabakState.captureGuildId = guildId;
    sabakState.captureGuildName = guildName;
    sabakState.captureStart = Date.now();
    emitAnnouncement(`沙巴克皇宫被 ${guildName} 占领，计时开始。`, 'announce');
    return;
  }

  const elapsedMin = (Date.now() - sabakState.captureStart) / 60000;
  if (elapsedMin >= sabakConfig.captureMinutes) {
    sabakState.ownerGuildId = guildId;
    sabakState.ownerGuildName = guildName;
    await setSabakOwner(guildId, guildName);
    emitAnnouncement(`沙巴克被 ${guildName} 占领！`, 'announce');
    sabakState.captureGuildId = null;
    sabakState.captureGuildName = null;
    sabakState.captureStart = null;
  }
}

async function start() {
  if (config.db.client === 'sqlite') {
    const dir = path.dirname(config.db.filename);
    await mkdir(dir, { recursive: true });
  }
  await runMigrations();
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
