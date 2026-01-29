import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import crypto from 'node:crypto';

import config from './config.js';
import knex from './db/index.js';
import { createUser, verifyUser, createSession, getSession, getUserByName, setAdminFlag, verifyUserPassword, updateUserPassword, clearUserSessions, clearAllSessions } from './db/users.js';
import { listCharacters, loadCharacter, saveCharacter, findCharacterByName, findCharacterByNameInRealm, listAllCharacters } from './db/characters.js';
import { addGuildMember, createGuild, getGuildByName, getGuildByNameInRealm, getGuildMember, getSabakOwner, isGuildLeader, isGuildLeaderOrVice, setGuildMemberRole, listGuildMembers, listSabakRegistrations, registerSabak, removeGuildMember, leaveGuild, setSabakOwner, clearSabakRegistrations, transferGuildLeader, ensureSabakState, applyToGuild, listGuildApplications, removeGuildApplication, approveGuildApplication, getApplicationByUser, listAllGuilds } from './db/guilds.js';
import { createAdminSession, listUsers, verifyAdminSession, deleteUser } from './db/admin.js';
import { sendMail, listMail, listSentMail, markMailRead, markMailClaimed, deleteMail } from './db/mail.js';
import { createVipCodes, listVipCodes, useVipCode } from './db/vip.js';
import { getVipSelfClaimEnabled, setVipSelfClaimEnabled, getLootLogEnabled, setLootLogEnabled, getStateThrottleEnabled, setStateThrottleEnabled, getStateThrottleIntervalSec, setStateThrottleIntervalSec, getStateThrottleOverrideServerAllowed, setStateThrottleOverrideServerAllowed, getConsignExpireHours, setConsignExpireHours, getRoomVariantCount, setRoomVariantCount, canUserClaimVip, incrementCharacterVipClaimCount, getWorldBossKillCount, setWorldBossKillCount, getWorldBossDropBonus, setWorldBossDropBonus, getWorldBossBaseHp, setWorldBossBaseHp, getWorldBossBaseAtk, setWorldBossBaseAtk, getWorldBossBaseDef, setWorldBossBaseDef, getWorldBossBaseMdef, setWorldBossBaseMdef, getWorldBossBaseExp, setWorldBossBaseExp, getWorldBossBaseGold, setWorldBossBaseGold, getWorldBossPlayerBonusConfig, setWorldBossPlayerBonusConfig, getClassLevelBonusConfig, setClassLevelBonusConfig, getSpecialBossDropBonus, setSpecialBossDropBonus, getSpecialBossBaseHp, setSpecialBossBaseHp, getSpecialBossBaseAtk, setSpecialBossBaseAtk, getSpecialBossBaseDef, setSpecialBossBaseDef, getSpecialBossBaseMdef, setSpecialBossBaseMdef, getSpecialBossBaseExp, setSpecialBossBaseExp, getSpecialBossBaseGold, setSpecialBossBaseGold, getSpecialBossPlayerBonusConfig, setSpecialBossPlayerBonusConfig } from './db/settings.js';
import { listRealms, getRealmById, updateRealmName, createRealm } from './db/realms.js';
import { listMobRespawns, upsertMobRespawn, clearMobRespawn, saveMobState } from './db/mobs.js';
import {
  listConsignments,
  listConsignmentsBySeller,
  listExpiredConsignments,
  getConsignment,
  createConsignment,
  updateConsignmentQty,
  deleteConsignment
} from './db/consignments.js';
import {
  listConsignmentHistory,
  createConsignmentHistory
} from './db/consignment_history.js';
import { listAllSponsors, addSponsor, updateSponsor, deleteSponsor, getSponsorById, updateSponsorCustomTitle, getSponsorByPlayerName } from './db/sponsors.js';
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
import { WORLD, expandRoomVariants, shrinkRoomVariants } from './game/world.js';
import { getRoomMobs, getAliveMobs, spawnMobs, removeMob, seedRespawnCache, setRespawnStore, getAllAliveMobs, incrementWorldBossKills, setWorldBossKillCount as setWorldBossKillCountState } from './game/state.js';
import { calcHitChance, calcDamage, applyDamage, applyPoison, tickStatus, getDefenseMultiplier } from './game/combat.js';
import { randInt, clamp } from './game/utils.js';
import { expForLevel, setRoomVariantCount as applyRoomVariantCount } from './game/constants.js';
import { setAllClassLevelBonusConfigs } from './game/settings.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 20000,
  pingTimeout: 60000
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const captchaStore = new Map();

function getSummons(player) {
  if (!player) return [];
  const list = [];
  if (Array.isArray(player.summons)) {
    list.push(...player.summons.filter(Boolean));
  }
  if (player.summon) {
    list.push(player.summon);
  }
  if (!list.length) return [];
  const seen = new Set();
  return list.filter((summon) => {
    if (!summon || seen.has(summon.id)) return false;
    seen.add(summon.id);
    return true;
  });
}

function setSummons(player, summons) {
  if (!player) return;
  const next = Array.isArray(summons) ? summons.filter(Boolean) : [];
  player.summons = next;
  player.summon = next[0] || null;
}

function getAliveSummons(player) {
  return getSummons(player).filter((summon) => summon.hp > 0);
}

function getPrimarySummon(player) {
  return getAliveSummons(player)[0] || null;
}

function addOrReplaceSummon(player, summon) {
  if (!player || !summon) return;
  const summons = getSummons(player).filter((entry) => entry.id !== summon.id);
  summons.unshift(summon);
  setSummons(player, summons);
}

function removeSummonById(player, summonId) {
  if (!player || !summonId) return;
  const summons = getSummons(player).filter((entry) => entry.id !== summonId);
  setSummons(player, summons);
}

function hasAliveSummon(player, summonId) {
  return getAliveSummons(player).some((entry) => entry.id === summonId);
}

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

async function resolveRealmId(rawRealmId) {
  const realmId = Math.max(1, Math.floor(Number(rawRealmId) || 1));
  const realm = await getRealmById(realmId);
  if (!realm) {
    return { error: '新区不存在。', realmId: null };
  }
  return { realmId };
}

app.get('/api/captcha', (req, res) => {
  cleanupCaptchas();
  const payload = generateCaptcha();
  res.json({ ok: true, token: payload.token, svg: payload.svg });
});

app.get('/api/realms', async (req, res) => {
  const realms = await refreshRealmCache();
  res.json({ ok: true, count: realms.length, realms });
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
  const { username, password, captchaToken, captchaCode, realmId: rawRealmId } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  if (!verifyCaptcha(captchaToken, captchaCode)) {
    return res.status(400).json({ error: '验证码错误。' });
  }
  let realmInfo = await resolveRealmId(rawRealmId);
  // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  const user = await verifyUser(username, password);
  if (!user) return res.status(401).json({ error: '账号或密码错误。' });
  const token = await createSession(user.id);
  const chars = await listCharacters(user.id, realmInfo.realmId);
  res.json({ ok: true, token, characters: chars, realmId: realmInfo.realmId });
});

app.post('/api/password', async (req, res) => {
  const { token, oldPassword, newPassword } = req.body || {};
  if (!token) return res.status(401).json({ error: '登录已过期。' });
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '旧密码或新密码缺失。' });
  if (String(newPassword).length < 4) return res.status(400).json({ error: '密码至少4位。' });
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  const ok = await verifyUserPassword(session.user_id, String(oldPassword));
  if (!ok) return res.status(400).json({ error: '旧密码错误。' });
  await updateUserPassword(session.user_id, String(newPassword));
  await clearUserSessions(session.user_id);
  res.json({ ok: true });
});

app.post('/api/character', async (req, res) => {
  const { token, name, classId, realmId: rawRealmId } = req.body || {};
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  let realmInfo = await resolveRealmId(rawRealmId);
  // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  if (!name || !classId) return res.status(400).json({ error: '角色名或职业缺失。' });
  const existing = await findCharacterByName(name);
  if (existing) return res.status(400).json({ error: '角色名已存在。' });

  const player = newCharacter(name, classId);
  player.realmId = realmInfo.realmId;
  computeDerived(player);
  await saveCharacter(session.user_id, player, realmInfo.realmId);
  res.json({ ok: true });
});

app.get('/api/characters', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  let realmInfo = await resolveRealmId(req.query.realmId);
  // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  const chars = await listCharacters(session.user_id, realmInfo.realmId);
  res.json({ ok: true, characters: chars, realmId: realmInfo.realmId });
});

app.get('/api/mail', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  let realmInfo = await resolveRealmId(req.query.realmId);
  // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  const mails = await listMail(session.user_id, realmInfo.realmId);
  res.json({ ok: true, mails: mails.map(buildMailPayload) });
});

app.post('/api/mail/read', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  const { mailId } = req.body || {};
  let realmInfo = await resolveRealmId(req.body?.realmId);
  // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  await markMailRead(session.user_id, mailId, realmInfo.realmId);
  res.json({ ok: true });
});

async function requireAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  return verifyAdminSession(token);
}

const BACKUP_TABLES = [
  'realms',
  'users',
  'sessions',
  'characters',
  'guilds',
  'guild_members',
  'sabak_state',
  'sabak_registrations',
  'mails',
  'vip_codes',
  'game_settings',
  'mob_respawns',
  'consignments',
  'consignment_history'
];

function normalizeBackupTables(payload) {
  if (!payload) return null;
  if (payload.tables && typeof payload.tables === 'object') return payload.tables;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  if (typeof payload === 'object') return payload;
  return null;
}

function chunkArray(rows, size) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
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
  const search = String(req.query.search || '');
  const result = await listUsers(page, limit, search);
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

app.post('/admin/users/password', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '缺少用户名或密码。' });
  if (String(password).length < 4) return res.status(400).json({ error: '密码至少4位。' });
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });
  await updateUserPassword(user.id, String(password));
  await clearUserSessions(user.id);
  res.json({ ok: true });
});

app.post('/admin/characters/cleanup', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const result = await cleanupInvalidItems();
  res.json({ ok: true, ...result });
});

app.get('/admin/worldboss-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const dropBonus = await getWorldBossDropBonus();
  const baseHp = await getWorldBossBaseHp();
  const baseAtk = await getWorldBossBaseAtk();
  const baseDef = await getWorldBossBaseDef();
  const baseMdef = await getWorldBossBaseMdef();
  const baseExp = await getWorldBossBaseExp();
  const baseGold = await getWorldBossBaseGold();
  const playerBonusConfig = await getWorldBossPlayerBonusConfig();
  res.json({
    ok: true,
    dropBonus,
    baseHp,
    baseAtk,
    baseDef,
    baseMdef,
    baseExp,
    baseGold,
    playerBonusConfig
  });
});

app.post('/admin/worldboss-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { dropBonus, baseHp, baseAtk, baseDef, baseMdef, baseExp, baseGold, playerBonusConfig } = req.body || {};

  if (dropBonus !== undefined) {
    await setWorldBossDropBonus(Math.max(1, Math.floor(Number(dropBonus) || 1.5)));
  }
  if (baseHp !== undefined) {
    await setWorldBossBaseHp(Math.max(1, Math.floor(Number(baseHp) || 600000)));
  }
  if (baseAtk !== undefined) {
    await setWorldBossBaseAtk(Math.max(1, Math.floor(Number(baseAtk) || 180)));
  }
  if (baseDef !== undefined) {
    await setWorldBossBaseDef(Math.max(1, Math.floor(Number(baseDef) || 210)));
  }
  if (baseMdef !== undefined) {
    await setWorldBossBaseMdef(Math.max(1, Math.floor(Number(baseMdef) || 210)));
  }
  if (baseExp !== undefined) {
    await setWorldBossBaseExp(Math.max(1, Math.floor(Number(baseExp) || 9000)));
  }
  if (baseGold !== undefined) {
    const goldMin = Math.max(0, Math.floor(Number(baseGold) || 2000));
    await setWorldBossBaseGold(goldMin);
  }
  if (playerBonusConfig !== undefined) {
    // 验证配置格式
    let validConfig = [];
    try {
      const parsed = Array.isArray(playerBonusConfig) ? playerBonusConfig : JSON.parse(playerBonusConfig);
      if (Array.isArray(parsed)) {
        validConfig = parsed.filter(item => {
          return item &&
            typeof item.min === 'number' && item.min >= 1 &&
            (typeof item.hp === 'undefined' || typeof item.hp === 'number') &&
            (typeof item.atk === 'undefined' || typeof item.atk === 'number') &&
            (typeof item.def === 'undefined' || typeof item.def === 'number') &&
            (typeof item.mdef === 'undefined' || typeof item.mdef === 'number');
        }).sort((a, b) => a.min - b.min);
      }
    } catch (e) {
      console.error('Invalid playerBonusConfig:', e);
    }
    await setWorldBossPlayerBonusConfig(validConfig);
  }

  // 应用新设置到世界BOSS模板
  await applyWorldBossSettings();

  res.json({
    ok: true,
    dropBonus: await getWorldBossDropBonus(),
    baseHp: await getWorldBossBaseHp(),
    baseAtk: await getWorldBossBaseAtk(),
    baseDef: await getWorldBossBaseDef(),
    baseMdef: await getWorldBossBaseMdef(),
    baseExp: await getWorldBossBaseExp(),
    baseGold: await getWorldBossBaseGold(),
    playerBonusConfig: await getWorldBossPlayerBonusConfig()
  });
});

app.post('/admin/worldboss-respawn', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { realmId: rawRealmId } = req.body || {};

  let realmInfo = await resolveRealmId(rawRealmId);
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }

  const realmId = realmInfo.realmId;

  // 删除所有区服中的世界BOSS
  const allRealms = await listRealms();
  let removedCount = 0;
  let spawnedCount = 0;

  for (const realm of allRealms) {
    try {
      // 先删除所有世界BOSS
      const mobs = getAliveMobs('mg_town', 'lair', realm.id);
      const worldBossMobs = mobs.filter(m => m.templateId === 'world_boss');

      for (const boss of worldBossMobs) {
        removeMob(boss.id, 'mg_town', 'lair', realm.id);
        removedCount++;
      }

      // 清理世界BOSS的重生时间记录，避免影响正常刷新
      await clearMobRespawn(realm.id, 'mg_town', 'lair', 0);

      // 刷新新的世界BOSS
      const newMobs = spawnMobs('mg_town', 'lair', realm.id);
      const newBossCount = newMobs.filter(m => m.templateId === 'world_boss').length;
      spawnedCount += newBossCount;
    } catch (err) {
      console.error(`刷新区服 ${realm.id} 的世界BOSS失败:`, err);
    }
  }

  res.json({
    ok: true,
    message: `已刷新 ${allRealms.length} 个区服，删除 ${removedCount} 个旧BOSS，生成 ${spawnedCount} 个新BOSS`,
    removedCount,
    spawnedCount,
    realmCount: allRealms.length
  });
});

app.post('/admin/mail/send', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { username, title, body, realmId: rawRealmId } = req.body || {};
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });
  let realmInfo = await resolveRealmId(rawRealmId);
  // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  await sendMail(user.id, 'GM', title, body, null, 0, realmInfo.realmId);
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

app.get('/admin/loot-log-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const enabled = await getLootLogEnabled();
  res.json({ ok: true, enabled });
});

app.post('/admin/loot-log-toggle', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { enabled } = req.body || {};
  const nextEnabled = enabled === true;
  await setLootLogEnabled(nextEnabled);
  lootLogEnabled = nextEnabled;
  res.json({ ok: true, enabled: nextEnabled });
});

app.get('/admin/state-throttle-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const enabled = await getStateThrottleEnabled();
  const intervalSec = await getStateThrottleIntervalSec();
  const overrideServerAllowed = await getStateThrottleOverrideServerAllowed();
  res.json({ ok: true, enabled, intervalSec, overrideServerAllowed });
});

app.post('/admin/state-throttle-toggle', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { enabled, intervalSec, overrideServerAllowed } = req.body || {};
  const nextEnabled = enabled === true;
  await setStateThrottleEnabled(nextEnabled);
  if (intervalSec !== undefined) {
    await setStateThrottleIntervalSec(intervalSec);
  }
  if (overrideServerAllowed !== undefined) {
    await setStateThrottleOverrideServerAllowed(overrideServerAllowed === true);
    stateThrottleOverrideAllowedCachedValue = overrideServerAllowed === true;
    stateThrottleOverrideAllowedLastUpdate = Date.now();
  }
  stateThrottleCachedValue = nextEnabled;
  stateThrottleLastUpdate = Date.now();
  const intervalValue = await getStateThrottleIntervalSec();
  const overrideAllowed = await getStateThrottleOverrideServerAllowed();
  res.json({ ok: true, enabled: nextEnabled, intervalSec: intervalValue, overrideServerAllowed: overrideAllowed });
});

app.get('/admin/consign-expire-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const hours = await getConsignExpireHours();
  res.json({ ok: true, hours });
});

app.post('/admin/consign-expire-update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const hours = Math.max(0, Math.floor(Number(req.body?.hours || 0) || 0));
  if (!Number.isFinite(hours) || hours < 0) {
    return res.status(400).json({ error: '请输入有效小时数' });
  }
  await setConsignExpireHours(hours);
  consignExpireHoursCachedValue = hours;
  consignExpireHoursLastUpdate = Date.now();
  res.json({ ok: true, hours });
});

app.get('/admin/room-variant-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const count = await getRoomVariantCount();
  res.json({ ok: true, count });
});

app.post('/admin/room-variant-update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const count = Math.max(1, Math.floor(Number(req.body?.count || 0) || 0));
  if (!Number.isFinite(count) || count < 1) {
    return res.status(400).json({ error: '请输入有效数量' });
  }
  await setRoomVariantCount(count);
  applyRoomVariantCount(count);
  shrinkRoomVariants(WORLD, count);
  expandRoomVariants(WORLD);
  res.json({ ok: true, count });
});

// 职业升级属性配置
app.get('/admin/class-level-bonus', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const configs = {
    warrior: await getClassLevelBonusConfig('warrior'),
    mage: await getClassLevelBonusConfig('mage'),
    taoist: await getClassLevelBonusConfig('taoist')
  };
  res.json({ ok: true, configs });
});

app.post('/admin/class-level-bonus/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { classId, config } = req.body || {};
  if (!classId || !config) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  if (!['warrior', 'mage', 'taoist'].includes(classId)) {
    return res.status(400).json({ error: '无效的职业ID' });
  }
  // 验证配置格式 - 只验证前端实际发送的字段
  const validFields = ['hpPerLevel', 'mpPerLevel', 'atkPerLevel', 'defPerLevel', 'magPerLevel', 'spiritPerLevel', 'mdefPerLevel', 'dexPerLevel'];
  for (const field of validFields) {
    if (config[field] === undefined || config[field] === null || isNaN(config[field])) {
      return res.status(400).json({ error: `字段 ${field} 必须为有效数字` });
    }
  }
  await setClassLevelBonusConfig(classId, config);
  res.json({ ok: true, classId, config });
});

// 特殊BOSS配置（魔龙BOSS、暗之系列BOSS、沙巴克BOSS）
app.get('/admin/specialboss-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const dropBonus = await getSpecialBossDropBonus();
  const baseHp = await getSpecialBossBaseHp();
  const baseAtk = await getSpecialBossBaseAtk();
  const baseDef = await getSpecialBossBaseDef();
  const baseMdef = await getSpecialBossBaseMdef();
  const baseExp = await getSpecialBossBaseExp();
  const baseGold = await getSpecialBossBaseGold();
  const playerBonusConfig = await getSpecialBossPlayerBonusConfig();
  res.json({
    ok: true,
    dropBonus,
    baseHp,
    baseAtk,
    baseDef,
    baseMdef,
    baseExp,
    baseGold,
    playerBonusConfig
  });
});

app.post('/admin/specialboss-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { dropBonus, baseHp, baseAtk, baseDef, baseMdef, baseExp, baseGold, playerBonusConfig } = req.body || {};

  if (dropBonus !== undefined) {
    await setSpecialBossDropBonus(Math.max(1, Math.floor(Number(dropBonus) || 1.5)));
  }
  if (baseHp !== undefined) {
    await setSpecialBossBaseHp(Math.max(1, Math.floor(Number(baseHp) || 600000)));
  }
  if (baseAtk !== undefined) {
    await setSpecialBossBaseAtk(Math.max(1, Math.floor(Number(baseAtk) || 180)));
  }
  if (baseDef !== undefined) {
    await setSpecialBossBaseDef(Math.max(1, Math.floor(Number(baseDef) || 210)));
  }
  if (baseMdef !== undefined) {
    await setSpecialBossBaseMdef(Math.max(1, Math.floor(Number(baseMdef) || 210)));
  }
  if (baseExp !== undefined) {
    await setSpecialBossBaseExp(Math.max(1, Math.floor(Number(baseExp) || 9000)));
  }
  if (baseGold !== undefined) {
    const goldMin = Math.max(0, Math.floor(Number(baseGold) || 2000));
    await setSpecialBossBaseGold(goldMin);
  }
  if (playerBonusConfig !== undefined) {
    let validConfig = [];
    try {
      const parsed = Array.isArray(playerBonusConfig) ? playerBonusConfig : JSON.parse(playerBonusConfig);
      if (Array.isArray(parsed)) {
        validConfig = parsed.filter(item => {
          return item &&
            typeof item.min === 'number' && item.min >= 1 &&
            (typeof item.hp === 'undefined' || typeof item.hp === 'number') &&
            (typeof item.atk === 'undefined' || typeof item.atk === 'number') &&
            (typeof item.def === 'undefined' || typeof item.def === 'number') &&
            (typeof item.mdef === 'undefined' || typeof item.mdef === 'number');
        });
      }
      await setSpecialBossPlayerBonusConfig(validConfig);
    } catch (err) {
      return res.status(400).json({ error: '人数加成配置格式错误' });
    }
  }

  // 应用新设置到特殊BOSS模板
  await applySpecialBossSettings();

  res.json({ ok: true });
});

app.get('/admin/realms', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const realms = await knex('realms')
    .select(
      'realms.id',
      'realms.name',
      'realms.created_at',
      knex.raw('COALESCE(char_counts.count, 0) as character_count'),
      knex.raw('COALESCE(guild_counts.count, 0) as guild_count')
    )
    .leftJoin(
      knex('characters')
        .groupBy('realm_id')
        .select('realm_id')
        .count('* as count')
        .as('char_counts'),
      'char_counts.realm_id',
      'realms.id'
    )
    .leftJoin(
      knex('guilds')
        .groupBy('realm_id')
        .select('realm_id')
        .count('* as count')
        .as('guild_counts'),
      'guild_counts.realm_id',
      'realms.id'
    )
    .orderBy('realms.id');
  res.json({ ok: true, realms });
});

app.post('/admin/realms/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const realmId = Math.max(1, Math.floor(Number(req.body?.realmId || 0) || 0));
  const name = String(req.body?.name || '').trim();
  if (!realmId) return res.status(400).json({ error: '缺少区服ID。' });
  if (!name) return res.status(400).json({ error: '区服名不能为空。' });
  const realm = await getRealmById(realmId);
  if (!realm) return res.status(404).json({ error: '区服不存在。' });
  await updateRealmName(realmId, name);
  await refreshRealmCache();
  res.json({ ok: true, realmId, name });
});

app.post('/admin/realms/create', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: '区服名不能为空。' });
  const id = await createRealm(name);
  await ensureSabakState(id);
  await refreshRealmCache();
  res.json({ ok: true, realmId: id, name });
});

// 临时API：手动修复旧数据的realm_id
app.post('/admin/fix-realm-id', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const stats = {};

  await knex.transaction(async (trx) => {
    // 确保新区1存在
    const existingRealm = await trx('realms').where('id', 1).first();
    if (!existingRealm) {
      await trx('realms').insert({
        id: 1,
        name: '玛法大陆',
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    // 修复角色
    stats.characters = await trx('characters')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复行会
    stats.guilds = await trx('guilds')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复行会成员
    stats.guildMembers = await trx('guild_members')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复邮件
    stats.mails = await trx('mails')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复寄售
    stats.consignments = await trx('consignments')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复寄售历史
    stats.consignHistory = await trx('consignment_history')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复沙巴克报名
    stats.sabakReg = await trx('sabak_registrations')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 修复怪物刷新
    stats.mobRespawns = await trx('mob_respawns')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .update({ realm_id: 1 });

    // 确保沙巴克状态
    const existingSabak = await trx('sabak_state').where('realm_id', 1).first();
    if (!existingSabak) {
      await trx('sabak_state').insert({
        realm_id: 1,
        owner_guild_id: null,
        owner_guild_name: null,
        updated_at: trx.fn.now()
      });
    }
  });

  await refreshRealmCache();
  res.json({
    ok: true,
    message: '数据修复完成',
    stats
  });
});

app.post('/admin/realms/merge', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const sourceId = Math.max(1, Math.floor(Number(req.body?.sourceId || 0) || 0));
  const targetId = Math.max(1, Math.floor(Number(req.body?.targetId || 0) || 0));
  if (!sourceId || !targetId) return res.status(400).json({ error: '缺少区服ID。' });
  if (sourceId === targetId) return res.status(400).json({ error: '源区和目标区不能相同。' });
  const sourceRealm = await getRealmById(sourceId);
  const targetRealm = await getRealmById(targetId);
  if (!sourceRealm || !targetRealm) return res.status(404).json({ error: '区服不存在。' });

  // 检查是否存在重名行会
  const sourceGuilds = await knex('guilds').where({ realm_id: sourceId }).select('id', 'name');
  const targetGuildNames = new Set((await knex('guilds').where({ realm_id: targetId }).select('name')).map(g => g.name));
  const conflictingGuilds = sourceGuilds.filter(g => targetGuildNames.has(g.name));
  if (conflictingGuilds.length > 0) {
    return res.status(400).json({
      error: '存在重名行会，无法合区。',
      conflicts: conflictingGuilds.map(g => ({ id: g.id, name: g.name }))
    });
  }

  // 强制下线所有玩家
  for (const player of Array.from(players.values())) {
    try {
      player.send('GM正在执行合区操作，已强制下线。');
      player.socket.disconnect();
    } catch {}
  }

  // 创建合区前的备份
  const backupPayload = {
    meta: {
      version: 1,
      db_client: config.db.client,
      exported_at: new Date().toISOString(),
      operation: 'realm_merge',
      source_realm: { id: sourceId, name: sourceRealm?.name },
      target_realm: { id: targetId, name: targetRealm?.name }
    },
    tables: {}
  };

  for (const tableName of BACKUP_TABLES) {
    if (await knex.schema.hasTable(tableName)) {
      let query = knex(tableName);
      // 只备份涉及的两个区的数据
      if (tableName !== 'realms' && tableName !== 'users' && tableName !== 'game_settings' && tableName !== 'vip_codes' && tableName !== 'sessions') {
        query = query.where(function() {
          this.where('realm_id', sourceId).orWhere('realm_id', targetId);
        });
      }
      backupPayload.tables[tableName] = await query.select('*');
    }
  }

  const backupStamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 统计合并的数据
  const stats = {
    characters: 0,
    guilds: 0,
    mails: 0,
    consignments: 0,
    consignmentHistory: 0,
    sabakRegistrations: 0
  };

  await knex.transaction(async (trx) => {
    // 更新角色
    const charactersResult = await trx('characters').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.characters = charactersResult;

    // 更新行会
    const guildsResult = await trx('guilds').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.guilds = guildsResult;

    // 更新行会成员
    await trx('guild_members').where({ realm_id: sourceId }).update({ realm_id: targetId });

    // 更新邮件（合并到目标区）
    const mailsResult = await trx('mails').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.mails = mailsResult;

    // 更新寄售（合并到目标区）
    const consignmentsResult = await trx('consignments').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.consignments = consignmentsResult;

    // 更新寄售历史（合并到目标区）
    const consignmentHistoryResult = await trx('consignment_history').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.consignmentHistory = consignmentHistoryResult;

    // 更新沙巴克报名
    const sabakRegistrationsResult = await trx('sabak_registrations').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.sabakRegistrations = sabakRegistrationsResult;

    // 删除源区怪物刷新缓存，避免与目标区冲突
    await trx('mob_respawns').where({ realm_id: sourceId }).del();

    // 重置目标区沙巴克状态为无人占领，并删除源区沙巴克状态
    await trx('sabak_state').where({ realm_id: targetId }).update({
      owner_guild_id: null,
      owner_guild_name: null,
      updated_at: trx.fn.now()
    });
    await trx('sabak_state').where({ realm_id: sourceId }).del();

    // 删除源区
    await trx('realms').where({ id: sourceId }).del();

    // 重新排序所有服务器的ID，保持连续性
    const allRealms = await trx('realms').select('id').orderBy('id', 'asc');
    const idMapping = {};
    for (let i = 0; i < allRealms.length; i++) {
      const oldId = allRealms[i].id;
      const newId = i + 1; // 从1开始
      if (oldId !== newId) {
        idMapping[oldId] = newId;
        await trx('realms').where({ id: oldId }).update({ id: newId });
      }
    }

    // 更新所有引用realm_id的表
    const tablesWithRealmId = [
      'characters', 'guilds', 'guild_members', 'sabak_state', 'sabak_registrations',
      'mails', 'mob_respawns', 'consignments', 'consignment_history'
    ];

    for (const tableName of tablesWithRealmId) {
      if (await trx.schema.hasTable(tableName)) {
        for (const [oldId, newId] of Object.entries(idMapping)) {
          await trx(tableName).where({ realm_id: parseInt(oldId) }).update({ realm_id: newId });
        }
      }
    }
  });

  // 清理内存状态
  realmStates.delete(sourceId);
  const targetState = getRealmState(targetId);
  targetState.sabakState = createSabakState();
  targetState.parties.clear();
  targetState.partyInvites.clear();
  targetState.partyFollowInvites.clear();
  targetState.guildInvites.clear();
  targetState.tradeInvites.clear();
  targetState.tradesByPlayer.clear();
  targetState.lastSaveTime.clear();

  await refreshRealmCache();

  // 清除所有session，强制玩家重新登录
  await clearAllSessions();

  // 返回结果，不包含备份数据（数据量太大，前端通过单独接口下载）
  res.json({
    ok: true,
    sourceId,
    targetId,
    message: `合区完成。角色: ${stats.characters}, 行会: ${stats.guilds}, 邮件: ${stats.mails}, 寄售: ${stats.consignments}, 寄售历史: ${stats.consignmentHistory}, 沙巴克报名: ${stats.sabakRegistrations}。所有服务器ID已重新编号，保持连续性。所有玩家已强制下线，请重新登录。`,
    backupAvailable: true
  });
});

app.get('/admin/backup', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const tables = {};
  for (const name of BACKUP_TABLES) {
    if (await knex.schema.hasTable(name)) {
      tables[name] = await knex(name).select('*');
    }
  }
  const payload = {
    meta: {
      version: 1,
      db_client: config.db.client,
      exported_at: new Date().toISOString()
    },
    tables
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  res.setHeader('Content-Disposition', `attachment; filename="text-legend-backup-${stamp}.json"`);
  res.json(payload);
});

app.post('/admin/import', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  if (players.size > 0) {
    return res.status(400).json({ error: '导入前请确保没有在线玩家。' });
  }
  const tables = normalizeBackupTables(req.body);
  if (!tables) return res.status(400).json({ error: '备份文件格式错误。' });
  const counts = {};
  await knex.transaction(async (trx) => {
    if (config.db.client === 'sqlite') {
      await trx.raw('PRAGMA foreign_keys = OFF;');
    } else {
      await trx.raw('SET FOREIGN_KEY_CHECKS = 0;');
    }
    for (const name of BACKUP_TABLES.slice().reverse()) {
      if (!tables[name]) continue;
      if (await trx.schema.hasTable(name)) {
        await trx(name).del();
      }
    }
    for (const name of BACKUP_TABLES) {
      const rows = tables[name];
      if (!rows || rows.length === 0) {
        counts[name] = 0;
        continue;
      }
      if (!await trx.schema.hasTable(name)) continue;
      const chunks = chunkArray(rows, 200);
      for (const chunk of chunks) {
        await trx(name).insert(chunk);
      }
      counts[name] = rows.length;
    }
    if (config.db.client === 'sqlite') {
      await trx.raw('PRAGMA foreign_keys = ON;');
    } else {
      await trx.raw('SET FOREIGN_KEY_CHECKS = 1;');
    }
  });
  res.json({ ok: true, counts });
});

// 赞助管理接口
app.get('/admin/sponsors', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const sponsors = await listAllSponsors();
  res.json({ ok: true, sponsors });
});

app.post('/admin/sponsors', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { playerName, amount } = req.body || {};
  if (!playerName || amount === undefined || amount === null) {
    return res.status(400).json({ error: '缺少参数。' });
  }
  if (amount < 0) {
    return res.status(400).json({ error: '金额不能为负数。' });
  }
  try {
    await addSponsor(playerName, amount);
    io.emit('sponsors_updated');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '添加失败: ' + err.message });
  }
});

app.put('/admin/sponsors/:id', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { id } = req.params;
  const { playerName, amount } = req.body || {};
  if (!playerName || amount === undefined || amount === null) {
    return res.status(400).json({ error: '缺少参数。' });
  }
  if (amount < 0) {
    return res.status(400).json({ error: '金额不能为负数。' });
  }
  try {
    await updateSponsor(Number(id), playerName, amount);
    io.emit('sponsors_updated');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

app.delete('/admin/sponsors/:id', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { id } = req.params;
  try {
    await deleteSponsor(Number(id));
    io.emit('sponsors_updated');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

// 前台获取赞助名单接口
app.get('/api/sponsors', async (req, res) => {
  const sponsors = await listAllSponsors();
  res.json({ ok: true, sponsors });
});

// 更新赞助玩家自定义称号接口
app.post('/api/sponsors/custom-title', async (req, res) => {
  const { token, customTitle, characterName } = req.body || {};
  if (!token) {
    return res.status(401).json({ error: '未登录。' });
  }
  if (!customTitle || typeof customTitle !== 'string') {
    return res.status(400).json({ error: '缺少参数。' });
  }
  if (!characterName || typeof characterName !== 'string') {
    return res.status(400).json({ error: '缺少角色名称。' });
  }
  const trimmedTitle = customTitle.trim();
  if (trimmedTitle.length > 10) {
    return res.status(400).json({ error: '称号长度不能超过10个字。' });
  }
  // 过滤特殊字符，避免程序异常
  const invalidChars = /[<>\"'&\\\/\x00-\x1F]/;
  if (invalidChars.test(trimmedTitle)) {
    return res.status(400).json({ error: '称号包含非法字符。' });
  }
  try {
    const session = await getSession(token);
    if (!session) {
      return res.status(401).json({ error: '会话已过期，请重新登录。' });
    }

    // 检查是否是赞助玩家
    const sponsor = await getSponsorByPlayerName(characterName);
    if (!sponsor) {
      return res.status(403).json({ error: '您不是赞助玩家，无法设置自定义称号。' });
    }

    await updateSponsorCustomTitle(characterName, trimmedTitle || '赞助玩家');
    io.emit('sponsors_updated');
    res.json({ ok: true });
  } catch (err) {
    console.error('更新自定义称号失败:', err);
    res.status(500).json({ error: '更新失败: ' + err.message });
  }
});

const players = new Map();
const realmStates = new Map();
let realmCache = [];

function createSabakState() {
  return {
    active: false,
    ownerGuildId: null,
    ownerGuildName: null,
    captureGuildId: null,
    captureGuildName: null,
    captureStart: null,
    siegeEndsAt: null,
    killStats: {},
    noRegAnnounceDate: null
  };
}

function getRealmState(realmId = 1) {
  const id = Number(realmId) || 1;
  if (!realmStates.has(id)) {
    realmStates.set(id, {
      parties: new Map(),
      partyInvites: new Map(),
      partyFollowInvites: new Map(),
      guildInvites: new Map(),
      tradeInvites: new Map(),
      tradesByPlayer: new Map(),
      lastSaveTime: new Map(),
      sabakState: createSabakState()
    });
  }
  return realmStates.get(id);
}

async function refreshRealmCache() {
  const realms = await listRealms();
  // 如果数据库中有realm记录,使用它们;否则返回空数组,让前端处理
  realmCache = Array.isArray(realms) ? realms : [];
  return realmCache;
}

function getRealmIds() {
  const ids = realmCache.map((r) => r.id);
  return Array.from(new Set([1, ...ids]));
}

const sabakConfig = {
  startHour: 20,
  durationMinutes: 30,
  siegeMinutes: 30
};

function listOnlinePlayers(realmId = null) {
  const list = Array.from(players.values());
  if (!realmId) return list;
  return list.filter((p) => p.realmId === realmId);
}

function listSabakMembersOnline(realmId) {
  const state = getRealmState(realmId);
  if (!state.sabakState.ownerGuildId) return [];
  return listOnlinePlayers(realmId).filter((p) => p.guild && String(p.guild.id) === String(state.sabakState.ownerGuildId));
}

function getSabakState(realmId) {
  return getRealmState(realmId).sabakState;
}

function sendTo(player, message) {
  player.socket.emit('output', { text: message });
}

function emitAnnouncement(text, color, location, realmId = null) {
  const payload = { text, prefix: '公告', prefixColor: 'announce', color, location };
  if (realmId) {
    io.to(`realm:${realmId}`).emit('output', payload);
    io.to(`realm:${realmId}`).emit('chat', payload);
    return;
  }
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
  supreme: '至尊',
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

function buildMailItemView(entry) {
  if (!entry || !entry.id) return null;
  const view = buildItemView(entry.id, entry.effects || null, entry.durability, entry.max_durability);
  return {
    ...view,
    qty: Math.max(1, Number(entry.qty || 1)),
    durability: entry.durability ?? null,
    max_durability: entry.max_durability ?? null
  };
}

function buildMailPayload(row) {
  const items = parseJson(row.items_json, []);
  const itemViews = Array.isArray(items)
    ? items.map(buildMailItemView).filter(Boolean)
    : [];
  return {
    id: row.id,
    from_name: row.from_name,
    to_name: row.to_name,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    read_at: row.read_at,
    claimed_at: row.claimed_at,
    gold: Number(row.gold || 0),
    items: itemViews
  };
}

function resolveInventorySlotByKey(player, key) {
  if (!player || !player.inventory || !key) return null;
  const trimmed = String(key).trim();
  if (!trimmed) return null;
  const byKey = player.inventory.find((slot) => getItemKey(slot) === trimmed);
  if (byKey) return byKey;
  const byId = player.inventory.find((slot) => slot.id === trimmed);
  if (byId) return byId;
  return null;
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
  if (Number(effects.elementAtk || 0) > 0) tags.push(`元素+${Math.floor(Number(effects.elementAtk))}`);
  return tags.length ? `${item.name}·${tags.join('·')}` : item.name;
}

function formatLegendaryAnnouncement(text, rarity) {
  if (rarity === 'supreme') return `至尊掉落：${text}`;
  if (rarity === 'legendary') return `传说掉落：${text}`;
  return text;
}

function rollEquipmentEffects(itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return null;
  const candidates = [];
  if (item.type === 'weapon') {
    candidates.push('combo');
    candidates.push('poison');
  }
  candidates.push('fury');
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
    candidates.push('combo');
    candidates.push('poison');
  }
  candidates.push('fury');
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
    ['bug_queen', 'huangquan'].includes(id)
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
        if (item?.bossOnly) return false;
        if (item?.worldBossOnly && !mobTemplate.worldBoss) return false;
        return true;
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
        if (item?.bossOnly) return false;
        if (item?.worldBossOnly && !mobTemplate.worldBoss) return false;
        return true;
      });
      if (!filteredPool.length) return null;
      return filteredPool[randInt(0, filteredPool.length - 1)];
    }
  }
  return null;
}

let WORLD_BOSS_DROP_BONUS = 1.5;

async function applyWorldBossSettings() {
  // 从数据库加载世界BOSS设置并应用到常量
  WORLD_BOSS_DROP_BONUS = await getWorldBossDropBonus();

  // 应用到世界BOSS模板
  const worldBossTemplate = MOB_TEMPLATES.world_boss;
  if (worldBossTemplate) {
    worldBossTemplate.hp = await getWorldBossBaseHp();
    worldBossTemplate.atk = await getWorldBossBaseAtk();
    worldBossTemplate.def = await getWorldBossBaseDef();
    worldBossTemplate.mdef = await getWorldBossBaseMdef();
    worldBossTemplate.exp = await getWorldBossBaseExp();

    const baseGold = await getWorldBossBaseGold();
    worldBossTemplate.gold = [baseGold, Math.floor(baseGold * 1.6)];
  }

  // 加载每名玩家增加的属性值缓存
  await loadWorldBossSettingsCache();
}

async function applySpecialBossSettings() {
  // 从数据库加载特殊BOSS设置并应用到所有特殊BOSS模板
  const baseHp = await getSpecialBossBaseHp();
  const baseAtk = await getSpecialBossBaseAtk();
  const baseDef = await getSpecialBossBaseDef();
  const baseMdef = await getSpecialBossBaseMdef();
  const baseExp = await getSpecialBossBaseExp();
  const baseGold = await getSpecialBossBaseGold();

  // 应用到所有特殊BOSS模板（魔龙教主、暗之系列BOSS、沙巴克BOSS）
  // 注意：world_boss虽然也有specialBoss标记，但它使用独立的世界BOSS配置，不在此处处理
  const specialBossIds = [
    'molong_boss',
    'dark_woma_boss',
    'dark_zuma_boss',
    'dark_hongmo_boss',
    'dark_huangquan_boss',
    'dark_doublehead_boss',
    'dark_skeleton_boss',
    'sabak_boss'
  ];

  for (const bossId of specialBossIds) {
    const bossTemplate = MOB_TEMPLATES[bossId];
    if (bossTemplate) {
      bossTemplate.hp = baseHp;
      bossTemplate.atk = baseAtk;
      bossTemplate.def = baseDef;
      bossTemplate.mdef = baseMdef;
      bossTemplate.exp = baseExp;
      bossTemplate.gold = [baseGold, Math.floor(baseGold * 1.6)];
    }
  }

  // 加载特殊BOSS人数加成配置缓存
  await loadSpecialBossSettingsCache();
}

// 根据房间内玩家数量调整世界BOSS属性（按人数分段加成）
function adjustWorldBossStatsByPlayerCount(zoneId, roomId, realmId) {
  const mobs = getAliveMobs(zoneId, roomId, realmId);
  const worldBossMob = mobs.find(m => m.templateId === 'world_boss');
  if (!worldBossMob) return;

  // 获取房间内的在线玩家数量
  const online = listOnlinePlayers(realmId);
  const roomPlayers = online.filter(p =>
    p.position &&
    p.position.zone === zoneId &&
    p.position.room === roomId
  );
  const playerCount = roomPlayers.length;

  // 从模板获取基础属性（防止重复叠加）
  const template = MOB_TEMPLATES.world_boss;
  if (!template) return;

  const baseHp = template.hp || worldBossMob.max_hp;
  const baseAtk = template.atk || worldBossMob.atk;
  const baseDef = template.def || worldBossMob.def;
  const baseMdef = template.mdef || worldBossMob.mdef;

  // 获取人数分段加成配置
  const playerBonusConfig = getWorldBossPlayerBonusConfigSync() || [];
  const bonusConfig = playerBonusConfig.find(config => playerCount >= config.min);

  // 计算加成后的属性（基于基础属性 + 分段加成）
  const addedHp = bonusConfig ? (bonusConfig.hp || 0) : 0;
  const addedAtk = bonusConfig ? (bonusConfig.atk || 0) : 0;
  const addedDef = bonusConfig ? (bonusConfig.def || 0) : 0;
  const addedMdef = bonusConfig ? (bonusConfig.mdef || 0) : 0;

  // 应用加成（基于基础属性计算，避免重复叠加）
  worldBossMob.max_hp = Math.floor(baseHp + addedHp);
  worldBossMob.hp = Math.min(worldBossMob.hp, worldBossMob.max_hp);
  worldBossMob.atk = Math.floor(baseAtk + addedAtk);
  worldBossMob.def = Math.floor(baseDef + addedDef);
  worldBossMob.mdef = Math.floor(baseMdef + addedMdef);

  // 更新baseStats
  if (!worldBossMob.status) worldBossMob.status = {};
  worldBossMob.status.baseStats = {
    max_hp: worldBossMob.max_hp,
    atk: worldBossMob.atk,
    def: worldBossMob.def,
    mdef: worldBossMob.mdef
  };
}

// 同步获取设置（避免异步问题）
let worldBossSettingsCache = {
  playerBonusConfig: []
};

async function loadWorldBossSettingsCache() {
  worldBossSettingsCache.playerBonusConfig = await getWorldBossPlayerBonusConfig();
}

function getWorldBossPlayerBonusConfigSync() {
  return worldBossSettingsCache.playerBonusConfig;
}

// 特殊BOSS设置缓存
let specialBossSettingsCache = {
  playerBonusConfig: []
};

async function loadSpecialBossSettingsCache() {
  specialBossSettingsCache.playerBonusConfig = await getSpecialBossPlayerBonusConfig();
}

function getSpecialBossPlayerBonusConfigSync() {
  return specialBossSettingsCache.playerBonusConfig;
}

function dropLoot(mobTemplate, bonus = 1) {
  const loot = [];
  const sabakBonus = mobTemplate.sabakBoss ? 3.0 : 1.0;
  const finalBonus = (mobTemplate.worldBoss ? bonus * WORLD_BOSS_DROP_BONUS : bonus) * sabakBonus;
  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      const dropItem = ITEM_TEMPLATES[drop.id];
      if (dropItem?.bossOnly && !isBossMob(mobTemplate)) return;
      if (dropItem?.worldBossOnly && !mobTemplate.worldBoss) return;
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
  await saveCharacter(player.userId, player, player.realmId || 1);
}

function createParty(leaderName, realmId) {
  const state = getRealmState(realmId);
  const partyId = `party-${Date.now()}-${randInt(100, 999)}`;
  state.parties.set(partyId, { id: partyId, leader: leaderName, members: [leaderName], lootIndex: 0 });
  return state.parties.get(partyId);
}

function getPartyById(partyId, realmId) {
  if (!partyId) return null;
  const state = getRealmState(realmId);
  return state.parties.get(partyId) || null;
}

function getPartyByMember(name, realmId) {
  const state = getRealmState(realmId);
  for (const party of state.parties.values()) {
    if (party.members.includes(name)) return party;
  }
  return null;
}

function removeFromParty(name, realmId) {
  const state = getRealmState(realmId);
  const party = getPartyByMember(name, realmId);
  if (!party) return null;
  party.members = party.members.filter((m) => m !== name);
  if (party.leader === name) {
    party.leader = party.members[0] || null;
  }
  if (party.members.length === 0) {
    state.parties.delete(party.id);
    return null;
  }
  return party;
}

async function updatePartyFlags(name, partyId, members, realmId) {
  if (!name) return;
  const memberList = Array.isArray(members) ? Array.from(new Set(members)) : [];
  const onlinePlayer = playersByName(name, realmId);
  if (onlinePlayer) {
    if (!onlinePlayer.flags) onlinePlayer.flags = {};
    onlinePlayer.flags.partyId = partyId || null;
    onlinePlayer.flags.partyMembers = memberList;
    onlinePlayer.flags.partyLeader = memberList.length ? (onlinePlayer.flags.partyLeader || null) : null;
    await savePlayer(onlinePlayer);
    return;
  }
  const row = await findCharacterByNameInRealm(name, realmId);
  if (!row) return;
  const player = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
  if (!player) return;
  if (!player.flags) player.flags = {};
  player.flags.partyId = partyId || null;
  player.flags.partyMembers = memberList;
  player.flags.partyLeader = memberList.length ? (player.flags.partyLeader || null) : null;
  await saveCharacter(row.user_id, player, row.realm_id || 1);
}

async function clearPartyFlags(name, realmId) {
  await updatePartyFlags(name, null, [], realmId);
}

async function persistParty(party, realmId) {
  if (!party || !party.id) return;
  const members = Array.from(new Set(party.members || []));
  party.members = members;
  if (!party.leader || !members.includes(party.leader)) {
    party.leader = members[0] || null;
  }
  for (const member of members) {
    const online = playersByName(member, realmId);
    if (online) {
      if (!online.flags) online.flags = {};
      online.flags.partyLeader = party.leader;
    } else {
      const row = await findCharacterByNameInRealm(member, realmId);
      if (row) {
        const stored = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
        if (stored) {
          if (!stored.flags) stored.flags = {};
          stored.flags.partyLeader = party.leader;
          await saveCharacter(row.user_id, stored, row.realm_id || 1);
        }
      }
    }
    await updatePartyFlags(member, party.id, members, realmId);
  }
}

function getTradeByPlayer(name, realmId) {
  const state = getRealmState(realmId);
  return state.tradesByPlayer.get(name);
}

function clearTrade(trade, reason, realmId) {
  const state = getRealmState(realmId);
  const names = [trade.a.name, trade.b.name];
  names.forEach((n) => state.tradesByPlayer.delete(n));
  if (reason) {
    names.forEach((n) => {
      const p = playersByName(n, realmId);
      if (p) p.send(reason);
    });
  }
}

function playersByName(name, realmId = null) {
  const list = Array.from(players.values());
  return list.find((p) => p.name === name && (!realmId || p.realmId === realmId));
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
  if (Number(effects.elementAtk || 0) > 0) {
    normalized.elementAtk = Math.max(1, Math.floor(Number(effects.elementAtk)));
  }
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
  const realmId = player.realmId || 1;
  const state = getRealmState(realmId);
  const trade = {
    id: `trade-${Date.now()}-${randInt(100, 999)}`,
    realmId,
    a: { name: player.name },
    b: { name: target.name },
    offers: {
      [player.name]: { gold: 0, items: [] },
      [target.name]: { gold: 0, items: [] }
    },
    locked: { [player.name]: false, [target.name]: false },
    confirmed: { [player.name]: false, [target.name]: false }
  };
  state.tradesByPlayer.set(player.name, trade);
  state.tradesByPlayer.set(target.name, trade);
  return trade;
}

const tradeApi = {
  requestTrade(player, targetName) {
    const realmId = player.realmId || 1;
    const state = getRealmState(realmId);
    if (getTradeByPlayer(player.name, realmId)) return { ok: false, msg: '你正在交易中。' };
    const target = playersByName(targetName, realmId);
    if (!target) return { ok: false, msg: '玩家不在线。' };
    if (target.name === player.name) return { ok: false, msg: '不能和自己交易。' };
    if (getTradeByPlayer(target.name, realmId)) return { ok: false, msg: '对方正在交易中。' };
    const existing = state.tradeInvites.get(target.name);
    if (existing && existing.from !== player.name) {
      return { ok: false, msg: '对方已有交易请求。' };
    }
    state.tradeInvites.set(target.name, { from: player.name, at: Date.now() });
    target.send(`${player.name} 请求交易。`);
    return { ok: true, msg: `交易请求已发送给 ${target.name}。` };
  },
  acceptTrade(player, fromName) {
    const realmId = player.realmId || 1;
    const state = getRealmState(realmId);
    const invite = state.tradeInvites.get(player.name);
    if (!invite || invite.from !== fromName) return { ok: false, msg: '没有该交易请求。' };
    if (getTradeByPlayer(player.name, realmId)) return { ok: false, msg: '你正在交易中。' };
    const inviter = playersByName(fromName, realmId);
    if (!inviter) return { ok: false, msg: '对方不在线。' };
    if (getTradeByPlayer(inviter.name, realmId)) return { ok: false, msg: '对方正在交易中。' };
    state.tradeInvites.delete(player.name);
    const trade = createTrade(inviter, player);
    inviter.send('交易建立。');
    player.send('交易建立。');
    return { ok: true, trade };
  },
  addItem(player, itemId, qty, effects = null) {
    const trade = getTradeByPlayer(player.name, player.realmId || 1);
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
    const trade = getTradeByPlayer(player.name, player.realmId || 1);
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
    const trade = getTradeByPlayer(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    trade.locked[player.name] = true;
    return { ok: true, trade };
  },
  confirm(player) {
    const trade = getTradeByPlayer(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (!trade.locked[trade.a.name] || !trade.locked[trade.b.name]) {
      return { ok: false, msg: '双方都锁定后才能确认。' };
    }
    trade.confirmed[player.name] = true;
    return { ok: true, trade };
  },
  cancel(player, reason) {
    const realmId = player.realmId || 1;
    const state = getRealmState(realmId);
    const trade = getTradeByPlayer(player.name, realmId);
    if (trade) {
      clearTrade(trade, reason || `交易已取消（${player.name}）。`, realmId);
      return { ok: true };
    }
    if (state.tradeInvites.get(player.name)) {
      state.tradeInvites.delete(player.name);
      return { ok: true, msg: '已取消交易请求。' };
    }
    for (const [targetName, invite] of state.tradeInvites.entries()) {
      if (invite.from === player.name) {
        state.tradeInvites.delete(targetName);
        return { ok: true, msg: '已取消交易请求。' };
      }
    }
    return { ok: false, msg: '没有可取消的交易。' };
  },
  finalize(trade) {
    const realmId = trade?.realmId || null;
    const playerA = playersByName(trade.a.name, realmId);
    const playerB = playersByName(trade.b.name, realmId);
    if (!playerA || !playerB) {
      clearTrade(trade, '交易失败，对方已离线。', realmId);
      return { ok: false };
    }

    // 服务端重新获取offer数据，防止客户端篡改
    const offerA = ensureOffer(trade, playerA.name);
    const offerB = ensureOffer(trade, playerB.name);

    // 双方再次验证金币和物品（防止锁定后客户端修改数据）
    if (playerA.gold < offerA.gold || playerB.gold < offerB.gold ||
      !hasOfferItems(playerA, offerA) || !hasOfferItems(playerB, offerB)) {
      clearTrade(trade, '交易失败，物品或金币不足。', realmId);
      return { ok: false };
    }

    // 再次验证交易状态（防止重复提交）
    if (!trade.locked[playerA.name] || !trade.locked[playerB.name]) {
      clearTrade(trade, '交易失败，未完全锁定。', realmId);
      return { ok: false };
    }

    playerA.gold -= offerA.gold;
    playerB.gold += offerA.gold;
    playerB.gold -= offerB.gold;
    playerA.gold += offerB.gold;
    applyOfferItems(playerA, playerB, offerA);
    applyOfferItems(playerB, playerA, offerB);
    clearTrade(trade, '交易完成。', realmId);
    return { ok: true };
  },
  getTrade(playerName) {
    return getTradeByPlayer(playerName);
  },
  offerText
};

const CONSIGN_EQUIPMENT_TYPES = new Set(['weapon', 'armor', 'accessory', 'book']);
const CONSIGN_FEE_RATE = 0.1;
const CONSIGN_EXPIRE_DEFAULT_HOURS = 48;
const CONSIGN_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let consignCleanupRunning = false;

const consignApi = {
    async listMarket(player) {
      await cleanupExpiredConsignments(player.realmId || 1);
      const rows = await listConsignments(player.realmId || 1);
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
      await cleanupExpiredConsignments(player.realmId || 1);
      const rows = await listConsignmentsBySeller(player.name, player.realmId || 1);
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
        maxDurability,
        realmId: player.realmId || 1
      });
      await consignApi.listMine(player);
      await consignApi.listMarket(player);
      return { ok: true, msg: `寄售成功，编号 ${id}。` };
    },
  async buy(player, listingId, qty) {
    await cleanupExpiredConsignments(player.realmId || 1);
    // 验证listingId和qty
    const idResult = validateNumber(listingId, 1, Number.MAX_SAFE_INTEGER);
    if (!idResult.ok) return { ok: false, msg: '寄售ID无效。' };
    
    const qtyResult = validateItemQty(qty);
    if (!qtyResult.ok) return { ok: false, msg: '购买数量无效。' };
    
    const row = await getConsignment(idResult.value, player.realmId || 1);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name === player.name) return { ok: false, msg: '不能购买自己的寄售。' };
    if (row.qty < qtyResult.value) return { ok: false, msg: '寄售数量不足。' };

    // 服务端重新计算总价，防止客户端篡改价格
    const serverTotal = row.price * qtyResult.value;
    const fee = Math.floor(serverTotal * CONSIGN_FEE_RATE);
    const sellerGain = serverTotal - fee;
    const hasGoldResult = validatePlayerHasGold(player, serverTotal);
    if (!hasGoldResult.ok) return { ok: false, msg: hasGoldResult.error };

    player.gold -= serverTotal;
      addItem(player, row.item_id, qtyResult.value, parseJson(row.effects_json), row.durability, row.max_durability);

    const remain = row.qty - qtyResult.value;
    if (remain > 0) {
      await updateConsignmentQty(idResult.value, remain, player.realmId || 1);
    } else {
      await deleteConsignment(idResult.value, player.realmId || 1);
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
      maxDurability: row.max_durability,
      realmId: player.realmId || 1
    });

    const seller = playersByName(row.seller_name, player.realmId || 1);
    if (seller) {
      seller.gold += sellerGain;
      seller.send(`寄售成交: ${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qtyResult.value}，获得 ${sellerGain} 金币（手续费 ${fee}）。`);
      savePlayer(seller);
      await consignApi.listMine(seller);
      await consignApi.listMarket(seller);
    } else {
      const sellerRow = await findCharacterByNameInRealm(row.seller_name, player.realmId || 1);
      if (sellerRow) {
        const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name, sellerRow.realm_id || 1);
        if (sellerPlayer) {
          sellerPlayer.gold += sellerGain;
          await saveCharacter(sellerRow.user_id, sellerPlayer, sellerRow.realm_id || 1);
        }
      }
    }
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    return { ok: true, msg: `购买成功，花费 ${serverTotal} 金币。` };
  },
  async cancel(player, listingId) {
    await cleanupExpiredConsignments(player.realmId || 1);
    // 验证listingId
    const idResult = validateNumber(listingId, 1, Number.MAX_SAFE_INTEGER);
    if (!idResult.ok) return { ok: false, msg: '寄售ID无效。' };
    
    const row = await getConsignment(idResult.value, player.realmId || 1);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name !== player.name) return { ok: false, msg: '只能取消自己的寄售。' };
      addItem(player, row.item_id, row.qty, parseJson(row.effects_json), row.durability, row.max_durability);
    await deleteConsignment(idResult.value, player.realmId || 1);
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    return { ok: true, msg: '寄售已取消，物品已返回背包。' };
  },
  async listHistory(player, limit = 50) {
    const rows = await listConsignmentHistory(player.name, player.realmId || 1, limit);
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

async function cleanupExpiredConsignments(realmId = 1) {
  if (consignCleanupRunning) return;
  consignCleanupRunning = true;
  try {
    const hours = await getConsignExpireHoursCached();
    const effectiveHours = Number.isFinite(hours) ? Math.max(0, hours) : CONSIGN_EXPIRE_DEFAULT_HOURS;
    if (effectiveHours <= 0) return;
    const cutoff = new Date(Date.now() - effectiveHours * 60 * 60 * 1000);
    const rows = await listExpiredConsignments(cutoff, realmId);
    if (!rows.length) return;
    const refreshedSellers = new Set();
    for (const row of rows) {
      const qty = Math.max(0, Number(row.qty || 0));
      if (!qty) {
        await deleteConsignment(row.id, realmId);
        continue;
      }
      const effects = parseJson(row.effects_json);
      const seller = playersByName(row.seller_name, realmId);
      if (seller) {
        addItem(seller, row.item_id, qty, effects, row.durability, row.max_durability);
        seller.send(`寄售到期自动下架：${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qty} 已返还背包。`);
        seller.forceStateRefresh = true;
        refreshedSellers.add(seller);
        savePlayer(seller);
      } else {
        const sellerRow = await findCharacterByNameInRealm(row.seller_name, realmId);
        if (sellerRow) {
          const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name, sellerRow.realm_id || 1);
          if (sellerPlayer) {
            addItem(sellerPlayer, row.item_id, qty, effects, row.durability, row.max_durability);
            await saveCharacter(sellerRow.user_id, sellerPlayer, sellerRow.realm_id || 1);
          }
        }
      }
      await deleteConsignment(row.id, realmId);
    }
    for (const seller of refreshedSellers) {
      await consignApi.listMine(seller);
      await consignApi.listMarket(seller);
    }
  } finally {
    consignCleanupRunning = false;
  }
}

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
    logLoot(`[loot][party] ${target.name} <- ${itemId}`);
    results.push({ id: itemId, effects, target });
    partyMembers.forEach((member) => {
      member.send(`队伍掉落: ${formatItemLabel(itemId, effects)} -> ${target.name}`);
    });
  });
  return results;
}

async function loadSabakState(realmId) {
  const state = getSabakState(realmId);
  const owner = await getSabakOwner(realmId);
  if (owner) {
    state.ownerGuildId = owner.owner_guild_id || null;
    state.ownerGuildName = owner.owner_guild_name || null;
  }
}

function isSabakZone(zoneId) {
  return typeof zoneId === 'string' && zoneId.startsWith('sb_');
}

function isSabakPalace(zoneId, roomId) {
  return zoneId === 'sb_town' && roomId === 'palace';
}

function getSabakPalaceKillStats(realmId) {
  const sabakState = getSabakState(realmId);
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
  const sabakState = getSabakState(player.realmId || 1);
  if (sabakState.ownerGuildId) return false;
  sabakState.ownerGuildId = player.guild.id;
  sabakState.ownerGuildName = player.guild.name;
  await setSabakOwner(player.realmId || 1, player.guild.id, player.guild.name);
  emitAnnouncement(`沙巴克无人占领，${player.guild.name} 已占领沙巴克。`, 'announce', null, player.realmId || 1);
  return true;
}

function startSabakSiege(attackerGuild, realmId) {
  const sabakState = getSabakState(realmId);
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
  emitAnnouncement(`沙巴克攻城战开始！时长 ${sabakConfig.siegeMinutes} 分钟。`, 'announce', null, realmId);
}

async function finishSabakSiege(realmId) {
  const sabakState = getSabakState(realmId);
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
    emitAnnouncement('沙巴克攻城战结束，守城方继续守城。', 'announce', null, realmId);
  } else if (winnerId && winnerId !== sabakState.ownerGuildId) {
    sabakState.ownerGuildId = winnerId;
    sabakState.ownerGuildName = winnerName;
    await setSabakOwner(realmId, winnerId, winnerName || '未知行会');
    emitAnnouncement(`沙巴克被 ${winnerName} 占领！`, 'announce', null, realmId);
  } else {
    emitAnnouncement('沙巴克攻城战结束，守城方成功守住。', 'announce', null, realmId);
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
  const sabakState = getSabakState(attacker.realmId || 1);
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
  const sabakState = getSabakState(player.realmId || 1);
  if (!sabakState.ownerGuildId) {
    await autoCaptureSabak(player);
    return;
  }
  if (String(player.guild.id) !== String(sabakState.ownerGuildId) && !sabakState.active) {
    startSabakSiege(player.guild, player.realmId || 1);
  }
}

function isRedName(player) {
  return (player.flags?.pkValue || 0) >= 100;
}

function hasEquipped(player, itemId) {
  return Object.values(player.equipment || {}).some((eq) => eq && eq.id === itemId);
}

// 检查装备的特戒，多个相同特戒只计算一个效果
function hasSpecialRingEquipped(player, itemId) {
  if (!player.equipment) return false;

  const ringSlots = ['ring_left', 'ring_right'];
  const equippedRings = ringSlots
    .map(slot => player.equipment[slot])
    .filter(eq => eq !== undefined && eq !== null);

  // 检查是否有该特戒，如果左右都装备了相同特戒，只算一个
  const hasThisRing = equippedRings.some(eq => eq.id === itemId);

  // 统计该特戒的数量
  const count = equippedRings.filter(eq => eq.id === itemId).length;

  // 如果有多个相同特戒，给玩家发送提示（带冷却，避免重复提示）
  if (count > 1) {
    const warnNow = Date.now();
    const lastWarning = player.flags?.ringWarningTime || {};
    const lastTime = lastWarning[itemId] || 0;
    const cooldown = 30000; // 30秒冷却

    if (warnNow - lastTime >= cooldown) {
      if (!player.flags) player.flags = {};
      if (!player.flags.ringWarningTime) player.flags.ringWarningTime = {};
      player.flags.ringWarningTime[itemId] = warnNow;

      const ringName = ITEM_TEMPLATES[itemId]?.name || itemId;
      player.send(`注意：你装备了多个${ringName}，只有第一个会生效。`);
    }
  }

  return hasThisRing;
}

function canTriggerMagicRing(player, chosenSkillId, skill) {
  if (!player) return false;
  if (player.classId === 'warrior') return true;
  return chosenSkillId === 'slash' && skill?.id === 'slash';
}

function hasComboWeapon(player) {
  return Boolean(player?.flags?.hasComboEffect);
}

function hasHealBlockEffect(player) {
  return Boolean(player?.flags?.hasHealblockEffect);
}

function isInvincible(target) {
  const until = target?.status?.invincible;
  if (!until) return false;
  if (until > Date.now()) return true;
  if (target.status) delete target.status.invincible;
  return false;
}

function getSpiritValue(target) {
  if (!target) return 0;
  const base = Number(target.spirit ?? target.atk ?? 0) || 0;
  const buff = target.status?.buffs?.spiritBoost;
  if (!buff) return base;
  const now = Date.now();
  if (buff.expiresAt && buff.expiresAt < now) {
    if (target.status?.buffs) delete target.status.buffs.spiritBoost;
    return base;
  }
  return Math.floor(base * (buff.multiplier || 1));
}

function getPowerStatValue(player, skill) {
  if (!player || !skill) return 0;
  if (skill.powerStat === 'atk') return Number(player.atk || 0);
  if (skill.powerStat === 'spirit' || skill.id === 'soul') return getSpiritValue(player);
  return Number(player.mag || 0);
}

function applyDamageToSummon(target, dmg) {
  if (isInvincible(target)) return 0;
  applyDamage(target, dmg);
  return dmg;
}

function applyDamageToPlayer(target, dmg) {
  if (isInvincible(target)) return 0;
  if (target.status?.buffs?.magicShield) {
    const buff = target.status.buffs.magicShield;
    if (buff.expiresAt && buff.expiresAt < Date.now()) {
      delete target.status.buffs.magicShield;
    } else if (target.mp > 0) {
      const ratio = 0.2;
      const convert = Math.min(Math.floor(dmg * ratio), target.mp);
      target.mp = Math.max(0, target.mp - convert);
      dmg -= convert;
    }
  }
  // 护身戒指：受到攻击时10%几率减免伤害20%，持续2秒
  if (hasSpecialRingEquipped(target, 'ring_protect') && Math.random() <= 0.1) {
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
  return dmg;
}

function tryRevive(player) {
  if (player.hp > 0) return false;
  if (hasSpecialRingEquipped(player, 'ring_revival')) {
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
  const offlineMultiplier = player.flags.vip ? 2 : 1;
  const expGain = Math.floor(offlineMinutes * player.level * offlineMultiplier);
  const goldGain = Math.floor(offlineMinutes * player.level * offlineMultiplier);
  let fruitGain = 0;
  for (let i = 0; i < offlineMinutes; i += 1) {
    if (Math.random() <= 0.01) {
      fruitGain += 1;
    }
  }
  gainExp(player, expGain);
  player.gold += goldGain;
  if (fruitGain > 0) {
    addItem(player, 'training_fruit', fruitGain);
  }
  player.flags.offlineAt = null;
  if (fruitGain > 0) {
    player.send(`离线挂机收益: ${expGain} 经验, ${goldGain} 金币, 修炼果 x${fruitGain}。`);
  } else {
    player.send(`离线挂机收益: ${expGain} 经验, ${goldGain} 金币。`);
  }
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
const roomStateDataCache = new Map();
let roomStateLastUpdate = 0;
let roomStateCachedData = null;
const ROOM_STATE_TTL = 100; // 100ms缓存时间
const VIP_SELF_CLAIM_CACHE_TTL = 10000; // VIP自领缓存10秒
const STATE_THROTTLE_CACHE_TTL = 10000; // 状态节流缓存10秒
let vipSelfClaimCachedValue = null;
let vipSelfClaimLastUpdate = 0;
let stateThrottleCachedValue = null;
let stateThrottleLastUpdate = 0;
let stateThrottleIntervalCachedValue = null;
let stateThrottleIntervalLastUpdate = 0;
let stateThrottleOverrideAllowedCachedValue = null;
let stateThrottleOverrideAllowedLastUpdate = 0;
let consignExpireHoursCachedValue = null;
let consignExpireHoursLastUpdate = 0;
let lootLogEnabled = false;
const stateThrottleLastSent = new Map();
const stateThrottleLastExits = new Map();
const stateThrottleLastRoom = new Map();
const stateThrottleLastInBoss = new Map();

function getStateThrottleKey(player, socket = null) {
  if (player) {
    return player.userId || player.name || player.socket?.id || socket?.id || null;
  }
  return socket?.id || null;
}

async function getStateThrottleSettingsCached() {
  const now = Date.now();
  if (now - stateThrottleLastUpdate > STATE_THROTTLE_CACHE_TTL) {
    stateThrottleCachedValue = await getStateThrottleEnabled();
    stateThrottleLastUpdate = now;
  }
  if (now - stateThrottleIntervalLastUpdate > STATE_THROTTLE_CACHE_TTL) {
    stateThrottleIntervalCachedValue = await getStateThrottleIntervalSec();
    stateThrottleIntervalLastUpdate = now;
  }
  if (now - stateThrottleOverrideAllowedLastUpdate > STATE_THROTTLE_CACHE_TTL) {
    stateThrottleOverrideAllowedCachedValue = await getStateThrottleOverrideServerAllowed();
    stateThrottleOverrideAllowedLastUpdate = now;
  }
  return {
    enabled: Boolean(stateThrottleCachedValue),
    intervalSec: Math.max(1, Number(stateThrottleIntervalCachedValue) || 10),
    overrideServerAllowed: Boolean(stateThrottleOverrideAllowedCachedValue)
  };
}

async function getConsignExpireHoursCached() {
  const now = Date.now();
  if (now - consignExpireHoursLastUpdate > STATE_THROTTLE_CACHE_TTL) {
    consignExpireHoursCachedValue = await getConsignExpireHours();
    consignExpireHoursLastUpdate = now;
  }
  const parsed = parseInt(consignExpireHoursCachedValue, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 48;
}

function logLoot(message) {
  if (!lootLogEnabled) return;
  console.log(message);
}

// 判断是否是BOSS房间（魔龙教主/世界BOSS/沙巴克BOSS/暗之系列）
function isBossRoom(zoneId, roomId, realmId = 1) {
  if (!zoneId || !roomId) return false;
  const zone = WORLD[zoneId];
  if (!zone) return false;
  const room = zone.rooms[roomId];
  if (!room) return false;
  
  // 检查房间内的怪物是否有特殊BOSS
  const mobs = getRoomMobs(zoneId, roomId, realmId);
  return mobs.some(m => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });
}

function buildRoomExits(zoneId, roomId) {
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (!room) return [];
  const allExits = Object.entries(room.exits).map(([dir, dest]) => {
    let destZoneId = zoneId;
    let destRoomId = dest;
    if (dest.includes(':')) {
      [destZoneId, destRoomId] = dest.split(':');
    }
    const destZone = WORLD[destZoneId];
    const destRoom = destZone?.rooms?.[destRoomId];
    const label = destRoom
      ? (destZoneId === zoneId ? destRoom.name : `${destZone.name} - ${destRoom.name}`)
      : dest;
    return { dir, label };
  });

  // 合并带数字后缀的方向，只显示一个入口（暗之BOSS房间除外）
  const filteredExits = [];
  allExits.forEach((exit) => {
    const dir = exit.dir;
    const baseDir = dir.replace(/[0-9]+$/, '');

    // 检查是否是前往暗之BOSS房间的入口
    const isDarkBossExit = exit.dir.startsWith('southwest');

    // 检查是否有数字后缀的变体
    const hasVariants = allExits.some(
      (e) => e.dir !== dir && e.dir.startsWith(baseDir) && /[0-9]+$/.test(e.dir)
    );

    if (isDarkBossExit) {
      // 暗之BOSS入口不合并，全部显示
      filteredExits.push(exit);
    } else if (hasVariants) {
      // 只添加基础方向，不添加数字后缀的
      if (!/[0-9]+$/.test(dir) && !filteredExits.some((e) => e.dir === baseDir)) {
        filteredExits.push({ dir: baseDir, label: exit.label.replace(/[0-9]+$/, '') });
      }
    } else {
      // 没有变体，正常添加
      filteredExits.push(exit);
    }
  });

  // 移除标签中的数字后缀（如 "平原1" -> "平原"）（暗之BOSS房间除外）
  return filteredExits.map((exit) => ({
    dir: exit.dir,
    label: exit.dir.startsWith('southwest') ? exit.label : exit.label.replace(/(\D)\d+$/, '$1')
  }));
}

function getRoomCommonState(zoneId, roomId, realmId = 1) {
  const cacheKey = `${realmId}:${zoneId}:${roomId}`;
  const now = Date.now();
  const cached = roomStateDataCache.get(cacheKey);
  if (cached && now - cached.at < ROOM_STATE_TTL) return cached.data;

  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (zone && room) spawnMobs(zoneId, roomId, realmId);

  // 根据房间内玩家数量调整世界BOSS属性
  adjustWorldBossStatsByPlayerCount(zoneId, roomId, realmId);

  const mobs = getAliveMobs(zoneId, roomId, realmId).map((m) => ({
    id: m.id,
    name: m.name,
    hp: m.hp,
    max_hp: m.max_hp,
    mdef: m.mdef || 0
  }));
  const roomMobs = getRoomMobs(zoneId, roomId, realmId);
  const deadBosses = roomMobs.filter((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && m.hp <= 0 && isBossMob(tpl);
  });
  const nextRespawn = deadBosses.length > 0
    ? deadBosses.sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt
    : null;

  let bossRank = [];
  let bossNextRespawn = null;
  const deadSpecialBosses = deadBosses.filter((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });
  if (deadSpecialBosses.length > 0) {
    bossNextRespawn = deadSpecialBosses
      .sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt;
  }
  const bossMob = getAliveMobs(zoneId, roomId, realmId).find((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.specialBoss;
  });
  if (bossMob) {
    const { entries } = buildDamageRankMap(bossMob);
    bossRank = entries.slice(0, 5).map(([name, damage]) => ({ name, damage }));
  }

  const roomPlayers = listOnlinePlayers(realmId)
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId)
    .map((p) => ({
      name: p.name,
      classId: p.classId,
      level: p.level,
      guild: p.guild?.name || null,
      guildId: p.guild?.id || null
    }));

  const data = {
    mobs,
    nextRespawn,
    exits: buildRoomExits(zoneId, roomId),
    roomPlayers,
    bossRank,
    bossNextRespawn
  };
  roomStateDataCache.set(cacheKey, { at: now, data });
  return data;
}

async function buildState(player) {
  computeDerived(player);
  const realmId = player.realmId || 1;
  const zone = WORLD[player.position.zone];
  const room = zone?.rooms[player.position.room];
  const isBoss = isBossRoom(player.position.zone, player.position.room, realmId);
  let mobs = [];
  let exits = [];
  let nextRespawn = null;
  let roomPlayers = [];
  let bossRank = [];
  let bossNextRespawn = null;
  if (isBoss) {
    const cached = getRoomCommonState(player.position.zone, player.position.room, realmId);
    mobs = cached.mobs;
    exits = cached.exits;
    nextRespawn = cached.nextRespawn;
    roomPlayers = cached.roomPlayers;
    bossRank = cached.bossRank;
    bossNextRespawn = cached.bossNextRespawn;
  } else {
    if (zone && room) spawnMobs(player.position.zone, player.position.room, realmId);
    // 根据房间内玩家数量调整世界BOSS属性
    adjustWorldBossStatsByPlayerCount(player.position.zone, player.position.room, realmId);
    mobs = getAliveMobs(player.position.zone, player.position.room, realmId).map((m) => ({
      id: m.id,
      name: m.name,
      hp: m.hp,
      max_hp: m.max_hp,
      mdef: m.mdef || 0
    }));
    const roomMobs = getRoomMobs(player.position.zone, player.position.room, realmId);
    const deadBosses = roomMobs.filter((m) => {
      const tpl = MOB_TEMPLATES[m.templateId];
      return tpl && m.hp <= 0 && isBossMob(tpl);
    });
    nextRespawn = deadBosses.length > 0
      ? deadBosses.sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt
      : null;
    exits = buildRoomExits(player.position.zone, player.position.room);
    roomPlayers = listOnlinePlayers(realmId)
      .filter((p) => p.position.zone === player.position.zone && p.position.room === player.position.room)
      .map((p) => ({
        name: p.name,
        classId: p.classId,
        level: p.level,
        guild: p.guild?.name || null,
        guildId: p.guild?.id || null,
        pk: p.pk || 0
      }));
  }
  const summonList = getAliveSummons(player);
  const summonPayloads = summonList.map((summon) => ({
    id: summon.id,
    name: summon.name,
    level: summon.level,
    levelMax: SUMMON_MAX_LEVEL,
    exp: summon.exp || 0,
    exp_next: SUMMON_EXP_PER_LEVEL,
    hp: summon.hp,
    max_hp: summon.max_hp,
    atk: summon.atk,
    def: summon.def,
    mdef: summon.mdef || 0
  }));

  // 检查房间是否有BOSS，获取下次刷新时间
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
  const party = getPartyByMember(player.name, realmId);
  const partyMembers = party
    ? party.members.map((name) => ({
        name,
        online: Boolean(playersByName(name, realmId))
      }))
    : null;
  const sabakBonus = Boolean(
    player.guild && getRealmState(realmId).sabakState.ownerGuildId &&
      String(player.guild.id) === String(getRealmState(realmId).sabakState.ownerGuildId)
  );
  const onlineCount = listOnlinePlayers(realmId).length;
  
  // VIP自领状态缓存
  let vipSelfClaimEnabled;
  if (Date.now() - vipSelfClaimLastUpdate > VIP_SELF_CLAIM_CACHE_TTL) {
    vipSelfClaimEnabled = await getVipSelfClaimEnabled();
    vipSelfClaimCachedValue = vipSelfClaimEnabled;
    vipSelfClaimLastUpdate = Date.now();
  } else {
    vipSelfClaimEnabled = vipSelfClaimCachedValue;
  }

  const { enabled: stateThrottleEnabled, intervalSec: stateThrottleIntervalSec, overrideServerAllowed } =
    await getStateThrottleSettingsCached();
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
      hp: Math.floor(player.hp),
      max_hp: Math.floor(player.max_hp),
      mp: Math.floor(player.mp),
      max_mp: Math.floor(player.max_mp),
      exp: Math.floor(player.exp),
      exp_next: Math.floor(expForLevel(player.level)),
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
    summon: summonPayloads[0] || null,
    summons: summonPayloads,
    equipment,
    guild: player.guild?.name || null,
    guild_role: player.guild?.role || null,
    party: party ? { size: party.members.length, leader: party.leader, members: partyMembers } : null,
    training: player.flags?.training || { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 },
    online: { count: onlineCount },
    trade: getTradeByPlayer(player.name, realmId) ? (() => {
      const trade = getTradeByPlayer(player.name, realmId);
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
      active: getSabakState(realmId).active,
      ownerGuildId: getSabakState(realmId).ownerGuildId,
      ownerGuildName: getSabakState(realmId).ownerGuildName,
      inPalace: isSabakPalace(player.position.zone, player.position.room),
      palaceKillStats: isSabakPalace(player.position.zone, player.position.room) ? getSabakPalaceKillStats(realmId) : null,
      siegeEndsAt: getSabakState(realmId).siegeEndsAt || null
    },
    worldBossRank: bossRank,
    worldBossNextRespawn: bossNextRespawn,
    players: roomPlayers,
    bossRespawn: nextRespawn,
    server_time: Date.now(),
    vip_self_claim_enabled: vipSelfClaimEnabled,
    state_throttle_enabled: stateThrottleEnabled,
    state_throttle_interval_sec: stateThrottleIntervalSec,
    state_throttle_override_server_allowed: overrideServerAllowed
  };
}

async function sendState(player) {
  if (!player.socket) return;
  const { enabled, intervalSec, overrideServerAllowed } = await getStateThrottleSettingsCached();
  const override = Boolean(player.stateThrottleOverride) && overrideServerAllowed;
  const inBossRoom = player.position
    ? isBossRoom(player.position.zone, player.position.room, player.realmId || 1)
    : false;
  let forceSend = Boolean(player.forceStateRefresh);
  let exitsHash = null;
  let roomKey = null;
  const key = getStateThrottleKey(player);
  const lastInBoss = key ? stateThrottleLastInBoss.get(key) : false;
  if (enabled && !override && !inBossRoom) {
    if (lastInBoss) {
      forceSend = true;
    }
    if (player.position) {
      roomKey = `${player.position.zone}:${player.position.room}`;
      const exits = buildRoomExits(player.position.zone, player.position.room);
      exitsHash = JSON.stringify(exits);
      const lastRoom = stateThrottleLastRoom.get(key);
      const lastHash = stateThrottleLastExits.get(key);
      if (lastRoom !== roomKey || lastHash !== exitsHash) {
        forceSend = true;
      }
    }
  }
  if (enabled && !override && !inBossRoom && !forceSend) {
    const now = Date.now();
    const lastSent = stateThrottleLastSent.get(key) || 0;
    if (now - lastSent < intervalSec * 1000) {
      return;
    }
    stateThrottleLastSent.set(key, now);
  } else if (enabled && !override && !inBossRoom) {
    stateThrottleLastSent.set(key, Date.now());
  }
  const state = await buildState(player);
  player.socket.emit('state', state);
  player.forceStateRefresh = false;
  if (exitsHash && key) {
    stateThrottleLastExits.set(key, exitsHash);
    if (roomKey) stateThrottleLastRoom.set(key, roomKey);
  }
  if (key) {
    stateThrottleLastInBoss.set(key, inBossRoom);
  }
}

async function sendRoomState(zoneId, roomId, realmId = 1) {
  const players = listOnlinePlayers(realmId)
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId);
  
  if (players.length === 0) return;
  
  // BOSS房间优化：批量处理，减少序列化开销
  const isBoss = isBossRoom(zoneId, roomId, realmId);
  
  if (isBoss && players.length > 5) {
    // BOSS房间且人很多时，使用节流，每100ms最多更新一次
    const cacheKey = `${realmId}:${zoneId}:${roomId}`;
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

function checkMobRespawn(realmId = 1) {
  // 检查所有房间的怪物刷新（包括BOSS和普通怪物）
  Object.keys(WORLD).forEach((zoneId) => {
    const zone = WORLD[zoneId];
    if (!zone?.rooms) return;

    Object.keys(zone.rooms).forEach((roomId) => {
      const room = zone.rooms[roomId];
      const mobs = spawnMobs(zoneId, roomId, realmId);

      // 根据房间内玩家数量调整世界BOSS属性
      adjustWorldBossStatsByPlayerCount(zoneId, roomId, realmId);

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
            locationData,
            realmId
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
  const summons = getSummons(player);
  if (!summons.length) return;
  let changed = false;
  const next = summons.map((summon) => {
    if (!summon || summon.hp <= 0) return summon;
    const skill = getSkill(player.classId, summon.id);
    if (!skill) return summon;
    const skillLevel = getSkillLevel(player, skill.id);
    let summonLevel = summon.summonLevel || summon.level || skillLevel || 1;
    let exp = summon.exp || 0;
    exp += 1;
    let leveled = false;
    while (summonLevel < SUMMON_MAX_LEVEL && exp >= SUMMON_EXP_PER_LEVEL) {
      exp -= SUMMON_EXP_PER_LEVEL;
      summonLevel += 1;
      leveled = true;
    }
    if (leveled) {
      const ratio = summon.max_hp ? summon.hp / summon.max_hp : 1;
      const nextSummon = summonStats(player, skill, summonLevel);
      const updated = { ...nextSummon, exp };
      updated.hp = clamp(Math.floor(updated.max_hp * ratio), 1, updated.max_hp);
      player.send(`${updated.name} 升到 ${summonLevel} 级。`);
      changed = true;
      return updated;
    }
    if (exp !== summon.exp) {
      changed = true;
    }
    return { ...summon, exp };
  });
  if (changed) {
    setSummons(player, next);
  }
}

function applyDamageToMob(mob, dmg, attackerName, realmId = null) {
  const mobTemplate = MOB_TEMPLATES[mob.templateId];
  const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
  const isWorldBoss = Boolean(mobTemplate?.worldBoss);

  // 特殊BOSS防御效果：受到攻击时触发
  if (isSpecialBoss) {
    const now = Date.now();

    // 检查无敌状态（免疫伤害、毒、麻痹、降攻击、降防效果）
    if (mob.status?.invincible && mob.status.invincible > now) {
      // 无敌状态，伤害为0
      if (attackerName) {
        const attacker = playersByName(attackerName, realmId);
        if (attacker) {
          attacker.send(`${mob.name} 处于无敌状态，免疫了所有伤害！`);
        }
      }
      return { damageTaken: false };
    }

    // 世界BOSS受到攻击时10%几率触发无敌效果（持续10秒）
    if (isWorldBoss && Math.random() <= 0.1) {
      if (!mob.status) mob.status = {};
      mob.status.invincible = now + 10000;

      // 清除所有毒效果和负面状态
      if (mob.status.activePoisons) {
        delete mob.status.activePoisons;
      }
      if (mob.status.poison) {
        delete mob.status.poison;
      }
      if (mob.status.debuffs) {
        delete mob.status.debuffs.poison;
        delete mob.status.debuffs.poisonEffect;
        delete mob.status.debuffs.weak;
        delete mob.status.debuffs.armorBreak;
      }

      if (attackerName) {
        const attacker = playersByName(attackerName, realmId);
        if (attacker) {
          const online = listOnlinePlayers(realmId);
          const roomPlayers = online.filter((p) =>
            p.position.zone === attacker.position.zone &&
            p.position.room === attacker.position.room &&
            p.hp > 0
          );
          roomPlayers.forEach((roomPlayer) => {
            roomPlayer.send(`${mob.name} 触发了无敌效果，10秒内免疫所有伤害、毒、麻痹、降攻击、降防效果！`);
          });
        }
      }
      return { damageTaken: false };
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
          'warn',
          null,
          realmId
        );
      }
    }
  }

  return { damageTaken: true, actualDamage: dmg };
}

function retaliateMobAgainstPlayer(mob, player, online) {
  if (!mob || mob.hp <= 0) return;
  if (mob.status && mob.status.stunTurns > 0) return;
  const primarySummon = getPrimarySummon(player);
  const summonAlive = Boolean(primarySummon);
  const mobTemplate = MOB_TEMPLATES[mob.templateId];
  const isBossAggro = Boolean(mobTemplate?.worldBoss || mobTemplate?.sabakBoss);
  let mobTarget = player.flags?.summonAggro || !summonAlive ? player : primarySummon;
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
      mobTarget = summonAlive ? primarySummon : player;
    }
  }
  const mobHitChance = calcHitChance(mob, mobTarget);
  if (Math.random() > mobHitChance) return;
  const isWorldBoss = Boolean(mobTemplate?.worldBoss);
  const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
  if (!isWorldBoss && !isSpecialBoss && mobTarget && mobTarget.evadeChance && Math.random() <= mobTarget.evadeChance) {
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

  // 特殊BOSS攻击效果
  const now = Date.now();
  if (isSpecialBoss) {

    // 10%几率触发无敌效果（持续10秒）
    if (Math.random() <= 0.1) {
      if (!mob.status) mob.status = {};
      mob.status.invincible = now + 10000;

      // 清除所有毒效果和负面状态
      if (mob.status.activePoisons) {
        delete mob.status.activePoisons;
      }
      if (mob.status.poison) {
        delete mob.status.poison;
      }
      if (mob.status.debuffs) {
        delete mob.status.debuffs.poison;
        delete mob.status.debuffs.poisonEffect;
        delete mob.status.debuffs.weak;
        delete mob.status.debuffs.armorBreak;
      }

      // 通知房间内所有玩家
      if (online && online.length > 0) {
        const roomPlayers = online.filter((p) =>
          p.position.zone === player.position.zone &&
          p.position.room === player.position.room &&
          p.hp > 0
        );
        roomPlayers.forEach((roomPlayer) => {
          roomPlayer.send(`${mob.name} 触发了无敌效果，10秒内免疫所有伤害、毒、麻痹、降攻击、降防效果！`);
        });
      }
    }

    // 20%几率触发破防效果
    if (Math.random() <= 0.2) {
      if (!mobTarget.status) mobTarget.status = {};
      if (!mobTarget.status.debuffs) mobTarget.status.debuffs = {};
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

    // 20%几率触发毒伤害效果：使目标持续掉血，每秒掉1%气血，持续5秒
    if (Math.random() <= 0.2) {
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
  }

  // 检查弱化效果（玩家佩戴弱化戒指对怪物施加）
  if (mob.status?.debuffs?.weak) {
    const weak = mob.status.debuffs.weak;
    if (weak.expiresAt && weak.expiresAt < now) {
      delete mob.status.debuffs.weak;
    } else {
      dmg = Math.floor(dmg * (1 - (weak.dmgReduction || 0)));
    }
  }

  if (mobTarget && mobTarget.userId) {
    const damageDealt = applyDamageToPlayer(mobTarget, dmg);
    mobTarget.send(`${mob.name} 对你造成 ${damageDealt} 点伤害。`);
    if (mobTarget !== player) {
      player.send(`${mob.name} 攻击 ${mobTarget.name}，造成 ${damageDealt} 点伤害。`);
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
        const splashDealt = applyDamageToPlayer(splashTarget, splashDmg);
        splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDealt} 点伤害。`);
        if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
          handleDeath(splashTarget);
        }
        
        // 溅射到召唤物
        const splashSummons = getAliveSummons(splashTarget);
        splashSummons.forEach((summon) => {
          applyDamageToSummon(summon, splashDmg);
          splashTarget.send(`${mob.name} 的攻击溅射到 ${summon.name}，造成 ${splashDmg} 点伤害。`);
          if (summon.hp <= 0) {
            splashTarget.send(`${summon.name} 被击败。`);
            removeSummonById(splashTarget, summon.id);
            autoResummon(splashTarget, summon.id);
          }
        });
      });
      
      // 溅射到主目标的召唤物（如果主目标是玩家且有召唤物）
      if (mobTarget && mobTarget.userId) {
        const targetSummons = getAliveSummons(mobTarget);
        targetSummons.forEach((summon) => {
        applyDamageToSummon(summon, splashDmg);
        mobTarget.send(`${mob.name} 的攻击溅射到 ${summon.name}，造成 ${splashDmg} 点伤害。`);
        if (summon.hp <= 0) {
          mobTarget.send(`${summon.name} 被击败。`);
            removeSummonById(mobTarget, summon.id);
            autoResummon(mobTarget, summon.id);
          }
        });
      }
    }
    
    return;
  }
  applyDamageToSummon(mobTarget, dmg);
  player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
  
  // 特殊BOSS溅射效果：主目标是召唤物时，对玩家和房间所有其他玩家及召唤物造成BOSS攻击力50%的溅射伤害
  if (isSpecialBoss && online && online.length > 0) {
    const splashDmg = Math.floor(mob.atk * 0.5);
    
    // 溅射到召唤物的主人
    if (player && player.hp > 0) {
    const splashDealt = applyDamageToPlayer(player, splashDmg);
    player.send(`${mob.name} 的攻击溅射到你，造成 ${splashDealt} 点伤害。`);
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
      const splashDealt = applyDamageToPlayer(splashTarget, splashDmg);
      splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDealt} 点伤害。`);
      if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
        handleDeath(splashTarget);
      }
      
      // 溅射到其他玩家的召唤物
      const splashSummons = getAliveSummons(splashTarget);
      splashSummons.forEach((summon) => {
        applyDamageToSummon(summon, splashDmg);
        splashTarget.send(`${mob.name} 的攻击溅射到 ${summon.name}，造成 ${splashDmg} 点伤害。`);
        if (summon.hp <= 0) {
          splashTarget.send(`${summon.name} 被击败。`);
          removeSummonById(splashTarget, summon.id);
          autoResummon(splashTarget, summon.id);
        }
      });
    });
  }
  
  if (mobTarget.hp <= 0) {
    player.send(`${mobTarget.name} 被击败。`);
    removeSummonById(player, mobTarget.id);
    autoResummon(player, mobTarget.id);
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
  const buff = target.status?.buffs?.mdefBuff;
  if (buff) {
    if (buff.expiresAt && buff.expiresAt < now) {
      delete target.status.buffs.mdefBuff;
    } else {
      multiplier *= buff.mdefMultiplier || 1;
    }
  }
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

function calcTaoistDamageFromValue(value, target) {
  const base = Math.max(0, value || 0);
  let defBonus = 0;
  const defBuff = target.status?.buffs?.defBuff;
  if (defBuff) {
    if (defBuff.expiresAt && defBuff.expiresAt < Date.now()) {
      delete target.status.buffs.defBuff;
    } else {
      defBonus = defBuff.defBonus || 0;
    }
  }
  const defMultiplier = getDefenseMultiplier(target);
  const baseDef = (target.def || 0) + defBonus;
  const def = Math.floor(baseDef * defMultiplier);
  const mdefMultiplier = getMagicDefenseMultiplier(target);
  const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
  const dmg = Math.floor((base + randInt(0, base / 2)) - def * 0.3 - mdef * 0.3);
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
  if (!attacker?.flags?.hasPoisonEffect) return false;
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
  const roomMobs = getAliveMobs(player.position.zone, player.position.room, player.realmId || 1);
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
  socket.on('state_throttle_override', (payload) => {
    socket.data.stateThrottleOverride = payload?.enabled === true;
    const player = players.get(socket.id);
    if (player) {
      player.stateThrottleOverride = socket.data.stateThrottleOverride;
    }
  });
  socket.on('auth', async ({ token, name, realmId: rawRealmId }) => {
    const session = await getSession(token);
    if (!session) {
      socket.emit('auth_error', { error: '登录已过期。' });
      socket.disconnect();
      return;
    }

    let realmInfo = await resolveRealmId(rawRealmId);
    // 如果请求的区服不存在（合区后可能发生），使用第一个可用的区服
    if (realmInfo.error) {
      const realms = await listRealms();
      if (Array.isArray(realms) && realms.length > 0) {
        realmInfo = { realmId: realms[0].id };
      } else {
        socket.emit('auth_error', { error: realmInfo.error });
        socket.disconnect();
        return;
      }
    }

    const loaded = await loadCharacter(session.user_id, name, realmInfo.realmId);
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
        const party = getPartyByMember(name, existingPlayer.realmId || realmInfo.realmId);
        if (party) {
          party.members = party.members.filter(m => m !== name);
          if (party.members.length === 0) {
            getRealmState(existingPlayer.realmId || realmInfo.realmId).parties.delete(party.id);
          }
        }
      }
    }

    computeDerived(loaded);
    loaded.userId = session.user_id;
    loaded.realmId = realmInfo.realmId;
    loaded.socket = socket;
    loaded.send = (msg) => sendTo(loaded, msg);
    loaded.combat = null;
    loaded.guild = null;
    if (!loaded.flags) loaded.flags = {};
    loaded.stateThrottleOverride = socket.data?.stateThrottleOverride === true;
    const throttleKey = getStateThrottleKey(loaded, socket);
    if (throttleKey) {
      stateThrottleLastSent.delete(throttleKey);
      stateThrottleLastExits.delete(throttleKey);
      stateThrottleLastRoom.delete(throttleKey);
      stateThrottleLastInBoss.delete(throttleKey);
    }

    // 自动恢复召唤物
    const savedSummons = Array.isArray(loaded.flags.savedSummons)
      ? loaded.flags.savedSummons
      : (loaded.flags.savedSummon ? [loaded.flags.savedSummon] : []);
    if (savedSummons.length) {
      savedSummons.forEach((saved) => {
        const skill = getSkill(loaded.classId, saved.id);
        if (skill && loaded.mp >= skill.mp) {
          const skillLevel = getSkillLevel(loaded, skill.id);
          const summon = summonStats(loaded, skill, skillLevel);
          const restored = { ...summon, exp: saved.exp || 0 };
          restored.hp = Math.min(saved.hp || restored.max_hp, restored.max_hp);
          loaded.mp = clamp(loaded.mp - skill.mp, 0, loaded.max_mp);
          addOrReplaceSummon(loaded, restored);
          loaded.send(`${restored.name} 已重新召唤 (等级 ${restored.level})。`);
        }
      });
      // 清除保存的召唤物数据
      delete loaded.flags.savedSummon;
      delete loaded.flags.savedSummons;
    }

    if (loaded.flags?.partyId && Array.isArray(loaded.flags.partyMembers) && loaded.flags.partyMembers.length) {
      const partyId = loaded.flags.partyId;
      const memberList = Array.from(new Set(loaded.flags.partyMembers.concat(loaded.name)));
      let party = getPartyById(partyId, loaded.realmId || 1);
      if (!party) {
        getRealmState(loaded.realmId || 1).parties.set(partyId, {
          id: partyId,
          leader: loaded.flags.partyLeader || memberList[0] || loaded.name,
          members: memberList,
          lootIndex: 0
        });
        party = getRealmState(loaded.realmId || 1).parties.get(partyId);
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

    const member = await getGuildMember(session.user_id, name, loaded.realmId || 1);
    if (member && member.guild) {
      loaded.guild = { id: member.guild.id, name: member.guild.name, role: member.role };
    }

    players.set(socket.id, loaded);
    loaded.send(`欢迎回来，${loaded.name}。`);
    loaded.send(`金币: ${loaded.gold}`);
    if (loaded.guild) loaded.send(`行会: ${loaded.guild.name}`);
    // 加入服务器房间，以便接收公告
    const serverId = loaded.realmId || 1;
    socket.join(`realm:${serverId}`);
    applyOfflineRewards(loaded);
    spawnMobs(loaded.position.zone, loaded.position.room, loaded.realmId || 1);
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
      players: listOnlinePlayers(player.realmId || 1),
      allCharacters: listAllCharacters(player.realmId || 1),
      input: payload.text || '',
      source: payload.source || '',
      send: (msg) => sendTo(player, msg),
      onMove: ({ from, to }) => {
        if (from && from.zone && from.room) {
          sendRoomState(from.zone, from.room, player.realmId || 1);
        }
        if (to && to.zone && to.room) {
          sendRoomState(to.zone, to.room, player.realmId || 1);
        }
      },
      partyApi: {
        parties: getRealmState(player.realmId || 1).parties,
        invites: getRealmState(player.realmId || 1).partyInvites,
        followInvites: getRealmState(player.realmId || 1).partyFollowInvites,
        createParty: (leaderName) => createParty(leaderName, player.realmId || 1),
        getPartyByMember: (name) => getPartyByMember(name, player.realmId || 1),
        removeFromParty: (name) => removeFromParty(name, player.realmId || 1),
        persistParty: (party) => persistParty(party, player.realmId || 1),
        clearPartyFlags: (name) => clearPartyFlags(name, player.realmId || 1)
      },
      guildApi: {
        invites: getRealmState(player.realmId || 1).guildInvites,
        createGuild: (name, leaderUserId, leaderCharName) =>
          createGuild(name, leaderUserId, leaderCharName, player.realmId || 1),
        getGuildByName,
        addGuildMember: (guildId, userId, charName) =>
          addGuildMember(guildId, userId, charName, player.realmId || 1),
        removeGuildMember: (guildId, userId, charName) =>
          removeGuildMember(guildId, userId, charName, player.realmId || 1),
        leaveGuild: (userId, charName) =>
          leaveGuild(userId, charName, player.realmId || 1),
        listGuildMembers,
        isGuildLeader: (guildId, userId, charName) =>
          isGuildLeader(guildId, userId, charName, player.realmId || 1),
        isGuildLeaderOrVice: (guildId, userId, charName) =>
          isGuildLeaderOrVice(guildId, userId, charName, player.realmId || 1),
        setGuildMemberRole: (guildId, userId, charName, role) =>
          setGuildMemberRole(guildId, userId, charName, role, player.realmId || 1),
        transferGuildLeader: (guildId, oldLeaderUserId, oldLeaderCharName, newLeaderUserId, newLeaderCharName) =>
          transferGuildLeader(guildId, oldLeaderUserId, oldLeaderCharName, newLeaderUserId, newLeaderCharName, player.realmId || 1),
        registerSabak: (guildId) => registerSabak(guildId, player.realmId || 1),
        applyToGuild: (guildId) => applyToGuild(guildId, player.userId, player.name, player.realmId || 1),
        listGuildApplications: (guildId) => listGuildApplications(guildId, player.realmId || 1),
        removeGuildApplication: (guildId, userId) => removeGuildApplication(guildId, userId, player.realmId || 1),
        approveGuildApplication: (guildId, userId, charName) => approveGuildApplication(guildId, userId, charName, player.realmId || 1),
        getApplicationByUser: () => getApplicationByUser(player.userId, player.realmId || 1),
        listAllGuilds: () => listAllGuilds(player.realmId || 1),
        listSabakRegistrations: () => listSabakRegistrations(player.realmId || 1),
        hasSabakRegistrationToday: (guildId) => hasSabakRegistrationToday(guildId, player.realmId || 1),
        sabakState: getSabakState(player.realmId || 1),
        sabakConfig,
        sabakWindowInfo,
        useVipCode,
        createVipCodes,
        getVipSelfClaimEnabled,
        setVipSelfClaimEnabled,
        canUserClaimVip,
        incrementCharacterVipClaimCount
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

  socket.on('state_request', async () => {
    const player = players.get(socket.id);
    if (!player) return;
    player.forceStateRefresh = true;
    await sendState(player);
  });

  socket.on('mail_list', async () => {
    const player = players.get(socket.id);
    if (!player) return;
    const mails = await listMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload) });
  });

  socket.on('mail_send', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const toName = String(payload?.toName || '').trim();
    const title = String(payload?.title || '').trim();
    const body = String(payload?.body || '').trim();
    const itemsPayload = Array.isArray(payload?.items) ? payload.items : [];
    const gold = Math.max(0, Number(payload?.gold || 0));
    if (!toName) return socket.emit('mail_send_result', { ok: false, msg: '请输入收件人。' });
    if (!title) return socket.emit('mail_send_result', { ok: false, msg: '请输入邮件标题。' });
    if (!body) return socket.emit('mail_send_result', { ok: false, msg: '请输入邮件内容。' });

    const target = await findCharacterByNameInRealm(toName, player.realmId || 1);
    if (!target) return socket.emit('mail_send_result', { ok: false, msg: '收件人不存在。' });

    const items = [];
    if (itemsPayload.length) {
      const grouped = new Map();
      itemsPayload.forEach((entry) => {
        const key = String(entry?.key || '').trim();
        if (!key) return;
        const qty = Math.max(1, Number(entry?.qty || 1));
        grouped.set(key, (grouped.get(key) || 0) + qty);
      });
        for (const [key, totalQty] of grouped.entries()) {
          const slot = resolveInventorySlotByKey(player, key);
          if (!slot) return socket.emit('mail_send_result', { ok: false, msg: '背包里没有该物品。' });
          const item = ITEM_TEMPLATES[slot.id];
          if (!item) return socket.emit('mail_send_result', { ok: false, msg: '物品不存在。' });
          if (item.untradable || item.unconsignable) {
            return socket.emit('mail_send_result', { ok: false, msg: '该物品无法通过邮件赠送。' });
          }
          if (item.type === 'currency') return socket.emit('mail_send_result', { ok: false, msg: '金币无法赠送。' });
          const qty = Math.max(1, Number(totalQty));
          if (qty > Number(slot.qty || 0)) {
            return socket.emit('mail_send_result', { ok: false, msg: '附件数量超过背包数量。' });
          }
        }
        for (const [key, totalQty] of grouped.entries()) {
          const slot = resolveInventorySlotByKey(player, key);
          if (!slot) continue;
          const qty = Math.max(1, Number(totalQty));
          if (!removeItem(player, slot.id, qty, slot.effects)) {
            return socket.emit('mail_send_result', { ok: false, msg: '附件数量超过背包数量。' });
          }
        items.push({
          id: slot.id,
          qty,
          effects: slot.effects || null,
          durability: slot.durability ?? null,
          max_durability: slot.max_durability ?? null
        });
      }
    }

    if (gold > 0) {
      if (player.gold < gold) {
        items.forEach((entry) => {
          addItem(player, entry.id, entry.qty || 1, entry.effects || null, entry.durability ?? null, entry.max_durability ?? null);
        });
        return socket.emit('mail_send_result', { ok: false, msg: '金币不足。' });
      }
      player.gold -= gold;
    }

    await sendMail(target.user_id, toName, player.name, player.userId, title, body, items.length ? items : null, gold, player.realmId || 1);
    const onlineTarget = playersByName(toName, player.realmId || 1);
    if (onlineTarget) {
      onlineTarget.send(`你收到来自 ${player.name} 的邮件：${title}`);
    }
    socket.emit('mail_send_result', { ok: true, msg: '邮件已发送。' });
    await sendState(player);
    await savePlayer(player);
  });

  socket.on('mail_claim', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const mailId = Number(payload?.mailId || 0);
    if (!mailId) return socket.emit('mail_claim_result', { ok: false, msg: '邮件ID无效。' });
    const mails = await listMail(player.userId, player.realmId || 1);
    const mail = mails.find((m) => m.id === mailId);
    if (!mail) return socket.emit('mail_claim_result', { ok: false, msg: '邮件不存在。' });
    if (mail.claimed_at) return socket.emit('mail_claim_result', { ok: false, msg: '附件已领取。' });
    const items = parseJson(mail.items_json, []);
    const gold = Number(mail.gold || 0);
    if ((!items || !items.length) && gold <= 0) {
      await markMailRead(player.userId, mailId, player.realmId || 1);
      return socket.emit('mail_claim_result', { ok: false, msg: '该邮件没有附件。' });
    }
    if (items && items.length) {
      items.forEach((entry) => {
        if (!entry || !entry.id) return;
        addItem(player, entry.id, entry.qty || 1, entry.effects || null, entry.durability ?? null, entry.max_durability ?? null);
      });
    }
    if (gold > 0) {
      player.gold += gold;
    }
    await markMailClaimed(player.userId, mailId, player.realmId || 1);
    await markMailRead(player.userId, mailId, player.realmId || 1);
    socket.emit('mail_claim_result', { ok: true, msg: '附件已领取。' });
    await sendState(player);
    await savePlayer(player);
  });

  socket.on('mail_read', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const mailId = Number(payload?.mailId || 0);
    if (!mailId) return;
    await markMailRead(player.userId, mailId, player.realmId || 1);
    const mails = await listMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload) });
  });

  socket.on('mail_list_sent', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const mails = await listSentMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload), folder: 'sent' });
  });

  socket.on('mail_delete', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const mailId = Number(payload?.mailId || 0);
    const folder = payload?.folder || 'inbox';
    if (!mailId) return socket.emit('mail_delete_result', { ok: false, msg: '邮件ID无效。' });
    await deleteMail(player.userId, mailId, player.realmId || 1, folder);
    socket.emit('mail_delete_result', { ok: true, msg: '邮件已删除。' });
    if (folder === 'inbox') {
      const mails = await listMail(player.userId, player.realmId || 1);
      socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload) });
    } else if (folder === 'sent') {
      const mails = await listSentMail(player.userId, player.realmId || 1);
      socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload), folder: 'sent' });
    }
  });

  socket.on('guild_members', async () => {
    const player = players.get(socket.id);
    if (!player || !player.guild) {
      socket.emit('guild_members', { ok: false, error: '你不在行会中。' });
      return;
    }
    const members = await listGuildMembers(player.guild.id, player.realmId || 1);
    const online = listOnlinePlayers(player.realmId || 1);
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

  socket.on('guild_list', async () => {
    const player = players.get(socket.id);
    if (!player) return;
    const guilds = await listAllGuilds(player.realmId || 1);
    socket.emit('guild_list', { ok: true, guilds });
  });

  socket.on('guild_apply', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    if (!payload || !payload.guildId) return socket.emit('guild_apply_result', { ok: false, msg: '参数错误' });

    if (player.guild) {
      return socket.emit('guild_apply_result', { ok: false, msg: '你已经有行会了' });
    }

    // 检查是否已有申请
    const existingApp = await getApplicationByUser(player.userId, player.realmId || 1);
    if (existingApp) {
      return socket.emit('guild_apply_result', { ok: false, msg: '你已经申请了行会，请等待处理' });
    }

    const guild = await getGuildById(payload.guildId);
    if (!guild || String(guild.realm_id) !== String(player.realmId || 1)) {
      return socket.emit('guild_apply_result', { ok: false, msg: '行会不存在' });
    }

    await applyToGuild(payload.guildId, player.userId, player.name, player.realmId || 1);
    socket.emit('guild_apply_result', { ok: true, msg: `已申请加入行会 ${guild.name}` });

    // 通知在线的会长和副会长
    const members = await listGuildMembers(payload.guildId, player.realmId || 1);
    members.forEach((m) => {
      if (m.role === 'leader' || m.role === 'vice_leader') {
        const onlineMember = players.get(socketIds.get(m.char_name));
        if (onlineMember) {
          onlineMember.send(`${player.name} 申请加入行会`);
        }
      }
    });
  });

  socket.on('guild_applications', async () => {
    const player = players.get(socket.id);
    if (!player || !player.guild) {
      return socket.emit('guild_applications', { ok: false, error: '你不在行会中' });
    }

    const isLeaderOrVice = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
    if (!isLeaderOrVice) {
      return socket.emit('guild_applications', { ok: false, error: '只有会长或副会长可以查看申请' });
    }

    const applications = await listGuildApplications(player.guild.id, player.realmId || 1);
    socket.emit('guild_applications', { ok: true, applications });
  });

  socket.on('guild_approve', async (payload) => {
    const player = players.get(socket.id);
    if (!player || !player.guild) return;
    if (!payload || !payload.charName) return socket.emit('guild_approve_result', { ok: false, msg: '参数错误' });

    const isLeaderOrVice = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
    if (!isLeaderOrVice) {
      return socket.emit('guild_approve_result', { ok: false, msg: '只有会长或副会长可以批准申请' });
    }

    const applications = await listGuildApplications(player.guild.id, player.realmId || 1);
    const targetApp = applications.find((a) => a.char_name === payload.charName);
    if (!targetApp) {
      return socket.emit('guild_approve_result', { ok: false, msg: '该玩家没有申请加入你的行会' });
    }

    try {
      await approveGuildApplication(player.guild.id, targetApp.user_id, payload.charName, player.realmId || 1);
      socket.emit('guild_approve_result', { ok: true, msg: `已批准 ${payload.charName} 加入行会` });

      const onlineTarget = players.get(socketIds.get(payload.charName));
      if (onlineTarget) {
        onlineTarget.guild = { id: player.guild.id, name: player.guild.name, role: 'member' };
        onlineTarget.send(`你的申请已被批准，已加入行会 ${player.guild.name}`);
      }
    } catch (err) {
      if (err.message.includes('已经在行会')) {
        socket.emit('guild_approve_result', { ok: false, msg: err.message });
      } else {
        console.error('[guild_approve] Error:', err);
        socket.emit('guild_approve_result', { ok: false, msg: '批准申请失败' });
      }
    }
  });

  socket.on('guild_reject', async (payload) => {
    const player = players.get(socket.id);
    if (!player || !player.guild) return;
    if (!payload || !payload.charName) return socket.emit('guild_reject_result', { ok: false, msg: '参数错误' });

    const isLeaderOrVice = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
    if (!isLeaderOrVice) {
      return socket.emit('guild_reject_result', { ok: false, msg: '只有会长或副会长可以拒绝申请' });
    }

    const applications = await listGuildApplications(player.guild.id, player.realmId || 1);
    const targetApp = applications.find((a) => a.char_name === payload.charName);
    if (!targetApp) {
      return socket.emit('guild_reject_result', { ok: false, msg: '该玩家没有申请加入你的行会' });
    }

    await removeGuildApplication(player.guild.id, targetApp.user_id, player.realmId || 1);
    socket.emit('guild_reject_result', { ok: true, msg: `已拒绝 ${payload.charName} 的申请` });

    const onlineTarget = players.get(socketIds.get(payload.charName));
    if (onlineTarget) {
      onlineTarget.send('你的加入行会申请已被拒绝');
    }
  });

  socket.on('sabak_info', async () => {
    const player = players.get(socket.id);
    if (!player) return;

    const sabakState = getSabakState(player.realmId || 1);
    const ownerGuildName = sabakState.ownerGuildName || '无';
    const windowInfo = sabakWindowInfo();
    const registrations = await listSabakRegistrations(player.realmId || 1);
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const todaysRegistrations = (registrations || []).filter((r) => {
      if (!r.registered_at) return false;
      const regTime = new Date(r.registered_at).getTime();
      return regTime >= start.getTime() && regTime < end.getTime();
    });

    // 将守城方行会添加到报名列表中显示
    let displayRegistrations = todaysRegistrations || [];
    if (sabakState.ownerGuildId && sabakState.ownerGuildName) {
      // 过滤掉守城方行会（如果它在报名列表中）
      displayRegistrations = displayRegistrations.filter(r => String(r.guild_id) !== String(sabakState.ownerGuildId));
      // 将守城方添加到列表最前面
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
    const sabakState = getSabakState(player.realmId || 1);
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
    const registrations = await listSabakRegistrations(player.realmId || 1);
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
        await registerSabak(player.guild.id, player.realmId || 1);
      player.send('已报名沙巴克攻城，支付500万金币。');
    } catch {
      player.send('该行会已经报名。');
      player.gold += 5000000;
    }
  });

  socket.on('disconnect', async (reason) => {
    const player = players.get(socket.id);
      if (player) {
        console.log(`[disconnect] ${player.name} (${player.userId || 'unknown'}) reason=${reason || 'unknown'}`);
        if (!player.flags) player.flags = {};
        player.flags.offlineAt = Date.now();
      setSummons(player, []);
        const trade = getTradeByPlayer(player.name, player.realmId || 1);
      if (trade) {
        clearTrade(trade, `交易已取消（${player.name} 离线）。`, player.realmId || 1);
      }
      await savePlayer(player);
      getRealmState(player.realmId || 1).lastSaveTime.delete(player.name); // 清理保存时间记录
      const throttleKey = getStateThrottleKey(player, socket);
      if (throttleKey) {
        stateThrottleLastSent.delete(throttleKey);
        stateThrottleLastExits.delete(throttleKey);
        stateThrottleLastRoom.delete(throttleKey);
        stateThrottleLastInBoss.delete(throttleKey);
      }
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
  const autoSkill = player.flags.autoSkillId;
  const autoHealEnabled = autoSkill === 'all'
    || (Array.isArray(autoSkill) && autoSkill.includes('heal'))
    || autoSkill === 'heal';
  const autoGroupHealEnabled = autoSkill === 'all'
    || (Array.isArray(autoSkill) && autoSkill.includes('group_heal'))
    || autoSkill === 'group_heal';
  if (!autoHealEnabled && !autoGroupHealEnabled) return false;
  const learned = getLearnedSkills(player);
  const healSkill = learned.find((skill) => skill.type === 'heal');
  const groupHealSkill = learned.find((skill) => skill.type === 'heal_group');
  if (!healSkill) return false;

  const healThreshold = 0.2;
  const candidates = [];

  if (player.hp / player.max_hp < healThreshold) {
    candidates.push({ target: player, name: player.name });
  }

  const playerSummons = getAliveSummons(player);
  playerSummons.forEach((summon) => {
    if (summon.hp / summon.max_hp < healThreshold) {
      candidates.push({ target: summon, name: summon.name, isSummon: true });
    }
  });

  const party = getPartyByMember(player.name, player.realmId || 1);
  if (party && party.members.length > 0) {
    party.members.forEach((memberName) => {
      if (memberName === player.name) return;
      const member = playersByName(memberName, player.realmId || 1);
      if (member &&
          member.position.zone === player.position.zone &&
          member.position.room === player.position.room &&
          member.hp / member.max_hp < healThreshold) {
        candidates.push({ target: member, name: member.name });
      }
    });
  }

  if (candidates.length === 0) return false;

  const summonTargets = [];
  if (party && party.members.length > 0) {
    party.members.forEach((memberName) => {
      const member = playersByName(memberName, player.realmId || 1);
      if (member) {
        const memberSummons = getAliveSummons(member);
        memberSummons.forEach((summon) => {
          summonTargets.push({ target: summon, name: summon.name, isSummon: true });
        });
      }
    });
  } else if (playerSummons.length) {
    playerSummons.forEach((summon) => {
      summonTargets.push({ target: summon, name: summon.name, isSummon: true });
    });
  }
  const allCandidates = candidates.concat(summonTargets);

  if (autoGroupHealEnabled && groupHealSkill && player.mp >= groupHealSkill.mp) {
    const hasLow = allCandidates.some((c) => c.target.hp / c.target.max_hp < healThreshold);
    if (hasLow) {
      player.mp = clamp(player.mp - groupHealSkill.mp, 0, player.max_mp);
      const baseHeal = Math.floor(getSpiritValue(player) * 0.8 * scaledSkillPower(healSkill, getSkillLevel(player, healSkill.id)) + player.level * 4);
      const groupHeal = Math.max(1, Math.floor(baseHeal * 0.3));
      candidates.forEach((entry) => {
        if (entry.isSummon) return;
        const heal = Math.max(1, Math.floor(groupHeal * getHealMultiplier(entry.target)));
        entry.target.hp = clamp(entry.target.hp + heal, 1, entry.target.max_hp);
        if (entry.target !== player && typeof entry.target.send === 'function') {
          entry.target.send(`${player.name} 自动为你施放 ${groupHealSkill.name}，恢复 ${heal} 点生命。`);
        }
      });
      summonTargets.forEach((entry) => {
        entry.target.hp = clamp(entry.target.hp + groupHeal, 1, entry.target.max_hp);
      });
      player.send(`自动施放 ${groupHealSkill.name}，为队伍成员恢复生命。`);
      return true;
    }
  }

  if (!autoHealEnabled || player.mp < healSkill.mp) return false;
  candidates.sort((a, b) => (a.target.hp / a.target.max_hp) - (b.target.hp / b.target.max_hp));
  const toHeal = candidates[0];

  player.mp = clamp(player.mp - healSkill.mp, 0, player.max_mp);
  const baseHeal = Math.floor(getSpiritValue(player) * 0.8 * scaledSkillPower(healSkill, getSkillLevel(player, healSkill.id)) + player.level * 4);
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

function applyBuff(target, buff) {
  if (!target.status) target.status = {};
  if (!target.status.buffs) target.status.buffs = {};
  target.status.buffs[buff.key] = buff;
}

function tryAutoBuff(player) {
  if (!player.flags?.autoSkillId) return false;
  const autoSkill = player.flags.autoSkillId;
  const learnedBuffs = getLearnedSkills(player).filter((skill) =>
    skill.type === 'buff_def' || skill.type === 'buff_mdef' || skill.type === 'buff_shield' || skill.type === 'stealth_group'
  );
  if (!learnedBuffs.length) return false;

  const enabledIds = autoSkill === 'all'
    ? new Set(learnedBuffs.map((skill) => skill.id))
    : new Set(Array.isArray(autoSkill) ? autoSkill : [autoSkill]);
  const enabledSkills = learnedBuffs.filter((skill) => enabledIds.has(skill.id));
  if (!enabledSkills.length) return false;

  const now = Date.now();
  for (const buffSkill of enabledSkills) {
    if (player.mp < buffSkill.mp) continue;
    if (buffSkill.cooldown) {
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      const lastUse = player.status.skillCooldowns[buffSkill.id] || 0;
      const cooldownRemaining = lastUse + buffSkill.cooldown - now;
      if (cooldownRemaining > 0) continue;
    }
    if (buffSkill.type === 'buff_shield') {
      const shield = player.status?.buffs?.magicShield;
      if (shield && (!shield.expiresAt || shield.expiresAt >= now + 5000)) continue;
      player.mp = clamp(player.mp - buffSkill.mp, 0, player.max_mp);
      const skillLevel = getSkillLevel(player, buffSkill.id);
      const duration = 120 + skillLevel * 60;
      const ratio = 0.6 + (skillLevel - 1) * 0.1;
      applyBuff(player, { key: 'magicShield', expiresAt: now + duration * 1000, ratio });
      player.send(`自动施放 ${buffSkill.name}，持续 ${duration} 秒。`);
      return true;
    }

    const party = getPartyByMember(player.name, player.realmId || 1);
    const members = party
      ? listOnlinePlayers(player.realmId || 1).filter(
          (p) =>
            party.members.includes(p.name) &&
            p.position.zone === player.position.zone &&
            p.position.room === player.position.room
        )
      : [player];
    const targets = members.slice();
    members.forEach((p) => {
      const summons = getAliveSummons(p);
      summons.forEach((summon) => targets.push(summon));
    });

    if (buffSkill.type === 'stealth_group') {
      const duration = 5;
      const alreadyActive = targets.every((p) => {
        const invincibleUntil = p.status?.invincible || 0;
        return invincibleUntil >= now + 1000;
      });
      if (alreadyActive) continue;

      player.mp = clamp(player.mp - buffSkill.mp, 0, player.max_mp);
      targets.forEach((p) => {
        if (!p.status) p.status = {};
        if (!p.status.buffs) p.status.buffs = {};
        p.status.invincible = now + duration * 1000;
        applyBuff(p, { key: 'spiritBoost', expiresAt: now + duration * 1000, multiplier: 2 });
        if (p.send && p.name && p.name !== player.name) {
          p.send(`${player.name} 自动为你施放 ${buffSkill.name}。`);
        }
      });
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      if (buffSkill.cooldown) {
        player.status.skillCooldowns[buffSkill.id] = Date.now();
      }
      player.send(`自动施放 ${buffSkill.name}，自己和召唤物 ${duration} 秒内免疫所有伤害，道术提升100%。`);
      return true;
    }

    const buffKey = buffSkill.type === 'buff_mdef' ? 'mdefBuff' : 'defBuff';
    const multiplierKey = buffSkill.type === 'buff_mdef' ? 'mdefMultiplier' : 'defMultiplier';
    const buffActive = targets.every((p) => {
      const buff = p.status?.buffs?.[buffKey];
      if (!buff) return false;
      if (buff.expiresAt && buff.expiresAt < now + 5000) return false;
      return true;
    });
    if (buffActive) continue;

    player.mp = clamp(player.mp - buffSkill.mp, 0, player.max_mp);
    const duration = 60;
    const buffPayload = { key: buffKey, expiresAt: now + duration * 1000, [multiplierKey]: 1.1 };

    targets.forEach((p) => {
      applyBuff(p, buffPayload);
      if (p.send && p.name !== player.name) {
        p.send(`${player.name} 自动为你施放 ${buffSkill.name}。`);
      }
    });
    player.send(`自动施放 ${buffSkill.name}，持续 ${duration} 秒。`);
    return true;
  }
  return false;
}

function pickCombatSkillId(player, combatSkillId) {
  const isCombatSkill = (skill) =>
    Boolean(skill && ['attack', 'spell', 'cleave', 'dot', 'aoe'].includes(skill.type));
  if (player.flags?.autoSkillId) {
    const autoSkill = player.flags.autoSkillId;
    const now = Date.now();
    
    // 辅助函数：检查技能是否可用（不在CD且MP足够）
    const isSkillUsable = (skill) => {
      if (!skill || player.mp < skill.mp) return false;
      if (skill.cooldown) {
        if (!player.status?.skillCooldowns) return true;
        const lastUse = player.status.skillCooldowns[skill.id] || 0;
        const cooldownRemaining = lastUse + skill.cooldown - now;
        if (cooldownRemaining > 0) return false;
      }
      // 召唤技能：如果召唤物还存活，跳过该技能
      if (skill.type === 'summon' && hasAliveSummon(player, skill.id)) {
        return false;
      }
      return true;
    };
    
      if (Array.isArray(autoSkill)) {
        const choices = autoSkill
          .map((id) => getSkill(player.classId, id))
          .filter((skill) => isCombatSkill(skill) && isSkillUsable(skill));
        
        if (!choices.length) {
          // 未选中可用的输出技能时，保持默认攻击而不是替换为其他技能
          return combatSkillId;
        }
        return choices[randInt(0, choices.length - 1)].id;
      }
    
    const autoId = autoSkill === 'all'
      ? selectAutoSkill(player)
      : autoSkill;
    
    // 单技能时也要检查CD
    if (autoId && autoId !== 'all') {
      const skill = getSkill(player.classId, autoId);
      if (!isCombatSkill(skill)) {
        return combatSkillId;
      }
      if (skill && skill.cooldown && !isSkillUsable(skill)) {
        // 主技能在CD中，尝试从其他学会的技能中选择
        const fallbackSkills = getLearnedSkills(player).filter((skill) =>
          ['attack', 'spell', 'cleave', 'dot', 'aoe'].includes(skill.type) && skill.id !== autoId
        );
        const fallbackChoices = fallbackSkills.filter((skill) => isSkillUsable(skill));
        if (fallbackChoices.length) {
          fallbackChoices.sort((a, b) => (b.power || 1) - (a.power || 1));
          return fallbackChoices[0].id;
        }
        // 没有其他可用技能，才返回默认技能
        return combatSkillId;
      }
    }
    return autoId || combatSkillId;
  }
  return combatSkillId;
}

function autoResummon(player, desiredSkillId = null) {
  if (!player || player.hp <= 0) return false;
  const skills = getLearnedSkills(player).filter((skill) => skill.type === 'summon');
  if (!skills.length) return false;

  const autoSkill = player.flags?.autoSkillId;
  let allowedSummonSkills = [];
  if (autoSkill === 'all') {
    allowedSummonSkills = skills;
  } else if (Array.isArray(autoSkill)) {
    allowedSummonSkills = skills.filter((skill) => autoSkill.includes(skill.id));
  } else if (typeof autoSkill === 'string') {
    allowedSummonSkills = skills.filter((skill) => skill.id === autoSkill);
  }
  if (!allowedSummonSkills.length) return false;

  const existingIds = new Set(getAliveSummons(player).map((summon) => summon.id));
  if (desiredSkillId && existingIds.has(desiredSkillId)) return false;

  let summonSkill = null;
  if (desiredSkillId) {
    summonSkill = allowedSummonSkills.find((skill) => skill.id === desiredSkillId);
  }

  const lastSkillId = player.flags?.lastSummonSkill;
  if (!summonSkill && lastSkillId && !existingIds.has(lastSkillId)) {
    summonSkill = allowedSummonSkills.find((skill) => skill.id === lastSkillId);
  }

  if (!summonSkill) {
    const candidates = allowedSummonSkills.filter((skill) => !existingIds.has(skill.id));
    if (!candidates.length) return false;
    summonSkill = candidates.sort((a, b) => getSkillLevel(player, b.id) - getSkillLevel(player, a.id))[0];
  }

  if (!summonSkill || player.mp < summonSkill.mp) return false;
  player.mp = clamp(player.mp - summonSkill.mp, 0, player.max_mp);
  const skillLevel = getSkillLevel(player, summonSkill.id);
  const summon = summonStats(player, summonSkill, skillLevel);
  addOrReplaceSummon(player, { ...summon, exp: 0 });
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
  // 防止同一个BOSS被重复处理
  if (mob.status && mob.status.processed) {
    return;
  }
  // 标记为已处理
  if (mob.status) {
    mob.status.processed = true;
  }

  const realmId = player?.realmId || 1;
  const damageSnapshot = mob.status?.damageBy ? { ...mob.status.damageBy } : {};
  const lastHitSnapshot = mob.status?.lastHitBy || null;
  const template = MOB_TEMPLATES[mob.templateId];
  const mobZoneId = mob.zoneId || player.position.zone;
  const mobRoomId = mob.roomId || player.position.room;
  const isPlayerInMobRoom = (target) =>
    Boolean(target && target.position && target.position.zone === mobZoneId && target.position.room === mobRoomId);
  removeMob(player.position.zone, player.position.room, mob.id, realmId);
  gainSummonExp(player);
  const exp = template.exp;
  const gold = randInt(template.gold[0], template.gold[1]);

  const party = getPartyByMember(player.name, realmId);
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
  if (isWorldBoss) {
    const nextKills = incrementWorldBossKills(1, realmId);
    void setWorldBossKillCount(nextKills, realmId).catch((err) => {
      console.warn('Failed to persist world boss kill count:', err);
    });
  }
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
    lootOwner = playersByName(ownerName, realmId) || player;
    partyMembersForReward = [lootOwner];
    partyMembersForLoot = [lootOwner];
  }
  const eligibleCount = hasParty ? 1 : partyMembersForReward.length;
  const bonus = totalPartyCount > 1 ? Math.min(0.2 * totalPartyCount, 1.0) : 0;
  const totalExp = Math.floor(exp * (1 + bonus));
  const totalGold = Math.floor(gold * (1 + bonus));
  const shareExp = hasParty ? totalExp : Math.floor(totalExp / eligibleCount);
  const shareGold = hasParty ? totalGold : Math.floor(totalGold / eligibleCount);

  // 追踪传说和至尊装备掉落数量
  let legendaryDropCount = 0;
  let supremeDropCount = 0;

    let sabakTaxExp = 0;
    let sabakTaxGold = 0;
    const sabakMembers = listSabakMembersOnline(realmId);
    partyMembersForReward.forEach((member) => {
      const sabakState = getSabakState(realmId);
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
  if (isSpecialBoss) {
      const topEntries = entries.slice(0, 10);
      const totalDamage = entries.reduce((sum, [, dmg]) => sum + dmg, 0) || 1;
      topEntries.forEach(([name, damage]) => {
        const player = playersByName(name, realmId);
        if (!player) return;
        if (isBoss && !isPlayerInMobRoom(player)) return;
        const damageRatio = damage / totalDamage;
        dropTargets.push({ player, damageRatio, rank: entries.findIndex(([n]) => n === name) + 1 });
      });
      if (!dropTargets.length) {
        if (!isBoss || isPlayerInMobRoom(lootOwner)) {
          dropTargets.push({ player: lootOwner, damageRatio: 1, rank: 1 });
        }
      }
    } else {
      if (!isBoss || isPlayerInMobRoom(lootOwner)) {
        dropTargets.push({ player: lootOwner, damageRatio: 1, rank: 1 });
      }
    }

    if (isWorldBoss && entries.length) {
      const [topName, topDamage] = entries[0];
      let topPlayer = topDamage > 0 ? playersByName(topName, realmId) : null;
      if (topPlayer && !isPlayerInMobRoom(topPlayer)) {
        topPlayer = null;
      }
      if (topPlayer) {
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
          topPlayer.send(`世界BOSS伤害第一奖励：${formatItemLabel(forcedId, forcedEffects)}。`);
          const forcedItem = ITEM_TEMPLATES[forcedId];
          if (forcedItem) {
            const forcedRarity = rarityByPrice(forcedItem);
            if (['epic', 'legendary', 'supreme'].includes(forcedRarity)) {
              emitAnnouncement(`${topPlayer.name} 获得世界BOSS伤害第一奖励 ${formatItemLabel(forcedId, forcedEffects)}！`, forcedRarity, null, realmId);
            }
            if (isEquipmentItem(forcedItem) && hasSpecialEffects(forcedEffects)) {
              emitAnnouncement(`${topPlayer.name} 获得特效装备 ${formatItemLabel(forcedId, forcedEffects)}！`, 'announce', null, realmId);
            }
          }
        }
      }
    }

    dropTargets.forEach(({ player: owner, damageRatio, rank }) => {
      const drops = dropLoot(template, 1);
      if (!drops.length) return;
      if (!isSpecialBoss && party && partyMembersForLoot.length > 0) {
        const distributed = distributeLoot(party, partyMembersForLoot, drops);
        distributed.forEach(({ id, effects, target }) => {
          const item = ITEM_TEMPLATES[id];
          if (!item) return;
          logLoot(`[loot][party] ${target.name} <- ${id} (${template.id})`);
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary', 'supreme'].includes(rarity)) {
            const text = `${target.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(id, effects)}！`;
            emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity, null, realmId);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(effects)) {
            emitAnnouncement(`${target.name} 获得特效装备 ${formatItemLabel(id, effects)}！`, 'announce', null, realmId);
          }
        });
      } else if (isSpecialBoss) {
        const actualDrops = [];
        let itemCount = 0;
        const maxItemsPerPlayer = 2;
        drops.forEach((entry) => {
          if (itemCount >= maxItemsPerPlayer) return;
          if (Math.random() > damageRatio) {
            logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (ratio:${damageRatio.toFixed(3)})`);
            return;
          }

          const item = ITEM_TEMPLATES[entry.id];
          if (item) {
            const rarity = rarityByPrice(item);
            if ((rarity === 'legendary' || rarity === 'supreme') && rank > 3) {
              logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (rank:${rank})`);
              return;
            }
            if (rarity === 'legendary') {
              // 检查该玩家是否已经获得过传说装备
              if (actualDrops.some(d => {
                const dItem = ITEM_TEMPLATES[d.id];
                return dItem && rarityByPrice(dItem) === 'legendary';
              })) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (player already has legendary)`);
                return;
              }
              // 检查全服是否已掉落3件传说装备
              if (legendaryDropCount >= 3) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (legendary limit reached)`);
                return;
              }
            }
            if (rarity === 'supreme') {
              // 检查该玩家是否已经获得过至尊装备
              if (actualDrops.some(d => {
                const dItem = ITEM_TEMPLATES[d.id];
                return dItem && rarityByPrice(dItem) === 'supreme';
              })) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (player already has supreme)`);
                return;
              }
              // 检查全服是否已掉落3件至尊装备
              if (supremeDropCount >= 3) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (supreme limit reached)`);
                return;
              }
            }
          }

          addItem(owner, entry.id, 1, entry.effects);
          logLoot(`[loot][special] ${owner.name} <- ${entry.id} (${template.id})`);
          actualDrops.push(entry);
          itemCount++;
          if (item) {
            const rarity = rarityByPrice(item);
            if (rarity === 'legendary') {
              legendaryDropCount++;
            } else if (rarity === 'supreme') {
              supremeDropCount++;
            }
          }
          if (!item) return;
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary', 'supreme'].includes(rarity)) {
            const text = `${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`;
            emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity, null, realmId);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce', null, realmId);
          }
        });
        if (actualDrops.length > 0) {
          owner.send(`掉落: ${actualDrops.map((entry) => formatItemLabel(entry.id, entry.effects)).join(', ')}`);
        } else {
          const names = drops.map((entry) => entry.id).join(', ');
          logLoot(`[loot][special][empty] ${owner.name} drops filtered (${template.id}) -> [${names}]`);
        }
      } else {
        drops.forEach((entry) => {
          addItem(owner, entry.id, 1, entry.effects);
          logLoot(`[loot][solo] ${owner.name} <- ${entry.id} (${template.id})`);
        });
        owner.send(`掉落: ${drops.map((entry) => formatItemLabel(entry.id, entry.effects)).join(', ')}`);
        drops.forEach((entry) => {
          const item = ITEM_TEMPLATES[entry.id];
          if (!item) return;
          const rarity = rarityByPrice(item);
          if (['epic', 'legendary', 'supreme'].includes(rarity)) {
            const text = `${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`;
            emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity, null, realmId);
          }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce', null, realmId);
          }
        });
      }
    });
}

function updateSpecialBossStatsBasedOnPlayers() {
  const realmIds = Array.from(new Set([1, ...realmStates.keys()]));

  realmIds.forEach((realmId) => {
    const online = listOnlinePlayers(realmId);
    Object.keys(WORLD).forEach((zoneId) => {
      const zone = WORLD[zoneId];
      if (!zone?.rooms) return;

      Object.keys(zone.rooms).forEach((roomId) => {
        const roomMobs = getAliveMobs(zoneId, roomId, realmId);
        const specialBoss = roomMobs.find((m) => {
          const tpl = MOB_TEMPLATES[m.templateId];
          return tpl && tpl.specialBoss;
        });

        if (!specialBoss) return;

        const playersInRoom = online.filter(
          (p) => p.position.zone === zoneId && p.position.room === roomId
        ).length;

        const tpl = MOB_TEMPLATES[specialBoss.templateId];

        // 始终从模板读取基础属性，避免重复叠加
        const baseAtk = tpl.atk || 0;
        const baseDef = tpl.def || 0;
        const baseMdef = tpl.mdef || 0;
        const baseMaxHp = tpl.hp || 0;

        // 根据BOSS类型选择配置
        const isWorldBoss = specialBoss.templateId === 'world_boss';
        const playerBonusConfig = isWorldBoss
          ? getWorldBossPlayerBonusConfigSync()
          : getSpecialBossPlayerBonusConfigSync();

        // 找到适用的人数加成配置
        const bonusConfig = playerBonusConfig.find(config => playersInRoom >= config.min);
        const atkBonus = bonusConfig ? (bonusConfig.atk || 0) : 0;
        const defBonus = bonusConfig ? (bonusConfig.def || 0) : 0;
        const mdefBonus = bonusConfig ? (bonusConfig.mdef || 0) : 0;
        const hpBonus = bonusConfig ? (bonusConfig.hp || 0) : 0;

        // 应用加成（基于基础属性计算，避免重复叠加）
        specialBoss.atk = Math.floor(baseAtk + atkBonus);
        specialBoss.def = Math.floor(baseDef + defBonus);
        specialBoss.mdef = Math.floor(baseMdef + mdefBonus);

        // 更新baseStats
        if (!specialBoss.status) specialBoss.status = {};
        specialBoss.status.baseStats = {
          max_hp: baseMaxHp,
          atk: specialBoss.atk,
          def: specialBoss.def,
          mdef: specialBoss.mdef
        };

        // 如果有HP加成，应用到max_hp
        if (hpBonus > 0) {
          specialBoss.max_hp = Math.floor(baseMaxHp + hpBonus);
          specialBoss.hp = Math.min(specialBoss.hp, specialBoss.max_hp);
          specialBoss.status.baseStats.max_hp = specialBoss.max_hp;
        }
      });
    });
  });
}

async function combatTick() {
  const online = listOnlinePlayers();
  const roomMobsCache = new Map();
  const regenRooms = new Set();

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
    const realmId = player.realmId || 1;
    const roomKey = `${realmId}:${player.position.zone}:${player.position.room}`;
    let roomMobs = roomMobsCache.get(roomKey);
    if (!roomMobs) {
      roomMobs = getAliveMobs(player.position.zone, player.position.room, realmId);
      roomMobsCache.set(roomKey, roomMobs);
    }
    if (!regenRooms.has(roomKey)) {
      roomMobs.forEach((mob) => tickMobRegen(mob));
      regenRooms.add(roomKey);
    }
    const poisonSource = player.status?.poison?.sourceName;
      const playerPoisonTick = tickStatus(player);
      if (playerPoisonTick && playerPoisonTick.type === 'poison') {
        player.send(`你受到 ${playerPoisonTick.dmg} 点中毒伤害。`);
        if (poisonSource) {
          const source = playersByName(poisonSource, realmId);
          if (source) {
            source.send(`你的施毒对 ${player.name} 造成 ${playerPoisonTick.dmg} 点伤害。`);
          }
        }
      }
      const summons = getSummons(player);
      const deadSummons = summons.filter((summon) => summon && summon.hp <= 0);
      if (deadSummons.length) {
        deadSummons.forEach((summon) => {
          removeSummonById(player, summon.id);
          autoResummon(player, summon.id);
        });
        if (!player.flags) player.flags = {};
        player.flags.summonAggro = true;
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
    tryAutoBuff(player);

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
        const myParty = getPartyByMember(player.name, player.realmId || 1);
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
    
    // 检查技能CD
    if (skill && skill.cooldown) {
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      
      const now = Date.now();
      const lastUse = player.status.skillCooldowns[skill.id] || 0;
      const cooldownRemaining = Math.max(0, lastUse + skill.cooldown - now);
      
      if (cooldownRemaining > 0) {
        player.send(`${skill.name} 冷却中，还需 ${Math.ceil(cooldownRemaining / 1000)} 秒。`);
        skill = skillForPlayer(player, DEFAULT_SKILLS[player.classId]);
      }
    }

    const hitChance = calcHitChance(player, target);
    if (Math.random() <= hitChance) {
      if (target.evadeChance && Math.random() <= target.evadeChance) {
        const skillName = skill?.id === 'slash' ? null : skill?.name;
        if (skillName) {
          player.send(`你释放了 ${skillName}，${target.name} 闪避了你的攻击。`);
        }
        target.send(`你闪避了 ${player.name} 的攻击。`);
        continue;
      }
      let dmg = 0;
      let skillPower = 1;
        if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave' || skill.type === 'dot' || skill.type === 'aoe')) {
          const skillLevel = getSkillLevel(player, skill.id);
          skillPower = scaledSkillPower(skill, skillLevel);
        if (skill.type === 'spell' || skill.type === 'aoe') {
          if (skill.powerStat === 'atk') {
            dmg = calcDamage(player, target, skillPower);
          } else {
            const mdefMultiplier = getMagicDefenseMultiplier(target);
            const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
            const powerStat = getPowerStatValue(player, skill);
            // 道士的soul技能受防御和魔御各50%影响
            if (skill.id === 'soul') {
              const defMultiplier = getDefenseMultiplier(target);
              const def = Math.floor((target.def || 0) * defMultiplier);
              dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.3 - def * 0.3);
            } else {
              dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6);
            }
            if (dmg < 1) dmg = 1;
          }
        } else if (skill.type === 'dot') {
          const mdefMultiplier = getMagicDefenseMultiplier(target);
          const defMultiplier = getDefenseMultiplier(target);
          const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
          const def = Math.floor((target.def || 0) * defMultiplier);
          const spirit = getSpiritValue(player);
          // 道术攻击受防御和魔御各50%影响
          dmg = Math.max(1, Math.floor((spirit + randInt(0, spirit / 2)) * skillPower - mdef * 0.3 - def * 0.3));
        } else {
          const isNormal = !skill || skill.id === 'slash';
          const crit = consumeFirestrikeCrit(player, 'player', isNormal);
          dmg = Math.floor(calcDamage(player, target, skillPower) * crit);
        }
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
        
        // 记录技能CD
        if (skill.cooldown) {
          if (!player.status) player.status = {};
          if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
          player.status.skillCooldowns[skill.id] = Date.now();
        }
        
        // 打印技能释放日志
        if (skill) {
          const skillName = skill.id === 'slash' ? '普通攻击' : skill.name;
          player.send(`你释放了 ${skillName}！`);
        }
      } else {
        const crit = consumeFirestrikeCrit(player, 'player', true);
        dmg = Math.floor(calcDamage(player, target, 1) * crit);
      }

      const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
      if (elementAtk > 0) {
        dmg += elementAtk * 10;
      }
      // 检查攻击者的弱化效果（来自破防戒指）
      if (player.status?.debuffs?.weak) {
        const weak = player.status.debuffs.weak;
        if (weak.expiresAt && weak.expiresAt < now) {
          delete player.status.debuffs.weak;
        } else {
          dmg = Math.floor(dmg * (1 - (weak.dmgReduction || 0)));
        }
      }

        const damageDealt = applyDamageToPlayer(target, dmg);
        target.flags.lastCombatAt = Date.now();
        player.send(`你对 ${target.name} 造成 ${damageDealt} 点伤害。`);
        target.send(`${player.name} 对你造成 ${damageDealt} 点伤害。`);
        if (skill && (skill.type === 'aoe' || skill.type === 'cleave')) {
          target.send('你受到群体技能伤害。');
        }
        if (hasComboWeapon(player) && target.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          const comboDealt = applyDamageToPlayer(target, dmg);
          target.flags.lastCombatAt = Date.now();
          player.send(`连击触发，对 ${target.name} 造成 ${comboDealt} 点伤害。`);
          target.send(`${player.name} 连击对你造成 ${comboDealt} 点伤害。`);
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
          const extraDealt = applyDamageToPlayer(extraTarget, extraDmg);
          extraTarget.flags.lastCombatAt = Date.now();
          player.send(`刺杀剑术波及 ${extraTarget.name}，造成 ${extraDealt} 点伤害。`);
          extraTarget.send(`${player.name} 的刺杀剑术波及你，造成 ${extraDealt} 点伤害。`);
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
      if (hasSpecialRingEquipped(player, 'ring_magic') &&
          canTriggerMagicRing(player, chosenSkillId, skill) &&
          Math.random() <= 0.1) {
        if (!target.status) target.status = {};
        target.status.stunTurns = 2;
        player.send(`${target.name} 被麻痹戒指定身。`);
        target.send('你被麻痹了，无法行动。');
      }
      // 弱化戒指：攻击时10%几率使目标伤害降低20%，持续2秒
      if (hasSpecialRingEquipped(player, 'ring_teleport') && Math.random() <= 0.1) {
        if (!target.status) target.status = {};
        if (!target.status.debuffs) target.status.debuffs = {};
        target.status.debuffs.weak = { expiresAt: Date.now() + 2000, dmgReduction: 0.2 };
        player.send(`弱化戒指生效，${target.name} 伤害降低20%！`);
        target.send('你受到弱化效果，伤害降低20%！');
      }
      // 吸血戒指：攻击时10%几率吸血，恢复造成伤害的20%
      if (hasSpecialRingEquipped(player, 'ring_fire') && Math.random() <= 0.1) {
        const heal = Math.max(1, Math.floor(dmg * 0.2));
        player.hp = clamp(player.hp + heal, 1, player.max_hp);
        player.send(`吸血戒指生效，恢复 ${heal} 点生命。`);
      }
      // 破防戒指：攻击时10%几率使目标防御魔御降低20%，持续2秒
      if (hasSpecialRingEquipped(player, 'ring_break') && Math.random() <= 0.1) {
        if (!target.status) target.status = {};
        if (!target.status.debuffs) target.status.debuffs = {};
        target.status.debuffs.armorBreak = { expiresAt: Date.now() + 2000, defMultiplier: 0.8 };
        player.send(`破防戒指生效，${target.name} 防御降低20%！`);
        target.send('你受到破防效果，防御和魔御降低20%！');
      }
    } else {
      const skillName = skill?.id === 'slash' ? null : skill?.name;
      if (skillName) {
        player.send(`你释放了 ${skillName}，${target.name} 躲过了你的攻击。`);
      }
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
    
    // 检查技能CD
    if (skill && skill.cooldown) {
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      
      const now = Date.now();
      const lastUse = player.status.skillCooldowns[skill.id] || 0;
      const cooldownRemaining = Math.max(0, lastUse + skill.cooldown - now);
      
      if (cooldownRemaining > 0) {
        player.send(`${skill.name} 冷却中，还需 ${Math.ceil(cooldownRemaining / 1000)} 秒。`);
        skill = skillForPlayer(player, DEFAULT_SKILLS[player.classId]);
      }
    }
    
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
          if (skill.powerStat === 'atk') {
            dmg = calcDamage(player, mob, skillPower);
          } else {
            const mdefMultiplier = getMagicDefenseMultiplier(mob);
            const mdef = Math.floor((mob.mdef || 0) * mdefMultiplier);
            const powerStat = getPowerStatValue(player, skill);
            dmg = Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6);
            if (dmg < 1) dmg = 1;
          }
        } else if (skill.type === 'dot') {
          dmg = Math.max(1, Math.floor(player.mag * 0.5 * skillPower));
        } else {
          dmg = calcDamage(player, mob, skillPower);
        }
        if (skill.mp > 0) player.mp = clamp(player.mp - skill.mp, 0, player.max_mp);
        
        // 记录技能CD
        if (skill.cooldown) {
          if (!player.status) player.status = {};
          if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
          player.status.skillCooldowns[skill.id] = Date.now();
        }
        
        // 打印技能释放日志
        if (skill && skill.type !== 'aoe') {
          const skillName = skill.id === 'slash' ? '普通攻击' : skill.name;
          player.send(`你释放了 ${skillName}！`);
        }
      } else {
        dmg = calcDamage(player, mob, 1);
      }

      if (skill && skill.type === 'aoe') {
        const hasFalloff = skill.id === 'earth_spike' || skill.id === 'thunderstorm';
        mobs.forEach((target) => {
          // AOE伤害应该对每个目标独立计算，而不是使用主目标的伤害
          let aoeDmg = 0;
          if (skill.powerStat === 'atk') {
            aoeDmg = calcDamage(player, target, skillPower);
          } else {
            const mdefMultiplier = getMagicDefenseMultiplier(target);
            const mdef = Math.floor((target.mdef || 0) * mdefMultiplier);
            const powerStat = getPowerStatValue(player, skill);
            aoeDmg = Math.max(1, Math.floor((powerStat + randInt(0, powerStat / 2)) * skillPower - mdef * 0.6));
          }
          if (hasFalloff && target.id !== mob.id) {
            aoeDmg = Math.max(1, Math.floor(aoeDmg * 0.5));
          }
          const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
          if (elementAtk > 0) {
            aoeDmg += elementAtk * 10;
          }
          const result = applyDamageToMob(target, aoeDmg, player.name, player.realmId || 1);
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
        const skillName = skill.id === 'slash' ? '普通攻击' : skill.name;
        player.send(`你释放了 ${skillName}，造成范围伤害。`);
        const deadTargets = mobs.filter((target) => target.hp <= 0);
        if (deadTargets.length) {
          deadTargets.forEach((target) => processMobDeath(player, target, online));
          if (deadTargets.some((target) => target.id === mob.id)) {
            player.combat = null;
          }
          sendRoomState(player.position.zone, player.position.room, player.realmId || 1);
          continue;
        }
        sendRoomState(player.position.zone, player.position.room, player.realmId || 1);
      } else {
        const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
        if (elementAtk > 0) {
          dmg += elementAtk * 10;
        }
        const result = applyDamageToMob(mob, dmg, player.name, player.realmId || 1);
        if (result?.damageTaken) {
          player.send(`你对 ${mob.name} 造成 ${dmg} 点伤害。`);
        }
        if (hasComboWeapon(player) && mob.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          const comboResult = applyDamageToMob(mob, dmg, player.name, player.realmId || 1);
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
          const extraResult = applyDamageToMob(extraTarget, extraDmg, player.name, player.realmId || 1);
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
          sendRoomState(player.position.zone, player.position.room, player.realmId || 1);
        }
      }

      if (hasSpecialRingEquipped(player, 'ring_magic') &&
          canTriggerMagicRing(player, chosenSkillId, skill) &&
          Math.random() <= 0.1) {
        if (!mob.status) mob.status = {};
        mob.status.stunTurns = 2;
        player.send(`${mob.name} 被麻痹戒指定身。`);
      }
      // 弱化戒指：攻击时10%几率使目标伤害降低20%，持续2秒
      if (hasSpecialRingEquipped(player, 'ring_teleport') && Math.random() <= 0.1) {
        if (!mob.status) mob.status = {};
        if (!mob.status.debuffs) mob.status.debuffs = {};
        mob.status.debuffs.weak = { expiresAt: Date.now() + 2000, dmgReduction: 0.2 };
        player.send(`弱化戒指生效，${mob.name} 伤害降低20%！`);
      }
      // 吸血戒指：攻击时10%几率吸血，恢复造成伤害的20%
      if (hasSpecialRingEquipped(player, 'ring_fire') && Math.random() <= 0.1) {
        const heal = Math.max(1, Math.floor(dmg * 0.2));
        player.hp = clamp(player.hp + heal, 1, player.max_hp);
        player.send(`吸血戒指生效，恢复 ${heal} 点生命。`);
      }
      // 破防戒指：攻击时10%几率使目标防御魔御降低20%，持续2秒
      if (hasSpecialRingEquipped(player, 'ring_break') && Math.random() <= 0.1) {
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
      if (skill && skill.type === 'cleave') {
        mobs.filter((m) => m.id !== mob.id).forEach((other) => {
          // cleave伤害基于玩家攻击力的30%，而不是主目标受伤的30%
          const cleaveBaseDmg = Math.floor(player.atk * 0.3 * skillPower);
          let cleaveDmg = Math.max(1, Math.floor(calcDamage(player, other, 0.3 * skillPower)));
          const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
          if (elementAtk > 0) {
            cleaveDmg += elementAtk * 10;
          }
          const cleaveResult = applyDamageToMob(other, cleaveDmg, player.name, player.realmId || 1);
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
      const skillName = skill?.id === 'slash' ? null : skill?.name;
      if (skillName) {
        player.send(`你释放了 ${skillName}，${mob.name} 躲过了你的攻击。`);
      }
      if (skill && skill.type === 'dot') {
        player.send('施毒失败。');
      }
    }

    const statusTick = tickStatus(mob);
    if (statusTick && statusTick.type === 'poison') {
      player.send(`${mob.name} 受到 ${statusTick.dmg} 点中毒伤害。`);
      
      // 记录每个玩家造成的中毒伤害到排行榜
      if (statusTick.damageBySource) {
        for (const [sourceName, damage] of Object.entries(statusTick.damageBySource)) {
          if (sourceName && sourceName !== 'unknown') {
            recordMobDamage(mob, sourceName, damage);
            const source = playersByName(sourceName, player.realmId || 1);
            if (source && source.name !== player.name) {
              source.send(`你的施毒对 ${mob.name} 造成 ${damage} 点伤害。`);
            }
          }
        }
      }
    }

    const aliveSummons = getAliveSummons(player);
    if (aliveSummons.length && mob.hp > 0) {
      aliveSummons.forEach((summon) => {
        if (summon.id === 'white_tiger') {
          mobs.forEach((target) => {
            const hitChance = calcHitChance(summon, target);
            if (Math.random() <= hitChance) {
              let dmg = calcTaoistDamageFromValue(getSpiritValue(summon), target);
              if (target.id !== mob.id) {
                dmg = Math.max(1, Math.floor(dmg * 0.5));
              }
              const summonResult = applyDamageToMob(target, dmg, player.name, player.realmId || 1);
              if (summonResult?.damageTaken) {
                player.send(`${summon.name} 对 ${target.name} 造成 ${dmg} 点伤害。`);
              }
            }
          });
          return;
        }
        const hitChance = calcHitChance(summon, mob);
        if (Math.random() <= hitChance) {
          const useTaoist = summon.id === 'skeleton' || summon.id === 'summon';
          const dmg = useTaoist
            ? calcTaoistDamageFromValue(getSpiritValue(summon), mob)
            : calcDamage(summon, mob, 1);
          const summonResult = applyDamageToMob(mob, dmg, player.name, player.realmId || 1);
          if (summonResult?.damageTaken) {
            player.send(`${summon.name} 对 ${mob.name} 造成 ${dmg} 点伤害。`);
          }
        }
      });
    }

    if (mob.hp <= 0) {
      processMobDeath(player, mob, online);
      player.combat = null;
      sendRoomState(player.position.zone, player.position.room, player.realmId || 1);
      continue;
    }

    if (mob.status && mob.status.stunTurns > 0) {
      player.send(`${mob.name} 被麻痹，无法行动。`);
      continue;
    }


    const primarySummon = aliveSummons[0] || null;
    const summonAlive = Boolean(primarySummon);
    if (player.flags?.summonAggro && summonAlive) {
      const lastAttackAt = player.flags.lastAttackAt || 0;
      if (Date.now() - lastAttackAt >= 5000) {
        player.flags.summonAggro = false;
      }
    }
    const mobTemplate = MOB_TEMPLATES[mob.templateId];
    const isBossAggro = Boolean(mobTemplate?.worldBoss || mobTemplate?.sabakBoss);
    let mobTarget = player.flags?.summonAggro || !summonAlive ? player : primarySummon;
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
        mobTarget = summonAlive ? primarySummon : player;
      }
    }
    const mobHitChance = calcHitChance(mob, mobTarget);
    if (Math.random() <= mobHitChance) {
      const isWorldBoss = Boolean(mobTemplate?.worldBoss);
      const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
      if (!isWorldBoss && !isSpecialBoss && mobTarget && mobTarget.evadeChance && Math.random() <= mobTarget.evadeChance) {
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
        mobTarget.status.debuffs.armorBreak = {
          defMultiplier: 0.5,
          expiresAt: Date.now() + 3000
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
        const damageDealt = applyDamageToPlayer(mobTarget, dmg);
        mobTarget.send(`${mob.name} 对你造成 ${damageDealt} 点伤害。`);
        if (mobTarget !== player) {
          player.send(`${mob.name} 攻击 ${mobTarget.name}，造成 ${damageDealt} 点伤害。`);
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
            const splashDealt = applyDamageToPlayer(splashTarget, splashDmg);
            splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDealt} 点伤害。`);
            if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
              handleDeath(splashTarget);
            }
            
            // 溅射到召唤物
            const splashSummons = getAliveSummons(splashTarget);
            splashSummons.forEach((summon) => {
              applyDamageToSummon(summon, splashDmg);
              splashTarget.send(`${mob.name} 的攻击溅射到 ${summon.name}，造成 ${splashDmg} 点伤害。`);
              if (summon.hp <= 0) {
                splashTarget.send(`${summon.name} 被击败。`);
                removeSummonById(splashTarget, summon.id);
                autoResummon(splashTarget, summon.id);
              }
            });
          });
          
          // 溅射到主目标的召唤物（如果主目标是玩家且有召唤物）
          if (mobTarget && mobTarget.userId) {
            const targetSummons = getAliveSummons(mobTarget);
            targetSummons.forEach((summon) => {
              applyDamageToSummon(summon, splashDmg);
              mobTarget.send(`${mob.name} 的攻击溅射到 ${summon.name}，造成 ${splashDmg} 点伤害。`);
              if (summon.hp <= 0) {
                mobTarget.send(`${summon.name} 被击败。`);
                removeSummonById(mobTarget, summon.id);
                autoResummon(mobTarget, summon.id);
              }
            });
          }
        }
      } else {
        applyDamageToSummon(mobTarget, dmg);
        player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
        
        // 特殊BOSS溅射效果：主目标是召唤物时，对玩家和房间所有其他玩家及召唤物造成BOSS攻击力50%的溅射伤害
        if (isSpecialBoss && online && online.length > 0) {
          const splashDmg = Math.floor(mob.atk * 0.5);
          
          // 溅射到召唤物的主人
          if (player && player.hp > 0) {
            const splashDealt = applyDamageToPlayer(player, splashDmg);
            player.send(`${mob.name} 的攻击溅射到你，造成 ${splashDealt} 点伤害。`);
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
            const splashDealt = applyDamageToPlayer(splashTarget, splashDmg);
            splashTarget.send(`${mob.name} 的攻击溅射到你，造成 ${splashDealt} 点伤害。`);
            if (splashTarget.hp <= 0 && !tryRevive(splashTarget)) {
              handleDeath(splashTarget);
            }
            
            // 溅射到其他玩家的召唤物
            const splashSummons = getAliveSummons(splashTarget);
            splashSummons.forEach((summon) => {
              applyDamageToSummon(summon, splashDmg);
              splashTarget.send(`${mob.name} 的攻击溅射到 ${summon.name}，造成 ${splashDmg} 点伤害。`);
              if (summon.hp <= 0) {
                splashTarget.send(`${summon.name} 被击败。`);
                removeSummonById(splashTarget, summon.id);
                autoResummon(splashTarget, summon.id);
              }
            });
          });
        }
        
        if (mobTarget.hp <= 0) {
          player.send(`${mobTarget.name} 被击败。`);
          if (!player.flags) player.flags = {};
          player.flags.summonAggro = true;
          removeSummonById(player, mobTarget.id);
          autoResummon(player, mobTarget.id);
          const followChance = calcHitChance(mob, player);
          if (Math.random() <= followChance) {
            const followDmg = calcDamage(mob, player, 1);
            const followDealt = applyDamageToPlayer(player, followDmg);
            player.send(`${mob.name} 追击你，造成 ${followDealt} 点伤害。`);
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

    // 每30秒保存一次玩家数据,避免频繁写入数据库
    const now = Date.now();
    const lastSave = getRealmState(player.realmId || 1).lastSaveTime.get(player.name) || 0;
    if (now - lastSave >= 30000) {
      savePlayer(player);
      getRealmState(player.realmId || 1).lastSaveTime.set(player.name, now);
    }
  }
}

setInterval(combatTick, 1000);

async function sabakTick(realmId) {
  const sabakState = getSabakState(realmId);
  const now = Date.now();
  const nowDate = new Date(now);

  // 自动开始攻城战
  if (!sabakState.active && isSabakActive(nowDate) && sabakState.ownerGuildId) {
    // 检查是否有行会报名
    const registrations = await listSabakRegistrations(realmId);
    const today = new Date();
    const todayRegistrations = registrations.filter(r => {
      if (!r.registered_at) return false;
      const regDate = new Date(r.registered_at);
      return regDate.toDateString() === today.toDateString();
    });

    if (todayRegistrations.length === 0) {
      // 没有行会报名，直接判定守城方胜利（每日仅公告一次）
      const todayKey = today.toDateString();
      if (sabakState.noRegAnnounceDate !== todayKey) {
        sabakState.noRegAnnounceDate = todayKey;
        emitAnnouncement('今日无行会报名攻城，守城方自动获胜！', 'announce', null, realmId);
      }
    } else {
      sabakState.noRegAnnounceDate = null;
      // 有行会报名，正常开始攻城战
      startSabakSiege(null, realmId);
    }
  }

  // 检查皇宫占领情况（仅攻城战期间）
  if (sabakState.active && isSabakActive(nowDate)) {
    const palacePlayers = listOnlinePlayers(realmId).filter(p =>
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
        emitAnnouncement(`${controllingGuildName} 开始占领沙城皇宫！`, 'announce', null, realmId);
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
        await setSabakOwner(realmId, sabakState.captureGuildId, sabakState.captureGuildName);
        emitAnnouncement(`${sabakState.captureGuildName} 占领沙城皇宫5分钟，成功夺取沙巴克！`, 'announce', null, realmId);
        sabakState.active = false;
        sabakState.siegeEndsAt = null;
        sabakState.captureGuildId = null;
        sabakState.captureGuildName = null;
        sabakState.captureStart = null;
        sabakState.killStats = {};
      } else if (Math.floor(captureDuration / 1000) % 30 === 0 && captureDuration > 0) {
        // 每30秒提醒一次占领时间
        const remainingMinutes = Math.ceil((占领所需分钟 * 60 * 1000 - captureDuration) / 60000);
        emitAnnouncement(`${sabakState.captureGuildName} 已占领沙城皇宫 ${Math.floor(captureMinutes)} 分钟，还需 ${remainingMinutes} 分钟即可获胜。`, 'announce', null, realmId);
      }
    }
  }

  // 结束攻城战
  if (sabakState.active) {
    if (!isSabakActive(nowDate) || (sabakState.siegeEndsAt && now >= sabakState.siegeEndsAt)) {
      await finishSabakSiege(realmId);
    }
  }
}

async function start() {
  if (config.db.client === 'sqlite') {
    const dir = path.dirname(config.db.filename);
    await mkdir(dir, { recursive: true });
  }
  await runMigrations();
  await applyWorldBossSettings();
  await applySpecialBossSettings();
  await refreshRealmCache();
  setRespawnStore({
    set: (realmId, zoneId, roomId, slotIndex, templateId, respawnAt) =>
      upsertMobRespawn(realmId, zoneId, roomId, slotIndex, templateId, respawnAt),
    clear: (realmId, zoneId, roomId, slotIndex) =>
      clearMobRespawn(realmId, zoneId, roomId, slotIndex)
  });
  const respawnRows = [];
  for (const realm of realmCache) {
    const rows = await listMobRespawns(realm.id);
    respawnRows.push(...rows);
  }
  const now = Date.now();
  const activeRespawns = [];
  for (const row of respawnRows) {
    if (row.respawn_at && Number(row.respawn_at) > now) {
      activeRespawns.push(row);
    } else if (row.current_hp && row.current_hp > 0) {
      // 保留有血量数据的怪物，即使重生时间已过期
      activeRespawns.push(row);
    } else {
      await clearMobRespawn(row.realm_id || 1, row.zone_id, row.room_id, row.slot_index);
    }
  }
  seedRespawnCache(activeRespawns);
  
  // 定期保存怪物血量状态（每30秒）
  setInterval(async () => {
    try {
      const realmIds = getRealmIds();
      for (const realmId of realmIds) {
        const aliveMobs = getAllAliveMobs(realmId);
        for (const mob of aliveMobs) {
          await saveMobState(
            realmId,
            mob.zoneId,
            mob.roomId,
            mob.slotIndex,
            mob.templateId,
            mob.currentHp,
            mob.status
          );
        }
      }
    } catch (err) {
      console.warn('Failed to save mob states:', err);
    }
  }, 30000);

  // 寄售到期自动下架（每10分钟）
  setInterval(async () => {
    try {
      const realmIds = getRealmIds();
      for (const realmId of realmIds) {
        await cleanupExpiredConsignments(realmId);
      }
    } catch (err) {
      console.warn('Failed to cleanup expired consignments:', err);
    }
  }, CONSIGN_CLEANUP_INTERVAL_MS);
  
  try {
    const result = await cleanupInvalidItems();
    console.log(
      `Cleaned items: checked=${result.checked}, updated=${result.updated}, removed=${result.removedSlots}, clearedEquip=${result.clearedEquip}`
    );
  } catch (err) {
    console.warn('Failed to cleanup invalid items on startup.');
    console.warn(err);
  }
  for (const realm of realmCache) {
    await ensureSabakState(realm.id);
    await loadSabakState(realm.id);
  }
  lootLogEnabled = await getLootLogEnabled();
  // 世界BOSS击杀次数改为按区服维护
  for (const realm of realmCache) {
    const worldBossKillCount = await getWorldBossKillCount(realm.id);
    setWorldBossKillCountState(worldBossKillCount, realm.id);
  }
  const roomVariantCount = await getRoomVariantCount();
  applyRoomVariantCount(roomVariantCount);
  shrinkRoomVariants(WORLD, roomVariantCount);
  expandRoomVariants(WORLD);

  // 加载职业升级属性配置
  const classLevelConfigs = {
    warrior: await getClassLevelBonusConfig('warrior'),
    mage: await getClassLevelBonusConfig('mage'),
    taoist: await getClassLevelBonusConfig('taoist')
  };
  setAllClassLevelBonusConfigs(classLevelConfigs);
  for (const realm of realmCache) {
    checkMobRespawn(realm.id);
  }
  setInterval(() => {
    getRealmIds().forEach((realmId) => {
      checkMobRespawn(realmId);
    });
  }, 5000);
  setInterval(() => {
    getRealmIds().forEach((realmId) => {
      sabakTick(realmId).catch(() => {});
    });
  }, 5000);
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
