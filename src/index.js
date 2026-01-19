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
import { newCharacter, computeDerived, gainExp } from './game/player.js';
import { handleCommand, awardKill } from './game/commands.js';
import { SKILLS } from './game/skills.js';
import { MOB_TEMPLATES } from './game/mobs.js';
import { ITEM_TEMPLATES } from './game/items.js';
import { WORLD } from './game/world.js';
import { getRoomMobs, spawnMobs, removeMob } from './game/state.js';
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

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
const RARITY_NORMAL = {
  legendary: 0.001,
  epic: 0.005,
  rare: 0.02,
  uncommon: 0.06,
  common: 0.15
};
const RARITY_BOSS = {
  legendary: 0.005,
  epic: 0.02,
  rare: 0.06,
  uncommon: 0.15,
  common: 0.3
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

function isBossMob(mobTemplate) {
  const id = mobTemplate.id;
  return (
    id.includes('leader') ||
    id.includes('boss') ||
    id.includes('demon') ||
    ['bug_queen', 'huangquan', 'evil_snake', 'pig_white'].includes(id)
  );
}

function rollRarityDrop(mobTemplate) {
  const table = isBossMob(mobTemplate) ? RARITY_BOSS : RARITY_NORMAL;
  for (const rarity of RARITY_ORDER) {
    if (Math.random() <= table[rarity]) {
      const pool = ITEM_POOLS[rarity];
      if (!pool.length) return null;
      return pool[randInt(0, pool.length - 1)];
    }
  }
  return null;
}

function dropLoot(player, mobTemplate) {
  const loot = [];
  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      if (Math.random() <= drop.chance) loot.push(drop.id);
    });
  }
  const rarityDrop = rollRarityDrop(mobTemplate);
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

function partyMembersInRoom(party, playersList, zone, room) {
  return party.members
    .map((name) => playersList.find((p) => p.name === name))
    .filter((p) => p && p.position.zone === zone && p.position.room === room);
}

function distributeLoot(party, partyMembers, drops) {
  if (!drops.length || !party || partyMembers.length === 0) return;
  drops.forEach((itemId) => {
    const targetName = party.members[party.lootIndex % party.members.length];
    party.lootIndex += 1;
    const target = partyMembers.find((p) => p.name === targetName) || partyMembers[0];
    target.inventory.push({ id: itemId, qty: 1 });
    target.send(`队伍分配获得: ${ITEM_TEMPLATES[itemId].name}`);
  });
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
  const mobs = getRoomMobs(player.position.zone, player.position.room).map((m) => ({
    id: m.id,
    name: m.name,
    hp: m.hp,
    max_hp: m.max_hp
  }));
  const exits = room ? Object.keys(room.exits).map((dir) => ({ dir })) : [];
  const skills = Object.values(SKILLS[player.classId] || {}).map((s) => ({
    id: s.id,
    name: s.name,
    mp: s.mp,
    type: s.type
  }));
  const items = player.inventory.map((i) => {
    const item = ITEM_TEMPLATES[i.id] || { id: i.id, name: i.id, type: 'unknown' };
    return { id: i.id, name: item.name, qty: i.qty, type: item.type, slot: item.slot || null };
  });
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
      pk: player.flags?.pkValue || 0,
      vip: Boolean(player.flags?.vip)
    },
    guild: player.guild?.name || null
  };
}

function sendState(player) {
  if (!player.socket) return;
  player.socket.emit('state', buildState(player));
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
      removeFromParty(player.name);
      await savePlayer(player);
      players.delete(socket.id);
    }
  });
});

function skillForPlayer(player, skillId) {
  const skills = SKILLS[player.classId] || {};
  return skills[skillId] || skills.slash || skills.fireball || skills.soul || null;
}

function handleDeath(player) {
  player.hp = Math.floor(player.max_hp * 0.5);
  player.mp = Math.floor(player.max_mp * 0.3);
  player.position = { zone: 'bq_town', room: 'gate' };
  player.combat = null;
  player.send('你被击败，返回了城里。');
}

function combatTick() {
  const online = listOnlinePlayers();
  online.forEach((player) => {
    if (player.hp <= 0) {
      handleDeath(player);
      return;
    }

    if (!player.combat) return;

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

    let chosenSkillId = player.combat.skillId;
    if (!chosenSkillId && player.flags?.autoSkillId) {
      chosenSkillId = player.flags.autoSkillId;
    }
    const skill = skillForPlayer(player, chosenSkillId || 'slash');
    if (skill && player.mp < skill.mp) {
      chosenSkillId = 'slash';
    }

    const hitChance = calcHitChance(player, target);
    if (Math.random() <= hitChance) {
      let dmg = 0;
      if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave')) {
        const power = skill.power || 1;
        dmg = skill.type === 'spell'
          ? Math.floor((player.mag + randInt(0, player.mag / 2)) * power)
          : calcDamage(player, target, power);
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
      } else {
        dmg = calcDamage(player, target, 1);
      }

      applyDamageToPlayer(target, dmg);
      player.send(`你对 ${target.name} 造成 ${dmg} 点伤害。`);
      target.send(`${player.name} 对你造成 ${dmg} 点伤害。`);
      if (!target.combat) {
        target.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
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
      }

      if (target.hp <= 0 && !tryRevive(target)) {
        const wasRed = isRedName(target);
        if (!player.flags) player.flags = {};
        if (!wasRed) player.flags.pkValue = (player.flags.pkValue || 0) + 100;
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

    const mobs = getRoomMobs(player.position.zone, player.position.room);
    const mob = mobs.find((m) => m.id === player.combat.targetId);
    if (!mob) {
      player.combat = null;
      player.send('目标已消失。');
      return;
    }

    if (mob.status && mob.status.stunTurns > 0) {
      mob.status.stunTurns -= 1;
    }
    let chosenSkillId = player.combat.skillId;
    if (!chosenSkillId && player.flags?.autoSkillId) {
      chosenSkillId = player.flags.autoSkillId;
    }
    const skill = skillForPlayer(player, chosenSkillId || 'slash');
    if (skill && player.mp < skill.mp) {
      player.send('魔法不足，改用普通攻击。');
      player.combat.skillId = 'slash';
      chosenSkillId = 'slash';
    }

    const hitChance = calcHitChance(player, mob);
      if (Math.random() <= hitChance) {
        let power = 1;
        let dmg = 0;
      if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave')) {
        power = skill.power || 1;
        dmg = skill.type === 'spell'
          ? Math.floor((player.mag + randInt(0, player.mag / 2)) * power)
          : calcDamage(player, mob, power);
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
      } else {
        dmg = calcDamage(player, mob, 1);
      }

      applyDamage(mob, dmg);
      player.send(`你对 ${mob.name} 造成 ${dmg} 点伤害。`);
      if (hasEquipped(player, 'ring_magic') && Math.random() <= 0.1) {
        if (!mob.status) mob.status = {};
        mob.status.stunTurns = 2;
        player.send(`${mob.name} 被麻痹戒指定身。`);
      }
      if (skill && skill.type === 'dot') {
        applyPoison(mob, 4, Math.max(2, Math.floor(player.mag * 0.3)));
      }
      if (skill && skill.type === 'cleave') {
        mobs.filter((m) => m.id !== mob.id).forEach((other) => {
          applyDamage(other, Math.floor(dmg * 0.5));
        });
      }
    } else {
      player.send(`${mob.name} 躲过了你的攻击。`);
    }

    const statusTick = tickStatus(mob);
    if (statusTick && statusTick.type === 'poison') {
      player.send(`${mob.name} 受到 ${statusTick.dmg} 点中毒伤害。`);
    }

    if (mob.hp <= 0) {
      const template = MOB_TEMPLATES[mob.templateId];
      removeMob(player.position.zone, player.position.room, mob.id);
      const exp = template.exp;
      const gold = randInt(template.gold[0], template.gold[1]);

      const party = getPartyByMember(player.name);
      const partyMembers = party ? partyMembersInRoom(party, online, player.position.zone, player.position.room) : [player];
      const eligibleCount = partyMembers.length || 1;
      const bonus = eligibleCount > 1 ? Math.min(0.2 * eligibleCount, 1.0) : 0;
      const totalExp = Math.floor(exp * (1 + bonus));
      const totalGold = Math.floor(gold * (1 + bonus));
      const shareExp = Math.floor(totalExp / eligibleCount);
      const shareGold = Math.floor(totalGold / eligibleCount);

      partyMembers.forEach((member) => {
        member.gold += shareGold;
        const leveled = gainExp(member, shareExp);
        awardKill(member, mob.templateId);
        member.send(`队伍分配: 获得 ${shareExp} 经验和 ${shareGold} 金币。`);
        if (leveled) member.send('你升级了！');
      });

      const drops = dropLoot(player, template);
      if (drops.length) {
        if (party && partyMembers.length > 1) {
          distributeLoot(party, partyMembers, drops);
        } else {
          drops.forEach((id) => {
            player.inventory.push({ id, qty: 1 });
          });
          player.send(`掉落: ${drops.map((id) => ITEM_TEMPLATES[id].name).join(', ')}`);
        }
      }
      player.combat = null;
      sendState(player);
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
    io.emit('output', { text: '沙巴克攻城战开始！' });
  }
  if (!active && sabakState.active) {
    sabakState.active = false;
    sabakState.captureGuildId = null;
    sabakState.captureGuildName = null;
    sabakState.captureStart = null;
    await clearSabakRegistrations();
    io.emit('output', { text: '沙巴克攻城战结束。' });
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
    io.emit('output', { text: `沙巴克皇宫被 ${guildName} 占领，计时开始。` });
    return;
  }

  const elapsedMin = (Date.now() - sabakState.captureStart) / 60000;
  if (elapsedMin >= sabakConfig.captureMinutes) {
    sabakState.ownerGuildId = guildId;
    sabakState.ownerGuildName = guildName;
    await setSabakOwner(guildId, guildName);
    io.emit('output', { text: `沙巴克被 ${guildName} 占领！` });
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
