import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile, unlink, stat } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import crypto from 'node:crypto';
import cron from 'node-cron';

import config from './config.js';
import { validatePlayerName } from './game/validator.js';
import knex from './db/index.js';
import { createUser, verifyUser, createSession, getSession, getUserByName, setAdminFlag, verifyUserPassword, updateUserPassword, clearUserSessions, clearRealmSessions } from './db/users.js';
import { listCharacters, loadCharacter, saveCharacter, findCharacterByName, findCharacterByNameInRealm, listAllCharacters, deleteCharacter } from './db/characters.js';
import { addGuildMember, createGuild, getGuildByName, getGuildByNameInRealm, getGuildById, getGuildMember, getSabakOwner, isGuildLeader, isGuildLeaderOrVice, setGuildMemberRole, listGuildMembers, listSabakRegistrations, registerSabak, hasSabakRegistrationToday, hasAnySabakRegistrationToday, removeGuildMember, leaveGuild, setSabakOwner, clearSabakRegistrations, transferGuildLeader, ensureSabakState, applyToGuild, listGuildApplications, removeGuildApplication, approveGuildApplication, getApplicationByUser, listAllGuilds } from './db/guilds.js';
import { createAdminSession, listUsers, verifyAdminSession, deleteUser } from './db/admin.js';
import { sendMail, listMail, listSentMail, markMailRead, markMailClaimed, deleteMail } from './db/mail.js';
import { createVipCodes, listVipCodes, countVipCodes, useVipCode } from './db/vip.js';
import { createRechargeCards, listRechargeCards, countRechargeCards, useRechargeCard } from './db/recharge.js';
import { getSetting, setSetting, getVipSelfClaimEnabled, setVipSelfClaimEnabled, getSvipPrices, setSvipPrices, getLootLogEnabled, setLootLogEnabled, getCrossWorldBossRespawnAt, setCrossWorldBossRespawnAt, getStateThrottleEnabled, setStateThrottleEnabled, getStateThrottleIntervalSec, setStateThrottleIntervalSec, getStateThrottleOverrideServerAllowed, setStateThrottleOverrideServerAllowed, getConsignExpireHours, setConsignExpireHours, getRoomVariantCount, setRoomVariantCount, getSabakStartHour, setSabakStartHour, getSabakStartMinute, setSabakStartMinute, getSabakDurationMinutes, setSabakDurationMinutes, getSabakSiegeMinutes, setSabakSiegeMinutes, getCrossRankStartHour, setCrossRankStartHour, getCrossRankStartMinute, setCrossRankStartMinute, getCrossRankDurationMinutes, setCrossRankDurationMinutes, canUserClaimVip, incrementCharacterVipClaimCount, getWorldBossKillCount, setWorldBossKillCount, getSpecialBossKillCount, setSpecialBossKillCount, getCultivationBossKillCount, setCultivationBossKillCount, getWorldBossDropBonus, setWorldBossDropBonus, getWorldBossBaseHp, setWorldBossBaseHp, getWorldBossBaseAtk, setWorldBossBaseAtk, getWorldBossBaseDef, setWorldBossBaseDef, getWorldBossBaseMdef, setWorldBossBaseMdef, getWorldBossBaseExp, setWorldBossBaseExp, getWorldBossBaseGold, setWorldBossBaseGold, getWorldBossRespawnMinutes, setWorldBossRespawnMinutes, getWorldBossPlayerBonusConfig, setWorldBossPlayerBonusConfig, getClassLevelBonusConfig, setClassLevelBonusConfig, getSpecialBossDropBonus, setSpecialBossDropBonus, getSpecialBossBaseHp, setSpecialBossBaseHp, getSpecialBossBaseAtk, setSpecialBossBaseAtk, getSpecialBossBaseDef, setSpecialBossBaseDef, getSpecialBossBaseMdef, setSpecialBossBaseMdef, getSpecialBossBaseExp, setSpecialBossBaseExp, getSpecialBossBaseGold, setSpecialBossBaseGold, getSpecialBossRespawnMinutes, setSpecialBossRespawnMinutes, getSpecialBossPlayerBonusConfig, setSpecialBossPlayerBonusConfig, getCultivationBossDropBonus, setCultivationBossDropBonus, getCultivationBossPlayerBonusConfig, setCultivationBossPlayerBonusConfig, getCultivationBossBaseHp, setCultivationBossBaseHp, getCultivationBossBaseAtk, setCultivationBossBaseAtk, getCultivationBossBaseDef, setCultivationBossBaseDef, getCultivationBossBaseMdef, setCultivationBossBaseMdef, getCultivationBossBaseExp, setCultivationBossBaseExp, getCultivationBossBaseGold, setCultivationBossBaseGold, getCultivationBossRespawnMinutes, setCultivationBossRespawnMinutes, getTrainingFruitCoefficient as getTrainingFruitCoefficientDb, setTrainingFruitCoefficient as setTrainingFruitCoefficientDb, getTrainingFruitDropRate as getTrainingFruitDropRateDb, setTrainingFruitDropRate as setTrainingFruitDropRateDb, getTrainingPerLevelConfig as getTrainingPerLevelConfigDb, setTrainingPerLevelConfig as setTrainingPerLevelConfigDb, getRefineBaseSuccessRate as getRefineBaseSuccessRateDb, setRefineBaseSuccessRate as setRefineBaseSuccessRateDb, getRefineDecayRate as getRefineDecayRateDb, setRefineDecayRate as setRefineDecayRateDb, getRefineMaterialCount as getRefineMaterialCountDb, setRefineMaterialCount as setRefineMaterialCountDb, getRefineBonusPerLevel as getRefineBonusPerLevelDb, setRefineBonusPerLevel as setRefineBonusPerLevelDb, getEffectResetSuccessRate as getEffectResetSuccessRateDb, setEffectResetSuccessRate as setEffectResetSuccessRateDb, getEffectResetDoubleRate as getEffectResetDoubleRateDb, setEffectResetDoubleRate as setEffectResetDoubleRateDb, getEffectResetTripleRate as getEffectResetTripleRateDb, setEffectResetTripleRate as setEffectResetTripleRateDb, getEffectResetQuadrupleRate as getEffectResetQuadrupleRateDb, setEffectResetQuadrupleRate as setEffectResetQuadrupleRateDb, getEffectResetQuintupleRate as getEffectResetQuintupleRateDb, setEffectResetQuintupleRate as setEffectResetQuintupleRateDb, getEffectDropSingleChance as getEffectDropSingleChanceDb, setEffectDropSingleChance as setEffectDropSingleChanceDb, getEffectDropDoubleChance as getEffectDropDoubleChanceDb, setEffectDropDoubleChance as setEffectDropDoubleChanceDb, getEquipSkillDropChance as getEquipSkillDropChanceDb, setEquipSkillDropChance as setEquipSkillDropChanceDb, getCmdRateLimits, setCmdRateLimits, getCmdCooldowns, setCmdCooldowns } from './db/settings.js';
import { listRealms, getRealmById, updateRealmName, createRealm } from './db/realms.js';
import {
  listMobRespawns,
  upsertMobRespawn,
  clearMobRespawn,
  saveMobState,
  clearInvalidCrossWorldBossRespawns
} from './db/mobs.js';
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
import {
  setRefineBaseSuccessRate,
  getRefineBaseSuccessRate,
  setRefineDecayRate,
  setRefineMaterialCount,
  getRefineMaterialCount,
  getRefineDecayRate,
  getRefineBonusPerLevel,
  setRefineBonusPerLevel,
  setEffectResetSuccessRate,
  getEffectResetSuccessRate,
  setEffectResetDoubleRate,
  getEffectResetDoubleRate,
  setEffectResetTripleRate,
  getEffectResetTripleRate,
  setEffectResetQuadrupleRate,
  getEffectResetQuadrupleRate,
  setEffectResetQuintupleRate,
  getEffectResetQuintupleRate,
  getEffectDropSingleChance,
  setEffectDropSingleChance,
  getEffectDropDoubleChance,
  setEffectDropDoubleChance,
  getEquipSkillDropChance,
  setEquipSkillDropChance
} from './game/settings.js';
import {
  listItems,
  getItemById,
  getItemByItemId,
  createItem as createItemDb,
  updateItem as updateItemDb,
  deleteItem as deleteItemDb,
  getItemDrops,
  addItemDrop as addItemDropDb,
  deleteItemDrop as deleteItemDropDb,
  setItemDrops as setItemDropsDb,
  searchItems as searchItemsDb,
  getItemTemplates,
  checkImportedItems,
  importItems as importItemsDb,
  getItemsByItemIds,
  syncItemsToTemplates,
  syncMobDropsToTemplates
} from './db/items_admin.js';
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
  validatePlayerHasGold,
  validateYuanbao,
  validatePlayerHasYuanbao
} from './game/validator.js';
import {
  DEFAULT_SKILLS,
  SKILLS,
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
import { ITEM_TEMPLATES, SHOP_STOCKS } from './game/items.js';
import { WORLD, expandRoomVariants, shrinkRoomVariants } from './game/world.js';
import { getRoomMobs, getAliveMobs, spawnMobs, removeMob, seedRespawnCache, setRespawnStore, getAllAliveMobs, incrementWorldBossKills, setWorldBossKillCount as setWorldBossKillCountState, incrementSpecialBossKills, setSpecialBossKillCount as setSpecialBossKillCountState, incrementCultivationBossKills, setCultivationBossKillCount as setCultivationBossKillCountState } from './game/state.js';
import { calcHitChance, calcDamage, applyDamage, applyHealing, applyPoison, tickStatus, getDefenseMultiplier, consumeFirestrikeCrit } from './game/combat.js';
import { randInt, clamp } from './game/utils.js';
import { expForLevel, setRoomVariantCount as applyRoomVariantCount } from './game/constants.js';
import {
  setAllClassLevelBonusConfigs,
  setClassLevelBonusConfig as setClassLevelBonusConfigMem,
  getTrainingFruitDropRate,
  setTrainingFruitCoefficient,
  setTrainingFruitDropRate as setTrainingFruitDropRateConfig,
  setTrainingPerLevelConfig as setTrainingPerLevelConfigMem
} from './game/settings.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 20000,
  pingTimeout: 60000
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_BASE = (() => {
  const raw = String(config.adminPath || 'admin').trim();
  const cleaned = raw.replace(/^\/+|\/+$/g, '');
  return cleaned ? `/${cleaned}` : '/admin';
})();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(ADMIN_BASE, express.static(path.join(__dirname, '..', 'public', 'admin')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));
if (ADMIN_BASE !== '/admin') {
  app.use((req, res, next) => {
    if (req.url.startsWith(`${ADMIN_BASE}/`)) {
      req.url = `/admin${req.url.slice(ADMIN_BASE.length)}`;
    }
    next();
  });
}

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
  // 验证角色名
  const nameResult = validatePlayerName(name);
  if (!nameResult.ok) {
    return res.status(400).json({ error: nameResult.error });
  }
  const existing = await findCharacterByName(nameResult.value);
  if (existing) return res.status(400).json({ error: '角色名已存在。' });

  const player = newCharacter(nameResult.value, classId);
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

app.post('/api/character/delete', async (req, res) => {
  const { token, name, realmId: rawRealmId } = req.body || {};
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  let realmInfo = await resolveRealmId(rawRealmId);
  if (realmInfo.error) {
    const realms = await listRealms();
    if (Array.isArray(realms) && realms.length > 0) {
      realmInfo = { realmId: realms[0].id };
    } else {
      return res.status(400).json({ error: realmInfo.error });
    }
  }
  if (!name) return res.status(400).json({ error: '角色名不能为空。' });
  const nameResult = validatePlayerName(name);
  if (!nameResult.ok) {
    return res.status(400).json({ error: nameResult.error });
  }
  const isOnline = Array.from(players.values()).some(
    (p) => p && p.name === nameResult.value && p.userId === session.user_id && (p.realmId || 1) === realmInfo.realmId
  );
  if (isOnline) {
    return res.status(400).json({ error: '角色在线中，无法删除。' });
  }
  const member = await getGuildMember(session.user_id, nameResult.value, realmInfo.realmId);
  if (member && member.role === 'leader') {
    return res.status(400).json({ error: '会长不能删除角色，请先转让会长。' });
  }
  if (member) {
    await leaveGuild(session.user_id, nameResult.value, realmInfo.realmId);
  }
  const application = await getApplicationByUser(session.user_id, realmInfo.realmId);
  if (application && application.guild_id && application.char_name === nameResult.value) {
    await removeGuildApplication(application.guild_id, session.user_id, realmInfo.realmId);
  }
  await knex('consignments').where({ seller_name: nameResult.value, realm_id: realmInfo.realmId }).del();
  await knex('consignment_history').where({ seller_name: nameResult.value, realm_id: realmInfo.realmId }).del();
  await knex('mails')
    .where({ to_name: nameResult.value, realm_id: realmInfo.realmId })
    .orWhere({ from_name: nameResult.value, realm_id: realmInfo.realmId })
    .del();
  await deleteCharacter(session.user_id, nameResult.value, realmInfo.realmId);
  res.json({ ok: true });
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
  const respawnMinutes = await getWorldBossRespawnMinutes();
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
    respawnMinutes,
    playerBonusConfig
  });
});

app.get('/admin/cmd-rate-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const rateLimits = await getCmdRateLimits();
  const cooldowns = await getCmdCooldowns();
  res.json({ ok: true, rateLimits, cooldowns });
});

app.post('/admin/cmd-rate-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { rateLimits, cooldowns } = req.body || {};
  if (rateLimits !== undefined) {
    await setCmdRateLimits(rateLimits);
  }
  if (cooldowns !== undefined) {
    await setCmdCooldowns(cooldowns);
  }
  cmdRateCache = { value: null, updatedAt: 0 };
  res.json({ ok: true });
});

app.post('/admin/worldboss-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { dropBonus, baseHp, baseAtk, baseDef, baseMdef, baseExp, baseGold, respawnMinutes, playerBonusConfig } = req.body || {};

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
  if (respawnMinutes !== undefined) {
    await setWorldBossRespawnMinutes(Math.max(1, Math.floor(Number(respawnMinutes) || 60)));
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
    respawnMinutes: await getWorldBossRespawnMinutes(),
    playerBonusConfig: await getWorldBossPlayerBonusConfig()
  });
});

app.get('/admin/worldboss-killcount', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const realmId = Number(req.query?.realmId);
  if (Number.isFinite(realmId)) {
    const count = await getWorldBossKillCount(realmId);
    return res.json({ ok: true, realmId, count });
  }
  const data = [];
  for (const id of getRealmIds()) {
    const count = await getWorldBossKillCount(id);
    data.push({ realmId: id, count });
  }
  return res.json({ ok: true, data });
});

app.post('/admin/worldboss-killcount/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { realmId, count } = req.body || {};
  const targetRealmId = Number(realmId);
  if (!Number.isFinite(targetRealmId)) {
    return res.status(400).json({ error: 'realmId参数无效' });
  }
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  await setWorldBossKillCount(normalized, targetRealmId);
  setWorldBossKillCountState(normalized, targetRealmId);
  return res.json({ ok: true, realmId: targetRealmId, count: normalized });
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
      const mobs = getAliveMobs('wb', 'lair', realm.id);
      const worldBossMobs = mobs.filter(m => m.templateId === 'world_boss');

      for (const boss of worldBossMobs) {
        removeMob('wb', 'lair', boss.id, realm.id);
        // 清除该BOSS的奖励标记
        bossClassFirstDamageRewardGiven.delete(`${realm.id}:${boss.id}`);
        removedCount++;
      }

      // 清理世界BOSS的重生时间记录，避免影响正常刷新
      await clearMobRespawn(realm.id, 'wb', 'lair', 0);

      // 刷新新的世界BOSS
      const newMobs = spawnMobs('wb', 'lair', realm.id);
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
  const { count, durationType, durationDays } = req.body || {};
  const safeCount = Math.min(Number(count || 1), 100);
  const rawType = String(durationType || 'month').trim().toLowerCase();
  const typeMap = new Map([
    ['月', 'month'],
    ['月卡', 'month'],
    ['季', 'quarter'],
    ['季卡', 'quarter'],
    ['年', 'year'],
    ['年卡', 'year'],
    ['永久', 'permanent']
  ]);
  const type = typeMap.get(rawType) || rawType;
  const allowed = new Set(['month', 'quarter', 'year', 'permanent', 'custom']);
  if (!allowed.has(type)) {
    return res.status(400).json({ error: '无效的VIP期限类型' });
  }
  const days = durationDays == null ? null : Number(durationDays);
  if (days != null && (!Number.isFinite(days) || days <= 0)) {
    return res.status(400).json({ error: '无效的VIP期限天数' });
  }
  const codes = await createVipCodes(safeCount, type, days);
  res.json({ ok: true, codes, durationType: type, durationDays: days ?? null });
});

app.get('/admin/vip/list', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(req.query.limit || 50))));
  const offset = (page - 1) * limit;
  const [codes, total] = await Promise.all([
    listVipCodes(limit, offset),
    countVipCodes()
  ]);
  res.json({ ok: true, codes, total });
});

app.post('/admin/recharge/create', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { count, amount } = req.body || {};
  const safeCount = Math.min(Number(count || 1), 200);
  const value = Math.floor(Number(amount || 0));
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ error: '无效的元宝数量' });
  }
  const codes = await createRechargeCards(safeCount, value, admin.user.id);
  res.json({ ok: true, codes, amount: value });
});

app.get('/admin/recharge/list', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const page = Math.max(1, Math.floor(Number(req.query.page || 1)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(req.query.limit || 50))));
  const offset = (page - 1) * limit;
  const [codes, total] = await Promise.all([
    listRechargeCards(limit, offset),
    countRechargeCards()
  ]);
  res.json({ ok: true, codes, total });
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

app.get('/admin/svip-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const prices = await getSvipPrices();
  res.json({ ok: true, prices });
});

app.post('/admin/svip-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const prices = req.body?.prices || {};
  await setSvipPrices(prices);
  const next = await getSvipPrices();
  res.json({ ok: true, prices: next });
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

app.get('/admin/event-time-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  res.json({
    ok: true,
    sabak: {
      startHour: sabakConfig.startHour,
      startMinute: sabakConfig.startMinute,
      durationMinutes: sabakConfig.durationMinutes,
      siegeMinutes: sabakConfig.siegeMinutes
    },
    crossRank: {
      startHour: crossRankConfig.startHour,
      startMinute: crossRankConfig.startMinute,
      durationMinutes: crossRankConfig.durationMinutes
    }
  });
});

app.post('/admin/event-time-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { sabak, crossRank } = req.body || {};
  if (sabak) {
    if (sabak.startHour !== undefined) await setSabakStartHour(sabak.startHour);
    if (sabak.startMinute !== undefined) await setSabakStartMinute(sabak.startMinute);
    if (sabak.durationMinutes !== undefined) await setSabakDurationMinutes(sabak.durationMinutes);
    if (sabak.durationMinutes !== undefined) await setSabakSiegeMinutes(sabak.durationMinutes);
  }
  if (crossRank) {
    if (crossRank.startHour !== undefined) await setCrossRankStartHour(crossRank.startHour);
    if (crossRank.startMinute !== undefined) await setCrossRankStartMinute(crossRank.startMinute);
    if (crossRank.durationMinutes !== undefined) await setCrossRankDurationMinutes(crossRank.durationMinutes);
  }
  await loadEventTimeSettings();
  res.json({ ok: true });
});

// 每日幸运玩家管理
app.get('/admin/daily-lucky-info', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const realms = await listRealms();
    const realmList = realms.length ? realms : [{ id: 1, name: '默认' }];
    const results = [];
    for (const realm of realmList) {
      const luckyInfo = await getDailyLuckyInfoCached(realm.id);
      const dateKey = await getSetting(`daily_lucky_date_${realm.id}`, '');
      results.push({
        realmId: realm.id,
        realmName: realm.name,
        date: dateKey,
        lucky: luckyInfo
      });
    }
    res.json({ ok: true, data: results });
  } catch (err) {
    console.error('[DailyLucky] 获取信息失败:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/daily-lucky/refresh', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    await refreshDailyLucky();
    // 清除缓存以便立即获取最新数据
    dailyLuckyCache.clear();
    res.json({ ok: true, message: '每日幸运玩家已刷新' });
  } catch (err) {
    console.error('[DailyLucky] 刷新失败:', err);
    res.status(500).json({ error: err.message });
  }
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
  // 同步到内存配置，并刷新在线角色属性
  setClassLevelBonusConfigMem(classId, config);
  const targets = listOnlinePlayers().filter((p) => p.classId === classId);
  await Promise.all(
    targets.map(async (p) => {
      computeDerived(p);
      await sendState(p);
      await savePlayer(p);
    })
  );
  // 离线角色也更新
  const offlineRows = await knex('characters')
    .where({ class: classId })
    .select('user_id', 'name', 'realm_id');
  for (const row of offlineRows) {
    const online = playersByName(row.name, row.realm_id || 1);
    if (online) continue;
    const loaded = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
    if (!loaded) continue;
    computeDerived(loaded);
    await saveCharacter(row.user_id, loaded, row.realm_id || 1);
  }
  res.json({ ok: true, classId, config });
});

// 修炼果配置
app.get('/admin/training-fruit-settings', async (req, res) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: '无管理员权限。' });
    const coefficient = await getTrainingFruitCoefficientDb();
    const dropRate = await getTrainingFruitDropRateDb();
    res.json({ ok: true, coefficient, dropRate });
  } catch (err) {
    console.error('修炼果配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/training-fruit-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { coefficient, dropRate } = req.body || {};
  if (coefficient !== undefined) {
    const parsed = Number(coefficient);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ error: '系数必须为有效数字且不小于0' });
    }
    await setTrainingFruitCoefficientDb(parsed);
  }
  if (dropRate !== undefined) {
    const parsed = Number(dropRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      return res.status(400).json({ error: '爆率必须为有效数字且在0到1之间' });
    }
    await setTrainingFruitDropRateDb(parsed);
  }
  // 更新内存中的配置
  const newCoefficient = await getTrainingFruitCoefficientDb();
  const newDropRate = await getTrainingFruitDropRateDb();
  setTrainingFruitCoefficient(newCoefficient);
  setTrainingFruitDropRateConfig(newDropRate);
  res.json({ ok: true, coefficient: newCoefficient, dropRate: newDropRate });
});

// 修炼系统配置
app.get('/admin/training-settings', async (req, res) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: '无管理员权限。' });
    const config = await getTrainingPerLevelConfigDb();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('修炼系统配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/training-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { config } = req.body || {};
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: '配置对象不能为空' });
  }
  const validatedConfig = {};
  const keys = ['hp', 'mp', 'atk', 'def', 'mag', 'mdef', 'spirit', 'dex'];
  for (const key of keys) {
    if (config[key] !== undefined) {
      const parsed = Number(config[key]);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: `${key} 必须为有效数字且不小于0` });
      }
      validatedConfig[key] = parsed;
    }
  }
  await setTrainingPerLevelConfigDb(validatedConfig);
  // 更新内存中的配置
  const newConfig = await getTrainingPerLevelConfigDb();
  setTrainingPerLevelConfigMem(newConfig);
  res.json({ ok: true, config: newConfig });
});

// 锻造系统配置
app.get('/admin/refine-settings', async (req, res) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: '无管理员权限。' });
    const baseSuccessRate = await getRefineBaseSuccessRateDb();
    const decayRate = await getRefineDecayRateDb();
    const materialCount = await getRefineMaterialCountDb();
    const bonusPerLevel = await getRefineBonusPerLevelDb();
    res.json({ ok: true, baseSuccessRate, decayRate, materialCount, bonusPerLevel });
  } catch (err) {
    console.error('锻造系统配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/refine-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { baseSuccessRate, decayRate, materialCount, bonusPerLevel } = req.body || {};

  if (baseSuccessRate !== undefined) {
    const parsed = Number(baseSuccessRate);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      return res.status(400).json({ error: '基础成功率必须在1-100之间' });
    }
    await setRefineBaseSuccessRateDb(parsed);
  }

  if (decayRate !== undefined) {
    const parsed = Number(decayRate);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ error: '衰减率必须为有效数字且不小于0' });
    }
    await setRefineDecayRateDb(parsed);
  }

  if (materialCount !== undefined) {
    const parsed = Number(materialCount);
    if (isNaN(parsed) || parsed < 1) {
      return res.status(400).json({ error: '材料数量必须为正整数' });
    }
    await setRefineMaterialCountDb(parsed);
  }

  if (bonusPerLevel !== undefined) {
    const parsed = Number(bonusPerLevel);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ error: '每级加成值必须为有效数字且不小于0' });
    }
    await setRefineBonusPerLevelDb(parsed);
  }

  // 更新内存中的配置
  const newBaseSuccessRate = await getRefineBaseSuccessRateDb();
  const newDecayRate = await getRefineDecayRateDb();
  const newMaterialCount = await getRefineMaterialCountDb();
  const newBonusPerLevel = await getRefineBonusPerLevelDb();
  setRefineBaseSuccessRate(newBaseSuccessRate);
  setRefineDecayRate(newDecayRate);
  setRefineMaterialCount(newMaterialCount);
  setRefineBonusPerLevel(newBonusPerLevel);
  res.json({ ok: true, baseSuccessRate: newBaseSuccessRate, decayRate: newDecayRate, materialCount: newMaterialCount, bonusPerLevel: newBonusPerLevel });
});

// 特效重置配置
app.get('/admin/effect-reset-settings', async (req, res) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: '无管理员权限。' });
    const successRate = await getEffectResetSuccessRateDb();
    const doubleRate = await getEffectResetDoubleRateDb();
    const tripleRate = await getEffectResetTripleRateDb();
    const quadrupleRate = await getEffectResetQuadrupleRateDb();
    const quintupleRate = await getEffectResetQuintupleRateDb();
    const dropSingleChance = await getEffectDropSingleChanceDb();
    const dropDoubleChance = await getEffectDropDoubleChanceDb();
    const equipSkillDropChance = await getEquipSkillDropChanceDb();
    res.json({ ok: true, successRate, doubleRate, tripleRate, quadrupleRate, quintupleRate, dropSingleChance, dropDoubleChance, equipSkillDropChance });
  } catch (err) {
    console.error('特效重置配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/effect-reset-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { successRate, doubleRate, tripleRate, quadrupleRate, quintupleRate, dropSingleChance, dropDoubleChance, equipSkillDropChance } = req.body || {};

  if (successRate !== undefined) {
    const parsed = Number(successRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '成功率必须在0-100之间' });
    }
    await setEffectResetSuccessRateDb(parsed);
  }

  if (doubleRate !== undefined) {
    const parsed = Number(doubleRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '双特效概率必须在0-100之间' });
    }
    await setEffectResetDoubleRateDb(parsed);
  }

  if (tripleRate !== undefined) {
    const parsed = Number(tripleRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '3特效概率必须在0-100之间' });
    }
    await setEffectResetTripleRateDb(parsed);
  }

  if (quadrupleRate !== undefined) {
    const parsed = Number(quadrupleRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '4特效概率必须在0-100之间' });
    }
    await setEffectResetQuadrupleRateDb(parsed);
  }

  if (quintupleRate !== undefined) {
    const parsed = Number(quintupleRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '5特效概率必须在0-100之间' });
    }
    await setEffectResetQuintupleRateDb(parsed);
  }

  if (dropSingleChance !== undefined) {
    const parsed = Number(dropSingleChance);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '单特效掉落概率必须在0-100之间' });
    }
    await setEffectDropSingleChanceDb(parsed);
  }

  if (dropDoubleChance !== undefined) {
    const parsed = Number(dropDoubleChance);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '双特效掉落概率必须在0-100之间' });
    }
    await setEffectDropDoubleChanceDb(parsed);
  }

  if (equipSkillDropChance !== undefined) {
    const parsed = Number(equipSkillDropChance);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      return res.status(400).json({ error: '附加技能掉落概率必须在0-100之间' });
    }
    await setEquipSkillDropChanceDb(parsed);
  }

  // 更新内存中的配置
  const newSuccessRate = await getEffectResetSuccessRateDb();
  const newDoubleRate = await getEffectResetDoubleRateDb();
  const newTripleRate = await getEffectResetTripleRateDb();
  const newQuadrupleRate = await getEffectResetQuadrupleRateDb();
  const newQuintupleRate = await getEffectResetQuintupleRateDb();
  const newDropSingleChance = await getEffectDropSingleChanceDb();
  const newDropDoubleChance = await getEffectDropDoubleChanceDb();
  const newEquipSkillDropChance = await getEquipSkillDropChanceDb();
  setEffectResetSuccessRate(newSuccessRate);
  setEffectResetDoubleRate(newDoubleRate);
  setEffectResetTripleRate(newTripleRate);
  setEffectResetQuadrupleRate(newQuadrupleRate);
  setEffectResetQuintupleRate(newQuintupleRate);
  setEffectDropSingleChance(newDropSingleChance);
  setEffectDropDoubleChance(newDropDoubleChance);
  setEquipSkillDropChance(newEquipSkillDropChance);
  res.json({ ok: true, successRate: newSuccessRate, doubleRate: newDoubleRate, tripleRate: newTripleRate, quadrupleRate: newQuadrupleRate, quintupleRate: newQuintupleRate, dropSingleChance: newDropSingleChance, dropDoubleChance: newDropDoubleChance, equipSkillDropChance: newEquipSkillDropChance });
});

// 修炼配置（普通玩家）
app.get('/api/training-config', async (req, res) => {
  try {
    const config = await getTrainingPerLevelConfigDb();
    res.json({ ok: true, config });
  } catch (err) {
    console.error('修炼配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
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
  const respawnMinutes = await getSpecialBossRespawnMinutes();
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
    respawnMinutes,
    playerBonusConfig
  });
});

app.post('/admin/specialboss-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { dropBonus, baseHp, baseAtk, baseDef, baseMdef, baseExp, baseGold, respawnMinutes, playerBonusConfig } = req.body || {};

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
  if (respawnMinutes !== undefined) {
    await setSpecialBossRespawnMinutes(Math.max(1, Math.floor(Number(respawnMinutes) || 60)));
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
  await applyWorldBossSettings();
  await applyCultivationBossSettings();

  res.json({ ok: true });
});

// 修真BOSS配置（按倍率调整）
app.get('/admin/cultivationboss-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const dropBonus = await getCultivationBossDropBonus();
  const baseHp = await getWorldBossBaseHp();
  const baseAtk = await getWorldBossBaseAtk();
  const baseDef = await getWorldBossBaseDef();
  const baseMdef = await getWorldBossBaseMdef();
  const baseExp = await getWorldBossBaseExp();
  const baseGold = await getWorldBossBaseGold();
  const respawnMinutes = await getWorldBossRespawnMinutes();
  const playerBonusConfig = await getCultivationBossPlayerBonusConfig();
  res.json({
    ok: true,
    dropBonus,
    baseHp,
    baseAtk,
    baseDef,
    baseMdef,
    baseExp,
    baseGold,
    respawnMinutes,
    playerBonusConfig
  });
});

app.post('/admin/cultivationboss-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { dropBonus, baseHp, baseAtk, baseDef, baseMdef, baseExp, baseGold, respawnMinutes, playerBonusConfig } = req.body || {};

  if (dropBonus !== undefined) {
    await setCultivationBossDropBonus(Math.max(1, Math.floor(Number(dropBonus) || 1.5)));
  }
  if (baseHp !== undefined) {
    const normalized = Math.max(1, Math.floor(Number(baseHp) || 600000));
    await setWorldBossBaseHp(normalized);
    await setCultivationBossBaseHp(normalized);
  }
  if (baseAtk !== undefined) {
    const normalized = Math.max(1, Math.floor(Number(baseAtk) || 180));
    await setWorldBossBaseAtk(normalized);
    await setCultivationBossBaseAtk(normalized);
  }
  if (baseDef !== undefined) {
    const normalized = Math.max(0, Math.floor(Number(baseDef) || 210));
    await setWorldBossBaseDef(normalized);
    await setCultivationBossBaseDef(normalized);
  }
  if (baseMdef !== undefined) {
    const normalized = Math.max(0, Math.floor(Number(baseMdef) || 210));
    await setWorldBossBaseMdef(normalized);
    await setCultivationBossBaseMdef(normalized);
  }
  if (baseExp !== undefined) {
    const normalized = Math.max(1, Math.floor(Number(baseExp) || 9000));
    await setWorldBossBaseExp(normalized);
    await setCultivationBossBaseExp(normalized);
  }
  if (baseGold !== undefined) {
    const normalized = Math.max(0, Math.floor(Number(baseGold) || 2000));
    await setWorldBossBaseGold(normalized);
    await setCultivationBossBaseGold(normalized);
  }
  if (respawnMinutes !== undefined) {
    const normalized = Math.max(1, Math.floor(Number(respawnMinutes) || 60));
    await setWorldBossRespawnMinutes(normalized);
    await setCultivationBossRespawnMinutes(normalized);
  }

  if (playerBonusConfig !== undefined) {
    if (!Array.isArray(playerBonusConfig)) {
      return res.status(400).json({ error: 'playerBonusConfig格式错误' });
    }
    const validConfig = playerBonusConfig.map((config) => ({
      min: Math.max(1, Math.floor(Number(config.min) || 1)),
      hp: Math.max(0, Math.floor(Number(config.hp) || 0)),
      atk: Math.max(0, Math.floor(Number(config.atk) || 0)),
      def: Math.max(0, Math.floor(Number(config.def) || 0)),
      mdef: Math.max(0, Math.floor(Number(config.mdef) || 0))
    }));
    await setCultivationBossPlayerBonusConfig(validConfig);
  }

  await applyCultivationBossSettings();

  res.json({ ok: true });
});

app.get('/admin/specialboss-killcount', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const realmId = Number(req.query?.realmId);
  if (Number.isFinite(realmId)) {
    const count = await getSpecialBossKillCount(realmId);
    return res.json({ ok: true, realmId, count });
  }
  const data = [];
  for (const id of getRealmIds()) {
    const count = await getSpecialBossKillCount(id);
    data.push({ realmId: id, count });
  }
  return res.json({ ok: true, data });
});

app.post('/admin/specialboss-killcount/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { realmId, count } = req.body || {};
  const targetRealmId = Number(realmId);
  if (!Number.isFinite(targetRealmId)) {
    return res.status(400).json({ error: 'realmId参数无效' });
  }
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  await setSpecialBossKillCount(normalized, targetRealmId);
  setSpecialBossKillCountState(normalized, targetRealmId);
  return res.json({ ok: true, realmId: targetRealmId, count: normalized });
});

app.get('/admin/cultivationboss-killcount', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const realmId = Number(req.query?.realmId);
  if (Number.isFinite(realmId)) {
    const count = await getCultivationBossKillCount(realmId);
    return res.json({ ok: true, realmId, count });
  }
  const data = [];
  for (const id of getRealmIds()) {
    const count = await getCultivationBossKillCount(id);
    data.push({ realmId: id, count });
  }
  return res.json({ ok: true, data });
});

app.post('/admin/cultivationboss-killcount/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { realmId, count } = req.body || {};
  const targetRealmId = Number(realmId);
  if (!Number.isFinite(targetRealmId)) {
    return res.status(400).json({ error: 'realmId参数无效' });
  }
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  await setCultivationBossKillCount(normalized, targetRealmId);
  setCultivationBossKillCountState(normalized, targetRealmId);
  return res.json({ ok: true, realmId: targetRealmId, count: normalized });
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

    // 仅强制下线源区与目标区玩家
    for (const player of Array.from(players.values())) {
      if ((player.realmId || 1) !== sourceId && (player.realmId || 1) !== targetId) continue;
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

    // 仅清除源区与目标区的session，强制相关玩家重新登录
    await clearRealmSessions([sourceId, targetId]);

  // 返回结果，不包含备份数据（数据量太大，前端通过单独接口下载）
  res.json({
    ok: true,
    sourceId,
    targetId,
      message: `合区完成。角色: ${stats.characters}, 行会: ${stats.guilds}, 邮件: ${stats.mails}, 寄售: ${stats.consignments}, 寄售历史: ${stats.consignmentHistory}, 沙巴克报名: ${stats.sabakRegistrations}。所有服务器ID已重新编号，保持连续性。源区与目标区玩家已强制下线，请重新登录。`,
    backupAvailable: true
  });
});

// 自动备份功能
const BACKUP_DIR = path.join(__dirname, '../data/backup');
const BACKUP_RETENTION_DAYS = 30;

async function performAutoBackup() {
  try {
    console.log('[AutoBackup] 开始执行自动备份...');

    // 确保备份目录存在
    if (!existsSync(BACKUP_DIR)) {
      await mkdir(BACKUP_DIR, { recursive: true });
      console.log(`[AutoBackup] 创建备份目录: ${BACKUP_DIR}`);
    }

    // 获取所有表的数据
    const tables = {};
    for (const name of BACKUP_TABLES) {
      if (await knex.schema.hasTable(name)) {
        tables[name] = await knex(name).select('*');
      }
    }

    // 生成备份文件名（按日期）
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const backupFileName = `text-legend-backup-${dateStr}-${timeStr}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);

    // 准备备份内容
    const payload = {
      meta: {
        version: 1,
        db_client: config.db.client,
        exported_at: now.toISOString(),
        auto_backup: true
      },
      tables
    };

    // 写入备份文件
    await import('node:fs/promises').then(fs => fs.writeFile(backupFilePath, JSON.stringify(payload, null, 2)));
    console.log(`[AutoBackup] 备份完成: ${backupFileName}`);

    // 清理超过30天的旧备份
    await cleanupOldBackups();

    // 清理当天的旧备份（保留最新的）
    await cleanupSameDayBackups(dateStr, backupFileName);

    console.log('[AutoBackup] 自动备份执行成功');
  } catch (err) {
    console.error('[AutoBackup] 自动备份失败:', err);
  }
}

async function cleanupOldBackups() {
  try {
    const now = Date.now();
    const files = readdirSync(BACKUP_DIR);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await stat(filePath);
      const fileAge = now - stats.mtimeMs;
      const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      if (fileAge > retentionMs) {
        await unlink(filePath);
        console.log(`[AutoBackup] 删除超过${BACKUP_RETENTION_DAYS}天的备份: ${file}`);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[AutoBackup] 清理完成，删除了 ${deletedCount} 个旧备份文件`);
    }
  } catch (err) {
    console.error('[AutoBackup] 清理旧备份失败:', err);
  }
}

async function cleanupSameDayBackups(dateStr, currentFileName) {
  try {
    const files = readdirSync(BACKUP_DIR);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      if (file === currentFileName) continue; // 跳过当前文件

      // 删除同日期的其他备份文件（保留最新的）
      if (file.includes(dateStr)) {
        const filePath = path.join(BACKUP_DIR, file);
        await unlink(filePath);
        console.log(`[AutoBackup] 删除同日旧备份: ${file}`);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[AutoBackup] 清理同日备份完成，删除了 ${deletedCount} 个旧备份`);
    }
  } catch (err) {
    console.error('[AutoBackup] 清理同日备份失败:', err);
  }
}

function scheduleAutoBackup() {
  // 每天凌晨0点执行
  cron.schedule('0 0 * * *', async () => {
    await performAutoBackup();
  });

  console.log('[AutoBackup] 已设置每日0点自动备份，备份目录: data/backup，保留30天');
}

// 每日0点自动更新排行榜称号
async function updateRankTitles() {
  console.log('[Rank] 开始自动更新排行榜称号...');

  // 获取所有服务器列表
  const realms = await listRealms();

  // 清空在线玩家称号Map
  onlinePlayerRankTitles.clear();
  const classes = [
    { id: 'warrior', name: '战士' },
    { id: 'mage', name: '法师' },
    { id: 'taoist', name: '道士' }
  ];

  // 为每个服务器独立计算排行榜
  for (const realm of realms) {
    for (const cls of classes) {
      try {
        // 获取该服务器该职业的玩家
        const allCharacters = await listAllCharacters(realm.id);
        const classPlayers = allCharacters.filter(p => p.classId === cls.id);

        // 计算并排序
        const rankedPlayers = classPlayers
          .map(p => {
            computeDerived(p);
            return {
              name: p.name,
              realmId: p.realmId || 1,
              atk: Math.floor(p.atk || 0),
              mag: Math.floor(p.mag || 0),
              spirit: Math.floor(p.spirit || 0)
            };
          })
          .sort((a, b) => {
            if (cls.id === 'warrior') return b.atk - a.atk;
            if (cls.id === 'mage') return b.mag - a.mag;
            return b.spirit - a.spirit;
          });

        // 清除该服务器该职业所有玩家的排行榜称号
        await knex('characters')
          .where({ class: cls.id, realm_id: realm.id })
          .update({ rank_title: null });

        // 为第一名设置称号
        if (rankedPlayers.length > 0) {
          const topPlayer = rankedPlayers[0];
          const rankTitle = `天下第一${cls.name}`;
          await knex('characters')
            .where({ name: topPlayer.name, realm_id: realm.id })
            .update({ rank_title: rankTitle });

          // 如果第一名在线，通知玩家
          const topPlayerObj = playersByName(topPlayer.name, realm.id);
          if (topPlayerObj) {
            topPlayerObj.send(`恭喜！你已成为${cls.name}排行榜第一名，获得称号：${rankTitle}`);
            topPlayerObj.rankTitle = rankTitle;
            // 更新在线玩家称号Map
            onlinePlayerRankTitles.set(topPlayer.name, rankTitle);
          }

          // 通知该职业其他在线玩家称号被清除
          for (const p of classPlayers) {
            if (p.name !== topPlayer.name) {
              const playerObj = playersByName(p.name, realm.id);
              if (playerObj && playerObj.rankTitle) {
                playerObj.send(`你已不再是${cls.name}排行榜第一名，称号已被收回`);
                playerObj.rankTitle = null;
                // 从在线玩家称号Map中移除
                onlinePlayerRankTitles.delete(p.name);
              }
            }
          }

          console.log(`[Rank] ${realm.name} - ${cls.name}排行榜第一名: ${topPlayer.name}，称号: ${rankTitle}`);
        } else {
          console.log(`[Rank] ${realm.name} - ${cls.name}排行榜暂无玩家`);
        }
      } catch (err) {
        console.error(`[Rank] 更新${realm.name} ${cls.name}排行榜失败:`, err);
      }
    }
  }

  console.log('[Rank] 排行榜称号更新完成');
}

const DAILY_LUCKY_ATTRS = [
  { key: 'atk', label: '攻击' },
  { key: 'def', label: '防御' },
  { key: 'mag', label: '魔法' },
  { key: 'mdef', label: '魔御' },
  { key: 'spirit', label: '道术' },
  { key: 'dex', label: '敏捷' },
  { key: 'max_hp', label: '生命上限' },
  { key: 'max_mp', label: '法力上限' }
];

function pickDailyLuckyAttr() {
  return DAILY_LUCKY_ATTRS[randInt(0, DAILY_LUCKY_ATTRS.length - 1)];
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function updateCharacterFlagsInRealm(name, realmId, flags) {
  await knex('characters')
    .where({ name, realm_id: realmId })
    .update({ flags_json: JSON.stringify(flags || {}), updated_at: knex.fn.now() });
}

async function clearDailyLuckyForRealm(realmId) {
  const allCharacters = await listAllCharacters(realmId);
  for (const character of allCharacters) {
    if (!character.flags?.dailyLucky && !character.flags?.dailyLuckyTitle) continue;
    const online = playersByName(character.name, realmId);
    if (online) {
      if (!online.flags) online.flags = {};
      delete online.flags.dailyLucky;
      delete online.flags.dailyLuckyTitle;
      computeDerived(online);
      await sendState(online);
      await savePlayer(online);
      online.send('每日幸运加成已清除。');
    } else {
      const flags = { ...(character.flags || {}) };
      delete flags.dailyLucky;
      delete flags.dailyLuckyTitle;
      await updateCharacterFlagsInRealm(character.name, realmId, flags);
    }
  }
  await setSetting(`daily_lucky_player_${realmId}`, '');
  await setSetting(`daily_lucky_attr_${realmId}`, '');
}

async function assignDailyLuckyForRealm(realmId, realmName = '') {
  const allCharacters = await listAllCharacters(realmId);
  if (!allCharacters.length) {
    return null;
  }
  const target = allCharacters[randInt(0, allCharacters.length - 1)];
  const attr = pickDailyLuckyAttr();
  const payload = { attr: attr.key, multiplier: 2, assignedAt: Date.now() };
  const online = playersByName(target.name, realmId);
  if (online) {
    if (!online.flags) online.flags = {};
    online.flags.dailyLucky = payload;
    online.flags.dailyLuckyTitle = '欧皇';
    computeDerived(online);
    await sendState(online);
    await savePlayer(online);
    online.send(`你被选为今日幸运玩家，${attr.label}提升100%，称号：欧皇！`);
  } else {
    const flags = { ...(target.flags || {}), dailyLucky: payload, dailyLuckyTitle: '欧皇' };
    await updateCharacterFlagsInRealm(target.name, realmId, flags);
  }
  const realmTag = realmName ? `(${realmName})` : '';
  console.log(`[DailyLucky] ${realmTag} 幸运玩家: ${target.name}, 属性: ${attr.label}`);
  await setSetting(`daily_lucky_player_${realmId}`, target.name);
  await setSetting(`daily_lucky_attr_${realmId}`, attr.label);
  return { name: target.name, attr: attr.label };
}

async function refreshDailyLucky() {
  const realms = await listRealms();
  const realmList = realms.length ? realms : [{ id: 1, name: '默认' }];
  const todayKey = getLocalDateKey();
  for (const realm of realmList) {
    try {
      const dateKey = `daily_lucky_date_${realm.id}`;
      const lastKey = await getSetting(dateKey, '');
      if (lastKey === todayKey) {
        continue;
      }
      await clearDailyLuckyForRealm(realm.id);
      await assignDailyLuckyForRealm(realm.id, realm.name);
      await setSetting(`daily_lucky_date_${realm.id}`, todayKey);
    } catch (err) {
      console.error(`[DailyLucky] 更新失败: realm=${realm.id}`, err);
    }
  }
}

// 设置排行榜自动更新
function setupRankUpdate() {
  cron.schedule('0 0 * * *', async () => {
    await updateRankTitles();
  });
  console.log('[Rank] 已设置每日0点自动更新排行榜称号');

  // 服务器启动时立即执行一次
  updateRankTitles().catch(err => {
    console.error('[Rank] 服务器启动时更新排行榜失败:', err);
  });
}

function setupDailyLucky() {
  cron.schedule('0 0 * * *', async () => {
    await refreshDailyLucky();
  });
  console.log('[DailyLucky] 已设置每日0点抽取幸运玩家');

  refreshDailyLucky().catch(err => {
    console.error('[DailyLucky] 服务器启动时抽取失败:', err);
  });
}

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
    res.status(500).json({ error: '设置称号失败: ' + err.message });
  }
});

// ==================== 装备管理接口 ====================

// 获取怪物列表（用于装备掉落配置）
app.get('/admin/mobs', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  try {
    const mobs = Object.entries(MOB_TEMPLATES).map(([id, mob]) => ({
      id,
      name: mob.name,
      level: mob.level,
      specialBoss: mob.specialBoss || false,
      worldBoss: mob.worldBoss || false
    })).sort((a, b) => a.level - b.level);

    res.json({ ok: true, mobs });
  } catch (err) {
    res.status(500).json({ error: '获取怪物列表失败: ' + err.message });
  }
});

// 获取ITEM_TEMPLATES中的装备列表
app.get('/admin/items/templates', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  try {
    const templates = getItemTemplates();
    const check = await checkImportedItems(templates.map(t => t.item_id));

    res.json({ ok: true, templates, imported: check.imported });
  } catch (err) {
    res.status(500).json({ error: '获取装备模板失败: ' + err.message });
  }
});

// 检查装备导入状态
app.get('/admin/items/import/check', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const itemIds = req.query.ids ? req.query.ids.split(',') : [];

  try {
    const check = await checkImportedItems(itemIds);
    res.json({ ok: true, ...check });
  } catch (err) {
    res.status(500).json({ error: '检查导入状态失败: ' + err.message });
  }
});

// 导入装备
app.post('/admin/items/import', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { itemIds } = req.body;

  console.log('=== Import items called ===');
  console.log('itemIds:', itemIds);

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: '请选择要导入的装备。' });
  }

  try {
    const results = await importItemsDb(itemIds);
    console.log('Import results:', results);
    res.json({ ok: true, results });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: '导入装备失败: ' + err.message });
  }
});

// 获取装备列表
app.get('/admin/items', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const result = await listItems(page, limit);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: '获取装备列表失败: ' + err.message });
  }
});

// 搜索装备
app.get('/admin/items/search', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const keyword = req.query.keyword || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const result = await searchItemsDb(keyword, page, limit);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: '搜索装备失败: ' + err.message });
  }
});

// 获取装备详情
app.get('/admin/items/:id', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { id } = req.params;

  console.log(`=== Get item details called, id=${id} ===`);

  try {
    const item = await getItemById(parseInt(id));
    if (!item) {
      return res.status(404).json({ error: '装备不存在。' });
    }
    console.log('Item found:', item);
    const drops = await getItemDrops(item.id);
    console.log('Drops found:', drops);
    res.json({ ok: true, item, drops });
  } catch (err) {
    console.error('Get item details error:', err);
    res.status(500).json({ error: '获取装备详情失败: ' + err.message });
  }
});

// 创建装备
app.post('/admin/items', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const data = req.body;

  if (!data.item_id || !data.name || !data.type) {
    return res.status(400).json({ error: '缺少必要参数。' });
  }

  try {
    const result = await createItemDb(data);
    res.json({ ok: true, item: result });
  } catch (err) {
    res.status(500).json({ error: '创建装备失败: ' + err.message });
  }
});

// 更新装备
app.put('/admin/items/:id', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { id } = req.params;
  const data = req.body;

  try {
    const item = await updateItemDb(parseInt(id), data);
    if (!item) {
      return res.status(404).json({ error: '装备不存在。' });
    }
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ error: '更新装备失败: ' + err.message });
  }
});

// 删除装备
app.delete('/admin/items/:id', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { id } = req.params;

  try {
    await deleteItemDb(parseInt(id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '删除装备失败: ' + err.message });
  }
});

// 添加装备掉落配置
app.post('/admin/items/:id/drops', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { id } = req.params;
  const { mobId, dropChance } = req.body;

  if (!mobId || dropChance === undefined || dropChance === null) {
    return res.status(400).json({ error: '缺少必要参数。' });
  }

  if (dropChance < 0 || dropChance > 1) {
    return res.status(400).json({ error: '掉落概率必须在0-1之间。' });
  }

  try {
    const drop = await addItemDropDb(parseInt(id), mobId, parseFloat(dropChance));
    res.json({ ok: true, drop });
  } catch (err) {
    res.status(500).json({ error: '添加掉落配置失败: ' + err.message });
  }
});

// 批量设置装备掉落配置
app.put('/admin/items/:id/drops', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { id } = req.params;
  const { drops } = req.body;

  if (!drops || !Array.isArray(drops)) {
    return res.status(400).json({ error: '掉落配置格式错误。' });
  }

  try {
    const result = await setItemDropsDb(parseInt(id), drops);
    res.json({ ok: true, drops: result });
  } catch (err) {
    res.status(500).json({ error: '设置掉落配置失败: ' + err.message });
  }
});

// 删除装备掉落配置
app.delete('/admin/items/:itemId/drops/:dropId', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const { dropId } = req.params;

  try {
    await deleteItemDropDb(parseInt(dropId));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '删除掉落配置失败: ' + err.message });
  }
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
  const numeric = Number(realmId);
  const id = Number.isFinite(numeric) ? (numeric === 0 ? 0 : (numeric || 1)) : 1;
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
  return Array.from(new Set([0, 1, ...ids]));
}

const sabakConfig = {
  startHour: 20,
  startMinute: 0,
  durationMinutes: 10,
  siegeMinutes: 10
};
const crossRankConfig = {
  startHour: 19,
  startMinute: 0,
  durationMinutes: 10
};
const deviceOnlineMap = new Map();
const CROSS_REALM_ZONE_ID = 'crb';
const CROSS_RANK_ZONE_ID = 'crr';
const CROSS_RANK_ROOM_ID = 'arena';
const CROSS_REALM_REALM_ID = 0;
const CROSS_REALM_ZONES = new Set([CROSS_REALM_ZONE_ID, CROSS_RANK_ZONE_ID]);
const CULTIVATION_ZONE_ID = 'cultivation';
const CULTIVATION_BOSS_ROOM_PREFIX = 'boss_';

const CROSS_RANK_EVENT_STATE = {
  active: false,
  startAt: null,
  endAt: null,
  stats: new Map()
};

async function loadEventTimeSettings() {
  sabakConfig.startHour = await getSabakStartHour();
  sabakConfig.startMinute = await getSabakStartMinute();
  sabakConfig.durationMinutes = await getSabakDurationMinutes();
  sabakConfig.siegeMinutes = sabakConfig.durationMinutes;

  crossRankConfig.startHour = await getCrossRankStartHour();
  crossRankConfig.startMinute = await getCrossRankStartMinute();
  crossRankConfig.durationMinutes = await getCrossRankDurationMinutes();
}

function getRoomRealmId(zoneId, roomId, realmId = 1) {
  if (CROSS_REALM_ZONES.has(zoneId)) return CROSS_REALM_REALM_ID;
  if (zoneId === CULTIVATION_ZONE_ID && typeof roomId === 'string' && roomId.startsWith(CULTIVATION_BOSS_ROOM_PREFIX)) {
    return CROSS_REALM_REALM_ID;
  }
  return Number(realmId) || 1;
}

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

function sendToRoom(realmId, zoneId, roomId, message) {
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const roomPlayers = listOnlinePlayers(effectiveRealmId)
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId);
  roomPlayers.forEach((p) => sendTo(p, message));
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

const RARITY_ORDER = ['ultimate', 'supreme', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
const RARITY_NORMAL = {
  ultimate: 0,
  supreme: 0.0005,
  legendary: 0.001,
  epic: 0.005,
  rare: 0.02,
  uncommon: 0.06,
  common: 0.15
};
const RARITY_BOSS = {
  ultimate: 0,
  supreme: 0.003,
  legendary: 0.007,
  epic: 0.03,
  rare: 0.08,
  uncommon: 0.18,
  common: 0.35
};
const RARITY_LABELS = {
  ultimate: '终极',
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
  const pools = { common: [], uncommon: [], rare: [], epic: [], legendary: [], supreme: [], ultimate: [] };
  Object.values(ITEM_TEMPLATES).forEach((item) => {
    if (item.type === 'currency') return;
    if (!['weapon', 'armor', 'accessory', 'book', 'material', 'consumable'].includes(item.type)) return;
    const rarity = rarityByPrice(item);
    pools[rarity].push(item.id);
  });
  return pools;
})();

const EQUIPMENT_POOLS = (() => {
  const pools = { common: [], uncommon: [], rare: [], epic: [], legendary: [], supreme: [], ultimate: [] };
  Object.entries(ITEM_POOLS).forEach(([rarity, ids]) => {
    pools[rarity] = ids.filter((id) => {
      const item = ITEM_TEMPLATES[id];
      return item && ['weapon', 'armor', 'accessory'].includes(item.type);
    });
  });
  return pools;
})();

function isSetItem(itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !item.name) return false;
  return item.name.includes('(套)');
}

// 特效装备掉落常量（已迁移到配置，这里保留默认值用于初始化）
const EFFECT_SINGLE_CHANCE_DEFAULT = 0.009;
const EFFECT_DOUBLE_CHANCE_DEFAULT = 0.001;
const COMBO_PROC_CHANCE = 0.1;
const ASSASSINATE_SECONDARY_DAMAGE_RATE = 0.3;
const SABAK_TAX_RATE = 0.2;
const GUILD_BONUS_MULT = 2;
const CULTIVATION_REWARD_MULT_PER_LEVEL = 1;
const DEFAULT_CMD_RATE_LIMITS = {
  global: { limit: 12, windowMs: 10000 },
  burst: { limit: 60, windowMs: 10000 }
};
const DEFAULT_CMD_COOLDOWNS_MS = {
  forge: 1200,
  refine: 1200,
  effect: 1200,
  consign: 800,
  trade: 800,
  mail: 800
};
const commandRateState = new Map();
const commandCooldownState = new Map();
let cmdRateCache = { value: null, updatedAt: 0 };

async function getCmdRateSettingsCached() {
  const now = Date.now();
  if (cmdRateCache.value && now - cmdRateCache.updatedAt < 10000) {
    return cmdRateCache.value;
  }
  const rawLimits = await getCmdRateLimits();
  const rawCooldowns = await getCmdCooldowns();
  const rateLimits = {
    global: {
      limit: Math.max(1, Math.floor(Number(rawLimits?.global?.limit) || DEFAULT_CMD_RATE_LIMITS.global.limit)),
      windowMs: Math.max(100, Math.floor(Number(rawLimits?.global?.windowMs) || DEFAULT_CMD_RATE_LIMITS.global.windowMs))
    },
    burst: {
      limit: Math.max(1, Math.floor(Number(rawLimits?.burst?.limit) || DEFAULT_CMD_RATE_LIMITS.burst.limit)),
      windowMs: Math.max(100, Math.floor(Number(rawLimits?.burst?.windowMs) || DEFAULT_CMD_RATE_LIMITS.burst.windowMs))
    }
  };
  const cooldowns = { ...DEFAULT_CMD_COOLDOWNS_MS };
  if (rawCooldowns && typeof rawCooldowns === 'object') {
    Object.entries(rawCooldowns).forEach(([key, value]) => {
      const ms = Math.max(0, Math.floor(Number(value) || 0));
      cooldowns[key] = ms;
    });
  }
  cmdRateCache = { value: { rateLimits, cooldowns }, updatedAt: now };
  return cmdRateCache.value;
}

function hitRateLimit(player, key, limit, windowMs) {
  const id = `${player.name}:${key}`;
  const now = Date.now();
  const entry = commandRateState.get(id) || { count: 0, start: now };
  if (now - entry.start >= windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  commandRateState.set(id, entry);
  return entry.count > limit;
}

function hitCooldown(player, key, cooldownMs) {
  const id = `${player.name}:${key}`;
  const now = Date.now();
  const last = commandCooldownState.get(id) || 0;
  if (now - last < cooldownMs) return true;
  commandCooldownState.set(id, now);
  return false;
}

function cultivationRewardMultiplier(player) {
  const level = Math.floor(Number(player?.flags?.cultivationLevel ?? -1));
  if (Number.isNaN(level) || level < 0) return 1;
  return 1 + (level + 1) * 0.1;
}

function totalRewardMultiplier({ vipActive, guildActive, cultivationMult = 1, partyMult = 1 }) {
  const vipBonus = vipActive ? 1 : 0;
  const guildBonus = guildActive ? 1 : 0;
  const cultivationBonus = Math.max(0, (Number(cultivationMult) || 1) - 1);
  const partyBonus = Math.max(0, (Number(partyMult) || 1) - 1);
  return 1 + vipBonus + guildBonus + cultivationBonus + partyBonus;
}

function buildItemView(itemId, effects = null, durability = null, max_durability = null, refine_level = 0) {
  const item = ITEM_TEMPLATES[itemId] || { id: itemId, name: itemId, type: 'unknown' };
  // 优先使用装备模板中手动设置的 rarity，如果没有才使用价格计算
  const rarity = item.rarity || rarityByPrice(item);
  const effectSkillName = effects?.skill ? getSkillNameById(effects.skill) : '';
  return {
    id: itemId,
    name: item.name,
    type: item.type,
    slot: item.slot || null,
    rarity,
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
    effects: effects || null,
    effectSkillName,
    refine_level: refine_level || 0
  };
}

function buildInventoryItemPayload(slot) {
  const item = ITEM_TEMPLATES[slot.id] || { id: slot.id, name: slot.id, type: 'unknown' };
  const effects = slot.effects || null;
  const effectSkillName = effects?.skill ? getSkillNameById(effects.skill) : '';
  // 检查是否为商店装备
  const isShopItem = Object.values(SHOP_STOCKS).some(stockList => stockList.includes(slot.id));
  // 优先使用装备模板中手动设置的 rarity，如果没有才使用价格计算
  const rarity = item.rarity || rarityByPrice(item);
  return {
    id: slot.id,
    key: getItemKey(slot),
    name: item.name,
    qty: slot.qty,
    type: item.type,
    slot: item.slot || null,
    rarity,
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
    durability: slot.durability ?? null,
    max_durability: slot.max_durability ?? null,
    refine_level: slot.refine_level || 0,
    effects,
    effectSkillName,
    is_shop_item: isShopItem,
    untradable: Boolean(item.untradable),
    unconsignable: Boolean(item.unconsignable)
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
  const view = buildItemView(
    entry.id,
    entry.effects || null,
    entry.durability,
    entry.max_durability,
    entry.refine_level ?? 0
  );
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

function getSkillNameById(skillId) {
  if (!skillId) return '';
  for (const cls of Object.keys(SKILLS)) {
    const skill = SKILLS[cls]?.[skillId];
    if (skill) return skill.name || skillId;
  }
  return skillId;
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
  if (effects.skill) tags.push(`附技:${getSkillNameById(effects.skill)}`);
  if (Number(effects.elementAtk || 0) > 0) tags.push(`元素+${Math.floor(Number(effects.elementAtk))}`);
  return tags.length ? `${item.name}·${tags.join('·')}` : item.name;
}

function formatLegendaryAnnouncement(text, rarity) {
  if (rarity === 'ultimate') return `终极掉落：${text}`;
  if (rarity === 'supreme') return `至尊掉落：${text}`;
  if (rarity === 'legendary') return `传说掉落：${text}`;
  return text;
}

function isCrossRankRoom(zoneId, roomId) {
  return zoneId === CROSS_RANK_ZONE_ID && roomId === CROSS_RANK_ROOM_ID;
}

function isCultivationRoom(zoneId) {
  return zoneId === 'cultivation';
}

function pickEquipmentByRarity(targetRarity) {
  const startIndex = Math.max(0, RARITY_ORDER.indexOf(targetRarity));
  for (let i = startIndex; i < RARITY_ORDER.length; i += 1) {
    const rarity = RARITY_ORDER[i];
    const pool = EQUIPMENT_POOLS[rarity] || [];
    if (!pool.length) continue;
    return pool[randInt(0, pool.length - 1)];
  }
  return null;
}

function chooseCrossRankRewardRarity(rank) {
  if (rank === 1) return 'supreme';
  if (rank === 2 || rank === 3) return Math.random() < 0.05 ? 'supreme' : 'legendary';
  return Math.random() < 0.05 ? 'legendary' : 'epic';
}

function getCrossRankEndAt(now = new Date()) {
  const { start, end } = crossRankWindowRange(now);
  if (now.getTime() >= end.getTime()) {
    const nextStart = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return nextStart.getTime() + crossRankConfig.durationMinutes * 60 * 1000;
  }
  return end.getTime();
}

function getCrossRankStartAt(now = new Date()) {
  const { start, end } = crossRankWindowRange(now);
  if (now.getTime() >= end.getTime()) {
    start.setDate(start.getDate() + 1);
  }
  return start.getTime();
}

function getCrossRankSnapshot(limit = 10) {
  const now = new Date();
  const entries = Array.from(CROSS_RANK_EVENT_STATE.stats.values())
    .filter((entry) => entry.kills > 0)
    .sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return (a.firstKillAt || 0) - (b.firstKillAt || 0);
    })
    .slice(0, limit)
    .map((entry) => ({ name: entry.name, kills: entry.kills }));
  return {
    active: CROSS_RANK_EVENT_STATE.active,
    startsAt: CROSS_RANK_EVENT_STATE.active ? null : getCrossRankStartAt(now),
    endsAt: CROSS_RANK_EVENT_STATE.active ? getCrossRankEndAt(now) : null,
    entries
  };
}

function recordCrossRankKill(attacker, target) {
  if (!CROSS_RANK_EVENT_STATE.active) return;
  if (!attacker || !target) return;
  if (!isCrossRankRoom(attacker.position.zone, attacker.position.room)) return;
  if (target.position.zone !== attacker.position.zone || target.position.room !== attacker.position.room) return;
  const realmId = attacker.realmId || 1;
  const key = `${realmId}:${attacker.name}`;
  const now = Date.now();
  let entry = CROSS_RANK_EVENT_STATE.stats.get(key);
  if (!entry) {
    entry = {
      name: attacker.name,
      userId: attacker.userId,
      realmId,
      kills: 0,
      firstKillAt: now,
      lastKillAt: now
    };
    CROSS_RANK_EVENT_STATE.stats.set(key, entry);
  }
  entry.kills += 1;
  entry.lastKillAt = now;
}

function startCrossRankEvent() {
  CROSS_RANK_EVENT_STATE.active = true;
  CROSS_RANK_EVENT_STATE.startAt = Date.now();
  CROSS_RANK_EVENT_STATE.endAt = null;
  CROSS_RANK_EVENT_STATE.stats.clear();
  const locationData = {
    zoneId: CROSS_RANK_ZONE_ID,
    roomId: CROSS_RANK_ROOM_ID,
    label: '跨服排位赛场 - 跨服排位赛'
  };
  emitAnnouncement(`跨服排位赛已开始（${crossRankWindowInfo()}），前往跨服排位赛场参与！`, 'announce', locationData, null);
}

async function endCrossRankEvent() {
  CROSS_RANK_EVENT_STATE.active = false;
  CROSS_RANK_EVENT_STATE.endAt = Date.now();
  const entries = Array.from(CROSS_RANK_EVENT_STATE.stats.values())
    .filter((entry) => entry.kills > 0)
    .sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return (a.firstKillAt || 0) - (b.firstKillAt || 0);
    });
  CROSS_RANK_EVENT_STATE.stats.clear();
  if (!entries.length) {
    emitAnnouncement('跨服排位赛结束，无人上榜。', 'announce', null, null);
    return;
  }
  const topNames = entries.slice(0, 3).map((entry, idx) => `第${idx + 1}名 ${entry.name}（${entry.kills}杀）`);
  emitAnnouncement(`跨服排位赛结束！${topNames.join('，')}`, 'announce', null, null);
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (!entry.userId) continue;
    const rank = i + 1;
    const rarity = chooseCrossRankRewardRarity(rank);
    const itemId = pickEquipmentByRarity(rarity);
    if (!itemId) continue;
    const effects = rollEquipmentEffects(itemId);
    const items = [{ id: itemId, qty: 1, effects }];
    const title = '跨服排位赛奖励';
    const body = `恭喜你在跨服排位赛中获得第${rank}名（击杀数:${entry.kills}），奖励: ${formatItemLabel(itemId, effects)}。`;
    try {
      await sendMail(entry.userId, entry.name, '系统', null, title, body, items, 0, entry.realmId);
      const online = Array.from(players.values()).find((p) => p.userId === entry.userId);
      if (online) {
        online.send(`跨服排位赛奖励已发送：${formatItemLabel(itemId, effects)}。`);
      }
    } catch (err) {
      console.warn('Failed to send cross rank reward:', err);
    }
  }
}

function tickCrossRankEvent() {
  const now = new Date();
  const { start, end } = crossRankWindowRange(now);
  const inWindow = now >= start && now < end;
  if (inWindow && !CROSS_RANK_EVENT_STATE.active) {
    startCrossRankEvent();
    return;
  }
  if (!inWindow && CROSS_RANK_EVENT_STATE.active) {
    endCrossRankEvent().catch((err) => {
      console.warn('Failed to finalize cross rank event:', err);
    });
  }
}

const EQUIP_SKILL_IDS = Object.values(SKILLS).flatMap((group) => Object.values(group).map((skill) => skill.id));

function pickRandomEquipSkillId() {
  if (!EQUIP_SKILL_IDS.length) return null;
  return EQUIP_SKILL_IDS[randInt(0, EQUIP_SKILL_IDS.length - 1)];
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

  // 从配置读取特效掉落概率
  const doubleChance = getEffectDropDoubleChance() / 100;
  const singleChance = getEffectDropSingleChance() / 100;
  const equipSkillChance = getEquipSkillDropChance() / 100;

  let effects = null;
  if (Math.random() <= doubleChance && candidates.length >= 2) {
    const first = randInt(0, candidates.length - 1);
    let second = randInt(0, candidates.length - 1);
    if (second === first) second = (second + 1) % candidates.length;
    effects = {
      [candidates[first]]: true,
      [candidates[second]]: true
    };
  } else if (Math.random() <= singleChance) {
    const pick = candidates[randInt(0, candidates.length - 1)];
    effects = { [pick]: true };
  }
  if (Math.random() <= equipSkillChance) {
    const skillId = pickRandomEquipSkillId();
    if (skillId) {
      if (!effects) effects = {};
      effects.skill = skillId;
    }
  }
  return effects;
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
  const effects = { [pick]: true };
  const equipSkillChance = getEquipSkillDropChance() / 100;
  if (Math.random() <= equipSkillChance) {
    const skillId = pickRandomEquipSkillId();
    if (skillId) effects.skill = skillId;
  }
  return effects;
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

function isCultivationBoss(mobTemplate) {
  return Boolean(mobTemplate?.id && mobTemplate.id.startsWith('cultivation_boss_'));
}

function isSpecialBoss(mobTemplate) {
  return Boolean(mobTemplate?.specialBoss || isCultivationBoss(mobTemplate));
}

function isWorldBossDropMob(mobTemplate) {
  return Boolean(mobTemplate?.worldBoss || isCultivationBoss(mobTemplate));
}

const SPLASH_BOSS_IDS = new Set([
  'molong_boss',
  'dark_woma_boss',
  'dark_zuma_boss',
  'dark_hongmo_boss',
  'dark_huangquan_boss',
  'dark_doublehead_boss',
  'dark_skeleton_boss',
  'sabak_boss',
  'world_boss',
  'cross_world_boss'
]);

function isSplashBossTemplate(mobTemplate) {
  if (!mobTemplate?.specialBoss) return false;
  return SPLASH_BOSS_IDS.has(mobTemplate.id) || isCultivationBoss(mobTemplate);
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
    if (!isWorldBossDropMob(mobTemplate) && (rarity === 'supreme' || rarity === 'ultimate')) continue;
    if (rarity === 'ultimate' && mobTemplate?.id !== 'cross_world_boss') continue;
    if (Math.random() <= Math.min(1, table[rarity] * bonus)) {
      const pool = allowSet
        ? ITEM_POOLS[rarity]
        : ITEM_POOLS[rarity].filter((id) => !isSetItem(id));
      // 排除bossOnly标记的装备，这些应该只在特定BOSS掉落
      const filteredPool = pool.filter((id) => {
        const item = ITEM_TEMPLATES[id];
        if (item?.bossOnly) return false;
        if (item?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return false;
        if (item?.crossWorldBossOnly && mobTemplate?.id !== 'cross_world_boss') return false;
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
    if (!isWorldBossDropMob(mobTemplate) && (rarity === 'supreme' || rarity === 'ultimate')) continue;
    if (rarity === 'ultimate' && mobTemplate?.id !== 'cross_world_boss') continue;
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
        if (item?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return false;
        if (item?.crossWorldBossOnly && mobTemplate?.id !== 'cross_world_boss') return false;
        return true;
      });
      if (!filteredPool.length) return null;
      return filteredPool[randInt(0, filteredPool.length - 1)];
    }
  }
  return null;
}

let WORLD_BOSS_DROP_BONUS = 1.5;
let SPECIAL_BOSS_DROP_BONUS = 1.5;
let CULTIVATION_BOSS_DROP_BONUS = 1.5;
const bossClassFirstDamageRewardGiven = new Map(); // 追踪特殊BOSS各职业伤害第一奖励是否已发放
const bossClassFirstDamageRewardProcessed = new Set(); // 防止同一只BOSS重复发放职业第一奖励

async function applyWorldBossSettings() {
  // 从数据库加载世界BOSS设置并应用到常量
  WORLD_BOSS_DROP_BONUS = await getWorldBossDropBonus();
  const respawnMinutes = await getWorldBossRespawnMinutes();
  const respawnMs = Math.max(1, respawnMinutes) * 60 * 1000;

  // 应用到世界BOSS模板
  const worldBossTemplate = MOB_TEMPLATES.world_boss;
  if (worldBossTemplate) {
    worldBossTemplate.hp = await getWorldBossBaseHp();
    worldBossTemplate.atk = await getWorldBossBaseAtk();
    worldBossTemplate.def = await getWorldBossBaseDef();
    worldBossTemplate.mdef = await getWorldBossBaseMdef();
    worldBossTemplate.exp = await getWorldBossBaseExp();
    worldBossTemplate.respawnMs = respawnMs;

    const baseGold = await getWorldBossBaseGold();
    worldBossTemplate.gold = [baseGold, Math.floor(baseGold * 1.6)];
  }

  // 应用到跨服世界BOSS模板（同世界BOSS配置）
  const crossWorldBossTemplate = MOB_TEMPLATES.cross_world_boss;
  if (crossWorldBossTemplate) {
    crossWorldBossTemplate.hp = await getWorldBossBaseHp();
    crossWorldBossTemplate.atk = await getWorldBossBaseAtk();
    crossWorldBossTemplate.def = await getWorldBossBaseDef();
    crossWorldBossTemplate.mdef = await getWorldBossBaseMdef();
    crossWorldBossTemplate.exp = await getWorldBossBaseExp();
    crossWorldBossTemplate.respawnMs = respawnMs;

    const baseGold = await getWorldBossBaseGold();
    crossWorldBossTemplate.gold = [baseGold, Math.floor(baseGold * 1.6)];
    if (worldBossTemplate?.drops) {
      const baseDrops = Array.isArray(worldBossTemplate.drops) ? worldBossTemplate.drops : [];
      const extraDrops = Array.isArray(crossWorldBossTemplate.drops) ? crossWorldBossTemplate.drops : [];
      const dropMap = new Map();
      baseDrops.forEach((drop) => {
        if (drop && drop.id) dropMap.set(drop.id, drop);
      });
      extraDrops.forEach((drop) => {
        if (drop && drop.id) dropMap.set(drop.id, drop);
      });
      crossWorldBossTemplate.drops = Array.from(dropMap.values());
    }
  }

  // 加载每名玩家增加的属性值缓存
  await loadWorldBossSettingsCache();
}

async function applySpecialBossSettings() {
  // 从数据库加载特殊BOSS设置并应用到所有特殊BOSS模板
  SPECIAL_BOSS_DROP_BONUS = await getSpecialBossDropBonus();
  const baseHp = await getSpecialBossBaseHp();
  const baseAtk = await getSpecialBossBaseAtk();
  const baseDef = await getSpecialBossBaseDef();
  const baseMdef = await getSpecialBossBaseMdef();
  const baseExp = await getSpecialBossBaseExp();
  const baseGold = await getSpecialBossBaseGold();
  const respawnMinutes = await getSpecialBossRespawnMinutes();
  const respawnMs = Math.max(1, respawnMinutes) * 60 * 1000;

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
      bossTemplate.respawnMs = respawnMs;
    }
  }

  // 加载特殊BOSS人数加成配置缓存
  await loadSpecialBossSettingsCache();
}

async function applyCultivationBossSettings() {
  CULTIVATION_BOSS_DROP_BONUS = await getCultivationBossDropBonus();
  // 修真BOSS属性同步跨服BOSS（跨服BOSS与世界BOSS共用配置）
  const baseHp = await getWorldBossBaseHp();
  const baseAtk = await getWorldBossBaseAtk();
  const baseDef = await getWorldBossBaseDef();
  const baseMdef = await getWorldBossBaseMdef();
  const baseExp = await getWorldBossBaseExp();
  const baseGold = await getWorldBossBaseGold();
  const respawnMinutes = await getWorldBossRespawnMinutes();
  const respawnMs = Math.max(1, respawnMinutes) * 60 * 1000;

  const bossIds = Object.keys(MOB_TEMPLATES).filter((id) => id.startsWith('cultivation_boss_'));
  for (const bossId of bossIds) {
    const bossTemplate = MOB_TEMPLATES[bossId];
    if (!bossTemplate) continue;
    bossTemplate.specialBoss = true;
    bossTemplate.hp = Math.max(1, Math.floor(baseHp));
    bossTemplate.atk = Math.max(1, Math.floor(baseAtk));
    bossTemplate.def = Math.max(0, Math.floor(baseDef));
    bossTemplate.mdef = Math.max(0, Math.floor(baseMdef));
    bossTemplate.exp = Math.max(1, Math.floor(baseExp));
    bossTemplate.gold = [Math.max(0, Math.floor(baseGold)), Math.max(0, Math.floor(baseGold * 1.6))];
    bossTemplate.respawnMs = respawnMs;
  }

  await loadCultivationBossSettingsCache();
}

// 根据房间内玩家数量调整世界BOSS属性（按人数分段加成）
function adjustWorldBossStatsByPlayerCount(zoneId, roomId, realmId) {
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const mobs = getAliveMobs(zoneId, roomId, effectiveRealmId);
  const worldBossMob = mobs.find((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && tpl.worldBoss;
  });
  if (!worldBossMob) return;

  // 获取房间内的在线玩家数量
  const online = listOnlinePlayers(effectiveRealmId);
  const roomPlayers = online.filter(p =>
    p.position &&
    p.position.zone === zoneId &&
    p.position.room === roomId
  );
  const playerCount = roomPlayers.length;

  // 从模板获取基础属性（防止重复叠加）
  const template = MOB_TEMPLATES[worldBossMob.templateId] || MOB_TEMPLATES.world_boss;
  if (!template) return;

  const baseHp = template.hp || worldBossMob.max_hp;
  const baseAtk = template.atk || worldBossMob.atk;
  const baseDef = template.def || worldBossMob.def;
  const baseMdef = template.mdef || worldBossMob.mdef;

  // 获取人数分段加成配置
  const playerBonusConfig = getWorldBossPlayerBonusConfigSync() || [];
  const bonusConfig = pickPlayerBonusConfig(playerBonusConfig, playerCount);

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

// 修真BOSS设置缓存
let cultivationBossSettingsCache = {
  playerBonusConfig: []
};

async function loadCultivationBossSettingsCache() {
  cultivationBossSettingsCache.playerBonusConfig = await getCultivationBossPlayerBonusConfig();
}

function getCultivationBossPlayerBonusConfigSync() {
  return cultivationBossSettingsCache.playerBonusConfig;
}

function dropLoot(mobTemplate, bonus = 1) {
  const loot = [];
  const sabakBonus = mobTemplate.sabakBoss ? 3.0 : 1.0;
  let finalBonus = bonus * sabakBonus;
  if (isWorldBossDropMob(mobTemplate)) {
    finalBonus *= WORLD_BOSS_DROP_BONUS;
  } else if (isCultivationBoss(mobTemplate)) {
    finalBonus *= CULTIVATION_BOSS_DROP_BONUS;
  } else if (mobTemplate?.specialBoss) {
    finalBonus *= SPECIAL_BOSS_DROP_BONUS;
  }
  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      const dropItem = ITEM_TEMPLATES[drop.id];
      if (dropItem?.bossOnly && !isBossMob(mobTemplate)) return;
      if (dropItem?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return;
      if (dropItem?.crossWorldBossOnly && mobTemplate?.id !== 'cross_world_boss') return;
      // 史诗和传说级别的bossOnly装备只能在魔龙教主、世界BOSS、沙巴克BOSS掉落
      if (dropItem?.bossOnly) {
        const rarity = rarityByPrice(dropItem);
        if ((rarity === 'epic' || rarity === 'legendary' || rarity === 'ultimate') && !isSpecialBoss(mobTemplate)) {
          return;
        }
      }
      const chance = Math.min(1, (drop.chance || 0) * finalBonus);
      if (Math.random() <= chance) {
        loot.push({ id: drop.id, effects: rollEquipmentEffects(drop.id) });
      }
    });
  }
  // 全地图怪物都有概率掉落修炼果（爆率可从后台配置，VIP不加成）
  const trainingChance = Math.min(1, getTrainingFruitDropRate());
  if (Math.random() <= trainingChance) {
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

function getTradeByPlayerAny(name, realmId) {
  const direct = getTradeByPlayer(name, realmId);
  if (direct) return { trade: direct, realmId };
  if (realmId !== CROSS_REALM_REALM_ID) {
    const cross = getTradeByPlayer(name, CROSS_REALM_REALM_ID);
    if (cross) return { trade: cross, realmId: CROSS_REALM_REALM_ID };
  }
  return { trade: null, realmId };
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
    trade.offers[playerName] = { gold: 0, yuanbao: 0, items: [] };
  }
  return trade.offers[playerName];
}

function offerText(offer) {
  const parts = [];
  if (offer.gold) parts.push(`金币 ${offer.gold}`);
  if (offer.yuanbao) parts.push(`元宝 ${offer.yuanbao}`);
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
  if (typeof effects.skill === 'string' && effects.skill.trim()) {
    normalized.skill = effects.skill.trim();
  }
  if (Number(effects.elementAtk || 0) > 0) {
    normalized.elementAtk = Math.max(1, Math.floor(Number(effects.elementAtk)));
  }
  return Object.keys(normalized).length ? normalized : null;
}

function normalizeCurrency(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'gold';
  if (raw === 'gold' || raw === 'g' || raw === '金币' || raw === '金') return 'gold';
  if (raw === 'yuanbao' || raw === 'yb' || raw === '元宝') return 'yuanbao';
  return 'gold';
}

function sameEffects(a, b) {
  const na = normalizeEffects(a);
  const nb = normalizeEffects(b);
  return Boolean((na?.combo || false) === (nb?.combo || false))
    && Boolean((na?.fury || false) === (nb?.fury || false))
    && Boolean((na?.unbreakable || false) === (nb?.unbreakable || false))
    && String(na?.skill || '') === String(nb?.skill || '')
    && Number(na?.elementAtk || 0) === Number(nb?.elementAtk || 0)
    && Boolean((na?.defense || false) === (nb?.defense || false))
    && Boolean((na?.dodge || false) === (nb?.dodge || false))
    && Boolean((na?.poison || false) === (nb?.poison || false))
    && Boolean((na?.healblock || false) === (nb?.healblock || false));
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
  const realmId = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
  const state = getRealmState(realmId);
  const trade = {
    id: `trade-${Date.now()}-${randInt(100, 999)}`,
    realmId,
    a: { name: player.name },
    b: { name: target.name },
    offers: {
      [player.name]: { gold: 0, yuanbao: 0, items: [] },
      [target.name]: { gold: 0, yuanbao: 0, items: [] }
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
    const realmId = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
    const state = getRealmState(realmId);
    if (getTradeByPlayer(player.name, realmId)) return { ok: false, msg: '你正在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
    const target = playersByName(targetName, realmId);
    if (!target) return { ok: false, msg: '玩家不在线。' };
    if (CROSS_REALM_ZONES.has(player.position.zone)) return { ok: false, msg: '跨服房间内无法交易。' };
    if ((target.realmId || 1) !== (player.realmId || 1)) return { ok: false, msg: '只能与本区服玩家交易。' };
    if (target.name === player.name) return { ok: false, msg: '不能和自己交易。' };
    if (getTradeByPlayer(target.name, realmId)) return { ok: false, msg: '对方正在交易中。' };
    const existing = state.tradeInvites.get(target.name);
    if (existing && existing.from !== player.name) {
      return { ok: false, msg: '对方已有交易请求。' };
    }
    state.tradeInvites.set(target.name, { from: player.name, at: Date.now() });
    target.send(`${player.name} 请求交易。`);
    if (target.socket) {
      target.socket.emit('trade_invite', { from: player.name });
    }
    return { ok: true, msg: `交易请求已发送给 ${target.name}。` };
  },
  acceptTrade(player, fromName) {
    const realmId = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
    const state = getRealmState(realmId);
    const invite = state.tradeInvites.get(player.name);
    if (!invite || invite.from !== fromName) return { ok: false, msg: '没有该交易请求。' };
    if (getTradeByPlayer(player.name, realmId)) return { ok: false, msg: '你正在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
    const inviter = playersByName(fromName, realmId);
    if (!inviter) return { ok: false, msg: '对方不在线。' };
    if (CROSS_REALM_ZONES.has(player.position.zone)) return { ok: false, msg: '跨服房间内无法交易。' };
    if ((inviter.realmId || 1) !== (player.realmId || 1)) return { ok: false, msg: '只能与本区服玩家交易。' };
    if (getTradeByPlayer(inviter.name, realmId)) return { ok: false, msg: '对方正在交易中。' };
    state.tradeInvites.delete(player.name);
    const trade = createTrade(inviter, player);
    inviter.send('交易建立。');
    player.send('交易建立。');
    return { ok: true, trade };
  },
  addItem(player, itemId, qty, effects = null) {
    const { trade } = getTradeByPlayerAny(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
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
    const { trade } = getTradeByPlayerAny(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
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
  addYuanbao(player, amount) {
    const { trade } = getTradeByPlayerAny(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
    if (trade.locked[player.name] || trade.locked[trade.a.name === player.name ? trade.b.name : trade.a.name]) {
      return { ok: false, msg: '交易已锁定，无法修改。' };
    }

    const yuanbaoResult = validateYuanbao(amount);
    if (!yuanbaoResult.ok || yuanbaoResult.value <= 0) return { ok: false, msg: '元宝数量无效。' };

    const hasYuanbaoResult = validatePlayerHasYuanbao(player, yuanbaoResult.value);
    if (!hasYuanbaoResult.ok) return { ok: false, msg: hasYuanbaoResult.error };

    const offer = ensureOffer(trade, player.name);
    offer.yuanbao += yuanbaoResult.value;
    return { ok: true, trade };
  },
  lock(player) {
    const { trade } = getTradeByPlayerAny(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
    trade.locked[player.name] = true;
    return { ok: true, trade };
  },
  confirm(player) {
    const { trade } = getTradeByPlayerAny(player.name, player.realmId || 1);
    if (!trade) return { ok: false, msg: '你不在交易中。' };
    if (isCultivationRoom(player.position.zone)) return { ok: false, msg: '修真房间内无法交易。' };
    if (!trade.locked[trade.a.name] || !trade.locked[trade.b.name]) {
      return { ok: false, msg: '双方都锁定后才能确认。' };
    }
    trade.confirmed[player.name] = true;
    return { ok: true, trade };
  },
  cancel(player, reason) {
    const lookup = getTradeByPlayerAny(player.name, player.realmId || 1);
    const trade = lookup.trade;
    const realmId = trade ? (trade.realmId ?? lookup.realmId) : (player.realmId || 1);
    const state = getRealmState(realmId);
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
      (playerA.yuanbao || 0) < (offerA.yuanbao || 0) || (playerB.yuanbao || 0) < (offerB.yuanbao || 0) ||
      !hasOfferItems(playerA, offerA) || !hasOfferItems(playerB, offerB)) {
      clearTrade(trade, '交易失败，物品或货币不足。', realmId);
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
    playerA.yuanbao = (playerA.yuanbao || 0) - (offerA.yuanbao || 0);
    playerB.yuanbao = (playerB.yuanbao || 0) + (offerA.yuanbao || 0);
    playerB.yuanbao = (playerB.yuanbao || 0) - (offerB.yuanbao || 0);
    playerA.yuanbao = (playerA.yuanbao || 0) + (offerB.yuanbao || 0);
    applyOfferItems(playerA, playerB, offerA);
    applyOfferItems(playerB, playerA, offerB);
    clearTrade(trade, '交易完成。', realmId);
    return { ok: true };
  },
  getTrade(playerName) {
    for (const state of realmStates.values()) {
      const trade = state.tradesByPlayer.get(playerName);
      if (trade) return trade;
    }
    return null;
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
        currency: row.currency || 'gold',
        item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? 0)
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
        currency: row.currency || 'gold',
        item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? 0)
      }));
      player.socket.emit('consign_list', { type: 'mine', items });
      return items;
    },
    async sell(player, invSlot, qty, price, effects = null, currency = 'gold') {
      if (!invSlot || !invSlot.id) return { ok: false, msg: '背包里没有该物品。' };
      const itemId = invSlot.id;
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
      
      const normalizedCurrency = normalizeCurrency(currency);
      const priceResult = normalizedCurrency === 'yuanbao'
        ? validateYuanbao(price, 99999999)
        : validateGold(price, 99999999);
      if (!priceResult.ok || priceResult.value <= 0) return { ok: false, msg: '价格无效。' };
      
      // 验证effects
      const effectsResult = validateEffects(effects);
      if (!effectsResult.ok) return { ok: false, msg: effectsResult.error };

      const durability = validateDurability(invSlot.durability).value ?? null;
      const maxDurability = validateMaxDurability(invSlot.max_durability).value ?? null;
      const refineLevel = Number.isFinite(invSlot.refine_level) ? invSlot.refine_level : 0;

      if (!removeItem(player, itemId, qtyResult.value, effectsResult.value, durability, maxDurability, refineLevel)) {
        return { ok: false, msg: '背包里没有足够数量。' };
      }
      const id = await createConsignment({
        sellerName: player.name,
        itemId,
        qty: qtyResult.value,
        price: priceResult.value,
        currency: normalizedCurrency,
        effectsJson: effectsResult.value ? JSON.stringify(effectsResult.value) : null,
        durability,
        maxDurability,
        refineLevel,
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
    const currency = normalizeCurrency(row.currency);
    const hasCurrencyResult = currency === 'yuanbao'
      ? validatePlayerHasYuanbao(player, serverTotal)
      : validatePlayerHasGold(player, serverTotal);
    if (!hasCurrencyResult.ok) return { ok: false, msg: hasCurrencyResult.error };

    if (currency === 'yuanbao') {
      player.yuanbao = (player.yuanbao || 0) - serverTotal;
    } else {
      player.gold -= serverTotal;
    }
    addItem(player, row.item_id, qtyResult.value, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? null);

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
      currency,
      effectsJson: row.effects_json,
      durability: row.durability,
      maxDurability: row.max_durability,
      refineLevel: row.refine_level ?? null,
      realmId: player.realmId || 1
    });

    const seller = playersByName(row.seller_name, player.realmId || 1);
    if (seller) {
      if (currency === 'yuanbao') {
        seller.yuanbao = (seller.yuanbao || 0) + sellerGain;
      } else {
        seller.gold += sellerGain;
      }
      const currencyLabel = currency === 'yuanbao' ? '元宝' : '金币';
      seller.send(`寄售成交: ${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qtyResult.value}，获得 ${sellerGain} ${currencyLabel}（手续费 ${fee}）。`);
      savePlayer(seller);
      await consignApi.listMine(seller);
      await consignApi.listMarket(seller);
    } else {
      const sellerRow = await findCharacterByNameInRealm(row.seller_name, player.realmId || 1);
      if (sellerRow) {
        const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name, sellerRow.realm_id || 1);
        if (sellerPlayer) {
          if (currency === 'yuanbao') {
            sellerPlayer.yuanbao = (sellerPlayer.yuanbao || 0) + sellerGain;
          } else {
            sellerPlayer.gold += sellerGain;
          }
          await saveCharacter(sellerRow.user_id, sellerPlayer, sellerRow.realm_id || 1);
        }
      }
    }
    await consignApi.listMine(player);
    await consignApi.listMarket(player);
    const currencyLabel = currency === 'yuanbao' ? '元宝' : '金币';
    return { ok: true, msg: `购买成功，花费 ${serverTotal} ${currencyLabel}。` };
  },
  async cancel(player, listingId) {
    await cleanupExpiredConsignments(player.realmId || 1);
    // 验证listingId
    const idResult = validateNumber(listingId, 1, Number.MAX_SAFE_INTEGER);
    if (!idResult.ok) return { ok: false, msg: '寄售ID无效。' };
    
    const row = await getConsignment(idResult.value, player.realmId || 1);
    if (!row) return { ok: false, msg: '寄售不存在。' };
    if (row.seller_name !== player.name) return { ok: false, msg: '只能取消自己的寄售。' };
    addItem(player, row.item_id, row.qty, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? null);
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
      currency: row.currency || 'gold',
      total: row.price * row.qty,
      item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? 0),
      soldAt: row.sold_at
    }));
    player.socket.emit('consign_history', { items });
    return items;
  }
};

const rechargeApi = {
  async redeem(player, code) {
    const used = await useRechargeCard(code, player.userId, player.name);
    if (!used) return { ok: false, msg: '卡密无效或已使用。' };
    const amount = Math.max(0, Math.floor(Number(used.amount || 0)));
    if (!amount) return { ok: false, msg: '卡密金额异常。' };
    player.yuanbao = (player.yuanbao || 0) + amount;
    await addSponsor(player.name, amount);
    player.forceStateRefresh = true;
    return { ok: true, msg: `充值成功，获得 ${amount} 元宝。` };
  }
};

const svipApi = {
  async open(player, plan = 'month') {
    if (!player) return { ok: false, msg: '角色不存在。' };
    if (!player.flags) player.flags = {};
    const { prices } = await getSvipSettingsCached();
    const normalizedPlan = String(plan || '').trim().toLowerCase();
    const planMap = {
      month: { days: 30, label: '月' },
      quarter: { days: 90, label: '季' },
      year: { days: 365, label: '年' },
      permanent: { days: 0, label: '永久' }
    };
    const picked = planMap[normalizedPlan] ? normalizedPlan : 'month';
    const days = planMap[picked].days;
    const cost = Math.max(0, Math.floor(Number(prices?.[picked] || 0)));
    const currentYuanbao = Math.max(0, Math.floor(Number(player.yuanbao || 0)));
    if (currentYuanbao < cost) {
      return { ok: false, msg: `元宝不足，开通SVIP需要 ${cost} 元宝。` };
    }
    player.yuanbao = currentYuanbao - cost;
    const now = Date.now();
    if (days <= 0) {
      player.flags.svip = true;
      player.flags.svipExpiresAt = null;
    } else {
      const currentExpiresAt = Number(player.flags.svipExpiresAt || 0);
      const base = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
      player.flags.svip = true;
      player.flags.svipExpiresAt = base + days * 24 * 60 * 60 * 1000;
    }
    player.forceStateRefresh = true;
    return { ok: true, msg: days <= 0 ? 'SVIP开通成功（永久）。' : `SVIP开通成功（${planMap[picked].label}卡，${days}天）。` };
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
        addItem(seller, row.item_id, qty, effects, row.durability, row.max_durability, row.refine_level ?? null);
        seller.send(`寄售到期自动下架：${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qty} 已返还背包。`);
        seller.forceStateRefresh = true;
        refreshedSellers.add(seller);
        savePlayer(seller);
      } else {
        const sellerRow = await findCharacterByNameInRealm(row.seller_name, realmId);
        if (sellerRow) {
          const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name, sellerRow.realm_id || 1);
          if (sellerPlayer) {
            addItem(sellerPlayer, row.item_id, qty, effects, row.durability, row.max_durability, row.refine_level ?? null);
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

function distributeLootWithBonus(party, partyMembers, mobTemplate, bonusResolver) {
  if (!party || partyMembers.length === 0 || !mobTemplate) return [];
  const results = [];
  const sabakBonus = mobTemplate.sabakBoss ? 3.0 : 1.0;
  const worldBossBonus = isWorldBossDropMob(mobTemplate) ? WORLD_BOSS_DROP_BONUS : 1;
  const resolveFinalBonus = (target) => {
    const baseBonus = typeof bonusResolver === 'function' ? bonusResolver(target) : 1;
    return baseBonus * worldBossBonus * sabakBonus;
  };
  const notifyParty = (target, itemId, effects) => {
    partyMembers.forEach((member) => {
      member.send(`队伍掉落: ${formatItemLabel(itemId, effects)} -> ${target.name}`);
    });
  };

  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      const dropItem = ITEM_TEMPLATES[drop.id];
      if (dropItem?.bossOnly && !isBossMob(mobTemplate)) return;
      if (dropItem?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return;
      if (dropItem?.crossWorldBossOnly && mobTemplate?.id !== 'cross_world_boss') return;
      if (dropItem?.bossOnly) {
        const rarity = rarityByPrice(dropItem);
        if ((rarity === 'epic' || rarity === 'legendary' || rarity === 'ultimate') && !isSpecialBoss(mobTemplate)) {
          return;
        }
      }
      const target = partyMembers[randInt(0, partyMembers.length - 1)];
      const finalBonus = resolveFinalBonus(target);
      const chance = Math.min(1, (drop.chance || 0) * finalBonus);
      if (Math.random() <= chance) {
        const effects = rollEquipmentEffects(drop.id);
        addItem(target, drop.id, 1, effects);
        logLoot(`[loot][party] ${target.name} <- ${drop.id}`);
        results.push({ id: drop.id, effects, target });
        notifyParty(target, drop.id, effects);
      }
    });
  }

  const trainingTarget = partyMembers[randInt(0, partyMembers.length - 1)];
  const trainingChance = Math.min(1, getTrainingFruitDropRate());
  if (Math.random() <= trainingChance) {
    addItem(trainingTarget, 'training_fruit', 1, null);
    logLoot(`[loot][party] ${trainingTarget.name} <- training_fruit`);
    results.push({ id: 'training_fruit', effects: null, target: trainingTarget });
    notifyParty(trainingTarget, 'training_fruit', null);
  }

  const rarityTarget = partyMembers[randInt(0, partyMembers.length - 1)];
  const rarityDrop = rollRarityDrop(mobTemplate, resolveFinalBonus(rarityTarget));
  if (rarityDrop) {
    const effects = rollEquipmentEffects(rarityDrop);
    addItem(rarityTarget, rarityDrop, 1, effects);
    logLoot(`[loot][party] ${rarityTarget.name} <- ${rarityDrop}`);
    results.push({ id: rarityDrop, effects, target: rarityTarget });
    notifyParty(rarityTarget, rarityDrop, effects);
  }

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
  start.setHours(sabakConfig.startHour, sabakConfig.startMinute || 0, 0, 0);
  const end = new Date(start.getTime() + sabakConfig.durationMinutes * 60 * 1000);
  return { start, end };
}

function isSabakActive(now = new Date()) {
  const { start, end } = sabakWindowRange(now);
  return now >= start && now <= end;
}

function sabakWindowInfo() {
  const startHour = String(sabakConfig.startHour).padStart(2, '0');
  const startMinute = String(sabakConfig.startMinute || 0).padStart(2, '0');
  const totalMinutes = sabakConfig.startHour * 60 + (sabakConfig.startMinute || 0) + sabakConfig.durationMinutes;
  const endHour = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
  const endMinuteStr = String(totalMinutes % 60).padStart(2, '0');
  return `每天 ${startHour}:${startMinute}-${endHour}:${endMinuteStr}`;
}

function sabakRegistrationWindowInfo() {
  const start = sabakWindowRange(new Date()).start;
  const end = new Date(start.getTime() - 10 * 60 * 1000);
  const endHour = String(end.getHours()).padStart(2, '0');
  const endMinute = String(end.getMinutes()).padStart(2, '0');
  return `0:00-${endHour}:${endMinute}`;
}

function crossRankWindowRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(crossRankConfig.startHour, crossRankConfig.startMinute || 0, 0, 0);
  const end = new Date(start.getTime() + crossRankConfig.durationMinutes * 60 * 1000);
  return { start, end };
}

function crossRankWindowInfo() {
  const startHour = String(crossRankConfig.startHour).padStart(2, '0');
  const startMinute = String(crossRankConfig.startMinute || 0).padStart(2, '0');
  const totalMinutes = crossRankConfig.startHour * 60 + (crossRankConfig.startMinute || 0) + crossRankConfig.durationMinutes;
  const endHour = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
  const endMinute = String(totalMinutes % 60).padStart(2, '0');
  return `${startHour}:${startMinute}-${endHour}:${endMinute}`;
}

function isSabakRegistrationToday(registration, now = new Date()) {
  if (!registration?.registered_at) return false;
  const regDate = new Date(registration.registered_at);
  if (Number.isNaN(regDate.getTime())) return true;
  if (regDate.toDateString() === now.toDateString()) return true;
  return Math.abs(now.getTime() - regDate.getTime()) < 24 * 60 * 60 * 1000;
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

async function startSabakSiege(attackerGuild, realmId) {
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
  const registrations = await listSabakRegistrations(realmId);
  registrations.forEach((r) => {
    if (!r.guild_id) return;
    if (String(r.guild_id) === String(sabakState.ownerGuildId)) return;
    sabakState.killStats[r.guild_id] = {
      name: r.guild_name || '攻城行会',
      kills: 0
    };
  });
  if (attackerGuild && attackerGuild.id) {
    const gid = attackerGuild.id;
    if (!sabakState.killStats[gid]) {
      sabakState.killStats[gid] = {
        name: attackerGuild.name || '攻城行会',
        kills: 0
      };
    }
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
    // 击杀为0或平局时，根据皇宫内人数判定
    const palacePlayers = listOnlinePlayers(realmId).filter(p =>
      isSabakPalace(p.position.zone, p.position.room) && p.guild
    );
    if (palacePlayers.length > 0) {
      const countMap = new Map();
      palacePlayers.forEach(p => {
        const gid = String(p.guild.id);
        countMap.set(gid, (countMap.get(gid) || 0) + 1);
      });
      let maxCount = -1;
      let maxGuildId = null;
      let maxGuildName = null;
      let countTie = false;
      for (const [gid, count] of countMap.entries()) {
        if (count > maxCount) {
          maxCount = count;
          maxGuildId = gid;
          const sample = palacePlayers.find(p => String(p.guild.id) === gid);
          maxGuildName = sample?.guild?.name || winnerName;
          countTie = false;
        } else if (count === maxCount) {
          countTie = true;
        }
      }
      if (!countTie && maxGuildId) {
        if (String(maxGuildId) !== String(sabakState.ownerGuildId)) {
          sabakState.ownerGuildId = maxGuildId;
          sabakState.ownerGuildName = maxGuildName;
          await setSabakOwner(realmId, maxGuildId, maxGuildName || '未知行会');
          emitAnnouncement(`沙巴克被 ${maxGuildName} 占领！`, 'announce', null, realmId);
        } else {
          emitAnnouncement('沙巴克攻城战结束，守城方成功守住。', 'announce', null, realmId);
        }
      } else {
        emitAnnouncement('沙巴克攻城战结束，守城方继续守城。', 'announce', null, realmId);
      }
    } else {
      emitAnnouncement('沙巴克攻城战结束，守城方继续守城。', 'announce', null, realmId);
    }
  } else if (winnerId && winnerId !== sabakState.ownerGuildId) {
    sabakState.ownerGuildId = winnerId;
    sabakState.ownerGuildName = winnerName;
    await setSabakOwner(realmId, winnerId, winnerName || '未知行会');
    emitAnnouncement(`沙巴克被 ${winnerName} 占领！`, 'announce', null, realmId);
  } else {
    emitAnnouncement('沙巴克攻城战结束，守城方成功守住。', 'announce', null, realmId);
  }
  sabakState.killStats = {};
  await clearSabakRegistrations(realmId);
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
    const realmId = player.realmId || 1;
    const hasRegisteredToday = await hasSabakRegistrationToday(player.guild.id, realmId);
    if (!hasRegisteredToday) {
      return;
    }
    await startSabakSiege(player.guild, realmId);
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

const AUTO_DAILY_LIMIT_MS = 4 * 60 * 60 * 1000;
const AUTO_FULL_TRIAL_MS = 10 * 60 * 1000;
const AUTO_FULL_MOVE_COOLDOWN_MS = 5000;
const AUTO_FULL_BOSS_MOVE_COOLDOWN_MS = 1000;
const AUTO_FULL_ROOM_CACHE_TTL = 15000;
const autoFullRoomCache = new Map();
const AUTO_FULL_BOSS_LIST = Array.from(new Set(
  Object.values(MOB_TEMPLATES)
    .filter((tpl) => tpl && tpl.name && isBossMob(tpl))
    .map((tpl) => String(tpl.name))
)).sort((a, b) => a.localeCompare(b, 'zh-CN'));

function getAutoDailyKey(now = Date.now()) {
  const date = new Date(now);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getAutoFullTrialInfo(player, now = Date.now()) {
  if (!player) return { available: false, remainingMs: 0 };
  if (!player.flags) player.flags = {};
  if (isSvipActive(player)) return { available: true, remainingMs: null };
  const dayKey = getAutoDailyKey(now);
  const trialDay = player.flags.autoFullTrialDay || null;
  const expiresAt = Number(player.flags.autoFullTrialExpiresAt || 0);
  if (trialDay !== dayKey) {
    return { available: true, remainingMs: AUTO_FULL_TRIAL_MS };
  }
  if (expiresAt > now) {
    return { available: true, remainingMs: Math.max(0, expiresAt - now) };
  }
  return { available: false, remainingMs: 0 };
}

function normalizeVipStatus(player) {
  if (!player) return false;
  if (!player.flags) player.flags = {};
  const expiresAt = Number(player.flags.vipExpiresAt || 0);
  if (player.flags.vip && expiresAt && expiresAt <= Date.now()) {
    player.flags.vip = false;
    player.flags.vipExpiresAt = null;
  }
  return Boolean(player.flags.vip);
}

function isVipActive(player) {
  return normalizeVipStatus(player);
}

function normalizeSvipStatus(player) {
  if (!player) return false;
  if (!player.flags) player.flags = {};
  const expiresAt = Number(player.flags.svipExpiresAt || 0);
  if (player.flags.svip && expiresAt && expiresAt <= Date.now()) {
    player.flags.svip = false;
    player.flags.svipExpiresAt = null;
  }
  return Boolean(player.flags.svip);
}

function isSvipActive(player) {
  return normalizeSvipStatus(player);
}

function getAutoFullBossFilterSet(player) {
  const list = player?.flags?.autoFullBossFilter;
  if (!Array.isArray(list)) return null;
  if (list.length === 0) return new Set();
  const normalized = list
    .map((name) => String(name || '').trim().toLowerCase())
    .filter(Boolean);
  return new Set(normalized);
}

function isAutoFullBossAllowed(player, mobTemplate) {
  const filter = getAutoFullBossFilterSet(player);
  if (filter == null) return true;
  if (filter.size === 0) return false;
  const name = String(mobTemplate?.name || '').trim().toLowerCase();
  if (!name) return false;
  return filter.has(name);
}

function isVipAutoEnabled(player) {
  if (isVipActive(player) || isSvipActive(player)) return true;
  if (!player) return false;
  if (!player.flags) player.flags = {};
  const dayKey = getAutoDailyKey();
  if (player.flags.autoDailyDay !== dayKey) {
    player.flags.autoDailyDay = dayKey;
    player.flags.autoDailyMs = 0;
    player.flags.autoDailyLastAt = null;
  }
  return Number(player.flags.autoDailyMs || 0) < AUTO_DAILY_LIMIT_MS;
}

function updateAutoDailyUsage(player) {
  if (!player) return;
  if (!player.flags) player.flags = {};
  if (isVipActive(player) || isSvipActive(player)) {
    player.flags.autoDailyDay = null;
    player.flags.autoDailyMs = null;
    player.flags.autoDailyLastAt = null;
    return;
  }
  const now = Date.now();
  const dayKey = getAutoDailyKey(now);
  if (player.flags.autoDailyDay !== dayKey) {
    player.flags.autoDailyDay = dayKey;
    player.flags.autoDailyMs = 0;
    player.flags.autoDailyLastAt = null;
  }
  if (!player.flags.autoSkillId) {
    player.flags.autoDailyLastAt = null;
    return;
  }
  const lastAt = Number(player.flags.autoDailyLastAt || 0);
  if (lastAt > 0) {
    const delta = Math.max(0, now - lastAt);
    player.flags.autoDailyMs = Math.max(0, Number(player.flags.autoDailyMs || 0) + delta);
  }
  player.flags.autoDailyLastAt = now;
  if (Number(player.flags.autoDailyMs || 0) >= AUTO_DAILY_LIMIT_MS) {
    player.flags.autoSkillId = null;
    player.flags.autoHpPct = null;
    player.flags.autoMpPct = null;
    player.flags.autoDailyLastAt = null;
    player.send('今日挂机时长已达上限（4小时）。');
  }
}

function canEnterRoomByCultivation(player, zoneId, roomId) {
  const room = WORLD[zoneId]?.rooms?.[roomId];
  if (!room) return false;
  if (room.minCultivationLevel != null) {
    const level = getCultivationLevel(player);
    if (Number.isNaN(level) || level !== room.minCultivationLevel) return false;
  }
  return true;
}

function computeRoomAvgExp(room) {
  if (!room || !Array.isArray(room.spawns) || room.spawns.length === 0) return null;
  let sum = 0;
  let count = 0;
  for (const id of room.spawns) {
    const tpl = MOB_TEMPLATES[id];
    if (!tpl) continue;
    if (isBossMob(tpl)) return null;
    const exp = Number(tpl.exp || 0);
    if (exp > 0) {
      sum += exp;
      count += 1;
    }
  }
  if (count === 0) return null;
  return sum / count;
}

function getAutoFullBestRoom(player) {
  const levelKey = `cultivation:${getCultivationLevel(player)}`;
  const cached = autoFullRoomCache.get(levelKey);
  const now = Date.now();
  if (cached && now - cached.at < AUTO_FULL_ROOM_CACHE_TTL) return cached.room;
  let best = null;
  for (const [zoneId, zone] of Object.entries(WORLD)) {
    if (!zone || !zone.rooms) continue;
    if (CROSS_REALM_ZONES.has(zoneId)) continue;
    for (const [roomId, room] of Object.entries(zone.rooms)) {
      if (!room?.spawns?.length) continue;
      if (!canEnterRoomByCultivation(player, zoneId, roomId)) continue;
      const avg = computeRoomAvgExp(room);
      if (avg == null) continue;
      const roomRealmId = getRoomRealmId(zoneId, roomId, player.realmId || 1);
      const roomCount = listOnlinePlayers(roomRealmId)
        .filter((p) => p.position.zone === zoneId && p.position.room === roomId).length;
      if (!best || avg > best.avgExp || (avg === best.avgExp && roomCount < best.playerCount)) {
        best = { zoneId, roomId, avgExp: avg, playerCount: roomCount };
      }
    }
  }
  autoFullRoomCache.set(levelKey, { at: now, room: best });
  return best;
}

function findAliveBossTarget(player) {
  if (!player) return null;
  const realmId = player.realmId || 1;
  const mobs = getAllAliveMobs(realmId);
  let best = null;
  for (const mob of mobs) {
    if (!mob || mob.hp <= 0) continue;
    const tpl = MOB_TEMPLATES[mob.templateId];
    if (!tpl || !isBossMob(tpl)) continue;
    if (!isAutoFullBossAllowed(player, tpl)) continue;
    const zoneId = mob.zoneId;
    const roomId = mob.roomId;
    if (!zoneId || !roomId) continue;
    if (CROSS_REALM_ZONES.has(zoneId)) continue;
    if (!WORLD[zoneId]?.rooms?.[roomId]) continue;
    if (!canEnterRoomByCultivation(player, zoneId, roomId)) continue;
    if (player.position.zone === zoneId && player.position.room === roomId) continue;
    const exp = Number(tpl.exp || 0);
    if (!best || exp > best.exp) {
      best = { zoneId, roomId, exp };
    }
  }
  return best;
}

function findBossInRoom(roomMobs, player) {
  if (!Array.isArray(roomMobs)) return null;
  for (const mob of roomMobs) {
    const tpl = MOB_TEMPLATES[mob.templateId];
    if (tpl && isBossMob(tpl) && isAutoFullBossAllowed(player, tpl)) return mob;
  }
  return null;
}

function movePlayerToRoom(player, zoneId, roomId) {
  if (!player || !player.position) return false;
  if (player.position.zone === zoneId && player.position.room === roomId) return false;
  if (!WORLD[zoneId]?.rooms?.[roomId]) return false;
  if (!canEnterRoomByCultivation(player, zoneId, roomId)) return false;
  const fromRoom = { zone: player.position.zone, room: player.position.room };
  player.position.zone = zoneId;
  player.position.room = roomId;
  player.forceStateRefresh = true;
  if (typeof player.send === 'function') {
    const zoneName = WORLD[zoneId]?.name || zoneId;
    const roomName = WORLD[zoneId]?.rooms?.[roomId]?.name || roomId;
    player.send(`智能挂机前往 ${zoneName} - ${roomName}。`);
  }
  sendRoomState(fromRoom.zone, fromRoom.room, player.realmId || 1);
  sendRoomState(zoneId, roomId, player.realmId || 1);
  return true;
}

function tryAutoFullAction(player, roomMobs) {
  if (!player?.flags?.autoFullEnabled) return null;
  if (!isSvipActive(player)) {
    const trialInfo = getAutoFullTrialInfo(player);
    if (!trialInfo.available) {
      if (player.flags.autoFullEnabled) {
        player.flags.autoFullEnabled = false;
        player.forceStateRefresh = true;
        if (typeof player.send === 'function') {
          player.send('智能挂机体验已结束，今日不可再使用。');
        }
      }
      return null;
    }
    const now = Date.now();
    const expiresAt = Number(player.flags.autoFullTrialExpiresAt || 0);
    if (expiresAt <= now) {
      player.flags.autoFullEnabled = false;
      player.forceStateRefresh = true;
      if (typeof player.send === 'function') {
        player.send('智能挂机体验已结束，今日不可再使用。');
      }
      return null;
    }
  }
  const now = Date.now();
  const pausedUntil = Number(player.flags.autoFullPausedUntil || 0);
  if (pausedUntil > now) {
    const bossMob = findBossInRoom(roomMobs, player);
    if (bossMob) {
      player.combat = { targetId: bossMob.id, targetType: 'mob', skillId: null };
      return 'engaged';
    }
    if (Array.isArray(roomMobs) && roomMobs.length > 0) {
      const idle = roomMobs.filter((m) => !m.status?.aggroTarget);
      const pool = idle.length ? idle : roomMobs;
      const target = pool.length ? pool[randInt(0, pool.length - 1)] : null;
      if (target) {
        player.combat = { targetId: target.id, targetType: 'mob', skillId: null };
        return 'engaged';
      }
    }
    return null;
  }
  const hasRoomMobs = Array.isArray(roomMobs) && roomMobs.length > 0;
  const bossMob = findBossInRoom(roomMobs, player);
  if (bossMob) {
    if (!player.flags.lastBossRoom) {
      player.flags.lastBossRoom = { zoneId: player.position.zone, roomId: player.position.room };
    } else {
      player.flags.lastBossRoom.zoneId = player.position.zone;
      player.flags.lastBossRoom.roomId = player.position.room;
    }
    player.combat = { targetId: bossMob.id, targetType: 'mob', skillId: null };
    return 'engaged';
  }
  // 固定当前房间：只有在当前房间没有怪物时才允许移动
  if (hasRoomMobs) {
    const idle = roomMobs.filter((m) => !m.status?.aggroTarget);
    const pool = idle.length ? idle : roomMobs;
    const target = pool.length ? pool[randInt(0, pool.length - 1)] : null;
    if (target) {
      player.combat = { targetId: target.id, targetType: 'mob', skillId: null };
      return 'engaged';
    }
    return null;
  }
  const lastMoveAt = Number(player.flags.autoFullLastMoveAt || 0);
  const canMove = now - lastMoveAt >= AUTO_FULL_MOVE_COOLDOWN_MS;
  const best = getAutoFullBestRoom(player);
  if (best && canMove && (player.position.zone !== best.zoneId || player.position.room !== best.roomId)) {
    if (movePlayerToRoom(player, best.zoneId, best.roomId)) {
      player.flags.autoFullLastMoveAt = now;
      return 'moved';
    }
  }
  return null;
}

function pickPlayerBonusConfig(playerBonusConfig, playerCount) {
  if (!Array.isArray(playerBonusConfig) || playerBonusConfig.length === 0) return null;
  let best = null;
  for (const config of playerBonusConfig) {
    if (!config || typeof config.min !== 'number') continue;
    if (playerCount < config.min) continue;
    if (!best || config.min > best.min) {
      best = config;
    }
  }
  return best;
}

function isSpecialBossDebuffImmune(target) {
  // 取消低血量负面免疫
  return false;
  if (!target || !target.templateId) return false;
  const tpl = MOB_TEMPLATES[target.templateId];
  if (!tpl) return false;
  if (!isBossMob(tpl) && !tpl.worldBoss && !tpl.sabakBoss) return false;
  const maxHp = Number(target.max_hp ?? tpl.hp ?? 0) || 0;
  if (maxHp <= 0) return false;
  const hp = Number(target.hp ?? maxHp) || 0;
  return hp / maxHp <= 0.8;
}

function isSpecialBossEnraged(mob) {
  if (!mob || !mob.templateId) return false;
  const tpl = MOB_TEMPLATES[mob.templateId];
  if (!tpl?.specialBoss) return false;
  const maxHp = Number(mob.max_hp ?? tpl.hp ?? 0) || 0;
  if (maxHp <= 0) return false;
  const hp = Number(mob.hp ?? maxHp) || 0;
  return hp / maxHp <= 0.1;
}

function clearNegativeStatuses(target) {
  if (!target?.status) return;
  // 保留毒相关状态，BOSS不再免疫毒
  if (target.status.debuffs) {
    const healBlock = target.status.debuffs.healBlock;
    const armorBreak = target.status.debuffs.armorBreak;
    const weak = target.status.debuffs.weak;
    const poison = target.status.debuffs.poison;
    const poisonEffect = target.status.debuffs.poisonEffect;
    delete target.status.debuffs;
    if (healBlock || armorBreak || weak) {
      target.status.debuffs = {};
      if (healBlock) target.status.debuffs.healBlock = healBlock;
      if (armorBreak) target.status.debuffs.armorBreak = armorBreak;
      if (weak) target.status.debuffs.weak = weak;
    }
    if (poison || poisonEffect) {
      if (!target.status.debuffs) target.status.debuffs = {};
      if (poison) target.status.debuffs.poison = poison;
      if (poisonEffect) target.status.debuffs.poisonEffect = poisonEffect;
    }
  }
}

function enforceSpecialBossDebuffImmunity(target, realmId = null) {
  if (!target?.status) target.status = {};
  if (!isSpecialBossDebuffImmune(target)) {
    if (target.status.debuffImmuneActive) {
      delete target.status.debuffImmuneActive;
    }
    return false;
  }
  clearNegativeStatuses(target);
  if (!target.status.debuffImmuneActive) {
    target.status.debuffImmuneActive = true;
    if (realmId !== null && realmId !== undefined && target.zoneId && target.roomId) {
      const roomPlayers = listOnlinePlayers(realmId).filter((p) =>
        p.position.zone === target.zoneId &&
        p.position.room === target.roomId &&
        p.hp > 0
      );
        roomPlayers.forEach((roomPlayer) => {
          roomPlayer.send(`${target.name} 血量低于80%，进入负面免疫状态！`);
        });
    }
  }
  return true;
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

function getAttackValue(target) {
  if (!target) return 0;
  const base = Number(target.atk || 0) || 0;
  const buff = target.status?.buffs?.atkBuff;
  if (!buff) return base;
  const now = Date.now();
  if (buff.expiresAt && buff.expiresAt < now) {
    if (target.status?.buffs) delete target.status.buffs.atkBuff;
    return base;
  }
  return Math.floor(base * (buff.multiplier || 1));
}

function getPowerStatValue(player, skill) {
  if (!player || !skill) return 0;
  if (skill.powerStat === 'atk') return getAttackValue(player);
  if (skill.powerStat === 'spirit' || skill.id === 'soul') return getSpiritValue(player);
  return Number(player.mag || 0);
}

function applyDamageToSummon(target, dmg) {
  if (isInvincible(target)) return 0;
  if (target.status?.buffs?.magicShield) {
    const buff = target.status.buffs.magicShield;
    if (buff.expiresAt && buff.expiresAt < Date.now()) {
      delete target.status.buffs.magicShield;
    } else if (target.mp > 0) {
      const ratio = Number.isFinite(buff.ratio) ? buff.ratio : 0.2;
      const convert = Math.min(Math.floor(dmg * ratio), target.mp);
      target.mp = Math.max(0, target.mp - convert);
      dmg -= convert;
    }
  }
  dmg = Math.max(0, Math.floor(Number(dmg) || 0));
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
      const ratio = Number.isFinite(buff.ratio) ? buff.ratio : 0.2;
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
  dmg = Math.max(0, Math.floor(Number(dmg) || 0));
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
  if (!isVipActive(player)) {
    player.flags.offlineAt = null;
    player.send('离线挂机仅VIP可用。');
    return;
  }
  const maxHours = 24;
  const offlineMinutes = Math.min(Math.floor((Date.now() - offlineAt) / 60000), maxHours * 60);
  if (offlineMinutes <= 0) return;
  const offlineMultiplier = 2;
  const cultivationMult = cultivationRewardMultiplier(player);
  const rewardMult = totalRewardMultiplier({
    vipActive: isVipActive(player),
    guildActive: Boolean(player.guild),
    cultivationMult,
    partyMult: 1
  });
  const expGain = Math.floor(offlineMinutes * player.level * offlineMultiplier * rewardMult);
  const goldGain = Math.floor(offlineMinutes * player.level * offlineMultiplier * rewardMult);
  let fruitGain = 0;
  const fruitDropRate = getTrainingFruitDropRate();
  for (let i = 0; i < offlineMinutes; i += 1) {
    if (Math.random() <= fruitDropRate) {
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
const DAILY_LUCKY_CACHE_TTL = 30000; // 每日幸运玩家缓存30秒
let vipSelfClaimCachedValue = null;
let vipSelfClaimLastUpdate = 0;
let svipSettingsCache = { prices: { month: 100, quarter: 260, year: 900, permanent: 3000 }, at: 0 };
const SVIP_SETTINGS_CACHE_TTL = 10 * 1000;
let stateThrottleCachedValue = null;
let stateThrottleLastUpdate = 0;
let stateThrottleIntervalCachedValue = null;
let stateThrottleIntervalLastUpdate = 0;
let stateThrottleOverrideAllowedCachedValue = null;
let stateThrottleOverrideAllowedLastUpdate = 0;
let consignExpireHoursCachedValue = null;
let consignExpireHoursLastUpdate = 0;
let lootLogEnabled = false;
const dailyLuckyCache = new Map();
const stateThrottleLastSent = new Map();
const stateThrottleLastExits = new Map();
const stateThrottleLastRoom = new Map();
const stateThrottleLastInBoss = new Map();
// BOSS血量公告状态：Map<mobId, { announced50: boolean, announced30: boolean, announced10: boolean }>
const bossBloodAnnouncementStatus = new Map();
// 在线玩家排行榜称号：Map<playerName, rankTitle>
const onlinePlayerRankTitles = new Map();

function getDisplayTitle(player) {
  const baseTitle = player?.rankTitle || '';
  const luckyTitle = player?.flags?.dailyLuckyTitle || '';
  const caiyaTitle = player?.flags?.caiyaTitle || '';
  const parts = [baseTitle, luckyTitle, caiyaTitle].filter((t) => t && String(t).trim());
  return parts.length ? parts.join('·') : '';
}

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

async function getSvipSettingsCached() {
  const now = Date.now();
  if (now - svipSettingsCache.at > SVIP_SETTINGS_CACHE_TTL) {
    const prices = await getSvipPrices();
    svipSettingsCache = { prices, at: now };
  }
  return svipSettingsCache;
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

async function getDailyLuckyInfoCached(realmId) {
  const now = Date.now();
  const cached = dailyLuckyCache.get(realmId);
  if (cached && now - cached.at < DAILY_LUCKY_CACHE_TTL) return cached.value;
  const name = String(await getSetting(`daily_lucky_player_${realmId}`, '') || '').trim();
  const attr = String(await getSetting(`daily_lucky_attr_${realmId}`, '') || '').trim();
  const value = name ? { name, attr: attr || null } : null;

  // 如果有日期标记但没有玩家信息，说明分配失败了，尝试重新分配
  const dateKey = await getSetting(`daily_lucky_date_${realmId}`, '');
  const todayKey = getLocalDateKey();
  if (dateKey === todayKey && !name && !attr) {
    console.log(`[DailyLucky] realmId=${realmId} 日期标记存在但无玩家信息，尝试重新分配`);
    try {
      const result = await assignDailyLuckyForRealm(realmId);
      if (result?.name) {
        dailyLuckyCache.set(realmId, { at: now, value: result });
        return result;
      }
    } catch (err) {
      console.error(`[DailyLucky] realmId=${realmId} 重新分配失败:`, err);
    }
  }

  dailyLuckyCache.set(realmId, { at: now, value });
  return value;
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
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  // 检查房间内的怪物是否有特殊BOSS
  const mobs = getRoomMobs(zoneId, roomId, effectiveRealmId);
  return mobs.some(m => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && isSpecialBoss(tpl);
  });
}

function getCultivationLevel(player) {
  return Math.floor(Number(player?.flags?.cultivationLevel ?? -1));
}

function buildRoomExits(zoneId, roomId, player = null) {
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
    // 只添加目标房间存在的出口,过滤掉无效的变种出口
    if (!destRoom) return null;
    if (player && destRoom.minCultivationLevel != null) {
      const cultivationLevel = getCultivationLevel(player);
      // 严格匹配：修真等级必须完全相等才能进入
      if (Number.isNaN(cultivationLevel) || cultivationLevel !== destRoom.minCultivationLevel) {
        return null;
      }
    }
    const fullLabel = destRoom
      ? (destZoneId === zoneId ? destRoom.name : `${destZone.name} - ${destRoom.name}`)
      : dest;
    const isBossDestination = (
      (destZoneId === 'wb' && destRoomId === 'lair') ||
      (destZoneId === 'crb' && destRoomId === 'arena') ||
      (destZoneId === 'crr' && destRoomId === 'arena') ||
      (destZoneId === 'molong' && destRoomId === 'deep') ||
      (destZoneId === 'sb_guild' && destRoomId === 'sanctum') ||
      (destZoneId === 'dark_bosses')
    );
    const label = (isBossDestination && fullLabel.includes(' - '))
      ? fullLabel.split(' - ').slice(1).join(' - ')
      : fullLabel;
    return { dir, label, destZoneId, destRoomId };
  }).filter(Boolean);

  // 合并带数字后缀的方向，只显示一个入口（暗之BOSS房间除外）
  const filteredExits = [];
  allExits.forEach((exit) => {
    const dir = exit.dir;
    const baseDir = dir.replace(/[0-9]+$/, '');

    // 检查是否是暗之BOSS房间的入口
    const isDarkBossRoom = exit.destZoneId === 'dark_bosses';

    // 检查是否有数字后缀的变体
    const hasVariants = allExits.some(
      (e) => e.dir !== dir && e.dir.startsWith(baseDir) && /[0-9]+$/.test(e.dir)
    );

    if (isDarkBossRoom) {
      // 暗之BOSS入口不合并，全部显示
      filteredExits.push(exit);
    } else if (hasVariants) {
      // 只添加基础方向，不添加数字后缀的
      if (!/[0-9]+$/.test(dir) && !filteredExits.some((e) => e.dir === baseDir)) {
        filteredExits.push({
          dir: baseDir,
          label: exit.label.replace(/[0-9]+$/, ''),
          destZoneId: exit.destZoneId,
          destRoomId: exit.destRoomId
        });
      }
    } else {
      // 没有变体，正常添加
      filteredExits.push(exit);
    }
  });

  // 额外处理：确保每个暗之BOSS房间只显示一个入口
  const darkBossExits = filteredExits.filter(exit => exit.destZoneId === 'dark_bosses');
  const uniqueDarkBossExits = [];
  const seenRooms = new Set();
  
  darkBossExits.forEach(exit => {
    const key = exit.destRoomId || exit.label;
    if (!seenRooms.has(key)) {
      seenRooms.add(key);
      uniqueDarkBossExits.push(exit);
    }
  });

  // 替换原有的暗之BOSS出口
  const nonDarkBossExits = filteredExits.filter(exit => exit.destZoneId !== 'dark_bosses');
  filteredExits.splice(0, filteredExits.length, ...nonDarkBossExits, ...uniqueDarkBossExits);

  // 移除标签中的数字后缀（如 "平原1" -> "平原"）（暗之BOSS房间除外）
  return filteredExits.map((exit) => ({
    dir: exit.dir,
    label: exit.dir.startsWith('southwest') ? exit.label : exit.label.replace(/(\D)\d+$/, '$1')
  }));
}

function roomHasCultivationExits(zoneId, roomId) {
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (!room || !room.exits) return false;
  return Object.values(room.exits).some((dest) => {
    if (typeof dest !== 'string') return false;
    let destZoneId = zoneId;
    let destRoomId = dest;
    if (dest.includes(':')) {
      [destZoneId, destRoomId] = dest.split(':');
    }
    const destRoom = WORLD[destZoneId]?.rooms?.[destRoomId];
    return destRoom?.minCultivationLevel != null;
  });
}

function getRoomCommonState(zoneId, roomId, realmId = 1) {
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const cacheKey = `${effectiveRealmId}:${zoneId}:${roomId}`;
  const now = Date.now();
  const cached = roomStateDataCache.get(cacheKey);
  if (cached && now - cached.at < ROOM_STATE_TTL) return cached.data;

  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (zone && room) spawnMobs(zoneId, roomId, effectiveRealmId);

  // 根据房间内玩家数量调整世界BOSS属性
  adjustWorldBossStatsByPlayerCount(zoneId, roomId, effectiveRealmId);

  const mobs = getAliveMobs(zoneId, roomId, effectiveRealmId).map((m) => ({
    id: m.id,
    name: m.name,
    hp: m.hp,
    max_hp: m.max_hp,
    mdef: m.mdef || 0
  }));
  const roomMobs = getRoomMobs(zoneId, roomId, effectiveRealmId);
  const deadBosses = roomMobs.filter((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && m.hp <= 0 && isBossMob(tpl);
  });
  const nextRespawn = deadBosses.length > 0
    ? deadBosses.sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt
    : null;

  let bossRank = [];
  let bossClassRank = null;
  let bossNextRespawn = null;
  const deadSpecialBosses = deadBosses.filter((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && isSpecialBoss(tpl);
  });
  if (deadSpecialBosses.length > 0) {
    bossNextRespawn = deadSpecialBosses
      .sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt;
  }
  const bossMob = getAliveMobs(zoneId, roomId, realmId).find((m) => {
    const tpl = MOB_TEMPLATES[m.templateId];
    return tpl && isSpecialBoss(tpl);
  });
  if (bossMob) {
    const { entries } = buildDamageRankMap(bossMob);
    bossRank = entries.slice(0, 5).map(([name, damage]) => ({ name, damage }));
    bossClassRank = buildBossClassRank(bossMob, entries, effectiveRealmId);
  }

  const roomPlayers = listOnlinePlayers(effectiveRealmId)
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId)
    .map((p) => ({
      name: p.name,
      classId: p.classId,
      level: p.level,
      hp: Math.floor(p.hp || 0),
      max_hp: Math.floor(p.max_hp || 0),
      guild: p.guild?.name || null,
      guildId: p.guild?.id || null,
      realmId: p.realmId || 1,
      pk: p.pk || 0
    }));

  const data = {
    mobs,
    nextRespawn,
    exits: buildRoomExits(zoneId, roomId),
    roomPlayers,
    bossRank,
    bossClassRank,
    bossNextRespawn
  };
  roomStateDataCache.set(cacheKey, { at: now, data });
  return data;
}

async function buildState(player) {
  normalizeVipStatus(player);
  normalizeSvipStatus(player);
  computeDerived(player);
  const realmId = player.realmId || 1;
  const roomRealmId = getRoomRealmId(player.position.zone, player.position.room, realmId);
  const zone = WORLD[player.position.zone];
  const room = zone?.rooms[player.position.room];
  const isBoss = isBossRoom(player.position.zone, player.position.room, roomRealmId);
  let mobs = [];
  let exits = [];
  let nextRespawn = null;
  let roomPlayers = [];
  let bossRank = [];
  let bossClassRank = null;
  let bossNextRespawn = null;
  let crossRank = null;
  if (isBoss) {
    const cached = getRoomCommonState(player.position.zone, player.position.room, roomRealmId);
    mobs = cached.mobs;
    exits = buildRoomExits(player.position.zone, player.position.room, player);
    nextRespawn = cached.nextRespawn;
    roomPlayers = cached.roomPlayers;
    bossRank = cached.bossRank;
    bossClassRank = cached.bossClassRank || null;
    bossNextRespawn = cached.bossNextRespawn;
  } else {
    if (zone && room) spawnMobs(player.position.zone, player.position.room, roomRealmId);
    // 根据房间内玩家数量调整世界BOSS属性
    adjustWorldBossStatsByPlayerCount(player.position.zone, player.position.room, roomRealmId);
    mobs = getAliveMobs(player.position.zone, player.position.room, roomRealmId).map((m) => ({
      id: m.id,
      name: m.name,
      hp: m.hp,
      max_hp: m.max_hp,
      mdef: m.mdef || 0
    }));
    const roomMobs = getRoomMobs(player.position.zone, player.position.room, roomRealmId);
    const deadBosses = roomMobs.filter((m) => {
      const tpl = MOB_TEMPLATES[m.templateId];
      return tpl && m.hp <= 0 && isBossMob(tpl);
    });
    nextRespawn = deadBosses.length > 0
      ? deadBosses.sort((a, b) => (a.respawnAt || Infinity) - (b.respawnAt || Infinity))[0]?.respawnAt
      : null;
    exits = buildRoomExits(player.position.zone, player.position.room, player);
    roomPlayers = listOnlinePlayers(roomRealmId)
      .filter((p) => p.position.zone === player.position.zone && p.position.room === player.position.room)
      .map((p) => ({
        name: p.name,
        classId: p.classId,
        level: p.level,
        hp: Math.floor(p.hp || 0),
        max_hp: Math.floor(p.max_hp || 0),
        guild: p.guild?.name || null,
        guildId: p.guild?.id || null,
        realmId: p.realmId || 1,
        pk: p.pk || 0
      }));
  }
    crossRank = getCrossRankSnapshot(10);
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
  const items = player.inventory.map((i) => buildInventoryItemPayload(i));
  const warehouse = (player.warehouse || []).map((i) => buildInventoryItemPayload(i));
  const equipment = Object.entries(player.equipment || {})
    .filter(([, equipped]) => equipped && equipped.id)
    .map(([slot, equipped]) => ({
      slot,
      durability: equipped.durability ?? null,
      max_durability: equipped.max_durability ?? null,
      refine_level: equipped.refine_level || 0,
      item: buildItemView(equipped.id, equipped.effects || null)
    }));
  const party = getPartyByMember(player.name, realmId);
  const partyMembers = party
    ? party.members.map((name) => ({
        name,
        online: Boolean(playersByName(name, realmId))
      }))
    : null;
  const guildBonus = Boolean(player.guild);
  const onlineCount = listOnlinePlayers(realmId).length;
  const dailyLuckyInfo = await getDailyLuckyInfoCached(realmId);
  
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

  // 获取锻造材料数量配置
  const refineMaterialCount = getRefineMaterialCount();
  const svipSettings = await getSvipSettingsCached();
  const autoFullTrialInfo = getAutoFullTrialInfo(player);
  const autoFullBossFilter = Array.isArray(player.flags?.autoFullBossFilter)
    ? player.flags.autoFullBossFilter
    : null;

  // 获取特效重置配置
  const effectResetSuccessRate = getEffectResetSuccessRate();
  const effectResetDoubleRate = getEffectResetDoubleRate();
  const effectResetTripleRate = getEffectResetTripleRate();
  const effectResetQuadrupleRate = getEffectResetQuadrupleRate();
  const effectResetQuintupleRate = getEffectResetQuintupleRate();

  return {
    player: {
      name: player.name,
      classId: player.classId,
      level: player.level,
      realmId: player.realmId || 1,
      guildId: player.guild?.id || null,
      rankTitle: getDisplayTitle(player)
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
      exp_next: Math.floor(expForLevel(player.level, player.flags?.cultivationLevel)),
      gold: player.gold,
      yuanbao: player.yuanbao || 0,
      atk: Math.floor(player.atk || 0),
      def: Math.floor(player.def || 0),
      mag: Math.floor(player.mag || 0),
      spirit: Math.floor(player.spirit || 0),
      mdef: Math.floor(player.mdef || 0),
      pk: player.flags?.pkValue || 0,
      vip: isVipActive(player),
      vip_expires_at: player.flags?.vipExpiresAt || null,
      svip: isSvipActive(player),
      svip_expires_at: player.flags?.svipExpiresAt || null,
      dodge: Math.round((player.evadeChance || 0) * 100),
      cultivation_level: Math.floor(Number(player.flags?.cultivationLevel ?? -1)),
      cultivation_bonus: Math.floor(Number(player.flags?.cultivationLevel ?? -1)) >= 0
        ? (Math.floor(Number(player.flags?.cultivationLevel ?? -1)) + 1) * 100
        : 0,
      autoSkillId: player.flags?.autoSkillId || null,
      autoFullEnabled: Boolean(player.flags?.autoFullEnabled),
      autoFullTrialAvailable: Boolean(autoFullTrialInfo.available),
      autoFullTrialRemainingSec: autoFullTrialInfo.remainingMs == null
        ? null
        : Math.max(0, Math.ceil(autoFullTrialInfo.remainingMs / 1000)),
      autoFullBossFilter,
      guild_bonus: guildBonus,
      set_bonus: Boolean(player.flags?.setBonusActive),
      exp_gold_bonus_pct: (() => {
        const totalPartyCount = partyMembersTotalCount(party) || 1;
        const partyMult = totalPartyCount > 1 ? (1 + Math.min(0.2 * totalPartyCount, 1.0)) : 1;
        const cultivationMult = cultivationRewardMultiplier(player);
        const rewardMult = totalRewardMultiplier({
          vipActive: isVipActive(player),
          guildActive: Boolean(player.guild),
          cultivationMult,
          partyMult
        });
        return Math.max(0, Math.round((rewardMult - 1) * 100));
      })()
    },
    summon: summonPayloads[0] || null,
    summons: summonPayloads,
    equipment,
    warehouse,
    guild: player.guild?.name || null,
    guild_role: player.guild?.role || null,
    party: party ? { size: party.members.length, leader: party.leader, members: partyMembers } : null,
    training: player.flags?.training || { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 },
    online: { count: onlineCount },
    daily_lucky: dailyLuckyInfo,
    anti: {
      key: player.socket?.data?.antiKey || null,
      seq: player.socket?.data?.antiSeq || 0
    },
    trade: getTradeByPlayerAny(player.name, realmId).trade ? (() => {
      const trade = getTradeByPlayerAny(player.name, realmId).trade;
      const myOffer = trade.offers[player.name];
      const partnerName = trade.a.name === player.name ? trade.b.name : trade.a.name;
      const partnerOffer = trade.offers[partnerName];
      return {
        partnerName,
        myItems: myOffer.items.map(i => ({ id: i.id, qty: i.qty, effects: i.effects })),
        myGold: myOffer.gold,
        myYuanbao: myOffer.yuanbao || 0,
        partnerItems: partnerOffer.items.map(i => ({ id: i.id, qty: i.qty, effects: i.effects })),
        partnerGold: partnerOffer.gold,
        partnerYuanbao: partnerOffer.yuanbao || 0,
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
    worldBossClassRank: bossClassRank,
    worldBossNextRespawn: bossNextRespawn,
    crossRank,
    players: roomPlayers,
    bossRespawn: nextRespawn,
    server_time: Date.now(),
    vip_self_claim_enabled: vipSelfClaimEnabled,
    svip_settings: {
      prices: svipSettings.prices
    },
    auto_full_boss_list: AUTO_FULL_BOSS_LIST,
    state_throttle_enabled: stateThrottleEnabled,
    state_throttle_interval_sec: stateThrottleIntervalSec,
    state_throttle_override_server_allowed: overrideServerAllowed,
    refine_material_count: refineMaterialCount,
    refine_config: {
      base_success_rate: getRefineBaseSuccessRate(),
      decay_rate: getRefineDecayRate(),
      material_count: refineMaterialCount,
      bonus_per_level: getRefineBonusPerLevel()
    },
    effect_reset_config: {
      success_rate: effectResetSuccessRate,
      double_rate: effectResetDoubleRate,
      triple_rate: effectResetTripleRate,
      quadruple_rate: effectResetQuadrupleRate,
      quintuple_rate: effectResetQuintupleRate
    }
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
      const exits = buildRoomExits(player.position.zone, player.position.room, player);
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
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const players = listOnlinePlayers(effectiveRealmId)
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId);
  
  if (players.length === 0) return;
  
  // BOSS房间优化：批量处理，减少序列化开销
  const isBoss = isBossRoom(zoneId, roomId, effectiveRealmId);
  
  if (isBoss && players.length > 5) {
    // BOSS房间且人很多时，使用节流，每100ms最多更新一次
    const cacheKey = `${effectiveRealmId}:${zoneId}:${roomId}`;
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
      const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
      const mobs = spawnMobs(zoneId, roomId, effectiveRealmId);

      // 根据房间内玩家数量调整世界BOSS属性
      adjustWorldBossStatsByPlayerCount(zoneId, roomId, effectiveRealmId);

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
            effectiveRealmId || null
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

    // 世界BOSS受到攻击时1%几率触发无敌效果（持续5秒）
    if (isWorldBoss && Math.random() <= 0.01) {
      if (!mob.status) mob.status = {};
      mob.status.invincible = now + 5000;

      // 清除所有毒效果和负面状态（保留禁疗效果）
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
        // 注意：不删除 healBlock（禁疗效果），让无敌期间也能受禁疗影响
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
            roomPlayer.send(`${mob.name} 触发了无敌效果，5秒内免疫所有伤害、毒、麻痹、降攻击、降防效果！`);
          });
        }
      }
      return { damageTaken: false };
    }
  }

  recordMobDamage(mob, attackerName, dmg);

  // 特殊BOSS血量百分比公告（在应用伤害前计算）
  let announcedBlood = false;
  if (isSpecialBoss && mob.hp > 0) {
    const hpBeforeDmg = mob.hp;

    // 使用全局Map记录BOSS血量公告状态，避免mob.status被重置导致重复公告
    if (!bossBloodAnnouncementStatus.has(mob.id)) {
      bossBloodAnnouncementStatus.set(mob.id, { announced50: false, announced30: false, announced10: false });
    }
    const announcementState = bossBloodAnnouncementStatus.get(mob.id);

    // 检查是否需要公告50%、30%、10%血量
    const thresholds = [
      { threshold: 0.5, key: 'announced50' },
      { threshold: 0.3, key: 'announced30' },
      { threshold: 0.1, key: 'announced10' }
    ];

    for (const { threshold, key } of thresholds) {
      const hpPct = hpBeforeDmg / mob.max_hp;
      if (hpPct <= threshold && !announcementState[key]) {
        announcementState[key] = true;
        emitAnnouncement(
          `${mob.name} 剩余 ${Math.floor(hpPct * 100)}% 血量！`,
          'warn',
          null,
          realmId
        );
        announcedBlood = true;
      }
    }
  }

  applyDamage(mob, dmg);
  enforceSpecialBossDebuffImmunity(mob, realmId);

  return { damageTaken: true, actualDamage: dmg };
}

function retaliateMobAgainstPlayer(mob, player, online) {
  if (!mob) return;
  if (isMobInactive(mob)) {
    logInactiveMobAttack(mob, 'retaliate');
    return;
  }
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
  const isBoss = mobTemplate ? isBossMob(mobTemplate) : false;
  if (!isBoss && Math.random() > mobHitChance) return;
  const isWorldBoss = Boolean(mobTemplate?.worldBoss);
  const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
  if (!isBoss && !isWorldBoss && !isSpecialBoss && mobTarget && mobTarget.evadeChance && Math.random() <= mobTarget.evadeChance) {
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

      // 清除所有毒效果和负面状态（保留禁疗效果）
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
        // 注意：不删除 healBlock（禁疗效果），让无敌期间也能受禁疗影响
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
    
    // 特殊BOSS AOE：主目标全额伤害，其他目标为BOSS攻击力50%
    if (
      isSpecialBoss &&
      isSplashBossTemplate(mobTemplate) &&
      isBossRoom(player.position.zone, player.position.room, player.realmId || 1) &&
      online &&
      online.length > 0
    ) {
      if (!mob.status) mob.status = {};
      if (mob.status.aoeAttacking) return;
      mob.status.aoeAttacking = true;
      try {
        const aoeBase = Math.floor(mob.atk * 0.5);
        const roomPlayers = online.filter((p) => 
          p.position.zone === player.position.zone &&
          p.position.room === player.position.room &&
          p.hp > 0
        );

        roomPlayers.forEach((aoeTarget) => {
          if (mobTarget && mobTarget.userId && aoeTarget.name === mobTarget.name) return;
          const aoeDealt = applyDamageToPlayer(
            aoeTarget,
            calcTaoistDamageFromValue(aoeBase, aoeTarget)
          );
          aoeTarget.send(`${mob.name} 的范围攻击波及你，造成 ${aoeDealt} 点伤害。`);
          if (aoeTarget.hp <= 0 && !tryRevive(aoeTarget)) {
            handleDeath(aoeTarget);
          }

          const aoeSummons = getAliveSummons(aoeTarget);
          aoeSummons.forEach((summon) => {
            if (mobTarget && !mobTarget.userId && mobTarget.id === summon.id) return;
            const summonDmg = calcTaoistDamageFromValue(aoeBase, summon);
            const applied = applyDamageToSummon(summon, summonDmg);
            aoeTarget.send(`${mob.name} 的范围攻击波及 ${summon.name}，造成 ${applied} 点伤害。`);
            if (summon.hp <= 0) {
              aoeTarget.send(`${summon.name} 被击败。`);
              removeSummonById(aoeTarget, summon.id);
              autoResummon(aoeTarget, summon.id);
            }
          });
        });
      } finally {
        mob.status.aoeAttacking = false;
      }
    }
    
    return;
  }
  applyDamageToSummon(mobTarget, dmg);
  player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
  
  // 特殊BOSS AOE：主目标全额伤害，其他目标为BOSS攻击力50%
  if (
    isSpecialBoss &&
    isSplashBossTemplate(mobTemplate) &&
    isBossRoom(player.position.zone, player.position.room, player.realmId || 1) &&
    online &&
    online.length > 0
  ) {
    if (!mob.status) mob.status = {};
    if (mob.status.aoeAttacking) return;
    mob.status.aoeAttacking = true;
    try {
      const aoeBase = Math.floor(mob.atk * 0.5);
      const roomPlayers = online.filter((p) => 
        p.position.zone === player.position.zone &&
        p.position.room === player.position.room &&
        p.hp > 0
      );

      roomPlayers.forEach((aoeTarget) => {
        const aoeDealt = applyDamageToPlayer(
          aoeTarget,
          calcTaoistDamageFromValue(aoeBase, aoeTarget)
        );
        aoeTarget.send(`${mob.name} 的范围攻击波及你，造成 ${aoeDealt} 点伤害。`);
        if (aoeTarget.hp <= 0 && !tryRevive(aoeTarget)) {
          handleDeath(aoeTarget);
        }

        const aoeSummons = getAliveSummons(aoeTarget);
        aoeSummons.forEach((summon) => {
          if (mobTarget && mobTarget.id === summon.id) return;
          const summonDmg = calcTaoistDamageFromValue(aoeBase, summon);
          const applied = applyDamageToSummon(summon, summonDmg);
          aoeTarget.send(`${mob.name} 的范围攻击波及 ${summon.name}，造成 ${applied} 点伤害。`);
          if (summon.hp <= 0) {
            aoeTarget.send(`${summon.name} 被击败。`);
            removeSummonById(aoeTarget, summon.id);
            autoResummon(aoeTarget, summon.id);
          }
        });
      });
    } finally {
      mob.status.aoeAttacking = false;
    }
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

const MOB_SKILL_TYPES = new Set(['attack', 'spell', 'dot', 'aoe', 'cleave', 'summon']);
const MOB_SUMMON_SKILLS = new Set(['skeleton', 'summon', 'white_tiger']);
const MOB_SUMMON_TEMPLATE_BY_SKILL = {
  skeleton: 'mob_summon_skeleton',
  summon: 'mob_summon_beast',
  white_tiger: 'mob_summon_white_tiger'
};
const MOB_SKILL_POOL = Object.values(SKILLS)
  .flatMap((group) => Object.values(group))
  .filter((skill) => skill && MOB_SKILL_TYPES.has(skill.type) && !MOB_SUMMON_SKILLS.has(skill.id));
const MOB_SUMMON_POOL = Object.values(SKILLS)
  .flatMap((group) => Object.values(group))
  .filter((skill) => skill && MOB_SUMMON_SKILLS.has(skill.id));
const MOB_SKILL_CHANCE = 0.2;
const MOB_SUMMON_CHANCE = 0.04;
const SKILL_NAME_OVERRIDES = {
  earth_spike: '彻地钉',
  thunderstorm: '雷霆万钧'
};

function getMobSkillLevel(mob) {
  const level = Math.max(1, Number(mob?.level || 1));
  return Math.max(1, Math.min(3, Math.floor(level / 15) + 1));
}

function pickMobSkill(mob) {
  if (!mob) return null;
  if (!mob.status) mob.status = {};
  const now = Date.now();
  const nextAt = mob.status.nextSkillAt || 0;
  if (now < nextAt) return null;
  if (Math.random() > MOB_SKILL_CHANCE) return null;
  let skill = null;
  if (MOB_SUMMON_POOL.length && Math.random() <= MOB_SUMMON_CHANCE) {
    skill = MOB_SUMMON_POOL[randInt(0, MOB_SUMMON_POOL.length - 1)];
  } else if (MOB_SKILL_POOL.length) {
    skill = MOB_SKILL_POOL[randInt(0, MOB_SKILL_POOL.length - 1)];
  }
  if (!skill) return null;
  mob.status.nextSkillAt = now + (skill.type === 'summon' ? 10000 : 3000);
  return skill;
}

function getSkillDisplayName(skill) {
  if (!skill) return '';
  return SKILL_NAME_OVERRIDES[skill.id] || skill.name || '';
}

function removeSummonedMobsByOwner(ownerMob, realmId, zoneId, roomId) {
  if (!ownerMob) return;
  const mobs = getRoomMobs(zoneId, roomId, realmId);
  for (let i = mobs.length - 1; i >= 0; i -= 1) {
    const entry = mobs[i];
    if (entry && entry.status?.summonedBy === ownerMob.id) {
      mobs.splice(i, 1);
    }
  }
}

function tryMobSummon(mob, skill, realmId, zoneId, roomId) {
  if (!mob || !skill) return null;
  const templateId = MOB_SUMMON_TEMPLATE_BY_SKILL[skill.id];
  if (!templateId) return null;
  const mobs = getRoomMobs(zoneId, roomId, realmId);
  const existing = mobs.find((entry) => entry?.status?.summonedBy === mob.id && entry.hp > 0);
  if (existing) return null;
  const fakeCaster = {
    max_hp: mob.max_hp || 100,
    spirit: mob.atk || 0,
    def: mob.def || 0,
    mdef: mob.mdef || 0
  };
  const skillLevel = getMobSkillLevel(mob);
  const summon = summonStats(fakeCaster, skill, skillLevel);
  const tpl = MOB_TEMPLATES[templateId];
  const summonMob = {
    id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
    templateId,
    zoneId,
    roomId,
    name: tpl?.name || summon.name,
    level: summon.level,
    hp: summon.hp,
    max_hp: summon.max_hp,
    atk: summon.atk,
    def: summon.def,
    mdef: summon.mdef || 0,
    dex: summon.dex || 6,
    status: {
      baseStats: { atk: summon.atk, def: summon.def, mdef: summon.mdef || 0, max_hp: summon.max_hp },
      summoned: true,
      summonedBy: mob.id
    },
    summoned: true
  };
  mobs.push(summonMob);
  return summonMob;
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

function calcMagicDamage(powerStat, target, skillPower = 1) {
  const base = Math.max(0, powerStat || 0);
  const magicAtk = Math.floor(base * randInt(70, 100) / 100);
  const mdefMultiplier = getMagicDefenseMultiplier(target);
  const baseMdef = Math.floor((target.mdef || 0) * mdefMultiplier);
  const mdef = baseMdef + randInt(0, Math.max(0, baseMdef / 2));
  const dmg = Math.floor((magicAtk - mdef) * skillPower);
  return Math.max(1, dmg);
}

function isMobInactive(mob) {
  if (!mob) return true;
  const hp = Number(mob.hp);
  if (!Number.isFinite(hp) || hp <= 0) return true;
  if (mob.status?.processed) return true;
  if (mob.respawnAt && Number(mob.respawnAt) > Date.now()) return true;
  return false;
}

function logInactiveMobAttack(mob, context) {
  if (!mob || mob.templateId !== 'world_boss') return;
  if (!mob.status) mob.status = {};
  if (mob.status.inactiveLogged) return;
  mob.status.inactiveLogged = true;
  console.warn(
    `[world_boss][inactive] context=${context} mobId=${mob.id} hp=${mob.hp} respawnAt=${mob.respawnAt} zone=${mob.zoneId} room=${mob.roomId}`
  );
}

function calcTaoistDamage(powerStat, target, skillPower = 1) {
  const base = Math.max(0, powerStat || 0);
  const magicAtk = Math.floor(base * randInt(70, 100) / 100);
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
  const def = Math.floor(baseDef * defMultiplier) + randInt(0, Math.max(0, baseDef / 2));
  const mdefMultiplier = getMagicDefenseMultiplier(target);
  const baseMdef = Math.floor((target.mdef || 0) * mdefMultiplier);
  const mdef = baseMdef + randInt(0, Math.max(0, baseMdef / 2));
  // 最小改动：降低道术伤害受到防御/魔御的削减比例
  const dmg = Math.floor(magicAtk * skillPower - def * 0.2 - mdef * 0.2);
  return Math.max(1, dmg);
}

function calcMagicDamageFromValue(value, target) {
  return calcMagicDamage(value, target, 1);
}

function calcTaoistDamageFromValue(value, target) {
  return calcTaoistDamage(value, target, 1);
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
  applyPoisonEffectDebuff(target);
  return true;
}

async function resolvePlayerGuildRealmId(player) {
  const fallback = player?.realmId || 1;
  if (!player?.guild?.id) return fallback;
  try {
    const guild = await getGuildById(player.guild.id);
    const guildRealmId = Number(guild?.realm_id);
    if (Number.isFinite(guildRealmId) && guildRealmId > 0) return guildRealmId;
  } catch {}
  return fallback;
}

function buildDamageRankMap(mob, damageByOverride = null) {
  const damageBy = damageByOverride || mob.status?.damageBy || {};
  // 按伤害降序排序，伤害相同时按名字排序，确保稳定性
  const entries = Object.entries(damageBy).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // 按伤害降序
    return a[0].localeCompare(b[0]); // 伤害相同时按名字排序
  });
  const rankMap = {};
  entries.forEach(([name], idx) => {
    rankMap[name] = idx + 1;
  });
  return { rankMap, entries };
}

function buildBossClassRank(mob, entries, realmId = 1) {
  const classBuckets = { warrior: [], mage: [], taoist: [] };
  const online = listOnlinePlayers(realmId);
  const nameToClass = new Map(online.map((p) => [p.name, p.classId]));
  entries.forEach(([name, damage]) => {
    const cls = nameToClass.get(name);
    if (!cls || !classBuckets[cls]) return;
    classBuckets[cls].push({ name, damage });
  });
  Object.keys(classBuckets).forEach((cls) => {
    classBuckets[cls] = classBuckets[cls]
      .sort((a, b) => (b.damage !== a.damage ? b.damage - a.damage : a.name.localeCompare(b.name)))
      .slice(0, 5);
  });
  return classBuckets;
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
  if (!isVipAutoEnabled(player)) return;
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
  const roomRealmId = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
  const roomMobs = getAliveMobs(player.position.zone, player.position.room, roomRealmId);
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

function sanitizePayload(payload, allowedKeys, eventName) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { clean: {}, extraKeys: [] };
  }
  const clean = {};
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      clean[key] = payload[key];
    }
  });
  const extraKeys = Object.keys(payload).filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length && eventName) {
    console.warn(`[socket][${eventName}] ignored extra keys: ${extraKeys.join(', ')}`);
  }
  return { clean, extraKeys };
}

io.on('connection', (socket) => {
  socket.on('state_throttle_override', (payload) => {
    const { clean } = sanitizePayload(payload, ['enabled'], 'state_throttle_override');
    socket.data.stateThrottleOverride = clean.enabled === true;
    const player = players.get(socket.id);
    if (player) {
      player.stateThrottleOverride = socket.data.stateThrottleOverride;
    }
  });
  socket.on('auth', async (payload) => {
    const { clean } = sanitizePayload(payload, ['token', 'name', 'realmId', 'deviceId', 'deviceFingerprint', 'clientVersion', 'clientPlatform'], 'auth');
    const { token, name, realmId: rawRealmId, deviceId, deviceFingerprint, clientVersion, clientPlatform } = clean;
    const session = await getSession(token);
    if (!session) {
      socket.emit('auth_error', { error: '登录已过期。' });
      socket.disconnect();
      return;
    }

    // Android 版本最低限制已取消

    const deviceKey = String(deviceFingerprint || '').trim();
    if (!deviceKey) {
      socket.emit('auth_error', { error: '设备指纹缺失。' });
      socket.disconnect();
      return;
    }
    const existingDeviceSocketId = deviceOnlineMap.get(deviceKey);
    if (existingDeviceSocketId && existingDeviceSocketId !== socket.id) {
      socket.emit('auth_error', { error: '该设备已在线。' });
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
    loaded.deviceKey = deviceKey;
    loaded.send = (msg) => sendTo(loaded, msg);
    loaded.combat = null;
    loaded.guild = null;
    if (!loaded.flags) loaded.flags = {};
    loaded.stateThrottleOverride = socket.data?.stateThrottleOverride === true;
    if (!socket.data.antiKey) {
      socket.data.antiKey = crypto.randomBytes(16).toString('hex');
      socket.data.antiSeq = 0;
    }

    // 将玩家称号添加到在线玩家称号Map
    if (loaded.rankTitle) {
      onlinePlayerRankTitles.set(loaded.name, loaded.rankTitle);
    }
    deviceOnlineMap.set(deviceKey, socket.id);
    const throttleKey = getStateThrottleKey(loaded, socket);
    if (throttleKey) {
      stateThrottleLastSent.delete(throttleKey);
      stateThrottleLastExits.delete(throttleKey);
      stateThrottleLastRoom.delete(throttleKey);
      stateThrottleLastInBoss.delete(throttleKey);
    }

    // 自动恢复召唤兽
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
      // 清除保存的召唤兽数据
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
    loaded.send(`元宝: ${loaded.yuanbao || 0}`);
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
    const { clean } = sanitizePayload(payload, ['text', 'source', 'seq', 'sig'], 'cmd');
    const inputText = typeof clean.text === 'string' ? clean.text : '';
    const inputSource = typeof clean.source === 'string' ? clean.source : '';
    const cmdName = inputText.trim().split(/\s+/)[0]?.toLowerCase();
    const rateLimitExempt = new Set(['refine', 'forge', 'train', 'effect']);
    const { rateLimits, cooldowns } = await getCmdRateSettingsCached();
    if (!rateLimitExempt.has(cmdName)) {
      if (hitRateLimit(player, 'cmd', rateLimits.global.limit, rateLimits.global.windowMs) ||
          hitRateLimit(player, 'cmd_burst', rateLimits.burst.limit, rateLimits.burst.windowMs)) {
        player.send('操作过快，请稍后再试。');
        return;
      }
      if (cmdName && cooldowns[cmdName]) {
        if (hitCooldown(player, `cmd:${cmdName}`, cooldowns[cmdName])) {
          player.send('操作过快，请稍后再试。');
          return;
        }
      }
    }
    // antiKey 校验已禁用
    const prevZone = player.position.zone;
    const prevRoom = player.position.room;
    const commandRealmId = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
    const commandPlayers = commandRealmId === CROSS_REALM_REALM_ID
      ? listOnlinePlayers()
      : listOnlinePlayers(player.realmId || 1);
    await handleCommand({
      player,
      players: commandPlayers,
      allCharacters: listAllCharacters(player.realmId || 1),
      playersByName: (name, realmId) => {
        const list = Array.from(players.values());
        return list.find((p) => p.name === name && (!realmId || p.realmId === realmId));
      },
      input: inputText,
      source: inputSource,
      send: (msg) => sendTo(player, msg),
      realmId: player.realmId || 1,
        emitAnnouncement: (text, color, location) => emitAnnouncement(text, color, location, player.realmId || 1),
        onMove: ({ from, to }) => {
          if (from && from.zone && from.room) {
            sendRoomState(from.zone, from.room, player.realmId || 1);
          }
          if (to && to.zone && to.room) {
            sendRoomState(to.zone, to.room, player.realmId || 1);
          }
        },
        logLoot,
        svipApi,
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
      rechargeApi,
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
    if (isCultivationRoom(player.position.zone)) {
      return socket.emit('mail_send_result', { ok: false, msg: '修真房间内无法使用邮件。' });
    }
    const { clean } = sanitizePayload(payload, ['toName', 'title', 'body', 'items', 'gold'], 'mail_send');
    const toName = String(clean?.toName || '').trim();
    const title = String(clean?.title || '').trim();
    const body = String(clean?.body || '').trim();
    const itemsPayload = Array.isArray(clean?.items) ? clean.items : [];
    const gold = Math.max(0, Number(clean?.gold || 0));
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
          if (!removeItem(player, slot.id, qty, slot.effects, slot.durability ?? null, slot.max_durability ?? null, slot.refine_level ?? null)) {
            return socket.emit('mail_send_result', { ok: false, msg: '附件数量超过背包数量。' });
          }
        items.push({
          id: slot.id,
          qty,
          effects: slot.effects || null,
          durability: slot.durability ?? null,
          max_durability: slot.max_durability ?? null,
          refine_level: slot.refine_level ?? null
        });
      }
    }

    if (gold > 0) {
      if (player.gold < gold) {
        items.forEach((entry) => {
          addItem(
            player,
            entry.id,
            entry.qty || 1,
            entry.effects || null,
            entry.durability ?? null,
            entry.max_durability ?? null,
            entry.refine_level ?? null
          );
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
    if (isCultivationRoom(player.position.zone)) {
      return socket.emit('mail_claim_result', { ok: false, msg: '修真房间内无法使用邮件。' });
    }
    const { clean } = sanitizePayload(payload, ['mailId'], 'mail_claim');
    const mailId = Number(clean?.mailId || 0);
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
        addItem(
          player,
          entry.id,
          entry.qty || 1,
          entry.effects || null,
          entry.durability ?? null,
          entry.max_durability ?? null,
          entry.refine_level ?? null
        );
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
    const { clean } = sanitizePayload(payload, ['mailId'], 'mail_read');
    const mailId = Number(clean?.mailId || 0);
    if (!mailId) return;
    await markMailRead(player.userId, mailId, player.realmId || 1);
    const mails = await listMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload) });
  });

  socket.on('mail_list_sent', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    sanitizePayload(payload, [], 'mail_list_sent');
    const mails = await listSentMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: mails.map(buildMailPayload), folder: 'sent' });
  });

  socket.on('mail_delete', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    if (isCultivationRoom(player.position.zone)) {
      return socket.emit('mail_delete_result', { ok: false, msg: '修真房间内无法使用邮件。' });
    }
    const { clean } = sanitizePayload(payload, ['mailId', 'folder'], 'mail_delete');
    const mailId = Number(clean?.mailId || 0);
    const folder = clean?.folder || 'inbox';
    if (!mailId) return socket.emit('mail_delete_result', { ok: false, msg: '邮件ID无效。' });

    // 检查收件箱邮件是否有未领取的附件
    if (folder === 'inbox') {
      const mails = await listMail(player.userId, player.realmId || 1);
      const mail = mails.find(m => m.id === mailId);
      if (mail) {
        const hasItems = mail.items_json && JSON.parse(mail.items_json).length > 0;
        const hasGold = mail.gold && mail.gold > 0;
        if ((hasItems || hasGold) && !mail.claimed_at) {
          return socket.emit('mail_delete_result', { ok: false, msg: '该邮件有附件未领取，无法删除。' });
        }
      }
    }

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
      online: online.some((p) => p.name === m.char_name),
      level: m.level || 1,
      classId: m.class_id || ''
    }));
    socket.emit('guild_members', {
      ok: true,
      guild: { id: player.guild.id, name: player.guild.name },
      guildId: player.guild.id,
      guildName: player.guild.name,
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
    const { clean } = sanitizePayload(payload, ['guildId'], 'guild_apply');
    if (!clean || !clean.guildId) return socket.emit('guild_apply_result', { ok: false, msg: '参数错误' });

    if (player.guild) {
      return socket.emit('guild_apply_result', { ok: false, msg: '你已经有行会了' });
    }

    // 检查是否已有申请
    const existingApp = await getApplicationByUser(player.userId, player.realmId || 1);
    if (existingApp) {
      return socket.emit('guild_apply_result', {
        ok: false,
        msg: '你已经申请了行会，请等待处理',
        guildId: existingApp.guild_id || null
      });
    }

    const guild = await getGuildById(clean.guildId);
    if (!guild || String(guild.realm_id) !== String(player.realmId || 1)) {
      return socket.emit('guild_apply_result', { ok: false, msg: '行会不存在' });
    }

    await applyToGuild(clean.guildId, player.userId, player.name, player.realmId || 1);
    socket.emit('guild_apply_result', { ok: true, msg: `已申请加入行会 ${guild.name}`, guildId: clean.guildId });

    // 通知在线的会长和副会长
    const members = await listGuildMembers(clean.guildId, player.realmId || 1);
    members.forEach((m) => {
      if (m.role === 'leader' || m.role === 'vice_leader') {
        const onlineMember = playersByName(m.char_name, player.realmId || 1);
        if (onlineMember) {
          onlineMember.send(`${player.name} 申请加入行会`);
        }
      }
    });
    if (player.forceStateRefresh) {
      await sendState(player);
      await savePlayer(player);
    }
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
    const { clean } = sanitizePayload(payload, ['charName'], 'guild_approve');
    if (!clean || !clean.charName) return socket.emit('guild_approve_result', { ok: false, msg: '参数错误' });

    const isLeaderOrVice = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
    if (!isLeaderOrVice) {
      return socket.emit('guild_approve_result', { ok: false, msg: '只有会长或副会长可以批准申请' });
    }

    const applications = await listGuildApplications(player.guild.id, player.realmId || 1);
    const targetApp = applications.find((a) => a.char_name === clean.charName);
    if (!targetApp) {
      return socket.emit('guild_approve_result', { ok: false, msg: '该玩家没有申请加入你的行会' });
    }

    try {
      await approveGuildApplication(player.guild.id, targetApp.user_id, clean.charName, player.realmId || 1);
      socket.emit('guild_approve_result', { ok: true, msg: `已批准 ${clean.charName} 加入行会` });

      const onlineTarget = playersByName(clean.charName, player.realmId || 1);
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
    const { clean } = sanitizePayload(payload, ['charName'], 'guild_reject');
    if (!clean || !clean.charName) return socket.emit('guild_reject_result', { ok: false, msg: '参数错误' });

    const isLeaderOrVice = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
    if (!isLeaderOrVice) {
      return socket.emit('guild_reject_result', { ok: false, msg: '只有会长或副会长可以拒绝申请' });
    }

    const applications = await listGuildApplications(player.guild.id, player.realmId || 1);
    const targetApp = applications.find((a) => a.char_name === clean.charName);
    if (!targetApp) {
      return socket.emit('guild_reject_result', { ok: false, msg: '该玩家没有申请加入你的行会' });
    }

    await removeGuildApplication(player.guild.id, targetApp.user_id, player.realmId || 1);
    socket.emit('guild_reject_result', { ok: true, msg: `已拒绝 ${clean.charName} 的申请` });

    const onlineTarget = playersByName(clean.charName, player.realmId || 1);
    if (onlineTarget) {
      onlineTarget.send('你的加入行会申请已被拒绝');
    }
  });

  socket.on('sabak_info', async () => {
    const player = players.get(socket.id);
    if (!player) return;

    const realmId = await resolvePlayerGuildRealmId(player);
    const sabakState = getSabakState(realmId);
    const ownerGuildName = sabakState.ownerGuildName || '无';
    const windowInfo = sabakWindowInfo();
    const registrationWindowInfo = sabakRegistrationWindowInfo();
      const registrations = await listSabakRegistrations(realmId);
      const hasAnyRegistrationToday = await hasAnySabakRegistrationToday(realmId);
    const today = new Date();
    const todaysRegistrations = (registrations || []).filter((r) => isSabakRegistrationToday(r, today));

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
    const isLeaderOrVice = player.guild && (player.guild.role === 'leader' || player.guild.role === 'vice');
    const now = new Date();
    const registerEnd = new Date(sabakWindowRange(now).start.getTime() - 10 * 60 * 1000);
    const hasRegisteredToday = player.guild
      ? await hasSabakRegistrationToday(player.guild.id, realmId)
      : false;
    const canRegister =
      isLeaderOrVice &&
      !isOwner &&
      now < registerEnd &&
      !hasRegisteredToday &&
      !hasAnyRegistrationToday;

    socket.emit('sabak_info', {
      windowInfo,
      registrationWindowInfo,
      ownerGuildName,
      registrations: displayRegistrations,
      canRegister,
      isOwner
    });
  });

  socket.on('sabak_register_confirm', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    sanitizePayload(payload, [], 'sabak_register_confirm');
    const sendRegisterResult = (ok, msg) => {
      socket.emit('sabak_register_result', { ok: Boolean(ok), msg });
    };

    if (!player.guild) {
      player.send('你不在行会中。');
      sendRegisterResult(false, '你不在行会中。');
      return;
    }
    const realmId = await resolvePlayerGuildRealmId(player);
    const isLeader = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name, realmId);
    if (!isLeader) {
      player.send('只有会长或副会长可以报名。');
      sendRegisterResult(false, '只有会长或副会长可以报名。');
      return;
    }
    const sabakState = getSabakState(realmId);
    const isOwner = String(player.guild.id) === String(sabakState.ownerGuildId);
    if (isOwner) {
      player.send('守城行会无需报名。');
      sendRegisterResult(false, '守城行会无需报名。');
      return;
    }
    // 检查报名时间：截至攻城开始前10分钟
    const now = new Date();
    const registerEnd = new Date(sabakWindowRange(now).start.getTime() - 10 * 60 * 1000);
    if (now >= registerEnd) {
      player.send(`报名时间为每日 ${sabakRegistrationWindowInfo()}，当前时间已截止报名。`);
      sendRegisterResult(false, `报名时间为每日 ${sabakRegistrationWindowInfo()}，当前时间已截止报名。`);
      return;
    }
    const hasRegisteredToday = await hasSabakRegistrationToday(player.guild.id, realmId);
    if (hasRegisteredToday) {
      player.send('该行会今天已经报名过了。');
      sendRegisterResult(false, '该行会今天已经报名过了。');
      return;
    }
    const registrations = await listSabakRegistrations(realmId);
    const today = new Date();
    const todayRegistrations = registrations.filter(r => {
      if (!r.registered_at) return false;
      const regDate = new Date(r.registered_at);
      return regDate.toDateString() === today.toDateString();
    });
    if (todayRegistrations.length >= 1) {
      player.send('今天已经有行会报名了，每天只能有一个行会申请攻城。');
      sendRegisterResult(false, '今天已经有行会报名了，每天只能有一个行会申请攻城。');
      return;
    }
    if (player.gold < 1000000) {
      player.send('报名需要100万金币。');
      sendRegisterResult(false, '报名需要100万金币。');
      return;
    }
    player.gold -= 1000000;
    try {
        await registerSabak(player.guild.id, realmId);
      player.send('已报名沙巴克攻城，支付100万金币。');
      sendRegisterResult(true, '报名成功，已支付100万金币。');
      player.forceStateRefresh = true;
      await sendState(player);
      await savePlayer(player);
    } catch {
      player.send('该行会已经报名。');
      sendRegisterResult(false, '该行会已经报名。');
      player.gold += 1000000;
      player.forceStateRefresh = true;
      await sendState(player);
      await savePlayer(player);
    }
  });

  socket.on('disconnect', async (reason) => {
    const player = players.get(socket.id);
      if (player) {
        console.log(`[disconnect] ${player.name} (${player.userId || 'unknown'}) reason=${reason || 'unknown'}`);
        if (!player.flags) player.flags = {};
        player.flags.offlineAt = Date.now();
    const lookup = getTradeByPlayerAny(player.name, player.realmId || 1);
    const trade = lookup.trade;
    if (trade) {
      clearTrade(trade, `交易已取消（${player.name} 离线）。`, trade.realmId ?? lookup.realmId ?? (player.realmId || 1));
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
      // 从在线玩家称号Map中移除
      onlinePlayerRankTitles.delete(player.name);
      if (player.deviceKey && deviceOnlineMap.get(player.deviceKey) === socket.id) {
        deviceOnlineMap.delete(player.deviceKey);
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
      if (key === 'magicShield' && buff.mpBoost) {
        const boost = Number(buff.mpBoost) || 0;
        if (boost > 0 && target.max_mp !== undefined) {
          target.max_mp = Math.max(1, (target.max_mp || 0) - boost);
          if (target.mp !== undefined) {
            target.mp = Math.min(target.mp, target.max_mp);
          }
        }
      }
      delete buffs[key];
    }
  });
}

function applyMoonFairyAura(player, online) {
  const aliveSummons = getAliveSummons(player);
  const moonFairy = aliveSummons.find((summon) => summon.id === 'moon_fairy');
  if (!moonFairy) return;
  const realmId = player.realmId || 1;
  const party = getPartyByMember(player.name, realmId);
  const members = party
    ? online.filter(
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
  const now = Date.now();
  targets.forEach((target) => {
    if (!target || target.hp <= 0) return;
    const heal = Math.max(1, Math.floor((target.max_hp || 0) * 0.1));
    applyHealing(target, heal);
    applyBuff(target, { key: 'defBuff', expiresAt: now + 1500, defMultiplier: 1.2 });
    applyBuff(target, { key: 'mdefBuff', expiresAt: now + 1500, mdefMultiplier: 1.2 });
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
  if (!isVipAutoEnabled(player)) return false;
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

function applyMagicShield(target, ratio, durationSec, mpMultiplier = 1) {
  if (!target) return false;
  if (!target.status) target.status = {};
  if (!target.status.buffs) target.status.buffs = {};
  const now = Date.now();
  const existing = target.status.buffs.magicShield;
  if (existing && (!existing.expiresAt || existing.expiresAt > now)) {
    return false;
  }
  const buff = {
    key: 'magicShield',
    expiresAt: now + durationSec * 1000,
    ratio
  };
  if (mpMultiplier > 1 && target.max_mp !== undefined) {
    const boost = Math.floor((target.max_mp || 0) * (mpMultiplier - 1));
    if (boost > 0) {
      target.max_mp += boost;
      if (target.mp !== undefined) {
        target.mp = Math.min(target.max_mp, (target.mp || 0) + boost);
      }
      buff.mpBoost = boost;
    }
  }
  applyBuff(target, buff);
  return true;
}

function tryAutoBuff(player) {
  if (!player.flags?.autoSkillId) return false;
  if (!isVipAutoEnabled(player)) return false;
  const autoSkill = player.flags.autoSkillId;
  const learnedBuffs = getLearnedSkills(player).filter((skill) =>
    skill.type === 'buff_def' ||
    skill.type === 'buff_mdef' ||
    skill.type === 'buff_shield' ||
    skill.type === 'buff_magic_shield_group' ||
    skill.type === 'buff_tiangang' ||
    skill.type === 'stealth_group'
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
      applyMagicShield(player, ratio, duration, 1);
      player.send(`自动施放 ${buffSkill.name}，持续 ${duration} 秒。`);
      return true;
    }
    if (buffSkill.type === 'buff_tiangang') {
      const atkBuff = player.status?.buffs?.atkBuff;
      if (atkBuff && (!atkBuff.expiresAt || atkBuff.expiresAt >= now + 5000)) continue;
      player.mp = clamp(player.mp - buffSkill.mp, 0, player.max_mp);
      const duration = 5;
      applyBuff(player, { key: 'atkBuff', expiresAt: now + duration * 1000, multiplier: 2.0 });
      applyBuff(player, { key: 'defBuff', expiresAt: now + duration * 1000, defMultiplier: 1.5 });
      applyBuff(player, { key: 'mdefBuff', expiresAt: now + duration * 1000, mdefMultiplier: 1.5 });
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      if (buffSkill.cooldown) {
        player.status.skillCooldowns[buffSkill.id] = Date.now();
      }
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
      player.send(`自动施放 ${buffSkill.name}，自己和召唤兽 ${duration} 秒内免疫所有伤害，道术提升100%。`);
      return true;
    }
    if (buffSkill.type === 'buff_magic_shield_group') {
      const duration = 5;
      const alreadyActive = targets.every((p) => {
        const shield = p.status?.buffs?.magicShield;
        return shield && (!shield.expiresAt || shield.expiresAt > now + 1000);
      });
      if (alreadyActive) continue;

      player.mp = clamp(player.mp - buffSkill.mp, 0, player.max_mp);
      targets.forEach((p) => {
        const applied = applyMagicShield(p, 1, duration, 2);
        if (applied && p.send && p.name && p.name !== player.name) {
          p.send(`${player.name} 自动为你施放 ${buffSkill.name}。`);
        }
      });
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      if (buffSkill.cooldown) {
        player.status.skillCooldowns[buffSkill.id] = Date.now();
      }
      player.send(`自动施放 ${buffSkill.name}，持续 ${duration} 秒。`);
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
    if (!isVipAutoEnabled(player)) return combatSkillId;
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
      // 召唤技能：如果召唤兽还存活，跳过该技能
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
  if (!isVipAutoEnabled(player)) return false;
  const autoEnabled = Boolean(player.flags?.autoFullEnabled || player.flags?.autoSkillId);
  if (!autoEnabled) return false;
  const skills = getLearnedSkills(player).filter((skill) => skill.type === 'summon');
  if (!skills.length) return false;

  const autoSkill = player.flags?.autoSkillId;
  let allowedSummonSkills = [];
  if (autoSkill === 'all' || (!autoSkill && player.flags?.autoFullEnabled)) {
    allowedSummonSkills = skills;
  } else if (Array.isArray(autoSkill)) {
    allowedSummonSkills = skills.filter((skill) => autoSkill.includes(skill.id));
  } else if (typeof autoSkill === 'string') {
    allowedSummonSkills = skills.filter((skill) => skill.id === autoSkill);
  }
  const existingIds = new Set(getAliveSummons(player).map((summon) => summon.id));
  if (desiredSkillId && existingIds.has(desiredSkillId)) return false;

  let summonSkill = null;
  if (desiredSkillId) {
    summonSkill = skills.find((skill) => skill.id === desiredSkillId) || null;
  }
  if (!summonSkill && !allowedSummonSkills.length) return false;

  const lastSkillId = player.flags?.lastSummonSkill;
  if (!summonSkill && lastSkillId && !existingIds.has(lastSkillId)) {
    summonSkill = allowedSummonSkills.find((skill) => skill.id === lastSkillId) || null;
  }

  if (!summonSkill) {
    const candidates = allowedSummonSkills.filter((skill) => !existingIds.has(skill.id));
    if (!candidates.length) return false;
    summonSkill = candidates.sort((a, b) => getSkillLevel(player, b.id) - getSkillLevel(player, a.id))[0];
  }

  if (!summonSkill) return false;
  if (player.mp < summonSkill.mp) {
    if (!player.flags) player.flags = {};
    player.flags.pendingResummonSkillId = summonSkill.id;
    return false;
  }
  player.mp = clamp(player.mp - summonSkill.mp, 0, player.max_mp);
  const skillLevel = getSkillLevel(player, summonSkill.id);
  const summon = summonStats(player, summonSkill, skillLevel);
  addOrReplaceSummon(player, { ...summon, exp: 0 });
  player.send(`召唤兽被击败，自动召唤 ${summon.name} (等级 ${summon.level})。`);
  return true;
}

function tryPendingResummon(player) {
  if (!player?.flags?.pendingResummonSkillId) return false;
  const desired = player.flags.pendingResummonSkillId;
  const ok = autoResummon(player, desired);
  if (ok && player.flags) {
    player.flags.pendingResummonSkillId = null;
  }
  return ok;
}

function reduceDurabilityOnAttack(player) {
  if (!player || !player.equipment) return;
  if (!player.flags) player.flags = {};
  player.flags.attackCount = (player.flags.attackCount || 0) + 1;
  const threshold = isVipActive(player) ? 400 : 200;
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
  if (player?.flags?.autoFullEnabled) {
    if (!player.flags) player.flags = {};
    const now = Date.now();
    player.flags.autoFullPausedUntil = now + 1000;
    player.flags.autoFullLastMoveAt = now;
  }
  player.hp = Math.floor(player.max_hp * 0.5);
  player.mp = Math.floor(player.max_mp * 0.3);
  // 随机分配到4个平原变体
  const plainsVariants = ['plains', 'plains1', 'plains2', 'plains3'];
  const randomPlains = plainsVariants[Math.floor(Math.random() * plainsVariants.length)];
  player.position = { zone: 'bq_plains', room: randomPlains };
  player.combat = null;
  player.send('你被击败，返回了平原。');
}

async function processMobDeath(player, mob, online) {
  // 防止同一个BOSS被重复处理
  if (mob.status && mob.status.processed) {
    return;
  }
  // 标记为已处理
  if (mob.status) {
    mob.status.processed = true;
  }

  // 清理BOSS血量公告状态
  bossBloodAnnouncementStatus.delete(mob.id);

  const realmId = player?.realmId || 1;
  const damageSnapshot = mob.status?.damageBy ? { ...mob.status.damageBy } : {};
  const lastHitSnapshot = mob.status?.lastHitBy || null;
  const template = MOB_TEMPLATES[mob.templateId];
  const mobZoneId = mob.zoneId || player.position.zone;
  const mobRoomId = mob.roomId || player.position.room;
  const roomRealmId = getRoomRealmId(mobZoneId, mobRoomId, realmId);
  const announcementRealmId = roomRealmId === CROSS_REALM_REALM_ID ? null : realmId;
  const isPlayerInMobRoom = (target) =>
    Boolean(target && target.position && target.position.zone === mobZoneId && target.position.room === mobRoomId);
  const removedMob = removeMob(mobZoneId, mobRoomId, mob.id, roomRealmId);
  if (removedMob && removedMob.respawnAt) {
    try {
      await upsertMobRespawn(
        roomRealmId,
        mobZoneId,
        mobRoomId,
        removedMob.slotIndex,
        removedMob.templateId,
        removedMob.respawnAt
      );
      if (roomRealmId === CROSS_REALM_REALM_ID && removedMob.templateId === 'cross_world_boss') {
        await setCrossWorldBossRespawnAt(removedMob.respawnAt);
      }
    } catch (err) {
      console.warn('Failed to persist mob respawn state:', err);
    }
  }
  removeSummonedMobsByOwner(mob, roomRealmId, mobZoneId, mobRoomId);
  if (template?.summoned || mob.summoned || mob.status?.summoned) {
    return;
  }
  gainSummonExp(player);
  let exp = template.exp;
  let gold = randInt(template.gold[0], template.gold[1]);
  if (isCultivationRoom(mobZoneId) && !isCultivationBoss(template)) {
    exp = Math.max(1, Math.floor(exp * 0.5));
  }

  const party = getPartyByMember(player.name, realmId);
  // 检查队伍成员是否都在同一个房间
  const allPartyInSameRoom = party ? partyMembersInSameRoom(party, online, mobZoneId, mobRoomId) : false;
  // 物品分配：只有队友都在同一个房间才能分掉落的物品
  let partyMembersForLoot = allPartyInSameRoom ? partyMembersInRoom(party, online, mobZoneId, mobRoomId) : [];
  // 经验金币分配使用全图在线的队友
  let partyMembersForReward = party ? partyMembersOnline(party, online) : [];
  // 计算加成使用队伍总人数（包括离线的）
  const totalPartyCount = partyMembersTotalCount(party) || 1;
  const hasParty = partyMembersForReward.length > 1;
  const isBoss = isBossMob(template);
  const isWorldBoss = Boolean(template.worldBoss);
  const isSabakBoss = Boolean(template.sabakBoss);
  const isMolongBoss = template.id === 'molong_boss';
  const isSpecialBossMob = isWorldBoss || isSabakBoss || isMolongBoss || isSpecialBoss(template);
  if (isWorldBoss) {
    const nextKills = incrementWorldBossKills(1, roomRealmId);
    void setWorldBossKillCount(nextKills, roomRealmId).catch((err) => {
      console.warn('Failed to persist world boss kill count:', err);
    });
  }
  if (template.specialBoss && !template.worldBoss) {
    const nextKills = incrementSpecialBossKills(1, roomRealmId);
    void setSpecialBossKillCount(nextKills, roomRealmId).catch((err) => {
      console.warn('Failed to persist special boss kill count:', err);
    });
  }
  if (template.id && template.id.startsWith('cultivation_boss_')) {
    const nextKills = incrementCultivationBossKills(1, roomRealmId);
    void setCultivationBossKillCount(nextKills, roomRealmId).catch((err) => {
      console.warn('Failed to persist cultivation boss kill count:', err);
    });
  }
  if (isSpecialBossMob) {
    // 清理特殊BOSS职业伤害第一奖励标记
    bossClassFirstDamageRewardGiven.delete(`${roomRealmId}:${mob.id}`);
  }
  const { rankMap, entries } = isSpecialBossMob ? buildDamageRankMap(mob, damageSnapshot) : { rankMap: {}, entries: [] };
  let lootOwner = player;
  if (!party || partyMembersForReward.length === 0) {
    let ownerName = null;
    if (isSpecialBossMob) {
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
    lootOwner = playersByName(ownerName, roomRealmId) || player;
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
  let ultimateDropCount = 0;

    partyMembersForReward.forEach((member) => {
      const partyMult = totalPartyCount > 1 ? (1 + Math.min(0.2 * totalPartyCount, 1.0)) : 1;
      const cultivationMult = cultivationRewardMultiplier(member);
      const rewardMult = totalRewardMultiplier({
        vipActive: isVipActive(member),
        guildActive: Boolean(member.guild),
        cultivationMult,
        partyMult
      });
      const finalExp = Math.floor(shareExp * rewardMult);
      const finalGold = Math.floor(shareGold * rewardMult);
      member.gold += finalGold;
      const leveled = gainExp(member, finalExp);
      awardKill(member, mob.templateId);
      member.send(`队伍分配: 获得 ${finalExp} 经验和 ${finalGold} 金币。`);
      if (leveled) member.send('你升级了！');
    });

  const dropTargets = [];
  let classRanks = null;
  let classRankMap = null;
  if (isSpecialBossMob) {
    const totalDamage = entries.reduce((sum, [, dmg]) => sum + dmg, 0) || 1;
    classRanks = entries.length ? buildBossClassRank(mob, entries, roomRealmId) : null;
    if (classRanks) {
      classRankMap = new Map();
      Object.entries(classRanks).forEach(([cls, list]) => {
        list.forEach((entry, idx) => {
          classRankMap.set(`${cls}:${entry.name}`, idx + 1);
        });
      });
    }

    entries.forEach(([name, damage], idx) => {
      const player = playersByName(name, roomRealmId);
      if (!player) return;
      if (isBoss && !isPlayerInMobRoom(player)) return;
      const damageRatio = damage / totalDamage;
      const cls = player.classId;
      const classRank = classRankMap ? (classRankMap.get(`${cls}:${name}`) || null) : null;
      dropTargets.push({
        player,
        damageRatio,
        rank: idx + 1,
        classRank
      });
    });
  } else {
    if (!isBoss || isPlayerInMobRoom(lootOwner)) {
      dropTargets.push({ player: lootOwner, damageRatio: 1, rank: 1, classRank: 1 });
    }
  }

    const legendaryClassAwarded = new Set();
    const supremeClassAwarded = new Set();
    const ultimateClassAwarded = new Set();
    // Prevent a player from receiving multiple legendary/supreme/ultimate drops in the same boss settlement
    const legendaryPlayerAwarded = new Set();
    const supremePlayerAwarded = new Set();
    const ultimatePlayerAwarded = new Set();

    if (isSpecialBossMob && entries.length) {
      classRanks = classRanks || buildBossClassRank(mob, entries, roomRealmId);
      const rewardKey = `${roomRealmId}:${mob.id}`;
      if (bossClassFirstDamageRewardProcessed.has(rewardKey)) {
        return;
      }
      bossClassFirstDamageRewardProcessed.add(rewardKey);
      let rewardState = bossClassFirstDamageRewardGiven.get(rewardKey);
      if (!rewardState) {
        rewardState = new Set();
        bossClassFirstDamageRewardGiven.set(rewardKey, rewardState);
      }
      const classLabels = [
        { id: 'warrior', name: '战士' },
        { id: 'mage', name: '法师' },
        { id: 'taoist', name: '道士' }
      ];
      classLabels.forEach((cls) => {
        if (rewardState.has(cls.id)) return;
        const topEntry = classRanks?.[cls.id]?.[0];
        if (!topEntry || !topEntry.damage) return;
        let topPlayer = playersByName(topEntry.name, roomRealmId);
        if (topPlayer && !isPlayerInMobRoom(topPlayer)) {
          topPlayer = null;
        }
        if (!topPlayer) return;
        let forcedId = rollRarityEquipmentDrop(template, 1);
        if (!forcedId) {
            const equipPool = Object.values(ITEM_TEMPLATES)
              .filter((i) => i && ['weapon', 'armor', 'accessory'].includes(i.type))
              .filter((i) => {
                if (template?.worldBoss) return true;
                const rarity = rarityByPrice(i);
                return rarity !== 'supreme' && rarity !== 'ultimate';
              })
              .map((i) => i.id);
          if (equipPool.length) {
            forcedId = equipPool[randInt(0, equipPool.length - 1)];
          }
        }
        if (!forcedId) return;
        const forcedEffects = forceEquipmentEffects(forcedId);
        addItem(topPlayer, forcedId, 1, forcedEffects);
        topPlayer.send(`${cls.name}伤害第一奖励：${formatItemLabel(forcedId, forcedEffects)}。`);
        const forcedItem = ITEM_TEMPLATES[forcedId];
        if (forcedItem) {
          const forcedRarity = rarityByPrice(forcedItem);
            if (forcedRarity === 'legendary') legendaryPlayerAwarded.add(topPlayer.name);
            if (forcedRarity === 'supreme') supremePlayerAwarded.add(topPlayer.name);
            if (forcedRarity === 'ultimate') ultimatePlayerAwarded.add(topPlayer.name);
            if (['legendary', 'supreme', 'ultimate'].includes(forcedRarity)) {
              emitAnnouncement(`${topPlayer.name}（${cls.name}）获得伤害第一奖励 ${formatItemLabel(forcedId, forcedEffects)}！`, forcedRarity, null, announcementRealmId);
            }
          if (isEquipmentItem(forcedItem) && hasSpecialEffects(forcedEffects)) {
            emitAnnouncement(`${topPlayer.name}（${cls.name}）获得特效装备 ${formatItemLabel(forcedId, forcedEffects)}！`, 'announce', null, announcementRealmId);
          }
        }
        rewardState.add(cls.id);
      });
    }

  const lootOwnersToSave = new Set();
  dropTargets.forEach(({ player: owner, damageRatio, rank, classRank }) => {
      const vipDropBonus = isVipActive(owner) ? 1.01 : 1;
      const drops = dropLoot(template, vipDropBonus);
      if (!drops.length) return;
      if (!isSpecialBoss && party && partyMembersForLoot.length > 0) {
        const distributed = distributeLootWithBonus(
          party,
          partyMembersForLoot,
          template,
          (member) => (isVipActive(member) ? 1.01 : 1)
        );
        distributed.forEach(({ id, effects, target }) => {
          const item = ITEM_TEMPLATES[id];
          if (!item) return;
          logLoot(`[loot][party] ${target.name} <- ${id} (${template.id})`);
          const rarity = rarityByPrice(item);
            if (['legendary', 'supreme', 'ultimate'].includes(rarity)) {
              const text = `${target.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(id, effects)}！`;
              emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity, null, announcementRealmId);
            }
          if (isEquipmentItem(item) && hasSpecialEffects(effects)) {
            emitAnnouncement(`${target.name} 获得特效装备 ${formatItemLabel(id, effects)}！`, 'announce', null, announcementRealmId);
          }
          if (target?.userId) lootOwnersToSave.add(target);
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
            if ((rarity === 'legendary' || rarity === 'supreme' || rarity === 'ultimate') && classRank > 3) {
              logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (classRank:${classRank})`);
              return;
            }
            if (rarity === 'legendary') {
              if (owner.classId && legendaryClassAwarded.has(owner.classId)) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (legendary class limit)`);
                return;
              }
              if (legendaryPlayerAwarded.has(owner.name)) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (legendary already awarded in class reward)`);
                return;
              }
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
              if (owner.classId) legendaryClassAwarded.add(owner.classId);
            }
            if (rarity === 'supreme') {
              if (owner.classId && supremeClassAwarded.has(owner.classId)) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (supreme class limit)`);
                return;
              }
              if (supremePlayerAwarded.has(owner.name)) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (supreme already awarded in class reward)`);
                return;
              }
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
              if (owner.classId) supremeClassAwarded.add(owner.classId);
            }
            if (rarity === 'ultimate') {
              if (owner.classId && ultimateClassAwarded.has(owner.classId)) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (ultimate class limit)`);
                return;
              }
              if (ultimatePlayerAwarded.has(owner.name)) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (ultimate already awarded in class reward)`);
                return;
              }
              // 检查该玩家是否已经获得过终极装备
              if (actualDrops.some(d => {
                const dItem = ITEM_TEMPLATES[d.id];
                return dItem && rarityByPrice(dItem) === 'ultimate';
              })) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (player already has ultimate)`);
                return;
              }
              // 检查全服是否已掉落3件终极装备
              if (ultimateDropCount >= 3) {
                logLoot(`[loot][special][skip] ${owner.name} ${entry.id} (ultimate limit reached)`);
                return;
              }
              if (owner.classId) ultimateClassAwarded.add(owner.classId);
            }
          }

          addItem(owner, entry.id, 1, entry.effects);
          logLoot(`[loot][special] ${owner.name} <- ${entry.id} (${template.id})`);
          actualDrops.push(entry);
          itemCount++;
          if (owner?.userId) lootOwnersToSave.add(owner);
          if (item) {
            const rarity = rarityByPrice(item);
              if (rarity === 'legendary') {
                legendaryDropCount++;
              } else if (rarity === 'supreme') {
                supremeDropCount++;
              } else if (rarity === 'ultimate') {
                ultimateDropCount++;
              }
            }
            if (!item) return;
            const rarity = rarityByPrice(item);
            if (['legendary', 'supreme', 'ultimate'].includes(rarity)) {
              const text = `${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`;
              emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity, null, announcementRealmId);
            }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce', null, announcementRealmId);
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
          if (owner?.userId) lootOwnersToSave.add(owner);
        });
        owner.send(`掉落: ${drops.map((entry) => formatItemLabel(entry.id, entry.effects)).join(', ')}`);
        drops.forEach((entry) => {
          const item = ITEM_TEMPLATES[entry.id];
          if (!item) return;
          const rarity = rarityByPrice(item);
            if (['legendary', 'supreme', 'ultimate'].includes(rarity)) {
              const text = `${owner.name} 击败 ${template.name} 获得${RARITY_LABELS[rarity] || '稀有'}装备 ${formatItemLabel(entry.id, entry.effects)}！`;
              emitAnnouncement(formatLegendaryAnnouncement(text, rarity), rarity, null, announcementRealmId);
            }
          if (isEquipmentItem(item) && hasSpecialEffects(entry.effects)) {
            emitAnnouncement(`${owner.name} 获得特效装备 ${formatItemLabel(entry.id, entry.effects)}！`, 'announce', null, announcementRealmId);
          }
        });
      }
    });

  if (lootOwnersToSave.size > 0) {
    await Promise.all(
      Array.from(lootOwnersToSave).map((p) => savePlayer(p).catch(() => {}))
    );
  }
}

function updateSpecialBossStatsBasedOnPlayers() {
  const realmIds = Array.from(new Set([0, 1, ...realmStates.keys()]));

  realmIds.forEach((realmId) => {
    Object.keys(WORLD).forEach((zoneId) => {
      const zone = WORLD[zoneId];
      if (!zone?.rooms) return;

      Object.keys(zone.rooms).forEach((roomId) => {
        const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
        const online = listOnlinePlayers(effectiveRealmId);
        const roomMobs = getAliveMobs(zoneId, roomId, effectiveRealmId);
        const specialBoss = roomMobs.find((m) => {
          const tpl = MOB_TEMPLATES[m.templateId];
          return tpl && (tpl.specialBoss || isCultivationBoss(tpl));
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
        const isCultivation = isCultivationBoss(tpl);
        const playerBonusConfig = isWorldBoss
          ? getWorldBossPlayerBonusConfigSync()
          : (isCultivation ? getCultivationBossPlayerBonusConfigSync() : getSpecialBossPlayerBonusConfigSync());

        // 找到适用的人数加成配置（取最大满足档位）
        const bonusConfig = pickPlayerBonusConfig(playerBonusConfig, playersInRoom);
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
    applyMoonFairyAura(player, online);
    processPotionRegen(player);
    updateRedNameAutoClear(player);
    updateAutoDailyUsage(player);
    const realmId = player.realmId || 1;
    const roomRealmId = getRoomRealmId(player.position.zone, player.position.room, realmId);
    const roomKey = `${roomRealmId}:${player.position.zone}:${player.position.room}`;
    let roomMobs = roomMobsCache.get(roomKey);
    if (!roomMobs) {
      roomMobs = getAliveMobs(player.position.zone, player.position.room, roomRealmId);
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
          const source = playersByName(poisonSource, roomRealmId);
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
      tryPendingResummon(player);
      tryAutoHeal(player);
      const aggroMob = roomMobs.find((m) => m.status?.aggroTarget === player.name);
      if (aggroMob) {
        player.combat = { targetId: aggroMob.id, targetType: 'mob', skillId: null };
      }
      if (!player.combat && CROSS_RANK_EVENT_STATE.active && isCrossRankRoom(player.position.zone, player.position.room)) {
        const enemy = online.find((p) =>
          p.name !== player.name &&
          p.position.zone === player.position.zone &&
          p.position.room === player.position.room &&
          p.hp > 0 &&
          (p.realmId || 1) !== (player.realmId || 1)
        );
        if (enemy) {
          player.combat = { targetId: enemy.name, targetType: 'player', skillId: null };
        }
      }
      if (!player.combat && player.flags?.autoFullEnabled) {
        const autoFullResult = tryAutoFullAction(player, roomMobs);
        if (autoFullResult === 'moved') {
          continue;
        }
      }
      if (player.flags?.autoSkillId && isVipAutoEnabled(player)) {
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
    tryPendingResummon(player);
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
        const inCultivationRoom = isCultivationRoom(player.position.zone);
        const inCrossBossRoom = player.position.zone === 'crb' && player.position.room === 'arena';
        const inCrossRankRoom = isCrossRankRoom(player.position.zone, player.position.room);
        if (inCultivationRoom && (target.realmId || 1) === (player.realmId || 1)) {
          player.combat = null;
          player.send('修真房间不能攻击同区服玩家。');
          continue;
        }
        if (inCrossBossRoom && (target.realmId || 1) === (player.realmId || 1)) {
          player.combat = null;
          player.send('跨服房间不能攻击同区服玩家。');
          continue;
        }
        if (inCrossRankRoom && (target.realmId || 1) === (player.realmId || 1)) {
          player.combat = null;
          player.send('跨服排位赛不能攻击同区服玩家。');
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
            const powerStat = getPowerStatValue(player, skill);
            // 道士的soul技能受防御和魔御各50%影响
            if (skill.id === 'soul') {
              dmg = calcTaoistDamage(powerStat, target, skillPower);
            } else {
              dmg = calcMagicDamage(powerStat, target, skillPower);
            }
          }
        } else if (skill.type === 'dot') {
          const spirit = getSpiritValue(player);
          // 道术攻击受防御和魔御各50%影响
          dmg = calcTaoistDamage(spirit, target, skillPower);
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
        const validExtraTargets = inCultivationRoom
          ? extraTargets.filter((p) => (p.realmId || 1) !== (player.realmId || 1))
          : extraTargets;
        if (validExtraTargets.length) {
          const extraTarget = validExtraTargets[randInt(0, validExtraTargets.length - 1)];
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
            const cultivationCrossKill = inCultivationRoom && (extraTarget.realmId || 1) !== (player.realmId || 1);
            if (!wasRed && !isSabakZone(player.position.zone) && !isCrossRankRoom(player.position.zone, player.position.room) && !cultivationCrossKill) {
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
            recordCrossRankKill(player, extraTarget);
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
        const inCrossBossRoom = player.position.zone === 'crb' && player.position.room === 'arena';
        const inCrossRankRoom = isCrossRankRoom(player.position.zone, player.position.room);
        const inCrossRankEvent = inCrossRankRoom && CROSS_RANK_EVENT_STATE.active;
        const crossRealmKill = inCrossBossRoom && (target.realmId || 1) !== (player.realmId || 1);
        const cultivationCrossKill = inCultivationRoom && (target.realmId || 1) !== (player.realmId || 1);
        if (!wasRed && !isSabakZone(player.position.zone) && !crossRealmKill && !inCrossRankEvent && !cultivationCrossKill) {
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
        recordCrossRankKill(player, target);
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
      const mobImmuneToDebuffs = enforceSpecialBossDebuffImmunity(mob, roomRealmId);
      let dmg = 0;
      let skillPower = 1;
      if (skill && (skill.type === 'attack' || skill.type === 'spell' || skill.type === 'cleave' || skill.type === 'dot' || skill.type === 'aoe')) {
        const skillLevel = getSkillLevel(player, skill.id);
        skillPower = scaledSkillPower(skill, skillLevel);
        if (skill.type === 'spell' || skill.type === 'aoe') {
          if (skill.powerStat === 'atk') {
            dmg = calcDamage(player, mob, skillPower);
          } else {
            const powerStat = getPowerStatValue(player, skill);
            dmg = calcMagicDamage(powerStat, mob, skillPower);
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
        const hasFalloff = skill.id === 'earth_spike' || skill.id === 'thunder' || skill.id === 'thunderstorm';
        mobs.forEach((target) => {
          // AOE伤害应该对每个目标独立计算，而不是使用主目标的伤害
          let aoeDmg = 0;
          if (skill.powerStat === 'atk') {
            aoeDmg = calcDamage(player, target, skillPower);
          } else {
            const powerStat = getPowerStatValue(player, skill);
            aoeDmg = calcMagicDamage(powerStat, target, skillPower);
          }
          if (hasFalloff && target.id !== mob.id) {
            aoeDmg = Math.max(1, Math.floor(aoeDmg * 0.5));
          }
          const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
          if (elementAtk > 0) {
            aoeDmg += elementAtk * 10;
          }
          const result = applyDamageToMob(target, aoeDmg, player.name, roomRealmId);
          if (result?.damageTaken) {
            player.send(`你对 ${target.name} 造成 ${aoeDmg} 点伤害。`);
          }
          const targetImmuneToDebuffs = enforceSpecialBossDebuffImmunity(target, roomRealmId);
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
          for (const target of deadTargets) {
            await processMobDeath(player, target, online);
          }
          if (deadTargets.some((target) => target.id === mob.id)) {
            player.combat = null;
          }
          sendRoomState(player.position.zone, player.position.room, roomRealmId);
          continue;
        }
        sendRoomState(player.position.zone, player.position.room, roomRealmId);
      } else {
        const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
        if (elementAtk > 0) {
          dmg += elementAtk * 10;
        }
        const result = applyDamageToMob(mob, dmg, player.name, roomRealmId);
        if (result?.damageTaken) {
          player.send(`你对 ${mob.name} 造成 ${dmg} 点伤害。`);
        }
        if (hasComboWeapon(player) && mob.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          const comboResult = applyDamageToMob(mob, dmg, player.name, roomRealmId);
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
            const extraResult = applyDamageToMob(extraTarget, extraDmg, player.name, roomRealmId);
            if (extraResult?.damageTaken) {
              player.send(`刺杀剑术波及 ${extraTarget.name}，造成 ${extraDmg} 点伤害。`);
            }
            const extraImmuneToDebuffs = enforceSpecialBossDebuffImmunity(extraTarget, roomRealmId);
            if (tryApplyHealBlockEffect(player, extraTarget)) {
              player.send(`禁疗效果作用于 ${extraTarget.name}。`);
            }
            if (!extraImmuneToDebuffs && tryApplyPoisonEffect(player, extraTarget)) {
              player.send(`你的毒特效作用于 ${extraTarget.name}。`);
            }
            if (extraTarget.hp <= 0) {
              await processMobDeath(player, extraTarget, online);
            }
          }
        }
        if (mob.hp > 0) {
          sendRoomState(player.position.zone, player.position.room, roomRealmId);
        }
      }

      const mobTemplate = MOB_TEMPLATES[mob.templateId];
      const magicRingChance = isBossMob(mobTemplate) ? 0.05 : 0.1;
      if (hasSpecialRingEquipped(player, 'ring_magic') &&
          canTriggerMagicRing(player, chosenSkillId, skill) &&
          Math.random() <= magicRingChance) {
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
          const cleaveResult = applyDamageToMob(other, cleaveDmg, player.name, roomRealmId);
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

    enforceSpecialBossDebuffImmunity(mob, roomRealmId);
    const statusTick = tickStatus(mob);
    if (statusTick && statusTick.type === 'poison') {
      player.send(`${mob.name} 受到 ${statusTick.dmg} 点中毒伤害。`);
      
      // 记录每个玩家造成的中毒伤害到排行榜
      if (statusTick.damageBySource) {
        for (const [sourceName, damage] of Object.entries(statusTick.damageBySource)) {
          if (sourceName && sourceName !== 'unknown') {
            recordMobDamage(mob, sourceName, damage);
            const source = playersByName(sourceName, roomRealmId);
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
        if (summon.id === 'moon_fairy') return;
        if (summon.id === 'white_tiger') {
          mobs.forEach((target) => {
            const hitChance = calcHitChance(summon, target);
            if (Math.random() <= hitChance) {
              let dmg = calcTaoistDamageFromValue(getSpiritValue(summon), target);
              if (target.id !== mob.id) {
                dmg = Math.max(1, Math.floor(dmg * 0.5));
              }
              const summonResult = applyDamageToMob(target, dmg, player.name, roomRealmId);
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
          const summonResult = applyDamageToMob(mob, dmg, player.name, roomRealmId);
          if (summonResult?.damageTaken) {
            player.send(`${summon.name} 对 ${mob.name} 造成 ${dmg} 点伤害。`);
          }
        }
      });
    }

    if (mob.hp <= 0) {
      await processMobDeath(player, mob, online);
      player.combat = null;
      sendRoomState(player.position.zone, player.position.room, roomRealmId);
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
    const mobZoneId = mob.zoneId || player.position.zone;
    const mobRoomId = mob.roomId || player.position.room;
    // BOSS刷新中/已处理/已死亡时，不应继续对玩家造成伤害
    if (isMobInactive(mob)) {
      logInactiveMobAttack(mob, 'combat');
      continue;
    }
    const mobSkill = pickMobSkill(mob);
    let skipMobAttack = false;
    if (mobSkill && mobSkill.type === 'summon') {
      const summoned = tryMobSummon(mob, mobSkill, roomRealmId, mobZoneId, mobRoomId);
      if (summoned) {
        sendToRoom(roomRealmId, mobZoneId, mobRoomId, `${mob.name} 施放 ${getSkillDisplayName(mobSkill)}，召唤了 ${summoned.name}！`);
        sendRoomState(mobZoneId, mobRoomId, roomRealmId);
        skipMobAttack = true;
      }
    }
    if (!skipMobAttack) {
    const mobHitChance = calcHitChance(mob, mobTarget);
    const isBoss = mobTemplate ? isBossMob(mobTemplate) : false;
    if (isBoss || Math.random() <= mobHitChance) {
      const isWorldBoss = Boolean(mobTemplate?.worldBoss);
      const isSpecialBoss = Boolean(mobTemplate?.specialBoss);
      const enragedMultiplier = isSpecialBossEnraged(mob) ? 2 : 1;
      if (!isBoss && !isWorldBoss && !isSpecialBoss && mobTarget && mobTarget.evadeChance && Math.random() <= mobTarget.evadeChance) {
        if (mobTarget.userId) {
          mobTarget.send(`你闪避了 ${mob.name} 的攻击。`);
        } else {
          player.send(`${mobTarget.name} 闪避了 ${mob.name} 的攻击。`);
        }
        continue;
      }
      if (enragedMultiplier > 1) {
        if (!mob.status) mob.status = {};
        if (!mob.status.enragedStatsApplied) {
          mob.status.enragedStatsApplied = true;
          mob.def = Math.floor((mob.def || 0) * enragedMultiplier);
          mob.mdef = Math.floor((mob.mdef || 0) * enragedMultiplier);
          if (mob.status.baseStats) {
            mob.status.baseStats.def = mob.def;
            mob.status.baseStats.mdef = mob.mdef;
          }
        }
      } else if (mob.status?.enragedStatsApplied) {
        mob.status.enragedStatsApplied = false;
        const baseStats = mob.status?.baseStats;
        const tpl = mobTemplate;
        const baseDef = baseStats?.def ?? tpl?.def ?? mob.def ?? 0;
        const baseMdef = baseStats?.mdef ?? tpl?.mdef ?? mob.mdef ?? 0;
        mob.def = Math.floor(baseDef);
        mob.mdef = Math.floor(baseMdef);
        if (mob.status?.baseStats) {
          mob.status.baseStats.def = mob.def;
          mob.status.baseStats.mdef = mob.mdef;
        }
      }
      let dmg = calcDamage(mob, mobTarget, 1);
      let handledAoe = false;
      if (mobSkill) {
        const mobSkillLevel = getMobSkillLevel(mob);
        const mobSkillPower = scaledSkillPower(mobSkill, mobSkillLevel);
        sendToRoom(roomRealmId, mobZoneId, mobRoomId, `${mob.name} 释放了 ${getSkillDisplayName(mobSkill)}！`);
        if (mobSkill.type === 'attack' || mobSkill.type === 'cleave') {
          dmg = calcDamage(mob, mobTarget, mobSkillPower);
        } else if (mobSkill.type === 'spell') {
          dmg = calcMagicDamageFromValue(Math.floor((mob.atk || 0) * mobSkillPower), mobTarget);
        } else if (mobSkill.type === 'dot') {
          const tickDmg = calcPoisonTickDamage(mobTarget);
          applyPoison(mobTarget, 10, Math.max(1, Math.floor(tickDmg * enragedMultiplier)), mob.name);
          applyPoisonDebuff(mobTarget);
          dmg = calcTaoistDamageFromValue(Math.floor((mob.atk || 0) * mobSkillPower), mobTarget);
        } else if (mobSkill.type === 'aoe') {
          const roomPlayers = online.filter((p) =>
            p.position.zone === mobZoneId &&
            p.position.room === mobRoomId &&
            p.hp > 0
          );
          roomPlayers.forEach((target) => {
            const aoeDmg = Math.floor(
              calcMagicDamageFromValue(Math.floor((mob.atk || 0) * mobSkillPower), target) * enragedMultiplier
            );
            const dealt = applyDamageToPlayer(target, aoeDmg);
            target.send(`${mob.name} 的 ${mobSkill.name} 对你造成 ${dealt} 点伤害。`);
            if (target.hp <= 0 && !tryRevive(target)) {
              handleDeath(target);
            }
            const targetSummons = getAliveSummons(target);
            targetSummons.forEach((summon) => {
              applyDamageToSummon(summon, Math.floor(aoeDmg * 0.6));
              target.send(`${mob.name} 的 ${mobSkill.name} 波及 ${summon.name}。`);
              if (summon.hp <= 0) {
                target.send(`${summon.name} 被击败。`);
                removeSummonById(target, summon.id);
                autoResummon(target, summon.id);
              }
            });
          });
          handledAoe = true;
        }
      }
      if (!handledAoe) {
      const magicBase = Math.floor(mob.atk || 0);
      const spiritBase = Math.floor(mob.atk || 0);
      dmg += calcMagicDamageFromValue(magicBase, mobTarget);
      dmg += calcTaoistDamageFromValue(spiritBase, mobTarget);
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
      if (enragedMultiplier > 1) {
        dmg = Math.floor(dmg * enragedMultiplier);
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
        
        // 特殊BOSS AOE：主目标全额伤害，其他目标为BOSS攻击力50%
        if (
          isSpecialBoss &&
          isSplashBossTemplate(mobTemplate) &&
          isBossRoom(player.position.zone, player.position.room, roomRealmId) &&
          online &&
          online.length > 0
        ) {
          if (!mob.status) mob.status = {};
          if (mob.status.aoeAttacking) return;
          mob.status.aoeAttacking = true;
          try {
            const aoeBase = Math.floor(mob.atk * 0.5 * enragedMultiplier);
            const roomPlayers = online.filter((p) => 
              p.position.zone === player.position.zone &&
              p.position.room === player.position.room &&
              p.hp > 0
            );
            
            roomPlayers.forEach((aoeTarget) => {
              if (mobTarget && mobTarget.userId && aoeTarget.name === mobTarget.name) return;
              const aoeDealt = applyDamageToPlayer(
                aoeTarget,
                calcTaoistDamageFromValue(aoeBase, aoeTarget)
              );
              aoeTarget.send(`${mob.name} 的范围攻击波及你，造成 ${aoeDealt} 点伤害。`);
              if (aoeTarget.hp <= 0 && !tryRevive(aoeTarget)) {
                handleDeath(aoeTarget);
              }
              
              const aoeSummons = getAliveSummons(aoeTarget);
              aoeSummons.forEach((summon) => {
                if (mobTarget && !mobTarget.userId && mobTarget.id === summon.id) return;
                const summonDmg = calcTaoistDamageFromValue(aoeBase, summon);
                const applied = applyDamageToSummon(summon, summonDmg);
                aoeTarget.send(`${mob.name} 的范围攻击波及 ${summon.name}，造成 ${applied} 点伤害。`);
                if (summon.hp <= 0) {
                  aoeTarget.send(`${summon.name} 被击败。`);
                  removeSummonById(aoeTarget, summon.id);
                  autoResummon(aoeTarget, summon.id);
                }
              });
            });
          } finally {
            mob.status.aoeAttacking = false;
          }
        }
      } else {
        applyDamageToSummon(mobTarget, dmg);
        player.send(`${mob.name} 对 ${mobTarget.name} 造成 ${dmg} 点伤害。`);
        
        // 特殊BOSS AOE：主目标全额伤害，其他目标为BOSS攻击力50%
        if (
          isSpecialBoss &&
          isSplashBossTemplate(mobTemplate) &&
          isBossRoom(player.position.zone, player.position.room, roomRealmId) &&
          online &&
          online.length > 0
        ) {
          if (!mob.status) mob.status = {};
          if (mob.status.aoeAttacking) return;
          mob.status.aoeAttacking = true;
          try {
            const aoeBase = Math.floor(mob.atk * 0.5 * enragedMultiplier);
            const roomPlayers = online.filter((p) => 
              p.position.zone === player.position.zone &&
              p.position.room === player.position.room &&
              p.hp > 0
            );
            
            roomPlayers.forEach((aoeTarget) => {
              const aoeDealt = applyDamageToPlayer(
                aoeTarget,
                calcTaoistDamageFromValue(aoeBase, aoeTarget)
              );
              aoeTarget.send(`${mob.name} 的范围攻击波及你，造成 ${aoeDealt} 点伤害。`);
              if (aoeTarget.hp <= 0 && !tryRevive(aoeTarget)) {
                handleDeath(aoeTarget);
              }
              
              const aoeSummons = getAliveSummons(aoeTarget);
              aoeSummons.forEach((summon) => {
                if (mobTarget && mobTarget.id === summon.id) return;
                const summonDmg = calcTaoistDamageFromValue(aoeBase, summon);
                const applied = applyDamageToSummon(summon, summonDmg);
                aoeTarget.send(`${mob.name} 的范围攻击波及 ${summon.name}，造成 ${applied} 点伤害。`);
                if (summon.hp <= 0) {
                  aoeTarget.send(`${summon.name} 被击败。`);
                  removeSummonById(aoeTarget, summon.id);
                  autoResummon(aoeTarget, summon.id);
                }
              });
            });
          } finally {
            mob.status.aoeAttacking = false;
          }
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
      }
    } else {
      player.send(`${mob.name} 攻击落空。`);
    }
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
      // 检查是否有行会报名（使用DB判断避免时区差异）
      const hasRegistration = await hasAnySabakRegistrationToday(realmId);
    if (!hasRegistration) {
      // 没有行会报名，直接判定守城方胜利（每日仅公告一次）
      const todayKey = nowDate.toDateString();
      if (sabakState.noRegAnnounceDate !== todayKey) {
        sabakState.noRegAnnounceDate = todayKey;
        emitAnnouncement('今日无行会报名攻城，守城方自动获胜！', 'announce', null, realmId);
      }
    } else {
      sabakState.noRegAnnounceDate = null;
      // 有行会报名，正常开始攻城战
      await startSabakSiege(null, realmId);
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

    // 如果皇宫内只有单一行会成员（攻城方或守城方）
    if (palacePlayers.length > 0) {
      const firstGuildId = String(palacePlayers[0].guild.id);
      if (palacePlayers.every(p => String(p.guild.id) === firstGuildId)) {
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
        const isDefenderHold = String(sabakState.captureGuildId) === String(ownerGuildId);
        sabakState.ownerGuildId = sabakState.captureGuildId;
        sabakState.ownerGuildName = sabakState.captureGuildName;
        await setSabakOwner(realmId, sabakState.captureGuildId, sabakState.captureGuildName);
        if (isDefenderHold) {
          emitAnnouncement(`守城方占领沙城皇宫5分钟，成功守住沙巴克！`, 'announce', null, realmId);
        } else {
          emitAnnouncement(`${sabakState.captureGuildName} 占领沙城皇宫5分钟，成功夺取沙巴克！`, 'announce', null, realmId);
        }
        sabakState.active = false;
        sabakState.siegeEndsAt = null;
        sabakState.captureGuildId = null;
        sabakState.captureGuildName = null;
        sabakState.captureStart = null;
        sabakState.killStats = {};
        await clearSabakRegistrations(realmId);
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
  await applyCultivationBossSettings();
  await applySpecialBossSettings();
  await loadEventTimeSettings();
  await refreshRealmCache();
  await clearInvalidCrossWorldBossRespawns();

  // 同步数据库中的装备属性到 ITEM_TEMPLATES
  console.log('Syncing items from database...');
  const syncedCount = await syncItemsToTemplates();
  console.log(`Synced ${syncedCount} items from database.`);

  // 同步数据库中的掉落配置到 MOB_TEMPLATES
  console.log('Syncing mob drops from database...');
  const syncedDrops = await syncMobDropsToTemplates();
  console.log(`Synced ${syncedDrops} mob drops from database.`);

  // 启动自动备份定时任务
  scheduleAutoBackup();

  // 启动排行榜自动更新定时任务
  setupRankUpdate();

  // 启动每日幸运玩家定时任务
  setupDailyLucky();

  setRespawnStore({
    set: (realmId, zoneId, roomId, slotIndex, templateId, respawnAt) =>
      upsertMobRespawn(realmId, zoneId, roomId, slotIndex, templateId, respawnAt),
    clear: (realmId, zoneId, roomId, slotIndex) =>
      clearMobRespawn(realmId, zoneId, roomId, slotIndex)
  });
  const respawnRows = [];
  const crossRealmRows = await listMobRespawns(CROSS_REALM_REALM_ID);
  respawnRows.push(...crossRealmRows);
  for (const realm of realmCache) {
    const rows = await listMobRespawns(realm.id);
    respawnRows.push(...rows);
  }
  const now = Date.now();
  if (!crossRealmRows.some((row) => row.zone_id === 'crb' && row.room_id === 'arena')) {
    const fallbackAt = await getCrossWorldBossRespawnAt();
    if (fallbackAt && fallbackAt > now) {
      try {
        await upsertMobRespawn(CROSS_REALM_REALM_ID, 'crb', 'arena', 0, 'cross_world_boss', fallbackAt);
        respawnRows.push({
          zone_id: 'crb',
          room_id: 'arena',
          slot_index: 0,
          template_id: 'cross_world_boss',
          respawn_at: fallbackAt,
          realm_id: CROSS_REALM_REALM_ID
        });
      } catch (err) {
        console.warn('Failed to restore cross world boss respawn fallback:', err);
      }
    }
  }
  const activeRespawns = [];
  for (const row of respawnRows) {
    if (row.respawn_at && Number(row.respawn_at) > now) {
      activeRespawns.push(row);
    } else if (row.current_hp && row.current_hp > 0) {
      // 保留有血量数据的怪物，即使重生时间已过期
      activeRespawns.push(row);
    } else {
      const realmValue = row.realm_id ?? row.realmId;
      const realmId = (realmValue === undefined || realmValue === null) ? 1 : Number(realmValue);
      await clearMobRespawn(Number.isNaN(realmId) ? 1 : realmId, row.zone_id, row.room_id, row.slot_index);
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
  // 世界BOSS击杀次数改为按区服维护（含跨服realm=0）
  for (const realmId of getRealmIds()) {
    const worldBossKillCount = await getWorldBossKillCount(realmId);
    setWorldBossKillCountState(worldBossKillCount, realmId);
    const specialBossKillCount = await getSpecialBossKillCount(realmId);
    setSpecialBossKillCountState(specialBossKillCount, realmId);
    const cultivationBossKillCount = await getCultivationBossKillCount(realmId);
    setCultivationBossKillCountState(cultivationBossKillCount, realmId);
  }
  const roomVariantCount = await getRoomVariantCount();
  applyRoomVariantCount(roomVariantCount);
  shrinkRoomVariants(WORLD, roomVariantCount);
  expandRoomVariants(WORLD);

  // 加载修炼果配置
  const trainingFruitCoefficient = await getTrainingFruitCoefficientDb();
  setTrainingFruitCoefficient(trainingFruitCoefficient);
  const trainingFruitDropRate = await getTrainingFruitDropRateDb();
  setTrainingFruitDropRateConfig(trainingFruitDropRate);

  // 加载修炼系统配置
  const trainingPerLevelConfig = await getTrainingPerLevelConfigDb();
  setTrainingPerLevelConfigMem(trainingPerLevelConfig);

  // 加载职业升级属性配置
  const classLevelConfigs = {
    warrior: await getClassLevelBonusConfig('warrior'),
    mage: await getClassLevelBonusConfig('mage'),
    taoist: await getClassLevelBonusConfig('taoist')
  };
  setAllClassLevelBonusConfigs(classLevelConfigs);

  // 加载锻造系统配置
  const refineBaseSuccessRate = await getRefineBaseSuccessRateDb();
  setRefineBaseSuccessRate(refineBaseSuccessRate);
  const refineDecayRate = await getRefineDecayRateDb();
  setRefineDecayRate(refineDecayRate);
  const refineMaterialCount = await getRefineMaterialCountDb();
  setRefineMaterialCount(refineMaterialCount);
  const refineBonusPerLevel = await getRefineBonusPerLevelDb();
  setRefineBonusPerLevel(refineBonusPerLevel);

  // 加载特效重置配置
  const effectResetSuccessRate = await getEffectResetSuccessRateDb();
  setEffectResetSuccessRate(effectResetSuccessRate);
  const effectResetDoubleRate = await getEffectResetDoubleRateDb();
  setEffectResetDoubleRate(effectResetDoubleRate);
  const effectResetTripleRate = await getEffectResetTripleRateDb();
  setEffectResetTripleRate(effectResetTripleRate);
  const effectResetQuadrupleRate = await getEffectResetQuadrupleRateDb();
  setEffectResetQuadrupleRate(effectResetQuadrupleRate);
  const effectResetQuintupleRate = await getEffectResetQuintupleRateDb();
  setEffectResetQuintupleRate(effectResetQuintupleRate);

  // 加载特效装备掉落配置
  const effectDropSingleChance = await getEffectDropSingleChanceDb();
  setEffectDropSingleChance(effectDropSingleChance);
  const effectDropDoubleChance = await getEffectDropDoubleChanceDb();
  setEffectDropDoubleChance(effectDropDoubleChance);
  const equipSkillDropChance = await getEquipSkillDropChanceDb();
  setEquipSkillDropChance(equipSkillDropChance);
  getRealmIds().forEach((realmId) => {
    checkMobRespawn(realmId);
  });
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
  tickCrossRankEvent();
  setInterval(() => {
    tickCrossRankEvent();
  }, 10000);
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
