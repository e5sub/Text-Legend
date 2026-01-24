import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import crypto from 'node:crypto';

import config from './config.js';
import knex from './db/index.js';
import { createUser, verifyUser, createSession, getSession, getUserByName, setAdminFlag } from './db/users.js';
import { listCharacters, loadCharacter, saveCharacter, findCharacterByName } from './db/characters.js';
import { addGuildMember, createGuild, getGuildByName, getGuildMember, getSabakOwner, isGuildLeader, listGuildMembers, listSabakRegistrations, registerSabak, removeGuildMember, setSabakOwner, clearSabakRegistrations, transferGuildLeader } from './db/guilds.js';
import { createAdminSession, listUsers, verifyAdminSession, deleteUser } from './db/admin.js';
import { sendMail, listMail, markMailRead } from './db/mail.js';
import { createVipCodes, listVipCodes, useVipCode } from './db/vip.js';
import { getVipSelfClaimEnabled, setVipSelfClaimEnabled, canUserClaimVip, incrementUserVipClaimCount } from './db/settings.js';
import { listMobRespawns, upsertMobRespawn, clearMobRespawn } from './db/mobs.js';
import {
  listConsignments,
  listConsignmentsBySeller,
  getConsignment,
  createConsignment,
  updateConsignmentQty,
  deleteConsignment
} from './db/consignments.js';
import {
  listConsignmentHistory,
  createConsignmentHistory
} from './db/consignment_history.js';
import { runMigrations } from './db/migrate.js';
import { newCharacter, computeDerived, gainExp, addItem, removeItem, getItemKey, normalizeInventory, normalizeEquipment } from './game/player.js';
import { handleCommand, awardKill, summonStats } from './game/commands.js';
import {
  validateNumber,
  validateItemId,
  validateItemQty,
  validateGold,
  validateEffects,
  validateDurability,
  validateMaxDurability,
  validatePlayerHasItem,
  validatePlayerHasGold
} from './game/validator.js';
import {
  DEFAULT_SKILLS,
  getLearnedSkills,
  getSkill,
  getSkillLevel,
  gainSkillMastery,
  scaledSkillPower,
  hasSkill,
  ensurePlayerSkills,
  SKILL_MASTERY_LEVELS
} from './game/skills.js';
import { MOB_TEMPLATES } from './game/mobs.js';
import { ITEM_TEMPLATES } from './game/items.js';
import { WORLD } from './game/world.js';
import { getRoomMobs, getAliveMobs, spawnMobs, removeMob, seedRespawnCache, setRespawnStore } from './game/state.js';
import { calcHitChance, calcDamage, applyDamage, applyPoison, tickStatus, getDefenseMultiplier } from './game/combat.js';
import { randInt, clamp } from './game/utils.js';
import { expForLevel } from './game/constants.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const captchaStore = new Map();

function cleanupCaptchas() {
  const now = Date.now();
  for (const [token, entry] of captchaStore.entries()) {
    if (!entry || entry.expiresAt <= now) {
      captchaStore.delete(token);
    }
  }
}

function generateCaptcha() {
  const code = crypto.randomBytes(2).toString('hex').toUpperCase();
  const token = crypto.randomUUID();
  captchaStore.set(token, { code, expiresAt: Date.now() + CAPTCHA_TTL_MS });
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="38" viewBox="0 0 120 38">
  <rect width="120" height="38" rx="8" fill="#fff3e1"/>
  <path d="M6 10h108" stroke="#f0c79e" stroke-width="2" opacity="0.6"/>
  <path d="M10 28h100" stroke="#d9b58f" stroke-width="2" opacity="0.6"/>
  <text x="60" y="25" text-anchor="middle" font-family="Arial" font-size="18" fill="#7a4a1f" font-weight="700">${code}</text>
</svg>
`.trim();
  return { token, svg };
}

function verifyCaptcha(token, code) {
  if (!token || !code) return false;
  const entry = captchaStore.get(token);
  captchaStore.delete(token);
  if (!entry || entry.expiresAt <= Date.now()) return false;
  return String(code).trim().toUpperCase() === entry.code;
}

app.get('/api/captcha', (req, res) => {
  cleanupCaptchas();
  const payload = generateCaptcha();
  res.json({ ok: true, token: payload.token, svg: payload.svg });
});

app.post('/api/register', async (req, res) => {
  const { username, password, captchaToken, captchaCode } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  if (!verifyCaptcha(captchaToken, captchaCode)) {
    return res.status(400).json({ error: '验证码错误。' });
  }
  const exists = await knex('users').where({ username }).first();
  if (exists) return res.status(400).json({ error: '账号已存在。' });
  await createUser(username, password);
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password, captchaToken, captchaCode } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  if (!verifyCaptcha(captchaToken, captchaCode)) {
    return res.status(400).json({ error: '验证码错误。' });
  }
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
  const existing = await findCharacterByName(name);
  if (existing) return res.status(400).json({ error: '角色名已存在。' });

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
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await listUsers(page, limit);
  res.json({ ok: true, ...result });
});

app.post('/admin/users/delete', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: '缺少用户ID。' });
  
  // 防止删除自己
  if (admin.user.id === userId) {
    return res.status(400).json({ error: '不能删除自己的账号。' });
  }
  
  try {
    await deleteUser(userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
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

app.post('/admin/characters/cleanup', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const result = await cleanupInvalidItems();
  res.json({ ok: true, ...result });
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

app.get('/admin/vip/self-claim-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const enabled = await getVipSelfClaimEnabled();
  res.json({ ok: true, enabled });
});

app.post('/admin/vip/self-claim-toggle', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { enabled } = req.body || {};
  await setVipSelfClaimEnabled(enabled === true);
  res.json({ ok: true, enabled: enabled === true });
});

const players = new Map();
const parties = new Map();
const partyInvites = new Map();
const partyFollowInvites = new Map();
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
  return listOnlinePlayers().filter((p) => p.guild && String(p.guild.id) === String(sabakState.ownerGuildId));
}

function sendTo(player, message) {
  player.socket.emit('output', { text: message });
}

function emitAnnouncement(text, color, location) {
  const payload = { text, prefix: '公告', prefixColor: 'announce', color, location };
  io.emit('output', payload);
  io.emit('chat', payload);
}

const RARITY_ORDER = ['supreme', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
const RARITY_NORMAL = {
  supreme: 0.0005,
  legendary: 0.001,
  epic: 0.005,
  rare: 0.02,
  uncommon: 0.06,
  common: 0.15
};
const RARITY_BOSS = {
  supreme: 0.003,
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
  const pools = { common: [], uncommon: [], rare: [], epic: [], legendary: [], supreme: [] };
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

const EFFECT_SINGLE_CHANCE = 0.009;
const EFFECT_DOUBLE_CHANCE = 0.001;
const COMBO_PROC_CHANCE = 0.1;
const ASSASSINATE_SECONDARY_DAMAGE_RATE = 0.3;
const SABAK_TAX_RATE = 0.2;

function buildItemView(itemId, effects = null, durability = null, max_durability = null) {
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
    durability: durability ?? null,
    max_durability: max_durability ?? null,
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

async function cleanupInvalidItems() {
  const validIds = new Set(Object.keys(ITEM_TEMPLATES));
  const rows = await knex('characters').select('id', 'inventory_json', 'equipment_json');
  let updated = 0;
  let removedSlots = 0;
  let clearedEquip = 0;
  for (const row of rows) {
    const inventory = parseJson(row.inventory_json, []);
    const equipment = parseJson(row.equipment_json, {});
    const beforeInv = JSON.stringify(inventory);
    const beforeEquip = JSON.stringify(equipment);
    const cleanedInv = (Array.isArray(inventory) ? inventory : []).filter((slot) => {
      if (!slot || !slot.id || !validIds.has(slot.id)) {
        removedSlots += 1;
        return false;
      }
      const qty = Number(slot.qty || 0);
      if (qty <= 0) {
        removedSlots += 1;
        return false;
      }
      return true;
    });
    const player = { inventory: cleanedInv, equipment };
    if (player.equipment && typeof player.equipment === 'object') {
      Object.keys(player.equipment).forEach((key) => {
        const equipped = player.equipment[key];
        if (equipped && equipped.id && !validIds.has(equipped.id)) {
          player.equipment[key] = null;
          clearedEquip += 1;
        }
      });
    }
    normalizeInventory(player);
    normalizeEquipment(player);
    const afterInv = JSON.stringify(player.inventory);
    const afterEquip = JSON.stringify(player.equipment);
    if (beforeInv !== afterInv || beforeEquip !== afterEquip) {
      await knex('characters')
        .where({ id: row.id })
        .update({
          inventory_json: afterInv,
          equipment_json: afterEquip,
          updated_at: knex.fn.now()
        });
      updated += 1;
    }
  }
  return { checked: rows.length, updated, removedSlots, clearedEquip };
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
  if (effects.healblock) tags.push('禁疗');
  return tags.length ? `${item.name}·${tags.join('·')}` : item.name;
}

function formatLegendaryAnnouncement(text, rarity) {
  if (rarity !== 'legendary') return text;
  return `传说掉落：${text}`;
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
  candidates.push('healblock');
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
  candidates.push('healblock');
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

function isSpecialBoss(mobTemplate) {
  return Boolean(mobTemplate?.specialBoss);
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
      // 排除bossOnly标记的装备，这些应该只在特定BOSS掉落
      const filteredPool = pool.filter((id) => {
        const item = ITEM_TEMPLATES[id];
        return !item?.bossOnly;
      });
      if (!filteredPool.length) return null;
      return filteredPool[randInt(0, filteredPool.length - 1)];
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
      // 排除bossOnly标记的装备
      const filteredPool = equipPool.filter((id) => {
        const item = ITEM_TEMPLATES[id];
        return !item?.bossOnly;
      });
      if (!filteredPool.length) return null;
      return filteredPool[randInt(0, filteredPool.length - 1)];
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
      const dropItem = ITEM_TEMPLATES[drop.id];
      if (dropItem?.bossOnly && !isBossMob(mobTemplate)) return;
      // 史诗和传说级别的bossOnly装备只能在魔龙教主、世界BOSS、沙巴克BOSS掉落
      if (dropItem?.bossOnly) {
        const rarity = rarityByPrice(dropItem);
        if ((rarity === 'epic' || rarity === 'legendary') && !isSpecialBoss(mobTemplate)) {
          return;
        }
      }
      const chance = Math.min(1, (drop.chance || 0) * finalBonus);
      if (Math.random() <= chance) {
        loot.push({ id: drop.id, effects: rollEquipmentEffects(drop.id) });
      }
    });
  }
  // 全地图怪物都有1%概率掉落修炼果
  if (Math.random() <= 0.01) {
    loot.push({ id: 'training_fruit', effects: null });
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
  parties.set(partyId, { id: partyId, leader: leaderName, members: [leaderName], lootIndex: 0 });
  return parties.get(partyId);
}

function getPartyById(partyId) {
  if (!partyId) return null;
  return parties.get(partyId) || null;
}

function getPartyByMember(name) {
  for (const party of parties.values()) {
    if (party.members.includes(name)) return party;
  }
  return null;
}

function removeFromParty(name) {
  const party = getPartyByMember(name);
  if (!party) return null;
  party.members = party.members.filter((m) => m !== name);
  if (party.leader === name) {
    party.leader = party.members[0] || null;
  }
  if (party.members.length === 0) {
    parties.delete(party.id);
    return null;
  }
  return party;
}

async function updatePartyFlags(name, partyId, members) {
  if (!name) return;
  const memberList = Array.isArray(members) ? Array.from(new Set(members)) : [];
  const onlinePlayer = playersByName(name);
  if (onlinePlayer) {
    if (!onlinePlayer.flags) onlinePlayer.flags = {};
    onlinePlayer.flags.partyId = partyId || null;
    onlinePlayer.flags.partyMembers = memberList;
    onlinePlayer.flags.partyLeader = memberList.length ? (onlinePlayer.flags.partyLeader || null) : null;
    await savePlayer(onlinePlayer);
    return;
  }
  const row = await findCharacterByName(name);
  if (!row) return;
  const player = await loadCharacter(row.user_id, row.name);
  if (!player) return;
  if (!player.flags) player.flags = {};
  player.flags.partyId = partyId || null;
  player.flags.partyMembers = memberList;
  player.flags.partyLeader = memberList.length ? (player.flags.partyLeader || null) : null;
  await saveCharacter(row.user_id, player);
}

async function clearPartyFlags(name) {
  await updatePartyFlags(name, null, []);
}

async function persistParty(party) {
  if (!party || !party.id) return;
  const members = Array.from(new Set(party.members || []));
  party.members = members;
  if (!party.leader || !members.includes(party.leader)) {
    party.leader = members[0] || null;
  }
  for (const member of members) {
    const online = playersByName(member);
    if (online) {
      if (!online.flags) online.flags = {};
      online.flags.partyLeader = party.leader;
    } else {
      const row = await findCharacterByName(member);
      if (row) {
        const stored = await loadCharacter(row.user_id, row.name);
        if (stored) {
          if (!stored.flags) stored.flags = {};
          stored.flags.partyLeader = party.leader;
          await saveCharacter(row.user_id, stored);
        }
      }
    }
    await updatePartyFlags(member, party.id, members);
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
  if (effects.healblock) normalized.healblock = true;
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
    target.send(`${player.name} 请求交易。`);
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
    inviter.send('交易建立。');
    player.send('交易建立。');
    return { ok: true, trade };
  },
  addItem(player, itemId, qty, effects = null) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (trade.locked[player.name] || trade.locked[trade.a.name === player.name ? trade.b.name : trade.a.name]) {
      return { ok: false, msg: '交易已锁定，无法修改。' };
    }
    
    // 验证物品ID
    const itemResult = validateItemId(itemId);
    if (!itemResult.ok) return { ok: false, msg: '无效的物品ID。' };
    
    // 验证数量
    const qtyResult = validateItemQty(qty);
    if (!qtyResult.ok) return { ok: false, msg: qtyResult.error };
    
    // 验证effects
    const effectsResult = validateEffects(effects);
    if (!effectsResult.ok) return { ok: false, msg: effectsResult.error };
    
    // 验证玩家拥有该物品
    const hasItemResult = validatePlayerHasItem(player, itemId, qtyResult.value, effectsResult.value);
    if (!hasItemResult.ok) return { ok: false, msg: hasItemResult.error };

    // 检查物品是否可交易
    const item = ITEM_TEMPLATES[itemId];
    if (item?.untradable) return { ok: false, msg: '该物品不可交易。' };

    const offer = ensureOffer(trade, player.name);
    const existing = offer.items.find((i) => i.id === itemId && sameEffects(i.effects, effects));
    if (existing) existing.qty += qtyResult.value;
    else offer.items.push({ id: itemId, qty: qtyResult.value, effects: normalizeEffects(effects) });
    return { ok: true, trade };
  },
  addGold(player, amount) {
    const trade = getTradeByPlayer(player.name);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (trade.locked[player.name] || trade.locked[trade.a.name === player.name ? trade.b.name : trade.a.name]) {
      return { ok: false, msg: '交易已锁定，无法修改。' };
    }
    
    // 验证金币数量
    const goldResult = validateGold(amount);
    if (!goldResult.ok || goldResult.value <= 0) return { ok: false, msg: '金币数量无效。' };
    
    // 验证玩家拥有足够的金币
    const hasGoldResult = validatePlayerHasGold(player, goldResult.value);
    if (!hasGoldResult.ok) return { ok: false, msg: hasGoldResult.error };
    
    const offer = ensureOffer(trade, player.name);
    offer.gold += goldResult.value;
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

    // 服务端重新获取offer数据，防止客户端篡改
    const offerA = ensureOffer(trade, playerA.name);
    const offerB = ensureOffer(trade, playerB.name);

    // 双方再次验证金币和物品（防止锁定后客户端修改数据）
    if (playerA.gold < offerA.gold || playerB.gold < offerB.gold ||
      !hasOfferItems(playerA, offerA) || !hasOfferItems(playerB, offerB)) {
      clearTrade(trade, '交易失败，物品或金币不足。');
      return { ok: false };
    }

    // 再次验证交易状态（防止重复提交）
    if (!trade.locked[playerA.name] || !trade.locked[playerB.name]) {
      clearTrade(trade, '交易失败，未完全锁定。');
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
        item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability)
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
        item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability)
      }));
      player.socket.emit('consign_list', { type: 'mine', items });
      return items;
    },
    async sell(player, itemId, qty, price, effects = null) {
      // 验证物品ID
      const itemResult = validateItemId(itemId);
      if (!itemResult.ok) return { ok: false, msg: '未找到物品。' };
      const item = ITEM_TEMPLATES[itemId];

      if (!CONSIGN_EQUIPMENT_TYPES.has(item.type)) return { ok: false, msg: '仅可寄售装备。' };

      // 检查物品是否可寄售
      if (item?.unconsignable) return { ok: false, msg: '该物品不可寄售。' };

      // 验证数量和价格
      const qtyResult = validateItemQty(qty);
      if (!qtyResult.ok) return { ok: false, msg: '数量无效。' };
      
      const priceResult = validateGold(price, 99999999);
      if (!priceResult.ok || priceResult.value <= 0) return { ok: false, msg: '价格无效。' };
      
      // 验证effects
      const effectsResult = validateEffects(effects);
      if (!effectsResult.ok) return { ok: false, msg: effectsResult.error };
      
      // 验证玩家拥有该物品
      const hasItemResult = validatePlayerHasItem(player, itemId, qtyResult.value, effectsResult.value);
      if (!hasItemResult.ok) return { ok: false, msg: hasItemResult.error };
      
      const invSlot = hasItemResult.slot;
      const durability = validateDurability(invSlot.durability).value ?? null;
      const maxDurability = validateMaxDurability(invSlot.max_durability).value ?? null;
      
      if (!removeItem(player, itemId, qtyResult.value, effectsResult.value)) return { ok: false, msg: '背包里没有足够数量。' };
      const id = await createConsignment({
        sellerName: player.name,
        itemId,
        qty: qtyResult.value,
        price: priceResult.value,
        effectsJson: effectsResult.value ? JSON.stringify(effectsResult.value) : null,
        durability,
        maxDurability
      });
      await consignApi.listMine(player);
      await consignApi.listMarket(player);
      return { ok: true, msg: `寄售成功，编号 ${id}。` };
    },
  async buy(player, listingId, qty) {
    // 验证listingId和qty
    const idResult = validateNumber(listingId, 1, Number.MAX_SAFE_INTEGER);
    if (!idResult.ok) return { ok: false, msg: '寄售ID无效。' };
    
    const qtyResult = validateItemQty(qty);
    if (!qtyResult.ok) return { ok: false, msg: '购买数量无效。' };
    
    const row = await getConsignment(idResult.value);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name === player.name) return { ok: false, msg: '不能购买自己的寄售。' };
    if (row.qty < qtyResult.value) return { ok: false, msg: '寄售数量不足。' };

    // 服务端重新计算总价，防止客户端篡改价格
    const serverTotal = row.price * qtyResult.value;
    const hasGoldResult = validatePlayerHasGold(player, serverTotal);
    if (!hasGoldResult.ok) return { ok: false, msg: hasGoldResult.error };

    player.gold -= serverTotal;
      addItem(player, row.item_id, qtyResult.value, parseJson(row.effects_json), row.durability, row.max_durability);

    const remain = row.qty - qtyResult.value;
    if (remain > 0) {
      await updateConsignmentQty(idResult.value, remain);
    } else {
      await deleteConsignment(idResult.value);
    }

    // 记录寄售历史
    await createConsignmentHistory({
      sellerName: row.seller_name,
      buyerName: player.name,
      itemId: row.item_id,
      qty: qtyResult.value,
      price: row.price,
      effectsJson: row.effects_json,
      durability: row.durability,
      maxDurability: row.max_durability
    });

    const seller = playersByName(row.seller_name);
    if (seller) {
      seller.gold += serverTotal;
      seller.send(`寄售成交: ${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qtyResult.value}，获得 ${serverTotal} 金币。`);
      savePlayer(seller);
      await consignApi.listMine(seller);
      await consignApi.listMarket(seller);
    } else {
      const sellerRow = await findCharacterByName(row.seller_name);
      if (sellerRow) {
        const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name);
        if (sellerPlayer) {
          sellerPlayer.gold += serverTotal;
          await saveCharacter(sellerRow.user_id, sellerPlayer);
        }
      }
    }
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    return { ok: true, msg: `购买成功，花费 ${serverTotal} 金币。` };
  },
  async cancel(player, listingId) {
    // 验证listingId
    const idResult = validateNumber(listingId, 1, Number.MAX_SAFE_INTEGER);
    if (!idResult.ok) return { ok: false, msg: '寄售ID无效。' };
    
    const row = await getConsignment(idResult.value);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name !== player.name) return { ok: false, msg: '只能取消自己的寄售。' };
      addItem(player, row.item_id, row.qty, parseJson(row.effects_json), row.durability, row.max_durability);
    await deleteConsignment(idResult.value);
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    return { ok: true, msg: '寄售已取消，物品已返回背包。' };
  },
  async listHistory(player, limit = 50) {
    const rows = await listConsignmentHistory(player.name, limit);
    const items = rows.map((row) => ({
      id: row.id,
      seller: row.seller_name,
      buyer: row.buyer_name,
      qty: row.qty,
      price: row.price,
      total: row.price * row.qty,
      item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability),
      soldAt: row.sold_at
    }));
    player.socket.emit('consign_history', { items });
    return items;
  }
};

function partyMembersOnline(party, playersList) {
  return party.members
    .map((name) => playersList.find((p) => p.name === name))
    .filter((p) => p);
}

function partyMembersInRoom(party, playersList, zone, room) {
  return party.members
    .map((name) => playersList.find((p) => p.name === name))
    .filter((p) => p && p.position.zone === zone && p.position.room === room);
}

// 检查队伍成员是否都在同一个房间
function partyMembersInSameRoom(party, playersList, zone, room) {
  const membersInRoom = party.members
    .map((name) => playersList.find((p) => p.name === name))
    .filter((p) => p && p.position.zone === zone && p.position.room === room);
  return membersInRoom.length === party.members.length;
}

// 获取队伍中所有成员的数量（包括离线的），用于计算经验金币加成
function partyMembersTotalCount(party) {
  return party ? party.members.length : 0;
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

function isSabakPalace(zoneId, roomId) {
  return zoneId === 'sb_town' && roomId === 'palace';
}

function getSabakPalaceKillStats() {
  if (!sabakState.active || !sabakState.ownerGuildId) return null;

  const stats = [];
  // 添加守城方
  const defenderStats = sabakState.killStats[sabakState.ownerGuildId];
  stats.push({
    guild_id: sabakState.ownerGuildId,
    guild_name: sabakState.ownerGuildName || '未知',
    kills: defenderStats?.kills || 0,
    is_defender: true
  });

  // 添加攻城方
  Object.entries(sabakState.killStats || {}).forEach(([guildId, info]) => {
    if (String(guildId) !== String(sabakState.ownerGuildId)) {
      stats.push({
        guild_id: guildId,
        guild_name: info?.name || '未知',
        kills: info?.kills || 0,
        is_defender: false
      });
    }
  });

  return stats.sort((a, b) => b.kills - a.kills);
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
  // 只统计沙城皇宫内的击杀
  if (!isSabakPalace(attacker.position.zone, attacker.position.room)) return;
  if (!attacker.guild) return;
  // 只统计攻守双方行会成员之间的击杀
  if (!target.guild) return;
  // 不统计同阵营击杀
  if (attacker.guild && target.guild && String(attacker.guild.id) === String(target.guild.id)) return;
  // 必须有沙巴克占领者且攻城战已开始才统计
  if (!sabakState.ownerGuildId) return;
  if (!sabakState.active) return;
  // 只有攻守双方行会才参与统计
  const isAttackerDefender = String(attacker.guild.id) === String(sabakState.ownerGuildId);
  const isTargetDefender = String(target.guild.id) === String(sabakState.ownerGuildId);
  // 只有攻守双方互杀才算数
  if (!(isAttackerDefender || isTargetDefender)) return;

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
  if (String(player.guild.id) !== String(sabakState.ownerGuildId) && !sabakState.active) {
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

function hasHealBlockEffect(player) {
  return Object.values(player.equipment || {}).some((eq) => eq && eq.effects && eq.effects.healblock);
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
  // 护身戒指：受到攻击时10%几率减免伤害20%，持续2秒
  if (hasEquipped(target, 'ring_protect') && Math.random() <= 0.1) {
    const now = Date.now();
    if (!target.status.buffs) target.status.buffs = {};
    target.status.buffs.protectShield = { expiresAt: now + 2000, dmgReduction: 0.2 };
    target.send('护身戒指生效，伤害减免20%！');
  }
  if (target.status?.buffs?.protectShield) {
    const buff = target.status.buffs.protectShield;
    if (buff.expiresAt && buff.expiresAt < Date.now()) {
      delete target.status.buffs.protectShield;
    } else {
      dmg = Math.floor(dmg * (1 - (buff.dmgReduction || 0)));
    }
  }
  applyDamage(target, dmg);
}

function tryRevive(player) {
  if (player.hp > 0) return false;
  if (hasEquipped(player, 'ring_revival')) {
    const now = Date.now();
    const lastRevive = player.flags?.lastReviveAt || 0;
    const reviveCooldown = 60 * 1000; // 1分钟CD

    if (lastRevive > 0 && (now - lastRevive) < reviveCooldown) {
      const remaining = Math.ceil((reviveCooldown - (now - lastRevive)) / 1000);
      player.send(`复活戒指冷却中，还需等待 ${remaining} 秒。`);
      return false;
    }

    if (!player.flags) player.flags = {};
    player.flags.lastReviveAt = now;

    player.hp = player.max_hp;
    player.mp = player.max_mp;
    player.send('复活戒指生效，你完全恢复了生命和魔法！');
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
  const hpGain = Math.max(1, Math.floor(hpRegen * getHealMultiplier(player)));
  player.hp = clamp(player.hp + hpGain, 1, player.max_hp);
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
    const hpGain = Math.max(1, Math.floor(amount * getHealMultiplier(player)));
    player.hp = clamp(player.hp + hpGain, 1, player.max_hp);
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

// 房间状态缓存（用于BOSS房间优化）
const roomStateCache = new Map();
let roomStateLastUpdate = 0;
let roomStateCachedData = null;
const ROOM_STATE_TTL = 100; // 100ms缓存时间
const VIP_SELF_CLAIM_CACHE_TTL = 10000; // VIP自领缓存10秒
let vipSelfClaimCachedValue = null;
let vipSelfClaimLastUpdate = 0;

// 判断是否是BOSS房间（魔龙教主/世界BOSS/沙巴克BOSS/暗之系列）
function isBossRoom(zoneId, roomId) {
  if (!zoneId || !roomId) return false;
  const zone = WORLD[zoneId];
  if (!zone) return false;
  const room = zone.rooms[roomId];
  if (!room) return false;
  
  // 检查房间内的怪物是否有特殊BOSS
  const mobs = getRoomMobs(zoneId, roomId);
  return mobs.some(m => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });
}

async function buildState(player) {
  computeDerived(player);
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

  // 检查房间是否有BOSS，获取下次刷新时间
  const roomMobs = getRoomMobs(player.position.zone, player.position.room);
  const deadBosses = roomMobs.filter((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && m.hp <= 0 && isBossMob(tpl);
  });
  const nextRespawn = deadBosses.length > 0
    ? deadBosses.sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt
    : null;
  const exits = room ? (() => {
    const allExits = Object.entries(room.exits).map(([dir, dest]) => {
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
    });

    // 合并带数字后缀的方向，只显示一个入口（暗之BOSS房间除外）
    const filteredExits = [];
    allExits.forEach(exit => {
      const dir = exit.dir;
      const baseDir = dir.replace(/[0-9]+$/, '');

      // 检查是否是前往暗之BOSS房间的入口
      const isDarkBossExit = exit.dir.startsWith('southwest');

      // 检查是否有数字后缀的变体
      const hasVariants = allExits.some(e =>
        e.dir !== dir && e.dir.startsWith(baseDir) && /[0-9]+$/.test(e.dir)
      );

      if (isDarkBossExit) {
        // 暗之BOSS入口不合并，全部显示
        filteredExits.push(exit);
      } else if (hasVariants) {
        // 只添加基础方向，不添加数字后缀的
        if (!/[0-9]+$/.test(dir) && !filteredExits.some(e => e.dir === baseDir)) {
          filteredExits.push({ dir: baseDir, label: exit.label.replace(/[0-9]+$/, '') });
        }
      } else {
        // 没有变体，正常添加
        filteredExits.push(exit);
      }
    });

    // 移除标签中的数字后缀（如 "平原1" -> "平原"）（暗之BOSS房间除外）
    const cleanExits = filteredExits.map(exit => ({
      dir: exit.dir,
      label: exit.dir.startsWith('southwest') ? exit.label : exit.label.replace(/(\D)\d+$/, '$1')
    }));

    return cleanExits;
  })() : [];
  const skills = getLearnedSkills(player).map((s) => ({
    id: s.id,
    name: s.name,
    mp: s.mp,
    type: s.type,
    level: getSkillLevel(player, s.id),
    exp: player.flags?.skillMastery?.[s.id]?.exp || 0,
    expNext: player.flags?.skillMastery?.[s.id]?.level ? SKILL_MASTERY_LEVELS[player.flags.skillMastery[s.id].level] : SKILL_MASTERY_LEVELS[1]
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
      durability: i.durability ?? null,
      max_durability: i.max_durability ?? null,
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
    player.guild && sabakState.ownerGuildId && String(player.guild.id) === String(sabakState.ownerGuildId)
  );
  // 优化：BOSS房间使用缓存的公共数据
  const isBoss = isBossRoom(player.position.zone, player.position.room);
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
  
  let bossRank = [];
  let bossNextRespawn = null;
  
  // 检查魔龙教主、世界BOSS、沙巴克BOSS、暗之BOSS的刷新时间
  const deadSpecialBosses = deadBosses.filter((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });
  if (deadSpecialBosses.length > 0) {
    bossNextRespawn = deadSpecialBosses.sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt;
  }
  const bossMob = getAliveMobs(player.position.zone, player.position.room).find((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });
  if (bossMob) {
    const { entries } = buildDamageRankMap(bossMob);
    bossRank = entries.slice(0, 5).map(([name, damage]) => ({ name, damage }));
  }
  
  // VIP自领状态缓存
  let vipSelfClaimEnabled;
  if (Date.now() - vipSelfClaimLastUpdate > VIP_SELF_CLAIM_CACHE_TTL) {
    vipSelfClaimEnabled = await getVipSelfClaimEnabled();
    vipSelfClaimCachedValue = vipSelfClaimEnabled;
    vipSelfClaimLastUpdate = Date.now();
  } else {
    vipSelfClaimEnabled = vipSelfClaimCachedValue;
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
      dodge: Math.round((player.evadeChance || 0) * 100),
      autoSkillId: player.flags?.autoSkillId || null,
      sabak_bonus: sabakBonus,
      set_bonus: Boolean(player.flags?.setBonusActive)
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
    party: party ? { size: party.members.length, leader: party.leader, members: partyMembers } : null,
    training: player.flags?.training || { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 },
    online: { count: onlineCount },
    trade: getTradeByPlayer(player.name) ? (() => {
      const trade = getTradeByPlayer(player.name);
      const myOffer = trade.offers[player.name];
      const partnerName = trade.a.name === player.name ? trade.b.name : trade.a.name;
      const partnerOffer = trade.offers[partnerName];
      return {
        partnerName,
        myItems: myOffer.items.map(i => ({ id: i.id, qty: i.qty, effects: i.effects })),
        myGold: myOffer.gold,
        partnerItems: partnerOffer.items.map(i => ({ id: i.id, qty: i.qty, effects: i.effects })),
        partnerGold: partnerOffer.gold,
        locked: trade.locked,
        confirmed: trade.confirmed
      };
    })() : null,
    sabak: {
      inZone: isSabakZone(player.position.zone),
      active: sabakState.active,
      ownerGuildId: sabakState.ownerGuildId,
      ownerGuildName: sabakState.ownerGuildName,
      inPalace: isSabakPalace(player.position.zone, player.position.room),
      palaceKillStats: isSabakPalace(player.position.zone, player.position.room) ? getSabakPalaceKillStats() : null,
      siegeEndsAt: sabakState.siegeEndsAt || null
    },
    worldBossRank: bossRank,
    worldBossNextRespawn: bossNextRespawn,
    players: roomPlayers,
    bossRespawn: nextRespawn,
    server_time: Date.now(),
    vip_self_claim_enabled: vipSelfClaimEnabled
  };
}

async function sendState(player) {
  if (!player.socket) return;
  const state = await buildState(player);
  player.socket.emit('state', state);
}

async function sendRoomState(zoneId, roomId) {
  const players = listOnlinePlayers()
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId);
  
  if (players.length === 0) return;
  
  // BOSS房间优化：批量处理，减少序列化开销
  const isBoss = isBossRoom(zoneId, roomId);
  
  if (isBoss && players.length > 5) {
    // BOSS房间且人很多时，使用节流，每100ms最多更新一次
    const cacheKey = `${zoneId}:${roomId}`;
    const now = Date.now();
    const lastUpdate = roomStateCache.get(cacheKey) || 0;
    
    if (now - lastUpdate < ROOM_STATE_TTL) {
      return; // 还在缓存期内，跳过
    }
    roomStateCache.set(cacheKey, now);
  }
  
  // 使用Promise.all并行发送
  await Promise.all(players.map(p => sendState(p)));
}

const WORLD_BOSS_ROOM = { zoneId: 'wb', roomId: 'lair' };
const SUMMON_MAX_LEVEL = 8;
const SUMMON_EXP_PER_LEVEL = 5;

function checkMobRespawn() {
  // 检查所有房间的怪物刷新（包括BOSS和普通怪物）
  Object.keys(WORLD).forEach((zoneId) => {
    const zone = WORLD[zoneId];
    if (!zone?.rooms) return;

    Object.keys(zone.rooms).forEach((roomId) => {
      const room = zone.rooms[roomId];
      const mobs = spawnMobs(zoneId, roomId);
      const respawned = mobs.filter((m) => m.justRespawned);

      if (respawned.length) {
        respawned.forEach((mob) => {
          mob.justRespawned = false;
        });

        // 检查是否有特殊BOSS刷新（魔龙教主、世界BOSS、沙巴克BOSS）
        const specialBossRespawned = respawned.find(m => {
          const tpl = MOB_TEMPLATES[m?.templateId];
          return tpl && tpl.specialBoss;
        });

        if (specialBossRespawned) {
          const bossName = specialBossRespawned.name || 'BOSS';
          const locationData = {
            zoneId,
            roomId,
            label: `${zone.name} - ${room.name}`
          };
          emitAnnouncement(
            `${bossName} 已刷新，点击前往。`,
            'announce',
            locationData
          );
        }
      }
    });
  });
}

function recordMobDamage(mob, attackerName, dmg) {
  if (!mob) return;
  if (!mob.status) mob.status = {};
  if (!mob.status.damageBy) mob.status.damageBy = {};
  if (!mob.status.firstHitBy) mob.status.firstHitBy = attackerName;
  if (!attackerName) return;
  mob.status.damageBy[attackerName] = (mob.status.damageBy[attackerName] || 0) + dmg;
  mob.status.lastHitBy = attackerName;
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
  const mobTemplate = MOB_TEMPLATES[mob.templateId];
  const isSpecialBoss = Boolean(mobTemplate?.specialBoss);

  // 特殊BOSS防御效果：受到攻击时触发
  if (isSpecialBoss) {
    const now = Date.now();

    // 检查无敌状态（免疫伤害、毒、麻痹、降攻击、降防效果）
    if (mob.status?.invincible && mob.status.invincible > now) {
      // 无敌状态，伤害为0
      if (attackerName) {
        const attacker = playersByName(attackerName);
        if (attacker) {
          attacker.send(`${mob.name} 处于无敌状态，免疫了所有伤害！`);
        }
      }
      return { damageTaken: false };
    }

    // 10%几率触发无敌效果（持续10秒）
    if (Math.random() <= 0.1) {
      if (!mob.status) mob.status = {};
      mob.status.invincible = now + 10000;
      if (attackerName) {
        const attacker = playersByName(attackerName);
        if (attacker) {
          attacker.send(`${mob.name} 触发了无敌效果，10秒内免疫所有伤害、毒、麻痹、降攻击、降防效果！`);
        }
      }
      // 这次攻击无效
      return { damageTaken: false };
    }

    // 10%几率触发50%减伤
    if (Math.random() <= 0.1) {
      const originalDmg = dmg;
      dmg = Math.floor(dmg * 0.5);
      if (attackerName) {
        const attacker = playersByName(attackerName);
        if (attacker) {
          attacker.send(`${mob.name} 触发了减伤效果，伤害从 ${originalDmg} 降低到 ${dmg}！`);
        }
      }
    }
  }

  recordMobDamage(mob, attackerName, dmg);
  applyDamage(mob, dmg);

  // 特殊BOSS血量百分比公告
  if (isSpecialBoss && mob.hp > 0) {
    const hpPct = mob.hp / mob.max_hp;
    if (!mob.status) mob.status = {};

    // 检查是否需要公告50%、30%、10%血量
    const thresholds = [0.5, 0.3, 0.1];
    for (const threshold of thresholds) {
      const key = `announced${threshold * 100}`;
      if (hpPct <= threshold && !mob.status[key]) {
        mob.status[key] = true;
        emitAnnouncement(
          `${mob.name} 剩余 ${Math.floor(hpPct * 100)}% 血量！`,
          'warn'
        );
      }
    }
  }

  return { damageTaken: true, actualDamage: dmg };
}

function retaliateMobAgainstPlayer(mob, player, online) {
  if (!mob || mob.hp <= 0) return;
  if (mob.status && mob.status.stunTurns > 0) return;
  const summonAlive = Boolean(player.summon && player.summon.hp > 0);
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
  if (Math.random() > mobHitChance) return;
  if (mobTarget && mobTarget.evadeChance && Math.random() <= mobTarget.evadeChance) {
    if (mobTarget.userId) {
      mobTarget.send(`你闪避了 ${mob.name} 的攻击。`);
    } else {
      player.send(`${mobTarget.name} 闪避了 ${mob.name} 的攻击。`);
    }
    return;
  }
  let dmg = calcDamage(mob, mobTarget, 1);
  if (mobTemplate && isBossMob(mobTemplate)) {
    const magicBase = Math.floor(mob.atk * 0.3);
    const spiritBase = Math.floor(mob.atk * 0.3);
    dmg += calcMagicDamageFromValue(magicBase, mobTarget);
    dmg += calcMagicDamageFromValue(spiritBase, mobTarget);
  }
  
  // 特殊BOSS破防效果：魔龙教主、世界BOSS、沙巴克BOSS、暗之BOSS攻击时有20%几率破防
  const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
  if (isSpecialBoss && Math.random() <= 0.2) {
    if (!mobTarget.status) mobTarget.status = {};
    if (!mobTarget.status.debuffs) mobTarget.status.debuffs = {};
    const now = Date.now();
    mobTarget.status.debuffs.armorBreak = {
      defMultiplier: 0.5,
      expiresAt: now + 3000
    };
    if (mobTarget.userId) {
      mobTarget.send(`${mob.name} 破防攻击！你的防御和魔御降低50%，持续3秒。`);
      if (mobTarget !== player) {
        player.send(`${mob.name} 对 ${mobTarget.name} 造成破防效果！`);
      }
    } else {
      player.send(`${mob.name} 对 ${mobTarget.name} 造成破防效果！`);
    }
  }
  
  // 特殊BOSS毒伤害效果：20%几率使目标持续掉血，每秒掉1%气血，持续5秒
  if (isSpecialBoss && Math.random() <= 0.2) {
    if (!mobTarget.status) mobTarget.status = {};
    const maxHp = Math.max(1, mobTarget.max_hp || 1);
    const tickDmg = Math.max(1, Math.floor(maxHp * 0.01));
    applyPoison(mobTarget, 5, tickDmg, mob.name);
    if (mobTarget.userId) {
      mobTarget.send(`${mob.name} 的毒性攻击！你将每秒损失1%气血，持续5秒。`);
      if (mobTarget !== player) {
        player.send(`${mob.name} 对 ${mobTarget.name} 造成毒性伤害！`);
      }
    } else {
      player.send(`${mob.name} 对 ${mobTarget.name} 造成毒性伤害！`);
    }
  }

  // 检查弱化效果（玩家佩戴弱化戒指对怪物施加）
  if (mob.status?.debuffs?.weak) {
    const weak = mob.status.debuffs.weak;
    if (weak.expiresAt && weak.expiresAt < Date.now()) {
      delete mob.status.debuffs.weak;
    } else {
      dmg = Math.floor(dmg * (1 - (weak.dmgReduction || 0)));
    }
  }

  if (mobTarget && mobTarget.userId) {
    applyDamageToPlayer(mobTarget, dmg);
    mobTarget.send(`${mob.name} 对你造成 ${dmg} 点伤害。`);
    if (mobTarget !== player) {
      player.send(`${mob.name} 攻击 ${mobTarget.name}，造成 ${dmg} 点伤害。`);
    }
    if (mobTarget.hp <= 0 && mobTarget !== player && !tryRevive(mobTarget)) {
      handleDeath(mobTarget);
    }
    
    // 特殊BOSS溅射效果：对房间所有其他玩家和召唤物造成BOSS攻击力50%的溅射伤害
    if (isSpecialBoss && online && online.length > 0) {
      const splashDmg = Math.floor(mob.atk * 0.5);
      const roomPlayers = online.filter((p) => 
        p.name !== mobTarget.name &&
        p.position.zone === player.position.zone &&
        p.position.room === player.position.room &&
        p.hp > 0
      );
      
      roomPlayers.forEach((splashTarget) => {
        applyDamageToPlayer(splashTarget, splashDmg);
        splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDmg} 点伤害。`);
        if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
          handleDeath(splashTarget);
        }
        
        // 溅射到召唤物
        if (splashTarget.summon && splashTarget.summon.hp > 0) {
          applyDamage(splashTarget.summon, splashDmg);
          splashTarget.send(`${mob.name} 的攻击溅射到 ${splashTarget.summon.name}，造成 ${splashDmg} 点伤害。`);
          if (splashTarget.summon.hp <= 0) {
            splashTarget.send(`${splashTarget.summon.name} 被击败。`);
            splashTarget.summon = null;
            autoResummon(splashTarget);
          }
        }
      });
      
      // 溅射到主目标的召唤物（如果主目标是玩家且有召唤物）
      if (mobTarget.summon && mobTarget.summon.hp > 0 && mobTarget !== mobTarget.summon) {
        applyDamage(mobTarget.summon, splashDmg);
        mobTarget.send(`${mob.name} 的攻击溅射到 ${mobTarget.summon.name}，造成 ${splashDmg} 点伤害。`);
        if (mobTarget.summon.hp <= 0) {
          mobTarget.send(`${mobTarget.summon.name} 被击败。`);
          mobTarget.summon = null;
          autoResummon(mobTarget);
        }
      }
    }
    
    return;
  }
  applyDamage(mobTarget, dmg);
  player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
  
  // 特殊BOSS溅射效果：主目标是召唤物时，对玩家和房间所有其他玩家及召唤物造成BOSS攻击力50%的溅射伤害
  if (isSpecialBoss && online && online.length > 0) {
    const splashDmg = Math.floor(mob.atk * 0.5);
    
    // 溅射到召唤物的主人
    if (player && player.hp > 0) {
      applyDamageToPlayer(player, splashDmg);
      player.send(`${mob.name} 的攻击溅射到你，造成 ${splashDmg} 点伤害。`);
      if (player.hp <= 0 && !tryRevive(player)) {
        handleDeath(player);
      }
    }
    
    // 溅射到房间所有其他玩家和召唤物
    const roomPlayers = online.filter((p) => 
      p.name !== player.name &&
      p.position.zone === player.position.zone &&
      p.position.room === player.position.room &&
      p.hp > 0
    );
    
    roomPlayers.forEach((splashTarget) => {
      applyDamageToPlayer(splashTarget, splashDmg);
      splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDmg} 点伤害。`);
      if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
        handleDeath(splashTarget);
      }
      
      // 溅射到其他玩家的召唤物
      if (splashTarget.summon && splashTarget.summon.hp > 0) {
        applyDamage(splashTarget.summon, splashDmg);
        splashTarget.send(`${mob.name} 的攻击溅射到 ${splashTarget.summon.name}，造成 ${splashDmg} 点伤害。`);
        if (splashTarget.summon.hp <= 0) {
          splashTarget.send(`${splashTarget.summon.name} 被击败。`);
          splashTarget.summon = null;
          autoResummon(splashTarget);
        }
      }
    });
  }
  
  if (mobTarget.hp <= 0) {
    player.send(`${mobTarget.name} 被击败。`);
  }
}

function tickMobRegen(mob) {
  if (!mob || mob.hp <= 0 || !mob.max_hp) return;
  const template = MOB_TEMPLATES[mob.templateId];
  const isSpecialBoss = Boolean(template?.specialBoss);
  const now = Date.now();
  if (!mob.status) mob.status = {};

  // 特殊BOSS（魔龙教主、世界BOSS、沙巴克BOSS）每20秒恢复1%气血
  const interval = isSpecialBoss ? 20000 : 1000;
  const last = mob.status.lastRegenAt || 0;
  if (now - last < interval) return;

  // 检查禁疗效果
  let regen = isSpecialBoss
    ? Math.max(1, Math.floor(mob.max_hp * 0.01))  // 1%气血
    : Math.max(1, Math.floor(mob.max_hp * 0.005));  // 普通怪物0.5%气血

  // 禁疗效果降低恢复量
  if (mob.status?.debuffs?.healBlock) {
    regen = Math.max(1, Math.floor(regen * 0.3));  // 禁疗状态下只恢复30%
  }

  mob.hp = Math.min(mob.max_hp, mob.hp + regen);
  mob.status.lastRegenAt = now;
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
  // 检查破防效果（影响魔御）
  const armorBreak = debuffs.armorBreak;
  if (armorBreak) {
    if (armorBreak.expiresAt && armorBreak.expiresAt < now) {
      delete debuffs.armorBreak;
    } else {
      multiplier *= armorBreak.defMultiplier || 1;
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

function applyHealBlockDebuff(target) {
  if (!target.status) target.status = {};
  if (!target.status.debuffs) target.status.debuffs = {};
  target.status.debuffs.healBlock = {
    healMultiplier: 0.1,
    expiresAt: Date.now() + 5000
  };
}

function getHealMultiplier(target) {
  const debuff = target.status?.debuffs?.healBlock;
  if (!debuff) return 1;
  if (debuff.expiresAt && debuff.expiresAt < Date.now()) {
    delete target.status.debuffs.healBlock;
    return 1;
  }
  return debuff.healMultiplier || 1;
}

function tryApplyHealBlockEffect(attacker, target) {
  if (!attacker || !target) return false;
  if (!hasHealBlockEffect(attacker)) return false;
  if (Math.random() > 0.2) return false;
  applyHealBlockDebuff(target);
  return true;
}

function calcMagicDamageFromValue(value, target) {
  const base = Math.max(0, value || 0);
  const mdefMultiplier = getMagicDefenseMultiplier(target);
  const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
  const dmg = Math.floor((base + randInt(0, base / 2)) - mdef * 0.6);
  return Math.max(1, dmg);
}

function calcPoisonTickDamage(target) {
  const maxHp = Math.max(1, target.max_hp || 1);
  const total = Math.max(1, Math.floor(maxHp * 0.4));  // 提升到40%
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

  // 检查是否在特殊BOSS房间（魔龙教主、世界BOSS、沙巴克BOSS）
  const zone = WORLD[player.position.zone];
  const room = zone?.rooms[player.position.room];
  const roomMobs = getAliveMobs(player.position.zone, player.position.room);
  const isSpecialBossRoom = roomMobs.some((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });

  // 特殊BOSS房间优先使用太阳水和万年雪霜
  const hpList = isSpecialBossRoom
    ? ['sun_water', 'snow_frost', 'potion_super', 'potion_big', 'potion_mid', 'potion_small']
    : ['potion_big', 'potion_mid', 'potion_small', 'sun_water', 'snow_frost', 'potion_super'];
  const mpList = isSpecialBossRoom
    ? ['sun_water', 'snow_frost', 'potion_mana_big', 'potion_mana_mid', 'potion_mana', 'potion_mana_super']
    : ['potion_mana_big', 'potion_mana_mid', 'potion_mana', 'potion_mana_super', 'sun_water', 'snow_frost'];

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
          if (item.hp) {
            const hpGain = Math.max(1, Math.floor(item.hp * getHealMultiplier(player)));
            player.hp = clamp(player.hp + hpGain, 1, player.max_hp);
          }
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

    // 检查是否已有同名角色在线，如果有则踢掉之前的连接
    const existingSocketId = Array.from(players.keys()).find(key => players.get(key)?.name === name);
    if (existingSocketId) {
      const existingPlayer = players.get(existingSocketId);
      if (existingPlayer) {
        // 通知旧连接被踢下线
        existingPlayer.send('您的账号在别处登录，您已被强制下线。');
        // 保存并移除之前的会话
        await savePlayer(existingPlayer);
        // 断开旧连接
        existingPlayer.socket.disconnect();
        // 移除旧的玩家数据
        players.delete(existingSocketId);
        // 从队伍中移除
        const party = getPartyByMember(name);
        if (party) {
          party.members = party.members.filter(m => m !== name);
          if (party.members.length === 0) {
            parties.delete(party.id);
          }
        }
      }
    }

    computeDerived(loaded);
    loaded.userId = session.user_id;
    loaded.socket = socket;
    loaded.send = (msg) => sendTo(loaded, msg);
    loaded.combat = null;
    loaded.guild = null;
    if (!loaded.flags) loaded.flags = {};
    if (loaded.flags?.partyId && Array.isArray(loaded.flags.partyMembers) && loaded.flags.partyMembers.length) {
      const partyId = loaded.flags.partyId;
      const memberList = Array.from(new Set(loaded.flags.partyMembers.concat(loaded.name)));
      let party = getPartyById(partyId);
      if (!party) {
        parties.set(partyId, {
          id: partyId,
          leader: loaded.flags.partyLeader || memberList[0] || loaded.name,
          members: memberList,
          lootIndex: 0
        });
        party = parties.get(partyId);
      } else {
        memberList.forEach((member) => {
          if (!party.members.includes(member)) party.members.push(member);
        });
        party.members = Array.from(new Set(party.members));
        if (!party.leader || !party.members.includes(party.leader)) {
          party.leader = loaded.flags.partyLeader || party.members[0] || loaded.name;
        }
      }
      if (!loaded.flags) loaded.flags = {};
      loaded.flags.partyMembers = party.members.slice();
      loaded.flags.partyLeader = party.leader || null;
    }

    const member = await getGuildMember(session.user_id, name);
    if (member && member.guild) {
      loaded.guild = { id: member.guild.id, name: member.guild.name, role: member.role };
    }

    players.set(socket.id, loaded);
    loaded.send(`欢迎回来，${loaded.name}。`);
    loaded.send(`金币: ${loaded.gold}`);
    if (loaded.guild) loaded.send(`行会: ${loaded.guild.name}`);
    applyOfflineRewards(loaded);
    spawnMobs(loaded.position.zone, loaded.position.room);
    await handleSabakEntry(loaded);
    const zone = WORLD[loaded.position.zone];
    const room = zone?.rooms[loaded.position.room];
    const locationName = zone && room ? `${zone.name} - ${room.name}` : `${loaded.position.zone}:${loaded.position.room}`;
    loaded.send(`你位于 ${locationName}。`);
    await sendState(loaded);
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
        followInvites: partyFollowInvites,
        createParty,
        getPartyByMember,
        removeFromParty,
        persistParty,
        clearPartyFlags
      },
      guildApi: {
        invites: guildInvites,
        createGuild,
        getGuildByName,
        addGuildMember,
        removeGuildMember,
        listGuildMembers,
        isGuildLeader,
        transferGuildLeader,
        registerSabak,
        listSabakRegistrations,
        sabakState,
        sabakConfig,
        sabakWindowInfo,
        useVipCode,
        createVipCodes,
        getVipSelfClaimEnabled,
        setVipSelfClaimEnabled,
        canUserClaimVip,
        incrementUserVipClaimCount
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
    await sendState(player);
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

  socket.on('sabak_info', async () => {
    const player = players.get(socket.id);
    if (!player) return;

    const ownerGuildName = sabakState.ownerGuildName || '无';
    const windowInfo = sabakWindowInfo();
    const registrations = await listSabakRegistrations();

    // 将守城方行会添加到报名列表中显示
    let displayRegistrations = registrations || [];
    if (sabakState.ownerGuildId && sabakState.ownerGuildName) {
      displayRegistrations = [
        { guild_id: sabakState.ownerGuildId, guild_name: sabakState.ownerGuildName, isDefender: true },
        ...displayRegistrations.map(r => ({ ...r, isDefender: false }))
      ];
    }

    const isOwner = player.guild && String(player.guild.id) === String(sabakState.ownerGuildId);
    const canRegister = player.guild && player.guild.role === 'leader' && !isOwner;

    socket.emit('sabak_info', {
      windowInfo,
      ownerGuildName,
      registrations: displayRegistrations,
      canRegister,
      isOwner
    });
  });

  socket.on('sabak_register_confirm', async () => {
    const player = players.get(socket.id);
    if (!player) return;

    if (!player.guild) {
      player.send('你不在行会中。');
      return;
    }
    const isLeader = await isGuildLeader(player.guild.id, player.userId, player.name);
    if (!isLeader) {
      player.send('只有会长可以报名。');
      return;
    }
    const isOwner = String(player.guild.id) === String(sabakState.ownerGuildId);
    if (isOwner) {
      player.send('守城行会无需报名。');
      return;
    }
    // 检查报名时间：0:00-19:50
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;
    const registerEndMinutes = 19 * 60 + 50; // 19:50
    if (totalMinutes >= registerEndMinutes) {
      player.send('报名时间为每日 0:00-19:50，当前时间已截止报名。');
      return;
    }
    const hasRegisteredToday = await hasSabakRegistrationToday(player.guild.id);
    if (hasRegisteredToday) {
      player.send('该行会今天已经报名过了。');
      return;
    }
    const registrations = await listSabakRegistrations();
    const today = new Date();
    const todayRegistrations = registrations.filter(r => {
      if (!r.registered_at) return false;
      const regDate = new Date(r.registered_at);
      return regDate.toDateString() === today.toDateString();
    });
    if (todayRegistrations.length >= 1) {
      player.send('今天已经有行会报名了，每天只能有一个行会申请攻城。');
      return;
    }
    if (player.gold < 5000000) {
      player.send('报名需要500万金币。');
      return;
    }
    player.gold -= 5000000;
    try {
      await registerSabak(player.guild.id);
      player.send('已报名沙巴克攻城，支付500万金币。');
    } catch {
      player.send('该行会已经报名。');
      player.gold += 5000000;
    }
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

function tryAutoHeal(player) {
  if (!player.flags?.autoSkillId) return false;
  const healSkill = getLearnedSkills(player).find((skill) => skill.type === 'heal');
  if (!healSkill) return false;
  if (player.mp < healSkill.mp) return false;

  const healThreshold = 0.2;
  const candidates = [];

  if (player.hp / player.max_hp < healThreshold) {
    candidates.push({ target: player, name: player.name });
  }

  if (player.summon && player.summon.hp > 0 && player.summon.hp / player.summon.max_hp < healThreshold) {
    candidates.push({ target: player.summon, name: player.summon.name, isSummon: true });
  }

  const party = getPartyByMember(player.name);
  if (party && party.members.length > 0) {
    const online = listOnlinePlayers();
    party.members.forEach((memberName) => {
      if (memberName === player.name) return;
      const member = playersByName(memberName);
      if (member &&
          member.position.zone === player.position.zone &&
          member.position.room === player.position.room &&
          member.hp / member.max_hp < healThreshold) {
        candidates.push({ target: member, name: member.name });
      }
    });
  }

  if (candidates.length === 0) return false;

  candidates.sort((a, b) => (a.target.hp / a.target.max_hp) - (b.target.hp / b.target.max_hp));
  const toHeal = candidates[0];

  player.mp = clamp(player.mp - healSkill.mp, 0, player.max_mp);
  const baseHeal = Math.floor((player.spirit || 0) * 0.8 * scaledSkillPower(healSkill, getSkillLevel(player, healSkill.id)) + player.level * 4);
  const heal = Math.max(1, Math.floor(baseHeal * getHealMultiplier(player)));

  if (toHeal.isSummon) {
    toHeal.target.hp = clamp(toHeal.target.hp + heal, 1, toHeal.target.max_hp);
    player.send(`自动施放 ${healSkill.name}，为 ${toHeal.name} 恢复 ${heal} 点生命。`);
  } else {
    toHeal.target.hp = clamp(toHeal.target.hp + heal, 1, toHeal.target.max_hp);
    toHeal.target.send(`${player.name} 自动为你施放 ${healSkill.name}，恢复 ${heal} 点生命。`);
    if (toHeal.name !== player.name) {
      player.send(`自动施放 ${healSkill.name}，为 ${toHeal.name} 恢复 ${heal} 点生命。`);
    } else {
      player.send(`自动施放 ${healSkill.name}，恢复 ${heal} 点生命。`);
    }
  }
  return true;
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

  let summonSkill = null;
  const lastSkillId = player.flags?.lastSummonSkill;

  if (lastSkillId) {
    summonSkill = skills.find((skill) => skill.id === lastSkillId);
  }

  if (!summonSkill) {
    summonSkill = skills.sort((a, b) => getSkillLevel(player, b.id) - getSkillLevel(player, a.id))[0];
  }

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
  const threshold = player.flags.vip ? 400 : 200;
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
  // 随机分配到4个平原变体
  const plainsVariants = ['plains', 'plains1', 'plains2', 'plains3'];
  const randomPlains = plainsVariants[Math.floor(Math.random() * plainsVariants.length)];
  player.position = { zone: 'bq_plains', room: randomPlains };
  player.combat = null;
  player.send('你被击败，返回了平原。');
}

function processMobDeath(player, mob, online) {
  const damageSnapshot = mob.status?.damageBy ? { ...mob.status.damageBy } : {};
  const lastHitSnapshot = mob.status?.lastHitBy || null;
  const template = MOB_TEMPLATES[mob.templateId];
  removeMob(player.position.zone, player.position.room, mob.id);
  gainSummonExp(player);
  const exp = template.exp;
  const gold = randInt(template.gold[0], template.gold[1]);

  const party = getPartyByMember(player.name);
  // 检查队伍成员是否都在同一个房间
  const allPartyInSameRoom = party ? partyMembersInSameRoom(party, online, player.position.zone, player.position.room) : false;
  // 物品分配：只有队友都在同一个房间才能分掉落的物品
  let partyMembersForLoot = allPartyInSameRoom ? partyMembersInRoom(party, online, player.position.zone, player.position.room) : [];
  // 经验金币分配使用全图在线的队友
  let partyMembersForReward = party ? partyMembersOnline(party, online) : [];
  // 计算加成使用队伍总人数（包括离线的）
  const totalPartyCount = partyMembersTotalCount(party) || 1;
  const hasParty = partyMembersForReward.length > 1;
  const isBoss = isBossMob(template);
  const isWorldBoss = Boolean(template.worldBoss);
  const isSabakBoss = Boolean(template.sabakBoss);
  const isMolongBoss = template.id === 'molong_boss';
  const isSpecialBoss = isWorldBoss || isSabakBoss || isMolongBoss;
  const { rankMap, entries } = isSpecialBoss ? buildDamageRankMap(mob, damageSnapshot) : { rankMap: {}, entries: [] };
  let lootOwner = player;
  if (!party || partyMembersForReward.length === 0) {
    let ownerName = null;
    if (isSpecialBoss) {
      const damageBy = damageSnapshot;
      let maxDamage = -1;
      Object.entries(damageBy).forEach(([name, dmg]) => {
        if (dmg > maxDamage) {
          maxDamage = dmg;
          ownerName = name;
        }
      });
    } else {
      ownerName = lastHitSnapshot;
    }
    if (!ownerName) ownerName = player.name;
    lootOwner = playersByName(ownerName) || player;
    partyMembersForReward = [lootOwner];
    partyMembersForLoot = [lootOwner];
  }
  const eligibleCount = hasParty ? 1 : partyMembersForReward.length;
  const bonus = totalPartyCount > 1 ? Math.min(0.2 * totalPartyCount, 1.0) : 0;
  const totalExp = Math.floor(exp * (1 + bonus));
  const totalGold = Math.floor(gold * (1 + bonus));
  const shareExp = hasParty ? totalExp : Math.floor(totalExp / eligibleCount);
  const shareGold = hasParty ? totalGold : Math.floor(totalGold / eligibleCount);

    let sabakTaxExp = 0;
    let sabakTaxGold = 0;
    const sabakMembers = listSabakMembersOnline();
    partyMembersForReward.forEach((member) => {
      const isSabakMember = member.guild && sabakState.ownerGuildId && String(member.guild.id) === String(sabakState.ownerGuildId);
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
    let legendaryDropGiven = false;
    if (isSpecialBoss) {
      const topEntries = entries.slice(0, 10);
      const totalDamage = entries.reduce((sum, [, dmg]) => sum + dmg, 0) || 1;
      const top10Count = topEntries.length;
      topEntries.forEach(([name, damage]) => {
        const player = playersByName(name);
        if (!player) return;
        const damageRatio = damage / totalDamage;
        dropTargets.push({ player, damageRatio, rank: entries.findIndex(([n]) => n === name) + 1 });
      });
      if (!dropTargets.length) {
        dropTargets.push({ player: lootOwner, damageRatio: 1, rank: 1 });
      }
    } else {
      dropTargets.push({ player: lootOwner, damageRatio: 1, rank: 1 });
    }

    if (isSpecialBoss && entries.length) {
      const topName = entries[0][0];
      const topPlayer = playersByName(topName);
      if (topPlayer) {
        const bossLabel = isWorldBoss ? '世界BOSS' : (isSabakBoss ? '沙巴克BOSS' : '魔龙教主');
        let forcedId = rollRarityEquipmentDrop(template, 1);
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
          topPlayer.send(`${bossLabel}排名第1奖励：${formatItemLabel(forcedId, forcedEffects)}。`);
          const forcedItem = ITEM_TEMPLATES[forcedId];
          if (forcedItem) {
            const forcedRarity = rarityByPrice(forcedItem);
            if (['epic', 'legendary'].includes(forcedRarity)) {
              emitAnnouncement(`${topPlayer.name} 获得${bossLabel}首位奖励 ${formatItemLabel(forcedId, forcedEffects)}！`, forcedRarity);
            }
            if (isEquipmentItem(forcedItem) && hasSpecialEffects(forcedEffects)) {
              emitAnnouncement(`${topPlayer.name} 获得特效装备 ${formatItemLabel(forcedId, forcedEffects)}！`, 'announce');
            }
          }
        }
      }
    }

    dropTargets.forEach(({ player: owner, damageRatio }) => {
      const drops = dropLoot(template, 1);
      if (!drops.length) return;
      if (!isSpecialBoss && party && partyMembersForLoot.length > 0) {
        const distributed = distributeLoot(party, partyMembersForLoot, drops);
        distributed.forEach(({ id, effects, target }) => {
          const item = ITEM_TEMPLATES[id];
          if (!item) return;
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary'].includes(rarity)) {
            const text = `${target.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(id, effects)}！`;
            emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(effects)) {
            emitAnnouncement(`${target.name} 获得特效装备 ${formatItemLabel(id, effects)}！`, 'announce');
          }
        });
      } else if (isSpecialBoss) {
        const actualDrops = [];
        let itemCount = 0;
        const maxItemsPerPlayer = 2;
        drops.forEach((entry) => {
          if (itemCount >= maxItemsPerPlayer) return;
          if (Math.random() > owner.damageRatio) return;

          const item = ITEM_TEMPLATES[entry.id];
          if (item) {
            const rarity = rarityByPrice(item);
            if (rarity === 'legendary' && owner.rank > 3) return;
            if (rarity === 'legendary' && legendaryDropGiven) return;
          }

          addItem(owner, entry.id, 1, entry.effects);
          actualDrops.push(entry);
          itemCount++;
          if (item) {
            const rarity = rarityByPrice(item);
            if (rarity === 'legendary') {
              legendaryDropGiven = true;
            }
          }
          if (!item) return;
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary'].includes(rarity)) {
            const text = `${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`;
            emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce');
          }
        });
        if (actualDrops.length > 0) {
          owner.send(`掉落: ${actualDrops.map((entry) => formatItemLabel(entry.id, entry.effects)).join(', ')}`);
        }
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
            const text = `${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`;
            emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce');
          }
        });
      }
    });
}

function updateSpecialBossStatsBasedOnPlayers() {
  const online = listOnlinePlayers();

  // 检查所有房间的特殊BOSS
  Object.keys(WORLD).forEach((zoneId) => {
    const zone = WORLD[zoneId];
    if (!zone?.rooms) return;

    Object.keys(zone.rooms).forEach((roomId) => {
      const roomMobs = getAliveMobs(zoneId, roomId);
      const specialBoss = roomMobs.find((m) => {
        const tpl = MOB_TEMPLATES[m.templateId];
        return tpl && tpl.specialBoss;
      });

      if (!specialBoss) return;

      // 统计房间内玩家人数
      const playersInRoom = online.filter(
        (p) => p.position.zone === zoneId && p.position.room === roomId
      ).length;

      const tpl = MOB_TEMPLATES[specialBoss.templateId];
      const baseAtk = tpl.atk;
      const baseDef = tpl.def;
      const baseMdef = tpl.mdef;

      let atkBonus = 0;
      let defBonus = 0;
      let mdefBonus = 0;

      // 房间人数少于2人时，增加1000攻击、5000防御、5000魔御
      if (playersInRoom < 2) {
        atkBonus = 1000;
        defBonus = 5000;
        mdefBonus = 5000;
        if (!specialBoss.status?.enhancedMode) {
          specialBoss.status.enhancedMode = true;
          specialBoss.atk = baseAtk + atkBonus;
          specialBoss.def = baseDef + defBonus;
          specialBoss.mdef = baseMdef + mdefBonus;
        }
      }
      // 房间人数超过3人时，只增加1000攻击
      else if (playersInRoom > 3) {
        atkBonus = 1000;
        defBonus = 0;
        mdefBonus = 0;
        if (specialBoss.status?.enhancedMode !== 'partial') {
          specialBoss.status.enhancedMode = 'partial';
          specialBoss.atk = baseAtk + atkBonus;
          specialBoss.def = baseDef + defBonus;
          specialBoss.mdef = baseMdef + mdefBonus;
        }
      }
      // 房间人数2-3人时，恢复基础属性
      else {
        if (specialBoss.status?.enhancedMode) {
          specialBoss.status.enhancedMode = false;
          specialBoss.atk = baseAtk;
          specialBoss.def = baseDef;
          specialBoss.mdef = baseMdef;
        }
      }
    });
  });
}

async function combatTick() {
  const online = listOnlinePlayers();

  // 更新特殊BOSS属性
  updateSpecialBossStatsBasedOnPlayers();

  for (const player of online) {
    if (player.hp <= 0) {
      handleDeath(player);
      continue;
    }

    refreshBuffs(player);
    processPotionRegen(player);
    updateRedNameAutoClear(player);
    const roomMobs = getAliveMobs(player.position.zone, player.position.room);
    roomMobs.forEach((mob) => tickMobRegen(mob));
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
      tryAutoHeal(player);
      const aggroMob = roomMobs.find((m) => m.status?.aggroTarget === player.name);
      if (aggroMob) {
        player.combat = { targetId: aggroMob.id, targetType: 'mob', skillId: null };
      }
      if (player.flags?.autoSkillId) {
        if (!player.combat) {
          const idle = roomMobs.filter((m) => !m.status?.aggroTarget);
          const pool = idle.length ? idle : roomMobs;
          const target = pool.length ? pool[randInt(0, pool.length - 1)] : null;
          if (target) {
            player.combat = { targetId: target.id, targetType: 'mob', skillId: null };
          }
        }
      }
      if (!player.combat) continue;
    }
    if (!player.flags) player.flags = {};
    player.flags.lastCombatAt = Date.now();

    tryAutoPotion(player);
    tryAutoHeal(player);

    if (player.status && player.status.stunTurns > 0) {
      player.status.stunTurns -= 1;
      player.send('你被麻痹，无法行动。');
      continue;
    }

      if (player.combat.targetType === 'player') {
        const target = online.find((p) => p.name === player.combat.targetId);
        if (!target || target.position.zone !== player.position.zone || target.position.room !== player.position.room) {
          player.combat = null;
          player.send('目标已消失。');
          continue;
        }
        if (isSabakZone(player.position.zone)) {
          const sameGuild = player.guild && target.guild && String(player.guild.id) === String(target.guild.id);
          if (sameGuild) {
            player.combat = null;
            player.send('不能攻击同一行会成员。');
            continue;
          }
        }
        const myParty = getPartyByMember(player.name);
        const sameParty = myParty && myParty.members.includes(target.name);
        if (sameParty) {
          player.combat = null;
          player.send('不能攻击同一队伍成员。');
          continue;
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
        continue;
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
          // 道士的soul技能受防御和魔御各50%影响
          if (skill.id === 'soul') {
            const defMultiplier = getDefenseMultiplier(target);
            const def = Math.floor((target.def || 0) * defMultiplier);
            dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.3 - def * 0.3);
          } else {
            dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6);
          }
          if (dmg < 1) dmg = 1;
        } else if (skill.type === 'dot') {
          const mdefMultiplier = getMagicDefenseMultiplier(target);
          const defMultiplier = getDefenseMultiplier(target);
          const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
          const def = Math.floor((target.def || 0) * defMultiplier);
          const spirit = player.spirit || 0;
          // 道术攻击受防御和魔御各50%影响
          dmg = Math.max(1, Math.floor((spirit + randInt(0, spirit / 2)) * skillPower - mdef * 0.3 - def * 0.3));
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

      // 检查攻击者的弱化效果（来自破防戒指）
      if (player.status?.debuffs?.weak) {
        const weak = player.status.debuffs.weak;
        if (weak.expiresAt && weak.expiresAt < Date.now()) {
          delete player.status.debuffs.weak;
        } else {
          dmg = Math.floor(dmg * (1 - (weak.dmgReduction || 0)));
        }
      }

        applyDamageToPlayer(target, dmg);
        target.flags.lastCombatAt = Date.now();
        player.send(`你对 ${target.name} 造成 ${dmg} 点伤害。`);
        target.send(`${player.name} 对你造成 ${dmg} 点伤害。`);
        if (skill && (skill.type === 'aoe' || skill.type === 'cleave')) {
          target.send('你受到群体技能伤害。');
        }
        if (hasComboWeapon(player) && target.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          applyDamageToPlayer(target, dmg);
          target.flags.lastCombatAt = Date.now();
          player.send(`连击触发，对 ${target.name} 造成 ${dmg} 点伤害。`);
          target.send(`${player.name} 连击对你造成 ${dmg} 点伤害。`);
        }
        if (tryApplyHealBlockEffect(player, target)) {
          target.send('你受到禁疗影响，回血降低。');
          player.send(`禁疗效果作用于 ${target.name}。`);
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
      if (skill && skill.id === 'assassinate') {
        const extraTargets = online.filter(
          (p) =>
            p.name !== player.name &&
            p.name !== target.name &&
            p.position.zone === player.position.zone &&
            p.position.room === player.position.room &&
            (!isSabakZone(player.position.zone) ||
              !(player.guild && p.guild && player.guild.id === p.guild.id))
        );
        if (extraTargets.length) {
          const extraTarget = extraTargets[randInt(0, extraTargets.length - 1)];
          const extraDmg = Math.max(1, Math.floor(dmg * ASSASSINATE_SECONDARY_DAMAGE_RATE));
          applyDamageToPlayer(extraTarget, extraDmg);
          extraTarget.flags.lastCombatAt = Date.now();
          player.send(`刺杀剑术波及 ${extraTarget.name}，造成 ${extraDmg} 点伤害。`);
          extraTarget.send(`${player.name} 的刺杀剑术波及你，造成 ${extraDmg} 点伤害。`);
          if (tryApplyHealBlockEffect(player, extraTarget)) {
            extraTarget.send('你受到禁疗影响，回血降低。');
            player.send(`禁疗效果作用于 ${extraTarget.name}。`);
          }
          if (tryApplyPoisonEffect(player, extraTarget)) {
            extraTarget.send('你中了毒特效。');
            player.send(`你的毒特效作用于 ${extraTarget.name}。`);
          }
          if (!extraTarget.combat || extraTarget.combat.targetType !== 'player' || extraTarget.combat.targetId !== player.name) {
            extraTarget.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
          }
          if (extraTarget.hp <= 0 && !tryRevive(extraTarget)) {
            const wasRed = isRedName(extraTarget);
            if (!player.flags) player.flags = {};
            if (!wasRed && !isSabakZone(player.position.zone)) {
              player.flags.pkValue = (player.flags.pkValue || 0) + 50;
              savePlayer(player);
            }
            if (isSabakZone(player.position.zone)) {
              recordSabakKill(player, extraTarget);
            }
            const droppedBag = wasRed ? transferAllInventory(extraTarget, player) : [];
            const droppedEquip = wasRed ? transferOneEquipmentChance(extraTarget, player, 0.1) : [];
            extraTarget.send('你被击败，返回了城里。');
            if (wasRed) {
              extraTarget.send('你是红名，背包物品全部掉落。');
              if (droppedEquip.length) extraTarget.send(`装备掉落: ${droppedEquip.join(', ')}`);
            }
            player.send(`你击败了 ${extraTarget.name}。`);
            if (wasRed && droppedBag.length) {
              player.send(`${extraTarget.name} 掉落了: ${droppedBag.join(', ')}`);
            }
            handleDeath(extraTarget);
          }
        }
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
      // 弱化戒指：攻击时10%几率使目标伤害降低20%，持续2秒
      if (hasEquipped(player, 'ring_teleport') && Math.random() <= 0.1) {
        if (!target.status) target.status = {};
        if (!target.status.debuffs) target.status.debuffs = {};
        target.status.debuffs.weak = { expiresAt: Date.now() + 2000, dmgReduction: 0.2 };
        player.send(`弱化戒指生效，${target.name} 伤害降低20%！`);
        target.send('你受到弱化效果，伤害降低20%！');
      }
      // 破防戒指：攻击时10%几率使目标防御魔御降低20%，持续2秒
      if (hasEquipped(player, 'ring_break') && Math.random() <= 0.1) {
        if (!target.status) target.status = {};
        if (!target.status.debuffs) target.status.debuffs = {};
        target.status.debuffs.armorBreak = { expiresAt: Date.now() + 2000, defMultiplier: 0.8 };
        player.send(`破防戒指生效，${target.name} 防御降低20%！`);
        target.send('你受到破防效果，防御和魔御降低20%！');
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
          player.flags.pkValue = (player.flags.pkValue || 0) + 50;
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
      await sendState(player);
      await sendState(target);
      continue;
    }

    const mobs = roomMobs;
    const mob = roomMobs.find((m) => m.id === player.combat.targetId);
    if (!mob) {
      player.combat = null;
      player.send('目标已消失。');
      continue;
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
          // AOE伤害应该对每个目标独立计算，而不是使用主目标的伤害
          const mdefMultiplier = getMagicDefenseMultiplier(target);
          const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
          const powerStat = skill.id === 'soul' ? (player.spirit || 0) : (player.mag || 0);
          const aoeDmg = Math.max(1, Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6));
          const result = applyDamageToMob(target, aoeDmg, player.name);
          if (result?.damageTaken) {
            player.send(`你对 ${target.name} 造成 ${aoeDmg} 点伤害。`);
          }
          if (tryApplyHealBlockEffect(player, target)) {
            player.send(`禁疗效果作用于 ${target.name}。`);
          }
          if (target.id !== mob.id) {
            retaliateMobAgainstPlayer(target, player, online);
          }
        });
        player.send(`你施放了 ${skill.name}，造成范围伤害。`);
        const deadTargets = mobs.filter((target) => target.hp <= 0);
        if (deadTargets.length) {
          deadTargets.forEach((target) => processMobDeath(player, target, online));
          if (deadTargets.some((target) => target.id === mob.id)) {
            player.combat = null;
          }
          sendRoomState(player.position.zone, player.position.room);
          continue;
        }
        sendRoomState(player.position.zone, player.position.room);
      } else {
        const result = applyDamageToMob(mob, dmg, player.name);
        if (result?.damageTaken) {
          player.send(`你对 ${mob.name} 造成 ${dmg} 点伤害。`);
        }
        if (hasComboWeapon(player) && mob.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          const comboResult = applyDamageToMob(mob, dmg, player.name);
          if (comboResult?.damageTaken) {
            player.send(`连击触发，对 ${mob.name} 造成 ${dmg} 点伤害。`);
          }
        }
        if (tryApplyHealBlockEffect(player, mob)) {
          player.send(`禁疗效果作用于 ${mob.name}。`);
        }
        if (skill && skill.id === 'assassinate') {
          const extraTargets = mobs.filter((m) => m.id !== mob.id);
          if (extraTargets.length) {
            const extraTarget = extraTargets[randInt(0, extraTargets.length - 1)];
          const extraDmg = Math.max(1, Math.floor(dmg * ASSASSINATE_SECONDARY_DAMAGE_RATE));
          const extraResult = applyDamageToMob(extraTarget, extraDmg, player.name);
          if (extraResult?.damageTaken) {
            player.send(`刺杀剑术波及 ${extraTarget.name}，造成 ${extraDmg} 点伤害。`);
          }
            if (tryApplyHealBlockEffect(player, extraTarget)) {
              player.send(`禁疗效果作用于 ${extraTarget.name}。`);
            }
            if (tryApplyPoisonEffect(player, extraTarget)) {
              player.send(`你的毒特效作用于 ${extraTarget.name}。`);
            }
            if (extraTarget.hp <= 0) {
              processMobDeath(player, extraTarget, online);
            }
          }
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
      // 弱化戒指：攻击时10%几率使目标伤害降低20%，持续2秒
      if (hasEquipped(player, 'ring_teleport') && Math.random() <= 0.1) {
        if (!mob.status) mob.status = {};
        if (!mob.status.debuffs) mob.status.debuffs = {};
        mob.status.debuffs.weak = { expiresAt: Date.now() + 2000, dmgReduction: 0.2 };
        player.send(`弱化戒指生效，${mob.name} 伤害降低20%！`);
      }
      // 破防戒指：攻击时10%几率使目标防御魔御降低20%，持续2秒
      if (hasEquipped(player, 'ring_break') && Math.random() <= 0.1) {
        if (!mob.status) mob.status = {};
        if (!mob.status.debuffs) mob.status.debuffs = {};
        mob.status.debuffs.armorBreak = { expiresAt: Date.now() + 2000, defMultiplier: 0.8 };
        player.send(`破防戒指生效，${mob.name} 防御降低20%！`);
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
          // cleave伤害基于玩家攻击力的30%，而不是主目标受伤的30%
          const cleaveBaseDmg = Math.floor(player.atk * 0.3 * skillPower);
          const cleaveDmg = Math.max(1, Math.floor(calcDamage(player, other, 0.3 * skillPower)));
          const cleaveResult = applyDamageToMob(other, cleaveDmg, player.name);
          if (cleaveResult?.damageTaken) {
            player.send(`你对 ${other.name} 造成 ${cleaveDmg} 点伤害。`);
          }
          retaliateMobAgainstPlayer(other, player, online);
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
        const summonResult = applyDamageToMob(mob, dmg, player.name);
        if (summonResult?.damageTaken) {
          player.send(`${summon.name} 对 ${mob.name} 造成 ${dmg} 点伤害。`);
        }
      }
    }

    if (mob.hp <= 0) {
      processMobDeath(player, mob, online);
      player.combat = null;
      sendRoomState(player.position.zone, player.position.room);
      continue;
    }

    if (mob.status && mob.status.stunTurns > 0) {
      player.send(`${mob.name} 被麻痹，无法行动。`);
      continue;
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
        continue;
      }
      let dmg = calcDamage(mob, mobTarget, 1);
      if (mobTemplate && isBossMob(mobTemplate)) {
        const magicBase = Math.floor(mob.atk * 0.3);
        const spiritBase = Math.floor(mob.atk * 0.3);
        dmg += calcMagicDamageFromValue(magicBase, mobTarget);
        dmg += calcMagicDamageFromValue(spiritBase, mobTarget);
      }
      // 特殊BOSS麻痹效果：魔龙教主、世界BOSS、沙巴克BOSS、暗之BOSS攻击时有20%几率麻痹目标2回合
      const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
      if (isSpecialBoss && Math.random() <= 0.2) {
        if (!mob.status) mob.status = {};
        if (!mobTarget.status) mobTarget.status = {};
        mobTarget.status.stunTurns = 2;
        if (mobTarget.userId) {
          mobTarget.send(`你被 ${mob.name} 麻痹了，无法行动2回合。`);
          if (mobTarget !== player) {
            player.send(`${mob.name} 麻痹了 ${mobTarget.name}。`);
          }
        } else {
          player.send(`${mob.name} 麻痹了 ${mobTarget.name}。`);
        }
      }
      // 特殊BOSS破防效果：魔龙教主、世界BOSS、沙巴克BOSS攻击时有20%几率破防，降低目标50%防御/魔御持续3秒
      if (isSpecialBoss && Math.random() <= 0.2) {
        if (!mobTarget.status) mobTarget.status = {};
        if (!mobTarget.status.debuffs) mobTarget.status.debuffs = {};
        const now = Date.now();
        mobTarget.status.debuffs.armorBreak = {
          defMultiplier: 0.5,
          expiresAt: now + 3000
        };
        if (mobTarget.userId) {
          mobTarget.send(`${mob.name} 破防攻击！你的防御和魔御降低50%，持续3秒。`);
          if (mobTarget !== player) {
            player.send(`${mob.name} 对 ${mobTarget.name} 造成破防效果！`);
          }
        } else {
          player.send(`${mob.name} 对 ${mobTarget.name} 造成破防效果！`);
        }
      }
      
      // 特殊BOSS毒伤害效果：20%几率使目标持续掉血，每秒掉1%气血，持续5秒
      if (isSpecialBoss && Math.random() <= 0.2) {
        if (!mobTarget.status) mobTarget.status = {};
        const maxHp = Math.max(1, mobTarget.max_hp || 1);
        const tickDmg = Math.max(1, Math.floor(maxHp * 0.01));
        applyPoison(mobTarget, 5, tickDmg, mob.name);
        if (mobTarget.userId) {
          mobTarget.send(`${mob.name} 的毒性攻击！你将每秒损失1%气血，持续5秒。`);
          if (mobTarget !== player) {
            player.send(`${mob.name} 对 ${mobTarget.name} 造成毒性伤害！`);
          }
        } else {
          player.send(`${mob.name} 对 ${mobTarget.name} 造成毒性伤害！`);
        }
      }
      // 特殊BOSS暴击效果：魔龙教主、世界BOSS、沙巴克BOSS攻击时有15%几率造成2倍暴击伤害
      if (isSpecialBoss && Math.random() <= 0.15) {
        dmg = Math.floor(dmg * 2);
        if (mobTarget.userId) {
          mobTarget.send(`${mob.name} 的暴击！对你造成 ${dmg} 点伤害。`);
          if (mobTarget !== player) {
            player.send(`${mob.name} 对 ${mobTarget.name} 暴击！造成 ${dmg} 点伤害。`);
          }
        } else {
          player.send(`${mob.name} 对 ${mobTarget.name} 暴击！造成 ${dmg} 点伤害。`);
        }
      }
      if (mobTarget && mobTarget.userId) {
        applyDamageToPlayer(mobTarget, dmg);
        mobTarget.send(`${mob.name} 对你造成 ${dmg} 点伤害。`);
        if (mobTarget !== player) {
          player.send(`${mob.name} 攻击 ${mobTarget.name}，造成 ${dmg} 点伤害。`);
        }
        if (mobTarget.hp <= 0 && mobTarget !== player && !tryRevive(mobTarget)) {
          handleDeath(mobTarget);
        }
        
        // 特殊BOSS溅射效果：对房间所有其他玩家和召唤物造成BOSS攻击力50%的溅射伤害
        if (isSpecialBoss && online && online.length > 0) {
          const splashDmg = Math.floor(mob.atk * 0.5);
          const roomPlayers = online.filter((p) => 
            p.name !== mobTarget.name &&
            p.position.zone === player.position.zone &&
            p.position.room === player.position.room &&
            p.hp > 0
          );
          
          roomPlayers.forEach((splashTarget) => {
            applyDamageToPlayer(splashTarget, splashDmg);
            splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDmg} 点伤害。`);
            if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
              handleDeath(splashTarget);
            }
            
            // 溅射到召唤物
            if (splashTarget.summon && splashTarget.summon.hp > 0) {
              applyDamage(splashTarget.summon, splashDmg);
              splashTarget.send(`${mob.name} 的攻击溅射到 ${splashTarget.summon.name}，造成 ${splashDmg} 点伤害。`);
              if (splashTarget.summon.hp <= 0) {
                splashTarget.send(`${splashTarget.summon.name} 被击败。`);
                splashTarget.summon = null;
                autoResummon(splashTarget);
              }
            }
          });
          
          // 溅射到主目标的召唤物（如果主目标是玩家且有召唤物）
          if (mobTarget.summon && mobTarget.summon.hp > 0 && mobTarget !== mobTarget.summon) {
            applyDamage(mobTarget.summon, splashDmg);
            mobTarget.send(`${mob.name} 的攻击溅射到 ${mobTarget.summon.name}，造成 ${splashDmg} 点伤害。`);
            if (mobTarget.summon.hp <= 0) {
              mobTarget.send(`${mobTarget.summon.name} 被击败。`);
              mobTarget.summon = null;
              autoResummon(mobTarget);
            }
          }
        }
      } else {
        applyDamage(mobTarget, dmg);
        player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
        
        // 特殊BOSS溅射效果：主目标是召唤物时，对玩家和房间所有其他玩家及召唤物造成BOSS攻击力50%的溅射伤害
        if (isSpecialBoss && online && online.length > 0) {
          const splashDmg = Math.floor(mob.atk * 0.5);
          
          // 溅射到召唤物的主人
          if (player && player.hp > 0) {
            applyDamageToPlayer(player, splashDmg);
            player.send(`${mob.name} 的攻击溅射到你，造成 ${splashDmg} 点伤害。`);
            if (player.hp <= 0 && !tryRevive(player)) {
              handleDeath(player);
            }
          }
          
          // 溅射到房间所有其他玩家和召唤物
          const roomPlayers = online.filter((p) => 
            p.name !== player.name &&
            p.position.zone === player.position.zone &&
            p.position.room === player.position.room &&
            p.hp > 0
          );
          
          roomPlayers.forEach((splashTarget) => {
            applyDamageToPlayer(splashTarget, splashDmg);
            splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDmg} 点伤害。`);
            if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
              handleDeath(splashTarget);
            }
            
            // 溅射到其他玩家的召唤物
            if (splashTarget.summon && splashTarget.summon.hp > 0) {
              applyDamage(splashTarget.summon, splashDmg);
              splashTarget.send(`${mob.name} 的攻击溅射到 ${splashTarget.summon.name}，造成 ${splashDmg} 点伤害。`);
              if (splashTarget.summon.hp <= 0) {
                splashTarget.send(`${splashTarget.summon.name} 被击败。`);
                splashTarget.summon = null;
                autoResummon(splashTarget);
              }
            }
          });
        }
        
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
    await sendState(player);
    savePlayer(player);
  }
}

setInterval(combatTick, 1000);

async function sabakTick() {
  const now = Date.now();
  const nowDate = new Date(now);

  // 自动开始攻城战
  if (!sabakState.active && isSabakActive(nowDate) && sabakState.ownerGuildId) {
    // 检查是否有行会报名
    const registrations = await listSabakRegistrations();
    const today = new Date();
    const todayRegistrations = registrations.filter(r => {
      if (!r.registered_at) return false;
      const regDate = new Date(r.registered_at);
      return regDate.toDateString() === today.toDateString();
    });

    if (todayRegistrations.length === 0) {
      // 没有行会报名，直接判定守城方胜利
      emitAnnouncement('今日无行会报名攻城，守城方自动获胜！', 'announce');
    } else {
      // 有行会报名，正常开始攻城战
      startSabakSiege(null);
    }
  }

  // 检查皇宫占领情况（仅攻城战期间）
  if (sabakState.active && isSabakActive(nowDate)) {
    const palacePlayers = listOnlinePlayers().filter(p =>
      isSabakPalace(p.position.zone, p.position.room) && p.guild
    );

    // 检查是否只有一方行会在皇宫内
    const ownerGuildId = sabakState.ownerGuildId;
    const attackerGuilds = Object.keys(sabakState.killStats || {}).filter(id => id !== String(ownerGuildId));

    let controllingGuildId = null;
    let controllingGuildName = null;

    // 如果皇宫内只有守城方成员
    if (palacePlayers.length > 0 && palacePlayers.every(p => String(p.guild.id) === String(ownerGuildId))) {
      controllingGuildId = ownerGuildId;
      controllingGuildName = sabakState.ownerGuildName;
    }
    // 如果皇宫内只有攻城方成员（同一行会）
    else if (palacePlayers.length > 0) {
      const firstGuildId = String(palacePlayers[0].guild.id);
      if (firstGuildId !== String(ownerGuildId) && palacePlayers.every(p => String(p.guild.id) === firstGuildId)) {
        controllingGuildId = firstGuildId;
        controllingGuildName = palacePlayers[0].guild.name;
      }
    }

    // 如果控制行会发生了变化，重置占领计时
    if (controllingGuildId !== sabakState.captureGuildId) {
      sabakState.captureGuildId = controllingGuildId;
      sabakState.captureGuildName = controllingGuildName;
      sabakState.captureStart = controllingGuildId ? now : null;
      if (controllingGuildId) {
        emitAnnouncement(`${controllingGuildName} 开始占领沙城皇宫！`, 'announce');
      }
    }

    // 检查是否占领满5分钟
    if (sabakState.captureGuildId && sabakState.captureStart) {
      const captureDuration = now - sabakState.captureStart;
      const captureMinutes = captureDuration / 60000;
      const占领所需分钟 = 5;

      if (captureDuration >= 占领所需分钟 * 60 * 1000) {
        // 占领成功，立即结束攻城
        sabakState.ownerGuildId = sabakState.captureGuildId;
        sabakState.ownerGuildName = sabakState.captureGuildName;
        await setSabakOwner(sabakState.captureGuildId, sabakState.captureGuildName);
        emitAnnouncement(`${sabakState.captureGuildName} 占领沙城皇宫5分钟，成功夺取沙巴克！`, 'announce');
        sabakState.active = false;
        sabakState.siegeEndsAt = null;
        sabakState.captureGuildId = null;
        sabakState.captureGuildName = null;
        sabakState.captureStart = null;
        sabakState.killStats = {};
      } else if (Math.floor(captureDuration / 1000) % 30 === 0 && captureDuration > 0) {
        // 每30秒提醒一次占领时间
        const remainingMinutes = Math.ceil((占领所需分钟 * 60 * 1000 - captureDuration) / 60000);
        emitAnnouncement(`${sabakState.captureGuildName} 已占领沙城皇宫 ${Math.floor(captureMinutes)} 分钟，还需 ${remainingMinutes} 分钟即可获胜。`, 'announce');
      }
    }
  }

  // 结束攻城战
  if (sabakState.active) {
    if (!isSabakActive(nowDate) || (sabakState.siegeEndsAt && now >= sabakState.siegeEndsAt)) {
      await finishSabakSiege();
    }
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
  try {
    const result = await cleanupInvalidItems();
    console.log(
      `Cleaned items: checked=${result.checked}, updated=${result.updated}, removed=${result.removedSlots}, clearedEquip=${result.clearedEquip}`
    );
  } catch (err) {
    console.warn('Failed to cleanup invalid items on startup.');
    console.warn(err);
  }
  await loadSabakState();
  checkMobRespawn();
  setInterval(() => checkMobRespawn(), 5000);
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
