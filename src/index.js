import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile, unlink, stat } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import crypto from 'node:crypto';
import cron from 'node-cron';
import { setupConsoleColors } from './log/console_colors.js';

setupConsoleColors();

import config from './config.js';
import { validatePlayerName } from './game/validator.js';
import knex from './db/index.js';
import { createUser, verifyUser, createSession, getSession, getUserByName, setAdminFlag, verifyUserPassword, updateUserPassword, clearUserSessions, clearRealmSessions, getUserByEmail, createPasswordResetToken, getPasswordResetToken, markPasswordResetTokenUsed } from './db/users.js';
import { listCharacters, loadCharacter, saveCharacter, findCharacterByName, findCharacterByNameInRealm, listAllCharacters, deleteCharacter, restoreDeletedCharacter } from './db/characters.js';
import { addGuildMember, createGuild, getGuildByName, getGuildByNameInRealm, getGuildById, getGuildMember, getSabakOwner, isGuildLeader, isGuildLeaderOrVice, setGuildMemberRole, listGuildMembers, listSabakRegistrations, registerSabak, hasSabakRegistrationToday, hasAnySabakRegistrationToday, removeGuildMember, leaveGuild, setSabakOwner, clearSabakRegistrations, transferGuildLeader, ensureSabakState, applyToGuild, listGuildApplications, removeGuildApplication, approveGuildApplication, getApplicationByUser, listAllGuilds } from './db/guilds.js';
import { getGuildBuildingInfo, addGuildBuildingContribution, buildGuildBuildingPayload, startGuildBuildingUpgrade, getGuildBuildingConfigSnapshot, loadGuildBuildingConfig, setGuildBuildingConfig } from './db/guild_building.js';
import { createAdminSession, listUsers, verifyAdminSession, deleteUser } from './db/admin.js';
import { sendMail, listMail, listSentMail, markMailRead, markMailClaimed, deleteMail } from './db/mail.js';
import { createVipCodes, listVipCodes, countVipCodes, useVipCode } from './db/vip.js';
import { createRechargeCards, listRechargeCards, countRechargeCards, useRechargeCard, listUsedRechargeCharacters } from './db/recharge.js';
import { getSetting, setSetting, getVipSelfClaimEnabled, setVipSelfClaimEnabled, getVipClaimLimitEnabled, setVipClaimLimitEnabled, getSvipPrices, setSvipPrices, getLootLogEnabled, setLootLogEnabled, getCrossWorldBossRespawnAt, setCrossWorldBossRespawnAt, getStateThrottleEnabled, setStateThrottleEnabled, getStateThrottleIntervalSec, setStateThrottleIntervalSec, getStateThrottleOverrideServerAllowed, setStateThrottleOverrideServerAllowed, getCacheMonsterHealthEnabled, setCacheMonsterHealthEnabled, getRoomVariantCount, setRoomVariantCount, getSabakStartHour, setSabakStartHour, getSabakStartMinute, setSabakStartMinute, getSabakDurationMinutes, setSabakDurationMinutes, getSabakSiegeMinutes, setSabakSiegeMinutes, getCrossRankStartHour, setCrossRankStartHour, getCrossRankStartMinute, setCrossRankStartMinute, getCrossRankDurationMinutes, setCrossRankDurationMinutes, canUserClaimVip, incrementCharacterVipClaimCount, getWorldBossKillCount, setWorldBossKillCount, getSpecialBossKillCount, setSpecialBossKillCount, getCultivationBossKillCount, setCultivationBossKillCount, getWorldBossDropBonus, setWorldBossDropBonus, getWorldBossBaseHp, setWorldBossBaseHp, getWorldBossBaseAtk, setWorldBossBaseAtk, getWorldBossBaseDef, setWorldBossBaseDef, getWorldBossBaseMdef, setWorldBossBaseMdef, getWorldBossBaseExp, setWorldBossBaseExp, getWorldBossBaseGold, setWorldBossBaseGold, getWorldBossRespawnMinutes, setWorldBossRespawnMinutes, getWorldBossPlayerBonusConfig, setWorldBossPlayerBonusConfig, getClassLevelBonusConfig, setClassLevelBonusConfig, getSpecialBossDropBonus, setSpecialBossDropBonus, getSpecialBossBaseHp, setSpecialBossBaseHp, getSpecialBossBaseAtk, setSpecialBossBaseAtk, getSpecialBossBaseDef, setSpecialBossBaseDef, getSpecialBossBaseMdef, setSpecialBossBaseMdef, getSpecialBossBaseExp, setSpecialBossBaseExp, getSpecialBossBaseGold, setSpecialBossBaseGold, getSpecialBossRespawnMinutes, setSpecialBossRespawnMinutes, getSpecialBossPlayerBonusConfig, setSpecialBossPlayerBonusConfig, getCultivationBossDropBonus, setCultivationBossDropBonus, getCultivationBossPlayerBonusConfig, setCultivationBossPlayerBonusConfig, getCultivationBossBaseHp, setCultivationBossBaseHp, getCultivationBossBaseAtk, setCultivationBossBaseAtk, getCultivationBossBaseDef, setCultivationBossBaseDef, getCultivationBossBaseMdef, setCultivationBossBaseMdef, getCultivationBossBaseExp, setCultivationBossBaseExp, getCultivationBossBaseGold, setCultivationBossBaseGold, getCultivationBossRespawnMinutes, setCultivationBossRespawnMinutes, getTrainingFruitCoefficient as getTrainingFruitCoefficientDb, setTrainingFruitCoefficient as setTrainingFruitCoefficientDb, getTrainingFruitDropRate as getTrainingFruitDropRateDb, setTrainingFruitDropRate as setTrainingFruitDropRateDb, getPetTrainingFruitDropRate as getPetTrainingFruitDropRateDb, setPetTrainingFruitDropRate as setPetTrainingFruitDropRateDb, getTrainingPerLevelConfig as getTrainingPerLevelConfigDb, setTrainingPerLevelConfig as setTrainingPerLevelConfigDb, getRefineBaseSuccessRate as getRefineBaseSuccessRateDb, setRefineBaseSuccessRate as setRefineBaseSuccessRateDb, getRefineDecayRate as getRefineDecayRateDb, setRefineDecayRate as setRefineDecayRateDb, getRefineMaterialCount as getRefineMaterialCountDb, setRefineMaterialCount as setRefineMaterialCountDb, getRefineBonusPerLevel as getRefineBonusPerLevelDb, setRefineBonusPerLevel as setRefineBonusPerLevelDb, getEffectResetSuccessRate as getEffectResetSuccessRateDb, setEffectResetSuccessRate as setEffectResetSuccessRateDb, getEffectResetDoubleRate as getEffectResetDoubleRateDb, setEffectResetDoubleRate as setEffectResetDoubleRateDb, getEffectResetTripleRate as getEffectResetTripleRateDb, setEffectResetTripleRate as setEffectResetTripleRateDb, getEffectResetQuadrupleRate as getEffectResetQuadrupleRateDb, setEffectResetQuadrupleRate as setEffectResetQuadrupleRateDb, getEffectResetQuintupleRate as getEffectResetQuintupleRateDb, setEffectResetQuintupleRate as setEffectResetQuintupleRateDb, getPetSettings, setPetSettings, getEffectDropSingleChance as getEffectDropSingleChanceDb, setEffectDropSingleChance as setEffectDropSingleChanceDb, getEffectDropDoubleChance as getEffectDropDoubleChanceDb, setEffectDropDoubleChance as setEffectDropDoubleChanceDb, getEquipSkillDropChance as getEquipSkillDropChanceDb, setEquipSkillDropChance as setEquipSkillDropChanceDb, getTreasureSlotCount as getTreasureSlotCountDb, setTreasureSlotCount as setTreasureSlotCountDb, getTreasureMaxLevel as getTreasureMaxLevelDb, setTreasureMaxLevel as setTreasureMaxLevelDb, getTreasureUpgradeConsume as getTreasureUpgradeConsumeDb, setTreasureUpgradeConsume as setTreasureUpgradeConsumeDb, getTreasureAdvanceConsume as getTreasureAdvanceConsumeDb, setTreasureAdvanceConsume as setTreasureAdvanceConsumeDb, getTreasureAdvancePerStage as getTreasureAdvancePerStageDb, setTreasureAdvancePerStage as setTreasureAdvancePerStageDb, getTreasureAdvanceEffectBonusPerStack as getTreasureAdvanceEffectBonusPerStackDb, setTreasureAdvanceEffectBonusPerStack as setTreasureAdvanceEffectBonusPerStackDb, getTreasureWorldBossDropMultiplier as getTreasureWorldBossDropMultiplierDb, setTreasureWorldBossDropMultiplier as setTreasureWorldBossDropMultiplierDb, getTreasureCrossWorldBossDropMultiplier as getTreasureCrossWorldBossDropMultiplierDb, setTreasureCrossWorldBossDropMultiplier as setTreasureCrossWorldBossDropMultiplierDb, getTreasureTowerXuanmingDropChance as getTreasureTowerXuanmingDropChanceDb, setTreasureTowerXuanmingDropChance as setTreasureTowerXuanmingDropChanceDb, getCmdRateLimits, setCmdRateLimits, getCmdCooldowns, setCmdCooldowns, getUltimateGrowthConfig as getUltimateGrowthConfigDb, setUltimateGrowthConfig as setUltimateGrowthConfigDb } from './db/settings.js';
import { listRealms, getRealmById, updateRealmName, createRealm } from './db/realms.js';
import {
  listMobRespawnsPage,
  upsertMobRespawn,
  clearMobRespawn,
  saveMobState,
  clearInvalidCrossWorldBossRespawns,
  cleanupExpiredMobRespawnsBatch,
  batchUpsertMobRespawns,
  batchClearMobRespawns
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
  exportAllItems as exportAllItemsDb,
  syncItemsToTemplates,
  syncMobDropsToTemplates
} from './db/items_admin.js';
import { runMigrations } from './db/migrate.js';
import { getSmtpSettings, saveSmtpSettings, testSmtpConnection, sendPasswordResetEmail } from './db/smtp.js';
import { newCharacter, computeDerived, gainExp, addItem, removeItem, getItemKey, normalizeInventory, normalizeEquipment, getDurabilityMax, getRepairCost, buildSpecializationPayload, SPECIALIZATION_DEFS } from './game/player.js';
import {
  handleCommand,
  awardKill,
  summonStats,
  isBoundHighTierEquipment,
  getHighTierRecycleStatePayload,
  getEquipmentRecycleExchangeConfig,
  setEquipmentRecycleExchangeConfig
} from './game/commands.js';
import {
  getActivityStatePayload,
  spendActivityPoints,
  getMobRewardActivityBonus,
  recordBossKillActivities,
  recordTreasurePetFestivalActivity,
  recordHarvestOnlineMinute,
  claimActivityRewardsByMail,
  claimHarvestBlessing,
  claimHarvestSupplyByMail,
  claimHarvestTimedChestByMail,
  claimCommissionTask,
  normalizeHarvestSeasonRewardConfig,
  setHarvestSeasonRewardConfig,
  normalizeHarvestSeasonSignConfig,
  setHarvestSeasonSignConfig,
  getChinaDateParts,
  formatPrevDateKey,
  formatPrevWeekKey,
  getActivityLeaderboardsByPeriod,
  buildActivitySettlementRewards,
  getHarvestBlessingMultipliers
} from './game/activity.js';
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
import { WORLD, expandRoomVariants, shrinkRoomVariants, ensureZhuxianTowerRoom, ensurePersonalBossRoom } from './game/world.js';
import { getRoomMobs, getAliveMobs, spawnMobs, removeMob, seedRespawnCache, appendRespawnCache, setRespawnStore, getAllAliveMobs, incrementWorldBossKills, setWorldBossKillCount as setWorldBossKillCountState, incrementSpecialBossKills, setSpecialBossKillCount as setSpecialBossKillCountState, incrementCultivationBossKills, setCultivationBossKillCount as setCultivationBossKillCountState } from './game/state.js';
import { calcHitChance, calcDamage, applyDamage, applyHealing, applyPoison, tickStatus, getDefenseMultiplier, consumeFirestrikeCrit } from './game/combat.js';
import { randInt, clamp } from './game/utils.js';
import { expForLevel, ROOM_VARIANT_COUNT, setRoomVariantCount as applyRoomVariantCount } from './game/constants.js';
import {
  setAllClassLevelBonusConfigs,
  setClassLevelBonusConfig as setClassLevelBonusConfigMem,
  getTrainingFruitDropRate,
  getPetTrainingFruitDropRate,
  getTrainingPerLevelConfig,
  setTrainingFruitCoefficient,
  setTrainingFruitDropRate as setTrainingFruitDropRateConfig,
  setPetTrainingFruitDropRate as setPetTrainingFruitDropRateConfig,
  setTrainingPerLevelConfig as setTrainingPerLevelConfigMem,
  getUltimateGrowthConfig as getUltimateGrowthConfigMem,
  setUltimateGrowthConfig as setUltimateGrowthConfigMem
} from './game/settings.js';
import {
  isTreasureItemId,
  TREASURE_SLOT_COUNT,
  TREASURE_MAX_LEVEL,
  TREASURE_UPGRADE_CONSUME,
  TREASURE_EXP_ITEM_ID,
  TREASURE_ADVANCE_CONSUME,
  TREASURE_ADVANCE_PER_STAGE,
  TREASURE_ADVANCE_EFFECT_BONUS_PER_STACK,
  TREASURE_WORLD_BOSS_DROP_MULTIPLIER,
  TREASURE_CROSS_WORLD_BOSS_DROP_MULTIPLIER,
  TREASURE_TOWER_XUANMING_DROP_CHANCE,
  normalizeTreasureState,
  getTreasureDef,
  getTreasureAutoPassiveDef,
  getTreasureLevel,
  getTreasureAdvanceCount,
  getTreasureStageByAdvanceCount,
  getTreasureRandomAttrById,
  setTreasureSlotCount,
  setTreasureMaxLevel,
  setTreasureUpgradeConsume,
  setTreasureAdvanceConsume,
  setTreasureAdvancePerStage,
  setTreasureAdvanceEffectBonusPerStack,
  setTreasureWorldBossDropMultiplier,
  setTreasureCrossWorldBossDropMultiplier,
  setTreasureTowerXuanmingDropChance
} from './game/treasure.js';

const ACTIVITY_POINT_SHOP_SETTING_KEY = 'activity_point_shop_config_v2';
const DIVINE_BEAST_FRAGMENT_EXCHANGE_SETTING_KEY = 'divine_beast_fragment_exchange_config_v1';
const EQUIPMENT_RECYCLE_SETTING_KEY = 'equipment_recycle_config_v1';
const HARVEST_SEASON_REWARD_SETTING_KEY = 'harvest_season_reward_config_v1';
const HARVEST_SEASON_SIGN_SETTING_KEY = 'harvest_season_sign_config_v1';
const FIRST_RECHARGE_WELFARE_SETTING_KEY = 'first_recharge_welfare_config_v1';
const INVITE_REWARD_SETTING_KEY = 'invite_reward_config_v1';
const GUILD_SYSTEM_SETTING_KEY = 'guild_system_config_v1';
const ROUTE_LINES_SETTING_KEY = 'route_lines_config_v1';
const INVITE_RECHARGE_BONUS_RATE = 0.2;

async function autoClaimActivityRewardsForPlayer(player, now = Date.now()) {
  if (!player || !player.userId) return;
  if (!player.flags) player.flags = {};
  const lastAt = Math.max(0, Math.floor(Number(player.flags.activityAutoClaimAt || 0)));
  if ((now - lastAt) < 10000) return;
  player.flags.activityAutoClaimAt = now;
  try {
    const blessResult = claimHarvestBlessing(player, { now });
    if (blessResult?.ok) {
      player.forceStateRefresh = true;
    }
    const supplyResult = await claimHarvestSupplyByMail(player, {
      sendMail,
      realmId: player.realmId || 1,
      now
    });
    if (supplyResult?.ok) {
      player.forceStateRefresh = true;
    }
    const chestResult = await claimHarvestTimedChestByMail(player, {
      sendMail,
      realmId: player.realmId || 1,
      now
    });
    if (chestResult?.ok) {
      player.forceStateRefresh = true;
    }
    const result = await claimActivityRewardsByMail(player, {
      sendMail,
      realmId: player.realmId || 1,
      now
    });
    if (result?.ok && Number(result?.sent || 0) > 0) {
      player.forceStateRefresh = true;
    }
  } catch (_) {
    // 自动补发失败时静默跳过，下次轮询重试
  }
}

const DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG = Object.freeze({
  enabled: true,
  grantDivineBeast: true,
  yuanbao: 0,
  gold: 200000000,
  items: [
    { id: 'training_fruit', qty: 200 },
    { id: 'pet_training_fruit', qty: 200 },
    { id: TREASURE_EXP_ITEM_ID, qty: 200 }
  ]
});
let FIRST_RECHARGE_WELFARE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG));
const DEFAULT_INVITE_REWARD_CONFIG = Object.freeze({
  enabled: true,
  bonusRate: INVITE_RECHARGE_BONUS_RATE
});
let INVITE_REWARD_CONFIG = { ...DEFAULT_INVITE_REWARD_CONFIG };
const DEFAULT_GUILD_SYSTEM_CONFIG = Object.freeze({
  donateLimits: {
    gold: 5,
    points: 3
  },
  donateCost: {
    gold: 100000,
    points: 50
  },
  contributionGain: {
    gold: 10,
    points: 50
  },
  shopItems: [
    { id: 'training_fruit', name: '修炼果', qty: 5, cost: 50 },
    { id: 'pet_training_fruit', name: '宠物修炼果', qty: 5, cost: 50 },
    { id: 'treasure_exp_material', name: '法宝经验丹', qty: 10, cost: 80 },
    { id: 'ultimate_growth_stone', name: '装备成长石', qty: 5, cost: 120 },
    { id: 'ultimate_growth_break', name: '成长突破石', qty: 3, cost: 240 }
  ]
});
let GUILD_SYSTEM_CONFIG = JSON.parse(JSON.stringify(DEFAULT_GUILD_SYSTEM_CONFIG));
const DEFAULT_ROUTE_LINES_CONFIG = Object.freeze([
  {
    id: 'default',
    name: '默认线路',
    apiBase: '',
    socketBase: '',
    enabled: true,
    priority: 100
  }
]);
let ROUTE_LINES_CONFIG = JSON.parse(JSON.stringify(DEFAULT_ROUTE_LINES_CONFIG));

function normalizeRouteBaseUrl(raw) {
  const text = String(raw ?? '').trim();
  if (!text || text === '/') return '';
  return text.replace(/\/+$/g, '');
}

function normalizeRouteLineEntry(raw, index = 0) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const fallbackId = `line_${index + 1}`;
  const id = String(source.id || fallbackId)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 24) || fallbackId;
  const name = String(source.name || `线路${index + 1}`).trim().slice(0, 32) || `线路${index + 1}`;
  const domain = normalizeRouteBaseUrl(source.domain);
  const apiBase = normalizeRouteBaseUrl(source.apiBase || domain);
  const socketBase = normalizeRouteBaseUrl(source.socketBase || source.apiBase || domain);
  const enabled = source.enabled !== false;
  const priority = Math.max(1, Math.min(9999, Math.floor(Number(source.priority ?? 100) || 100)));
  return {
    id,
    name,
    domain: domain || apiBase,
    apiBase,
    socketBase,
    enabled,
    priority
  };
}

function normalizeRouteLinesConfig(raw) {
  const list = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.lines) ? raw.lines : []);
  const seen = new Set();
  const normalized = list
    .map((entry, index) => normalizeRouteLineEntry(entry, index))
    .filter((entry) => {
      if (!entry.id) return false;
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .slice(0, 32);
  if (normalized.length > 0) return normalized;
  return DEFAULT_ROUTE_LINES_CONFIG.map((entry) => ({ ...entry }));
}

function getRouteLinesConfigSnapshot() {
  return normalizeRouteLinesConfig(ROUTE_LINES_CONFIG)
    .slice()
    .sort((a, b) => (a.priority - b.priority) || String(a.id).localeCompare(String(b.id)));
}

function getPublicRouteLinesSnapshot() {
  return getRouteLinesConfigSnapshot().filter((line) => line.enabled !== false);
}

async function loadRouteLinesConfig() {
  try {
    const raw = await getSetting(ROUTE_LINES_SETTING_KEY, '');
    if (!raw) {
      ROUTE_LINES_CONFIG = normalizeRouteLinesConfig(DEFAULT_ROUTE_LINES_CONFIG);
      return ROUTE_LINES_CONFIG;
    }
    ROUTE_LINES_CONFIG = normalizeRouteLinesConfig(JSON.parse(raw));
  } catch (err) {
    console.warn('线路配置加载失败，使用默认值:', err?.message || err);
    ROUTE_LINES_CONFIG = normalizeRouteLinesConfig(DEFAULT_ROUTE_LINES_CONFIG);
  }
  return ROUTE_LINES_CONFIG;
}

async function setRouteLinesConfig(raw) {
  const normalized = normalizeRouteLinesConfig(raw);
  await setSetting(ROUTE_LINES_SETTING_KEY, JSON.stringify(normalized));
  ROUTE_LINES_CONFIG = normalized;
  return normalized;
}

function normalizeFirstRechargeWelfareConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const hasCustomItems = Array.isArray(source.items);
  const rawItems = hasCustomItems ? source.items : DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG.items;
  const items = rawItems
    .map((entry) => ({
      id: String(entry?.id || '').trim(),
      qty: Math.max(0, Math.floor(Number(entry?.qty || 0)))
    }))
    .filter((entry) => entry.id && entry.qty > 0);
  return {
    enabled: source.enabled !== false,
    grantDivineBeast: source.grantDivineBeast !== false,
    yuanbao: Math.max(0, Math.floor(Number(source.yuanbao ?? DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG.yuanbao) || 0)),
    gold: Math.max(0, Math.floor(Number(source.gold ?? DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG.gold) || 0)),
    items: hasCustomItems ? items : DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG.items.map((it) => ({ ...it }))
  };
}

function getFirstRechargeWelfareConfigSnapshot() {
  return {
    enabled: FIRST_RECHARGE_WELFARE_CONFIG.enabled !== false,
    grantDivineBeast: FIRST_RECHARGE_WELFARE_CONFIG.grantDivineBeast !== false,
    yuanbao: Math.max(0, Math.floor(Number(FIRST_RECHARGE_WELFARE_CONFIG.yuanbao || 0))),
    gold: Math.max(0, Math.floor(Number(FIRST_RECHARGE_WELFARE_CONFIG.gold || 0))),
    items: Array.isArray(FIRST_RECHARGE_WELFARE_CONFIG.items)
      ? FIRST_RECHARGE_WELFARE_CONFIG.items.map((it) => ({ id: String(it.id || '').trim(), qty: Math.max(0, Math.floor(Number(it.qty || 0))) })).filter((it) => it.id && it.qty > 0)
      : []
  };
}

async function loadFirstRechargeWelfareConfig() {
  try {
    const raw = await getSetting(FIRST_RECHARGE_WELFARE_SETTING_KEY, '');
    if (!raw) {
      FIRST_RECHARGE_WELFARE_CONFIG = normalizeFirstRechargeWelfareConfig(DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG);
      return FIRST_RECHARGE_WELFARE_CONFIG;
    }
    const parsed = JSON.parse(raw);
    FIRST_RECHARGE_WELFARE_CONFIG = normalizeFirstRechargeWelfareConfig(parsed);
  } catch (err) {
    console.warn('首充福利配置加载失败，使用默认值:', err?.message || err);
    FIRST_RECHARGE_WELFARE_CONFIG = normalizeFirstRechargeWelfareConfig(DEFAULT_FIRST_RECHARGE_WELFARE_CONFIG);
  }
  return FIRST_RECHARGE_WELFARE_CONFIG;
}

async function setFirstRechargeWelfareConfig(raw) {
  const normalized = normalizeFirstRechargeWelfareConfig(raw);
  await setSetting(FIRST_RECHARGE_WELFARE_SETTING_KEY, JSON.stringify(normalized));
  FIRST_RECHARGE_WELFARE_CONFIG = normalized;
  return normalized;
}

function normalizeInviteRewardConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const parsedRate = Number(source.bonusRate ?? DEFAULT_INVITE_REWARD_CONFIG.bonusRate);
  const bonusRate = Number.isFinite(parsedRate) ? Math.max(0, Math.min(1, parsedRate)) : DEFAULT_INVITE_REWARD_CONFIG.bonusRate;
  return {
    enabled: source.enabled !== false,
    bonusRate
  };
}

function getInviteRewardConfigSnapshot() {
  return {
    enabled: INVITE_REWARD_CONFIG.enabled !== false,
    bonusRate: Math.max(0, Math.min(1, Number(INVITE_REWARD_CONFIG.bonusRate ?? DEFAULT_INVITE_REWARD_CONFIG.bonusRate) || 0))
  };
}

async function loadInviteRewardConfig() {
  try {
    const raw = await getSetting(INVITE_REWARD_SETTING_KEY, '');
    if (!raw) {
      INVITE_REWARD_CONFIG = normalizeInviteRewardConfig(DEFAULT_INVITE_REWARD_CONFIG);
      return INVITE_REWARD_CONFIG;
    }
    INVITE_REWARD_CONFIG = normalizeInviteRewardConfig(JSON.parse(raw));
  } catch (err) {
    console.warn('邀请返利配置加载失败，使用默认值:', err?.message || err);
    INVITE_REWARD_CONFIG = normalizeInviteRewardConfig(DEFAULT_INVITE_REWARD_CONFIG);
  }
  return INVITE_REWARD_CONFIG;
}

async function setInviteRewardConfig(raw) {
  const normalized = normalizeInviteRewardConfig(raw);
  await setSetting(INVITE_REWARD_SETTING_KEY, JSON.stringify(normalized));
  INVITE_REWARD_CONFIG = normalized;
  return normalized;
}

function normalizeGuildSystemConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const toInt = (value, fallback, min = 0) => {
    const num = Number(value ?? fallback);
    if (!Number.isFinite(num)) return Math.max(min, Math.floor(Number(fallback || 0)));
    return Math.max(min, Math.floor(num));
  };
  const donateLimits = {
    gold: toInt(source?.donateLimits?.gold, DEFAULT_GUILD_SYSTEM_CONFIG.donateLimits.gold, 0),
    points: toInt(source?.donateLimits?.points, DEFAULT_GUILD_SYSTEM_CONFIG.donateLimits.points, 0)
  };
  const donateCost = {
    gold: toInt(source?.donateCost?.gold, DEFAULT_GUILD_SYSTEM_CONFIG.donateCost.gold, 0),
    points: toInt(source?.donateCost?.points, DEFAULT_GUILD_SYSTEM_CONFIG.donateCost.points, 0)
  };
  const contributionGain = {
    gold: toInt(source?.contributionGain?.gold, DEFAULT_GUILD_SYSTEM_CONFIG.contributionGain.gold, 0),
    points: toInt(source?.contributionGain?.points, DEFAULT_GUILD_SYSTEM_CONFIG.contributionGain.points, 0)
  };
  const rawShopItems = Array.isArray(source?.shopItems) ? source.shopItems : DEFAULT_GUILD_SYSTEM_CONFIG.shopItems;
  const seenShopItemIds = new Set();
  const shopItems = rawShopItems
    .map((entry) => {
      const id = String(entry?.id || '').trim();
      if (!id || !ITEM_TEMPLATES[id]) return null;
      if (seenShopItemIds.has(id)) return null;
      seenShopItemIds.add(id);
      const tpl = ITEM_TEMPLATES[id] || {};
      return {
        id,
        name: String(entry?.name || tpl.name || id).trim() || id,
        qty: toInt(entry?.qty, 1, 1),
        cost: toInt(entry?.cost, 1, 1)
      };
    })
    .filter(Boolean);
  return {
    donateLimits,
    donateCost,
    contributionGain,
    shopItems: shopItems.length
      ? shopItems
      : DEFAULT_GUILD_SYSTEM_CONFIG.shopItems.map((item) => ({ ...item }))
  };
}

function getGuildSystemConfigSnapshot() {
  return normalizeGuildSystemConfig(GUILD_SYSTEM_CONFIG);
}

async function loadGuildSystemConfig() {
  try {
    const raw = await getSetting(GUILD_SYSTEM_SETTING_KEY, '');
    if (!raw) {
      GUILD_SYSTEM_CONFIG = normalizeGuildSystemConfig(DEFAULT_GUILD_SYSTEM_CONFIG);
      return GUILD_SYSTEM_CONFIG;
    }
    GUILD_SYSTEM_CONFIG = normalizeGuildSystemConfig(JSON.parse(raw));
  } catch (err) {
    console.warn('行会系统配置加载失败，使用默认值:', err?.message || err);
    GUILD_SYSTEM_CONFIG = normalizeGuildSystemConfig(DEFAULT_GUILD_SYSTEM_CONFIG);
  }
  return GUILD_SYSTEM_CONFIG;
}

async function setGuildSystemConfig(raw) {
  const normalized = normalizeGuildSystemConfig(raw);
  await setSetting(GUILD_SYSTEM_SETTING_KEY, JSON.stringify(normalized));
  GUILD_SYSTEM_CONFIG = normalized;
  return normalized;
}

function firstRechargeRewardMarkerKey(userId) {
  return `first_recharge_reward_marked_user_${Math.max(0, Math.floor(Number(userId) || 0))}`;
}

function firstRechargeRewardRealmMarkerKey(userId, realmId = 1) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  return `first_recharge_reward_marked_user_${uid}_realm_${rid}`;
}

function firstRechargeReissueCharacterMarkerKey(userId, charName, realmId = 1) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  return `first_recharge_reissue_marked_char_${uid}_${rid}_${name}`;
}

function divineBeastReissueCharacterMarkerKey(userId, charName, realmId = 1) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  return `divine_beast_reissue_marked_char_${uid}_${rid}_${name}`;
}

function buildInviteCode(userId) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return '';
  return `I${uid.toString(36).toUpperCase()}`;
}

function parseInviteCode(raw) {
  const code = String(raw || '').trim().toUpperCase();
  if (!code) return 0;
  const normalized = code.startsWith('I') ? code.slice(1) : code;
  if (!/^[0-9A-Z]+$/.test(normalized)) return 0;
  const parsed = Number.parseInt(normalized, 36);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function inviteBindingKey(userId) {
  return `invite_binding_user_${Math.max(0, Math.floor(Number(userId) || 0))}`;
}

function inviteFirstRechargeProcessedKey(userId) {
  return `invite_first_recharge_bonus_processed_user_${Math.max(0, Math.floor(Number(userId) || 0))}`;
}

function inviteRebateIssuedKeyByInviteeUser(userId) {
  return `invite_rebate_issued_invitee_user_${Math.max(0, Math.floor(Number(userId) || 0))}`;
}

async function getInviteBindingByUserId(userId) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return null;
  const raw = await getSetting(inviteBindingKey(uid), '');
  if (!String(raw || '').trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    const inviterUserId = Math.max(0, Math.floor(Number(parsed?.inviterUserId || 0)));
    if (!inviterUserId) return null;
    return {
      inviterUserId,
      inviterUsername: String(parsed?.inviterUsername || ''),
      inviteCode: String(parsed?.inviteCode || ''),
      at: Number(parsed?.at || 0) || 0
    };
  } catch {
    return null;
  }
}

async function bindInviteForUser(userId, inviterUserId, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const inviterUid = Math.max(0, Math.floor(Number(inviterUserId) || 0));
  if (!uid || !inviterUid || uid === inviterUid) return false;
  const exists = await getInviteBindingByUserId(uid);
  if (exists) return false;
  const data = {
    at: Date.now(),
    inviterUserId: inviterUid,
    inviterUsername: String(payload?.inviterUsername || ''),
    inviteCode: String(payload?.inviteCode || buildInviteCode(inviterUid)),
    source: String(payload?.source || 'register')
  };
  await setSetting(inviteBindingKey(uid), JSON.stringify(data));
  return true;
}

async function hasInviteFirstRechargeProcessed(userId) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return false;
  const raw = await getSetting(inviteFirstRechargeProcessedKey(uid), '');
  return Boolean(String(raw || '').trim());
}

async function getInviteFirstRechargeProcessedRecord(userId) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return null;
  const raw = await getSetting(inviteFirstRechargeProcessedKey(uid), '');
  if (!String(raw || '').trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      at: Math.max(0, Math.floor(Number(parsed?.at || 0))),
      inviterUserId: Math.max(0, Math.floor(Number(parsed?.inviterUserId || 0))),
      inviteeCharName: String(parsed?.inviteeCharName || ''),
      sourceAmount: Math.max(0, Math.floor(Number(parsed?.sourceAmount || 0))),
      bonusYuanbao: Math.max(0, Math.floor(Number(parsed?.bonusYuanbao || 0))),
      rebateYuanbao: Math.max(0, Math.floor(Number(parsed?.rebateYuanbao || 0)))
    };
  } catch {
    return null;
  }
}

async function markInviteFirstRechargeProcessed(userId, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return false;
  const data = {
    at: Date.now(),
    inviterUserId: Math.max(0, Math.floor(Number(payload?.inviterUserId || 0))),
    inviteeCharName: String(payload?.inviteeCharName || ''),
    sourceAmount: Math.max(0, Math.floor(Number(payload?.sourceAmount || 0))),
    bonusYuanbao: Math.max(0, Math.floor(Number(payload?.bonusYuanbao || 0))),
    rebateYuanbao: Math.max(0, Math.floor(Number(payload?.rebateYuanbao || 0)))
  };
  await setSetting(inviteFirstRechargeProcessedKey(uid), JSON.stringify(data));
  return true;
}

async function hasInviteRebateIssuedForInvitee(userId) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return false;
  const raw = await getSetting(inviteRebateIssuedKeyByInviteeUser(uid), '');
  return Boolean(String(raw || '').trim());
}

async function markInviteRebateIssuedForInvitee(userId, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return false;
  const data = {
    at: Date.now(),
    source: String(payload?.source || 'unknown'),
    operator: String(payload?.operator || ''),
    inviterUserId: Math.max(0, Math.floor(Number(payload?.inviterUserId || 0))),
    inviteeCharName: String(payload?.inviteeCharName || ''),
    rebateYuanbao: Math.max(0, Math.floor(Number(payload?.rebateYuanbao || 0))),
    targetName: String(payload?.targetName || ''),
    realmId: Math.max(0, Math.floor(Number(payload?.realmId || 0)))
  };
  await setSetting(inviteRebateIssuedKeyByInviteeUser(uid), JSON.stringify(data));
  return true;
}

async function getInviteStatsByInviterUserId(inviterUserId) {
  const inviterUid = Math.max(0, Math.floor(Number(inviterUserId) || 0));
  if (!inviterUid) {
    return { invitedUsers: 0, firstRechargeUsers: 0, totalRebateYuanbao: 0, recentFirstRecharge: [] };
  }
  const bindingRows = await knex('game_settings')
    .where('key', 'like', 'invite_binding_user_%')
    .select('key', 'value');
  let invitedUsers = 0;
  for (const row of bindingRows) {
    try {
      const parsed = JSON.parse(row?.value || '{}');
      const uid = Math.max(0, Math.floor(Number(parsed?.inviterUserId || 0)));
      if (uid === inviterUid) invitedUsers += 1;
    } catch {
      // ignore invalid row
    }
  }

  const processedRows = await knex('game_settings')
    .where('key', 'like', 'invite_first_recharge_bonus_processed_user_%')
    .select('key', 'value');
  let firstRechargeUsers = 0;
  let totalRebateYuanbao = 0;
  const recentFirstRecharge = [];
  for (const row of processedRows) {
    try {
      const parsed = JSON.parse(row?.value || '{}');
      const uid = Math.max(0, Math.floor(Number(parsed?.inviterUserId || 0)));
      if (uid !== inviterUid) continue;
      firstRechargeUsers += 1;
      totalRebateYuanbao += Math.max(0, Math.floor(Number(parsed?.rebateYuanbao || 0)));
      recentFirstRecharge.push({
        inviteeCharName: String(parsed?.inviteeCharName || ''),
        sourceAmount: Math.max(0, Math.floor(Number(parsed?.sourceAmount || 0))),
        rebateYuanbao: Math.max(0, Math.floor(Number(parsed?.rebateYuanbao || 0))),
        bonusYuanbao: Math.max(0, Math.floor(Number(parsed?.bonusYuanbao || 0))),
        at: Math.max(0, Math.floor(Number(parsed?.at || 0)))
      });
    } catch {
      // ignore invalid row
    }
  }
  recentFirstRecharge.sort((a, b) => (b.at || 0) - (a.at || 0));
  return {
    invitedUsers,
    firstRechargeUsers,
    totalRebateYuanbao,
    recentFirstRecharge: recentFirstRecharge.slice(0, 10)
  };
}

async function grantInviteRebateYuanbao(inviterUserId, amount, payload = {}) {
  const inviterUid = Math.max(0, Math.floor(Number(inviterUserId) || 0));
  const rebateAmount = Math.max(0, Math.floor(Number(amount || 0)));
  if (!inviterUid || rebateAmount <= 0) return { ok: false, reason: 'invalid' };

  const onlineTargets = Array.from(players.values()).filter((p) => p && Number(p.userId || 0) === inviterUid);
  const preferredRealmId = Math.max(1, Math.floor(Number(payload?.preferredRealmId || 1) || 1));
  const onlineTarget = onlineTargets.find((p) => (p.realmId || 1) === preferredRealmId) || onlineTargets[0];
  if (onlineTarget) {
    onlineTarget.yuanbao = Math.max(0, Math.floor(Number(onlineTarget.yuanbao || 0))) + rebateAmount;
    onlineTarget.forceStateRefresh = true;
    onlineTarget.send(`邀请返利到账：元宝+${rebateAmount}（被邀请玩家首次充值返利）`);
    return { ok: true, targetName: onlineTarget.name, realmId: onlineTarget.realmId || preferredRealmId, online: true, amount: rebateAmount };
  }

  const row = await knex('characters')
    .where({ user_id: inviterUid })
    .orderByRaw('CASE WHEN realm_id = ? THEN 0 ELSE 1 END', [preferredRealmId])
    .orderBy('updated_at', 'desc')
    .orderBy('id', 'desc')
    .first();
  if (!row) return { ok: false, reason: 'no_character' };

  const stored = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
  if (!stored) return { ok: false, reason: 'load_failed' };
  stored.yuanbao = Math.max(0, Math.floor(Number(stored.yuanbao || 0))) + rebateAmount;
  await saveCharacter(row.user_id, stored, row.realm_id || 1);
  return { ok: true, targetName: row.name, realmId: row.realm_id || 1, online: false, amount: rebateAmount };
}

async function hasFirstRechargeRewardMarker(userId) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return false;
  const value = await getSetting(firstRechargeRewardMarkerKey(uid), '');
  return Boolean(String(value || '').trim());
}

async function markFirstRechargeRewardIssued(userId, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  if (!uid) return false;
  const data = {
    at: Date.now(),
    source: String(payload?.source || 'unknown'),
    operator: String(payload?.operator || ''),
    charName: String(payload?.charName || '')
  };
  await setSetting(firstRechargeRewardMarkerKey(uid), JSON.stringify(data));
  return true;
}

async function hasFirstRechargeRewardMarkerByRealm(userId, realmId = 1) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  if (!uid) return false;
  const value = await getSetting(firstRechargeRewardRealmMarkerKey(uid, rid), '');
  return Boolean(String(value || '').trim());
}

async function markFirstRechargeRewardIssuedByRealm(userId, realmId = 1, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  if (!uid) return false;
  const data = {
    at: Date.now(),
    source: String(payload?.source || 'unknown'),
    operator: String(payload?.operator || ''),
    charName: String(payload?.charName || ''),
    realmId: rid
  };
  await setSetting(firstRechargeRewardRealmMarkerKey(uid, rid), JSON.stringify(data));
  return true;
}

async function hasFirstRechargeReissueCharacterMarker(userId, charName, realmId = 1) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  if (!uid || !name) return false;
  const value = await getSetting(firstRechargeReissueCharacterMarkerKey(uid, name, rid), '');
  return Boolean(String(value || '').trim());
}

async function markFirstRechargeReissueCharacterIssued(userId, charName, realmId = 1, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  if (!uid || !name) return false;
  const data = {
    at: Date.now(),
    source: String(payload?.source || 'unknown'),
    operator: String(payload?.operator || ''),
    charName: name,
    realmId: rid
  };
  await setSetting(firstRechargeReissueCharacterMarkerKey(uid, name, rid), JSON.stringify(data));
  return true;
}

async function hasDivineBeastReissueCharacterMarker(userId, charName, realmId = 1) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  if (!uid || !name) return false;
  const value = await getSetting(divineBeastReissueCharacterMarkerKey(uid, name, rid), '');
  return Boolean(String(value || '').trim());
}

async function markDivineBeastReissueCharacterIssued(userId, charName, realmId = 1, payload = {}) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  if (!uid || !name) return false;
  const data = {
    at: Date.now(),
    source: String(payload?.source || 'unknown'),
    operator: String(payload?.operator || ''),
    charName: name,
    realmId: rid
  };
  await setSetting(divineBeastReissueCharacterMarkerKey(uid, name, rid), JSON.stringify(data));
  return true;
}

function grantDivineBeastPetToPlayer(player) {
  return grantFixedPetToPlayer(player, '马年神兽', 'ultimate');
}

function grantFixedPetToPlayer(player, species, rarity = 'ultimate') {
  if (!player) return { ok: false, reason: 'player_not_found' };
  const petState = normalizePetState(player);
  if (!petState) return { ok: false, reason: 'pet_state_invalid' };
  const fixedPet = createRandomPet(rarity, { fixedSpecies: String(species || '').trim() });
  if (!fixedPet) return { ok: false, reason: 'create_failed', msg: '创建神兽数据失败。' };
  petState.pets.push(fixedPet);
  if (!petState.activePetId) petState.activePetId = fixedPet.id;
  player.forceStateRefresh = true;
  return { ok: true, pet: fixedPet };
}

function grantFirstRechargeWelfareToPlayer(player, config = null) {
  if (!player) return { ok: false, reason: 'player_not_found', rewardText: [] };
  const cfg = normalizeFirstRechargeWelfareConfig(config || getFirstRechargeWelfareConfigSnapshot());
  if (cfg.enabled === false) return { ok: false, reason: 'disabled', rewardText: [] };
  if (!player.flags) player.flags = {};
  player.flags.firstRechargeRewardClaimed = true;
  player.flags.firstRechargeRewardAt = Date.now();
  const rewardText = [];
  const extraYuanbao = Math.max(0, Math.floor(Number(cfg.yuanbao || 0)));
  const extraGold = Math.max(0, Math.floor(Number(cfg.gold || 0)));
  if (extraYuanbao > 0) {
    player.yuanbao = Math.max(0, Math.floor(Number(player.yuanbao || 0))) + extraYuanbao;
    rewardText.push(`元宝+${extraYuanbao}`);
  }
  if (extraGold > 0) {
    player.gold = Math.max(0, Math.floor(Number(player.gold || 0))) + extraGold;
    rewardText.push(`金币+${extraGold}`);
  }
  (cfg.items || []).forEach((entry) => {
    const itemId = String(entry?.id || '').trim();
    const qty = Math.max(0, Math.floor(Number(entry?.qty || 0)));
    if (!itemId || qty <= 0) return;
    addItem(player, itemId, qty);
    rewardText.push(`${ITEM_TEMPLATES[itemId]?.name || itemId}x${qty}`);
  });
  if (cfg.grantDivineBeast !== false) {
    const petGrant = grantDivineBeastPetToPlayer(player);
    if (petGrant?.ok && petGrant.pet) rewardText.push(`${petGrant.pet.role || '马年神兽'}x1`);
  }
  player.forceStateRefresh = true;
  return { ok: true, rewardText, config: cfg };
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 25000,
  pingTimeout: 90000,
  perMessageDeflate: {
    threshold: 1024
  },
  httpCompression: {
    threshold: 1024
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_BASE = (() => {
  const raw = String(config.adminPath || 'admin').trim();
  const cleaned = raw.replace(/^\/+|\/+$/g, '');
  return cleaned ? `/${cleaned}` : '/admin';
})();

if (ADMIN_BASE !== '/admin') {
  app.use((req, res, next) => {
    const reqPath = String(req.path || req.url || '');
    if (reqPath === '/admin' || reqPath.startsWith('/admin/')) {
      return res.status(404).send('未找到页面');
    }
    return next();
  });
}
app.use(express.json({ limit: '100mb' }));
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

app.get('/api/route-lines', async (req, res) => {
  if (!Array.isArray(ROUTE_LINES_CONFIG) || ROUTE_LINES_CONFIG.length <= 0) {
    await loadRouteLinesConfig();
  }
  const lines = getPublicRouteLinesSnapshot();
  res.json({ ok: true, count: lines.length, lines });
});

app.get('/api/line-ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.json({ ok: true, now: Date.now() });
});

app.get('/api/invite-link', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  const user = await knex('users').where({ id: session.user_id }).first();
  if (!user) return res.status(404).json({ error: '账号不存在。' });
  const code = buildInviteCode(user.id);
  const origin = `${req.protocol}://${req.get('host')}`;
  const link = `${origin}/?invite=${encodeURIComponent(code)}`;
  res.json({ ok: true, code, link, inviter: user.username || '' });
});

app.get('/api/invite/stats', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: '登录已过期。' });
  const user = await knex('users').where({ id: session.user_id }).first();
  if (!user) return res.status(404).json({ error: '账号不存在。' });
  const code = buildInviteCode(user.id);
  const origin = `${req.protocol}://${req.get('host')}`;
  const link = `${origin}/?invite=${encodeURIComponent(code)}`;
  const config = getInviteRewardConfigSnapshot();
  const stats = await getInviteStatsByInviterUserId(user.id);
  res.json({
    ok: true,
    code,
    link,
    inviter: user.username || '',
    config: {
      enabled: config.enabled !== false,
      bonusRate: config.bonusRate
    },
    stats
  });
});

app.post('/api/register', async (req, res) => {
  const { username, password, email, captchaToken, captchaCode, inviteCode } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '账号或密码缺失。' });
  if (!verifyCaptcha(captchaToken, captchaCode)) {
    return res.status(400).json({ error: '验证码错误。' });
  }
  const exists = await knex('users').where({ username }).first();
  if (exists) return res.status(400).json({ error: '账号已存在。' });
  if (email && email.trim()) {
    const emailExists = await knex('users').where({ email: email.trim() }).first();
    if (emailExists) return res.status(400).json({ error: '该邮箱已被使用。' });
  }
  let inviterUser = null;
  const parsedInviteUserId = parseInviteCode(inviteCode);
  if (String(inviteCode || '').trim()) {
    if (!parsedInviteUserId) return res.status(400).json({ error: '邀请码无效。' });
    inviterUser = await knex('users').where({ id: parsedInviteUserId }).first();
    if (!inviterUser) return res.status(400).json({ error: '邀请人不存在。' });
  }
  const newUserId = await createUser(username, password, email || null);
  if (inviterUser && inviterUser.id !== newUserId) {
    await bindInviteForUser(newUserId, inviterUser.id, {
      inviterUsername: inviterUser.username || '',
      inviteCode: String(inviteCode || '').trim(),
      source: 'register'
    });
  }
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

// 密码重置功能
app.post('/api/password-reset/request', async (req, res) => {
  const { email, username, captchaToken, captchaCode } = req.body || {};
  if (!email && !username) {
    return res.status(400).json({ error: '邮箱或账号必须提供一个。' });
  }
  if (!verifyCaptcha(captchaToken, captchaCode)) {
    return res.status(400).json({ error: '验证码错误。' });
  }
  
  let user = null;
  if (email) {
    user = await getUserByEmail(email.trim());
  } else {
    user = await getUserByName(username.trim());
  }
  
  if (!user) {
    // 不暴露用户是否存在，统一返回成功
    return res.json({ ok: true, message: '如果邮箱/账号存在，重置链接已发送至邮箱。' });
  }
  
  if (!user.email) {
    return res.status(400).json({ error: '该账号未绑定邮箱，请联系管理员重置密码。' });
  }
  
  const resetToken = await createPasswordResetToken(user.id);
  
  // 构建重置URL
  const protocol = req.protocol;
  const host = req.get('host');
  const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;
  
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
    res.json({ ok: true, message: '重置链接已发送至邮箱，请注意查收。' });
  } catch (err) {
    console.error('发送密码重置邮件失败:', err);
    res.status(500).json({ error: '邮件发送失败，请稍后重试或联系管理员。' });
  }
});

app.post('/api/password-reset/reset', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: '重置令牌或新密码缺失。' });
  }
  if (String(newPassword).length < 4) {
    return res.status(400).json({ error: '密码至少4位。' });
  }
  
  const resetToken = await getPasswordResetToken(token);
  if (!resetToken) {
    return res.status(400).json({ error: '重置令牌无效或已过期。' });
  }
  
  try {
    await updateUserPassword(resetToken.user_id, String(newPassword));
    await markPasswordResetTokenUsed(token);
    // 清除该用户的所有session，强制重新登录
    await clearUserSessions(resetToken.user_id);
    res.json({ ok: true, message: '密码重置成功，请重新登录。' });
  } catch (err) {
    console.error('密码重置失败:', err);
    res.status(500).json({ error: '密码重置失败，请稍后重试。' });
  }
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
  const exactName = String(name || '').trim();
  if (!exactName) return res.status(400).json({ error: '角色名不能为空。' });
  let targetRealmId = realmInfo.realmId;
  let ownedCharacter = await knex('characters')
    .where({ user_id: session.user_id, name: exactName, realm_id: targetRealmId })
    .first();
  if (!ownedCharacter) {
    ownedCharacter = await knex('characters')
      .where({ user_id: session.user_id, name: exactName })
      .orderBy('updated_at', 'desc')
      .first();
    if (!ownedCharacter) {
      return res.status(404).json({ error: '角色不存在。' });
    }
    targetRealmId = Number(ownedCharacter.realm_id || targetRealmId || 1);
  }
  const isOnline = Array.from(players.values()).some(
    (p) => p && p.name === exactName && p.userId === session.user_id && (p.realmId || 1) === targetRealmId
  );
  if (isOnline) {
    return res.status(400).json({ error: '角色在线中，无法删除。' });
  }
  const member = await getGuildMember(session.user_id, exactName, targetRealmId);
  if (member && member.role === 'leader') {
    return res.status(400).json({ error: '会长不能删除角色，请先转让会长。' });
  }
  if (member) {
    await leaveGuild(session.user_id, exactName, targetRealmId);
  }
  const application = await getApplicationByUser(session.user_id, targetRealmId);
  if (application && application.guild_id && application.char_name === exactName) {
    await removeGuildApplication(application.guild_id, session.user_id, targetRealmId);
  }
  await knex('consignments').where({ seller_name: exactName, realm_id: targetRealmId }).del();
  await knex('consignment_history').where({ seller_name: exactName, realm_id: targetRealmId }).del();
  await knex('mails')
    .where({ to_name: exactName, realm_id: targetRealmId })
    .orWhere({ from_name: exactName, realm_id: targetRealmId })
    .del();
  await deleteCharacter(session.user_id, exactName, targetRealmId);
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

function normalizeActivityPointShopConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const list = Array.isArray(src.items) ? src.items : [];
  const items = list.map((entry, index) => {
    const itemId = String(entry?.itemId || '').trim();
    if (!itemId) return null;
    const id = String(entry?.id || `aps_${index + 1}_${itemId}`).trim();
    return {
      id,
      cost: Math.max(1, Math.floor(Number(entry?.cost || 0))),
      itemId,
      sort: Number.isFinite(Number(entry?.sort)) ? Number(entry.sort) : index
    };
  }).filter((it) => it && it.cost > 0 && it.itemId);
  items.sort((a, b) => (a.sort - b.sort) || a.id.localeCompare(b.id));
  return { version: 2, items };
}

function expandActivityPointShopConfigForRuntime(simpleConfig) {
  const src = simpleConfig && typeof simpleConfig === 'object' ? simpleConfig : { version: 2, items: [] };
  const list = Array.isArray(src.items) ? src.items : [];
  const items = list.map((entry, index) => {
    const itemId = String(entry?.itemId || '').trim();
    if (!itemId || !ITEM_TEMPLATES[itemId]) return null;
    return {
      id: String(entry?.id || `aps_${index + 1}_${itemId}`).trim(),
      name: String(ITEM_TEMPLATES[itemId]?.name || itemId),
      desc: '',
      active: true,
      cost: Math.max(1, Math.floor(Number(entry?.cost || 1))),
      limitType: 'none',
      limit: 0,
      minLevel: 0,
      maxLevel: 0,
      needVip: false,
      needSvip: false,
      reward: {
        gold: 0,
        items: [{ id: itemId, qty: 1 }]
      },
      sort: Number.isFinite(Number(entry?.sort)) ? Number(entry.sort) : index
    };
  }).filter(Boolean);
  items.sort((a, b) => (a.sort - b.sort) || a.id.localeCompare(b.id));
  return { version: 2, items };
}

function validateActivityPointShopConfig(config) {
  const normalized = normalizeActivityPointShopConfig(config);
  const seen = new Set();
  for (const item of normalized.items) {
    if (seen.has(item.id)) throw new Error(`商品ID重复: ${item.id}`);
    seen.add(item.id);
    if (!ITEM_TEMPLATES[item.itemId]) {
      throw new Error(`商品 ${item.id} 包含不存在的物品: ${item.itemId}`);
    }
  }
  return normalized;
}

function getDivineBeastSpeciesOptions() {
  const list = Array.isArray(PET_SPECIES_BY_RARITY?.ultimate) ? PET_SPECIES_BY_RARITY.ultimate : [];
  const seen = new Set();
  const rows = [];
  const pushSpecies = (name, sortBase = 0) => {
    const species = String(name || '').trim();
    if (!species || seen.has(species) || !isDivineBeastSpeciesName(species)) return;
    seen.add(species);
    rows.push({ id: species, name: species, sort: sortBase + rows.length });
  };
  // 优先加入不可掉落神兽，避免运营误改稀有度池后下拉变空
  Array.from(PET_NON_DROPPABLE_SPECIES || []).forEach((name) => pushSpecies(name, 0));
  // 再加入终极池里符合神兽规则的物种
  list.forEach((name, index) => pushSpecies(name, 100 + index));
  return rows.sort((a, b) => (a.sort - b.sort) || a.id.localeCompare(b.id));
}

function isDivineBeastSpeciesName(name) {
  const species = String(name || '').trim();
  if (!species) return false;
  if (species.includes('神兽')) return true;
  return PET_NON_DROPPABLE_SPECIES.has(species);
}

function normalizeDivineBeastFragmentExchangeConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const list = Array.isArray(src.items) ? src.items : [];
  const items = list
    .map((entry, index) => {
      const species = String(entry?.species || '').trim();
      if (!species || !isDivineBeastSpeciesName(species)) return null;
      return {
        id: String(entry?.id || `dbf_${index + 1}`).trim(),
        species,
        cost: Math.max(1, Math.floor(Number(entry?.cost || 0))),
        sort: Number.isFinite(Number(entry?.sort)) ? Number(entry.sort) : index
      };
    })
    .filter((it) => it && it.id && it.species && it.cost > 0);
  items.sort((a, b) => (a.sort - b.sort) || a.id.localeCompare(b.id));
  return { version: 1, items };
}

function validateDivineBeastFragmentExchangeConfig(config) {
  const normalized = normalizeDivineBeastFragmentExchangeConfig(config);
  const validSpecies = new Set(getDivineBeastSpeciesOptions().map((it) => it.name));
  const seen = new Set();
  for (const item of normalized.items) {
    if (seen.has(item.id)) throw new Error(`兑换ID重复: ${item.id}`);
    seen.add(item.id);
    if (!validSpecies.has(item.species)) throw new Error(`不存在神兽: ${item.species}`);
  }
  return normalized;
}

let activityPointShopConfigCache = null;
async function getActivityPointShopConfigCached(forceRefresh = false) {
  if (!forceRefresh && activityPointShopConfigCache) return activityPointShopConfigCache;
  let raw = {};
  try {
    raw = await getSetting(ACTIVITY_POINT_SHOP_SETTING_KEY, '{}');
    if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
  } catch {
    raw = {};
  }
  const simpleConfig = normalizeActivityPointShopConfig(raw);
  activityPointShopConfigCache = expandActivityPointShopConfigForRuntime(simpleConfig);
  return activityPointShopConfigCache;
}

let divineBeastFragmentExchangeConfigCache = null;
async function getDivineBeastFragmentExchangeConfigCached(forceRefresh = false) {
  if (!forceRefresh && divineBeastFragmentExchangeConfigCache) return divineBeastFragmentExchangeConfigCache;
  let raw = {};
  try {
    raw = await getSetting(DIVINE_BEAST_FRAGMENT_EXCHANGE_SETTING_KEY, '{}');
    if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
  } catch {
    raw = {};
  }
  divineBeastFragmentExchangeConfigCache = normalizeDivineBeastFragmentExchangeConfig(raw);
  return divineBeastFragmentExchangeConfigCache;
}

async function loadHarvestSeasonRewardConfigFromDb() {
  let raw = {};
  try {
    raw = await getSetting(HARVEST_SEASON_REWARD_SETTING_KEY, '{}');
    if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
  } catch {
    raw = {};
  }
  return setHarvestSeasonRewardConfig(raw);
}

async function loadHarvestSeasonSignConfigFromDb() {
  let raw = {};
  try {
    raw = await getSetting(HARVEST_SEASON_SIGN_SETTING_KEY, '{}');
    if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
  } catch {
    raw = {};
  }
  return setHarvestSeasonSignConfig(raw);
}

function validateHarvestSeasonRewardConfig(config) {
  const normalized = normalizeHarvestSeasonRewardConfig(config);
  const seen = new Set();
  for (const item of normalized.items) {
    if (seen.has(item.id)) throw new Error(`奖励ID重复: ${item.id}`);
    seen.add(item.id);
    if (item.itemId && !ITEM_TEMPLATES[item.itemId]) {
      throw new Error(`奖励 ${item.id} 包含不存在的物品: ${item.itemId}`);
    }
  }
  return normalized;
}

function validateHarvestSeasonSignConfig(config) {
  const normalized = normalizeHarvestSeasonSignConfig(config);
  for (const item of normalized.items) {
    if (item.id && !ITEM_TEMPLATES[item.id]) {
      throw new Error(`签到奖励包含不存在的物品: ${item.id}`);
    }
  }
  return normalized;
}
async function loadEquipmentRecycleConfigFromDb() {
  let raw = {};
  try {
    raw = await getSetting(EQUIPMENT_RECYCLE_SETTING_KEY, '{}');
    if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
  } catch {
    raw = {};
  }
  return setEquipmentRecycleExchangeConfig(raw);
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

function chunkRowsForInsert(rows, options = {}) {
  const maxRows = Math.max(1, Math.floor(Number(options.maxRows || 200)));
  const maxBytes = Math.max(64 * 1024, Math.floor(Number(options.maxBytes || 1024 * 1024)));
  const chunks = [];
  let current = [];
  let currentBytes = 0;
  for (const row of rows) {
    let rowBytes = 1024;
    try {
      rowBytes = Buffer.byteLength(JSON.stringify(row), 'utf8') + 64;
    } catch {}
    const shouldFlush = current.length > 0 && (current.length >= maxRows || (currentBytes + rowBytes) > maxBytes);
    if (shouldFlush) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(row);
    currentBytes += rowBytes;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function normalizeImportRows(tableName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (tableName !== 'characters') return rows;
  const picked = new Map();
  for (const row of rows) {
    const userId = Number(row?.user_id || 0);
    const realmId = Number(row?.realm_id || 1) || 1;
    const name = String(row?.name || '').trim();
    if (!userId || !name) continue;
    const key = `${userId}__${realmId}__${name}`;
    const prev = picked.get(key);
    if (!prev) {
      picked.set(key, row);
      continue;
    }
    const prevTs = Date.parse(prev.updated_at || 0) || 0;
    const nextTs = Date.parse(row.updated_at || 0) || 0;
    if (nextTs > prevTs) {
      picked.set(key, row);
      continue;
    }
    if (nextTs === prevTs) {
      const prevId = Number(prev.id || 0);
      const nextId = Number(row.id || 0);
      if (nextId > prevId) picked.set(key, row);
    }
  }
  return Array.from(picked.values());
}

if (ADMIN_BASE !== '/admin') {
  app.use('/admin', (req, res, next) => {
    const original = String(req.originalUrl || req.url || '');
    const fromCustomBase = original === ADMIN_BASE || original.startsWith(`${ADMIN_BASE}/`);
    if (!fromCustomBase) {
      return res.status(404).json({ error: 'Not Found' });
    }
    return next();
  });
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

app.post('/admin/users/force-offline', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const username = String(req.body?.username || '').trim();
  if (!username) return res.status(400).json({ error: '缺少用户名。' });
  const user = await getUserByName(username);
  if (!user) return res.status(404).json({ error: '用户不存在。' });

  let kicked = 0;
  for (const [socketId, onlinePlayer] of Array.from(players.entries())) {
    if (!onlinePlayer) continue;
    if ((onlinePlayer.userId || 0) !== user.id) continue;
    try {
      onlinePlayer.send?.('管理员已执行强制下线。');
    } catch {}
    try {
      onlinePlayer.socket?.disconnect?.(true);
    } catch {}
    if (!onlinePlayer.flags) onlinePlayer.flags = {};
    onlinePlayer.flags.offlineAt = Date.now();
    delete onlinePlayer.flags.offlineManagedAuto;
    delete onlinePlayer.flags.offlineManagedAt;
    delete onlinePlayer.flags.offlineManagedPending;
    delete onlinePlayer.flags.offlineManagedStartAt;
    onlinePlayer.deviceKey = null;
    onlinePlayer.send = () => {};
    await savePlayer(onlinePlayer);
    getRealmState(onlinePlayer.realmId || 1).lastSaveTime.delete(onlinePlayer.name);
    onlinePlayerRankTitles.delete(onlinePlayer.name);
    players.delete(socketId);
    kicked += 1;
  }

  await clearUserSessions(user.id);
  res.json({ ok: true, kicked });
});

app.post('/admin/characters/cleanup', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const result = await cleanupInvalidItems();
  res.json({ ok: true, ...result });
});

app.post('/admin/characters/migrate', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const charName = String(req.body?.charName || '').trim();
  const realmId = Math.max(1, Math.floor(Number(req.body?.realmId || 1) || 1));
  const targetUsername = String(req.body?.targetUsername || '').trim();
  if (!charName) return res.status(400).json({ error: '缺少角色名。' });
  if (!targetUsername) return res.status(400).json({ error: '缺少目标账号。' });

  const targetUser = await getUserByName(targetUsername);
  if (!targetUser) return res.status(404).json({ error: '目标账号不存在。' });

  try {
    const onlinePlayer = playersByName(charName, realmId);
    const result = await migrateCharacterToUser({
      realmId,
      charName,
      targetUserId: targetUser.id,
      allowOnline: Boolean(onlinePlayer)
    });
    if (onlinePlayer) {
      onlinePlayer.userId = Number(targetUser.id || 0);
      onlinePlayer.forceStateRefresh = true;
      await savePlayer(onlinePlayer).catch(() => {});
      if (typeof onlinePlayer.send === 'function') {
        onlinePlayer.send(`管理员已将角色迁移至账号【${targetUsername}】，即将强制下线，请使用目标账号登录。`);
      }
      setTimeout(() => {
        try {
          onlinePlayer.socket?.disconnect?.(true);
        } catch {}
      }, 300);
    }
    return res.json({
      ok: true,
      ...result,
      targetUsername: targetUser.username || targetUsername,
      forcedOffline: Boolean(onlinePlayer)
    });
  } catch (err) {
    return res.status(400).json({ error: String(err?.message || err || '迁移失败') });
  }
});

app.post('/admin/characters/restore', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const charName = String(req.body?.charName || '').trim();
  const realmId = Math.max(1, Math.floor(Number(req.body?.realmId || 1) || 1));
  if (!charName) return res.status(400).json({ error: '缺少角色名。' });
  try {
    const result = await restoreDeletedCharacter(charName, realmId);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: String(err?.message || err || '恢复失败') });
  }
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

app.get('/admin/first-recharge-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  res.json({ ok: true, config: getFirstRechargeWelfareConfigSnapshot() });
});

app.get('/admin/invite-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  res.json({ ok: true, config: getInviteRewardConfigSnapshot() });
});

app.post('/admin/invite-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await setInviteRewardConfig(req.body?.config || {});
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '邀请配置更新失败' });
  }
});

app.post('/admin/invite-reward/reissue', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const charName = String(req.body?.charName || '').trim();
  const rawRealmId = req.body?.realmId;
  const force = req.body?.force === true;
  if (!charName) return res.status(400).json({ error: '请输入角色名。' });
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
  const row = await findCharacterByNameInRealm(charName, realmId);
  if (!row) return res.status(404).json({ error: '角色不存在。' });
  const inviteeUserId = Math.max(0, Math.floor(Number(row.user_id || 0)));
  if (!inviteeUserId) return res.status(400).json({ error: '角色账号信息异常。' });
  const processed = await getInviteFirstRechargeProcessedRecord(inviteeUserId);
  if (!processed) return res.status(400).json({ error: '该账号没有邀请首充处理记录。' });
  if (!processed.inviterUserId || !processed.rebateYuanbao) {
    return res.status(400).json({ error: '该账号没有可补发的邀请返利记录。' });
  }
  if (!force && await hasInviteRebateIssuedForInvitee(inviteeUserId)) {
    return res.status(400).json({ error: '该账号邀请返利已发放过。' });
  }
  const rebateResult = await grantInviteRebateYuanbao(processed.inviterUserId, processed.rebateYuanbao, {
    preferredRealmId: realmId,
    inviteeUserId,
    inviteeName: row.name
  });
  if (!rebateResult?.ok) {
    return res.status(400).json({ error: `返利补发失败：${rebateResult?.reason || '未知原因'}` });
  }
  const operator = String(admin?.user?.username || admin?.user?.name || admin?.user?.id || '').trim();
  await markInviteRebateIssuedForInvitee(inviteeUserId, {
    source: 'admin_reissue_invite_rebate',
    operator,
    inviterUserId: processed.inviterUserId,
    inviteeCharName: row.name,
    rebateYuanbao: processed.rebateYuanbao,
    targetName: String(rebateResult?.targetName || ''),
    realmId: Math.max(1, Math.floor(Number(rebateResult?.realmId || 1) || 1))
  });
  res.json({
    ok: true,
    invitee: { userId: inviteeUserId, charName: row.name, realmId },
    inviter: {
      userId: processed.inviterUserId,
      targetName: String(rebateResult?.targetName || ''),
      realmId: Math.max(1, Math.floor(Number(rebateResult?.realmId || 1) || 1)),
      online: rebateResult?.online === true
    },
    rebateYuanbao: processed.rebateYuanbao
  });
});

app.post('/admin/invite-reward/reissue-all-failed', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const limit = Math.max(1, Math.min(1000, Math.floor(Number(req.body?.limit || 200) || 200)));
  const preferredRealmIdRaw = req.body?.realmId;
  let preferredRealmId = 0;
  if (preferredRealmIdRaw != null && preferredRealmIdRaw !== '') {
    const realmInfo = await resolveRealmId(preferredRealmIdRaw);
    if (realmInfo.error) return res.status(400).json({ error: realmInfo.error });
    preferredRealmId = realmInfo.realmId;
  }
  const rows = await knex('game_settings')
    .where('key', 'like', 'invite_first_recharge_bonus_processed_user_%')
    .select('key', 'value');
  const operator = String(admin?.user?.username || admin?.user?.name || admin?.user?.id || '').trim();
  const stats = { totalProcessed: rows.length, pending: 0, success: 0, alreadyIssued: 0, skippedNoRebate: 0, failed: 0 };
  const failures = [];
  for (const row of rows) {
    if (stats.success + stats.failed >= limit) break;
    const key = String(row?.key || '');
    const m = key.match(/^invite_first_recharge_bonus_processed_user_(\d+)$/);
    if (!m) continue;
    const inviteeUserId = Math.max(0, Math.floor(Number(m[1] || 0) || 0));
    if (!inviteeUserId) continue;
    try {
      if (await hasInviteRebateIssuedForInvitee(inviteeUserId)) {
        stats.alreadyIssued += 1;
        continue;
      }
      let processed = null;
      try {
        processed = JSON.parse(row?.value || '{}');
      } catch {
        processed = null;
      }
      const inviterUserId = Math.max(0, Math.floor(Number(processed?.inviterUserId || 0)));
      const rebateYuanbao = Math.max(0, Math.floor(Number(processed?.rebateYuanbao || 0)));
      const inviteeCharName = String(processed?.inviteeCharName || '').trim();
      if (!inviterUserId || rebateYuanbao <= 0) {
        stats.skippedNoRebate += 1;
        continue;
      }
      stats.pending += 1;
      let inviteeRow = null;
      if (preferredRealmId && inviteeCharName) {
        inviteeRow = await knex('characters').where({ user_id: inviteeUserId, name: inviteeCharName, realm_id: preferredRealmId }).first();
      }
      if (!inviteeRow) {
        inviteeRow = await knex('characters')
          .where({ user_id: inviteeUserId })
          .orderByRaw('CASE WHEN name = ? THEN 0 ELSE 1 END', [inviteeCharName || ''])
          .orderBy('updated_at', 'desc')
          .orderBy('id', 'desc')
          .first();
      }
      const rebateResult = await grantInviteRebateYuanbao(inviterUserId, rebateYuanbao, {
        preferredRealmId: preferredRealmId || Number(inviteeRow?.realm_id || 1) || 1,
        inviteeUserId,
        inviteeName: inviteeCharName || String(inviteeRow?.name || '')
      });
      if (!rebateResult?.ok) {
        stats.failed += 1;
        failures.push(`uid=${inviteeUserId}:${rebateResult?.reason || 'grant_failed'}`);
        continue;
      }
      await markInviteRebateIssuedForInvitee(inviteeUserId, {
        source: 'admin_reissue_invite_rebate_all',
        operator,
        inviterUserId,
        inviteeCharName: inviteeCharName || String(inviteeRow?.name || ''),
        rebateYuanbao,
        targetName: String(rebateResult?.targetName || ''),
        realmId: Math.max(1, Math.floor(Number(rebateResult?.realmId || 1) || 1))
      });
      stats.success += 1;
    } catch (err) {
      stats.failed += 1;
      failures.push(`uid=${inviteeUserId}:${err?.message || err}`);
    }
  }
  res.json({
    ok: true,
    preferredRealmId: preferredRealmId || null,
    limit,
    ...stats,
    failures: failures.slice(0, 30)
  });
});

app.post('/admin/first-recharge-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await setFirstRechargeWelfareConfig(req.body?.config || {});
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '首充福利配置更新失败' });
  }
});

app.post('/admin/first-recharge-settings/reissue', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const charName = String(req.body?.charName || '').trim();
  const rawRealmId = req.body?.realmId;
  if (!charName) return res.status(400).json({ error: '请输入角色名。' });
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
  let player = playersByName(charName, realmId);
  let userId = Math.max(0, Math.floor(Number(player?.userId || 0)));
  let targetName = player?.name || charName;
  let saveOffline = null;
  if (!player) {
    const row = await findCharacterByNameInRealm(charName, realmId);
    if (!row) return res.status(404).json({ error: '角色不存在。' });
    player = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
    if (!player) return res.status(404).json({ error: '角色数据不存在。' });
    userId = Math.max(0, Math.floor(Number(row.user_id || player.userId || 0)));
    targetName = row.name || player.name || charName;
    player.userId = userId || player.userId;
    player.realmId = row.realm_id || player.realmId || realmId;
    saveOffline = async () => {
      await saveCharacter(row.user_id, player, row.realm_id || 1);
    };
  }
  if (!userId) return res.status(400).json({ error: '角色账号信息异常。' });
  const targetRealmId = Math.max(1, Math.floor(Number(player?.realmId || realmId) || realmId));
  if (await hasFirstRechargeReissueCharacterMarker(userId, targetName, targetRealmId)) {
    return res.status(400).json({ error: '该角色已补发过首充福利，不能重复补发。' });
  }
  const config = { ...getFirstRechargeWelfareConfigSnapshot(), enabled: true };
  const grant = grantFirstRechargeWelfareToPlayer(player, config);
  if (!grant?.ok) {
    return res.status(400).json({ error: '首充福利补发失败。' });
  }
  if (typeof saveOffline === 'function') {
    await saveOffline();
  } else {
    await savePlayer(player);
    if (player?.socket) {
      player.forceStateRefresh = true;
      await sendState(player);
      if (typeof player.send === 'function') {
        player.send('管理员已补发首充礼包，请查看背包/宠物。');
      }
    }
  }
  const operator = String(admin?.user?.username || admin?.user?.name || admin?.user?.id || '').trim();
  await markFirstRechargeReissueCharacterIssued(userId, targetName, targetRealmId, { source: 'admin_reissue', operator });
  await markFirstRechargeRewardIssued(userId, { source: 'admin_reissue', operator, charName: targetName });
  await markFirstRechargeRewardIssuedByRealm(userId, targetRealmId, { source: 'admin_reissue', operator, charName: targetName });
  res.json({
    ok: true,
    charName: targetName,
    realmId,
    online: !saveOffline,
    rewardText: Array.isArray(grant.rewardText) ? grant.rewardText : []
  });
});

app.post('/admin/first-recharge-settings/reissue-divine-beast', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const charName = String(req.body?.charName || '').trim();
  const rawRealmId = req.body?.realmId;
  const ignoreFirstRechargeMarker = req.body?.ignoreFirstRechargeMarker !== false;
  if (!charName) return res.status(400).json({ error: '请输入角色名。' });
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
  let player = playersByName(charName, realmId);
  let userId = Math.max(0, Math.floor(Number(player?.userId || 0)));
  let targetName = player?.name || charName;
  let saveOffline = null;
  if (!player) {
    const row = await findCharacterByNameInRealm(charName, realmId);
    if (!row) return res.status(404).json({ error: '角色不存在。' });
    player = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
    if (!player) return res.status(404).json({ error: '角色数据不存在。' });
    userId = Math.max(0, Math.floor(Number(row.user_id || player.userId || 0)));
    targetName = row.name || player.name || charName;
    player.userId = userId || player.userId;
    player.realmId = row.realm_id || player.realmId || realmId;
    saveOffline = async () => {
      await saveCharacter(row.user_id, player, row.realm_id || 1);
    };
  }
  if (!userId) return res.status(400).json({ error: '角色账号信息异常。' });
  const targetRealmId = Math.max(1, Math.floor(Number(player?.realmId || realmId) || realmId));
  if (!ignoreFirstRechargeMarker) {
    const hasAnyFirstRechargeMark =
      await hasFirstRechargeRewardMarker(userId) ||
      await hasFirstRechargeRewardMarkerByRealm(userId, targetRealmId) ||
      await hasFirstRechargeReissueCharacterMarker(userId, targetName, targetRealmId);
    if (hasAnyFirstRechargeMark) {
      return res.status(400).json({ error: '该角色已存在首充标记，未开启忽略首充标记。' });
    }
  }
  if (await hasDivineBeastReissueCharacterMarker(userId, targetName, targetRealmId)) {
    return res.status(400).json({ error: '该角色已补发过马年神兽，不能重复补发。' });
  }
  const petGrant = grantDivineBeastPetToPlayer(player);
  if (!petGrant?.ok || !petGrant.pet) {
    return res.status(400).json({ error: petGrant?.msg || `马年神兽补发失败（${petGrant?.reason || 'unknown'}）。` });
  }
  if (typeof saveOffline === 'function') {
    await saveOffline();
  } else {
    await savePlayer(player);
    if (player?.socket) {
      player.forceStateRefresh = true;
      await sendState(player);
      if (typeof player.send === 'function') player.send('管理员已补发马年神兽，请查看宠物。');
    }
  }
  const operator = String(admin?.user?.username || admin?.user?.name || admin?.user?.id || '').trim();
  await markDivineBeastReissueCharacterIssued(userId, targetName, targetRealmId, { source: 'admin_reissue_divine_beast', operator });
  res.json({
    ok: true,
    charName: targetName,
    realmId: targetRealmId,
    ignoreFirstRechargeMarker,
    online: !saveOffline,
    pet: {
      id: petGrant.pet.id,
      name: petGrant.pet.name,
      role: petGrant.pet.role,
      rarity: petGrant.pet.rarity
    }
  });
});

app.post('/admin/first-recharge-settings/reissue-divine-beast-all', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const preferredRealmIdRaw = req.body?.realmId;
  let preferredRealmId = 0;
  if (preferredRealmIdRaw != null && preferredRealmIdRaw !== '') {
    const realmInfo = await resolveRealmId(preferredRealmIdRaw);
    if (realmInfo.error) return res.status(400).json({ error: realmInfo.error });
    preferredRealmId = realmInfo.realmId;
  }
  const rechargeChars = await listUsedRechargeCharacters();
  const onlinePlayers = Array.from(players.values());
  const onlineByCharKey = new Map();
  for (const p of onlinePlayers) {
    const uid = Math.floor(Number(p?.userId || 0));
    const name = String(p?.name || '').trim();
    const rid = Math.floor(Number(p?.realmId || 1)) || 1;
    if (!uid || !name) continue;
    onlineByCharKey.set(`${uid}|${rid}|${name}`, p);
  }
  const candidateRows = [];
  const seenCandidates = new Set();
  for (const entry of rechargeChars) {
    const uid = Math.floor(Number(entry?.userId || 0));
    const charName = String(entry?.charName || '').trim();
    if (!uid || !charName) continue;
    let row = null;
    if (preferredRealmId) {
      row = await knex('characters')
        .where({ user_id: uid, name: charName, realm_id: preferredRealmId })
        .first();
    } else {
      row = await knex('characters')
        .where({ user_id: uid, name: charName })
        .orderBy('level', 'desc')
        .first();
    }
    if (!row) continue;
    const key = `${uid}|${row.realm_id || 1}|${row.name}`;
    if (seenCandidates.has(key)) continue;
    seenCandidates.add(key);
    candidateRows.push(row);
  }
  const stats = {
    totalRechargeChars: candidateRows.length,
    markedSkipped: 0,
    success: 0,
    noCharacterSkipped: 0,
    failed: 0
  };
  const failures = [];
  for (const row of candidateRows) {
    const userId = Math.floor(Number(row?.user_id || 0));
    const rowRealmId = Math.floor(Number(row?.realm_id || 1)) || 1;
    const rowName = String(row?.name || '').trim();
    try {
      if (await hasDivineBeastReissueCharacterMarker(userId, rowName, rowRealmId)) {
        stats.markedSkipped += 1;
        continue;
      }
      let player = onlineByCharKey.get(`${userId}|${rowRealmId}|${rowName}`) || null;
      let saveOffline = null;
      let targetName = rowName;
      if (!player) {
        player = await loadCharacter(row.user_id, row.name, row.realm_id || 1);
        if (!player) {
          stats.failed += 1;
          failures.push(`uid=${userId}:角色加载失败`);
          continue;
        }
        player.userId = userId;
        player.realmId = rowRealmId;
        targetName = player.name || rowName;
        saveOffline = async () => saveCharacter(row.user_id, player, row.realm_id || 1);
      } else {
        targetName = player.name || rowName;
      }
      const petGrant = grantDivineBeastPetToPlayer(player);
      if (!petGrant?.ok || !petGrant.pet) {
        stats.failed += 1;
        failures.push(`uid=${userId}:${petGrant?.msg || `发神兽失败(${petGrant?.reason || 'unknown'})`}`);
        continue;
      }
      if (saveOffline) await saveOffline();
      else {
        await savePlayer(player);
        if (player?.socket) {
          player.forceStateRefresh = true;
          await sendState(player);
          if (typeof player.send === 'function') player.send('管理员已补发马年神兽，请查看宠物。');
        }
      }
      const operator = String(admin?.user?.username || admin?.user?.name || admin?.user?.id || '').trim();
      await markDivineBeastReissueCharacterIssued(userId, targetName, rowRealmId, { source: 'admin_reissue_divine_beast_all', operator });
      stats.success += 1;
    } catch (err) {
      stats.failed += 1;
      failures.push(`uid=${userId}:${err?.message || err}`);
    }
  }
  res.json({
    ok: true,
    preferredRealmId: preferredRealmId || null,
    ...stats,
    failures: failures.slice(0, 20)
  });
});

app.post('/admin/first-recharge-settings/reissue-all', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const preferredRealmIdRaw = req.body?.realmId;
  let preferredRealmId = 0;
  if (preferredRealmIdRaw != null && preferredRealmIdRaw !== '') {
    const realmInfo = await resolveRealmId(preferredRealmIdRaw);
    if (realmInfo.error) return res.status(400).json({ error: realmInfo.error });
    preferredRealmId = realmInfo.realmId;
  }
  const rechargeChars = await listUsedRechargeCharacters();
  const onlinePlayers = Array.from(players.values());
  const onlineByCharKey = new Map();
  for (const p of onlinePlayers) {
    const uid = Math.floor(Number(p?.userId || 0));
    const name = String(p?.name || '').trim();
    const rid = Math.floor(Number(p?.realmId || 1)) || 1;
    if (!uid) continue;
    if (!name) continue;
    onlineByCharKey.set(`${uid}|${rid}|${name}`, p);
  }
  const candidateRows = [];
  const seenCandidates = new Set();
  for (const entry of rechargeChars) {
    const uid = Math.floor(Number(entry?.userId || 0));
    const charName = String(entry?.charName || '').trim();
    if (!uid || !charName) continue;
    let row = null;
    if (preferredRealmId) {
      row = await knex('characters')
        .where({ user_id: uid, name: charName, realm_id: preferredRealmId })
        .first();
    } else {
      row = await knex('characters')
        .where({ user_id: uid, name: charName })
        .orderBy('level', 'desc')
        .first();
    }
    if (!row) continue;
    const key = `${uid}|${row.realm_id || 1}|${row.name}`;
    if (seenCandidates.has(key)) continue;
    seenCandidates.add(key);
    candidateRows.push(row);
  }
  const stats = {
    totalRechargeChars: candidateRows.length,
    markedSkipped: 0,
    success: 0,
    noCharacterSkipped: 0,
    failed: 0
  };
  const failures = [];
  for (const row of candidateRows) {
    const userId = Math.floor(Number(row?.user_id || 0));
    try {
      if (await hasFirstRechargeReissueCharacterMarker(userId, String(row?.name || ''), Math.floor(Number(row?.realm_id || 1) || 1))) {
        stats.markedSkipped += 1;
        continue;
      }
      const rowRealmId = Math.floor(Number(row?.realm_id || 1)) || 1;
      const rowName = String(row?.name || '').trim();
      let player = onlineByCharKey.get(`${userId}|${rowRealmId}|${rowName}`) || null;
      let saveOffline = null;
      let targetName = player?.name || '';
      if (!player) {
        const targetRow = row;
        if (!targetRow) {
          stats.noCharacterSkipped += 1;
          continue;
        }
        player = await loadCharacter(targetRow.user_id, targetRow.name, targetRow.realm_id || 1);
        if (!player) {
          stats.failed += 1;
          failures.push(`uid=${userId}:角色加载失败`);
          continue;
        }
        player.userId = userId;
        player.realmId = targetRow.realm_id || player.realmId || preferredRealmId || 1;
        targetName = targetRow.name || player.name || '';
        saveOffline = async () => saveCharacter(targetRow.user_id, player, targetRow.realm_id || 1);
      }
      const config = { ...getFirstRechargeWelfareConfigSnapshot(), enabled: true };
      const grant = grantFirstRechargeWelfareToPlayer(player, config);
      if (!grant?.ok) {
        stats.failed += 1;
        failures.push(`uid=${userId}:发奖失败`);
        continue;
      }
      if (saveOffline) await saveOffline();
      else {
        await savePlayer(player);
        if (player?.socket) {
          player.forceStateRefresh = true;
          await sendState(player);
          if (typeof player.send === 'function') {
            player.send('管理员已补发首充礼包，请查看背包/宠物。');
          }
        }
      }
      const operator = String(admin?.user?.username || admin?.user?.name || admin?.user?.id || '').trim();
      await markFirstRechargeReissueCharacterIssued(userId, targetName, player.realmId || rowRealmId, { source: 'admin_reissue_all', operator });
      await markFirstRechargeRewardIssued(userId, { source: 'admin_reissue_all', operator, charName: targetName });
      await markFirstRechargeRewardIssuedByRealm(userId, player.realmId || rowRealmId, { source: 'admin_reissue_all', operator, charName: targetName });
      stats.success += 1;
    } catch (err) {
      stats.failed += 1;
      failures.push(`uid=${userId}:${err?.message || err}`);
    }
  }
  res.json({
    ok: true,
    preferredRealmId: preferredRealmId || null,
    ...stats,
    failures: failures.slice(0, 20)
  });
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

app.get('/admin/vip/claim-limit-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const enabled = await getVipClaimLimitEnabled();
  res.json({ ok: true, enabled });
});

app.post('/admin/vip/claim-limit-toggle', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { enabled } = req.body || {};
  await setVipClaimLimitEnabled(enabled === true);
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

app.get('/admin/state-throttle-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const enabled = await getStateThrottleEnabled();
  const intervalSec = await getStateThrottleIntervalSec();
  const overrideServerAllowed = await getStateThrottleOverrideServerAllowed();
  const cacheMonsterHealth = await getCacheMonsterHealthEnabled();
  res.json({ ok: true, enabled, intervalSec, overrideServerAllowed, cacheMonsterHealth });
});

app.post('/admin/state-throttle-toggle', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { enabled, intervalSec, overrideServerAllowed, cacheMonsterHealth } = req.body || {};
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
  if (cacheMonsterHealth !== undefined) {
    await setCacheMonsterHealthEnabled(cacheMonsterHealth === true);
  }
  stateThrottleCachedValue = nextEnabled;
  stateThrottleLastUpdate = Date.now();
  const intervalValue = await getStateThrottleIntervalSec();
  const overrideAllowed = await getStateThrottleOverrideServerAllowed();
  const cacheMonsterHealthValue = await getCacheMonsterHealthEnabled();
  res.json({ ok: true, enabled: nextEnabled, intervalSec: intervalValue, overrideServerAllowed: overrideAllowed, cacheMonsterHealth: cacheMonsterHealthValue });
});

// 缓存怪物血量开关独立接口（便于单独控制）
app.get('/admin/cache-monster-health-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const enabled = await getCacheMonsterHealthEnabled();
  res.json({ ok: true, enabled });
});

app.post('/admin/cache-monster-health-toggle', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { enabled } = req.body || {};
  const nextEnabled = enabled === true;
  await setCacheMonsterHealthEnabled(nextEnabled);
  res.json({ ok: true, enabled: nextEnabled });
});

app.get('/admin/consign-expire-status', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  res.json({ ok: true, hours: 48, fixed: true });
});

app.post('/admin/consign-expire-update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  res.status(400).json({ error: '寄售到期时间已固定为48小时，无需设置。' });
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

app.get('/admin/activity-point-shop', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    let raw = {};
    try {
      raw = await getSetting(ACTIVITY_POINT_SHOP_SETTING_KEY, '{}');
      if (typeof raw === 'string') raw = JSON.parse(raw || '{}');
    } catch {
      raw = {};
    }
    const config = normalizeActivityPointShopConfig(raw);
    const itemOptions = Object.values(ITEM_TEMPLATES || {})
      .filter((it) => it && it.id)
      .map((it) => ({
        id: String(it.id),
        name: String(it.name || it.id),
        type: String(it.type || 'unknown')
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    res.json({ ok: true, config, itemOptions });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/activity-point-shop/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    const config = validateActivityPointShopConfig(payload);
    await setSetting(ACTIVITY_POINT_SHOP_SETTING_KEY, JSON.stringify(config));
    activityPointShopConfigCache = expandActivityPointShopConfigForRuntime(config);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
});

app.get('/admin/harvest-season-rewards', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await loadHarvestSeasonRewardConfigFromDb();
    const itemOptions = Object.values(ITEM_TEMPLATES || {})
      .filter((it) => it && it.id)
      .map((it) => ({
        id: String(it.id),
        name: String(it.name || it.id),
        type: String(it.type || 'unknown')
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    res.json({ ok: true, config, itemOptions });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.get('/admin/harvest-season-sign', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await loadHarvestSeasonSignConfigFromDb();
    const itemOptions = Object.values(ITEM_TEMPLATES || {})
      .filter((it) => it && it.id)
      .map((it) => ({
        id: String(it.id),
        name: String(it.name || it.id),
        type: String(it.type || 'unknown')
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    res.json({ ok: true, config, itemOptions });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/harvest-season-rewards/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    const config = validateHarvestSeasonRewardConfig(payload);
    await setSetting(HARVEST_SEASON_REWARD_SETTING_KEY, JSON.stringify(config));
    setHarvestSeasonRewardConfig(config);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
});

app.post('/admin/harvest-season-sign/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    const config = validateHarvestSeasonSignConfig(payload);
    await setSetting(HARVEST_SEASON_SIGN_SETTING_KEY, JSON.stringify(config));
    setHarvestSeasonSignConfig(config);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
});
app.get('/admin/divine-beast-fragment-exchange', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await getDivineBeastFragmentExchangeConfigCached(true);
    const beastOptions = getDivineBeastSpeciesOptions().map((it) => ({ id: it.id, name: it.name }));
    res.json({ ok: true, config, beastOptions });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/divine-beast-fragment-exchange/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    const config = validateDivineBeastFragmentExchangeConfig(payload);
    await setSetting(DIVINE_BEAST_FRAGMENT_EXCHANGE_SETTING_KEY, JSON.stringify(config));
    divineBeastFragmentExchangeConfigCache = config;
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
});

app.get('/admin/equipment-recycle-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    await loadEquipmentRecycleConfigFromDb();
    const config = getEquipmentRecycleExchangeConfig();
    const itemOptions = Object.values(ITEM_TEMPLATES || {})
      .filter((it) => it && it.id)
      .map((it) => ({
        id: String(it.id),
        name: String(it.name || it.id),
        type: String(it.type || 'unknown')
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    res.json({ ok: true, config, itemOptions });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/equipment-recycle-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    setEquipmentRecycleExchangeConfig(payload);
    const runtimeConfig = getEquipmentRecycleExchangeConfig();
    await setSetting(EQUIPMENT_RECYCLE_SETTING_KEY, JSON.stringify(runtimeConfig));
    res.json({ ok: true, config: runtimeConfig });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
});

app.get('/admin/guild-system-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await loadGuildSystemConfig();
    const itemOptions = Object.values(ITEM_TEMPLATES || {})
      .filter((it) => it && it.id)
      .map((it) => ({
        id: String(it.id),
        name: String(it.name || it.id),
        type: String(it.type || 'unknown')
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    res.json({ ok: true, config, itemOptions });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/guild-system-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    const config = await setGuildSystemConfig(payload);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
});

app.get('/admin/guild-building-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const config = await loadGuildBuildingConfig(true);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/guild-building-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = req.body?.config ?? req.body ?? {};
    const config = await setGuildBuildingConfig(payload);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || '保存失败' });
  }
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
    const petDropRate = await getPetTrainingFruitDropRateDb();
    res.json({ ok: true, coefficient, dropRate, petDropRate });
  } catch (err) {
    console.error('修炼果配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/training-fruit-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const { coefficient, dropRate, petDropRate } = req.body || {};
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
  if (petDropRate !== undefined) {
    const parsed = Number(petDropRate);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      return res.status(400).json({ error: '宠物修炼果爆率必须为有效数字且在0到1之间' });
    }
    await setPetTrainingFruitDropRateDb(parsed);
  }
  // 更新内存中的配置
  const newCoefficient = await getTrainingFruitCoefficientDb();
  const newDropRate = await getTrainingFruitDropRateDb();
  const newPetDropRate = await getPetTrainingFruitDropRateDb();
  setTrainingFruitCoefficient(newCoefficient);
  setTrainingFruitDropRateConfig(newDropRate);
  setPetTrainingFruitDropRateConfig(newPetDropRate);
  res.json({ ok: true, coefficient: newCoefficient, dropRate: newDropRate, petDropRate: newPetDropRate });
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

// 终极装备成长配置
function withUltimateGrowthMaterialNames(config = {}) {
  const cfg = config && typeof config === 'object' ? config : {};
  const materialId = String(cfg.materialId || '').trim();
  const breakthroughMaterialId = String(cfg.breakthroughMaterialId || '').trim();
  return {
    ...cfg,
    materialName: ITEM_TEMPLATES[materialId]?.name || materialId || '材料',
    breakthroughMaterialName: ITEM_TEMPLATES[breakthroughMaterialId]?.name || breakthroughMaterialId || '突破材料'
  };
}

app.get('/admin/ultimate-growth-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const dbConfig = await getUltimateGrowthConfigDb();
  if (dbConfig && typeof dbConfig === 'object') {
    setUltimateGrowthConfigMem(dbConfig);
    const normalized = getUltimateGrowthConfigMem();
    const materialId = String(normalized.materialId || '').trim();
    const materialTpl = ITEM_TEMPLATES[materialId];
    if (!materialTpl?.noDrop) {
      normalized.materialId = 'ultimate_growth_stone';
    }
    const breakthroughMaterialId = String(normalized.breakthroughMaterialId || '').trim();
    const breakthroughTpl = ITEM_TEMPLATES[breakthroughMaterialId];
    if (!breakthroughTpl?.noDrop) {
      normalized.breakthroughMaterialId = 'ultimate_growth_break_stone';
    }
    if (!materialTpl?.noDrop || !breakthroughTpl?.noDrop) {
      setUltimateGrowthConfigMem(normalized);
      await setUltimateGrowthConfigDb(normalized);
    }
  }
  res.json({ ok: true, settings: withUltimateGrowthMaterialNames(getUltimateGrowthConfigMem()) });
});

app.post('/admin/ultimate-growth-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const incoming = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : req.body;
  const previous = getUltimateGrowthConfigMem();
  setUltimateGrowthConfigMem(incoming || {});
  const normalized = getUltimateGrowthConfigMem();
  const materialId = String(normalized.materialId || '').trim();
  const materialTpl = ITEM_TEMPLATES[materialId];
  if (!materialId || !materialTpl) {
    setUltimateGrowthConfigMem(previous);
    return res.status(400).json({ error: '成长材料配置无效，请选择存在的物品。' });
  }
  if (!materialTpl.noDrop) {
    setUltimateGrowthConfigMem(previous);
    return res.status(400).json({ error: '成长材料必须是不可掉落(noDrop)道具。' });
  }
  const breakthroughMaterialId = String(normalized.breakthroughMaterialId || '').trim();
  const breakthroughTpl = ITEM_TEMPLATES[breakthroughMaterialId];
  if (!breakthroughMaterialId || !breakthroughTpl) {
    setUltimateGrowthConfigMem(previous);
    return res.status(400).json({ error: '突破材料配置无效，请选择存在的物品。' });
  }
  if (!breakthroughTpl.noDrop) {
    setUltimateGrowthConfigMem(previous);
    return res.status(400).json({ error: '突破材料必须是不可掉落(noDrop)道具。' });
  }
  await setUltimateGrowthConfigDb(normalized);
  res.json({ ok: true, settings: withUltimateGrowthMaterialNames(normalized) });
});

// 法宝系统配置
app.get('/admin/treasure-settings', async (req, res) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: '无管理员权限。' });
    const slotCount = await getTreasureSlotCountDb();
    const maxLevel = await getTreasureMaxLevelDb();
    const upgradeConsume = await getTreasureUpgradeConsumeDb();
    const advanceConsume = await getTreasureAdvanceConsumeDb();
    const advancePerStage = await getTreasureAdvancePerStageDb();
    const advanceEffectBonusPerStack = await getTreasureAdvanceEffectBonusPerStackDb();
    const worldBossDropMultiplier = await getTreasureWorldBossDropMultiplierDb();
    const crossWorldBossDropMultiplier = await getTreasureCrossWorldBossDropMultiplierDb();
    const towerXuanmingDropChance = await getTreasureTowerXuanmingDropChanceDb();
    res.json({
      ok: true,
      slotCount,
      maxLevel,
      upgradeConsume,
      advanceConsume,
      advancePerStage,
      advanceEffectBonusPerStack,
      worldBossDropMultiplier,
      crossWorldBossDropMultiplier,
      towerXuanmingDropChance
    });
  } catch (err) {
    console.error('法宝配置加载失败:', err);
    res.status(500).json({ error: err.message || '加载失败' });
  }
});

app.post('/admin/treasure-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const {
    slotCount,
    maxLevel,
    upgradeConsume,
    advanceConsume,
    advancePerStage,
    advanceEffectBonusPerStack,
    worldBossDropMultiplier,
    crossWorldBossDropMultiplier,
    towerXuanmingDropChance
  } = req.body || {};

  if (slotCount !== undefined) {
    const parsed = Number(slotCount);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return res.status(400).json({ error: '法宝槽位必须为正整数' });
    }
    await setTreasureSlotCountDb(parsed);
  }
  if (maxLevel !== undefined) {
    const parsed = Number(maxLevel);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return res.status(400).json({ error: '法宝等级上限必须为正整数' });
    }
    await setTreasureMaxLevelDb(parsed);
  }
  if (upgradeConsume !== undefined) {
    const parsed = Number(upgradeConsume);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return res.status(400).json({ error: '法宝升级消耗必须为正整数' });
    }
    await setTreasureUpgradeConsumeDb(parsed);
  }
  if (advanceConsume !== undefined) {
    const parsed = Number(advanceConsume);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return res.status(400).json({ error: '法宝升段消耗必须为正整数' });
    }
    await setTreasureAdvanceConsumeDb(parsed);
  }
  if (advancePerStage !== undefined) {
    const parsed = Number(advancePerStage);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return res.status(400).json({ error: '每阶所需段数必须为正整数' });
    }
    await setTreasureAdvancePerStageDb(parsed);
  }
  if (advanceEffectBonusPerStack !== undefined) {
    const parsed = Number(advanceEffectBonusPerStack);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res.status(400).json({ error: '每段加成必须为大于等于0的数字' });
    }
    await setTreasureAdvanceEffectBonusPerStackDb(parsed);
  }
  if (worldBossDropMultiplier !== undefined) {
    const parsed = Number(worldBossDropMultiplier);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res.status(400).json({ error: '世界BOSS法宝掉率倍率必须为大于等于0的数字' });
    }
    await setTreasureWorldBossDropMultiplierDb(parsed);
  }
  if (crossWorldBossDropMultiplier !== undefined) {
    const parsed = Number(crossWorldBossDropMultiplier);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res.status(400).json({ error: '跨服BOSS法宝掉率倍率必须为大于等于0的数字' });
    }
    await setTreasureCrossWorldBossDropMultiplierDb(parsed);
  }
  if (towerXuanmingDropChance !== undefined) {
    const parsed = Number(towerXuanmingDropChance);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      return res.status(400).json({ error: '浮图塔玄冥掉率必须在0到1之间' });
    }
    await setTreasureTowerXuanmingDropChanceDb(parsed);
  }

  const newSlotCount = await getTreasureSlotCountDb();
  const newMaxLevel = await getTreasureMaxLevelDb();
  const newUpgradeConsume = await getTreasureUpgradeConsumeDb();
  const newAdvanceConsume = await getTreasureAdvanceConsumeDb();
  const newAdvancePerStage = await getTreasureAdvancePerStageDb();
  const newAdvanceEffectBonusPerStack = await getTreasureAdvanceEffectBonusPerStackDb();
  const newWorldBossDropMultiplier = await getTreasureWorldBossDropMultiplierDb();
  const newCrossWorldBossDropMultiplier = await getTreasureCrossWorldBossDropMultiplierDb();
  const newTowerXuanmingDropChance = await getTreasureTowerXuanmingDropChanceDb();

  setTreasureSlotCount(newSlotCount);
  setTreasureMaxLevel(newMaxLevel);
  setTreasureUpgradeConsume(newUpgradeConsume);
  setTreasureAdvanceConsume(newAdvanceConsume);
  setTreasureAdvancePerStage(newAdvancePerStage);
  setTreasureAdvanceEffectBonusPerStack(newAdvanceEffectBonusPerStack);
  setTreasureWorldBossDropMultiplier(newWorldBossDropMultiplier);
  setTreasureCrossWorldBossDropMultiplier(newCrossWorldBossDropMultiplier);
  setTreasureTowerXuanmingDropChance(newTowerXuanmingDropChance);

  res.json({
    ok: true,
    slotCount: newSlotCount,
    maxLevel: newMaxLevel,
    upgradeConsume: newUpgradeConsume,
    advanceConsume: newAdvanceConsume,
    advancePerStage: newAdvancePerStage,
    advanceEffectBonusPerStack: newAdvanceEffectBonusPerStack,
    worldBossDropMultiplier: newWorldBossDropMultiplier,
    crossWorldBossDropMultiplier: newCrossWorldBossDropMultiplier,
    towerXuanmingDropChance: newTowerXuanmingDropChance
  });
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

// 宠物系统配置
app.get('/admin/pet-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  res.json({ ok: true, settings: getPetSettingsSnapshot() });
});

app.post('/admin/pet-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const normalized = await applyPetSettings(req.body?.settings, { persist: true });
    res.json({ ok: true, settings: normalized });
  } catch (err) {
    res.status(400).json({ error: err.message || '宠物设置更新失败' });
  }
});

app.post('/admin/pet-settings/reset-skill-effects', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const current = getPetSettingsSnapshot();
    const normalized = await applyPetSettings(
      { ...current, skillEffects: { ...DEFAULT_PET_SKILL_EFFECTS } },
      { persist: true }
    );
    res.json({ ok: true, settings: normalized });
  } catch (err) {
    res.status(400).json({ error: err.message || '重置宠物技能说明失败' });
  }
});

// SMTP配置
app.get('/admin/smtp-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const settings = await getSmtpSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message || '加载SMTP配置失败' });
  }
});

app.post('/admin/smtp-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const settings = req.body?.settings || {};
    await saveSmtpSettings(settings);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message || 'SMTP配置更新失败' });
  }
});

app.post('/admin/smtp-settings/test', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const settings = req.body?.settings || {};
    const { host, port, secure, user, password } = settings;
    if (!host || !user || !password) {
      return res.status(400).json({ error: 'SMTP配置不完整，请填写服务器地址、用户名和密码' });
    }
    const nodemailer = await import('nodemailer');
    const portNum = Number(port) || 587;
    // 根据端口自动设置 secure：465 端口使用 SSL，其他端口使用 STARTTLS
    const useSecure = secure === true || portNum === 465;
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: useSecure,
      auth: { user, pass: password }
    });
    await transporter.verify();
    res.json({ ok: true, message: 'SMTP连接测试成功' });
  } catch (err) {
    let errorMsg = err.message || 'SMTP连接测试失败';
    // 提供更友好的错误提示
    if (errorMsg.includes('wrong version number') || errorMsg.includes('SSL')) {
      errorMsg = `SSL/TLS 配置错误。端口 ${settings.port || 587} 与 secure 设置不匹配。建议：端口 587/25 使用 secure=false (STARTTLS)，端口 465 使用 secure=true (SSL)`;
    }
    res.status(400).json({ error: errorMsg });
  }
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
app.get('/admin/personalboss-settings', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const vip = await getPersonalBossTierSettings('vip');
  const svip = await getPersonalBossTierSettings('svip');
  res.json({
    ok: true,
    vip,
    svip,
    svipPermanentSharesSvip: true
  });
});

app.post('/admin/personalboss-settings/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  const data = req.body || {};
  const toTierPayload = (payload, fallback) => ({
    hp: Math.max(1, Math.floor(Number(payload?.hp) || fallback.hp)),
    atk: Math.max(1, Math.floor(Number(payload?.atk) || fallback.atk)),
    def: Math.max(0, Math.floor(Number(payload?.def) || fallback.def)),
    mdef: Math.max(0, Math.floor(Number(payload?.mdef) || fallback.mdef)),
    exp: Math.max(1, Math.floor(Number(payload?.exp) || fallback.exp)),
    gold: Math.max(0, Math.floor(Number(payload?.gold) || fallback.gold)),
    respawnMinutes: Math.max(1, Math.floor(Number(payload?.respawnMinutes) || fallback.respawnMinutes)),
    dropBonus: (() => {
      const parsed = Number(payload?.dropBonus);
      if (!Number.isFinite(parsed)) return fallback.dropBonus;
      return Math.max(0, parsed);
    })()
  });
  const currentVip = await getPersonalBossTierSettings('vip');
  const currentSvip = await getPersonalBossTierSettings('svip');
  const vipPayload = toTierPayload(data.vip || {}, currentVip);
  const svipPayload = toTierPayload(data.svip || {}, currentSvip);

  const saveTier = async (tier, payload) => {
    const prefix = `personal_boss_${tier}`;
    await setSetting(`${prefix}_hp`, String(payload.hp));
    await setSetting(`${prefix}_atk`, String(payload.atk));
    await setSetting(`${prefix}_def`, String(payload.def));
    await setSetting(`${prefix}_mdef`, String(payload.mdef));
    await setSetting(`${prefix}_exp`, String(payload.exp));
    await setSetting(`${prefix}_gold`, String(payload.gold));
    await setSetting(`${prefix}_respawn_minutes`, String(payload.respawnMinutes));
    await setSetting(`${prefix}_drop_bonus`, String(payload.dropBonus));
  };

  await saveTier('vip', vipPayload);
  await saveTier('svip', svipPayload);
  await applyPersonalBossSettings();

  res.json({
    ok: true,
    vip: await getPersonalBossTierSettings('vip'),
    svip: await getPersonalBossTierSettings('svip'),
    svipPermanentSharesSvip: true
  });
});

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

app.get('/admin/route-lines', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  if (!Array.isArray(ROUTE_LINES_CONFIG) || ROUTE_LINES_CONFIG.length <= 0) {
    await loadRouteLinesConfig();
  }
  const lines = getRouteLinesConfigSnapshot();
  res.json({ ok: true, count: lines.length, lines });
});

app.post('/admin/route-lines/update', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });
  try {
    const payload = Array.isArray(req.body?.lines) ? req.body.lines : (req.body || []);
    const lines = await setRouteLinesConfig(payload);
    res.json({ ok: true, count: lines.length, lines: getRouteLinesConfigSnapshot() });
  } catch (err) {
    res.status(400).json({ error: err?.message || '线路配置保存失败' });
  }
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
      const maxSabakRow = await trx('sabak_state').max({ maxId: 'id' }).first();
      const nextSabakId = Math.max(1, Math.floor(Number(maxSabakRow?.maxId || 0) || 0) + 1);
      await trx('sabak_state').insert({
        id: nextSabakId,
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
        player.socket?.disconnect?.();
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
    // 先处理“同账号同角色名”在目标区的冲突，避免更新 realm_id 时撞唯一索引
    const sourceCharacters = await trx('characters')
      .where({ realm_id: sourceId })
      .select('id', 'user_id', 'name');
    const targetCharacters = await trx('characters')
      .where({ realm_id: targetId })
      .select('user_id', 'name');
    const targetNameSet = new Set(
      targetCharacters.map((row) => `${Number(row.user_id || 0)}::${String(row.name || '')}`)
    );
    const sourceNameSet = new Set(
      sourceCharacters.map((row) => `${Number(row.user_id || 0)}::${String(row.name || '')}`)
    );
    const sourceRenameMap = new Map();
    const pendingRenamedKeys = new Set();
    const buildMergedCharacterName = (originalName, userId) => {
      const rawBase = String(originalName || '').trim() || '角色';
      const suffixBase = `-${sourceId}`;
      let candidate = `${rawBase}${suffixBase}`;
      let seq = 1;
      const makeKey = (name) => `${Number(userId || 0)}::${name}`;
      while (
        targetNameSet.has(makeKey(candidate)) ||
        sourceNameSet.has(makeKey(candidate)) ||
        pendingRenamedKeys.has(makeKey(candidate))
      ) {
        const seqSuffix = `-${sourceId}-${seq}`;
        const maxBaseLen = Math.max(1, 64 - seqSuffix.length);
        candidate = `${rawBase.slice(0, maxBaseLen)}${seqSuffix}`;
        seq += 1;
      }
      return candidate.slice(0, 64);
    };

    for (const row of sourceCharacters) {
      const key = `${Number(row.user_id || 0)}::${String(row.name || '')}`;
      if (!targetNameSet.has(key)) continue;
      const nextName = buildMergedCharacterName(row.name, row.user_id);
      sourceRenameMap.set(`${Number(row.user_id || 0)}::${String(row.name || '')}`, nextName);
      targetNameSet.add(`${Number(row.user_id || 0)}::${nextName}`);
      sourceNameSet.add(`${Number(row.user_id || 0)}::${nextName}`);
      pendingRenamedKeys.add(`${Number(row.user_id || 0)}::${nextName}`);
    }

    for (const row of sourceCharacters) {
      const mapKey = `${Number(row.user_id || 0)}::${String(row.name || '')}`;
      const nextName = sourceRenameMap.get(mapKey);
      if (!nextName || nextName === row.name) continue;
      await trx('characters').where({ id: row.id }).update({ name: nextName });
      await trx('guild_members')
        .where({ user_id: row.user_id, realm_id: sourceId, char_name: row.name })
        .update({ char_name: nextName });
      await trx('guilds')
        .where({ leader_user_id: row.user_id, realm_id: sourceId, leader_char_name: row.name })
        .update({ leader_char_name: nextName });
      if (await trx.schema.hasTable('guild_applications')) {
        await trx('guild_applications')
          .where({ user_id: row.user_id, realm_id: sourceId, char_name: row.name })
          .update({ char_name: nextName, applied_at: trx.fn.now() });
      }
    }

    // 更新角色
    const charactersResult = await trx('characters').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.characters = charactersResult;

    // 更新行会
    const guildsResult = await trx('guilds').where({ realm_id: sourceId }).update({ realm_id: targetId });
    stats.guilds = guildsResult;

    // 更新行会成员
    await trx('guild_members').where({ realm_id: sourceId }).update({ realm_id: targetId });

    // 更新行会申请
    if (await trx.schema.hasTable('guild_applications')) {
      await trx('guild_applications').where({ realm_id: sourceId }).update({ realm_id: targetId });
    }

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

    // 合区后清空目标区所有角色的队伍状态，避免遗留旧队伍成员/旧队伍ID
    const mergedCharacters = await trx('characters')
      .where({ realm_id: targetId })
      .select('id', 'flags_json');
    for (const row of mergedCharacters) {
      const flags = parseJson(row.flags_json, {}) || {};
      if (!flags || typeof flags !== 'object') continue;
      delete flags.partyId;
      delete flags.partyMembers;
      delete flags.partyLeader;
      await trx('characters')
        .where({ id: row.id })
        .update({ flags_json: JSON.stringify(flags), updated_at: trx.fn.now() });
    }

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

  // 返回结果，不包含备份数据（数据量太大，前端通过单独接口下载）
  res.json({
    ok: true,
    sourceId,
    targetId,
      message: `合区完成。角色: ${stats.characters}, 行会: ${stats.guilds}, 邮件: ${stats.mails}, 寄售: ${stats.consignments}, 寄售历史: ${stats.consignmentHistory}, 沙巴克报名: ${stats.sabakRegistrations}。区服ID保持原值不重排。源区与目标区玩家连接已断开，请重新进入游戏。`,
    backupAvailable: true
  });
});

// 自动备份功能
const BACKUP_DIR = path.join(__dirname, '../data/backup');
const BACKUP_RETENTION_DAYS = 30;
const CONSIGNMENT_HISTORY_RETENTION_DAYS = Math.max(1, Math.floor(Number(config.consignmentHistoryRetentionDays || 90)));

async function cleanupConsignmentHistory() {
  try {
    const cutoff = new Date(Date.now() - CONSIGNMENT_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await knex('consignment_history')
      .where('sold_at', '<', cutoff)
      .del();
    if (deleted > 0) {
      console.log(`[ConsignmentHistory] deleted ${deleted} rows older than ${CONSIGNMENT_HISTORY_RETENTION_DAYS} days`);
    }
  } catch (err) {
    console.error('[ConsignmentHistory] cleanup failed:', err);
  }
}

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
    await import('node:fs/promises').then(fs => fs.writeFile(backupFilePath, JSON.stringify(payload)));
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
    await cleanupConsignmentHistory();
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
    try {
      await syncZhuxianTowerTopTitleForRealm(realm.id);
    } catch (err) {
      console.error(`[Rank] 更新${realm.name} 浮图塔第一称号失败:`, err);
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
      const normalizedRows = normalizeImportRows(name, rows);
      if (normalizedRows.length !== rows.length) {
        console.warn(`[import][${name}] deduped ${rows.length - normalizedRows.length} duplicate rows before insert`);
      }
      const chunks = chunkRowsForInsert(normalizedRows, {
        maxRows: config.db.client === 'sqlite' ? 200 : 100,
        maxBytes: config.db.client === 'sqlite' ? 2 * 1024 * 1024 : 512 * 1024
      });
      for (const chunk of chunks) {
        try {
          if (name === 'characters') {
            await trx(name)
              .insert(chunk)
              .onConflict(['user_id', 'name', 'realm_id'])
              .merge();
          } else {
            await trx(name).insert(chunk);
          }
        } catch (err) {
          const detail = err?.sqlMessage || err?.message || String(err);
          throw new Error(`[import][${name}] ${detail}`);
        }
      }
      counts[name] = normalizedRows.length;
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

// 导出全部装备（含掉落配置）
app.get('/admin/items/export', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  try {
    const items = await exportAllItemsDb();
    const payload = {
      meta: {
        version: 1,
        exported_at: new Date().toISOString(),
        total_items: items.length
      },
      items
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"items-export-${stamp}.json\"`);
    res.send(JSON.stringify(payload));
  } catch (err) {
    res.status(500).json({ error: '导出装备失败: ' + err.message });
  }
});

// 从JSON导入全部装备（含掉落配置）
app.post('/admin/items/import-all', async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: '无管理员权限。' });

  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!rawItems.length) {
    return res.status(400).json({ error: '导入数据为空或格式错误。' });
  }

  const result = {
    created: 0,
    updated: 0,
    dropsUpdated: 0,
    failed: []
  };

  for (const raw of rawItems) {
    try {
      const itemId = String(raw?.item_id || '').trim();
      const name = String(raw?.name || '').trim();
      const type = String(raw?.type || '').trim();
      if (!itemId || !name || !type) {
        throw new Error('缺少 item_id/name/type');
      }

      const payload = {
        item_id: itemId,
        name,
        type,
        slot: raw?.slot ?? null,
        rarity: raw?.rarity || 'common',
        atk: Math.floor(Number(raw?.atk || 0)),
        def: Math.floor(Number(raw?.def || 0)),
        mag: Math.floor(Number(raw?.mag || 0)),
        spirit: Math.floor(Number(raw?.spirit || 0)),
        hp: Math.floor(Number(raw?.hp || 0)),
        mp: Math.floor(Number(raw?.mp || 0)),
        mdef: Math.floor(Number(raw?.mdef || 0)),
        dex: Math.floor(Number(raw?.dex || 0)),
        price: Math.floor(Number(raw?.price || 0)),
        untradable: Boolean(raw?.untradable),
        unconsignable: Boolean(raw?.unconsignable),
        boss_only: Boolean(raw?.boss_only),
        world_boss_only: Boolean(raw?.world_boss_only),
        cross_world_boss_only: Boolean(raw?.cross_world_boss_only)
      };

      const existing = await getItemByItemId(itemId);
      let itemRow;
      if (existing) {
        itemRow = await updateItemDb(existing.id, payload);
        result.updated += 1;
      } else {
        itemRow = await createItemDb(payload);
        result.created += 1;
      }

      const drops = Array.isArray(raw?.drops) ? raw.drops : [];
      if (itemRow?.id) {
        const normalizedDrops = drops
          .map((d) => ({
            mob_id: String(d?.mob_id || '').trim(),
            drop_chance: Number(d?.drop_chance || 0)
          }))
          .filter((d) => d.mob_id && Number.isFinite(d.drop_chance) && d.drop_chance >= 0);
        await setItemDropsDb(itemRow.id, normalizedDrops);
        result.dropsUpdated += normalizedDrops.length;
      }
    } catch (err) {
      result.failed.push({
        item_id: raw?.item_id || null,
        reason: err.message || '未知错误'
      });
    }
  }

  res.json({ ok: true, result });
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
const mobStatePersistCache = new Map();
let realmCache = [];
// 房间玩家列表缓存
const roomPlayersCache = new Map();
const ROOM_PLAYERS_CACHE_TTL = 500; // 500ms缓存
const ROOM_PLAYERS_CACHE_MAX_SIZE = 1000; // LRU 限制：最多保留1000个房间
// 玩家状态缓存（用于减少buildState计算量）
const playerStateCache = new WeakMap();
const PLAYER_STATE_CACHE_TTL = 100; // 100ms缓存
const RUNTIME_HEALTH_INTERVAL_MS = 60 * 1000;
const RUNTIME_CACHE_CLEANUP_COOLDOWN_MS = 15 * 1000;
const RUNTIME_HEAP_WARN_RATIO = 0.92;
const RUNTIME_HEAP_CRITICAL_RATIO = 0.96;
const RUNTIME_LAG_WARN_MS = 180;
const RUNTIME_LAG_CRITICAL_MS = 320;
const RUNTIME_MOB_ROWS_SAMPLE_INTERVAL_MS = 5 * 60 * 1000;
const RUNTIME_GUARD_HOLD_NORMAL_MS = 2 * 60 * 1000;
const RUNTIME_GUARD_HOLD_AGGRESSIVE_MS = 4 * 60 * 1000;
let runtimeHealthTimer = null;
let runtimeHealthExpectedAt = 0;
let runtimeCacheCleanupLastAt = 0;
let runtimeGuardMode = 'off';
let runtimeGuardUntilAt = 0;

function activateRuntimeGuard(mode, holdMs, now = Date.now()) {
  const normalizedMode = mode === 'aggressive' ? 'aggressive' : 'normal';
  const ttl = Math.max(1000, Math.floor(Number(holdMs || 0)));
  runtimeGuardMode = normalizedMode;
  runtimeGuardUntilAt = Math.max(runtimeGuardUntilAt, now + ttl);
}

function getRuntimeGuardMode(now = Date.now()) {
  if (now < runtimeGuardUntilAt) {
    return runtimeGuardMode;
  }
  return 'off';
}

// 获取缓存的房间玩家列表
function getCachedRoomPlayers(realmId, zoneId, roomId) {
  const cacheKey = `${realmId}:${zoneId}:${roomId}`;
  const now = Date.now();
  const cached = roomPlayersCache.get(cacheKey);
  if (cached && now - cached.at < ROOM_PLAYERS_CACHE_TTL) {
    return cached.data;
  }
  const players = listConnectedPlayers(realmId)
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
  roomPlayersCache.set(cacheKey, { at: now, data: players });
  ensureMapSizeLimit(roomPlayersCache, ROOM_PLAYERS_CACHE_MAX_SIZE);
  return players;
}
let runtimeMobRowsCacheAt = 0;
let runtimeMobRowsCachedValue = 'n/a';
const STARTUP_MOB_CLEANUP_BATCH_SIZE = 1000;
const STARTUP_MOB_CLEANUP_DELAY_MS = 250;
const MOB_RESPAWN_CLEANUP_BATCH_SIZE = 2000;
const MOB_RESPAWN_CLEANUP_MAX_ROUNDS = 6;
const MOB_RESPAWN_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

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
const ZHUXIAN_TOWER_ZONE_ID = 'zxft';
const ZHUXIAN_TOWER_ENTRY_ROOM_ID = 'entry';
const PERSONAL_BOSS_ZONE_ID = 'pboss';
const ZHUXIAN_TOWER_REWARD_ITEM_ID = 'treasure_exp_material';
const ZHUXIAN_TOWER_TOP1_TITLE = '我是爬塔小能手';
const ZHUXIAN_TOWER_XUANMING_DROPS = ['treasure_xuanwu_core', 'treasure_taiyin_mirror', 'treasure_guiyuan_bead', 'treasure_xuanshuang_wall', 'treasure_beiming_armor', 'treasure_hanyuan_stone'];

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

function hasActiveSocket(player) {
  return Boolean(player?.socket?.emit);
}

function listConnectedPlayers(realmId = null) {
  return listOnlinePlayers(realmId).filter((p) => hasActiveSocket(p));
}

function isManagedHostedPlayer(player) {
  return Boolean(player && !player.socket && (player.flags?.offlineManagedAuto || player.flags?.offlineManagedPending));
}

const MANAGED_HEAVY_FIELD_KEYS = ['warehouse', 'quests'];

function compactManagedPlayerState(player) {
  if (!player || !isManagedHostedPlayer(player)) return;
  let stash = player.__managedHeavy;
  if (!stash || typeof stash !== 'object') stash = {};
  let changed = false;
  for (const key of MANAGED_HEAVY_FIELD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(player, key)) {
      stash[key] = player[key];
      delete player[key];
      changed = true;
    }
  }
  if (!changed) return;
  Object.defineProperty(player, '__managedHeavy', {
    value: stash,
    writable: true,
    configurable: true,
    enumerable: false
  });
}

function restoreManagedPlayerState(player) {
  if (!player || !player.__managedHeavy || typeof player.__managedHeavy !== 'object') return false;
  const stash = player.__managedHeavy;
  for (const key of MANAGED_HEAVY_FIELD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(stash, key)) {
      player[key] = stash[key];
    }
  }
  return true;
}

function makeManagedPlayerKey(player) {
  const realmId = Math.max(1, Math.floor(Number(player?.realmId || 1) || 1));
  const userId = Math.max(0, Math.floor(Number(player?.userId || 0) || 0));
  const name = String(player?.name || '').trim();
  return `managed:${realmId}:${userId}:${name}`;
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
  if (!player?.socket?.emit) return;
  player.socket.emit('output', { text: message });
}

function sendToRoom(realmId, zoneId, roomId, message) {
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const roomPlayers = listConnectedPlayers(effectiveRealmId)
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

const RARITY_RANK = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  supreme: 6,
  ultimate: 7
};

function filterDropsByMaxRarity(drops, maxRarity) {
  if (!Array.isArray(drops) || !maxRarity) return Array.isArray(drops) ? drops : [];
  const maxRank = RARITY_RANK[maxRarity] || 0;
  if (!maxRank) return drops;
  return drops.filter((entry) => {
    const item = ITEM_TEMPLATES[entry?.id];
    if (!item) return false;
    const rarity = rarityByPrice(item);
    const rank = RARITY_RANK[rarity] || 0;
    return rank > 0 && rank <= maxRank;
  });
}

const ITEM_POOLS = (() => {
  const pools = { common: [], uncommon: [], rare: [], epic: [], legendary: [], supreme: [], ultimate: [] };
  Object.values(ITEM_TEMPLATES).forEach((item) => {
    if (item.type === 'currency') return;
    if (!['weapon', 'armor', 'accessory', 'book', 'material', 'consumable'].includes(item.type)) return;
    if (item.noDrop) return;
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
const COMMAND_STATE_STALE_MS = 30 * 60 * 1000;
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

function cleanupStaleCommandState(now = Date.now()) {
  for (const [key, entry] of commandRateState.entries()) {
    const start = Number(entry?.start || 0);
    if (!start || now - start > COMMAND_STATE_STALE_MS) {
      commandRateState.delete(key);
    }
  }
  for (const [key, last] of commandCooldownState.entries()) {
    const ts = Number(last || 0);
    if (!ts || now - ts > COMMAND_STATE_STALE_MS) {
      commandCooldownState.delete(key);
    }
  }
}

function cleanupMapByAge(map, now, maxAgeMs, getTimestamp) {
  if (!map || map.size <= 0) return 0;
  const maxAge = Math.max(0, Math.floor(Number(maxAgeMs || 0)));
  if (maxAge <= 0) return 0;
  let removed = 0;
  for (const [key, value] of map.entries()) {
    const ts = Number(getTimestamp(value, key) || 0);
    if (!ts || now - ts > maxAge) {
      map.delete(key);
      removed += 1;
    }
  }
  return removed;
}

function cleanupRuntimeCaches(options = {}) {
  const now = Date.now();
  const aggressive = Boolean(options?.aggressive);
  const result = {
    aggressive,
    removed: {
      roomStateData: 0,
      roomStateMeta: 0,
      roomStateTick: 0,
      autoFullRoom: 0,
      allCharacters: 0,
      dailyLucky: 0,
      towerRank: 0,
      playerLastPersistAt: 0,
      stateThrottle: 0,
      bossBloodStatus: 0
    }
  };

  // 清理BOSS血量公告状态：激进模式下清空，防止内存泄漏
  if (aggressive && bossBloodAnnouncementStatus.size > 100) {
    const keepSize = Math.floor(bossBloodAnnouncementStatus.size * 0.5); // 保留一半
    let count = 0;
    for (const key of bossBloodAnnouncementStatus.keys()) {
      if (count >= keepSize) {
        bossBloodAnnouncementStatus.delete(key);
        result.removed.bossBloodStatus += 1;
      }
      count += 1;
    }
  }

  const roomDataMaxAge = aggressive ? 1000 : 10000;
  const roomMetaMaxAge = aggressive ? 2500 : 20000;
  const roomTickMaxAge = aggressive ? 2500 : 30000;
  const autoFullMaxAge = aggressive ? Math.max(3000, Math.floor(AUTO_FULL_ROOM_CACHE_TTL * 0.5)) : (AUTO_FULL_ROOM_CACHE_TTL * 4);
  const allCharsMaxAge = aggressive ? Math.max(1500, Math.floor(ALL_CHAR_CACHE_TTL_MS * 0.5)) : (ALL_CHAR_CACHE_TTL_MS * 8);
  const dailyLuckyMaxAge = aggressive ? Math.max(5000, Math.floor(DAILY_LUCKY_CACHE_TTL * 0.5)) : (DAILY_LUCKY_CACHE_TTL * 4);
  const towerRankMaxAge = aggressive ? Math.max(5000, Math.floor(ZHUXIAN_TOWER_RANK_CACHE_TTL * 0.5)) : (ZHUXIAN_TOWER_RANK_CACHE_TTL * 4);
  const persistAtMaxAge = aggressive ? (60 * 60 * 1000) : (8 * 60 * 60 * 1000);
  const stateThrottleMaxAge = aggressive ? (5 * 60 * 1000) : (30 * 60 * 1000);

  result.removed.roomStateData = cleanupMapByAge(roomStateDataCache, now, roomDataMaxAge, (entry) => entry?.at);
  result.removed.roomStateMeta = cleanupMapByAge(
    roomStatePatchMetaCache,
    now,
    roomMetaMaxAge,
    (entry) => Math.max(Number(entry?.lastPlayersAt || 0), Number(entry?.lastMobsAt || 0), Number(entry?.lastRankAt || 0), Number(entry?.lastServerTimeAt || 0))
  );
  // 清理房间玩家缓存
  cleanupMapByAge(roomPlayersCache, now, aggressive ? 1000 : 5000, (entry) => entry?.at);
  result.removed.roomStateTick = cleanupMapByAge(roomStateCache, now, roomTickMaxAge, (ts) => ts);
  result.removed.autoFullRoom = cleanupMapByAge(autoFullRoomCache, now, autoFullMaxAge, (entry) => entry?.at);
  result.removed.allCharacters = cleanupMapByAge(allCharactersCache, now, allCharsMaxAge, (entry) => entry?.at);
  result.removed.dailyLucky = cleanupMapByAge(dailyLuckyCache, now, dailyLuckyMaxAge, (entry) => entry?.at);
  result.removed.towerRank = cleanupMapByAge(zhuxianTowerRankCache, now, towerRankMaxAge, (entry) => entry?.at);
  result.removed.playerLastPersistAt = cleanupMapByAge(playerLastPersistAt, now, persistAtMaxAge, (ts) => ts);

  let throttleRemoved = 0;
  for (const [key, ts] of stateThrottleLastSent.entries()) {
    const at = Number(ts || 0);
    if (!at || now - at > stateThrottleMaxAge) {
      stateThrottleLastSent.delete(key);
      stateThrottleLastExits.delete(key);
      stateThrottleLastRoom.delete(key);
      stateThrottleLastInBoss.delete(key);
      throttleRemoved += 1;
    }
  }
  result.removed.stateThrottle = throttleRemoved;

  runtimeCacheCleanupLastAt = now;
  return result;
}

function getMobPersistCacheKey(mob) {
  return `${mob.realmId || 1}:${mob.zoneId}:${mob.roomId}:${mob.slotIndex}`;
}

function getMobPersistStatus(status) {
  if (!status || typeof status !== 'object') return null;
  const next = { ...status };
  delete next.baseStats;
  delete next.scalingBaseStats;
  return Object.keys(next).length > 0 ? next : null;
}

function shouldPersistMobTemplate(mobTemplate) {
  const templateId = String(mobTemplate?.id || '');
  return Boolean(
    mobTemplate
    && (
      mobTemplate.worldBoss
      || mobTemplate.specialBoss
      || mobTemplate.sabakBoss
      || (mobTemplate.respawnMs && Number(mobTemplate.respawnMs) > 0)
      || templateId === 'vip_personal_boss'
      || templateId === 'svip_personal_boss'
      || templateId === 'cross_world_boss'
      || templateId.startsWith('cultivation_boss_')
      || templateId.includes('boss')
      || templateId.includes('leader')
      || templateId.includes('demon')
      || templateId === 'bug_queen'
      || templateId === 'huangquan'
    )
  );
}

function shouldPersistMobState(mob) {
  const mobTemplate = MOB_TEMPLATES[mob?.templateId];
  if (!shouldPersistMobTemplate(mobTemplate)) return false;
  const currentHp = Math.max(0, Math.floor(Number(mob?.currentHp || 0)));
  if (currentHp <= 0) return false;
  const maxHp = Math.max(0, Math.floor(Number(mob?.maxHp || 0)));
  if (maxHp > 0 && currentHp < maxHp) return true;
  return Boolean(getMobPersistStatus(mob?.status));
}

function getMobPersistSnapshot(mob) {
  return JSON.stringify([
    mob.templateId,
    Math.max(0, Math.floor(Number(mob.currentHp || 0))),
    getMobPersistStatus(mob.status) || null
  ]);
}

function getPlayerHealthBreakdown() {
  const summary = {
    total: players.size,
    connected: 0,
    managedAuto: 0,
    managedPending: 0,
    detached: 0
  };
  players.forEach((player) => {
    const socketConnected = Boolean(player?.socket?.connected);
    const hasSocketHandle = Boolean(player?.socket?.emit);
    if (socketConnected || hasSocketHandle) {
      summary.connected += 1;
      return;
    }
    if (player?.flags?.offlineManagedAuto) {
      summary.managedAuto += 1;
      return;
    }
    if (player?.flags?.offlineManagedPending) {
      summary.managedPending += 1;
      return;
    }
    summary.detached += 1;
  });
  return summary;
}

async function logRuntimeHealth(expectedAt = Date.now()) {
  const now = Date.now();
  const loopLagMs = Math.max(0, now - expectedAt);
  const memory = process.memoryUsage();
  const heapRatio = memory.heapTotal > 0 ? (memory.heapUsed / memory.heapTotal) : 0;
  let mobRespawnRows = runtimeMobRowsCachedValue;
  const canSampleMobRows =
    (now - runtimeMobRowsCacheAt >= RUNTIME_MOB_ROWS_SAMPLE_INTERVAL_MS)
    && loopLagMs < RUNTIME_LAG_WARN_MS
    && heapRatio < RUNTIME_HEAP_WARN_RATIO;
  if (canSampleMobRows) {
    try {
      const countRow = await knex('mob_respawns').count({ total: '*' }).first();
      mobRespawnRows = Math.max(0, Math.floor(Number(countRow?.total ?? countRow?.['count(*)'] ?? 0)));
      runtimeMobRowsCachedValue = mobRespawnRows;
      runtimeMobRowsCacheAt = now;
    } catch (err) {
      console.warn('[health] mob_respawns count failed:', err?.message || err);
      mobRespawnRows = runtimeMobRowsCachedValue;
    }
  }
  let cleanupInfo = null;
  const aggressive = heapRatio >= RUNTIME_HEAP_CRITICAL_RATIO || loopLagMs >= RUNTIME_LAG_CRITICAL_MS;
  const normal = heapRatio >= RUNTIME_HEAP_WARN_RATIO || loopLagMs >= RUNTIME_LAG_WARN_MS;
  if (aggressive) {
    activateRuntimeGuard('aggressive', RUNTIME_GUARD_HOLD_AGGRESSIVE_MS, now);
  } else if (normal && getRuntimeGuardMode(now) !== 'aggressive') {
    activateRuntimeGuard('normal', RUNTIME_GUARD_HOLD_NORMAL_MS, now);
  }
  const shouldRunCleanup = now - runtimeCacheCleanupLastAt >= RUNTIME_CACHE_CLEANUP_COOLDOWN_MS;
  if (shouldRunCleanup) {
    if (aggressive || normal) {
      cleanupInfo = cleanupRuntimeCaches({ aggressive });
    } else {
      cleanupRuntimeCaches({ aggressive: false });
    }
  }
  const rssMb = (memory.rss / (1024 * 1024)).toFixed(1);
  const heapUsedMb = (memory.heapUsed / (1024 * 1024)).toFixed(1);
  const heapTotalMb = (memory.heapTotal / (1024 * 1024)).toFixed(1);
  const externalMb = (memory.external / (1024 * 1024)).toFixed(1);
  const arrayBuffersMb = (memory.arrayBuffers / (1024 * 1024)).toFixed(1);
  const onlineCount = Number(io?.engine?.clientsCount || 0);
  const playerHealth = getPlayerHealthBreakdown();
  const realmStateCount = realmStates.size;
  const guardMode = getRuntimeGuardMode(now);
  const guardTag = guardMode === 'off'
    ? ''
    : ` guard=${guardMode === 'aggressive' ? 'aggr' : 'normal'}`;
  console.log(
    `[health] lag=${loopLagMs}ms rss=${rssMb}MB heap=${heapUsedMb}/${heapTotalMb}MB ext=${externalMb}MB ab=${arrayBuffersMb}MB `
    + `online=${onlineCount} players=${playerHealth.total} conn=${playerHealth.connected} managed=${playerHealth.managedAuto} pending=${playerHealth.managedPending} detached=${playerHealth.detached} `
    + `realms=${realmStateCount} pendingSaves=${pendingPlayerSaves.size} `
    + `mobCache=${mobStatePersistCache.size} mobRows=${mobRespawnRows}${guardTag}`
  );
  if (cleanupInfo) {
    const removed = cleanupInfo.removed;
    const totalRemoved = Object.values(removed).reduce((sum, value) => sum + Number(value || 0), 0);
    if (totalRemoved > 0) {
      console.log(
        `[guard] mode=${cleanupInfo.aggressive ? 'aggressive' : 'normal'} `
        + `roomData=${removed.roomStateData} roomMeta=${removed.roomStateMeta} roomTick=${removed.roomStateTick} `
        + `autoFull=${removed.autoFullRoom} chars=${removed.allCharacters} lucky=${removed.dailyLucky} tower=${removed.towerRank} `
        + `persistAt=${removed.playerLastPersistAt} throttle=${removed.stateThrottle}`
      );
    }
  }
}

function startRuntimeHealthLogging() {
  if (runtimeHealthTimer) return;
  runtimeHealthExpectedAt = Date.now() + RUNTIME_HEALTH_INTERVAL_MS;
  runtimeHealthTimer = setInterval(() => {
    const expectedAt = runtimeHealthExpectedAt;
    runtimeHealthExpectedAt += RUNTIME_HEALTH_INTERVAL_MS;
    logRuntimeHealth(expectedAt).catch((err) => {
      console.warn('[health] logger failed:', err?.message || err);
    });
  }, RUNTIME_HEALTH_INTERVAL_MS);
}

function cultivationRewardMultiplier(player) {
  const level = Math.floor(Number(player?.flags?.cultivationLevel ?? -1));
  if (Number.isNaN(level) || level < 0) return 1;
  return 1 + (level + 1) * 0.1;
}

function totalRewardMultiplier({ vipActive, svipActive = false, guildActive, guildBuildRewardPct = 0, cultivationMult = 1, partyMult = 1, treasureExpPct = 0, blessingExpMult = 1 }) {
  const vipBonus = (vipActive ? 1 : 0) + (svipActive ? 1 : 0);
  const guildBonus = guildActive ? 1 : 0;
  const guildBuildBonus = Math.max(0, Number(guildBuildRewardPct || 0) / 100);
  const cultivationBonus = Math.max(0, (Number(cultivationMult) || 1) - 1);
  const partyBonus = Math.max(0, (Number(partyMult) || 1) - 1);
  const treasureBonus = Math.max(0, Number(treasureExpPct || 0) / 100);
  const blessingExpBonus = Math.max(0, (Number(blessingExpMult) || 1) - 1);
  return 1 + vipBonus + guildBonus + guildBuildBonus + cultivationBonus + partyBonus + treasureBonus + blessingExpBonus;
}

function totalGoldRewardMultiplier({ vipActive, svipActive = false, guildActive, guildBuildGoldPct = 0, cultivationMult = 1, partyMult = 1, blessingGoldMult = 1 }) {
  const vipBonus = (vipActive ? 1 : 0) + (svipActive ? 1 : 0);
  const guildBonus = 0;
  const guildBuildBonus = Math.max(0, Number(guildBuildGoldPct || 0) / 100);
  const cultivationBonus = 0;
  const partyBonus = Math.max(0, (Number(partyMult) || 1) - 1);
  const blessingGoldBonus = Math.max(0, (Number(blessingGoldMult) || 1) - 1);
  return 1 + vipBonus + guildBonus + guildBuildBonus + cultivationBonus + partyBonus + blessingGoldBonus;
}

function buildRewardBonusBreakdown(player, party) {
  const vipActive = isVipActive(player);
  const svipActive = isSvipActive(player);
  const guildActive = Boolean(player?.guild);
  const totalPartyCount = partyMembersTotalCount(party) || 1;
  const partyMult = totalPartyCount > 1 ? (1 + Math.min(0.2 * totalPartyCount, 1.0)) : 1;
  const cultivationMult = cultivationRewardMultiplier(player);
  const guildBuildExpPct = Math.max(0, Number(player?.guild?.buildExpBonusPct || player?.guild?.buildRewardBonusPct || 0));
  const guildBuildGoldPct = Math.max(0, Number(player?.guild?.buildGoldBonusPct || 0));
  const treasureExpPct = Math.max(0, Number(player?.flags?.treasureExpBonusPct || 0));
  const cultivationPct = Math.max(0, ((Number(cultivationMult) || 1) - 1) * 100);
  const partyPct = Math.max(0, ((Number(partyMult) || 1) - 1) * 100);
  const blessingMults = getHarvestBlessingMultipliers(player);
  const blessingExpPct = Math.max(0, Math.round((blessingMults.expMult - 1) * 100));
  const blessingGoldPct = Math.max(0, Math.round((blessingMults.goldMult - 1) * 100));
  const expSources = [];
  const goldSources = [];
  if (vipActive) {
    expSources.push({ key: 'vip', label: 'VIP', pct: 100 });
    goldSources.push({ key: 'vip', label: 'VIP', pct: 100 });
  }
  if (svipActive) {
    expSources.push({ key: 'svip', label: 'SVIP', pct: 100 });
    goldSources.push({ key: 'svip', label: 'SVIP', pct: 100 });
  }
  if (guildActive) {
    expSources.push({ key: 'guild', label: '行会基础', pct: 100 });
  }
  if (guildBuildExpPct > 0) expSources.push({ key: 'guild_build_exp', label: '历练阁', pct: guildBuildExpPct });
  if (guildBuildGoldPct > 0) goldSources.push({ key: 'guild_build_gold', label: '财库阁', pct: guildBuildGoldPct });
  if (cultivationPct > 0) {
    expSources.push({ key: 'cultivation', label: '修真', pct: cultivationPct });
  }
  if (partyPct > 0) {
    expSources.push({ key: 'party', label: `队伍(${totalPartyCount}人)`, pct: partyPct });
    goldSources.push({ key: 'party', label: `队伍(${totalPartyCount}人)`, pct: partyPct });
  }
  if (treasureExpPct > 0) expSources.push({ key: 'treasure', label: '法宝经验', pct: treasureExpPct });
  if (blessingExpPct > 0) expSources.push({ key: 'blessing_exp', label: '经验丰收', pct: blessingExpPct });
  if (blessingGoldPct > 0) goldSources.push({ key: 'blessing_gold', label: '金币丰收', pct: blessingGoldPct });
  const expMult = totalRewardMultiplier({
    vipActive,
    svipActive,
    guildActive,
    guildBuildRewardPct: guildBuildExpPct,
    cultivationMult,
    partyMult,
    treasureExpPct,
    blessingExpMult: blessingMults.expMult
  });
  const goldMult = totalGoldRewardMultiplier({
    vipActive,
    svipActive,
    guildActive,
    guildBuildGoldPct,
    cultivationMult,
    partyMult,
    blessingGoldMult: blessingMults.goldMult
  });
  return {
    expMult,
    goldMult,
    expPct: Math.max(0, Math.round((expMult - 1) * 100)),
    goldPct: Math.max(0, Math.round((goldMult - 1) * 100)),
    expSources,
    goldSources
  };
}

function buildItemView(itemId, effects = null, durability = null, max_durability = null, refine_level = 0, base_roll_pct = null, growth_level = 0, growth_fail_stack = 0) {
  const item = ITEM_TEMPLATES[itemId] || { id: itemId, name: itemId, type: 'unknown' };
  const isEquipment = Boolean(item?.slot);
  const baseRollPct = isEquipment ? Math.max(100, Math.min(200, Math.floor(Number(base_roll_pct ?? 100) || 100))) : null;
  const rollStat = (value) => {
    const base = Number(value || 0);
    if (!isEquipment || base <= 0) return base;
    return Math.max(1, Math.floor(base * baseRollPct / 100));
  };
  // 优先使用装备模板中手动设置的 rarity，如果没有才使用价格计算
  const rarity = item.rarity || rarityByPrice(item);
  const boundHighTier = isBoundHighTierEquipment(item);
  const effectSkillName = effects?.skill ? getSkillNameById(effects.skill) : '';
  return {
    id: itemId,
    name: item.name,
    type: item.type,
    slot: item.slot || null,
    rarity,
    is_set: isSetItem(itemId),
    price: item.price || 0,
    hp: rollStat(item.hp || 0),
    mp: rollStat(item.mp || 0),
    atk: rollStat(item.atk || 0),
    def: rollStat(item.def || 0),
    mdef: rollStat(item.mdef || 0),
    mag: rollStat(item.mag || 0),
    spirit: rollStat(item.spirit || 0),
    dex: rollStat(item.dex || 0),
    durability: durability ?? null,
    max_durability: max_durability ?? null,
    effects: effects || null,
    effectSkillName,
    refine_level: refine_level || 0,
    base_roll_pct: baseRollPct,
    growth_level: Math.max(0, Math.floor(Number(growth_level || 0))),
    growth_fail_stack: Math.max(0, Math.floor(Number(growth_fail_stack || 0))),
    untradable: Boolean(item.untradable || boundHighTier),
    unconsignable: Boolean(item.unconsignable || boundHighTier),
    unmail: Boolean(item.unmail || boundHighTier),
    bound: boundHighTier
  };
}

function buildInventoryItemPayload(slot) {
  const item = ITEM_TEMPLATES[slot.id] || { id: slot.id, name: slot.id, type: 'unknown' };
  const isEquipment = Boolean(item?.slot);
  const baseRollPct = isEquipment ? Math.max(100, Math.min(200, Math.floor(Number(slot.base_roll_pct ?? 100) || 100))) : null;
  const rollStat = (value) => {
    const base = Number(value || 0);
    if (!isEquipment || base <= 0) return base;
    return Math.max(1, Math.floor(base * baseRollPct / 100));
  };
  const effects = slot.effects || null;
  const effectSkillName = effects?.skill ? getSkillNameById(effects.skill) : '';
  // 检查是否为商店装备
  const isShopItem = Object.values(SHOP_STOCKS).some(stockList => stockList.includes(slot.id));
  // 优先使用装备模板中手动设置的 rarity，如果没有才使用价格计算
  const rarity = item.rarity || rarityByPrice(item);
  const boundHighTier = isBoundHighTierEquipment(item);
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
    hp: rollStat(item.hp || 0),
    mp: rollStat(item.mp || 0),
    atk: rollStat(item.atk || 0),
    def: rollStat(item.def || 0),
    mdef: rollStat(item.mdef || 0),
    mag: rollStat(item.mag || 0),
    spirit: rollStat(item.spirit || 0),
    dex: rollStat(item.dex || 0),
    durability: slot.durability ?? null,
    max_durability: slot.max_durability ?? null,
    refine_level: slot.refine_level || 0,
    growth_level: Math.max(0, Math.floor(Number(slot.growth_level || 0))),
    growth_fail_stack: Math.max(0, Math.floor(Number(slot.growth_fail_stack || 0))),
    base_roll_pct: baseRollPct,
    effects,
    effectSkillName,
    is_shop_item: isShopItem,
    untradable: Boolean(item.untradable || boundHighTier),
    unconsignable: Boolean(item.unconsignable || boundHighTier),
    unmail: Boolean(item.unmail || boundHighTier),
    bound: boundHighTier
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
    entry.refine_level ?? 0,
    entry.base_roll_pct ?? null,
    entry.growth_level ?? 0,
    entry.growth_fail_stack ?? 0
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

const GROWTH_MATERIAL_LOCKED_ITEM_IDS = new Set([
  'ultimate_growth_stone',
  'ultimate_growth_break_stone'
]);

function isGrowthMaterialLockedItem(itemId) {
  return GROWTH_MATERIAL_LOCKED_ITEM_IDS.has(String(itemId || '').trim());
}

function getWeekMondayKey(now = Date.now()) {
  const date = new Date(now);
  const day = date.getDay();
  const diff = day === 0 ? -6 : (1 - day);
  date.setDate(date.getDate() + diff);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeZhuxianTowerProgress(player, now = Date.now()) {
  if (!player) return { weekKey: getWeekMondayKey(now), highestClearedFloor: 0 };
  if (!player.flags) player.flags = {};
  if (!player.flags.zxft || typeof player.flags.zxft !== 'object') {
    player.flags.zxft = {};
  }
  const weekKey = getWeekMondayKey(now);
  if (player.flags.zxft.weekKey !== weekKey) {
    player.flags.zxft.weekKey = weekKey;
    player.flags.zxft.highestClearedFloor = 0;
  }
  player.flags.zxft.highestClearedFloor = Math.max(0, Math.floor(Number(player.flags.zxft.highestClearedFloor || 0)));
  player.flags.zxft.bestFloor = Math.max(
    player.flags.zxft.highestClearedFloor,
    Math.floor(Number(player.flags.zxft.bestFloor || 0))
  );
  return player.flags.zxft;
}

function getZhuxianTowerBestFloorFromFlags(flags) {
  if (!flags || typeof flags !== 'object') return 0;
  const zxft = flags.zxft;
  if (!zxft || typeof zxft !== 'object') return 0;
  const best = Math.floor(Number(zxft.bestFloor || 0));
  const highest = Math.floor(Number(zxft.highestClearedFloor || 0));
  return Math.max(0, best, highest);
}

function getZhuxianTowerFloor(zoneId, roomId) {
  if (zoneId !== ZHUXIAN_TOWER_ZONE_ID) return 0;
  ensureZhuxianTowerRoom(roomId);
  const room = WORLD[zoneId]?.rooms?.[roomId];
  if (!room || room.towerFloor == null) return 0;
  return Math.max(1, Math.floor(Number(room.towerFloor || 1)));
}

function getPlayerZhuxianTowerRoomId(player, roomId) {
  const match = String(roomId || '').match(/^floor_(\d+)_x(?:__u_(.+))?$/);
  if (!match) return String(roomId || '');
  const floor = String(Math.max(1, Math.floor(Number(match[1] || 1)))).padStart(2, '0');
  const ownerKey = String(player?.userId || player?.name || '').trim();
  return ownerKey ? `floor_${floor}_x__u_${ownerKey}` : `floor_${floor}_x`;
}

function getPlayerPersonalBossRoomId(player, roomId) {
  const match = String(roomId || '').match(/^(vip_lair|svip_lair|perma_lair)(?:__u_(.+))?$/);
  if (!match) return String(roomId || '');
  const base = match[1];
  const ownerKey = String(player?.userId || player?.name || '').trim();
  return ownerKey ? `${base}__u_${ownerKey}` : base;
}

function isPersonalBossInstanceRoom(zoneId, roomId) {
  if (zoneId !== PERSONAL_BOSS_ZONE_ID) return false;
  return /^(vip_lair|svip_lair|perma_lair)(?:__u_.+)?$/.test(String(roomId || ''));
}

function ensureZhuxianTowerPosition(player, now = Date.now()) {
  if (!player || player.position?.zone !== ZHUXIAN_TOWER_ZONE_ID) return false;
  const personalRoomId = getPlayerZhuxianTowerRoomId(player, player.position.room);
  if (personalRoomId && personalRoomId !== player.position.room) {
    ensureZhuxianTowerRoom(personalRoomId);
    player.position.room = personalRoomId;
  }
  const floor = getZhuxianTowerFloor(player.position.zone, player.position.room);
  if (!floor) return false;
  const progress = normalizeZhuxianTowerProgress(player, now);
  const maxUnlocked = progress.highestClearedFloor + 1;
  if (floor <= maxUnlocked) return false;
  player.position = { zone: ZHUXIAN_TOWER_ZONE_ID, room: ZHUXIAN_TOWER_ENTRY_ROOM_ID };
  player.combat = null;
  player.send('浮图塔层数已在本周重置，已返回浮图塔入口。');
  return true;
}

function ensurePersonalBossPosition(player) {
  if (!player || player.position?.zone !== PERSONAL_BOSS_ZONE_ID) return false;
  const personalRoomId = getPlayerPersonalBossRoomId(player, player.position.room);
  if (personalRoomId && personalRoomId !== player.position.room) {
    ensurePersonalBossRoom(personalRoomId);
    player.position.room = personalRoomId;
    return true;
  }
  return false;
}

function getPersonalBossDropCap(zoneId, roomId) {
  if (zoneId !== PERSONAL_BOSS_ZONE_ID) return null;
  ensurePersonalBossRoom(roomId);
  const room = WORLD[zoneId]?.rooms?.[roomId];
  if (!room) return null;
  if (room.personalBossTier === 'vip') return 'supreme';
  if (room.personalBossTier === 'svip') return 'ultimate';
  if (room.personalBossTier === 'svip_permanent') return 'ultimate';
  return null;
}

async function syncZhuxianTowerTopTitleForRealm(realmId) {
  // 优化：使用生成列 has_tower_data 快速过滤
  const rows = await knex('characters')
    .select('id', 'name', 'flags_json')
    .where({ realm_id: realmId, has_tower_data: 1 })
    .limit(5000);
  if (!rows || rows.length === 0) return null;

  const parsed = rows.map((row) => {
    let flags = {};
    try {
      flags = row.flags_json ? JSON.parse(row.flags_json) : {};
    } catch {
      flags = {};
    }
    const floor = getZhuxianTowerBestFloorFromFlags(flags);
    return { id: row.id, name: row.name, flags, floor };
  });

  const ranked = parsed
    .filter((entry) => entry.floor > 0)
    .sort((a, b) => {
      if (b.floor !== a.floor) return b.floor - a.floor;
      return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
    });

  const topName = ranked.length > 0 ? String(ranked[0].name || '') : '';
  const updates = [];

  parsed.forEach((entry) => {
    const hasTitle = String(entry.flags?.zhuxianTowerTitle || '') === ZHUXIAN_TOWER_TOP1_TITLE;
    const shouldHave = topName && entry.name === topName;
    if (hasTitle === shouldHave) return;

    if (!entry.flags || typeof entry.flags !== 'object') entry.flags = {};
    if (shouldHave) {
      entry.flags.zhuxianTowerTitle = ZHUXIAN_TOWER_TOP1_TITLE;
    } else {
      delete entry.flags.zhuxianTowerTitle;
    }
    updates.push({ id: entry.id, flagsJson: JSON.stringify(entry.flags), name: entry.name, gained: shouldHave });
  });

  // 批量更新改为串行执行，减少数据库并发压力
  if (updates.length > 0) {
    for (const u of updates) {
      await knex('characters').where({ id: u.id }).update({ flags_json: u.flagsJson, updated_at: knex.fn.now() });
    }
  }

  updates.forEach((u) => {
    const online = playersByName(u.name, realmId);
    if (!online) return;
    if (!online.flags || typeof online.flags !== 'object') online.flags = {};
    if (u.gained) {
      online.flags.zhuxianTowerTitle = ZHUXIAN_TOWER_TOP1_TITLE;
      online.send(`你已成为浮图塔层数排行榜第一名，获得称号：${ZHUXIAN_TOWER_TOP1_TITLE}`);
    } else {
      delete online.flags.zhuxianTowerTitle;
      online.send('你已失去浮图塔层数排行榜第一名，称号已被收回。');
    }
  });

  return topName || null;
}

async function grantZhuxianTowerClearReward(player, floor, now = Date.now()) {
  if (!player || floor <= 0) return { granted: false, qty: 0 };
  const progress = normalizeZhuxianTowerProgress(player, now);
  if (floor <= progress.highestClearedFloor) return { granted: false, qty: 0 };
  progress.highestClearedFloor = floor;
  progress.bestFloor = Math.max(Math.floor(Number(progress.bestFloor || 0)), floor);
  zhuxianTowerRankCache.delete(player.realmId || 1);
  const isBossFloor = floor % 10 === 0;
  // 法宝经验丹固定发放：不受VIP/行会/修真/队伍/经验加成等任何倍率影响
  const baseRewardQty = isBossFloor ? 10 : randInt(1, 10);
  const rewardQty = Math.max(1, Math.floor(baseRewardQty));
  addItem(player, ZHUXIAN_TOWER_REWARD_ITEM_ID, rewardQty);
  if (isBossFloor) {
    player.send(`诛仙浮图塔第${floor}层（BOSS层）通关，必掉 法宝经验丹 x10。`);
    if (Math.random() < TREASURE_TOWER_XUANMING_DROP_CHANCE) {
      const dropId = ZHUXIAN_TOWER_XUANMING_DROPS[randInt(0, ZHUXIAN_TOWER_XUANMING_DROPS.length - 1)];
      addItem(player, dropId, 1);
      const dropName = ITEM_TEMPLATES[dropId]?.name || dropId;
      player.send(`浮图塔额外掉落：${dropName} x1。`);
    }
  } else {
    player.send(`诛仙浮图塔第${floor}层通关，获得 法宝经验丹 x${rewardQty}。`);
  }
  await syncZhuxianTowerTopTitleForRealm(player.realmId || 1);
  player.send(`已解锁诛仙浮图塔第${floor + 1}层。`);
  return { granted: true, qty: rewardQty };
}

function tryRecoverZhuxianTowerEmptyRoom(player) {
  if (!player || player.position?.zone !== ZHUXIAN_TOWER_ZONE_ID) return false;
  const zoneId = player.position.zone;
  const roomId = player.position.room;
  const floor = getZhuxianTowerFloor(zoneId, roomId);
  if (!floor) return false;

  const progress = normalizeZhuxianTowerProgress(player);
  const highestClearedFloor = Math.max(0, Math.floor(Number(progress.highestClearedFloor || 0)));
  // Cleared floors can stay empty in the current week.
  if (floor <= highestClearedFloor) return false;

  const roomRealmId = getRoomRealmId(zoneId, roomId, player.realmId || 1);
  spawnMobs(zoneId, roomId, roomRealmId);
  if (getAliveMobs(zoneId, roomId, roomRealmId).length > 0) return false;

  // Stale dead mobs can block tower progress. Rebuild this room's mob list and respawn.
  const roomMobs = getRoomMobs(zoneId, roomId, roomRealmId);
  if (Array.isArray(roomMobs) && roomMobs.length > 0) {
    roomMobs.length = 0;
  }
  spawnMobs(zoneId, roomId, roomRealmId);
  if (getAliveMobs(zoneId, roomId, roomRealmId).length > 0) {
    player.forceStateRefresh = true;
    return true;
  }
  return false;
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

function getTreasureDropMultiplierForMob(mobTemplate) {
  if (!mobTemplate) return 1;
  if (mobTemplate.id === 'cross_world_boss') {
    return Math.max(0, Number(TREASURE_CROSS_WORLD_BOSS_DROP_MULTIPLIER || 1));
  }
  if (mobTemplate.worldBoss) {
    return Math.max(0, Number(TREASURE_WORLD_BOSS_DROP_MULTIPLIER || 1));
  }
  return 1;
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

function isBlockedCommonCharacterSkillBookDrop(itemId) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item) return false;
  return item.type === 'book' && String(item.rarity || '') === 'common';
}

function rollRarityDrop(mobTemplate, bonus = 1) {
  if (!isBossMob(mobTemplate)) return null;
  const table = RARITY_BOSS;
  const allowSet = true;
  const allowUltimateDrop = Boolean(mobTemplate?.id === 'cross_world_boss' || mobTemplate?.allowUltimateDrop);
  for (const rarity of RARITY_ORDER) {
    if (!isWorldBossDropMob(mobTemplate) && (rarity === 'supreme' || rarity === 'ultimate')) continue;
    if (rarity === 'ultimate' && !allowUltimateDrop) continue;
    if (Math.random() <= Math.min(1, table[rarity] * bonus)) {
      const pool = allowSet
        ? ITEM_POOLS[rarity]
        : ITEM_POOLS[rarity].filter((id) => !isSetItem(id));
      // 排除bossOnly标记的装备，这些应该只在特定BOSS掉落
      const filteredPool = pool.filter((id) => {
        const item = ITEM_TEMPLATES[id];
        if (isBlockedCommonCharacterSkillBookDrop(id)) return false;
        if (item?.bossOnly) return false;
        if (item?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return false;
        if (item?.crossWorldBossOnly && !allowUltimateDrop) return false;
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
  const allowUltimateDrop = Boolean(mobTemplate?.id === 'cross_world_boss' || mobTemplate?.allowUltimateDrop);
  for (const rarity of RARITY_ORDER) {
    if (!isWorldBossDropMob(mobTemplate) && (rarity === 'supreme' || rarity === 'ultimate')) continue;
    if (rarity === 'ultimate' && !allowUltimateDrop) continue;
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
        if (item?.crossWorldBossOnly && !allowUltimateDrop) return false;
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
const PERSONAL_BOSS_DEFAULTS = {
  vip: {
    hp: 420000,
    atk: 170,
    def: 180,
    mdef: 180,
    exp: 7800,
    gold: 1500,
    respawnMinutes: 10,
    dropBonus: 1.0
  },
  svip: {
    hp: 600000,
    atk: 180,
    def: 210,
    mdef: 210,
    exp: 9000,
    gold: 2000,
    respawnMinutes: 10,
    dropBonus: 1.0
  }
};
let PERSONAL_BOSS_DROP_BONUS = {
  vip: PERSONAL_BOSS_DEFAULTS.vip.dropBonus,
  svip: PERSONAL_BOSS_DEFAULTS.svip.dropBonus
};

function getPersonalBossDropBonusByTemplate(mobTemplate) {
  if (!mobTemplate?.id) return null;
  if (mobTemplate.id === 'vip_personal_boss') return Math.max(0, Number(PERSONAL_BOSS_DROP_BONUS.vip || 0));
  if (mobTemplate.id === 'svip_personal_boss') return Math.max(0, Number(PERSONAL_BOSS_DROP_BONUS.svip || 0));
  return null;
}

async function getPersonalBossTierSettings(tier) {
  const defaults = PERSONAL_BOSS_DEFAULTS[tier] || PERSONAL_BOSS_DEFAULTS.vip;
  const prefix = `personal_boss_${tier}`;
  const parseIntMin = (value, fallback, min = 0) => {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, parsed);
  };
  const parseFloatMin = (value, fallback, min = 0) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, parsed);
  };
  const hp = parseIntMin(await getSetting(`${prefix}_hp`, String(defaults.hp)), defaults.hp, 1);
  const atk = parseIntMin(await getSetting(`${prefix}_atk`, String(defaults.atk)), defaults.atk, 1);
  const def = parseIntMin(await getSetting(`${prefix}_def`, String(defaults.def)), defaults.def, 0);
  const mdef = parseIntMin(await getSetting(`${prefix}_mdef`, String(defaults.mdef)), defaults.mdef, 0);
  const exp = parseIntMin(await getSetting(`${prefix}_exp`, String(defaults.exp)), defaults.exp, 1);
  const gold = parseIntMin(await getSetting(`${prefix}_gold`, String(defaults.gold)), defaults.gold, 0);
  const respawnMinutes = parseIntMin(
    await getSetting(`${prefix}_respawn_minutes`, String(defaults.respawnMinutes)),
    defaults.respawnMinutes,
    1
  );
  const dropBonus = parseFloatMin(
    await getSetting(`${prefix}_drop_bonus`, String(defaults.dropBonus)),
    defaults.dropBonus,
    0
  );
  return { hp, atk, def, mdef, exp, gold, respawnMinutes, dropBonus };
}

async function applyPersonalBossSettings() {
  const vip = await getPersonalBossTierSettings('vip');
  const svip = await getPersonalBossTierSettings('svip');

  const vipTemplate = MOB_TEMPLATES.vip_personal_boss;
  if (vipTemplate) {
    vipTemplate.hp = vip.hp;
    vipTemplate.atk = vip.atk;
    vipTemplate.def = vip.def;
    vipTemplate.mdef = vip.mdef;
    vipTemplate.exp = vip.exp;
    vipTemplate.gold = [vip.gold, Math.floor(vip.gold * 1.6)];
    vipTemplate.respawnMs = vip.respawnMinutes * 60 * 1000;
  }

  const svipTemplate = MOB_TEMPLATES.svip_personal_boss;
  if (svipTemplate) {
    svipTemplate.hp = svip.hp;
    svipTemplate.atk = svip.atk;
    svipTemplate.def = svip.def;
    svipTemplate.mdef = svip.mdef;
    svipTemplate.exp = svip.exp;
    svipTemplate.gold = [svip.gold, Math.floor(svip.gold * 1.6)];
    svipTemplate.respawnMs = svip.respawnMinutes * 60 * 1000;
  }

  PERSONAL_BOSS_DROP_BONUS = {
    vip: vip.dropBonus,
    svip: svip.dropBonus
  };
}
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

  const scalingBaseStats = worldBossMob.status?.scalingBaseStats || worldBossMob.status?.baseStats || null;
  const baseHp = scalingBaseStats?.max_hp ?? template.hp ?? worldBossMob.max_hp;
  const baseAtk = scalingBaseStats?.atk ?? template.atk ?? worldBossMob.atk;
  const baseDef = scalingBaseStats?.def ?? template.def ?? worldBossMob.def;
  const baseMdef = scalingBaseStats?.mdef ?? template.mdef ?? worldBossMob.mdef;

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
  if (!worldBossMob.status.scalingBaseStats) {
    worldBossMob.status.scalingBaseStats = {
      max_hp: Math.floor(baseHp),
      atk: Math.floor(baseAtk),
      def: Math.floor(baseDef),
      mdef: Math.floor(baseMdef)
    };
  }
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
  const allowUltimateDrop = Boolean(mobTemplate?.id === 'cross_world_boss' || mobTemplate?.allowUltimateDrop);
  const sabakBonus = mobTemplate.sabakBoss ? 3.0 : 1.0;
  const personalBossDropBonus = getPersonalBossDropBonusByTemplate(mobTemplate);
  let finalBonus = bonus * sabakBonus;
  if (personalBossDropBonus !== null) {
    finalBonus *= personalBossDropBonus;
  } else if (isWorldBossDropMob(mobTemplate)) {
    finalBonus *= WORLD_BOSS_DROP_BONUS;
  } else if (isCultivationBoss(mobTemplate)) {
    finalBonus *= CULTIVATION_BOSS_DROP_BONUS;
  } else if (mobTemplate?.specialBoss) {
    finalBonus *= SPECIAL_BOSS_DROP_BONUS;
  }
  if (mobTemplate.drops) {
    mobTemplate.drops.forEach((drop) => {
      const dropItem = ITEM_TEMPLATES[drop.id];
      if (dropItem?.noDrop) return;
      if (isBlockedCommonCharacterSkillBookDrop(drop.id)) return;
      if (dropItem?.bossOnly && !isBossMob(mobTemplate)) return;
      if (dropItem?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return;
      if (dropItem?.crossWorldBossOnly && !allowUltimateDrop) return;
      // 史诗和传说级别的bossOnly装备只能在魔龙教主、世界BOSS、沙巴克BOSS掉落
      if (dropItem?.bossOnly) {
        const rarity = rarityByPrice(dropItem);
        if ((rarity === 'epic' || rarity === 'legendary' || rarity === 'ultimate') && !isSpecialBoss(mobTemplate)) {
          return;
        }
      }
      let chance = Math.min(1, (drop.chance || 0) * finalBonus);
      if (isTreasureItemId(drop.id)) {
        chance = Math.min(1, chance * getTreasureDropMultiplierForMob(mobTemplate));
      }
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
  const petTrainingChance = Math.min(1, getPetTrainingFruitDropRate());
  if (Math.random() <= petTrainingChance) {
    loot.push({ id: 'pet_training_fruit', effects: null });
  }
  const rarityDrop = rollRarityDrop(mobTemplate, finalBonus);
  if (rarityDrop) {
    loot.push({ id: rarityDrop, effects: rollEquipmentEffects(rarityDrop) });
  }
  return loot;
}

const PLAYER_SAVE_DEBOUNCE_MS = 1500;
const PLAYER_SAVE_MIN_INTERVAL_MS = 8000;
const PLAYER_SAVE_MANAGED_MIN_INTERVAL_MS = 20000;
const PLAYER_SAVE_DETACHED_MIN_INTERVAL_MS = 15000;
const PLAYER_SAVE_MAX_WRITES_PER_FLUSH = 80;
const pendingPlayerSaves = new Map();
let pendingPlayerSaveTimer = null;
let pendingPlayerSaveDueAt = 0;
const playerLastPersistAt = new Map();

function getPlayerSaveKey(player) {
  return `${Number(player?.userId || 0)}:${Number(player?.realmId || 1)}:${String(player?.name || '')}`;
}

function getPlayerSaveMinIntervalMs(player) {
  if (player?.flags?.offlineManagedAuto || player?.flags?.offlineManagedPending) {
    return PLAYER_SAVE_MANAGED_MIN_INTERVAL_MS;
  }
  if (!player?.socket?.emit) {
    return PLAYER_SAVE_DETACHED_MIN_INTERVAL_MS;
  }
  return PLAYER_SAVE_MIN_INTERVAL_MS;
}

async function savePlayerNow(player) {
  if (!player?.userId) return;
  const wasCompactedManaged = restoreManagedPlayerState(player);
  await saveCharacter(player.userId, player, player.realmId || 1);
  if (wasCompactedManaged && isManagedHostedPlayer(player)) {
    compactManagedPlayerState(player);
  }
}

function schedulePendingPlayerSaveFlush(delayMs = PLAYER_SAVE_DEBOUNCE_MS) {
  const delay = Math.max(0, Math.floor(Number(delayMs || 0)));
  const dueAt = Date.now() + delay;
  if (pendingPlayerSaveTimer && pendingPlayerSaveDueAt && pendingPlayerSaveDueAt <= dueAt) {
    return;
  }
  if (pendingPlayerSaveTimer) {
    clearTimeout(pendingPlayerSaveTimer);
  }
  pendingPlayerSaveDueAt = dueAt;
  pendingPlayerSaveTimer = setTimeout(() => {
    flushPendingPlayerSaves().catch((err) => {
      console.warn('[savePlayer] deferred flush error:', err?.message || err);
    });
  }, delay);
}

async function flushPendingPlayerSaves() {
  if (pendingPlayerSaveTimer) {
    clearTimeout(pendingPlayerSaveTimer);
    pendingPlayerSaveTimer = null;
  }
  pendingPlayerSaveDueAt = 0;
  if (pendingPlayerSaves.size <= 0) return;
  const batch = Array.from(pendingPlayerSaves.entries());
  pendingPlayerSaves.clear();
  let nextDelayMs = 0;
  let writes = 0;
  for (const [saveKey, queuedPlayer] of batch) {
    if (writes >= PLAYER_SAVE_MAX_WRITES_PER_FLUSH) {
      pendingPlayerSaves.set(saveKey, queuedPlayer);
      nextDelayMs = nextDelayMs > 0 ? Math.min(nextDelayMs, PLAYER_SAVE_DEBOUNCE_MS) : PLAYER_SAVE_DEBOUNCE_MS;
      continue;
    }
    const lastPersistAt = playerLastPersistAt.get(saveKey) || 0;
    const minIntervalMs = getPlayerSaveMinIntervalMs(queuedPlayer);
    const remaining = minIntervalMs - (Date.now() - lastPersistAt);
    if (remaining > 0) {
      pendingPlayerSaves.set(saveKey, queuedPlayer);
      nextDelayMs = nextDelayMs > 0 ? Math.min(nextDelayMs, remaining) : remaining;
      continue;
    }
    try {
      await savePlayerNow(queuedPlayer);
      writes += 1;
      playerLastPersistAt.set(saveKey, Date.now());
    } catch (err) {
      console.warn('[savePlayer] deferred flush failed:', err?.message || err);
      pendingPlayerSaves.set(saveKey, queuedPlayer);
      nextDelayMs = nextDelayMs > 0 ? Math.min(nextDelayMs, PLAYER_SAVE_DEBOUNCE_MS) : PLAYER_SAVE_DEBOUNCE_MS;
    }
  }
  if (pendingPlayerSaves.size > 0) {
    schedulePendingPlayerSaveFlush(nextDelayMs || PLAYER_SAVE_DEBOUNCE_MS);
  }
}

async function runMobRespawnCleanupSweep(options = {}) {
  const batchSize = Math.max(100, Math.floor(Number(options.batchSize || MOB_RESPAWN_CLEANUP_BATCH_SIZE)));
  const maxRounds = Math.max(1, Math.floor(Number(options.maxRounds || MOB_RESPAWN_CLEANUP_MAX_ROUNDS)));
  const delayMs = Math.max(0, Math.floor(Number(options.delayMs || 0)));
  let totalDeleted = 0;
  for (let round = 0; round < maxRounds; round += 1) {
    const deleted = Number(await cleanupExpiredMobRespawnsBatch(Date.now(), batchSize) || 0);
    if (deleted <= 0) break;
    totalDeleted += deleted;
    if (deleted < batchSize) break;
    if (delayMs > 0 && round < maxRounds - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return totalDeleted;
}

async function runStartupMobRespawnCleanup() {
  const totalDeleted = await runMobRespawnCleanupSweep({
    batchSize: STARTUP_MOB_CLEANUP_BATCH_SIZE,
    maxRounds: 200,
    delayMs: STARTUP_MOB_CLEANUP_DELAY_MS
  });
  if (totalDeleted > 0) {
    console.log(`[mob_respawns] startup background cleanup finished: ${totalDeleted}`);
  }
}

function queuePlayerSave(player) {
  if (!player?.userId) return;
  pendingPlayerSaves.set(getPlayerSaveKey(player), player);
  schedulePendingPlayerSaveFlush(PLAYER_SAVE_DEBOUNCE_MS);
}

async function savePlayer(player, options = {}) {
  if (!player?.userId) return;
  const saveKey = getPlayerSaveKey(player);
  if (options?.immediate) {
    pendingPlayerSaves.delete(saveKey);
    await savePlayerNow(player);
    playerLastPersistAt.set(saveKey, Date.now());
    return;
  }
  queuePlayerSave(player);
}

async function recoverManagedHostedPlayersOnStartup() {
  let recovered = 0;
  let skipped = 0;
  // 优化：只查询可能有托管标记的角色（flags_json 包含 managed 关键字）
  const rows = await knex('characters')
    .select('user_id', 'name', 'realm_id', 'flags_json')
    .where('flags_json', 'like', '%managed%')
    .orderBy('id', 'asc')
    .limit(10000);
  for (const row of rows) {
    let flags = {};
    try {
      flags = JSON.parse(row?.flags_json || '{}') || {};
    } catch {
      flags = {};
    }
    const isManaged = Boolean(flags?.offlineManagedAuto || flags?.offlineManagedPending);
    if (!isManaged) continue;

    const userId = Math.max(0, Math.floor(Number(row?.user_id || 0) || 0));
    const realmId = Math.max(1, Math.floor(Number(row?.realm_id || 1) || 1));
    const charName = String(row?.name || '').trim();
    if (!userId || !charName) {
      skipped += 1;
      continue;
    }
    if (playersByName(charName, realmId)) {
      skipped += 1;
      continue;
    }

    try {
      const loaded = await loadCharacter(userId, charName, realmId);
      if (!loaded) {
        skipped += 1;
        continue;
      }
      computeDerived(loaded);
      loaded.userId = userId;
      loaded.realmId = realmId;
      loaded.socket = null;
      loaded.deviceKey = null;
      loaded.send = () => {};
      loaded.combat = null;
      loaded.guild = null;
      loaded.stateThrottleOverride = false;
      if (!loaded.flags) loaded.flags = {};
      normalizeZhuxianTowerProgress(loaded);
      normalizePetState(loaded);
      ensureZhuxianTowerPosition(loaded);
      ensurePersonalBossPosition(loaded);
      const member = await getGuildMember(userId, charName, realmId);
      if (member && member.guild) {
        attachGuildMeta(loaded, member.guild, member.role);
      }
      if (loaded.rankTitle) {
        onlinePlayerRankTitles.set(loaded.name, loaded.rankTitle);
      }
      compactManagedPlayerState(loaded);
      players.set(makeManagedPlayerKey(loaded), loaded);
      spawnMobs(loaded.position.zone, loaded.position.room, loaded.realmId || 1);
      recovered += 1;
    } catch (err) {
      skipped += 1;
      console.warn(`[managed-recover] failed to restore ${charName}@${realmId}:`, err?.message || err);
    }
  }
  return { recovered, skipped };
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

const CHARACTER_MIGRATE_YUANBAO_COST = 10;
const SVIP_AUTO_MANAGED_START_DELAY_MS = 5 * 60 * 1000;

async function renameCharacterEverywhere({ userId, realmId = 1, oldName, newName }) {
  const uid = Math.max(0, Math.floor(Number(userId) || 0));
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const fromName = String(oldName || '').trim();
  const toName = String(newName || '').trim();
  if (!uid || !fromName || !toName || fromName === toName) return false;

  await knex.transaction(async (trx) => {
    const existing = await trx('characters')
      .where({ name: toName })
      .first();
    if (existing) {
      throw new Error('角色名已存在。');
    }

    const updated = await trx('characters')
      .where({ user_id: uid, realm_id: rid, name: fromName })
      .update({ name: toName, updated_at: trx.fn.now() });
    if (!updated) {
      throw new Error('角色数据不存在或已变更。');
    }

    await trx('guild_members')
      .where({ user_id: uid, realm_id: rid, char_name: fromName })
      .update({ char_name: toName });
    await trx('guilds')
      .where({ leader_user_id: uid, realm_id: rid, leader_char_name: fromName })
      .update({ leader_char_name: toName });
    await trx('guild_applications')
      .where({ user_id: uid, realm_id: rid, char_name: fromName })
      .update({ char_name: toName, applied_at: trx.fn.now() });

    await trx('mails')
      .where({ realm_id: rid, to_user_id: uid, to_name: fromName })
      .update({ to_name: toName });
    await trx('mails')
      .where({ realm_id: rid, from_user_id: uid, from_name: fromName })
      .update({ from_name: toName });

    await trx('consignments')
      .where({ realm_id: rid, seller_name: fromName })
      .update({ seller_name: toName });
    await trx('consignment_history')
      .where({ realm_id: rid, seller_name: fromName })
      .update({ seller_name: toName });

    await trx('recharge_cards')
      .where({ used_by_user_id: uid, used_by_char_name: fromName })
      .update({ used_by_char_name: toName });

    await trx('sponsors')
      .where({ player_name: fromName })
      .update({ player_name: toName });
  });

  return true;
}

async function migrateCharacterToUser({ realmId = 1, charName, targetUserId, allowOnline = false }) {
  const rid = Math.max(1, Math.floor(Number(realmId || 1) || 1));
  const name = String(charName || '').trim();
  const toUserId = Math.max(0, Math.floor(Number(targetUserId) || 0));
  if (!name || !toUserId) {
    throw new Error('参数无效。');
  }

  const online = playersByName(name, rid);
  if (!allowOnline && online) {
    throw new Error('角色在线中，无法迁移，请先下线。');
  }

  return knex.transaction(async (trx) => {
    const row = await trx('characters')
      .where({ name, realm_id: rid })
      .first();
    if (!row) {
      throw new Error('角色不存在。');
    }
    const fromUserId = Number(row.user_id || 0);
    if (!fromUserId) {
      throw new Error('角色账号信息异常。');
    }
    if (fromUserId === toUserId) {
      throw new Error('角色已在该账号下，无需迁移。');
    }

    const targetUser = await trx('users')
      .where({ id: toUserId })
      .first();
    if (!targetUser) {
      throw new Error('目标账号不存在。');
    }

    const sourceApp = await trx('guild_applications')
      .where({ user_id: fromUserId, realm_id: rid, char_name: name })
      .first();
    if (sourceApp) {
      const targetApp = await trx('guild_applications')
        .where({ user_id: toUserId, realm_id: rid })
        .first();
      if (targetApp) {
        throw new Error('目标账号该区已有行会申请记录，请先处理后再迁移。');
      }
    }

    const updated = await trx('characters')
      .where({ user_id: fromUserId, realm_id: rid, name })
      .update({ user_id: toUserId, updated_at: trx.fn.now() });
    if (!updated) {
      throw new Error('角色迁移失败，角色数据已变更。');
    }

    await trx('guild_members')
      .where({ user_id: fromUserId, realm_id: rid, char_name: name })
      .update({ user_id: toUserId });
    await trx('guilds')
      .where({ leader_user_id: fromUserId, realm_id: rid, leader_char_name: name })
      .update({ leader_user_id: toUserId, updated_at: trx.fn.now() });
    await trx('guild_applications')
      .where({ user_id: fromUserId, realm_id: rid, char_name: name })
      .update({ user_id: toUserId, applied_at: trx.fn.now() });

    await trx('mails')
      .where({ realm_id: rid, to_user_id: fromUserId, to_name: name })
      .update({ to_user_id: toUserId });
    await trx('mails')
      .where({ realm_id: rid, from_user_id: fromUserId, from_name: name })
      .update({ from_user_id: toUserId });

    allCharactersCache.delete(rid);
    return {
      realmId: rid,
      charName: name,
      fromUserId,
      toUserId
    };
  });
}

async function applyOnlineCharacterRename(player, newName) {
  if (!player) return false;
  const oldName = String(player.name || '').trim();
  const nextName = String(newName || '').trim();
  const realmId = Math.max(1, Math.floor(Number(player.realmId || 1) || 1));
  if (!oldName || !nextName || oldName === nextName) return false;
  const realmState = getRealmState(realmId);

  const party = getPartyByMember(oldName, realmId);
  if (party) {
    party.members = party.members.map((name) => (name === oldName ? nextName : name));
    if (party.leader === oldName) party.leader = nextName;
    await persistParty(party, realmId);
  }

  const cleanupInviteMap = (map) => {
    if (!(map instanceof Map)) return;
    const entries = Array.from(map.entries());
    map.clear();
    entries.forEach(([key, value]) => {
      const nextKey = key === oldName ? nextName : key;
      if (nextKey === oldName) return;
      if (value && typeof value === 'object') {
        const nextValue = { ...value };
        if (nextValue.from === oldName) nextValue.from = nextName;
        map.set(nextKey, nextValue);
      } else {
        map.set(nextKey, value);
      }
    });
  };
  cleanupInviteMap(realmState.partyInvites);
  cleanupInviteMap(realmState.partyFollowInvites);
  cleanupInviteMap(realmState.guildInvites);

  // 交易邀请直接清理，避免改名前后的姓名混用导致状态错乱
  if (realmState.tradeInvites instanceof Map) {
    for (const [key, value] of Array.from(realmState.tradeInvites.entries())) {
      if (key === oldName || value?.from === oldName) {
        realmState.tradeInvites.delete(key);
      }
    }
  }

  if (player.flags) {
    if (Array.isArray(player.flags.partyMembers)) {
      player.flags.partyMembers = player.flags.partyMembers.map((name) => (name === oldName ? nextName : name));
    }
    if (player.flags.partyLeader === oldName) player.flags.partyLeader = nextName;
  }

  if (onlinePlayerRankTitles.has(oldName)) {
    const title = onlinePlayerRankTitles.get(oldName);
    onlinePlayerRankTitles.delete(oldName);
    if (title) onlinePlayerRankTitles.set(nextName, title);
  }

  player.name = nextName;
  if (player.guild && player.guild.role) {
    player.guild = { ...player.guild };
  }
  player.forceStateRefresh = true;
  return true;
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

function normalizeTradeItemInstanceAttrs(attrs = {}) {
  if (!attrs || typeof attrs !== 'object') return {};
  return {
    durability: attrs.durability == null ? null : Number(attrs.durability),
    max_durability: attrs.max_durability == null ? null : Number(attrs.max_durability),
    refine_level: attrs.refine_level == null ? 0 : Math.max(0, Math.floor(Number(attrs.refine_level || 0))),
    base_roll_pct: attrs.base_roll_pct == null ? null : Math.max(100, Math.min(200, Math.floor(Number(attrs.base_roll_pct || 100) || 100))),
    growth_level: attrs.growth_level == null ? 0 : Math.max(0, Math.floor(Number(attrs.growth_level || 0))),
    growth_fail_stack: attrs.growth_fail_stack == null ? 0 : Math.max(0, Math.floor(Number(attrs.growth_fail_stack || 0)))
  };
}

function sameTradeItemInstanceAttrs(a = {}, b = {}) {
  const na = normalizeTradeItemInstanceAttrs(a);
  const nb = normalizeTradeItemInstanceAttrs(b);
  return (na.durability ?? null) === (nb.durability ?? null)
    && (na.max_durability ?? null) === (nb.max_durability ?? null)
    && Number(na.refine_level || 0) === Number(nb.refine_level || 0)
    && (na.base_roll_pct ?? null) === (nb.base_roll_pct ?? null)
    && Number(na.growth_level || 0) === Number(nb.growth_level || 0)
    && Number(na.growth_fail_stack || 0) === Number(nb.growth_fail_stack || 0);
}

function findInventorySlotForTrade(player, slot) {
  if (!slot) return null;
  const attrs = normalizeTradeItemInstanceAttrs(slot);
  return (player?.inventory || []).find((i) => {
    if (!i || i.id !== slot.id) return false;
    if (!sameEffects(i.effects, slot.effects)) return false;
    return sameTradeItemInstanceAttrs(i, attrs);
  }) || null;
}

function hasOfferItems(player, offer) {
  return offer.items.every((slot) => {
    const inv = findInventorySlotForTrade(player, slot);
    return inv && inv.qty >= slot.qty;
  });
}

function applyOfferItems(from, to, offer) {
  offer.items.forEach((slot) => {
    removeItem(
      from,
      slot.id,
      slot.qty,
      slot.effects || null,
      slot.durability ?? null,
      slot.max_durability ?? null,
      slot.refine_level ?? null,
      slot.base_roll_pct ?? null,
      slot.growth_level ?? null,
      slot.growth_fail_stack ?? null
    );
    addItem(
      to,
      slot.id,
      slot.qty,
      slot.effects || null,
      slot.durability ?? null,
      slot.max_durability ?? null,
      slot.refine_level ?? null,
      slot.base_roll_pct ?? null,
      slot.growth_level ?? null,
      slot.growth_fail_stack ?? null
    );
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
  addItem(player, itemId, qty, effects = null, itemAttrs = null) {
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
    
    const sourceSlot = findInventorySlotForTrade(player, {
      id: itemId,
      effects: effectsResult.value,
      ...(itemAttrs || {})
    });
    if (!sourceSlot || Number(sourceSlot.qty || 0) < qtyResult.value) {
      return { ok: false, msg: '背包中没有符合条件的物品。' };
    }

    // 检查物品是否可交易
    const item = ITEM_TEMPLATES[itemId];
    if (item?.untradable || isBoundHighTierEquipment(item) || isGrowthMaterialLockedItem(itemId)) return { ok: false, msg: '该物品不可交易。' };

    const offer = ensureOffer(trade, player.name);
    const slotPayload = {
      id: itemId,
      qty: qtyResult.value,
      effects: normalizeEffects(effectsResult.value),
      durability: sourceSlot.durability ?? null,
      max_durability: sourceSlot.max_durability ?? null,
      refine_level: sourceSlot.refine_level ?? 0,
      base_roll_pct: sourceSlot.base_roll_pct ?? null,
      growth_level: sourceSlot.growth_level ?? 0,
      growth_fail_stack: sourceSlot.growth_fail_stack ?? 0
    };
    const existing = offer.items.find((i) =>
      i.id === itemId &&
      sameEffects(i.effects, slotPayload.effects) &&
      sameTradeItemInstanceAttrs(i, slotPayload)
    );
    if (existing) existing.qty += qtyResult.value;
    else offer.items.push(slotPayload);
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
function isConsignPetSkillBook(itemId, item) {
  return String(itemId || '').startsWith('pet_book_') || item?.type === 'pet_book';
}
function isConsignSellAllowed(itemId, item) {
  return CONSIGN_EQUIPMENT_TYPES.has(item?.type) || isConsignPetSkillBook(itemId, item);
}
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
        item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? 0, row.base_roll_pct ?? null, row.growth_level ?? 0, row.growth_fail_stack ?? 0)
      }));
      player.socket?.emit?.('consign_list', { type: 'market', items });
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
        item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? 0, row.base_roll_pct ?? null, row.growth_level ?? 0, row.growth_fail_stack ?? 0)
      }));
      player.socket?.emit?.('consign_list', { type: 'mine', items });
      return items;
    },
    async sell(player, invSlot, qty, price, effects = null, currency = 'gold') {
      if (!invSlot || !invSlot.id) return { ok: false, msg: '背包里没有该物品。' };
      const itemId = invSlot.id;
      // 验证物品ID
      const itemResult = validateItemId(itemId);
      if (!itemResult.ok) return { ok: false, msg: '未找到物品。' };
      const item = ITEM_TEMPLATES[itemId];

      if (!isConsignSellAllowed(itemId, item)) return { ok: false, msg: '仅可寄售装备或宠物技能书。' };

      // 检查物品是否可寄售
      if (item?.unconsignable || isBoundHighTierEquipment(item) || isGrowthMaterialLockedItem(itemId)) return { ok: false, msg: '该物品不可寄售。' };

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
      const baseRollPct = invSlot.base_roll_pct == null ? null : Math.max(100, Math.min(200, Math.floor(Number(invSlot.base_roll_pct || 100) || 100)));
      const growthLevel = Math.max(0, Math.floor(Number(invSlot.growth_level || 0)));
      const growthFailStack = Math.max(0, Math.floor(Number(invSlot.growth_fail_stack || 0)));

      if (!removeItem(player, itemId, qtyResult.value, effectsResult.value, durability, maxDurability, refineLevel, baseRollPct, growthLevel, growthFailStack)) {
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
        baseRollPct,
        growthLevel,
        growthFailStack,
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
    addItem(player, row.item_id, qtyResult.value, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? null, row.base_roll_pct ?? null, row.growth_level ?? null, row.growth_fail_stack ?? null);

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
      baseRollPct: row.base_roll_pct ?? null,
      growthLevel: row.growth_level ?? null,
      growthFailStack: row.growth_fail_stack ?? null,
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
    addItem(player, row.item_id, row.qty, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? null, row.base_roll_pct ?? null, row.growth_level ?? null, row.growth_fail_stack ?? null);
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
      item: buildItemView(row.item_id, parseJson(row.effects_json), row.durability, row.max_durability, row.refine_level ?? 0, row.base_roll_pct ?? null, row.growth_level ?? 0, row.growth_fail_stack ?? 0),
      soldAt: row.sold_at
    }));
    player.socket?.emit?.('consign_history', { items });
    return items;
  }
};

const rechargeApi = {
  async redeem(player, code) {
    const used = await useRechargeCard(code, player.userId, player.name);
    if (!used) return { ok: false, msg: '卡密无效或已使用。' };
    const amount = Math.max(0, Math.floor(Number(used.amount || 0)));
    if (!amount) return { ok: false, msg: '卡密金额异常。' };
    const firstRechargeCfg = getFirstRechargeWelfareConfigSnapshot();
    const playerRealmId = Math.max(1, Math.floor(Number(player?.realmId || 1) || 1));
    const rewardMarkedInRealm = await hasFirstRechargeRewardMarkerByRealm(player.userId, playerRealmId);
    const isFirstRecharge = firstRechargeCfg.enabled !== false && !rewardMarkedInRealm;
    let inviteBonusMsg = '';
    const inviteBinding = await getInviteBindingByUserId(player.userId);
    const inviteBonusAlreadyProcessed = await hasInviteFirstRechargeProcessed(player.userId);
    const inviteCfg = getInviteRewardConfigSnapshot();
    const inviteRate = Math.max(0, Math.min(1, Number(inviteCfg.bonusRate || 0)));
    const canApplyInviteFirstRechargeBonus = Boolean(inviteCfg.enabled !== false && inviteBinding && !inviteBonusAlreadyProcessed);
    const inviteExtraYuanbao = canApplyInviteFirstRechargeBonus
      ? Math.max(0, Math.floor(amount * inviteRate))
      : 0;
    const inviterRebateYuanbao = canApplyInviteFirstRechargeBonus
      ? Math.max(0, Math.floor(amount * inviteRate))
      : 0;
    player.yuanbao = (player.yuanbao || 0) + amount + inviteExtraYuanbao;
    let firstRechargeMsg = '';
    if (canApplyInviteFirstRechargeBonus && inviteBinding) {
      let rebateResult = null;
      if (inviterRebateYuanbao > 0) {
        try {
          rebateResult = await grantInviteRebateYuanbao(inviteBinding.inviterUserId, inviterRebateYuanbao, {
            preferredRealmId: playerRealmId,
            inviteeUserId: player.userId,
            inviteeName: player.name
          });
        } catch (err) {
          console.warn('邀请返利发放失败:', err?.message || err);
          rebateResult = { ok: false, reason: 'exception' };
        }
      }
      if (rebateResult?.ok && inviterRebateYuanbao > 0) {
        await markInviteRebateIssuedForInvitee(player.userId, {
          source: 'auto_recharge',
          inviterUserId: inviteBinding.inviterUserId,
          inviteeCharName: player.name,
          rebateYuanbao: inviterRebateYuanbao,
          targetName: String(rebateResult?.targetName || ''),
          realmId: Math.max(1, Math.floor(Number(rebateResult?.realmId || playerRealmId) || playerRealmId))
        });
      }
      await markInviteFirstRechargeProcessed(player.userId, {
        inviterUserId: inviteBinding.inviterUserId,
        inviteeCharName: player.name,
        sourceAmount: amount,
        bonusYuanbao: inviteExtraYuanbao,
        rebateYuanbao: inviterRebateYuanbao
      });
      const rebateHint = rebateResult?.ok
        ? `邀请人返利 ${inviterRebateYuanbao} 元宝已发放`
        : (inviterRebateYuanbao > 0 ? `邀请人返利发放异常（请联系管理员）` : '');
      const parts = [];
      if (inviteExtraYuanbao > 0) parts.push(`邀请首充加成 +${inviteExtraYuanbao} 元宝`);
      if (rebateHint) parts.push(rebateHint);
      if (parts.length) inviteBonusMsg = `\n${parts.join('，')}。`;
    }
    if (isFirstRecharge) {
      const grant = grantFirstRechargeWelfareToPlayer(player, firstRechargeCfg);
      const rewardText = Array.isArray(grant.rewardText) ? grant.rewardText : [];
      await markFirstRechargeRewardIssued(player.userId, { source: 'auto_recharge', charName: player.name });
      await markFirstRechargeRewardIssuedByRealm(player.userId, playerRealmId, { source: 'auto_recharge', charName: player.name });
      if (rewardText.length) {
        firstRechargeMsg = `\n首充福利已发放：${rewardText.join('、')}。`;
      }
    }
    await addSponsor(player.name, amount);
    player.forceStateRefresh = true;
    return { ok: true, msg: `充值成功，获得 ${amount + inviteExtraYuanbao} 元宝。${inviteBonusMsg}${firstRechargeMsg}`.trim() };
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
        addItem(seller, row.item_id, qty, effects, row.durability, row.max_durability, row.refine_level ?? null, row.base_roll_pct ?? null, row.growth_level ?? null, row.growth_fail_stack ?? null);
        seller.send(`寄售到期自动下架：${ITEM_TEMPLATES[row.item_id]?.name || row.item_id} x${qty} 已返还背包。`);
        seller.forceStateRefresh = true;
        refreshedSellers.add(seller);
        savePlayer(seller);
      } else {
        const sellerRow = await findCharacterByNameInRealm(row.seller_name, realmId);
        if (sellerRow) {
          const sellerPlayer = await loadCharacter(sellerRow.user_id, sellerRow.name, sellerRow.realm_id || 1);
          if (sellerPlayer) {
            addItem(sellerPlayer, row.item_id, qty, effects, row.durability, row.max_durability, row.refine_level ?? null, row.base_roll_pct ?? null, row.growth_level ?? null, row.growth_fail_stack ?? null);
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

function distributeLootWithBonus(party, partyMembers, mobTemplate, bonusResolver, maxDropRarity = null) {
  if (!party || partyMembers.length === 0 || !mobTemplate) return [];
  const results = [];
  const allowUltimateDrop = Boolean(mobTemplate?.id === 'cross_world_boss' || mobTemplate?.allowUltimateDrop);
  const maxDropRank = maxDropRarity ? (RARITY_RANK[maxDropRarity] || 0) : 0;
  const exceedsMaxDropRarity = (itemId) => {
    if (!maxDropRank) return false;
    const item = ITEM_TEMPLATES[itemId];
    if (!item) return true;
    const rarity = rarityByPrice(item);
    return (RARITY_RANK[rarity] || 0) > maxDropRank;
  };
  const sabakBonus = mobTemplate.sabakBoss ? 3.0 : 1.0;
  const personalBossDropBonus = getPersonalBossDropBonusByTemplate(mobTemplate);
  const worldBossBonus = personalBossDropBonus !== null
    ? personalBossDropBonus
    : (isWorldBossDropMob(mobTemplate) ? WORLD_BOSS_DROP_BONUS : 1);
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
      if (dropItem?.noDrop) return;
      if (dropItem?.bossOnly && !isBossMob(mobTemplate)) return;
      if (dropItem?.worldBossOnly && !isWorldBossDropMob(mobTemplate)) return;
      if (dropItem?.crossWorldBossOnly && !allowUltimateDrop) return;
      if (exceedsMaxDropRarity(drop.id)) return;
      if (dropItem?.bossOnly) {
        const rarity = rarityByPrice(dropItem);
        if ((rarity === 'epic' || rarity === 'legendary' || rarity === 'ultimate') && !isSpecialBoss(mobTemplate)) {
          return;
        }
      }
      const target = partyMembers[randInt(0, partyMembers.length - 1)];
      const finalBonus = resolveFinalBonus(target);
      let chance = Math.min(1, (drop.chance || 0) * finalBonus);
      if (isTreasureItemId(drop.id)) {
        chance = Math.min(1, chance * getTreasureDropMultiplierForMob(mobTemplate));
      }
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
  const petTrainingTarget = partyMembers[randInt(0, partyMembers.length - 1)];
  const petTrainingChance = Math.min(1, getPetTrainingFruitDropRate());
  if (Math.random() <= petTrainingChance) {
    addItem(petTrainingTarget, 'pet_training_fruit', 1, null);
    logLoot(`[loot][party] ${petTrainingTarget.name} <- pet_training_fruit`);
    results.push({ id: 'pet_training_fruit', effects: null, target: petTrainingTarget });
    notifyParty(petTrainingTarget, 'pet_training_fruit', null);
  }

  const rarityTarget = partyMembers[randInt(0, partyMembers.length - 1)];
  const rarityDrop = rollRarityDrop(mobTemplate, resolveFinalBonus(rarityTarget));
  if (rarityDrop && !exceedsMaxDropRarity(rarityDrop)) {
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
  return Boolean(player?.flags?.hasHealblockEffect || hasActivePetSkill(player, 'pet_war_horn'));
}

function getTreasureAutoProcData(player, treasureId) {
  const advance = Math.max(0, Math.floor(Number(getTreasureAdvanceCount(player, treasureId) || 0)));
  const stage = getTreasureStageByAdvanceCount(advance);
  const def = getTreasureAutoPassiveDef(treasureId) || {};
  const chance = Math.min(0.25, Math.max(0, Number(def.chanceBase || 0.04) + stage * Number(def.chancePerStage || 0.005)));
  const stageScale = Math.max(1, stage);
  const power = Math.min(3, Math.max(0.5, Number(def.powerBase || 1) + stageScale * Number(def.powerPerLevel || 0.002) + stage * Number(def.powerPerStage || 0.03)));
  return { stage, chance, power, def };
}

function tryTriggerTreasureAutoPassiveOnHit(attacker, target, options = {}) {
  if (!attacker || !target || target.hp <= 0) return;
  const targetType = options.targetType === 'mob' ? 'mob' : 'player';
  const roomRealmId = options.roomRealmId;
  const baseDamage = Math.max(1, Math.floor(Number(options.baseDamage || 1)));
  const equipped = normalizeTreasureState(attacker)?.equipped || [];
  if (!equipped.length) return;

  const applyExtraDamage = (rawAmount, sourceName) => {
    const amount = Math.max(1, Math.floor(rawAmount));
    if (targetType === 'mob') {
      const result = applyDamageToMob(target, amount, attacker.name, roomRealmId);
      const taken = Number(result?.damageTaken || 0);
      if (taken > 0) {
        attacker.send(`法宝【${sourceName}】自动触发，对 ${target.name} 造成 ${taken} 点额外伤害。`);
      }
      return;
    }
    const taken = applyDamageToPlayer(target, amount);
    if (taken > 0) {
      attacker.send(`法宝【${sourceName}】自动触发，对 ${target.name} 造成 ${taken} 点额外伤害。`);
      target.send(`${attacker.name} 的法宝【${sourceName}】自动触发，对你造成 ${taken} 点额外伤害。`);
    }
  };

  for (const treasureId of equipped) {
    const tDef = getTreasureDef(treasureId);
    const { stage, chance, power, def } = getTreasureAutoProcData(attacker, treasureId);
    if (!tDef || !def.type) continue;
    if (Math.random() > chance) continue;

    if (def.type === 'burst') {
      const burst = Math.floor((attacker.atk * 0.2 + attacker.elementAtk * 5 + attacker.mag * 0.12) * power);
      applyExtraDamage(burst, tDef.name);
      break;
    }

    if (def.type === 'weak') {
      if (!target.status) target.status = {};
      if (!target.status.debuffs) target.status.debuffs = {};
      target.status.debuffs.weak = {
        expiresAt: Date.now() + Math.max(500, Number(def.durationMs || 2000)),
        dmgReduction: Math.min(0.3, Math.max(0.05, Number(def.weakBase || 0.12) + stage * Number(def.weakPerStage || 0.01)))
      };
      attacker.send(`法宝【${tDef.name}】自动触发，${target.name} 伤害降低。`);
      if (targetType === 'player') {
        target.send(`你受到法宝【${tDef.name}】影响，伤害降低。`);
      }
      break;
    }

    if (def.type === 'armorBreak') {
      if (targetType === 'mob' && enforceSpecialBossDebuffImmunity(target, roomRealmId)) {
        continue;
      }
      if (!target.status) target.status = {};
      if (!target.status.debuffs) target.status.debuffs = {};
      target.status.debuffs.armorBreak = {
        expiresAt: Date.now() + Math.max(500, Number(def.durationMs || 2500)),
        defMultiplier: Math.max(0.7, Number(def.defMulBase || 0.85) - stage * Number(def.defMulPerStage || 0.01))
      };
      attacker.send(`法宝【${tDef.name}】自动触发，${target.name} 防御被削弱。`);
      if (targetType === 'player') {
        target.send(`你受到法宝【${tDef.name}】影响，防御降低。`);
      }
      break;
    }

    if (def.type === 'heal') {
      const heal = Math.max(1, Math.floor(baseDamage * (Number(def.healRatioBase || 0.1) + stage * Number(def.healRatioPerStage || 0.01))));
      attacker.hp = clamp(attacker.hp + heal, 1, attacker.max_hp);
      attacker.send(`法宝【${tDef.name}】自动触发，恢复 ${heal} 点生命。`);
      break;
    }

    if (def.type === 'mp') {
      const restore = Math.max(1, Math.floor(attacker.max_mp * (Number(def.mpRatioBase || 0.01) + stage * Number(def.mpRatioPerStage || 0.001))));
      attacker.mp = clamp(attacker.mp + restore, 0, attacker.max_mp);
      attacker.send(`法宝【${tDef.name}】自动触发，恢复 ${restore} 点法力。`);
      break;
    }
  }
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
const AUTO_FULL_MANUAL_RESTORE_MS = 10 * 60 * 1000;
const AUTO_FULL_MOVE_COOLDOWN_MS = 5000;
const AUTO_FULL_BOSS_MOVE_COOLDOWN_MS = 1000;
const AUTO_FULL_CROSS_BOSS_COOLDOWN_MS = 30000;
const AUTO_FULL_ROOM_CACHE_TTL = 15000;
const autoFullRoomCache = new Map();
const ALL_CHAR_CACHE_TTL_MS = 5000;
const allCharactersCache = new Map();

async function getAllCharactersCached(realmId = 1) {
  const key = Number(realmId || 1) || 1;
  const now = Date.now();
  const cached = allCharactersCache.get(key);
  if (cached && Array.isArray(cached.data) && (now - cached.at) <= ALL_CHAR_CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached?.inFlight) {
    return cached.inFlight;
  }
  const inFlight = listAllCharacters(key)
    .then((rows) => {
      const data = Array.isArray(rows) ? rows : [];
      allCharactersCache.set(key, { data, at: Date.now(), inFlight: null });
      return data;
    })
    .catch((err) => {
      allCharactersCache.delete(key);
      throw err;
    });
  allCharactersCache.set(key, { data: cached?.data || null, at: cached?.at || 0, inFlight });
  return inFlight;
}

let activitySettlementRunning = false;

async function runActivityRankingSettlements() {
  if (activitySettlementRunning) return;
  activitySettlementRunning = true;
  try {
    const now = Date.now();
    const t = getChinaDateParts(now);
    const shouldSettleDaily = t.hour === 0 && t.minute < 10;
    const shouldSettleWeekly = t.weekday === 1 && t.hour === 0 && t.minute < 15;
    if (!shouldSettleDaily && !shouldSettleWeekly) return;

    const realms = realmCache.length ? realmCache : await listRealms();
    for (const realm of realms) {
      const realmId = Number(realm?.id || 1) || 1;
      if (shouldSettleDaily) {
        const targetDailyKey = formatPrevDateKey(now);
        const doneKey = `activity_settle_daily_done_${realmId}_${targetDailyKey}`;
        if (String(await getSetting(doneKey, '0') || '0') !== '1') {
          const rows = await listAllCharacters(realmId);
          const boards = getActivityLeaderboardsByPeriod(rows, { dailyKey: targetDailyKey, weekKey: null, limit: 10 });
          const rewards = buildActivitySettlementRewards(boards, { dailyKey: targetDailyKey, weekKey: null });
          for (const reward of rewards) {
            const sentKey = `activity_settle_daily_${realmId}_${targetDailyKey}_${reward.boardKey}_${reward.rank}_${reward.userId}`;
            if (String(await getSetting(sentKey, '0') || '0') === '1') continue;
            try {
              await sendMail(reward.userId, reward.charName, '系统', null, reward.title, reward.body, null, reward.gold, reward.realmId || realmId);
              await setSetting(sentKey, '1');
            } catch (err) {
              console.warn('Failed to send daily activity settlement reward:', err);
            }
          }
          await setSetting(doneKey, '1');
        }
      }
      if (shouldSettleWeekly) {
        const targetWeekKey = formatPrevWeekKey(now);
        const doneKey = `activity_settle_weekly_done_${realmId}_${targetWeekKey}`;
        if (String(await getSetting(doneKey, '0') || '0') !== '1') {
          const rows = await listAllCharacters(realmId);
          const boards = getActivityLeaderboardsByPeriod(rows, { dailyKey: null, weekKey: targetWeekKey, limit: 10 });
          const rewards = buildActivitySettlementRewards(boards, { dailyKey: null, weekKey: targetWeekKey });
          for (const reward of rewards) {
            const sentKey = `activity_settle_weekly_${realmId}_${targetWeekKey}_${reward.boardKey}_${reward.rank}_${reward.userId}`;
            if (String(await getSetting(sentKey, '0') || '0') === '1') continue;
            try {
              await sendMail(reward.userId, reward.charName, '系统', null, reward.title, reward.body, null, reward.gold, reward.realmId || realmId);
              await setSetting(sentKey, '1');
            } catch (err) {
              console.warn('Failed to send weekly activity settlement reward:', err);
            }
          }
          await setSetting(doneKey, '1');
        }
      }
    }
  } catch (err) {
    console.warn('Failed to run activity ranking settlements:', err);
  } finally {
    activitySettlementRunning = false;
  }
}

const AUTO_FULL_BOSS_LIST = Array.from(new Set(
  Object.values(MOB_TEMPLATES)
    .filter((tpl) => tpl && tpl.name && isBossMob(tpl))
    .map((tpl) => String(tpl.name))
)).sort((a, b) => a.localeCompare(b, 'zh-CN'));

function formatTreasurePctText(value) {
  const pct = Number(value || 0) * 100;
  if (!Number.isFinite(pct) || pct <= 0) return '';
  const rounded = Math.round(pct * 1000) / 1000;
  return `${Number.isInteger(rounded) ? rounded : rounded}%`;
}

function formatTreasureNumberText(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '';
  const rounded = Math.round(num * 1000) / 1000;
  return `${Number.isInteger(rounded) ? rounded : rounded}`;
}

function buildTreasurePerLevelEffectText(treasureId) {
  const effects = getTreasureDef(treasureId)?.effects || {};
  const parts = [];
  const pushPct = (label, key) => {
    const pctText = formatTreasurePctText(effects[key]);
    if (!pctText) return;
    parts.push(`${label}+${pctText}/阶`);
  };
  const pushFlat = (label, key) => {
    const value = Number(effects[key] || 0);
    if (!Number.isFinite(value) || value <= 0) return;
    const rounded = Math.round(value * 1000) / 1000;
    parts.push(`${label}+${Number.isInteger(rounded) ? rounded : rounded}/阶`);
  };
  pushPct('攻/魔/道', 'atkPctPerLevel');
  pushPct('防御', 'defPctPerLevel');
  pushPct('魔御', 'mdefPctPerLevel');
  pushPct('生命上限', 'maxHpPctPerLevel');
  pushPct('法力上限', 'maxMpPctPerLevel');
  pushPct('魔法', 'magPctPerLevel');
  pushPct('道术', 'spiritPctPerLevel');
  pushPct('命中', 'hitPctPerLevel');
  pushPct('闪避', 'evadePctPerLevel');
  pushPct('敏捷', 'dexPctPerLevel');
  pushPct('打怪经验', 'expPctPerLevel');
  pushFlat('元素攻击', 'elementAtkPerLevel');
  return parts.join('，');
}

function buildTreasureAutoPassiveText(treasureId) {
  const def = getTreasureAutoPassiveDef(treasureId);
  if (!def?.type) return '';
  const chanceBase = formatTreasurePctText(def.chanceBase || 0.04);
  const chancePerStage = formatTreasurePctText(def.chancePerStage || 0);
  const chanceText = chancePerStage
    ? `命中后${chanceBase}几率触发（每段+${chancePerStage}，上限25%）`
    : `命中后${chanceBase}几率触发`;
  if (def.type === 'heal') {
    const healBase = formatTreasurePctText(def.healRatioBase || 0.1);
    const healPerStage = formatTreasurePctText(def.healRatioPerStage || 0);
    return `${chanceText}，回复生命（基于本次伤害）${healBase}${healPerStage ? `（每段+${healPerStage}）` : ''}`;
  }
  if (def.type === 'mp') {
    const mpBase = formatTreasurePctText(def.mpRatioBase || 0.01);
    const mpPerStage = formatTreasurePctText(def.mpRatioPerStage || 0);
    return `${chanceText}，回复法力上限${mpBase}${mpPerStage ? `（每段+${mpPerStage}）` : ''}`;
  }
  if (def.type === 'weak') {
    const weakBase = formatTreasurePctText(def.weakBase || 0.12);
    const weakPerStage = formatTreasurePctText(def.weakPerStage || 0);
    const sec = formatTreasureNumberText((Number(def.durationMs || 2000) || 2000) / 1000);
    return `${chanceText}，目标降伤${weakBase}${weakPerStage ? `（每段+${weakPerStage}）` : ''}，持续${sec}秒`;
  }
  if (def.type === 'armorBreak') {
    const defMulBase = Math.max(0, Number(def.defMulBase || 0.85));
    const breakBase = formatTreasurePctText(1 - defMulBase);
    const breakPerStage = formatTreasurePctText(def.defMulPerStage || 0);
    const sec = formatTreasureNumberText((Number(def.durationMs || 2500) || 2500) / 1000);
    return `${chanceText}，目标降防${breakBase}${breakPerStage ? `（每段+${breakPerStage}）` : ''}，持续${sec}秒`;
  }
  if (def.type === 'burst') {
    const powerBase = formatTreasurePctText(def.powerBase || 1);
    const powerPerLevel = formatTreasurePctText(def.powerPerLevel || 0);
    const powerPerStage = formatTreasurePctText(def.powerPerStage || 0);
    return `${chanceText}，追加伤害倍率${powerBase}${powerPerLevel ? `（每阶+${powerPerLevel}` : ''}${powerPerStage ? `${powerPerLevel ? '，' : '（'}每段+${powerPerStage}` : ''}${(powerPerLevel || powerPerStage) ? '）' : ''}`;
  }
  return '';
}

function decorateTreasureSetEffectText(entry) {
  if (!entry?.id) return entry;
  const perLevelText = buildTreasurePerLevelEffectText(entry.id);
  const autoPassiveText = buildTreasureAutoPassiveText(entry.id);
  if (!perLevelText) return entry;
  const raw = String(entry.effect || '').trim();
  if (!raw || raw.includes('每级：') || raw.includes('每阶：')) return entry;
  const detailParts = [`每阶：${perLevelText}`];
  if (autoPassiveText) detailParts.push(`自动触发：${autoPassiveText}`);
  return {
    ...entry,
    effect: raw.includes('（自动生效）')
      ? raw.replace('（自动生效）', `（${detailParts.join('；')}；自动生效）`)
      : `${raw}（${detailParts.join('；')}）`
  };
}

const TREASURE_SETS = [
  {
    id: 'fentian',
    name: '焚天·战魂系',
    role: '输出',
    source: '世界BOSS、跨服BOSS',
    treasures: [
      { id: 'treasure_fentian_mark', name: '焚天战印', effect: '被动：攻/魔/道与元素攻击提升（自动生效）' },
      { id: 'treasure_blood_blade', name: '血煞魔刃', effect: '被动：攻/魔/道与生存能力提升（自动生效）' },
      { id: 'treasure_chixiao_talisman', name: '赤霄神符', effect: '被动：主属性提升（自动生效）' },
      { id: 'treasure_cangyan_flag', name: '苍焰战旗', effect: '被动：攻/魔/道与元素攻击提升（自动生效）' },
      { id: 'treasure_fenyu_wheel', name: '焚狱天轮', effect: '被动：攻/魔/道与元素攻击提升（自动生效）' },
      { id: 'treasure_jiehuo_token', name: '劫火兵符', effect: '被动：攻/魔/道与命中提升（自动生效）' }
    ]
  },
  {
    id: 'xuanming',
    name: '玄冥·守御系',
    role: '生存型',
    source: '诛仙浮图塔每10层概率掉落',
    treasures: [
      { id: 'treasure_xuanwu_core', name: '玄武甲心', effect: '被动：防御与魔御提升（自动生效）' },
      { id: 'treasure_taiyin_mirror', name: '太阴镜', effect: '被动：生命与防御提升（自动生效）' },
      { id: 'treasure_guiyuan_bead', name: '归元珠', effect: '被动：生命与法力上限提升（自动生效）' },
      { id: 'treasure_xuanshuang_wall', name: '玄霜壁', effect: '被动：生命、防御、魔御提升（自动生效）' },
      { id: 'treasure_beiming_armor', name: '北溟玄甲', effect: '被动：生命、防御、魔御提升（自动生效）' },
      { id: 'treasure_hanyuan_stone', name: '寒渊镇石', effect: '被动：生命与闪避提升（自动生效）' }
    ]
  },
  {
    id: 'youluo',
    name: '幽罗·禁制系（控制/克制型）',
    role: '控制/克制型',
    source: '世界BOSS、跨服BOSS',
    treasures: [
      { id: 'treasure_youluo_lamp', name: '幽罗锁魂灯', effect: '被动：命中与道术提升（自动生效）' },
      { id: 'treasure_shigou_nail', name: '蚀骨钉', effect: '被动：元素攻击与攻/魔/道提升（自动生效）' },
      { id: 'treasure_shehun_banner', name: '摄魂幡', effect: '被动：闪避与敏捷提升（自动生效）' },
      { id: 'treasure_shiling_chain', name: '噬灵锁', effect: '被动：命中、闪避与敏捷提升（自动生效）' },
      { id: 'treasure_duanpo_bell', name: '断魄铃', effect: '被动：命中与敏捷提升（自动生效）' },
      { id: 'treasure_fushen_lu', name: '缚神箓', effect: '被动：命中、闪避与攻/魔/道提升（自动生效）' }
    ]
  },
  {
    id: 'taiyi',
    name: '太一·修真系',
    role: '成长',
    source: '修真BOSS',
    treasures: [
      { id: 'treasure_taiyi_disc', name: '太一灵盘', effect: '被动：打怪经验与法力上限提升（自动生效）' },
      { id: 'treasure_zhoutian_jade', name: '周天玉简', effect: '被动：法术与道术提升（自动生效）' },
      { id: 'treasure_hongmeng_seal', name: '鸿蒙道印', effect: '被动：攻/魔/道与综合属性提升（自动生效）' },
      { id: 'treasure_taichu_scroll', name: '太初灵卷', effect: '被动：打怪经验、法力上限与道术提升（自动生效）' },
      { id: 'treasure_ziwei_disc', name: '紫微星盘', effect: '被动：打怪经验与法力上限提升（自动生效）' },
      { id: 'treasure_taixu_script', name: '太虚道简', effect: '被动：打怪经验、法力上限与攻/魔/道提升（自动生效）' }
    ]
  }
];

TREASURE_SETS.forEach((setEntry) => {
  if (!Array.isArray(setEntry?.treasures)) return;
  setEntry.treasures = setEntry.treasures.map((entry) => decorateTreasureSetEffectText(entry));
});

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
  const now = Date.now();
  const expiresAt = Number(player.flags.vipExpiresAt || 0);
  if (expiresAt > now) {
    player.flags.vip = true;
    return true;
  }
  if (player.flags.vip && expiresAt && expiresAt <= now) {
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
  const now = Date.now();
  const expiresAt = Number(player.flags.svipExpiresAt || 0);
  if (expiresAt > now) {
    player.flags.svip = true;
    return true;
  }
  if (player.flags.svip && expiresAt && expiresAt <= now) {
    player.flags.svip = false;
    player.flags.svipExpiresAt = null;
  }
  return Boolean(player.flags.svip);
}

function isSvipActive(player) {
  return normalizeSvipStatus(player);
}

function normalizeBossName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\u00b7:\uff1a-]/g, '');
}

const AUTO_FULL_BOSS_FILTER_KEYS = {
  cultivation: normalizeBossName('修真BOSS'),
  world: normalizeBossName('世界BOSS'),
  cross: normalizeBossName('跨服BOSS'),
  special: normalizeBossName('特殊BOSS'),
  personal: normalizeBossName('个人BOSS')
};

function getAutoFullBossFilterSet(player) {
  const list = player?.flags?.autoFullBossFilter;
  if (!Array.isArray(list)) return null;
  if (list.length === 0) return new Set();
  const normalized = list
    .map((name) => normalizeBossName(name))
    .filter(Boolean);
  return new Set(normalized);
}

function isAutoFullBossCategoryMatch(filterKey, mobTemplate) {
  if (!mobTemplate || !filterKey) return false;
  const isPersonalBoss = mobTemplate.id === 'vip_personal_boss' || mobTemplate.id === 'svip_personal_boss';
  const isCultBoss = isCultivationBoss(mobTemplate);
  const isCrossBoss = mobTemplate.id === 'cross_world_boss';
  const isWorldBossOnly = Boolean(mobTemplate.worldBoss) && !isCrossBoss && !isPersonalBoss;
  const isSpecialBossOnly = Boolean(mobTemplate.specialBoss) && !mobTemplate.worldBoss && !isCultBoss && !isPersonalBoss;
  if (filterKey === AUTO_FULL_BOSS_FILTER_KEYS.cultivation) return isCultBoss;
  if (filterKey === AUTO_FULL_BOSS_FILTER_KEYS.world) return isWorldBossOnly;
  if (filterKey === AUTO_FULL_BOSS_FILTER_KEYS.cross) return isCrossBoss;
  if (filterKey === AUTO_FULL_BOSS_FILTER_KEYS.special) return isSpecialBossOnly;
  if (filterKey === AUTO_FULL_BOSS_FILTER_KEYS.personal) return isPersonalBoss;
  return false;
}

function getAutoFullSelectedCultivationBossNames(player) {
  const filter = getAutoFullBossFilterSet(player);
  if (filter == null || filter.size === 0) return null;
  const names = new Set();
  for (const tpl of Object.values(MOB_TEMPLATES)) {
    if (!tpl || !isCultivationBoss(tpl)) continue;
    const name = normalizeBossName(tpl.name || '');
    if (!name) continue;
    if (filter.has(name)) names.add(name);
  }
  return names;
}

function isAutoFullOnlySelectedCultivationBosses(player) {
  const filter = getAutoFullBossFilterSet(player);
  if (filter == null || filter.size === 0) return false;
  const selectedCultivationNames = getAutoFullSelectedCultivationBossNames(player);
  if (!selectedCultivationNames || selectedCultivationNames.size === 0) return false;
  for (const name of filter) {
    if (!selectedCultivationNames.has(name)) return false;
  }
  return true;
}

function isAutoFullCultivationBossFocused(player) {
  // 仅当筛选项全部是修真BOSS时启用专用逻辑：
  // 有修真BOSS就打，没有就回练级房。
  return isAutoFullOnlySelectedCultivationBosses(player);
}

function isAutoFullBossAllowed(player, mobTemplate) {
  const filter = getAutoFullBossFilterSet(player);
  if (filter == null) return true;
  if (filter.size === 0) return false;
  const name = normalizeBossName(mobTemplate?.name || '');
  if (name && filter.has(name)) return true;
  for (const key of filter) {
    if (isAutoFullBossCategoryMatch(key, mobTemplate)) return true;
  }
  return false;
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

function clearAutoFullManualDowngrade(player) {
  if (!player?.flags) return;
  player.flags.autoFullManualDowngraded = false;
  player.flags.autoFullManualMoveAt = null;
  player.flags.autoFullManualRestoreAt = null;
}

function markAutoFullManualMove(player, fromZone, fromRoom, toZone, toRoom, now = Date.now()) {
  if (!player) return;
  if (!player.flags) player.flags = {};
  if (fromZone === toZone && fromRoom === toRoom) return;
  const shouldTrack = Boolean(player.flags.autoFullEnabled || player.flags.autoFullManualDowngraded);
  if (!shouldTrack) return;

  player.flags.autoFullManualDowngraded = true;
  player.flags.autoFullManualMoveAt = now;
  player.flags.autoFullManualRestoreAt = now + AUTO_FULL_MANUAL_RESTORE_MS;

  if (player.flags.autoFullEnabled) {
    player.flags.autoFullEnabled = false;
    player.forceStateRefresh = true;
    if (typeof player.send === 'function') {
      player.send('检测到手动切换房间，已降级为普通挂机。10分钟无移动后将自动恢复智能挂机。');
    }
  }
}

function tryRestoreAutoFullAfterManualDowngrade(player, now = Date.now()) {
  if (!player?.flags?.autoFullManualDowngraded) return;
  if (player.flags.autoFullEnabled) {
    clearAutoFullManualDowngrade(player);
    return;
  }
  const restoreAt = Number(player.flags.autoFullManualRestoreAt || 0);
  if (!restoreAt || restoreAt > now) return;
  if (!player.flags.autoSkillId) {
    clearAutoFullManualDowngrade(player);
    return;
  }
  if (!isSvipActive(player)) {
    const trialInfo = getAutoFullTrialInfo(player, now);
    if (!trialInfo.available) {
      clearAutoFullManualDowngrade(player);
      return;
    }
    const expiresAt = Number(player.flags.autoFullTrialExpiresAt || 0);
    if (expiresAt <= now) {
      clearAutoFullManualDowngrade(player);
      return;
    }
  }
  player.flags.autoFullEnabled = true;
  if (!player.flags.autoSkillId) player.flags.autoSkillId = 'all';
  if (player.flags.autoHpPct == null) player.flags.autoHpPct = 50;
  if (player.flags.autoMpPct == null) player.flags.autoMpPct = 50;
  clearAutoFullManualDowngrade(player);
  player.forceStateRefresh = true;
  if (typeof player.send === 'function') {
    player.send('10分钟内未移动，已自动恢复智能挂机。');
  }
}

function downgradeAutoFullInZhuxianTower(player) {
  if (!player) return;
  if (!player.flags) player.flags = {};
  const inTower = player.position?.zone === ZHUXIAN_TOWER_ZONE_ID;
  if (inTower) {
    if (player.flags.autoFullEnabled) {
      player.flags.autoFullEnabled = false;
      player.forceStateRefresh = true;
      if (typeof player.send === 'function') {
        player.send('浮图塔内智能挂机已自动降级为普通挂机。');
      }
    }
    player.flags.autoFullTowerDowngraded = true;
    return;
  }
  if (player.flags.autoFullTowerDowngraded) {
    player.flags.autoFullTowerDowngraded = false;
  }
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
    if (zoneId === ZHUXIAN_TOWER_ZONE_ID) continue;
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

function selectLeastPopulatedRoomAuto(zoneId, roomId, realmId) {
  if (zoneId === PERSONAL_BOSS_ZONE_ID || String(roomId || '').includes('__u_')) {
    return roomId;
  }
  const baseRoomId = String(roomId || '').replace(/\d+$/, '');
  const roomOptions = [];
  const tryAddRoom = (candidateRoomId) => {
    if (!WORLD[zoneId]?.rooms?.[candidateRoomId]) return;
    const roomRealmId = getRoomRealmId(zoneId, candidateRoomId, realmId || 1);
    const playerCount = listOnlinePlayers(roomRealmId)
      .filter((p) => p.position.zone === zoneId && p.position.room === candidateRoomId).length;
    roomOptions.push({ roomId: candidateRoomId, playerCount });
  };

  if (baseRoomId) {
    tryAddRoom(baseRoomId);
    for (let i = 1; i <= ROOM_VARIANT_COUNT; i += 1) {
      tryAddRoom(`${baseRoomId}${i}`);
    }
  }

  if (roomOptions.length === 0) return roomId;
  roomOptions.sort((a, b) => a.playerCount - b.playerCount);
  return roomOptions[0].roomId;
}

function findAliveBossTarget(player) {
  if (!player) return null;
  ensureAutoFullPersonalBossTargets(player);
  const realmIds = Array.from(new Set([player.realmId || 1, CROSS_REALM_REALM_ID]));
  const crossBossCooldownUntil = Number(player.flags?.autoFullCrossBossCooldownUntil || 0);
  const playerCultivationLevel = getCultivationLevel(player);
  let best = null;
  for (const realmId of realmIds) {
    const mobs = getAllAliveMobs(realmId);
    for (const mob of mobs) {
      if (!mob || mob.hp <= 0) continue;
      const tpl = MOB_TEMPLATES[mob.templateId];
      if (!tpl || !isBossMob(tpl)) continue;
      if (!isAutoFullBossAllowed(player, tpl)) continue;
      const zoneId = mob.zoneId;
      const roomId = mob.roomId;
      if (!zoneId || !roomId) continue;
      if (zoneId === ZHUXIAN_TOWER_ZONE_ID) continue;
      if (isCultivationBoss(tpl)) {
        // 修真BOSS仅在本服realm内追踪，避免因为跨服realm的同名目标导致反复空跑切房
        if (realmId !== (player.realmId || 1)) continue;
        const roomMinLevel = Number(WORLD[zoneId]?.rooms?.[roomId]?.minCultivationLevel);
        if (!Number.isFinite(roomMinLevel) || roomMinLevel !== playerCultivationLevel) continue;
      }
      if (zoneId === PERSONAL_BOSS_ZONE_ID) {
        const ownRoomId = getPlayerPersonalBossRoomId(player, roomId);
        if (!ownRoomId || ownRoomId !== roomId) continue;
      }
      if (zoneId === CROSS_REALM_ZONE_ID && roomId === 'arena' && crossBossCooldownUntil > Date.now()) {
        continue;
      }
      if (tpl.id === 'cross_world_boss') {
        const blockedCrossBossId = String(player.flags?.autoFullCrossBossBlockedId || player.flags?.autoFullCrossBossSeenId || '');
        const awaitingCrossBossRespawn = Boolean(player.flags?.autoFullCrossBossAwaitRespawn);
        const currentCrossBossId = String(mob.id || '');
        // 离开跨服BOSS房后，仅在检测到"新一轮刷新(新mob.id)"时才允许再次跳回
        if (awaitingCrossBossRespawn && blockedCrossBossId && currentCrossBossId === blockedCrossBossId) {
          continue;
        }
        if (awaitingCrossBossRespawn && blockedCrossBossId && currentCrossBossId && currentCrossBossId !== blockedCrossBossId) {
          player.flags.autoFullCrossBossAwaitRespawn = false;
          player.flags.autoFullCrossBossBlockedId = null;
        }
      }
      if (zoneId === CROSS_RANK_ZONE_ID) continue;
      if (!WORLD[zoneId]?.rooms?.[roomId]) continue;
      if (!canEnterRoomByCultivation(player, zoneId, roomId)) continue;
      if (player.position.zone === zoneId && player.position.room === roomId) continue;
      const exp = Number(tpl.exp || 0);
      if (!best || exp > best.exp) {
        best = { zoneId, roomId, exp, mobId: mob.id, templateId: tpl.id };
      }
    }
  }
  return best;
}

function ensureAutoFullPersonalBossTargets(player, now = Date.now()) {
  if (!player) return;
  if (!player.flags) player.flags = {};
  const nextAt = Number(player.flags.autoFullPersonalBossWarmupAt || 0);
  if (nextAt > now) return;
  player.flags.autoFullPersonalBossWarmupAt = now + 5000;

  const roomIds = [];
  const svipActive = isSvipActive(player);
  const vipActive = isVipActive(player) || svipActive;
  const svipPermanent = svipActive && !Number(player.flags?.svipExpiresAt || 0);
  if (vipActive) roomIds.push(getPlayerPersonalBossRoomId(player, 'vip_lair'));
  if (svipActive) roomIds.push(getPlayerPersonalBossRoomId(player, 'svip_lair'));
  if (svipPermanent) roomIds.push(getPlayerPersonalBossRoomId(player, 'perma_lair'));

  for (const roomId of roomIds) {
    if (!roomId) continue;
    ensurePersonalBossRoom(roomId);
    const roomRealmId = getRoomRealmId(PERSONAL_BOSS_ZONE_ID, roomId, player.realmId || 1);
    spawnMobs(PERSONAL_BOSS_ZONE_ID, roomId, roomRealmId);
  }
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
  if (zoneId === ZHUXIAN_TOWER_ZONE_ID) return false;
  let targetRoomId = roomId;
  if (zoneId === PERSONAL_BOSS_ZONE_ID) {
    targetRoomId = getPlayerPersonalBossRoomId(player, roomId);
    if (!targetRoomId) return false;
    ensurePersonalBossRoom(targetRoomId);
  }
  if (player.position.zone === zoneId && player.position.room === targetRoomId) return false;
  if (!WORLD[zoneId]?.rooms?.[targetRoomId]) return false;
  if (!canEnterRoomByCultivation(player, zoneId, targetRoomId)) return false;
  const fromRoom = { zone: player.position.zone, room: player.position.room };
  player.position.zone = zoneId;
  player.position.room = targetRoomId;
  player.forceStateRefresh = true;
  if (typeof player.send === 'function') {
    const zoneName = WORLD[zoneId]?.name || zoneId;
    const roomName = WORLD[zoneId]?.rooms?.[targetRoomId]?.name || targetRoomId;
    player.send(`智能挂机前往 ${zoneName} - ${roomName}。`);
  }
  sendRoomState(fromRoom.zone, fromRoom.room, player.realmId || 1);
  sendRoomState(zoneId, targetRoomId, player.realmId || 1);
  return true;
}

function tryAutoFullBossMove(player) {
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
  if (isAutoFullCultivationBossFocused(player)) {
    const resumeAt = Number(player.flags?.autoFullCultivationBossResumeAt || 0);
    if (resumeAt > now) return null;
  }
  const pausedUntil = Number(player.flags.autoFullPausedUntil || 0);
  if (pausedUntil > now) return null;
  const currentRoomRealmId = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
  const currentRoomMobs = getAliveMobs(player.position.zone, player.position.room, currentRoomRealmId);
  // 当前房间已有可打BOSS时不切房，避免跨服BOSS与其它房间来回跳转
  if (findBossInRoom(currentRoomMobs, player)) return null;
  const lastMoveAt = Number(player.flags.autoFullLastMoveAt || 0);
  const canMoveForBoss = now - lastMoveAt >= AUTO_FULL_BOSS_MOVE_COOLDOWN_MS;
  if (!canMoveForBoss) return null;
  const bossTarget = findAliveBossTarget(player);
  if (bossTarget && movePlayerToRoom(player, bossTarget.zoneId, bossTarget.roomId)) {
    if (MOB_TEMPLATES[bossTarget.templateId] && isCultivationBoss(MOB_TEMPLATES[bossTarget.templateId])) {
      player.flags.autoFullCultivationBossResumeAt = null;
    }
    if (bossTarget.templateId === 'cross_world_boss') {
      player.flags.autoFullCrossBossSeenId = bossTarget.mobId || null;
      player.flags.autoFullCrossBossAwaitRespawn = false;
      player.flags.autoFullCrossBossBlockedId = null;
    }
    player.flags.autoFullLastMoveAt = now;
    return 'moved';
  }
  return null;
}

function updateAutoFullCultivationBossRespawnWatch(player, roomRealmId, now = Date.now()) {
  if (!player?.flags) return;
  if (!isAutoFullOnlySelectedCultivationBosses(player)) {
    player.flags.autoFullCultivationBossResumeAt = null;
    return;
  }
  const zoneId = player.position?.zone;
  const roomId = player.position?.room;
  if (!zoneId || !roomId) return;
  const room = WORLD[zoneId]?.rooms?.[roomId];
  const roomMinLevel = Number(room?.minCultivationLevel);
  if (!Number.isFinite(roomMinLevel)) return;

  const selectedCultivationNames = getAutoFullSelectedCultivationBossNames(player);
  if (!selectedCultivationNames || selectedCultivationNames.size === 0) return;
  const roomMobs = getRoomMobs(zoneId, roomId, roomRealmId);
  if (!Array.isArray(roomMobs) || roomMobs.length === 0) return;

  let nearestRespawnAt = 0;
  for (const mob of roomMobs) {
    const tpl = MOB_TEMPLATES[mob?.templateId];
    if (!tpl || !isCultivationBoss(tpl)) continue;
    const name = normalizeBossName(tpl.name || '');
    if (!selectedCultivationNames.has(name)) continue;
    if (Number(mob.hp || 0) > 0) {
      player.flags.autoFullCultivationBossResumeAt = null;
      return;
    }
    const respawnAt = Number(mob.respawnAt || 0);
    if (respawnAt > now && (!nearestRespawnAt || respawnAt < nearestRespawnAt)) {
      nearestRespawnAt = respawnAt;
    }
  }
  if (nearestRespawnAt > now) {
    player.flags.autoFullCultivationBossResumeAt = nearestRespawnAt;
  }
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
  const lastMoveAt = Number(player.flags.autoFullLastMoveAt || 0);
  const canMove = now - lastMoveAt >= AUTO_FULL_MOVE_COOLDOWN_MS;
  const shouldRepathAfterDeath = Boolean(player.flags?.autoFullRepathAfterDeath);
  const bossMove = tryAutoFullBossMove(player);
  if (bossMove === 'moved') return 'moved';
  const bossMob = findBossInRoom(roomMobs, player);
  if (bossMob) {
    const tpl = MOB_TEMPLATES[bossMob.templateId];
    if (tpl && isCultivationBoss(tpl)) {
      player.flags.autoFullCultivationBossResumeAt = null;
    }
    player.flags.autoFullCultivationFarmRoom = null;
    if (tpl?.id === 'cross_world_boss') {
      player.flags.autoFullCrossBossSeenId = bossMob.id;
      player.flags.autoFullCrossBossAwaitRespawn = false;
      player.flags.autoFullCrossBossBlockedId = null;
    }
    if (!player.flags.lastBossRoom) {
      player.flags.lastBossRoom = { zoneId: player.position.zone, roomId: player.position.room };
    } else {
      player.flags.lastBossRoom.zoneId = player.position.zone;
      player.flags.lastBossRoom.roomId = player.position.room;
    }
    player.combat = { targetId: bossMob.id, targetType: 'mob', skillId: null };
    return 'engaged';
  }
  if (shouldRepathAfterDeath && canMove) {
    const bestAfterDeath = getAutoFullBestRoom(player);
    if (bestAfterDeath) {
      const targetZoneId = bestAfterDeath.zoneId;
      const targetRoomId = selectLeastPopulatedRoomAuto(bestAfterDeath.zoneId, bestAfterDeath.roomId, player.realmId || 1);
      if (movePlayerToRoom(player, targetZoneId, targetRoomId)) {
        player.flags.autoFullLastMoveAt = now;
        player.flags.autoFullRepathAfterDeath = false;
        return 'moved';
      }
    }
    player.flags.autoFullRepathAfterDeath = false;
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
  const currentRoomRealmIdForWatch = getRoomRealmId(player.position.zone, player.position.room, player.realmId || 1);
  updateAutoFullCultivationBossRespawnWatch(player, currentRoomRealmIdForWatch, now);
  const best = getAutoFullBestRoom(player);
  if (best && canMove) {
    if (player.position.zone === CROSS_REALM_ZONE_ID && player.position.room === 'arena') {
      // 跨服BOSS当前不在场时，标记等待下一轮刷新，避免重复回跳
      player.flags.autoFullCrossBossAwaitRespawn = true;
      player.flags.autoFullCrossBossBlockedId = player.flags.autoFullCrossBossSeenId || player.flags.autoFullCrossBossBlockedId || null;
    }
    let targetZoneId = best.zoneId;
    let targetRoomId = selectLeastPopulatedRoomAuto(best.zoneId, best.roomId, player.realmId || 1);
    if (isAutoFullCultivationBossFocused(player)) {
      const sticky = player.flags.autoFullCultivationFarmRoom;
      const stickyAt = Number(sticky?.at || 0);
      const stickyZoneId = String(sticky?.zoneId || '');
      const stickyRoomId = String(sticky?.roomId || '');
      const stickyValid = (
        stickyAt > 0 &&
        now - stickyAt < 60000 &&
        stickyZoneId &&
        stickyRoomId &&
        WORLD[stickyZoneId]?.rooms?.[stickyRoomId] &&
        canEnterRoomByCultivation(player, stickyZoneId, stickyRoomId)
      );
      if (stickyValid) {
        targetZoneId = stickyZoneId;
        targetRoomId = stickyRoomId;
      } else {
        player.flags.autoFullCultivationFarmRoom = { zoneId: targetZoneId, roomId: targetRoomId, at: now };
      }
    }
    if (player.position.zone !== targetZoneId || player.position.room !== targetRoomId) {
      if (movePlayerToRoom(player, targetZoneId, targetRoomId)) {
        player.flags.autoFullLastMoveAt = now;
        return 'moved';
      }
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
    const petMagicBreak = target.status.debuffs.petMagicBreak;
    const poison = target.status.debuffs.poison;
    const poisonEffect = target.status.debuffs.poisonEffect;
    delete target.status.debuffs;
    if (healBlock || armorBreak || weak || petMagicBreak) {
      target.status.debuffs = {};
      if (healBlock) target.status.debuffs.healBlock = healBlock;
      if (armorBreak) target.status.debuffs.armorBreak = armorBreak;
      if (weak) target.status.debuffs.weak = weak;
      if (petMagicBreak) target.status.debuffs.petMagicBreak = petMagicBreak;
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
  if (!target.status) target.status = {};
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
  const guardMul = hasActivePetSkill(target, 'pet_guard_adv') ? PET_COMBAT_BALANCE.guardAdvDamageMul :
                  hasActivePetSkill(target, 'pet_guard') ? PET_COMBAT_BALANCE.guardDamageMul : 1;
  if (guardMul !== 1) {
    dmg *= guardMul;
  }
  const toughSkinMul = hasActivePetSkill(target, 'pet_tough_skin_adv') ? PET_COMBAT_BALANCE.toughSkinAdvDamageMul :
                       hasActivePetSkill(target, 'pet_tough_skin') ? PET_COMBAT_BALANCE.toughSkinDamageMul : 1;
  if (toughSkinMul !== 1) {
    dmg *= toughSkinMul;
  }
  const soulChainMul = hasActivePetSkill(target, 'pet_soul_chain_adv') ? PET_COMBAT_BALANCE.soulChainAdvDamageMul :
                       hasActivePetSkill(target, 'pet_soul_chain') ? PET_COMBAT_BALANCE.soulChainDamageMul : 1;
  if (soulChainMul !== 1) {
    dmg *= soulChainMul;
  }
  if (hasActivePetSkill(target, 'pet_divine_guard') && Math.random() < PET_COMBAT_BALANCE.divineGuardChance) {
    dmg *= PET_COMBAT_BALANCE.divineGuardDamageMul;
    if (typeof target.send === 'function') {
      target.send('宠物技能【神佑】触发，伤害大幅减免。');
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
  if (hasActivePetSkill(player, 'pet_rebirth')) {
    const now = Date.now();
    if (!player.flags) player.flags = {};
    const cdMs = PET_COMBAT_BALANCE.rebirthCooldownMs;
    const last = Number(player.flags.petRebirthAt || 0);
    const rebirthChance = hasActivePetSkill(player, 'pet_rebirth_adv') ? PET_COMBAT_BALANCE.rebirthAdvChance :
                           hasActivePetSkill(player, 'pet_rebirth') ? PET_COMBAT_BALANCE.rebirthChance : 0;
    if (now - last >= cdMs && rebirthChance > 0 && Math.random() < rebirthChance) {
      player.flags.petRebirthAt = now;
      const rebirthRecoverRatio = hasActivePetSkill(player, 'pet_rebirth_adv') ? PET_COMBAT_BALANCE.rebirthAdvRecoverRatio :
                                   hasActivePetSkill(player, 'pet_rebirth') ? PET_COMBAT_BALANCE.rebirthRecoverRatio : 0.3;
      player.hp = Math.max(1, Math.floor(player.max_hp * rebirthRecoverRatio));
      player.mp = Math.max(0, Math.floor(player.max_mp * rebirthRecoverRatio));
      player.send('宠物技能【涅槃】触发，你恢复了部分生命和法力。');
      return true;
    }
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
  const vipActive = isVipActive(player);
  const svipActive = isSvipActive(player);
  const vipLikeActive = vipActive || svipActive;
  const offlineSmartManaged = Boolean(svipActive && player.flags?.autoFullEnabled);
  if (!vipLikeActive) {
    player.flags.offlineAt = null;
    player.send('离线挂机仅VIP/SVIP可用。');
    return;
  }
  const maxHours = 24;
  const offlineMinutes = Math.min(Math.floor((Date.now() - offlineAt) / 60000), maxHours * 60);
  if (offlineMinutes <= 0) return;
  const offlineMultiplier = 2;
  const cultivationMult = cultivationRewardMultiplier(player);
  const rewardMult = totalRewardMultiplier({
    vipActive,
    svipActive,
    guildActive: Boolean(player.guild),
    guildBuildRewardPct: Number(player.guild?.buildExpBonusPct || player.guild?.buildRewardBonusPct || 0),
    cultivationMult,
    partyMult: 1,
    treasureExpPct: Number(player.flags?.treasureExpBonusPct || 0)
  });
  const goldRewardMult = totalGoldRewardMultiplier({
    vipActive,
    svipActive,
    guildActive: Boolean(player.guild),
    guildBuildGoldPct: Number(player.guild?.buildGoldBonusPct || 0),
    cultivationMult,
    partyMult: 1
  });
  const expGain = Math.floor(offlineMinutes * player.level * offlineMultiplier * rewardMult);
  const goldGain = Math.floor(offlineMinutes * player.level * offlineMultiplier * goldRewardMult);
  let fruitGain = 0;
  let petFruitGain = 0;
  const fruitDropRate = getTrainingFruitDropRate();
  const petFruitDropRate = getPetTrainingFruitDropRate();
  for (let i = 0; i < offlineMinutes; i += 1) {
    if (Math.random() <= fruitDropRate) {
      fruitGain += 1;
    }
    if (Math.random() <= petFruitDropRate) {
      petFruitGain += 1;
    }
  }
  gainExp(player, expGain);
  const petExpResult = gainActivePetExp(player, expGain);
  player.gold += goldGain;
  if (fruitGain > 0) {
    addItem(player, 'training_fruit', fruitGain);
  }
  if (petFruitGain > 0) {
    addItem(player, 'pet_training_fruit', petFruitGain);
  }
  player.flags.offlineAt = null;
  const offlineLabel = offlineSmartManaged ? '离线托管（智能挂机）收益' : '离线挂机收益';
  if (fruitGain > 0 || petFruitGain > 0) {
    const extraParts = [];
    if (fruitGain > 0) extraParts.push(`修炼果 x${fruitGain}`);
    if (petFruitGain > 0) extraParts.push(`宠物修炼果 x${petFruitGain}`);
    player.send(`${offlineLabel}: ${expGain} 经验, ${goldGain} 金币, ${extraParts.join('，')}。`);
  } else {
    player.send(`${offlineLabel}: ${expGain} 经验, ${goldGain} 金币。`);
  }
  if (petExpResult?.leveled > 0) {
    player.send(`出战宠物升级 +${petExpResult.leveled}。`);
  }
  if (Array.isArray(petExpResult?.autoLearned) && petExpResult.autoLearned.length > 0) {
    player.send(`宠物领悟技能: ${petExpResult.autoLearned.map((s) => s.name).join('、')}。`);
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
const roomStatePatchMetaCache = new Map();
const ROOM_STATE_CACHE_MAX_SIZE = 2000; // LRU 限制：最多保留2000个房间状态

// LRU 清理：当 Map 超过大小时，删除最老的条目
function ensureMapSizeLimit(map, maxSize) {
  if (map.size <= maxSize) return;
  const keysToDelete = map.size - maxSize;
  let deleted = 0;
  for (const key of map.keys()) {
    if (deleted >= keysToDelete) break;
    map.delete(key);
    deleted++;
  }
}
let roomStateLastUpdate = 0;
let roomStateCachedData = null;
const ROOM_STATE_TTL = 100; // 100ms缓存时间
const ROOM_STATE_MOBS_TTL = 250;
const ROOM_STATE_PLAYERS_TTL = 1000;
const ROOM_STATE_RANK_TTL = 1000;
const ROOM_STATE_SERVER_TIME_TTL = 1000;
const STATE_DYNAMIC_AUX_TTL = 5000;
const STATE_STATIC_AUX_TTL = 30000;
const VIP_SELF_CLAIM_CACHE_TTL = 10000; // VIP自领缓存10秒
const STATE_THROTTLE_CACHE_TTL = 10000; // 状态节流缓存10秒
const DAILY_LUCKY_CACHE_TTL = 30000; // 每日幸运玩家缓存30秒
const ZHUXIAN_TOWER_RANK_CACHE_TTL = 300000; // 浮图塔排行榜缓存5分钟，减少数据库压力
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
let lootLogEnabled = false;
const dailyLuckyCache = new Map();
const zhuxianTowerRankCache = new Map();
const zhuxianTowerRankPending = new Map(); // 防止并发查询的锁
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
  const towerTitle = player?.flags?.zhuxianTowerTitle || '';
  const parts = [baseTitle, luckyTitle, caiyaTitle, towerTitle].filter((t) => t && String(t).trim());
  return parts.length ? parts.join('·') : '';
}

function getStateThrottleKey(player, socket = null) {
  // 使用稳定的用户ID作为key，避免同一个玩家产生多个key导致Map泄漏
  if (player) {
    const uid = player.userId || player.id;
    if (uid) return String(uid);
  }
  // 备用：使用socket.id（仅用于未登录状态）
  const sid = player?.socket?.id || socket?.id;
  if (sid) return `sock:${sid}`;
  return null;
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
  return 48;
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

async function getZhuxianTowerRankTop10Cached(realmId) {
  const now = Date.now();
  const cached = zhuxianTowerRankCache.get(realmId);
  if (cached && now - cached.at < ZHUXIAN_TOWER_RANK_CACHE_TTL) {
    return cached.value;
  }

  // 防止缓存击穿：如果已有请求在查询，等待其结果
  const pending = zhuxianTowerRankPending.get(realmId);
  if (pending) {
    return pending;
  }

  // 创建新的查询 Promise，让其他并发请求可以共享结果
  const queryPromise = (async () => {
    try {
      // 优化：使用生成列 has_tower_data 快速过滤有诛仙塔数据的角色
      // 索引 idx_characters_tower_ranking 覆盖此查询，避免回表
      const rows = await knex('characters')
        .select('name', 'class', 'level', 'flags_json')
        .where({ realm_id: realmId, has_tower_data: 1 })
        .limit(5000); // 限制最大查询数量
  const ranked = rows
    .map((row) => {
      let flags = null;
      try {
        flags = row.flags_json ? JSON.parse(row.flags_json) : null;
      } catch {
        flags = null;
      }
      const floor = getZhuxianTowerBestFloorFromFlags(flags);
      return {
        name: row.name,
        classId: row.class,
        level: Math.max(1, Math.floor(Number(row.level || 1))),
        floor
      };
    })
    .filter((entry) => entry.floor > 0)
    .sort((a, b) => {
      if (b.floor !== a.floor) return b.floor - a.floor;
      if (b.level !== a.level) return b.level - a.level;
      return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
    })
    .slice(0, 10)
    .map((entry, idx) => ({
      rank: idx + 1,
      name: entry.name,
      classId: entry.classId,
      level: entry.level,
      floor: entry.floor
    }));
      zhuxianTowerRankCache.set(realmId, { at: now, value: ranked });
      return ranked;
    } catch (err) {
      console.error(`[TowerRank] 查询排行榜失败 realmId=${realmId}:`, err);
      throw err;
    } finally {
      zhuxianTowerRankPending.delete(realmId);
    }
  })();

  zhuxianTowerRankPending.set(realmId, queryPromise);
  return queryPromise;
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
  if (zoneId === PERSONAL_BOSS_ZONE_ID) {
    ensurePersonalBossRoom(roomId);
  }
  const room = zone?.rooms?.[roomId];
  if (!room) return [];
  const exitsSource = { ...(room.exits || {}) };
  if (player && zoneId === PERSONAL_BOSS_ZONE_ID && roomId === 'entry') {
    const vipActive = normalizeVipStatus(player);
    const svipActive = normalizeSvipStatus(player);
    const svipPermanent = svipActive && !Number(player.flags?.svipExpiresAt || 0);
    if (vipActive || svipActive) exitsSource.north = 'vip_lair';
    else delete exitsSource.north;
    if (svipActive) exitsSource.east = 'svip_lair';
    else delete exitsSource.east;
    if (svipPermanent) exitsSource.up = 'perma_lair';
    else delete exitsSource.up;
  }
  if (player && zoneId === 'mg_plains' && /^gate\d*$/.test(String(roomId || ''))) {
    const vipActive = normalizeVipStatus(player);
    const svipActive = normalizeSvipStatus(player);
    if (vipActive || svipActive) exitsSource.vip = 'pboss:entry';
    else delete exitsSource.vip;
  }
  const allExits = Object.entries(exitsSource).map(([dir, dest]) => {
    let destZoneId = zoneId;
    let destRoomId = dest;
    if (dest.includes(':')) {
      [destZoneId, destRoomId] = dest.split(':');
    }
    if (
      player &&
      zoneId === ZHUXIAN_TOWER_ZONE_ID &&
      roomId === ZHUXIAN_TOWER_ENTRY_ROOM_ID &&
      dir === 'north' &&
      destZoneId === ZHUXIAN_TOWER_ZONE_ID &&
      destRoomId === 'floor_01_x'
    ) {
      const progress = normalizeZhuxianTowerProgress(player);
      const challengeFloor = Math.max(1, Math.floor(Number(progress.highestClearedFloor || 0)) + 1);
      const roomToken = `floor_${String(challengeFloor).padStart(2, '0')}_x`;
      destRoomId = getPlayerZhuxianTowerRoomId(player, roomToken);
      ensureZhuxianTowerRoom(destRoomId);
    }
    if (
      player &&
      zoneId === PERSONAL_BOSS_ZONE_ID &&
      roomId === 'entry' &&
      destZoneId === PERSONAL_BOSS_ZONE_ID &&
      /^(vip_lair|svip_lair|perma_lair)$/.test(destRoomId)
    ) {
      destRoomId = getPlayerPersonalBossRoomId(player, destRoomId);
      ensurePersonalBossRoom(destRoomId);
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

  const roomPlayers = listConnectedPlayers(effectiveRealmId)
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
  ensureMapSizeLimit(roomStateDataCache, ROOM_STATE_CACHE_MAX_SIZE);
  return data;
}

let PET_MAX_OWNED = 50;
let PET_BASE_SKILL_SLOTS = 3;
let PET_MAX_SKILL_SLOTS = 16;
let PET_COMPREHEND_COST_GOLD = 150000;
let PET_SYNTHESIS_COST_GOLD = 500000;
let PET_COMPREHEND_MAX_SKILLS = 3;
let PET_BOOK_UNLOCK_SLOT4_CHANCE = 0.35;
let PET_SYNTHESIS_UNLOCK_SLOT_CHANCE = 0.45;
let PET_SYNTHESIS_INHERIT_CHANCE = 0.6;
let PET_SYNTHESIS_MULTI_SKILL_CHANCE = 0;
let PET_EXP_NEED_RATIO = 0.8;
let PET_AUTO_COMPREHEND_CHANCE = {
  normal: 0.2,
  excellent: 0.24,
  rare: 0.28,
  epic: 0.32,
  legendary: 0.36,
  supreme: 0.4,
  ultimate: 0.45
};
let PET_RARITY_ORDER = ['normal', 'excellent', 'rare', 'epic', 'legendary', 'supreme', 'ultimate'];
let PET_RARITY_LABELS = {
  normal: '普通',
  excellent: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  supreme: '至尊',
  ultimate: '终极'
};
let PET_RARITY_GROWTH_RANGE = {
  normal: [1.0, 1.12],
  excellent: [1.08, 1.2],
  rare: [1.16, 1.3],
  epic: [1.24, 1.42],
  legendary: [1.34, 1.56],
  supreme: [1.46, 1.74],
  ultimate: [1.62, 1.95]
};
let PET_RARITY_APTITUDE_RANGE = {
  normal: { hp: [1400, 2600], atk: [70, 130], def: [60, 120], mag: [70, 130], agility: [60, 120] },
  excellent: { hp: [1900, 3200], atk: [95, 160], def: [85, 150], mag: [95, 160], agility: [85, 150] },
  rare: { hp: [2500, 3900], atk: [125, 200], def: [110, 190], mag: [125, 200], agility: [110, 190] },
  epic: { hp: [3200, 4700], atk: [160, 245], def: [140, 230], mag: [160, 245], agility: [140, 230] },
  legendary: { hp: [4000, 5600], atk: [195, 295], def: [175, 280], mag: [195, 295], agility: [175, 280] },
  supreme: { hp: [5000, 6600], atk: [240, 360], def: [220, 340], mag: [240, 360], agility: [220, 340] },
  ultimate: { hp: [6200, 8000], atk: [300, 440], def: [280, 420], mag: [300, 440], agility: [280, 420] }
};

const ZODIAC_DIVINE_BEAST_CONFIG = {
  '鼠年神兽': { skillId: 'pet_beast_rat_swiftness', skillName: '神鼠灵跃' },
  '牛年神兽': { skillId: 'pet_beast_ox_bulwark', skillName: '神牛壁垒' },
  '虎年神兽': { skillId: 'pet_beast_tiger_fang', skillName: '神虎战意' },
  '兔年神兽': { skillId: 'pet_beast_rabbit_moonstep', skillName: '神兔月影' },
  '龙年神兽': { skillId: 'pet_beast_dragon_might', skillName: '神龙天威' },
  '蛇年神兽': { skillId: 'pet_beast_snake_scale', skillName: '神蛇玄鳞' },
  '马年神兽': { skillId: 'pet_beast_aegis', skillName: '神兽护甲' },
  '羊年神兽': { skillId: 'pet_beast_goat_bless', skillName: '神羊赐福' },
  '猴年神兽': { skillId: 'pet_beast_monkey_edge', skillName: '神猴灵锋' },
  '鸡年神兽': { skillId: 'pet_beast_rooster_warcry', skillName: '神鸡战鸣' },
  '狗年神兽': { skillId: 'pet_beast_dog_guard', skillName: '神犬守护' },
  '猪年神兽': { skillId: 'pet_beast_pig_fortune', skillName: '神猪厚土' }
};
const ZODIAC_DIVINE_BEAST_SPECIES = Object.keys(ZODIAC_DIVINE_BEAST_CONFIG);
const DIVINE_BEAST_SHARED_SKILLS = [
  'pet_guard_adv',
  'pet_tough_skin_adv',
  'pet_fury_adv',
  'pet_crit_adv',
  'pet_bloodline_adv'
];

function getDivineBeastConfigBySpecies(species) {
  const key = String(species || '').trim();
  return ZODIAC_DIVINE_BEAST_CONFIG[key] || null;
}

function isDivineBeastSpecies(species) {
  return Boolean(getDivineBeastConfigBySpecies(species));
}

function getDivineBeastExclusiveSkillBySpecies(species) {
  return getDivineBeastConfigBySpecies(species)?.skillId || null;
}

let PET_SKILL_LIBRARY = [
  { id: 'pet_beast_rat_swiftness', name: '神鼠灵跃', grade: 'exclusive' },
  { id: 'pet_beast_ox_bulwark', name: '神牛壁垒', grade: 'exclusive' },
  { id: 'pet_beast_tiger_fang', name: '神虎战意', grade: 'exclusive' },
  { id: 'pet_beast_rabbit_moonstep', name: '神兔月影', grade: 'exclusive' },
  { id: 'pet_beast_dragon_might', name: '神龙天威', grade: 'exclusive' },
  { id: 'pet_beast_snake_scale', name: '神蛇玄鳞', grade: 'exclusive' },
  { id: 'pet_beast_aegis', name: '神兽护甲', grade: 'exclusive' },
  { id: 'pet_beast_goat_bless', name: '神羊赐福', grade: 'exclusive' },
  { id: 'pet_beast_monkey_edge', name: '神猴灵锋', grade: 'exclusive' },
  { id: 'pet_beast_rooster_warcry', name: '神鸡战鸣', grade: 'exclusive' },
  { id: 'pet_beast_dog_guard', name: '神犬守护', grade: 'exclusive' },
  { id: 'pet_beast_pig_fortune', name: '神猪厚土', grade: 'exclusive' },
  { id: 'pet_bash', name: '强力', grade: 'normal' },
  { id: 'pet_bash_adv', name: '高级强力', grade: 'advanced' },
  { id: 'pet_crit', name: '会心', grade: 'normal' },
  { id: 'pet_crit_adv', name: '高级会心', grade: 'advanced' },
  { id: 'pet_guard', name: '坚韧', grade: 'normal' },
  { id: 'pet_guard_adv', name: '高级坚韧', grade: 'advanced' },
  { id: 'pet_dodge', name: '敏捷', grade: 'normal' },
  { id: 'pet_dodge_adv', name: '高级敏捷', grade: 'advanced' },
  { id: 'pet_lifesteal', name: '吸血', grade: 'normal' },
  { id: 'pet_lifesteal_adv', name: '高级吸血', grade: 'advanced' },
  { id: 'pet_counter', name: '反击', grade: 'normal' },
  { id: 'pet_counter_adv', name: '高级反击', grade: 'advanced' },
  { id: 'pet_combo', name: '连击', grade: 'normal' },
  { id: 'pet_combo_adv', name: '高级连击', grade: 'advanced' },
  { id: 'pet_tough_skin', name: '硬皮', grade: 'normal' },
  { id: 'pet_tough_skin_adv', name: '高级硬皮', grade: 'advanced' },
  { id: 'pet_focus', name: '专注', grade: 'normal' },
  { id: 'pet_focus_adv', name: '高级专注', grade: 'advanced' },
  { id: 'pet_spirit', name: '灵能', grade: 'normal' },
  { id: 'pet_spirit_adv', name: '高级灵能', grade: 'advanced' },
  { id: 'pet_fury', name: '狂怒', grade: 'normal' },
  { id: 'pet_fury_adv', name: '高级狂怒', grade: 'advanced' },
  { id: 'pet_break', name: '破甲', grade: 'normal' },
  { id: 'pet_break_adv', name: '高级破甲', grade: 'advanced' },
  { id: 'pet_magic_break', name: '破魔', grade: 'normal' },
  { id: 'pet_magic_break_adv', name: '高级破魔', grade: 'advanced' },
  { id: 'pet_bloodline', name: '血脉', grade: 'normal' },
  { id: 'pet_bloodline_adv', name: '高级血脉', grade: 'advanced' },
  { id: 'pet_resolve', name: '不屈', grade: 'normal' },
  { id: 'pet_resolve_adv', name: '高级不屈', grade: 'advanced' },
  { id: 'pet_quick_step', name: '疾行', grade: 'normal' },
  { id: 'pet_quick_step_adv', name: '高级疾行', grade: 'advanced' },
  { id: 'pet_sunder', name: '撕裂', grade: 'normal' },
  { id: 'pet_sunder_adv', name: '高级撕裂', grade: 'advanced' },
  { id: 'pet_arcane_echo', name: '奥术回响', grade: 'normal' },
  { id: 'pet_arcane_echo_adv', name: '高级奥术回响', grade: 'advanced' },
  { id: 'pet_aoe', name: '横扫', grade: 'normal' },
  { id: 'pet_aoe_adv', name: '高级横扫', grade: 'advanced' },
  { id: 'pet_divine_guard', name: '神佑', grade: 'special' },
  { id: 'pet_kill_soul', name: '噬魂', grade: 'special' },
  { id: 'pet_war_horn', name: '战号', grade: 'special' },
  { id: 'pet_soul_chain', name: '魂链', grade: 'normal' },
  { id: 'pet_soul_chain_adv', name: '高级魂链', grade: 'advanced' },
  { id: 'pet_overload', name: '超载', grade: 'normal' },
  { id: 'pet_overload_adv', name: '高级超载', grade: 'advanced' },
  { id: 'pet_rebirth', name: '涅槃', grade: 'normal' },
  { id: 'pet_rebirth_adv', name: '高级涅槃', grade: 'advanced' }
];
const REQUIRED_PET_SKILL_LIBRARY_ENTRIES = Object.entries(ZODIAC_DIVINE_BEAST_CONFIG).map(([, cfg]) => ({
  id: cfg.skillId,
  name: cfg.skillName,
  grade: 'exclusive'
}));

let PET_SKILL_EFFECTS = {
  pet_beast_rat_swiftness: '被动：主人敏捷+12%、闪避+4%、命中+10%；协战连击触发+4%、疾袭触发+12%（追加伤害+8%）、护主闪避减伤触发+10%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_ox_bulwark: '被动：主人气血+20%、防御/魔御+25%；协战护主回血+1.2%最大生命，神佑触发+12%（护主减伤最高至18%）（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_tiger_fang: '被动：主人攻击+22%；协战伤害×1.12，暴击触发+3%，暴伤提升至1.72倍（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_rabbit_moonstep: '被动：主人敏捷+18%、闪避+6%；协战疾袭触发+16%（追加伤害+10%）、护主闪避减伤触发+8%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_dragon_might: '被动：主人攻击/魔法/道术+16%；协战伤害×1.10，破防+10%，破魔+10%，撕裂压制+10%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_snake_scale: '被动：主人防御/魔御+18%、魔法/道术+12%；协战破魔+18%，禁疗触发+12%，魂链压制+8%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_aegis: '被动：主人防御/魔御+40%；协战神佑触发+12%、护主闪避减伤触发+12%，破防+6%，破魔+6%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_goat_bless: '被动：主人气血/法力+15%、防御/魔御+12%；协战护主回血+1.8%最大生命，神佑触发+10%，护主闪避减伤触发+8%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_monkey_edge: '被动：主人攻击+15%、敏捷+15%、闪避+5%；协战连击触发+6%（连击伤害+12%）、奥术回响触发+10%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_rooster_warcry: '被动：主人攻击/魔法/道术+14%、命中+10%；协战伤害×1.06，禁疗触发+22%，破防+8%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_dog_guard: '被动：主人防御/魔御+20%、气血+12%、额外减伤+5%；协战神佑触发+18%（护主减伤最高至22%），魂链护主减伤额外+3%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_beast_pig_fortune: '被动：主人气血+28%、防御/魔御+15%；协战护主回血+2.5%最大生命，吸血+4%，反扑触发+14%（PVP中触发率×82%，数值×88%）（神兽专属）',
  pet_bash: '被动：物理协战伤害提升（约+4%~4.5%）',
  pet_bash_adv: '被动：物理协战伤害提升（约+6%~6.75%）',
  pet_crit: '被动：协战暴击率提升（PVE约+4.5%，PVP约+4%）',
  pet_crit_adv: '被动：协战暴击率提升（PVE约+6.75%，PVP约+6%）',
  pet_guard: '被动：血宠协战强化（血宠基础伤害约+4%~5%，护主更稳）',
  pet_guard_adv: '被动：血宠协战强化（血宠护主回血/压制进一步增强）',
  pet_dodge: '被动：协战后概率护主减伤（PVE约12%，PVP约8%；持续约1.0~1.2秒）',
  pet_dodge_adv: '被动：协战后概率护主减伤（PVE约18%，PVP约14%；减伤更高）',
  pet_lifesteal: '被动：协战伤害吸血给主人（PVE约3%，PVP约2%）',
  pet_lifesteal_adv: '被动：协战伤害吸血给主人（PVE约5%，PVP约3.5%）',
  pet_counter: '被动：协战后概率追加反扑（PVE约12%，PVP约8%，伤害约35%/28%）',
  pet_counter_adv: '被动：协战后概率追加反扑（PVE约20%，PVP约14%，伤害更高）',
  pet_combo: '被动：协战连击概率提升（PVE约+6%，PVP约+5%）',
  pet_combo_adv: '被动：协战连击概率提升（PVE约+9%，PVP约+8%）',
  pet_tough_skin: '被动：血宠协战强化（血宠基础伤害约+3%~4%）',
  pet_tough_skin_adv: '被动：血宠协战强化（血宠基础伤害约+5%~6%）',
  pet_focus: '被动：协战稳定伤害提升（约+1.5%~2%）并提高破防/破魔/暴击触发',
  pet_focus_adv: '被动：协战稳定伤害提升（约+3%~3.5%）并显著提高破防/破魔/暴击触发',
  pet_spirit: '被动：法术协战伤害提升（约+4%~4.5%）',
  pet_spirit_adv: '被动：法术协战伤害提升（约+6%~6.75%）',
  pet_fury: '被动：协战最终伤害提升（PVE约+4.5%，PVP约+4%）',
  pet_fury_adv: '被动：协战最终伤害提升（PVE约+6.75%，PVP约+6%）',
  pet_break: '被动：协战更易附加破防（额外概率约+8%~12%，减防约8%~12%）',
  pet_break_adv: '被动：协战更易附加破防（额外概率约+14%~20%，减防约14%~18%）',
  pet_magic_break: '被动：协战更易附加破魔（额外概率约+8%~12%，减魔御约8%~12%）',
  pet_magic_break_adv: '被动：协战更易附加破魔（额外概率约+14%~20%，减魔御约14%~18%）',
  pet_bloodline: '被动：提升护主/吸血回复（护主回复额外约+0.6%~0.8%最大生命）',
  pet_bloodline_adv: '被动：提升护主/吸血回复（护主回复额外约+1.2%~1.5%最大生命）',
  pet_resolve: '被动：协战时概率净化主人控制/减益（约21%，清1个负面）',
  pet_resolve_adv: '被动：协战时概率净化主人控制/减益（约31.5%，清1个负面）',
  pet_quick_step: '被动：协战更易疾袭/连击（疾袭约8%~12%，追加伤害约35%~45%）',
  pet_quick_step_adv: '被动：协战更易疾袭/连击（疾袭约14%~18%，并提升追加伤害）',
  pet_sunder: '被动：协战概率施加撕裂压制（约12%~16%，降防/降魔御至约90%）',
  pet_sunder_adv: '被动：协战概率施加撕裂压制（约18%~24%，降防/降魔御至约85%~88%）',
  pet_arcane_echo: '被动：协战概率追加回响伤害（约8%~12%，追加约16%~22%）',
  pet_arcane_echo_adv: '被动：协战概率追加回响伤害（约14%~20%，追加约24%~32%）',
  pet_aoe: '被动：协战概率触发横扫（PVE约18%：额外1目标/30%；PVP约10%：主目标追加18%）；蓝耗=最大法力10%（最低45）',
  pet_aoe_adv: '被动：协战概率触发横扫（PVE约30%：额外2目标/45%；PVP约18%：主目标追加28%）；蓝耗=最大法力18%（最低80）',
  pet_divine_guard: '被动：协战后概率给予主人神佑减伤（PVE约12%/减伤15%，PVP约8%/减伤12%）',
  pet_kill_soul: '被动：宠物协战击杀时恢复主人生命/法力（各约最大值4.5%）',
  pet_war_horn: '被动：协战概率施加禁疗（额外概率约8%~20%，持续5秒，治疗约10%）',
  pet_soul_chain: '被动：协战概率魂链压制（PVE约12%，PVP约8%）；目标降伤约10%~12%，并给主人短减伤',
  pet_soul_chain_adv: '被动：协战概率魂链压制（PVE约20%，PVP约14%）；目标降伤约16%~20%，护主更强',
  pet_overload: '被动：协战伤害提升（PVE约+3%，PVP约+2.5%）',
  pet_overload_adv: '被动：协战伤害提升（PVE约+5%，PVP约+4%）',
  pet_rebirth: '被动：主人血量低于35%时，协战概率紧急回血（约12%，回复约30%，有冷却）',
  pet_rebirth_adv: '被动：主人血量低于35%时，协战概率紧急回血（约18%，回复约45%，有冷却）'
};

const PET_SKILL_TYPE_HINTS = {
  pet_beast_rat_swiftness: '神兽',
  pet_beast_ox_bulwark: '神兽',
  pet_beast_tiger_fang: '神兽',
  pet_beast_rabbit_moonstep: '神兽',
  pet_beast_dragon_might: '神兽',
  pet_beast_snake_scale: '神兽',
  pet_beast_aegis: '神兽',
  pet_beast_goat_bless: '神兽',
  pet_beast_monkey_edge: '神兽',
  pet_beast_rooster_warcry: '神兽',
  pet_beast_dog_guard: '神兽',
  pet_beast_pig_fortune: '神兽',
  pet_bash: '物理宠优先',
  pet_bash_adv: '物理宠优先',
  pet_crit: '物理宠/法术宠优先',
  pet_crit_adv: '物理宠/法术宠优先',
  pet_guard: '血宠优先',
  pet_guard_adv: '血宠优先',
  pet_dodge: '血宠优先',
  pet_dodge_adv: '血宠优先',
  pet_lifesteal: '通用',
  pet_lifesteal_adv: '通用',
  pet_counter: '物理宠/血宠优先',
  pet_counter_adv: '物理宠/血宠优先',
  pet_combo: '物理宠优先',
  pet_combo_adv: '物理宠优先',
  pet_tough_skin: '血宠优先',
  pet_tough_skin_adv: '血宠优先',
  pet_focus: '物理宠/法术宠优先',
  pet_focus_adv: '物理宠/法术宠优先',
  pet_spirit: '法术宠优先',
  pet_spirit_adv: '法术宠优先',
  pet_fury: '通用',
  pet_fury_adv: '通用',
  pet_break: '物理宠/血宠优先',
  pet_break_adv: '物理宠/血宠优先',
  pet_magic_break: '法术宠优先',
  pet_magic_break_adv: '法术宠优先',
  pet_bloodline: '血宠优先',
  pet_bloodline_adv: '血宠优先',
  pet_resolve: '通用',
  pet_resolve_adv: '通用',
  pet_quick_step: '物理宠/法术宠优先',
  pet_quick_step_adv: '物理宠/法术宠优先',
  pet_sunder: '物理宠/血宠优先',
  pet_sunder_adv: '物理宠/血宠优先',
  pet_arcane_echo: '法术宠优先',
  pet_arcane_echo_adv: '法术宠优先',
  pet_aoe: '法术宠优先（物理宠也可用）',
  pet_aoe_adv: '法术宠优先（物理宠也可用）',
  pet_divine_guard: '血宠优先',
  pet_kill_soul: '通用',
  pet_war_horn: '通用',
  pet_soul_chain: '血宠优先',
  pet_soul_chain_adv: '血宠优先',
  pet_overload: '通用',
  pet_overload_adv: '通用',
  pet_rebirth: '血宠优先',
  pet_rebirth_adv: '血宠优先'
};

function decoratePetSkillEffectsWithTypeHints(effects) {
  const next = {};
  Object.entries(effects || {}).forEach(([skillId, text]) => {
    const raw = String(text || '').trim();
    const hint = PET_SKILL_TYPE_HINTS[skillId];
    if (!hint) {
      next[skillId] = raw;
      return;
    }
    if (raw.includes('适配:')) {
      next[skillId] = raw;
      return;
    }
    next[skillId] = raw ? `${raw} | 适配: ${hint}` : `适配: ${hint}`;
  });
  return next;
}

const DEFAULT_PET_SKILL_EFFECTS = decoratePetSkillEffectsWithTypeHints({ ...PET_SKILL_EFFECTS });
PET_SKILL_EFFECTS = { ...DEFAULT_PET_SKILL_EFFECTS };
let PET_COMBAT_BALANCE = {
  focusHitBonus: 0.0375,
  focusAdvHitBonus: 0.05625,
  quickStepHitBonus: 0.03,
  dodgeEvadeBonus: 0.03,
  dodgeAdvEvadeBonus: 0.045,
  quickStepEvadeBonus: 0.03,
  furyMul: 1.06,
  furyAdvMul: 1.09,
  overloadMul: 1.06,
  overloadAdvMul: 1.09,
  bashMul: 1.045,
  bashAdvMul: 1.0675,
  spiritMul: 1.045,
  spiritAdvMul: 1.0675,
  breakMul: 1.045,
  breakAdvMul: 1.0675,
  critChance: 0.045,
  critAdvChance: 0.0675,
  critMultiplier: 1.4,
  comboChance: 0.06,
  comboAdvChance: 0.09,
  comboDamageRatio: 0.3375,
  comboAdvDamageRatio: 0.50625,
  lifestealRatio: 0.045,
  lifestealAdvRatio: 0.0675,
  magicBreakChance: 0.09,
  magicBreakAdvChance: 0.135,
  magicBreakMdefMultiplier: 0.925,
  magicBreakAdvMdefMultiplier: 0.8875,
  magicBreakDurationMs: 4500,
  arcaneEchoChance: 0.045,
  arcaneEchoAdvChance: 0.0675,
  arcaneEchoDamageRatio: 0.18,
  arcaneEchoAdvDamageRatio: 0.27,
  killSoulRecoverRatio: 0.045,
  resolveChance: 0.21,
  resolveAdvChance: 0.315,
  guardDamageMul: 0.955,
  guardAdvDamageMul: 0.9325,
  toughSkinDamageMul: 0.925,
  toughSkinAdvDamageMul: 0.8875,
  soulChainDamageMul: 0.94,
  soulChainAdvDamageMul: 0.91,
  divineGuardChance: 0.04,
  divineGuardDamageMul: 0.86,
  rebirthChance: 0.12,
  rebirthAdvChance: 0.18,
  rebirthCooldownMs: 120000,
  rebirthRecoverRatio: 0.3,
  rebirthAdvRecoverRatio: 0.45,
  bloodlineHealMul: 1.09,
  bloodlineAdvHealMul: 1.135,
  healBlockBaseChance: 0.09,
  healBlockAdvBaseChance: 0.135,
  warHornHealBlockBonusChance: 0.035,
  warHornAdvHealBlockBonusChance: 0.0525,
  counterChance: 0.06,
  counterAdvChance: 0.09,
  counterDamageRatio: 0.135,
  counterAdvDamageRatio: 0.2025
};

let PET_LEVEL_CAP_OFFSET = 10;
let PET_POWER_WEIGHTS = {
  hp: 0.2,
  atk: 1.8,
  def: 1.2,
  mag: 1.4,
  agility: 1.2,
  slot: 28,
  skill: 90,
  levelMul: 0.02
};

let PET_AVAILABLE_GRADES_BY_RARITY = {
  normal: ['normal'],
  excellent: ['normal'],
  rare: ['normal', 'advanced'],
  epic: ['normal', 'advanced'],
  legendary: ['normal', 'advanced', 'special'],
  supreme: ['normal', 'advanced', 'special'],
  ultimate: ['normal', 'advanced', 'special']
};

let PET_OPEN_SKILL_MIN_BY_RARITY = {
  normal: 1,
  excellent: 1,
  rare: 2,
  epic: 3,
  legendary: 3,
  supreme: 3,
  ultimate: 3
};

let PET_OPEN_SKILL_MAX_BY_RARITY = {
  normal: 3,
  excellent: 3,
  rare: 3,
  epic: 3,
  legendary: 4,
  supreme: 5,
  ultimate: 6
};

let PET_DROP_RARITY_WEIGHTS = {
  normal: 32,
  excellent: 22,
  rare: 14,
  epic: 8,
  legendary: 4,
  supreme: 2,
  ultimate: 1
};

let PET_DROP_BASE_CHANCE_BY_CAP = { excellent: 0.06, rare: 0.07, epic: 0.08, legendary: 0.09, supreme: 0.1, ultimate: 0.12 };
let PET_DROP_MAX_CHANCE = 0.5;
let PET_DROP_BONUS_MIN = 0.5;

let PET_BOOK_BASE_CHANCE_BY_CAP = {
  excellent: 0.25,
  rare: 0.3,
  epic: 0.36,
  legendary: 0.42,
  supreme: 0.5,
  ultimate: 0.6
};
let PET_BOOK_MAX_CHANCE = 0.85;
let PET_BOOK_HIGH_CHANCE_BY_CAP = {
  excellent: 0.02,
  rare: 0.03,
  epic: 0.04,
  legendary: 0.05,
  supreme: 0.05,
  ultimate: 0.05
};
let PET_BOOK_SECOND_DROP_CHANCE = 0.2;
let PET_BOOK_SECOND_ELIGIBLE_RARITIES = ['supreme', 'ultimate'];
let PET_BOOK_SECOND_REQUIRE_SPECIAL_BOSS = true;

let PET_WILLOW_DEW_BASE_CHANCE = 0.01;
let PET_WILLOW_DEW_MAX_CHANCE = 0.5;
let PET_WILLOW_DEW_BONUS_MIN = 0.5;

let PET_BOOK_PRICE_CONFIG = {
  special: 280000,
  advanced: 120000,
  normalBase: 60000,
  normalStep: 800
};

let PET_BOOK_LIBRARY = buildPetBookLibrary(PET_SKILL_LIBRARY, PET_BOOK_PRICE_CONFIG);

let PET_SPECIES_NAME_MAP = {
  FieldWolf: '旷野狼',
  HillCat: '山猫',
  GreenBird: '青羽鸟',
  StoneTurtle: '石甲龟',
  NightBat: '夜蝠',
  FireLizard: '火蜥',
  SandFox: '沙狐',
  WoodSprite: '木灵',
  PuppetBeast: '傀儡兽',
  GrassSpirit: '草灵',
  SilverFox: '银狐',
  SkyHawk: '天鹰',
  ThunderLeopard: '雷豹',
  FrostDeer: '霜鹿',
  BlazeWolf: '烈焰狼',
  AquaQilin: '水麒麟',
  IronApe: '铁猿',
  OakSpirit: '古木灵',
  RuneTurtle: '符文龟',
  WindBird: '风鸟',
  CrimsonLion: '赤狮',
  IceFox: '冰狐',
  StormRhino: '风暴犀',
  AquaDragon: '水龙',
  ShadowLeopard: '影豹',
  StarLuan: '星鸾',
  RiftBear: '裂隙熊',
  VenomSerpent: '毒蛇',
  GhostWolf: '幽狼',
  CloudDeer: '云鹿',
  NetherTiger: '幽冥虎',
  SolarPhoenix: '旭日凤凰',
  StormDragon: '风暴龙',
  FrostQilin: '冰麒麟',
  YoungXuanwu: '幼玄武',
  NineTailFox: '九尾狐',
  WarTigerMech: '战虎机甲',
  GoldenRoc: '金翅鹏',
  SoulSpider: '魂蛛',
  OceanKun: '海鲲',
  ZhuLong: '烛龙',
  YingLong: '应龙',
  BaiZe: '白泽',
  QiongQi: '穷奇',
  TaoTie: '饕餮',
  BiAn: '狴犴',
  MingBird: '冥鸟',
  QingLuan: '青鸾',
  BiFang: '毕方',
  WhiteTiger: '白虎',
  PrimordialDragon: '太初龙',
  ChaosQilin: '混沌麒麟',
  UndyingCrow: '不死鸦',
  VoidXuanwu: '虚空玄武',
  AllFormBaiZe: '万相白泽',
  NineNetherPhoenix: '九幽凤凰',
  PrisonXiezhi: '狱獬豸',
  TiangangApe: '天罡猿',
  SkyZhuLong: '天烛龙',
  WildTaoTie: '狂饕餮',
  EndOriginDragon: '终源龙',
  EternalPhoenix: '永恒凤凰',
  TaixuRoc: '太虚鹏',
  WujiBaiZe: '无极白泽',
  GenesisQilin: '创世麒麟',
  HunyuanXuanwu: '混元玄武',
  AbyssQiongQi: '深渊穷奇',
  SkyTorch: '天焰',
  OriginYingLong: '元初应龙',
  HongmengCrow: '鸿蒙鸦',
  RatDivineBeast: '鼠年神兽',
  OxDivineBeast: '牛年神兽',
  TigerDivineBeast: '虎年神兽',
  RabbitDivineBeast: '兔年神兽',
  DragonDivineBeast: '龙年神兽',
  SnakeDivineBeast: '蛇年神兽',
  DivineBeast: '马年神兽',
  GoatDivineBeast: '羊年神兽',
  MonkeyDivineBeast: '猴年神兽',
  RoosterDivineBeast: '鸡年神兽',
  DogDivineBeast: '狗年神兽',
  PigDivineBeast: '猪年神兽'
};

let PET_SPECIES_BY_RARITY = {
  normal: ['旷野狼', '山猫', '青羽鸟', '石甲龟', '夜蝠', '火蜥', '沙狐', '木灵', '傀儡兽', '草灵'],
  excellent: ['银狐', '天鹰', '雷豹', '霜鹿', '烈焰狼', '水麒麟', '铁猿', '古木灵', '符文龟', '风鸟'],
  rare: ['赤狮', '冰狐', '风暴犀', '水龙', '影豹', '星鸾', '裂隙熊', '毒蛇', '幽狼', '云鹿'],
  epic: ['幽冥虎', '旭日凤凰', '风暴龙', '冰麒麟', '幼玄武', '九尾狐', '战虎机甲', '金翅鹏', '魂蛛', '海鲲'],
  legendary: ['烛龙', '应龙', '白泽', '穷奇', '饕餮', '狴犴', '冥鸟', '青鸾', '毕方', '白虎'],
  supreme: ['太初龙', '混沌麒麟', '不死鸦', '虚空玄武', '万相白泽', '九幽凤凰', '狱獬豸', '天罡猿', '天烛龙', '狂饕餮'],
  ultimate: ['终源龙', '永恒凤凰', '太虚鹏', '无极白泽', '创世麒麟', '混元玄武', '深渊穷奇', '天焰', '元初应龙', '鸿蒙鸦', ...ZODIAC_DIVINE_BEAST_SPECIES]
};
const PET_NON_DROPPABLE_SPECIES = new Set(ZODIAC_DIVINE_BEAST_SPECIES);

function buildPetBookLibrary(skills, priceConfig) {
  const safeSkills = Array.isArray(skills) ? skills.filter((skill) => skill && skill.id && skill.grade !== 'exclusive') : [];
  const specialPrice = Math.max(0, Math.floor(Number(priceConfig?.special ?? 280000)));
  const advancedPrice = Math.max(0, Math.floor(Number(priceConfig?.advanced ?? 120000)));
  const normalBase = Math.max(0, Math.floor(Number(priceConfig?.normalBase ?? 60000)));
  const normalStep = Math.max(0, Math.floor(Number(priceConfig?.normalStep ?? 800)));
  return safeSkills.map((skill, index) => ({
    id: `pet_book_${skill.id}`,
    name: `宠物技能书·${skill.name || skill.id}`,
    skillId: skill.id,
    skillName: skill.name || skill.id,
    tier: skill.grade === 'normal' ? 'low' : 'high',
    priceGold: skill.grade === 'special'
      ? specialPrice
      : skill.grade === 'advanced'
        ? advancedPrice
        : normalBase + index * normalStep
  }));
}

function getDefaultPetSettings() {
  return {
    maxOwned: 50,
    baseSkillSlots: 3,
    maxSkillSlots: 16,
    comprehendCostGold: 150000,
    synthesisCostGold: 500000,
    comprehendMaxSkills: 3,
    bookUnlockSlot4Chance: 0.35,
    synthesisUnlockSlotChance: 0.45,
    synthesisInheritChance: 0.6,
    synthesisMultiSkillChance: 0,
    expNeedRatio: 0.8,
    levelCapOffset: 10,
    powerWeights: {
      hp: 0.2,
      atk: 1.8,
      def: 1.2,
      mag: 1.4,
      agility: 1.2,
      slot: 28,
      skill: 90,
      levelMul: 0.02
    },
    autoComprehendChance: {
      normal: 0.2,
      excellent: 0.24,
      rare: 0.28,
      epic: 0.32,
      legendary: 0.36,
      supreme: 0.4,
      ultimate: 0.45
    },
    rarityOrder: ['normal', 'excellent', 'rare', 'epic', 'legendary', 'supreme', 'ultimate'],
    rarityLabels: {
      normal: '普通',
      excellent: '优秀',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
      supreme: '至尊',
      ultimate: '终极'
    },
    rarityGrowthRange: {
      normal: [1.0, 1.12],
      excellent: [1.08, 1.2],
      rare: [1.16, 1.3],
      epic: [1.24, 1.42],
      legendary: [1.34, 1.56],
      supreme: [1.46, 1.74],
      ultimate: [1.62, 1.95]
    },
    rarityAptitudeRange: {
      normal: { hp: [1400, 2600], atk: [70, 130], def: [60, 120], mag: [70, 130], agility: [60, 120] },
      excellent: { hp: [1900, 3200], atk: [95, 160], def: [85, 150], mag: [95, 160], agility: [85, 150] },
      rare: { hp: [2500, 3900], atk: [125, 200], def: [110, 190], mag: [125, 200], agility: [110, 190] },
      epic: { hp: [3200, 4700], atk: [160, 245], def: [140, 230], mag: [160, 245], agility: [140, 230] },
      legendary: { hp: [4000, 5600], atk: [195, 295], def: [175, 280], mag: [195, 295], agility: [175, 280] },
      supreme: { hp: [5000, 6600], atk: [240, 360], def: [220, 340], mag: [240, 360], agility: [220, 340] },
      ultimate: { hp: [6200, 8000], atk: [300, 440], def: [280, 420], mag: [300, 440], agility: [280, 420] }
    },
    skillLibrary: PET_SKILL_LIBRARY.map((entry) => ({ ...entry })),
    skillEffects: { ...DEFAULT_PET_SKILL_EFFECTS },
    combatBalance: { ...PET_COMBAT_BALANCE },
    availableGradesByRarity: { ...PET_AVAILABLE_GRADES_BY_RARITY },
    openSkillMinByRarity: { ...PET_OPEN_SKILL_MIN_BY_RARITY },
    openSkillMaxByRarity: { ...PET_OPEN_SKILL_MAX_BY_RARITY },
    dropRarityWeights: { ...PET_DROP_RARITY_WEIGHTS },
    dropBaseChanceByCap: { ...PET_DROP_BASE_CHANCE_BY_CAP },
    dropMaxChance: PET_DROP_MAX_CHANCE,
    dropBonusMin: PET_DROP_BONUS_MIN,
    bookBaseChanceByCap: { ...PET_BOOK_BASE_CHANCE_BY_CAP },
    bookMaxChance: PET_BOOK_MAX_CHANCE,
    bookHighChanceByCap: { ...PET_BOOK_HIGH_CHANCE_BY_CAP },
    bookSecondDropChance: PET_BOOK_SECOND_DROP_CHANCE,
    bookSecondEligibleRarities: PET_BOOK_SECOND_ELIGIBLE_RARITIES.slice(),
    bookSecondRequireSpecialBoss: PET_BOOK_SECOND_REQUIRE_SPECIAL_BOSS,
    willowDewBaseChance: PET_WILLOW_DEW_BASE_CHANCE,
    willowDewMaxChance: PET_WILLOW_DEW_MAX_CHANCE,
    willowDewBonusMin: PET_WILLOW_DEW_BONUS_MIN,
    bookPriceConfig: { ...PET_BOOK_PRICE_CONFIG },
    speciesNameMap: { ...PET_SPECIES_NAME_MAP },
    speciesByRarity: { ...PET_SPECIES_BY_RARITY }
  };
}

function normalizePetSettings(raw) {
  const defaults = getDefaultPetSettings();
  const input = raw && typeof raw === 'object' ? raw : {};
  const numberValue = (value, fallback, min = null, max = null, asInt = false) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    let next = parsed;
    if (asInt) next = Math.floor(next);
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    return next;
  };
  const mergeObject = (fallback, value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...fallback };
    return { ...fallback, ...value };
  };
  const mergeRangeMap = (fallback, value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...fallback };
    const next = { ...fallback };
    Object.keys(fallback).forEach((key) => {
      const range = value[key];
      if (Array.isArray(range) && range.length === 2) {
        const min = Number(range[0]);
        const max = Number(range[1]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
          next[key] = [min, max];
        }
      }
    });
    return next;
  };
  const mergeNestedRangeMap = (fallback, value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...fallback };
    const next = {};
    Object.keys(fallback).forEach((key) => {
      next[key] = mergeRangeMap(fallback[key], value[key]);
    });
    return next;
  };
  const normalizeSkillLibrary = (value) => {
    if (!Array.isArray(value)) return defaults.skillLibrary.map((entry) => ({ ...entry }));
    const normalized = value
      .map((entry) => ({
        id: String(entry?.id || '').trim(),
        name: String(entry?.name || '').trim(),
        grade: String(entry?.grade || 'normal').trim()
      }))
      .filter((entry) => entry.id);
    return normalized.length ? normalized : defaults.skillLibrary.map((entry) => ({ ...entry }));
  };
  const normalizeStringArray = (value, fallback) => {
    if (!Array.isArray(value)) return fallback.slice();
    const normalized = value.map((entry) => String(entry || '').trim()).filter(Boolean);
    return normalized.length ? normalized : fallback.slice();
  };
  const normalizeSpeciesByRarity = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...defaults.speciesByRarity };
    const next = {};
    Object.keys(defaults.speciesByRarity).forEach((key) => {
      next[key] = normalizeStringArray(value[key], defaults.speciesByRarity[key]);
    });
    return next;
  };

  return {
    maxOwned: numberValue(input.maxOwned, defaults.maxOwned, 1, null, true),
    baseSkillSlots: numberValue(input.baseSkillSlots, defaults.baseSkillSlots, 1, null, true),
    maxSkillSlots: numberValue(input.maxSkillSlots, defaults.maxSkillSlots, 1, null, true),
    comprehendCostGold: numberValue(input.comprehendCostGold, defaults.comprehendCostGold, 0, null, true),
    synthesisCostGold: numberValue(input.synthesisCostGold, defaults.synthesisCostGold, 0, null, true),
    comprehendMaxSkills: numberValue(input.comprehendMaxSkills, defaults.comprehendMaxSkills, 0, null, true),
    bookUnlockSlot4Chance: numberValue(input.bookUnlockSlot4Chance, defaults.bookUnlockSlot4Chance, 0, 1),
    synthesisUnlockSlotChance: numberValue(input.synthesisUnlockSlotChance, defaults.synthesisUnlockSlotChance, 0, 1),
    synthesisInheritChance: numberValue(input.synthesisInheritChance, defaults.synthesisInheritChance, 0, 1),
    synthesisMultiSkillChance: numberValue(input.synthesisMultiSkillChance, defaults.synthesisMultiSkillChance, 0, 1),
    expNeedRatio: numberValue(input.expNeedRatio, defaults.expNeedRatio, 0.01, null),
    levelCapOffset: numberValue(input.levelCapOffset, defaults.levelCapOffset, 0, null, true),
    powerWeights: mergeObject(defaults.powerWeights, input.powerWeights),
    autoComprehendChance: mergeObject(defaults.autoComprehendChance, input.autoComprehendChance),
    rarityOrder: normalizeStringArray(input.rarityOrder, defaults.rarityOrder),
    rarityLabels: mergeObject(defaults.rarityLabels, input.rarityLabels),
    rarityGrowthRange: mergeRangeMap(defaults.rarityGrowthRange, input.rarityGrowthRange),
    rarityAptitudeRange: mergeNestedRangeMap(defaults.rarityAptitudeRange, input.rarityAptitudeRange),
    skillLibrary: normalizeSkillLibrary(input.skillLibrary),
    skillEffects: mergeObject(defaults.skillEffects, input.skillEffects),
    combatBalance: mergeObject(defaults.combatBalance, input.combatBalance),
    availableGradesByRarity: mergeObject(defaults.availableGradesByRarity, input.availableGradesByRarity),
    openSkillMinByRarity: mergeObject(defaults.openSkillMinByRarity, input.openSkillMinByRarity),
    openSkillMaxByRarity: mergeObject(defaults.openSkillMaxByRarity, input.openSkillMaxByRarity),
    dropRarityWeights: mergeObject(defaults.dropRarityWeights, input.dropRarityWeights),
    dropBaseChanceByCap: mergeObject(defaults.dropBaseChanceByCap, input.dropBaseChanceByCap),
    dropMaxChance: numberValue(input.dropMaxChance, defaults.dropMaxChance, 0, 1),
    dropBonusMin: numberValue(input.dropBonusMin, defaults.dropBonusMin, 0, null),
    bookBaseChanceByCap: mergeObject(defaults.bookBaseChanceByCap, input.bookBaseChanceByCap),
    bookMaxChance: numberValue(input.bookMaxChance, defaults.bookMaxChance, 0, 1),
    bookHighChanceByCap: mergeObject(defaults.bookHighChanceByCap, input.bookHighChanceByCap),
    bookSecondDropChance: numberValue(input.bookSecondDropChance, defaults.bookSecondDropChance, 0, 1),
    bookSecondEligibleRarities: normalizeStringArray(input.bookSecondEligibleRarities, defaults.bookSecondEligibleRarities),
    bookSecondRequireSpecialBoss: typeof input.bookSecondRequireSpecialBoss === 'boolean'
      ? input.bookSecondRequireSpecialBoss
      : defaults.bookSecondRequireSpecialBoss,
    willowDewBaseChance: numberValue(input.willowDewBaseChance, defaults.willowDewBaseChance, 0, 1),
    willowDewMaxChance: numberValue(input.willowDewMaxChance, defaults.willowDewMaxChance, 0, 1),
    willowDewBonusMin: numberValue(input.willowDewBonusMin, defaults.willowDewBonusMin, 0, null),
    bookPriceConfig: mergeObject(defaults.bookPriceConfig, input.bookPriceConfig),
    speciesNameMap: mergeObject(defaults.speciesNameMap, input.speciesNameMap),
    speciesByRarity: normalizeSpeciesByRarity(input.speciesByRarity)
  };
}

function applyPetSettings(raw, options = {}) {
  const normalized = normalizePetSettings(raw);
  PET_MAX_OWNED = normalized.maxOwned;
  PET_BASE_SKILL_SLOTS = normalized.baseSkillSlots;
  PET_MAX_SKILL_SLOTS = normalized.maxSkillSlots;
  PET_COMPREHEND_COST_GOLD = normalized.comprehendCostGold;
  PET_SYNTHESIS_COST_GOLD = normalized.synthesisCostGold;
  PET_COMPREHEND_MAX_SKILLS = normalized.comprehendMaxSkills;
  PET_BOOK_UNLOCK_SLOT4_CHANCE = normalized.bookUnlockSlot4Chance;
  PET_SYNTHESIS_UNLOCK_SLOT_CHANCE = normalized.synthesisUnlockSlotChance;
  PET_SYNTHESIS_INHERIT_CHANCE = normalized.synthesisInheritChance;
  PET_SYNTHESIS_MULTI_SKILL_CHANCE = normalized.synthesisMultiSkillChance;
  PET_EXP_NEED_RATIO = normalized.expNeedRatio;
  PET_LEVEL_CAP_OFFSET = normalized.levelCapOffset;
  PET_POWER_WEIGHTS = { ...normalized.powerWeights };
  PET_AUTO_COMPREHEND_CHANCE = { ...normalized.autoComprehendChance };
  PET_RARITY_ORDER = normalized.rarityOrder.slice();
  PET_RARITY_LABELS = { ...normalized.rarityLabels };
  PET_RARITY_GROWTH_RANGE = { ...normalized.rarityGrowthRange };
  PET_RARITY_APTITUDE_RANGE = { ...normalized.rarityAptitudeRange };
  PET_SKILL_LIBRARY = normalized.skillLibrary.map((entry) => ({ ...entry }));
  REQUIRED_PET_SKILL_LIBRARY_ENTRIES.forEach((required) => {
    const idx = PET_SKILL_LIBRARY.findIndex((entry) => String(entry?.id || '') === required.id);
    if (idx >= 0) PET_SKILL_LIBRARY[idx] = { ...PET_SKILL_LIBRARY[idx], ...required };
    else PET_SKILL_LIBRARY.push({ ...required });
  });
  PET_SKILL_EFFECTS = decoratePetSkillEffectsWithTypeHints({ ...normalized.skillEffects });
  PET_COMBAT_BALANCE = { ...normalized.combatBalance };
  PET_AVAILABLE_GRADES_BY_RARITY = { ...normalized.availableGradesByRarity };
  PET_OPEN_SKILL_MIN_BY_RARITY = { ...normalized.openSkillMinByRarity };
  PET_OPEN_SKILL_MAX_BY_RARITY = { ...normalized.openSkillMaxByRarity };
  PET_DROP_RARITY_WEIGHTS = { ...normalized.dropRarityWeights };
  PET_DROP_BASE_CHANCE_BY_CAP = { ...normalized.dropBaseChanceByCap };
  PET_DROP_MAX_CHANCE = normalized.dropMaxChance;
  PET_DROP_BONUS_MIN = normalized.dropBonusMin;
  PET_BOOK_BASE_CHANCE_BY_CAP = { ...normalized.bookBaseChanceByCap };
  PET_BOOK_MAX_CHANCE = normalized.bookMaxChance;
  PET_BOOK_HIGH_CHANCE_BY_CAP = { ...normalized.bookHighChanceByCap };
  PET_BOOK_SECOND_DROP_CHANCE = normalized.bookSecondDropChance;
  PET_BOOK_SECOND_ELIGIBLE_RARITIES = normalized.bookSecondEligibleRarities.slice();
  PET_BOOK_SECOND_REQUIRE_SPECIAL_BOSS = normalized.bookSecondRequireSpecialBoss;
  PET_WILLOW_DEW_BASE_CHANCE = normalized.willowDewBaseChance;
  PET_WILLOW_DEW_MAX_CHANCE = normalized.willowDewMaxChance;
  PET_WILLOW_DEW_BONUS_MIN = normalized.willowDewBonusMin;
  PET_BOOK_PRICE_CONFIG = { ...normalized.bookPriceConfig };
  PET_BOOK_LIBRARY = buildPetBookLibrary(PET_SKILL_LIBRARY, PET_BOOK_PRICE_CONFIG);
  PET_SPECIES_NAME_MAP = { ...normalized.speciesNameMap };
  PET_SPECIES_BY_RARITY = { ...normalized.speciesByRarity };

  if (options.persist) {
    return setPetSettings(normalized).then(() => normalized);
  }
  return Promise.resolve(normalized);
}

function getPetSettingsSnapshot() {
  return {
    maxOwned: 0,
    baseSkillSlots: PET_BASE_SKILL_SLOTS,
    maxSkillSlots: PET_MAX_SKILL_SLOTS,
    comprehendCostGold: PET_COMPREHEND_COST_GOLD,
    synthesisCostGold: PET_SYNTHESIS_COST_GOLD,
    comprehendMaxSkills: PET_COMPREHEND_MAX_SKILLS,
    bookUnlockSlot4Chance: PET_BOOK_UNLOCK_SLOT4_CHANCE,
    synthesisUnlockSlotChance: PET_SYNTHESIS_UNLOCK_SLOT_CHANCE,
    synthesisInheritChance: PET_SYNTHESIS_INHERIT_CHANCE,
    synthesisMultiSkillChance: PET_SYNTHESIS_MULTI_SKILL_CHANCE,
    expNeedRatio: PET_EXP_NEED_RATIO,
    levelCapOffset: PET_LEVEL_CAP_OFFSET,
    powerWeights: { ...PET_POWER_WEIGHTS },
    autoComprehendChance: { ...PET_AUTO_COMPREHEND_CHANCE },
    rarityOrder: PET_RARITY_ORDER.slice(),
    rarityLabels: { ...PET_RARITY_LABELS },
    rarityGrowthRange: { ...PET_RARITY_GROWTH_RANGE },
    rarityAptitudeRange: { ...PET_RARITY_APTITUDE_RANGE },
    skillLibrary: PET_SKILL_LIBRARY.map((entry) => ({ ...entry })),
    skillEffects: { ...PET_SKILL_EFFECTS },
    combatBalance: { ...PET_COMBAT_BALANCE },
    availableGradesByRarity: { ...PET_AVAILABLE_GRADES_BY_RARITY },
    openSkillMinByRarity: { ...PET_OPEN_SKILL_MIN_BY_RARITY },
    openSkillMaxByRarity: { ...PET_OPEN_SKILL_MAX_BY_RARITY },
    dropRarityWeights: { ...PET_DROP_RARITY_WEIGHTS },
    dropBaseChanceByCap: { ...PET_DROP_BASE_CHANCE_BY_CAP },
    dropMaxChance: PET_DROP_MAX_CHANCE,
    dropBonusMin: PET_DROP_BONUS_MIN,
    bookBaseChanceByCap: { ...PET_BOOK_BASE_CHANCE_BY_CAP },
    bookMaxChance: PET_BOOK_MAX_CHANCE,
    bookHighChanceByCap: { ...PET_BOOK_HIGH_CHANCE_BY_CAP },
    bookSecondDropChance: PET_BOOK_SECOND_DROP_CHANCE,
    bookSecondEligibleRarities: PET_BOOK_SECOND_ELIGIBLE_RARITIES.slice(),
    bookSecondRequireSpecialBoss: PET_BOOK_SECOND_REQUIRE_SPECIAL_BOSS,
    willowDewBaseChance: PET_WILLOW_DEW_BASE_CHANCE,
    willowDewMaxChance: PET_WILLOW_DEW_MAX_CHANCE,
    willowDewBonusMin: PET_WILLOW_DEW_BONUS_MIN,
    bookPriceConfig: { ...PET_BOOK_PRICE_CONFIG },
    speciesNameMap: { ...PET_SPECIES_NAME_MAP },
    speciesByRarity: { ...PET_SPECIES_BY_RARITY }
  };
}

async function loadPetSettingsFromDb() {
  const stored = await getPetSettings();
  await applyPetSettings(stored, { persist: false });
}

function getPetSkillDef(skillId) {
  return PET_SKILL_LIBRARY.find((skill) => skill.id === skillId) || null;
}

function isPetLockedSkill(skillId) {
  const def = getPetSkillDef(skillId);
  if (!def) return false;
  return def.grade === 'exclusive';
}

function getPetSkillTier(skillId) {
  const def = getPetSkillDef(skillId);
  if (!def) return 'low';
  return def.grade === 'normal' ? 'low' : 'high';
}

function getPetBookDef(bookId) {
  return PET_BOOK_LIBRARY.find((book) => book.id === bookId) || null;
}

function getActivePet(player) {
  const state = normalizePetState(player);
  if (!state?.activePetId) return null;
  return state.pets.find((pet) => pet.id === state.activePetId) || null;
}

const PET_SKILL_AFFECTS_OWNER = false;

function hasActivePetSkill(player, skillId) {
  if (!PET_SKILL_AFFECTS_OWNER) return false;
  if (!player || !skillId) return false;
  const pet = getActivePet(player);
  if (!pet || !Array.isArray(pet.skills)) return false;
  return pet.skills.includes(skillId);
}

function hasPetSkillOnPet(pet, skillId) {
  if (!pet || !skillId || !Array.isArray(pet.skills)) return false;
  return pet.skills.includes(skillId);
}

function applyDivineBeastExclusiveCombatMods(pet, typeMods, { pvp = false } = {}) {
  if (!pet || !typeMods) return;
  const rateMul = pvp ? 0.82 : 1;
  const valMul = pvp ? 0.88 : 1;
  if (hasPetSkillOnPet(pet, 'pet_beast_rat_swiftness')) {
    typeMods.comboChanceBonus += 0.04 * rateMul;
    typeMods.quickStrikeChance += 0.12 * rateMul;
    typeMods.quickStrikeRatio += 0.08 * valMul;
    typeMods.dodgeGuardChance += 0.1 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_ox_bulwark')) {
    typeMods.ownerHealRatio += 0.012 * valMul;
    typeMods.divineGuardChance += 0.12 * rateMul;
    typeMods.divineGuardDamageMul = Math.min(typeMods.divineGuardDamageMul || 1, 0.82);
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_tiger_fang')) {
    typeMods.baseMul *= 1.12;
    typeMods.critChanceBonus += 0.03 * rateMul;
    typeMods.critDamageMul = Math.max(typeMods.critDamageMul || 1.5, 1.72);
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_rabbit_moonstep')) {
    typeMods.quickStrikeChance += 0.16 * rateMul;
    typeMods.quickStrikeRatio += 0.1 * valMul;
    typeMods.dodgeGuardChance += 0.08 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_dragon_might')) {
    typeMods.baseMul *= 1.1;
    typeMods.breakDefChance += 0.1 * rateMul;
    typeMods.breakMdefChance += 0.1 * rateMul;
    typeMods.sunderChance += 0.1 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_snake_scale')) {
    typeMods.breakMdefChance += 0.18 * rateMul;
    typeMods.warHornChance += 0.12 * rateMul;
    typeMods.soulChainChance += 0.08 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_aegis')) {
    typeMods.divineGuardChance += 0.12 * rateMul;
    typeMods.dodgeGuardChance += 0.12 * rateMul;
    typeMods.breakDefChance += 0.06 * rateMul;
    typeMods.breakMdefChance += 0.06 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_goat_bless')) {
    typeMods.ownerHealRatio += 0.018 * valMul;
    typeMods.divineGuardChance += 0.1 * rateMul;
    typeMods.dodgeGuardChance += 0.08 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_monkey_edge')) {
    typeMods.comboChanceBonus += 0.06 * rateMul;
    typeMods.comboRatioBonus += 0.12 * valMul;
    typeMods.arcaneEchoChance += 0.1 * rateMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_rooster_warcry')) {
    typeMods.warHornChance += 0.22 * rateMul;
    typeMods.breakDefChance += 0.08 * rateMul;
    typeMods.baseMul *= 1.06;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_dog_guard')) {
    typeMods.divineGuardChance += 0.18 * rateMul;
    typeMods.divineGuardDamageMul = Math.min(typeMods.divineGuardDamageMul || 1, 0.78);
    typeMods.soulChainGuardRatio += 0.03 * valMul;
  }
  if (hasPetSkillOnPet(pet, 'pet_beast_pig_fortune')) {
    typeMods.ownerHealRatio += 0.025 * valMul;
    typeMods.counterLashChance += 0.14 * rateMul;
    typeMods.lifestealRatio += 0.04 * valMul;
  }
}

function getPetSkillTierOnPet(pet, baseSkillId) {
  if (!pet || !baseSkillId) return 0;
  if (hasPetSkillOnPet(pet, `${baseSkillId}_adv`)) return 2;
  if (hasPetSkillOnPet(pet, baseSkillId)) return 1;
  return 0;
}

function ensureTargetDebuffs(target) {
  if (!target) return null;
  if (!target.status) target.status = {};
  if (!target.status.debuffs) target.status.debuffs = {};
  return target.status.debuffs;
}

function ensureTargetBuffs(target) {
  if (!target) return null;
  if (!target.status) target.status = {};
  if (!target.status.buffs) target.status.buffs = {};
  return target.status.buffs;
}

function maybePetAssistCleanseOwner(owner, pet) {
  if (!owner || !pet) return false;
  const tier = getPetSkillTierOnPet(pet, 'pet_resolve');
  if (!tier) return false;
  const chance = tier >= 2 ? (PET_COMBAT_BALANCE.resolveAdvChance || 0.3) : (PET_COMBAT_BALANCE.resolveChance || 0.2);
  if (Math.random() > chance) return false;
  let changed = false;
  if (owner.status?.stunTurns && owner.status.stunTurns > 0) {
    owner.status.stunTurns = 0;
    changed = true;
  }
  const debuffs = owner.status?.debuffs;
  if (debuffs) {
    const removable = ['weak', 'poisonEffect', 'armorBreak', 'petMagicBreak', 'healBlock'];
    for (const key of removable) {
      if (debuffs[key]) {
        delete debuffs[key];
        changed = true;
        break;
      }
    }
  }
  if (changed && typeof owner.send === 'function') owner.send(`${String(pet.name || '宠物')} 净化了你的负面状态。`);
  return changed;
}

function maybePetAssistEmergencyRebirth(owner, pet) {
  if (!owner || !pet || !Number.isFinite(owner.max_hp) || owner.max_hp <= 0) return false;
  const tier = getPetSkillTierOnPet(pet, 'pet_rebirth');
  if (!tier) return false;
  const hpRatio = (owner.hp || 0) / Math.max(1, owner.max_hp || 1);
  if (hpRatio > 0.35) return false;
  if (!owner.flags) owner.flags = {};
  const cdKey = 'petAssistRebirthCdAt';
  const now = Date.now();
  const cd = Number(owner.flags[cdKey] || 0);
  if (cd > now) return false;
  const chance = tier >= 2 ? (PET_COMBAT_BALANCE.rebirthAdvChance || 0.18) : (PET_COMBAT_BALANCE.rebirthChance || 0.12);
  if (Math.random() > chance) return false;
  const recoverRatio = tier >= 2 ? (PET_COMBAT_BALANCE.rebirthAdvRecoverRatio || 0.45) : (PET_COMBAT_BALANCE.rebirthRecoverRatio || 0.3);
  const heal = Math.max(1, Math.floor(owner.max_hp * recoverRatio));
  owner.hp = clamp(owner.hp + heal, 1, owner.max_hp);
  owner.flags[cdKey] = now + Math.max(30000, Math.floor((PET_COMBAT_BALANCE.rebirthCooldownMs || 120000) * 0.5));
  if (typeof owner.send === 'function') owner.send(`${String(pet.name || '宠物')} 触发涅槃，为你恢复 ${heal} 点生命。`);
  return true;
}

function applyPetAssistKillSoul(owner, pet) {
  if (!owner || !pet || !hasPetSkillOnPet(pet, 'pet_kill_soul')) return false;
  const ratio = Number(PET_COMBAT_BALANCE.killSoulRecoverRatio || 0.045);
  const hpGain = Math.max(1, Math.floor((owner.max_hp || 1) * ratio));
  const mpGain = Math.max(1, Math.floor((owner.max_mp || 1) * ratio));
  owner.hp = clamp((owner.hp || 1) + hpGain, 1, owner.max_hp || 1);
  owner.mp = clamp((owner.mp || 0) + mpGain, 0, owner.max_mp || 0);
  if (typeof owner.send === 'function') owner.send(`${String(pet.name || '宠物')} 触发噬魂，恢复 ${hpGain} 生命和 ${mpGain} 法力。`);
  return true;
}

function hasAnyPetSkill(player, baseSkillId) {
  const advSkillId = baseSkillId + '_adv';
  return hasActivePetSkill(player, baseSkillId) || hasActivePetSkill(player, advSkillId);
}

function getPetSkillMultiplier(player, baseSkillId, normalValue, advValue) {
  if (hasActivePetSkill(player, baseSkillId)) return normalValue;
  if (hasActivePetSkill(player, baseSkillId + '_adv')) return advValue;
  return 0;
}

function getPetSkillChance(player, baseSkillId, normalChance, advChance) {
  if (hasActivePetSkill(player, baseSkillId)) return normalChance;
  if (hasActivePetSkill(player, baseSkillId + '_adv')) return advChance;
  return 0;
}

function getPetHitChanceBonus(player) {
  let bonus = 0;
  if (hasActivePetSkill(player, 'pet_focus')) bonus += PET_COMBAT_BALANCE.focusHitBonus;
  if (hasActivePetSkill(player, 'pet_focus_adv')) bonus += PET_COMBAT_BALANCE.focusAdvHitBonus;
  if (hasActivePetSkill(player, 'pet_quick_step')) bonus += PET_COMBAT_BALANCE.quickStepHitBonus;
  return bonus;
}

function getPetEvadeChanceBonus(player) {
  let bonus = 0;
  if (hasActivePetSkill(player, 'pet_dodge')) bonus += PET_COMBAT_BALANCE.dodgeEvadeBonus;
  if (hasActivePetSkill(player, 'pet_dodge_adv')) bonus += PET_COMBAT_BALANCE.dodgeAdvEvadeBonus;
  if (hasActivePetSkill(player, 'pet_quick_step')) bonus += PET_COMBAT_BALANCE.quickStepEvadeBonus;
  return bonus;
}

function applyPetOffenseModifiers(attacker, baseDamage, skillType = 'attack') {
  let dmg = Math.max(0, Math.floor(Number(baseDamage) || 0));
  if (!attacker || dmg <= 0) return dmg;
  const isSpellLike = skillType === 'spell' || skillType === 'dot' || skillType === 'aoe';
  const isPhysicalLike = skillType === 'attack' || skillType === 'cleave' || skillType === 'slash';
  const furyMul = hasActivePetSkill(attacker, 'pet_fury_adv') ? PET_COMBAT_BALANCE.furyAdvMul :
                  hasActivePetSkill(attacker, 'pet_fury') ? PET_COMBAT_BALANCE.furyMul : 1;
  if (furyMul !== 1) dmg = Math.floor(dmg * furyMul);
  const overloadMul = hasActivePetSkill(attacker, 'pet_overload_adv') ? PET_COMBAT_BALANCE.overloadAdvMul :
                      hasActivePetSkill(attacker, 'pet_overload') ? PET_COMBAT_BALANCE.overloadMul : 1;
  if (overloadMul !== 1) dmg = Math.floor(dmg * overloadMul);
  if (isPhysicalLike) {
    const bashMul = hasActivePetSkill(attacker, 'pet_bash_adv') ? PET_COMBAT_BALANCE.bashAdvMul :
                    hasActivePetSkill(attacker, 'pet_bash') ? PET_COMBAT_BALANCE.bashMul : 1;
    dmg = Math.floor(dmg * bashMul);
  }
  if (isSpellLike) {
    const spiritMul = hasActivePetSkill(attacker, 'pet_spirit_adv') ? PET_COMBAT_BALANCE.spiritAdvMul :
                       hasActivePetSkill(attacker, 'pet_spirit') ? PET_COMBAT_BALANCE.spiritMul : 1;
    dmg = Math.floor(dmg * spiritMul);
  }
  const breakMul = hasActivePetSkill(attacker, 'pet_break_adv') ? PET_COMBAT_BALANCE.breakAdvMul :
                   hasActivePetSkill(attacker, 'pet_break') ? PET_COMBAT_BALANCE.breakMul : 1;
  if (breakMul !== 1) dmg = Math.floor(dmg * breakMul);
  return Math.max(1, dmg);
}

function maybeApplyPetCrit(attacker, baseDamage) {
  const dmg = Math.max(0, Math.floor(Number(baseDamage) || 0));
  if (dmg <= 0) return { damage: 0, crit: false };
  const critChance = hasActivePetSkill(attacker, 'pet_crit_adv') ? PET_COMBAT_BALANCE.critAdvChance :
                     hasActivePetSkill(attacker, 'pet_crit') ? PET_COMBAT_BALANCE.critChance : 0;
  if (critChance === 0) return { damage: dmg, crit: false };
  if (Math.random() > critChance) return { damage: dmg, crit: false };
  return { damage: Math.max(1, Math.floor(dmg * PET_COMBAT_BALANCE.critMultiplier)), crit: true };
}

function shouldTriggerPetCombo(attacker) {
  const comboChance = hasActivePetSkill(attacker, 'pet_combo_adv') ? PET_COMBAT_BALANCE.comboAdvChance :
                      hasActivePetSkill(attacker, 'pet_combo') ? PET_COMBAT_BALANCE.comboChance : 0;
  if (comboChance === 0) return false;
  return Math.random() <= comboChance;
}

function applyPetLifesteal(attacker, dealtDamage) {
  const lifestealRatio = hasActivePetSkill(attacker, 'pet_lifesteal_adv') ? PET_COMBAT_BALANCE.lifestealAdvRatio :
                        hasActivePetSkill(attacker, 'pet_lifesteal') ? PET_COMBAT_BALANCE.lifestealRatio : 0;
  if (!attacker || lifestealRatio === 0) return 0;
  const dealt = Math.max(0, Math.floor(Number(dealtDamage) || 0));
  if (dealt <= 0) return 0;
  const heal = Math.max(1, Math.floor(dealt * lifestealRatio));
  attacker.hp = clamp(attacker.hp + heal, 1, attacker.max_hp);
  if (typeof attacker.send === 'function') {
    attacker.send(`宠物技能【吸血】触发，恢复 ${heal} 点生命。`);
  }
  return heal;
}

function tryApplyPetMagicBreak(attacker, target) {
  if (!attacker || !target) return false;
  const magicBreakChance = hasActivePetSkill(attacker, 'pet_magic_break_adv') ? PET_COMBAT_BALANCE.magicBreakAdvChance :
                          hasActivePetSkill(attacker, 'pet_magic_break') ? PET_COMBAT_BALANCE.magicBreakChance : 0;
  if (magicBreakChance === 0) return false;
  if (Math.random() > magicBreakChance) return false;
  if (!target.status) target.status = {};
  if (!target.status.debuffs) target.status.debuffs = {};
  const mdefMultiplier = hasActivePetSkill(attacker, 'pet_magic_break_adv') ? PET_COMBAT_BALANCE.magicBreakAdvMdefMultiplier :
                        hasActivePetSkill(attacker, 'pet_magic_break') ? PET_COMBAT_BALANCE.magicBreakMdefMultiplier : 0.9;
  target.status.debuffs.petMagicBreak = {
    mdefMultiplier: mdefMultiplier,
    expiresAt: Date.now() + PET_COMBAT_BALANCE.magicBreakDurationMs
  };
  return true;
}

function tryTriggerPetArcaneEcho(attacker, skill) {
  if (!attacker || !skill) return false;
  const arcaneEchoChance = hasActivePetSkill(attacker, 'pet_arcane_echo_adv') ? PET_COMBAT_BALANCE.arcaneEchoAdvChance :
                            hasActivePetSkill(attacker, 'pet_arcane_echo') ? PET_COMBAT_BALANCE.arcaneEchoChance : 0;
  if (arcaneEchoChance === 0) return false;
  if (!['spell', 'aoe', 'dot'].includes(skill.type)) return false;
  return Math.random() <= arcaneEchoChance;
}

function applyPetKillSoulOnKill(attacker) {
  if (!attacker || !hasActivePetSkill(attacker, 'pet_kill_soul')) return false;
  const hpGain = Math.max(1, Math.floor((attacker.max_hp || 1) * PET_COMBAT_BALANCE.killSoulRecoverRatio));
  const mpGain = Math.max(1, Math.floor((attacker.max_mp || 1) * PET_COMBAT_BALANCE.killSoulRecoverRatio));
  attacker.hp = clamp(attacker.hp + hpGain, 1, attacker.max_hp);
  attacker.mp = clamp(attacker.mp + mpGain, 0, attacker.max_mp);
  if (typeof attacker.send === 'function') {
    attacker.send(`宠物技能【噬魂】触发，恢复 ${hpGain} 生命和 ${mpGain} 法力。`);
  }
  return true;
}

function tryResolvePetStun(player) {
  if (!player?.status || !player.status.stunTurns || player.status.stunTurns <= 0) return false;
  if (!hasActivePetSkill(player, 'pet_resolve')) return false;
  if (Math.random() > PET_COMBAT_BALANCE.resolveChance) return false;
  player.status.stunTurns = 0;
  if (typeof player.send === 'function') {
    player.send('宠物技能【不屈】触发，成功抵抗控制。');
  }
  return true;
}

function inferPetBattleTypeByAptitude(aptitude) {
  const hp = Number(aptitude?.hp || 0);
  const atk = Number(aptitude?.atk || 0);
  const mag = Number(aptitude?.mag || 0);
  const def = Number(aptitude?.def || 0);
  if (hp >= Math.max(atk, mag) * 1.1 || (hp + def * 4) > (atk + mag) * 8) return 'tank';
  return mag > atk ? 'magic' : 'physical';
}

function normalizePetBattleType(pet, aptitude) {
  const raw = String(pet?.battleType || pet?.petType || pet?.combatType || '').trim().toLowerCase();
  if (raw === 'physical' || raw === 'phys' || raw === 'atk') return 'physical';
  if (raw === 'magic' || raw === 'mag' || raw === 'spell') return 'magic';
  if (raw === 'tank' || raw === 'blood' || raw === 'hp') return 'tank';
  return inferPetBattleTypeByAptitude(aptitude);
}

function rollAptitudeByBias(range, bias = 'mid') {
  const min = Math.floor(Number(range?.[0] || 0));
  const max = Math.floor(Number(range?.[1] || min));
  if (max <= min) return min;
  const r = Math.random();
  let t = r;
  if (bias === 'high') t = Math.pow(r, 0.55);
  else if (bias === 'low') t = 1 - Math.pow(1 - r, 0.55);
  else if (bias === 'mid_high') t = Math.pow(r, 0.75);
  else if (bias === 'mid_low') t = 1 - Math.pow(1 - r, 0.75);
  return Math.max(min, Math.min(max, Math.floor(min + (max - min) * t)));
}

function rollPetAptitudeByBattleType(aptRange, battleType) {
  const type = String(battleType || 'physical');
  const biasMap = type === 'magic'
    ? { hp: 'mid_low', atk: 'low', def: 'mid_low', mag: 'high', agility: 'mid_high' }
    : type === 'tank'
      ? { hp: 'high', atk: 'low', def: 'high', mag: 'low', agility: 'mid_low' }
      : { hp: 'mid', atk: 'high', def: 'mid', mag: 'low', agility: 'mid_high' };
  return {
    hp: rollAptitudeByBias(aptRange.hp, biasMap.hp),
    atk: rollAptitudeByBias(aptRange.atk, biasMap.atk),
    def: rollAptitudeByBias(aptRange.def, biasMap.def),
    mag: rollAptitudeByBias(aptRange.mag, biasMap.mag),
    agility: rollAptitudeByBias(aptRange.agility, biasMap.agility)
  };
}

function biasSynthesizedPetAptitudeByBattleType(pet, aptRange, battleType) {
  if (!pet?.aptitude || !aptRange) return;
  const type = String(battleType || normalizePetBattleType(pet, pet.aptitude));
  const boost = (key, pct) => {
    const cur = Math.floor(Number(pet.aptitude[key] || 0));
    const min = Math.floor(Number(aptRange[key]?.[0] || 0));
    const max = Math.floor(Number(aptRange[key]?.[1] || min));
    const next = Math.floor(cur * (1 + pct));
    pet.aptitude[key] = Math.max(min, Math.min(max, next));
  };
  const trim = (key, pct) => {
    const cur = Math.floor(Number(pet.aptitude[key] || 0));
    const min = Math.floor(Number(aptRange[key]?.[0] || 0));
    const max = Math.floor(Number(aptRange[key]?.[1] || min));
    const next = Math.floor(cur * (1 - pct));
    pet.aptitude[key] = Math.max(min, Math.min(max, next));
  };
  if (type === 'magic') {
    boost('mag', 0.08);
    boost('agility', 0.04);
    trim('atk', 0.03);
  } else if (type === 'tank') {
    boost('hp', 0.1);
    boost('def', 0.08);
    trim('atk', 0.04);
    trim('mag', 0.04);
  } else {
    boost('atk', 0.08);
    boost('agility', 0.04);
    trim('mag', 0.03);
  }
}

function scalePetEquipBaseStat(value, baseRollPct) {
  const base = Number(value || 0);
  if (base <= 0) return 0;
  const rollPct = Math.max(100, Math.min(200, Math.floor(Number(baseRollPct ?? 100) || 100)));
  return Math.max(1, Math.floor(base * rollPct / 100));
}

function getPetEquipmentCombatStats(pet) {
  const out = { hp: 0, atk: 0, def: 0, mdef: 0, mag: 0, spirit: 0, dex: 0 };
  if (!pet) return out;
  const equip = normalizePetEquipmentState(pet.equipment);
  const refineBonusPerLevel = Math.max(0, Number(getRefineBonusPerLevel() || 0));
  for (const entry of Object.values(equip)) {
    if (!entry?.id) continue;
    const tpl = ITEM_TEMPLATES[entry.id];
    if (!tpl || !tpl.slot) continue;
    const refineBonus = Math.max(0, Math.floor(Number(entry.refine_level || 0))) * refineBonusPerLevel;
    out.hp += scalePetEquipBaseStat(tpl.hp || 0, entry.base_roll_pct) + refineBonus;
    out.atk += scalePetEquipBaseStat(tpl.atk || 0, entry.base_roll_pct) + refineBonus;
    out.def += scalePetEquipBaseStat(tpl.def || 0, entry.base_roll_pct) + refineBonus;
    out.mdef += scalePetEquipBaseStat(tpl.mdef || 0, entry.base_roll_pct) + refineBonus;
    out.mag += scalePetEquipBaseStat(tpl.mag || 0, entry.base_roll_pct) + refineBonus;
    out.spirit += scalePetEquipBaseStat(tpl.spirit || 0, entry.base_roll_pct) + refineBonus;
    out.dex += scalePetEquipBaseStat(tpl.dex || 0, entry.base_roll_pct) + refineBonus;
  }
  return out;
}

function calcPetAssistDamage(player, mob) {
  const pet = getActivePet(player);
  if (!pet || !mob || Number(mob.hp || 0) <= 0) return null;
  const aptitude = pet.aptitude || {};
  const equipStats = getPetEquipmentCombatStats(pet);
  const petTrainingBonus = getPetTrainingBonus(pet);
  const growth = Math.max(0.8, Number(pet.growth || 1));
  const level = Math.max(1, Math.floor(Number(pet.level || 1)));
  const battleType = normalizePetBattleType(pet, aptitude);
  const mobDef = Math.max(0, Number(mob.def || 0));
  const mobMdef = Math.max(0, Number(mob.mdef || 0));
  const petAtk = Number(aptitude.atk || 0) + Number(equipStats.atk || 0) + Number(petTrainingBonus.atk || 0) + Number(petTrainingBonus.dex || 0);
  const petMag = Number(aptitude.mag || 0) + Number(equipStats.mag || 0) + Number(equipStats.spirit || 0) + Number(petTrainingBonus.mag || 0);
  const petHp = Number(aptitude.hp || 0) + Number(equipStats.hp || 0) + Number(petTrainingBonus.hp || 0);
  const petDef = Number(aptitude.def || 0) + Number(equipStats.def || 0) + Number(petTrainingBonus.def || 0);

  let base = 0;
  const typeMods = {
    baseMul: 1,
    critChanceBonus: 0,
    critDamageMul: 1.5,
    comboChanceBonus: 0,
    comboRatioBonus: 0,
    splashChance: 0,
    splashRatio: 0,
    aoeChance: 0,
    aoeTargets: 0,
    aoeRatio: 0,
    breakMdefChance: 0,
    breakDefChance: 0,
    ownerHealRatio: 0,
    lifestealRatio: 0,
    arcaneEchoChance: 0,
    arcaneEchoRatio: 0,
    warHornChance: 0,
    sunderChance: 0,
    sunderDefMultiplier: 0.9,
    sunderMdefMultiplier: 0.9,
    divineGuardChance: 0,
    divineGuardDamageMul: 0.92,
    dodgeGuardChance: 0,
    dodgeGuardDamageMul: 0.95,
    quickStrikeChance: 0,
    quickStrikeRatio: 0.45,
    counterLashChance: 0,
    counterLashRatio: 0.35,
    soulChainChance: 0,
    soulChainWeakReduction: 0,
    soulChainGuardRatio: 0,
    breakDefMultiplier: 0.85,
    breakMdefMultiplier: 0.85
  };
  if (battleType === 'magic') {
    base = (petMag * 1.7 + level * 5) * growth - mobMdef * 0.45;
    typeMods.baseMul = 1.12;
    typeMods.splashChance = 0.35;
    typeMods.splashRatio = 0.4;
    typeMods.breakMdefChance = 0.2;
    if (hasPetSkillOnPet(pet, 'pet_spirit')) base *= 1.045;
    if (hasPetSkillOnPet(pet, 'pet_spirit_adv')) base *= 1.0675;
  } else if (battleType === 'tank') {
    base = ((petHp * 0.16) + (petDef * 1.2) + level * 4) * growth - mobDef * 0.35;
    typeMods.baseMul = 0.78;
    typeMods.breakDefChance = 0.25;
    typeMods.ownerHealRatio = 0.02;
    if (hasPetSkillOnPet(pet, 'pet_guard')) base *= 1.05;
    if (hasPetSkillOnPet(pet, 'pet_tough_skin')) base *= 1.04;
    if (hasPetSkillOnPet(pet, 'pet_tough_skin_adv')) base *= 1.06;
  } else {
    base = (petAtk * 1.7 + level * 5) * growth - mobDef * 0.45;
    typeMods.baseMul = 1.18;
    typeMods.critChanceBonus = 0.05;
    typeMods.critDamageMul = 1.65;
    typeMods.comboChanceBonus = 0.04;
    typeMods.comboRatioBonus = 0.2;
    if (hasPetSkillOnPet(pet, 'pet_bash')) base *= 1.045;
    if (hasPetSkillOnPet(pet, 'pet_bash_adv')) base *= 1.0675;
  }
  if (hasPetSkillOnPet(pet, 'pet_fury')) base *= 1.045;
  if (hasPetSkillOnPet(pet, 'pet_fury_adv')) base *= 1.0675;
  if (hasPetSkillOnPet(pet, 'pet_overload')) base *= 1.03;
  if (hasPetSkillOnPet(pet, 'pet_overload_adv')) base *= 1.05;
  if (hasPetSkillOnPet(pet, 'pet_focus')) {
    base *= 1.02;
    typeMods.critChanceBonus += 0.02;
    typeMods.breakDefChance += 0.04;
    typeMods.breakMdefChance += 0.04;
  }
  if (hasPetSkillOnPet(pet, 'pet_focus_adv')) {
    base *= 1.035;
    typeMods.critChanceBonus += 0.03;
    typeMods.breakDefChance += 0.06;
    typeMods.breakMdefChance += 0.06;
  }
  if (hasPetSkillOnPet(pet, 'pet_quick_step')) {
    typeMods.comboChanceBonus += 0.03;
    typeMods.quickStrikeChance += 0.12;
  }
  if (hasPetSkillOnPet(pet, 'pet_quick_step_adv')) {
    typeMods.comboChanceBonus += 0.05;
    typeMods.quickStrikeChance += 0.18;
    typeMods.quickStrikeRatio += 0.08;
  }
  if (hasPetSkillOnPet(pet, 'pet_dodge')) {
    typeMods.dodgeGuardChance += 0.12;
    typeMods.dodgeGuardDamageMul = Math.min(typeMods.dodgeGuardDamageMul, 0.94);
  }
  if (hasPetSkillOnPet(pet, 'pet_dodge_adv')) {
    typeMods.dodgeGuardChance += 0.18;
    typeMods.dodgeGuardDamageMul = Math.min(typeMods.dodgeGuardDamageMul, 0.9);
  }
  if (hasPetSkillOnPet(pet, 'pet_lifesteal')) typeMods.lifestealRatio += 0.03;
  if (hasPetSkillOnPet(pet, 'pet_lifesteal_adv')) typeMods.lifestealRatio += 0.05;
  if (hasPetSkillOnPet(pet, 'pet_counter')) typeMods.counterLashChance += 0.12;
  if (hasPetSkillOnPet(pet, 'pet_counter_adv')) { typeMods.counterLashChance += 0.2; typeMods.counterLashRatio += 0.12; }
  if (hasPetSkillOnPet(pet, 'pet_break')) {
    typeMods.breakDefChance += 0.12;
    typeMods.breakDefMultiplier = Math.min(typeMods.breakDefMultiplier, 0.88);
  }
  if (hasPetSkillOnPet(pet, 'pet_break_adv')) {
    typeMods.breakDefChance += 0.2;
    typeMods.breakDefMultiplier = Math.min(typeMods.breakDefMultiplier, 0.82);
  }
  if (hasPetSkillOnPet(pet, 'pet_magic_break')) {
    typeMods.breakMdefChance += 0.12;
    typeMods.breakMdefMultiplier = Math.min(typeMods.breakMdefMultiplier, 0.88);
  }
  if (hasPetSkillOnPet(pet, 'pet_magic_break_adv')) {
    typeMods.breakMdefChance += 0.2;
    typeMods.breakMdefMultiplier = Math.min(typeMods.breakMdefMultiplier, 0.82);
  }
  if (hasPetSkillOnPet(pet, 'pet_bloodline')) typeMods.ownerHealRatio += 0.008;
  if (hasPetSkillOnPet(pet, 'pet_bloodline_adv')) typeMods.ownerHealRatio += 0.015;
  if (hasPetSkillOnPet(pet, 'pet_sunder')) typeMods.sunderChance += 0.16;
  if (hasPetSkillOnPet(pet, 'pet_sunder_adv')) {
    typeMods.sunderChance += 0.24;
    typeMods.sunderDefMultiplier = 0.85;
    typeMods.sunderMdefMultiplier = 0.85;
  }
  if (hasPetSkillOnPet(pet, 'pet_arcane_echo')) { typeMods.arcaneEchoChance += 0.12; typeMods.arcaneEchoRatio = Math.max(typeMods.arcaneEchoRatio, 0.22); }
  if (hasPetSkillOnPet(pet, 'pet_arcane_echo_adv')) { typeMods.arcaneEchoChance += 0.2; typeMods.arcaneEchoRatio = Math.max(typeMods.arcaneEchoRatio, 0.32); }
  if (hasPetSkillOnPet(pet, 'pet_aoe')) {
    typeMods.aoeChance += 0.18;
    typeMods.aoeTargets = Math.max(typeMods.aoeTargets, 1);
    typeMods.aoeRatio = Math.max(typeMods.aoeRatio, 0.3);
  }
  if (hasPetSkillOnPet(pet, 'pet_aoe_adv')) {
    typeMods.aoeChance += 0.3;
    typeMods.aoeTargets = Math.max(typeMods.aoeTargets, 2);
    typeMods.aoeRatio = Math.max(typeMods.aoeRatio, 0.45);
  }
  if (hasPetSkillOnPet(pet, 'pet_divine_guard')) {
    typeMods.divineGuardChance = 0.12;
    typeMods.divineGuardDamageMul = 0.85;
  }
  if (hasPetSkillOnPet(pet, 'pet_soul_chain')) {
    typeMods.soulChainChance += 0.12;
    typeMods.soulChainWeakReduction = Math.max(typeMods.soulChainWeakReduction, 0.12);
    typeMods.soulChainGuardRatio = Math.max(typeMods.soulChainGuardRatio, 0.015);
  }
  if (hasPetSkillOnPet(pet, 'pet_soul_chain_adv')) {
    typeMods.soulChainChance += 0.2;
    typeMods.soulChainWeakReduction = Math.max(typeMods.soulChainWeakReduction, 0.2);
    typeMods.soulChainGuardRatio = Math.max(typeMods.soulChainGuardRatio, 0.03);
  }
  if (hasPetSkillOnPet(pet, 'pet_war_horn')) typeMods.warHornChance += 0.12;
  if (hasPetSkillOnPet(pet, 'pet_war_horn_adv')) typeMods.warHornChance += 0.2;
  applyDivineBeastExclusiveCombatMods(pet, typeMods, { pvp: false });

  base *= typeMods.baseMul;
  let damage = Math.max(1, Math.floor(base));
  let crit = false;
  const critChance = (hasPetSkillOnPet(pet, 'pet_crit_adv') ? 0.0675 : hasPetSkillOnPet(pet, 'pet_crit') ? 0.045 : 0) + typeMods.critChanceBonus;
  if (critChance > 0 && Math.random() <= critChance) {
    damage = Math.max(1, Math.floor(damage * typeMods.critDamageMul));
    crit = true;
  }

  return { pet, battleType, damage, crit, typeMods };
}

function applyPetAssistAttackToMob(player, mob, roomRealmId, allMobs = null) {
  const assist = calcPetAssistDamage(player, mob);
  if (!assist) return null;
  const result = applyDamageToMob(mob, assist.damage, player.name, roomRealmId);
  const dealt = Math.max(0, Number(result?.damageTaken || 0));
  if (dealt <= 0) return null;
  const petName = String(assist.pet?.name || 'Pet');
  player.send(`${petName} 协战造成 ${dealt} 点伤害${assist.crit ? '（暴击）' : ''}。`);
  maybePetAssistCleanseOwner(player, assist.pet);
  maybePetAssistEmergencyRebirth(player, assist.pet);
  if (assist.typeMods.ownerHealRatio > 0) {
    const heal = Math.max(1, Math.floor(player.max_hp * assist.typeMods.ownerHealRatio));
    player.hp = clamp(player.hp + heal, 1, player.max_hp);
    player.send(`${petName} 护主为你恢复 ${heal} 点生命。`);
  }
  if (assist.typeMods.lifestealRatio > 0) {
    const heal = Math.max(1, Math.floor(dealt * assist.typeMods.lifestealRatio));
    player.hp = clamp(player.hp + heal, 1, player.max_hp);
    player.send(`${petName} 吸血恢复 ${heal} 点生命。`);
  }
  if (assist.typeMods.breakDefChance > 0 && Math.random() <= assist.typeMods.breakDefChance) {
    const debuffs = ensureTargetDebuffs(mob);
    debuffs.armorBreak = { expiresAt: Date.now() + 2500, defMultiplier: assist.typeMods.breakDefMultiplier || 0.85 };
    player.send(`${petName} 对 ${mob.name} 触发破防。`);
  }
  if (assist.typeMods.breakMdefChance > 0 && Math.random() <= assist.typeMods.breakMdefChance) {
    const debuffs = ensureTargetDebuffs(mob);
    debuffs.petMagicBreak = { mdefMultiplier: assist.typeMods.breakMdefMultiplier || 0.85, expiresAt: Date.now() + 2500 };
    player.send(`${petName} 对 ${mob.name} 触发破魔。`);
  }
  if (assist.typeMods.warHornChance > 0 && Math.random() <= assist.typeMods.warHornChance) {
    applyHealBlockDebuff(mob);
    player.send(`${petName} 对 ${mob.name} 施加禁疗压制。`);
  }
  if (assist.typeMods.sunderChance > 0 && Math.random() <= assist.typeMods.sunderChance) {
    const debuffs = ensureTargetDebuffs(mob);
    debuffs.armorBreak = { expiresAt: Date.now() + 3500, defMultiplier: Math.min(Number(debuffs.armorBreak?.defMultiplier || 1), assist.typeMods.sunderDefMultiplier || 0.9) };
    debuffs.petMagicBreak = { expiresAt: Date.now() + 3500, mdefMultiplier: Math.min(Number(debuffs.petMagicBreak?.mdefMultiplier || 1), assist.typeMods.sunderMdefMultiplier || 0.9) };
    player.send(`${petName} 对 ${mob.name} 触发撕裂压制。`);
  }
  if (assist.typeMods.divineGuardChance > 0 && Math.random() <= assist.typeMods.divineGuardChance) {
    const buffs = ensureTargetBuffs(player);
    buffs.protectShield = { expiresAt: Date.now() + 2000, dmgReduction: 1 - (assist.typeMods.divineGuardDamageMul || 0.9) };
    player.send(`${petName} 触发神佑，给你提供短暂减伤。`);
  }
  if (assist.typeMods.soulChainChance > 0 && Math.random() <= assist.typeMods.soulChainChance) {
    const debuffs = ensureTargetDebuffs(mob);
    debuffs.weak = {
      expiresAt: Date.now() + 2500,
      dmgReduction: Math.max(Number(debuffs.weak?.dmgReduction || 0), assist.typeMods.soulChainWeakReduction || 0.1)
    };
    const buffs = ensureTargetBuffs(player);
    buffs.protectShield = {
      expiresAt: Date.now() + 1500,
      dmgReduction: Math.max(Number(buffs.protectShield?.dmgReduction || 0), assist.typeMods.soulChainGuardRatio || 0.01)
    };
    player.send(`${petName} 对 ${mob.name} 触发魂链压制。`);
  }
  if (assist.typeMods.dodgeGuardChance > 0 && Math.random() <= assist.typeMods.dodgeGuardChance) {
    const buffs = ensureTargetBuffs(player);
    buffs.protectShield = { expiresAt: Date.now() + 1200, dmgReduction: Math.max(Number(buffs.protectShield?.dmgReduction || 0), 1 - (assist.typeMods.dodgeGuardDamageMul || 0.95)) };
    player.send(`${petName} 触发护主闪避减伤。`);
  }
  if (assist.typeMods.splashChance > 0 && Math.random() <= assist.typeMods.splashChance) {
    const pool = (Array.isArray(allMobs) ? allMobs : [])
      .filter((m) => m && m.id !== mob.id && Number(m.hp || 0) > 0);
    if (pool.length > 0) {
      const splashTarget = pool[randInt(0, pool.length - 1)];
      const splashResult = applyDamageToMob(splashTarget, Math.max(1, Math.floor(dealt * assist.typeMods.splashRatio)), player.name, roomRealmId);
      const splashDealt = Math.max(0, Number(splashResult?.damageTaken || 0));
      if (splashDealt > 0) player.send(`${petName} 溅射 ${splashTarget.name}，造成 ${splashDealt} 点伤害。`);
    }
  }
  if (assist.typeMods.aoeChance > 0 && assist.typeMods.aoeTargets > 0 && Math.random() <= assist.typeMods.aoeChance) {
    const mpUse = tryConsumePetMpForSkill(assist.pet, 'pet_aoe');
    if (mpUse.ok) {
      const pool = (Array.isArray(allMobs) ? allMobs : [])
        .filter((m) => m && m.id !== mob.id && Number(m.hp || 0) > 0);
      if (pool.length > 0) {
        const maxTargets = Math.min(pool.length, Math.max(1, Math.floor(assist.typeMods.aoeTargets || 1)));
        let hits = 0;
        while (pool.length > 0 && hits < maxTargets) {
          const idx = randInt(0, pool.length - 1);
          const aoeTarget = pool.splice(idx, 1)[0];
          const aoeResult = applyDamageToMob(
            aoeTarget,
            Math.max(1, Math.floor(dealt * (assist.typeMods.aoeRatio || 0.3))),
            player.name,
            roomRealmId
          );
          const aoeDealt = Math.max(0, Number(aoeResult?.damageTaken || 0));
          if (aoeDealt > 0) {
            hits += 1;
            player.send(`${petName} 范围波及 ${aoeTarget.name}，造成 ${aoeDealt} 点伤害。`);
          }
        }
      }
    }
  }
  if (assist.typeMods.arcaneEchoChance > 0 && Math.random() <= assist.typeMods.arcaneEchoChance && mob.hp > 0) {
    const echo = applyDamageToMob(mob, Math.max(1, Math.floor(dealt * (assist.typeMods.arcaneEchoRatio || 0.2))), player.name, roomRealmId);
    const echoDealt = Math.max(0, Number(echo?.damageTaken || 0));
    if (echoDealt > 0) player.send(`${petName} 回响追加 ${echoDealt} 点伤害。`);
  }
  if (assist.typeMods.quickStrikeChance > 0 && Math.random() <= assist.typeMods.quickStrikeChance && mob.hp > 0) {
    const quick = applyDamageToMob(mob, Math.max(1, Math.floor(dealt * (assist.typeMods.quickStrikeRatio || 0.4))), player.name, roomRealmId);
    const quickDealt = Math.max(0, Number(quick?.damageTaken || 0));
    if (quickDealt > 0) player.send(`${petName} 疾袭追加 ${quickDealt} 点伤害。`);
  }
  if (mob.hp > 0) {
    const comboChance = (hasPetSkillOnPet(assist.pet, 'pet_combo_adv') ? 0.09 : hasPetSkillOnPet(assist.pet, 'pet_combo') ? 0.06 : 0)
      + (assist.typeMods.comboChanceBonus || 0);
    if (comboChance > 0 && Math.random() <= comboChance) {
      const comboRatio = (hasPetSkillOnPet(assist.pet, 'pet_combo_adv') ? 0.9 : 0.6) + (assist.typeMods.comboRatioBonus || 0);
      const comboResult = applyDamageToMob(mob, Math.max(1, Math.floor(dealt * comboRatio)), player.name, roomRealmId);
      const comboDealt = Math.max(0, Number(comboResult?.damageTaken || 0));
      if (comboDealt > 0) player.send(`${petName} 连击追加 ${comboDealt} 点伤害。`);
    }
  }
  if (mob.hp > 0 && assist.typeMods.counterLashChance > 0 && Math.random() <= assist.typeMods.counterLashChance) {
    const lash = applyDamageToMob(mob, Math.max(1, Math.floor(dealt * (assist.typeMods.counterLashRatio || 0.35))), player.name, roomRealmId);
    const lashDealt = Math.max(0, Number(lash?.damageTaken || 0));
    if (lashDealt > 0) player.send(`${petName} 反扑追加 ${lashDealt} 点伤害。`);
  }
  if (mob.hp <= 0) {
    applyPetAssistKillSoul(player, assist.pet);
  }
  return { damageTaken: dealt };
}

function calcPetAssistDamageToPlayer(attacker, target) {
  const pet = getActivePet(attacker);
  if (!pet || !target || Number(target.hp || 0) <= 0) return null;
  const aptitude = pet.aptitude || {};
  const equipStats = getPetEquipmentCombatStats(pet);
  const petTrainingBonus = getPetTrainingBonus(pet);
  const growth = Math.max(0.8, Number(pet.growth || 1));
  const level = Math.max(1, Math.floor(Number(pet.level || 1)));
  const battleType = normalizePetBattleType(pet, aptitude);
  const targetDef = Math.max(0, Number(target.def || 0));
  const targetMdef = Math.max(0, Number(target.mdef || 0));
  const petAtk = Number(aptitude.atk || 0) + Number(equipStats.atk || 0) + Number(petTrainingBonus.atk || 0) + Number(petTrainingBonus.dex || 0);
  const petMag = Number(aptitude.mag || 0) + Number(equipStats.mag || 0) + Number(equipStats.spirit || 0) + Number(petTrainingBonus.mag || 0);
  const petHp = Number(aptitude.hp || 0) + Number(equipStats.hp || 0) + Number(petTrainingBonus.hp || 0);
  const petDef = Number(aptitude.def || 0) + Number(equipStats.def || 0) + Number(petTrainingBonus.def || 0);

  let base = 0;
  const typeMods = {
    baseMul: 1,
    critChanceBonus: 0,
    critDamageMul: 1.5,
    comboChanceBonus: 0,
    comboRatioBonus: 0,
    breakMdefChance: 0,
    breakDefChance: 0,
    ownerHealRatio: 0,
    aoeChance: 0,
    aoeTargets: 0,
    aoeRatio: 0,
    lifestealRatio: 0,
    arcaneEchoChance: 0,
    arcaneEchoRatio: 0,
    warHornChance: 0,
    sunderChance: 0,
    sunderDefMultiplier: 0.93,
    sunderMdefMultiplier: 0.93,
    divineGuardChance: 0,
    divineGuardDamageMul: 0.9,
    dodgeGuardChance: 0,
    dodgeGuardDamageMul: 0.96,
    quickStrikeChance: 0,
    quickStrikeRatio: 0.35,
    counterLashChance: 0,
    counterLashRatio: 0.28,
    soulChainChance: 0,
    soulChainWeakReduction: 0,
    soulChainGuardRatio: 0,
    breakDefMultiplier: 0.9,
    breakMdefMultiplier: 0.9
  };
  if (battleType === 'magic') {
    base = (petMag * 1.55 + level * 4.5) * growth - targetMdef * 0.5;
    typeMods.baseMul = 0.95;
    typeMods.breakMdefChance = 0.15;
    if (hasPetSkillOnPet(pet, 'pet_spirit')) base *= 1.04;
    if (hasPetSkillOnPet(pet, 'pet_spirit_adv')) base *= 1.06;
  } else if (battleType === 'tank') {
    base = ((petHp * 0.14) + (petDef * 1.05) + level * 3.5) * growth - targetDef * 0.45;
    typeMods.baseMul = 0.65;
    typeMods.breakDefChance = 0.18;
    typeMods.ownerHealRatio = 0.012;
    if (hasPetSkillOnPet(pet, 'pet_guard')) base *= 1.04;
    if (hasPetSkillOnPet(pet, 'pet_tough_skin')) base *= 1.03;
    if (hasPetSkillOnPet(pet, 'pet_tough_skin_adv')) base *= 1.05;
  } else {
    base = (petAtk * 1.55 + level * 4.5) * growth - targetDef * 0.5;
    typeMods.baseMul = 1.0;
    typeMods.critChanceBonus = 0.04;
    typeMods.critDamageMul = 1.55;
    typeMods.comboChanceBonus = 0.03;
    typeMods.comboRatioBonus = 0.15;
    if (hasPetSkillOnPet(pet, 'pet_bash')) base *= 1.04;
    if (hasPetSkillOnPet(pet, 'pet_bash_adv')) base *= 1.06;
  }
  if (hasPetSkillOnPet(pet, 'pet_fury')) base *= 1.04;
  if (hasPetSkillOnPet(pet, 'pet_fury_adv')) base *= 1.06;
  if (hasPetSkillOnPet(pet, 'pet_overload')) base *= 1.025;
  if (hasPetSkillOnPet(pet, 'pet_overload_adv')) base *= 1.04;
  if (hasPetSkillOnPet(pet, 'pet_focus')) {
    base *= 1.015;
    typeMods.critChanceBonus += 0.015;
    typeMods.breakDefChance += 0.03;
    typeMods.breakMdefChance += 0.03;
  }
  if (hasPetSkillOnPet(pet, 'pet_focus_adv')) {
    base *= 1.03;
    typeMods.critChanceBonus += 0.025;
    typeMods.breakDefChance += 0.05;
    typeMods.breakMdefChance += 0.05;
  }
  if (hasPetSkillOnPet(pet, 'pet_quick_step')) {
    typeMods.comboChanceBonus += 0.02;
    typeMods.quickStrikeChance += 0.08;
  }
  if (hasPetSkillOnPet(pet, 'pet_quick_step_adv')) {
    typeMods.comboChanceBonus += 0.04;
    typeMods.quickStrikeChance += 0.14;
    typeMods.quickStrikeRatio += 0.06;
  }
  if (hasPetSkillOnPet(pet, 'pet_dodge')) {
    typeMods.dodgeGuardChance += 0.08;
    typeMods.dodgeGuardDamageMul = Math.min(typeMods.dodgeGuardDamageMul, 0.95);
  }
  if (hasPetSkillOnPet(pet, 'pet_dodge_adv')) {
    typeMods.dodgeGuardChance += 0.14;
    typeMods.dodgeGuardDamageMul = Math.min(typeMods.dodgeGuardDamageMul, 0.92);
  }
  if (hasPetSkillOnPet(pet, 'pet_lifesteal')) typeMods.lifestealRatio += 0.02;
  if (hasPetSkillOnPet(pet, 'pet_lifesteal_adv')) typeMods.lifestealRatio += 0.035;
  if (hasPetSkillOnPet(pet, 'pet_counter')) typeMods.counterLashChance += 0.08;
  if (hasPetSkillOnPet(pet, 'pet_counter_adv')) { typeMods.counterLashChance += 0.14; typeMods.counterLashRatio += 0.1; }
  if (hasPetSkillOnPet(pet, 'pet_break')) {
    typeMods.breakDefChance += 0.08;
    typeMods.breakDefMultiplier = Math.min(typeMods.breakDefMultiplier, 0.92);
  }
  if (hasPetSkillOnPet(pet, 'pet_break_adv')) {
    typeMods.breakDefChance += 0.14;
    typeMods.breakDefMultiplier = Math.min(typeMods.breakDefMultiplier, 0.86);
  }
  if (hasPetSkillOnPet(pet, 'pet_magic_break')) {
    typeMods.breakMdefChance += 0.08;
    typeMods.breakMdefMultiplier = Math.min(typeMods.breakMdefMultiplier, 0.92);
  }
  if (hasPetSkillOnPet(pet, 'pet_magic_break_adv')) {
    typeMods.breakMdefChance += 0.14;
    typeMods.breakMdefMultiplier = Math.min(typeMods.breakMdefMultiplier, 0.86);
  }
  if (hasPetSkillOnPet(pet, 'pet_bloodline')) typeMods.ownerHealRatio += 0.006;
  if (hasPetSkillOnPet(pet, 'pet_bloodline_adv')) typeMods.ownerHealRatio += 0.012;
  if (hasPetSkillOnPet(pet, 'pet_sunder')) typeMods.sunderChance += 0.12;
  if (hasPetSkillOnPet(pet, 'pet_sunder_adv')) {
    typeMods.sunderChance += 0.18;
    typeMods.sunderDefMultiplier = 0.88;
    typeMods.sunderMdefMultiplier = 0.88;
  }
  if (hasPetSkillOnPet(pet, 'pet_arcane_echo')) { typeMods.arcaneEchoChance += 0.08; typeMods.arcaneEchoRatio = Math.max(typeMods.arcaneEchoRatio, 0.16); }
  if (hasPetSkillOnPet(pet, 'pet_arcane_echo_adv')) { typeMods.arcaneEchoChance += 0.14; typeMods.arcaneEchoRatio = Math.max(typeMods.arcaneEchoRatio, 0.24); }
  if (hasPetSkillOnPet(pet, 'pet_aoe')) {
    typeMods.aoeChance += 0.1;
    typeMods.aoeTargets = Math.max(typeMods.aoeTargets, 1);
    typeMods.aoeRatio = Math.max(typeMods.aoeRatio, 0.18);
  }
  if (hasPetSkillOnPet(pet, 'pet_aoe_adv')) {
    typeMods.aoeChance += 0.18;
    typeMods.aoeTargets = Math.max(typeMods.aoeTargets, 1);
    typeMods.aoeRatio = Math.max(typeMods.aoeRatio, 0.28);
  }
  if (hasPetSkillOnPet(pet, 'pet_divine_guard')) {
    typeMods.divineGuardChance = 0.08;
    typeMods.divineGuardDamageMul = 0.88;
  }
  if (hasPetSkillOnPet(pet, 'pet_soul_chain')) {
    typeMods.soulChainChance += 0.08;
    typeMods.soulChainWeakReduction = Math.max(typeMods.soulChainWeakReduction, 0.1);
    typeMods.soulChainGuardRatio = Math.max(typeMods.soulChainGuardRatio, 0.01);
  }
  if (hasPetSkillOnPet(pet, 'pet_soul_chain_adv')) {
    typeMods.soulChainChance += 0.14;
    typeMods.soulChainWeakReduction = Math.max(typeMods.soulChainWeakReduction, 0.16);
    typeMods.soulChainGuardRatio = Math.max(typeMods.soulChainGuardRatio, 0.02);
  }
  if (hasPetSkillOnPet(pet, 'pet_war_horn')) typeMods.warHornChance += 0.08;
  if (hasPetSkillOnPet(pet, 'pet_war_horn_adv')) typeMods.warHornChance += 0.14;
  applyDivineBeastExclusiveCombatMods(pet, typeMods, { pvp: true });

  base *= typeMods.baseMul;
  let damage = Math.max(1, Math.floor(base));
  let crit = false;
  const critChance =
    (hasPetSkillOnPet(pet, 'pet_crit_adv') ? 0.06 : hasPetSkillOnPet(pet, 'pet_crit') ? 0.04 : 0) +
    typeMods.critChanceBonus;
  if (critChance > 0 && Math.random() <= critChance) {
    damage = Math.max(1, Math.floor(damage * typeMods.critDamageMul));
    crit = true;
  }
  return { pet, battleType, damage, crit, typeMods };
}

function applyPetAssistAttackToPlayer(attacker, target) {
  const assist = calcPetAssistDamageToPlayer(attacker, target);
  if (!assist) return null;
  const dealt = applyDamageToPlayer(target, assist.damage);
  if (dealt <= 0) return null;
  const petName = String(assist.pet?.name || 'Pet');
  attacker.send(`${petName} 协战攻击 ${target.name}，造成 ${dealt} 点伤害${assist.crit ? '（暴击）' : ''}。`);
  target.send(`${petName} 协战对你造成 ${dealt} 点伤害。`);
  maybePetAssistCleanseOwner(attacker, assist.pet);
  maybePetAssistEmergencyRebirth(attacker, assist.pet);

  if (assist.typeMods.ownerHealRatio > 0) {
    const heal = Math.max(1, Math.floor(attacker.max_hp * assist.typeMods.ownerHealRatio));
    attacker.hp = clamp(attacker.hp + heal, 1, attacker.max_hp);
    attacker.send(`${petName} 护主为你恢复 ${heal} 点生命。`);
  }
  if (assist.typeMods.lifestealRatio > 0) {
    const heal = Math.max(1, Math.floor(dealt * assist.typeMods.lifestealRatio));
    attacker.hp = clamp(attacker.hp + heal, 1, attacker.max_hp);
    attacker.send(`${petName} 吸血恢复 ${heal} 点生命。`);
  }
  if (assist.typeMods.breakDefChance > 0 && Math.random() <= assist.typeMods.breakDefChance) {
    const debuffs = ensureTargetDebuffs(target);
    debuffs.armorBreak = { expiresAt: Date.now() + 2000, defMultiplier: assist.typeMods.breakDefMultiplier || 0.9 };
    attacker.send(`${petName} 对 ${target.name} 触发破防。`);
    target.send('你受到宠物破防影响。');
  }
  if (assist.typeMods.breakMdefChance > 0 && Math.random() <= assist.typeMods.breakMdefChance) {
    const debuffs = ensureTargetDebuffs(target);
    debuffs.petMagicBreak = { mdefMultiplier: assist.typeMods.breakMdefMultiplier || 0.9, expiresAt: Date.now() + 2000 };
    attacker.send(`${petName} 对 ${target.name} 触发破魔。`);
    target.send('你受到宠物破魔影响。');
  }
  if (assist.typeMods.warHornChance > 0 && Math.random() <= assist.typeMods.warHornChance) {
    applyHealBlockDebuff(target);
    attacker.send(`${petName} 对 ${target.name} 施加禁疗压制。`);
    target.send('你受到宠物禁疗影响。');
  }
  if (assist.typeMods.sunderChance > 0 && Math.random() <= assist.typeMods.sunderChance) {
    const debuffs = ensureTargetDebuffs(target);
    debuffs.armorBreak = { expiresAt: Date.now() + 2500, defMultiplier: Math.min(Number(debuffs.armorBreak?.defMultiplier || 1), assist.typeMods.sunderDefMultiplier || 0.93) };
    debuffs.petMagicBreak = { expiresAt: Date.now() + 2500, mdefMultiplier: Math.min(Number(debuffs.petMagicBreak?.mdefMultiplier || 1), assist.typeMods.sunderMdefMultiplier || 0.93) };
    attacker.send(`${petName} 对 ${target.name} 触发撕裂压制。`);
    target.send('你受到宠物撕裂压制。');
  }
  if (assist.typeMods.divineGuardChance > 0 && Math.random() <= assist.typeMods.divineGuardChance) {
    const buffs = ensureTargetBuffs(attacker);
    buffs.protectShield = { expiresAt: Date.now() + 1600, dmgReduction: 1 - (assist.typeMods.divineGuardDamageMul || 0.9) };
    attacker.send(`${petName} 触发神佑，给你提供短暂减伤。`);
  }
  if (assist.typeMods.soulChainChance > 0 && Math.random() <= assist.typeMods.soulChainChance) {
    const debuffs = ensureTargetDebuffs(target);
    debuffs.weak = {
      expiresAt: Date.now() + 2000,
      dmgReduction: Math.max(Number(debuffs.weak?.dmgReduction || 0), assist.typeMods.soulChainWeakReduction || 0.1)
    };
    const buffs = ensureTargetBuffs(attacker);
    buffs.protectShield = {
      expiresAt: Date.now() + 1200,
      dmgReduction: Math.max(Number(buffs.protectShield?.dmgReduction || 0), assist.typeMods.soulChainGuardRatio || 0.01)
    };
    attacker.send(`${petName} 对 ${target.name} 触发魂链压制。`);
    target.send('你受到宠物魂链压制。');
  }
  if (assist.typeMods.dodgeGuardChance > 0 && Math.random() <= assist.typeMods.dodgeGuardChance) {
    const buffs = ensureTargetBuffs(attacker);
    buffs.protectShield = { expiresAt: Date.now() + 1000, dmgReduction: Math.max(Number(buffs.protectShield?.dmgReduction || 0), 1 - (assist.typeMods.dodgeGuardDamageMul || 0.96)) };
    attacker.send(`${petName} 触发护主闪避减伤。`);
  }
  if (assist.typeMods.arcaneEchoChance > 0 && Math.random() <= assist.typeMods.arcaneEchoChance && target.hp > 0) {
    const echoDealt = applyDamageToPlayer(target, Math.max(1, Math.floor(dealt * (assist.typeMods.arcaneEchoRatio || 0.16))));
    if (echoDealt > 0) {
      attacker.send(`${petName} 对 ${target.name} 触发回响，追加 ${echoDealt} 点伤害。`);
      target.send(`${petName} 的回响对你追加造成 ${echoDealt} 点伤害。`);
    }
  }
  if (assist.typeMods.aoeChance > 0 && Math.random() <= assist.typeMods.aoeChance && target.hp > 0) {
    const mpUse = tryConsumePetMpForSkill(assist.pet, 'pet_aoe');
    if (mpUse.ok) {
      const sweepDealt = applyDamageToPlayer(target, Math.max(1, Math.floor(dealt * (assist.typeMods.aoeRatio || 0.18))));
      if (sweepDealt > 0) {
        attacker.send(`${petName} 对 ${target.name} 触发横扫，追加 ${sweepDealt} 点伤害。`);
        target.send(`${petName} 的横扫对你追加造成 ${sweepDealt} 点伤害。`);
      }
    }
  }
  if (assist.typeMods.quickStrikeChance > 0 && Math.random() <= assist.typeMods.quickStrikeChance && target.hp > 0) {
    const quickDealt = applyDamageToPlayer(target, Math.max(1, Math.floor(dealt * (assist.typeMods.quickStrikeRatio || 0.35))));
    if (quickDealt > 0) {
      attacker.send(`${petName} 对 ${target.name} 触发疾袭，追加 ${quickDealt} 点伤害。`);
      target.send(`${petName} 的疾袭对你追加造成 ${quickDealt} 点伤害。`);
    }
  }
  if (target.hp > 0) {
    const comboChance =
      (hasPetSkillOnPet(assist.pet, 'pet_combo_adv') ? 0.08 : hasPetSkillOnPet(assist.pet, 'pet_combo') ? 0.05 : 0) +
      (assist.typeMods.comboChanceBonus || 0);
    if (comboChance > 0 && Math.random() <= comboChance) {
      const comboRatio = (hasPetSkillOnPet(assist.pet, 'pet_combo_adv') ? 0.8 : 0.55) + (assist.typeMods.comboRatioBonus || 0);
      const comboDealt = applyDamageToPlayer(target, Math.max(1, Math.floor(dealt * comboRatio)));
      if (comboDealt > 0) {
        attacker.send(`${petName} 对 ${target.name} 触发连击，追加 ${comboDealt} 点伤害。`);
        target.send(`${petName} 的连击对你追加造成 ${comboDealt} 点伤害。`);
      }
    }
  }
  if (target.hp > 0 && assist.typeMods.counterLashChance > 0 && Math.random() <= assist.typeMods.counterLashChance) {
    const lashDealt = applyDamageToPlayer(target, Math.max(1, Math.floor(dealt * (assist.typeMods.counterLashRatio || 0.28))));
    if (lashDealt > 0) {
      attacker.send(`${petName} 对 ${target.name} 触发反扑，追加 ${lashDealt} 点伤害。`);
      target.send(`${petName} 的反扑对你追加造成 ${lashDealt} 点伤害。`);
    }
  }
  if (target.hp <= 0) {
    applyPetAssistKillSoul(attacker, assist.pet);
  }
  return { damageTaken: dealt };
}

function getPetLevelCap(player) {
  return Math.max(1, Math.floor(Number(player?.level || 1)) + PET_LEVEL_CAP_OFFSET);
}

function getPetLevelExpNeed(level) {
  const baseNeed = Math.max(1, Math.floor(expForLevel(Math.max(1, Math.floor(Number(level || 1))))));
  return Math.max(1, Math.floor(baseNeed * PET_EXP_NEED_RATIO));
}

const PET_EQUIP_SLOT_KEYS = [
  'weapon',
  'chest',
  'head',
  'waist',
  'feet',
  'neck',
  'ring_left',
  'ring_right',
  'bracelet_left',
  'bracelet_right'
];

function normalizePetEquipmentState(equipment) {
  const next = {};
  for (const slotKey of PET_EQUIP_SLOT_KEYS) next[slotKey] = null;
  if (!equipment || typeof equipment !== 'object') return next;
  for (const [slotKey, raw] of Object.entries(equipment)) {
    if (!PET_EQUIP_SLOT_KEYS.includes(slotKey)) continue;
    if (!raw || typeof raw !== 'object' || !raw.id) continue;
    const itemTpl = ITEM_TEMPLATES[raw.id];
    if (!itemTpl || !itemTpl.slot) continue;
    const tplSlot = String(itemTpl.slot);
    const slotOk =
      tplSlot === String(slotKey) ||
      (tplSlot === 'ring' && (slotKey === 'ring_left' || slotKey === 'ring_right')) ||
      (tplSlot === 'bracelet' && (slotKey === 'bracelet_left' || slotKey === 'bracelet_right'));
    if (!slotOk) continue;
    next[slotKey] = {
      id: String(raw.id),
      qty: 1,
      effects: normalizeEffects(raw.effects || null),
      durability: raw.durability == null ? null : Math.max(0, Math.floor(Number(raw.durability || 0))),
      max_durability: raw.max_durability == null ? null : Math.max(1, Math.floor(Number(raw.max_durability || 1))),
      refine_level: Math.max(0, Math.floor(Number(raw.refine_level || 0))),
      base_roll_pct: raw.base_roll_pct == null ? null : Math.max(100, Math.min(200, Math.floor(Number(raw.base_roll_pct || 100)))),
      growth_level: Math.max(0, Math.floor(Number(raw.growth_level || 0))),
      growth_fail_stack: Math.max(0, Math.floor(Number(raw.growth_fail_stack || 0)))
    };
  }
  return next;
}

function buildPetEquippedItemPayload(pet, slotKey) {
  if (!pet?.equipment || !slotKey) return null;
  const slot = pet.equipment[slotKey];
  if (!slot || !slot.id) return null;
  const item = buildInventoryItemPayload({ ...slot, qty: 1 });
  return { ...item, slot: slotKey };
}

function resolvePetEquipSlotForItem(pet, itemTpl) {
  if (!pet || !itemTpl?.slot) return null;
  pet.equipment = normalizePetEquipmentState(pet.equipment);
  const rawSlot = String(itemTpl.slot);
  if (rawSlot === 'ring') {
    if (!pet.equipment.ring_left) return 'ring_left';
    if (!pet.equipment.ring_right) return 'ring_right';
    return 'ring_left';
  }
  if (rawSlot === 'bracelet') {
    if (!pet.equipment.bracelet_left) return 'bracelet_left';
    if (!pet.equipment.bracelet_right) return 'bracelet_right';
    return 'bracelet_left';
  }
  if (PET_EQUIP_SLOT_KEYS.includes(rawSlot)) return rawSlot;
  return null;
}

function calcPetPower(pet) {
  if (!pet) return 0;
  const aptitude = pet.aptitude || {};
  const level = Math.max(1, Math.floor(Number(pet.level || 1)));
  const base =
    Number(aptitude.hp || 0) * PET_POWER_WEIGHTS.hp +
    Number(aptitude.atk || 0) * PET_POWER_WEIGHTS.atk +
    Number(aptitude.def || 0) * PET_POWER_WEIGHTS.def +
    Number(aptitude.mag || 0) * PET_POWER_WEIGHTS.mag +
    Number(aptitude.agility || 0) * PET_POWER_WEIGHTS.agility;
  const growth = Number(pet.growth || 1);
  const slots = Number(pet.skillSlots || PET_BASE_SKILL_SLOTS);
  const skillCount = Array.isArray(pet.skills) ? pet.skills.length : 0;
  return Math.max(
    1,
    Math.floor((base * growth + slots * PET_POWER_WEIGHTS.slot + skillCount * PET_POWER_WEIGHTS.skill) * (1 + level * PET_POWER_WEIGHTS.levelMul))
  );
}

function normalizePetTrainingRecord(record) {
  const src = record && typeof record === 'object' ? record : {};
  return {
    hp: Math.max(0, Math.floor(Number(src.hp || 0))),
    mp: Math.max(0, Math.floor(Number(src.mp || 0))),
    atk: Math.max(0, Math.floor(Number(src.atk || 0))),
    def: Math.max(0, Math.floor(Number(src.def || 0))),
    mag: Math.max(0, Math.floor(Number(src.mag || 0))),
    mdef: Math.max(0, Math.floor(Number(src.mdef || 0))),
    dex: Math.max(0, Math.floor(Number(src.dex || 0)))
  };
}

function getPetTrainingBonus(pet) {
  const training = normalizePetTrainingRecord(pet?.training);
  const perLevel = getTrainingPerLevelConfig();
  return {
    levels: training,
    hp: Number(training.hp || 0) * Number(perLevel.hp || 0),
    mp: Number(training.mp || 0) * Number(perLevel.mp || 0),
    atk: Number(training.atk || 0) * Number(perLevel.atk || 0),
    def: Number(training.def || 0) * Number(perLevel.def || 0),
    mag: Number(training.mag || 0) * Number(perLevel.mag || 0),
    mdef: Number(training.mdef || 0) * Number(perLevel.mdef || 0),
    dex: Number(training.dex || 0) * Number(perLevel.dex || 0)
  };
}

function calcPetBattlePanelDerivedStats(pet) {
  if (!pet) return { maxHp: 1, maxMp: 1, atk: 1, def: 0, mdef: 0 };
  const apt = pet.aptitude || {};
  const level = Math.max(1, Number(pet.level || 1));
  const growth = Math.max(0.8, Number(pet.growth || 1));
  const trainingBonus = getPetTrainingBonus(pet);
  const battleType = String(pet.battleType || normalizePetBattleType(pet, apt));
  const typeMul = battleType === 'magic'
    ? { hp: 0.95, mp: 1.2, atk: 0.8, def: 0.95, mdef: 1.15 }
    : battleType === 'tank'
      ? { hp: 1.2, mp: 0.8, atk: 0.8, def: 1.2, mdef: 1.0 }
      : { hp: 1.0, mp: 0.9, atk: 1.2, def: 1.0, mdef: 0.9 };
  const maxHp = Math.max(1, Math.floor((((Number(apt.hp || 0) + Number(trainingBonus.hp || 0)) * 3.8) + ((Number(apt.def || 0) + Number(trainingBonus.def || 0)) * 1.2) + level * 38) * growth * typeMul.hp));
  const maxMp = Math.max(1, Math.floor((((Number(apt.mag || 0) + Number(trainingBonus.mag || 0)) * 2.8) + level * 22) * Math.max(0.9, growth) * typeMul.mp + Number(trainingBonus.mp || 0)));
  const atk = Math.max(1, Math.floor((((Number(apt.atk || 0) + Number(trainingBonus.atk || 0) + Number(trainingBonus.dex || 0)) * 1.35) + level * 5) * growth * typeMul.atk));
  const def = Math.max(0, Math.floor((((Number(apt.def || 0) + Number(trainingBonus.def || 0)) * 1.2) + level * 4) * growth * typeMul.def));
  const mdef = Math.max(0, Math.floor(((((Number(apt.mag || 0) + Number(trainingBonus.mag || 0)) * 0.75) + ((Number(apt.def || 0) + Number(trainingBonus.def || 0)) * 0.65)) + level * 4) * growth * typeMul.mdef + Number(trainingBonus.mdef || 0)));
  return { maxHp, maxMp, atk, def, mdef };
}

function regenPetCombatMp(pet) {
  if (!pet) return 0;
  const { maxMp } = calcPetBattlePanelDerivedStats(pet);
  const now = Date.now();
  const lastAt = Number(pet.combatMpUpdatedAt || 0);
  let current = Number.isFinite(Number(pet.combatMp)) ? Number(pet.combatMp) : maxMp;
  current = Math.max(0, Math.min(maxMp, Math.floor(current)));
  if (lastAt > 0 && now > lastAt) {
    const elapsedSec = Math.floor((now - lastAt) / 1000);
    if (elapsedSec > 0) {
      const regen = elapsedSec * Math.max(8, Math.floor(maxMp * 0.03));
      current = Math.min(maxMp, current + regen);
    }
  }
  pet.combatMp = current;
  pet.combatMpUpdatedAt = now;
  return current;
}

function tryConsumePetMpForSkill(pet, skillBaseId) {
  if (!pet || !skillBaseId) return { ok: false, cost: 0, current: 0, max: 0 };
  const tier = getPetSkillTierOnPet(pet, skillBaseId);
  if (!tier) return { ok: false, cost: 0, current: 0, max: 0 };
  const { maxMp } = calcPetBattlePanelDerivedStats(pet);
  const current = regenPetCombatMp(pet);
  const cost = tier >= 2
    ? Math.max(80, Math.floor(maxMp * 0.18))
    : Math.max(45, Math.floor(maxMp * 0.1));
  if (current < cost) return { ok: false, cost, current, max: maxMp };
  pet.combatMp = Math.max(0, current - cost);
  pet.combatMpUpdatedAt = Date.now();
  return { ok: true, cost, current: pet.combatMp, max: maxMp };
}

function normalizePetState(player) {
  if (!player) return null;
  if (!player.flags) player.flags = {};
  if (!player.flags.pet || typeof player.flags.pet !== 'object') {
    player.flags.pet = {};
  }
  const state = player.flags.pet;
  if (!Array.isArray(state.pets)) state.pets = [];
  if (!state.books || typeof state.books !== 'object') state.books = {};

  state.pets = state.pets
    .filter((pet) => pet && typeof pet === 'object')
    .map((pet) => {
      const playerLevel = Math.max(1, Math.floor(Number(player.level || 1)));
      const petLevelCap = getPetLevelCap(player);
      const id = String(pet.id || `pet_${Date.now()}_${randInt(100, 999)}`);
      const rarity = PET_RARITY_ORDER.includes(String(pet.rarity || '').trim())
        ? String(pet.rarity || '').trim()
        : 'normal';
      const speciesPool = PET_SPECIES_BY_RARITY[rarity] || PET_SPECIES_BY_RARITY.normal;
    const roleRaw = String(pet.role || speciesPool[randInt(0, speciesPool.length - 1)]);
    const mappedRole = PET_SPECIES_NAME_MAP[roleRaw] || roleRaw;
    let name = String(pet.name || roleRaw).slice(0, 24);
    if (PET_SPECIES_NAME_MAP[roleRaw] && name.startsWith(roleRaw)) {
      const suffix = name.slice(roleRaw.length);
      if (/^\d*$/.test(suffix)) {
        name = `${PET_SPECIES_NAME_MAP[roleRaw]}${suffix}`;
      }
    }
      const divineCfg = getDivineBeastConfigBySpecies(mappedRole);
      const divineAdvanceCount = Math.max(0, Math.floor(Number(pet.divineAdvanceCount || 0)));
      const growthRange = PET_RARITY_GROWTH_RANGE[rarity] || PET_RARITY_GROWTH_RANGE.normal;
      const growthRaw = Number(pet.growth || growthRange[0]);
      const growth = divineCfg
        ? Math.max(growthRange[0], Number(growthRaw.toFixed(3)))
        : Math.max(growthRange[0], Math.min(growthRange[1], Number(growthRaw.toFixed(3))));
      const aptitudeRaw = pet.aptitude && typeof pet.aptitude === 'object' ? pet.aptitude : {};
      const aptRange = PET_RARITY_APTITUDE_RANGE[rarity] || PET_RARITY_APTITUDE_RANGE.normal;
      const aptitude = {
        hp: divineCfg
          ? Math.max(aptRange.hp[0], Math.floor(Number(aptitudeRaw.hp || aptRange.hp[0])))
          : Math.max(aptRange.hp[0], Math.min(aptRange.hp[1], Math.floor(Number(aptitudeRaw.hp || aptRange.hp[0])))),
        atk: divineCfg
          ? Math.max(aptRange.atk[0], Math.floor(Number(aptitudeRaw.atk || aptRange.atk[0])))
          : Math.max(aptRange.atk[0], Math.min(aptRange.atk[1], Math.floor(Number(aptitudeRaw.atk || aptRange.atk[0])))),
        def: divineCfg
          ? Math.max(aptRange.def[0], Math.floor(Number(aptitudeRaw.def || aptRange.def[0])))
          : Math.max(aptRange.def[0], Math.min(aptRange.def[1], Math.floor(Number(aptitudeRaw.def || aptRange.def[0])))),
        mag: divineCfg
          ? Math.max(aptRange.mag[0], Math.floor(Number(aptitudeRaw.mag || aptRange.mag[0])))
          : Math.max(aptRange.mag[0], Math.min(aptRange.mag[1], Math.floor(Number(aptitudeRaw.mag || aptRange.mag[0])))),
        agility: divineCfg
          ? Math.max(aptRange.agility[0], Math.floor(Number(aptitudeRaw.agility || aptRange.agility[0])))
          : Math.max(aptRange.agility[0], Math.min(aptRange.agility[1], Math.floor(Number(aptitudeRaw.agility || aptRange.agility[0]))))
      };
      const battleType = normalizePetBattleType(pet, aptitude);
      const skillSlots = divineCfg
        ? Math.max(PET_BASE_SKILL_SLOTS, Math.floor(Number(pet.skillSlots || PET_BASE_SKILL_SLOTS)))
        : Math.max(PET_BASE_SKILL_SLOTS, Math.min(PET_MAX_SKILL_SLOTS, Math.floor(Number(pet.skillSlots || PET_BASE_SKILL_SLOTS))));
      const rawSkills = Array.isArray(pet.skills) ? pet.skills : [];
      let skills = Array.from(new Set(rawSkills.map((idValue) => String(idValue || '').trim()).filter(Boolean)))
        .filter((skillId) => Boolean(getPetSkillDef(skillId)))
        .slice(0, skillSlots);
      const divineExclusiveSkillId = getDivineBeastExclusiveSkillBySpecies(mappedRole);
      if (divineExclusiveSkillId && Boolean(getPetSkillDef(divineExclusiveSkillId)) && !skills.includes(divineExclusiveSkillId)) {
        const nextSkills = [divineExclusiveSkillId, ...skills.filter((id) => id !== divineExclusiveSkillId)];
        while (nextSkills.length > skillSlots) {
          const removableIndex = nextSkills.findIndex((id, idx) => idx > 0 && !isPetLockedSkill(id));
          if (removableIndex > 0) nextSkills.splice(removableIndex, 1);
          else nextSkills.pop();
        }
        skills = nextSkills;
      }
      const equipment = normalizePetEquipmentState(pet.equipment);
      const training = normalizePetTrainingRecord(pet.training);
      const levelRaw = Math.floor(Number(pet.level || playerLevel));
      const level = Math.max(1, Math.min(petLevelCap, Number.isFinite(levelRaw) ? levelRaw : playerLevel));
      const expNeed = getPetLevelExpNeed(level);
      const exp = level >= petLevelCap ? 0 : Math.max(0, Math.min(expNeed - 1, Math.floor(Number(pet.exp || 0))));
      const panelStats = calcPetBattlePanelDerivedStats({ battleType, aptitude, growth, level });
      const rawCombatMp = Number(pet.combatMp);
      const combatMp = Number.isFinite(rawCombatMp)
        ? Math.max(0, Math.min(panelStats.maxMp, Math.floor(rawCombatMp)))
        : panelStats.maxMp;
      const combatMpUpdatedAt = Math.max(0, Math.floor(Number(pet.combatMpUpdatedAt || 0)));
      return {
        id,
        rarity,
        level,
        exp,
        name,
        role: mappedRole,
        battleType,
        growth,
        aptitude,
        skillSlots,
        divineAdvanceCount,
        skills,
        training,
        equipment,
        combatMp,
        combatMpUpdatedAt
      };
    });

  if (!state.activePetId || !state.pets.some((pet) => pet.id === state.activePetId)) {
    state.activePetId = null;
  }

  Object.keys(state.books).forEach((bookId) => {
    const qty = Math.max(0, Math.floor(Number(state.books[bookId] || 0)));
    if (!qty) delete state.books[bookId];
    else state.books[bookId] = qty;
  });

  return state;
}

function pickPetDropRarity(maxRarity) {
  const maxIndex = PET_RARITY_ORDER.indexOf(maxRarity);
  if (maxIndex < 0) return null;
  const candidates = PET_RARITY_ORDER.slice(0, maxIndex + 1);
  const weights = candidates.map((rarity) => Number(PET_DROP_RARITY_WEIGHTS[rarity] || 0));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function getPetDropMaxRarityForBoss(mobTemplate) {
  if (!mobTemplate || !isBossMob(mobTemplate)) return null;
  if (mobTemplate.id === 'vip_personal_boss') return 'excellent';
  if (mobTemplate.id === 'svip_personal_boss') return 'rare';
  if (mobTemplate.id && String(mobTemplate.id).startsWith('cultivation_boss_')) return 'rare';
  if (mobTemplate.allowUltimateDrop || mobTemplate.id === 'cross_world_boss') return 'ultimate';
  if (mobTemplate.worldBoss) return 'supreme';
  if (mobTemplate.specialBoss) return 'legendary';
  return 'epic';
}

function createRandomPet(rarity = 'normal', options = {}) {
  const safeRarity = PET_RARITY_ORDER.includes(rarity) ? rarity : 'normal';
  const excludedSpecies = options?.excludeSpecies instanceof Set ? options.excludeSpecies : null;
  const fixedSpecies = String(options?.fixedSpecies || '').trim();
  const rawSpeciesPool = PET_SPECIES_BY_RARITY[safeRarity] || PET_SPECIES_BY_RARITY.normal;
  const speciesPool = excludedSpecies
    ? rawSpeciesPool.filter((name) => !excludedSpecies.has(String(name || '').trim()))
    : rawSpeciesPool;
  const role = fixedSpecies || (speciesPool.length ? speciesPool[randInt(0, speciesPool.length - 1)] : '');
  if (!role) return null;
  const growthRange = PET_RARITY_GROWTH_RANGE[safeRarity] || PET_RARITY_GROWTH_RANGE.normal;
  const divineCfg = getDivineBeastConfigBySpecies(role);
  const isDivineBeast = Boolean(divineCfg);
  const growth = isDivineBeast
    ? Number((growthRange[1] || 1.95).toFixed(3))
    : Number((growthRange[0] + Math.random() * (growthRange[1] - growthRange[0])).toFixed(3));
  const availableGrades = new Set(PET_AVAILABLE_GRADES_BY_RARITY[safeRarity] || PET_AVAILABLE_GRADES_BY_RARITY.normal || ['normal']);
  const skillPool = PET_SKILL_LIBRARY.filter((skill) => availableGrades.has(skill.grade));
  const normalSkills = PET_SKILL_LIBRARY.filter((skill) => skill.grade === 'normal');
  const minOpen = Number(PET_OPEN_SKILL_MIN_BY_RARITY[safeRarity] ?? PET_OPEN_SKILL_MIN_BY_RARITY.normal ?? 1);
  const maxOpen = Number(PET_OPEN_SKILL_MAX_BY_RARITY[safeRarity] ?? PET_OPEN_SKILL_MAX_BY_RARITY.normal ?? 3);
  let skillSlots = PET_BASE_SKILL_SLOTS;
  let skills = [];
  if (isDivineBeast) {
    skillSlots = Math.max(6, PET_BASE_SKILL_SLOTS);
    skills = [
      divineCfg?.skillId,
      ...DIVINE_BEAST_SHARED_SKILLS
    ].filter((id) => Boolean(getPetSkillDef(id)));
  } else {
    const openSkillCount = Math.min(PET_BASE_SKILL_SLOTS, randInt(minOpen, maxOpen));
    skills = [];
    while (skills.length < openSkillCount && skillPool.length > 0) {
      const pick = skillPool[randInt(0, skillPool.length - 1)];
      if (!skills.includes(pick.id)) skills.push(pick.id);
    }
    if (skills.length === 0 && normalSkills.length > 0) {
      skills.push(normalSkills[randInt(0, normalSkills.length - 1)].id);
    }
  }
  const aptRange = PET_RARITY_APTITUDE_RANGE[safeRarity] || PET_RARITY_APTITUDE_RANGE.normal;
  const battleTypes = ['physical', 'magic', 'tank'];
  const battleType = isDivineBeast ? 'tank' : battleTypes[randInt(0, battleTypes.length - 1)];
  let aptitude = rollPetAptitudeByBattleType(aptRange, battleType);
  if (isDivineBeast) {
    aptitude = {
      hp: Math.floor(Number(aptRange.hp?.[1] || aptitude.hp || 0)),
      atk: Math.floor(Number(aptRange.atk?.[1] || aptitude.atk || 0)),
      def: Math.floor(Number(aptRange.def?.[1] || aptitude.def || 0)),
      mag: Math.floor(Number(aptRange.mag?.[1] || aptitude.mag || 0)),
      agility: Math.floor(Number(aptRange.agility?.[1] || aptitude.agility || 0))
    };
  }
  return {
    id: `pet_${Date.now()}_${randInt(100, 999)}`,
    rarity: safeRarity,
    level: 1,
    exp: 0,
    name: isDivineBeast ? role : `${role}${randInt(1, 99)}`,
    role,
    battleType,
    growth,
    aptitude,
    skillSlots,
    skills
  };
}

function rollPetDropForBoss(mobTemplate, bonus = 1) {
  const maxRarity = getPetDropMaxRarityForBoss(mobTemplate);
  if (!maxRarity) return null;
  const baseChance = Number(PET_DROP_BASE_CHANCE_BY_CAP[maxRarity] || 0.05);
  const chance = Math.max(0, Math.min(PET_DROP_MAX_CHANCE, baseChance * Math.max(PET_DROP_BONUS_MIN, Number(bonus || 1))));
  if (Math.random() > chance) return null;
  const rarity = pickPetDropRarity(maxRarity);
  return rarity ? createRandomPet(rarity, { excludeSpecies: PET_NON_DROPPABLE_SPECIES }) : null;
}

function rollWillowDewDropForBoss(mobTemplate, bonus = 1) {
  if (!mobTemplate || !mobTemplate.isBoss) return false;
  // 金柳露掉落概率，受加成影响
  const chance = Math.max(0, Math.min(PET_WILLOW_DEW_MAX_CHANCE, PET_WILLOW_DEW_BASE_CHANCE * Math.max(PET_WILLOW_DEW_BONUS_MIN, Number(bonus || 1))));
  return Math.random() < chance;
}

function rollPetBookDropsForBoss(mobTemplate, bonus = 1) {
  const maxRarity = getPetDropMaxRarityForBoss(mobTemplate);
  if (!maxRarity) return [];
  const lowBooks = PET_BOOK_LIBRARY.filter((book) => book.tier === 'low');
  const highBooks = PET_BOOK_LIBRARY.filter((book) => book.tier !== 'low');
  if (!lowBooks.length && !highBooks.length) return [];

  const baseChance = Number(PET_BOOK_BASE_CHANCE_BY_CAP[maxRarity] || 0.2);
  const chance = Math.max(0, Math.min(PET_BOOK_MAX_CHANCE, baseChance * Math.max(PET_DROP_BONUS_MIN, Number(bonus || 1))));
  if (Math.random() > chance) return [];

  const pickPool = () => {
    const isSpecialBoss = Boolean(mobTemplate && mobTemplate.specialBoss);
    const isVipBoss = mobTemplate.id === 'vip_personal_boss';
    const isSvipBoss = mobTemplate.id === 'svip_personal_boss';
    const isCultivationBoss = mobTemplate.id && String(mobTemplate.id).startsWith('cultivation_boss_');
    if (!isSpecialBoss && !isVipBoss && !isSvipBoss && !isCultivationBoss) {
      return lowBooks;
    }
    if (!highBooks.length) return lowBooks;
    const highChance = Number(PET_BOOK_HIGH_CHANCE_BY_CAP[maxRarity] || 0);
    return Math.random() < highChance ? highBooks : lowBooks;
  };

  const results = [];
  const firstPool = pickPool();
  if (firstPool.length) {
    const first = firstPool[randInt(0, firstPool.length - 1)];
    results.push({ bookId: first.id, qty: 1 });
  }
  const isSpecialBoss = Boolean(mobTemplate && mobTemplate.specialBoss);
  const canSecondDrop = PET_BOOK_SECOND_ELIGIBLE_RARITIES.includes(maxRarity)
    && (!PET_BOOK_SECOND_REQUIRE_SPECIAL_BOSS || isSpecialBoss);
  if (canSecondDrop && Math.random() < PET_BOOK_SECOND_DROP_CHANCE) {
    const secondPool = pickPool();
    if (secondPool.length) {
      const second = secondPool[randInt(0, secondPool.length - 1)];
      const existing = results.find((entry) => entry.bookId === second.id);
      if (existing) existing.qty += 1;
      else results.push({ bookId: second.id, qty: 1 });
    }
  }
  return results;
}

function grantPetDropToPlayer(player, pet, mobTemplate) {
  if (!player || !pet) return false;
  const playerLevel = Math.max(1, Math.floor(Number(player.level || 1)));
  const petLevelCap = getPetLevelCap(player);
  const petLevelRaw = Math.floor(Number(pet.level || playerLevel));
  pet.level = Math.max(1, Math.min(petLevelCap, Number.isFinite(petLevelRaw) ? petLevelRaw : playerLevel));
  pet.exp = Math.max(0, Math.floor(Number(pet.exp || 0)));
  const petState = normalizePetState(player);
  if (!petState) return false;
  petState.pets.push(pet);
  if (!petState.activePetId) petState.activePetId = pet.id;
  player.send(`宠物掉落：[${PET_RARITY_LABELS[pet.rarity] || PET_RARITY_LABELS.normal}] ${pet.name}（成长 ${pet.growth.toFixed(3)}）。`);
  logLoot(`[loot][pet] ${player.name} <- ${pet.rarity}:${pet.role} (${mobTemplate?.id || 'unknown'})`);
  return true;
}

function learnPetSkill(pet, skillId, allowReplace = true) {
  if (!pet || !skillId) return { ok: false, reason: 'invalid' };
  const skills = Array.isArray(pet.skills) ? pet.skills : [];
  if (skills.includes(skillId)) return { ok: false, reason: 'exists' };
  if (skills.length < pet.skillSlots) {
    pet.skills = [...skills, skillId];
    return { ok: true, replaced: null };
  }
  if (!allowReplace || skills.length === 0) return { ok: false, reason: 'full' };
  const replaceableIndices = skills
    .map((id, idx) => ({ id, idx }))
    .filter((entry) => !isPetLockedSkill(entry.id))
    .map((entry) => entry.idx);
  if (!replaceableIndices.length) return { ok: false, reason: 'locked_only' };
  const idx = replaceableIndices[randInt(0, replaceableIndices.length - 1)];
  const replaced = skills[idx];
  const next = skills.slice();
  next[idx] = skillId;
  pet.skills = next;
  return { ok: true, replaced };
}

function tryAutoComprehendOnLevelUp(pet) {
  if (!pet) return null;
  const skillCap = Math.min(
    PET_COMPREHEND_MAX_SKILLS,
    Math.max(PET_BASE_SKILL_SLOTS, Number(pet.skillSlots || PET_BASE_SKILL_SLOTS))
  );
  if ((pet.skills || []).length >= skillCap) return null;
  const safeRarity = PET_RARITY_ORDER.includes(String(pet.rarity || '')) ? String(pet.rarity) : 'normal';
  const chance = Number(PET_AUTO_COMPREHEND_CHANCE[safeRarity] || PET_AUTO_COMPREHEND_CHANCE.normal || 0);
  if (Math.random() > chance) return null;
  const rarityIndex = PET_RARITY_ORDER.indexOf(safeRarity);
  const canAdvanced = rarityIndex >= PET_RARITY_ORDER.indexOf('rare');
  const canSpecial = rarityIndex >= PET_RARITY_ORDER.indexOf('legendary');
  const pool = PET_SKILL_LIBRARY.filter((skill) => {
    if ((pet.skills || []).includes(skill.id)) return false;
    if (skill.grade === 'normal') return true;
    if (skill.grade === 'advanced') return canAdvanced;
    return canSpecial;
  });
  if (!pool.length) return null;
  const pick = pool[randInt(0, pool.length - 1)];
  const learned = learnPetSkill(pet, pick.id, false);
  if (!learned.ok) return null;
  return pick;
}

function gainActivePetExp(player, expGain) {
  if (!player) return { leveled: 0, gained: 0, pet: null, autoLearned: [] };
  const state = normalizePetState(player);
  if (!state?.activePetId) return { leveled: 0, gained: 0, pet: null, autoLearned: [] };
  const pet = state.pets.find((entry) => entry.id === state.activePetId);
  if (!pet) return { leveled: 0, gained: 0, pet: null, autoLearned: [] };
  const cap = getPetLevelCap(player);
  pet.level = Math.max(1, Math.min(cap, Math.floor(Number(pet.level || 1))));
  pet.exp = Math.max(0, Math.floor(Number(pet.exp || 0)));
  let pending = Math.max(0, Math.floor(Number(expGain || 0)));
  const totalGain = pending;
  let leveled = 0;
  const autoLearned = [];
  while (pending > 0 && pet.level < cap) {
    const need = getPetLevelExpNeed(pet.level);
    const missing = Math.max(1, need - pet.exp);
    if (pending >= missing) {
      pending -= missing;
      pet.level += 1;
      pet.exp = 0;
      leveled += 1;
      const learnedSkill = tryAutoComprehendOnLevelUp(pet);
      if (learnedSkill) autoLearned.push(learnedSkill);
    } else {
      pet.exp += pending;
      pending = 0;
    }
  }
  if (pet.level >= cap) {
    pet.level = cap;
    pet.exp = 0;
  }
  return { leveled, gained: totalGain, pet, autoLearned };
}

// 宠物状态缓存
const petStateCache = new WeakMap();
const PET_STATE_CACHE_TTL = 200; // 200ms缓存

function buildPetStatePayload(player) {
  // 检查缓存
  const now = Date.now();
  const cached = petStateCache.get(player);
  if (cached && now - cached.at < PET_STATE_CACHE_TTL) {
    return cached.data;
  }
  
  const state = normalizePetState(player);
  const levelCap = getPetLevelCap(player); // 只计算一次
  
  const pets = (state?.pets || []).map((pet) => {
    const petLevel = Math.max(1, Math.floor(Number(pet.level || 1)));
    const petSkills = pet.skills || [];
    return {
      training: normalizePetTrainingRecord(pet.training),
      id: pet.id,
      rarity: pet.rarity || 'normal',
      rarityLabel: PET_RARITY_LABELS[pet.rarity] || PET_RARITY_LABELS.normal,
      level: petLevel,
      levelCap,
      exp: Math.max(0, Math.floor(Number(pet.exp || 0))),
      expNeed: getPetLevelExpNeed(petLevel),
      name: pet.name,
      role: pet.role,
      battleType: pet.battleType || normalizePetBattleType(pet, pet.aptitude),
      growth: pet.growth,
      aptitude: pet.aptitude,
      skillSlots: pet.skillSlots,
      divineAdvanceCount: Math.max(0, Math.floor(Number(pet.divineAdvanceCount || 0))),
      isDivineBeast: isDivineBeastSpecies(pet.role),
      skills: petSkills,
      skillTiers: petSkills.map((skillId) => getPetSkillTier(skillId)),
      skillNames: petSkills.map((skillId) => getPetSkillDef(skillId)?.name || skillId),
      skillEffects: petSkills.map((skillId) => PET_SKILL_EFFECTS[skillId] || ''),
      combatMp: Math.max(0, Math.floor(Number(pet.combatMp || 0))),
      equippedItems: PET_EQUIP_SLOT_KEYS
        .map((slotKey) => buildPetEquippedItemPayload(pet, slotKey))
        .filter(Boolean),
      power: calcPetPower(pet)
    };
  });
  
  const books = PET_BOOK_LIBRARY
    .map((book) => ({
      id: book.id,
      name: book.name,
      skillId: book.skillId,
      skillName: book.skillName,
      tier: book.tier || 'low',
      effect: PET_SKILL_EFFECTS[book.skillId] || '',
      qty: Math.max(0, Math.floor(Number(state?.books?.[book.id] || 0))),
      priceGold: book.priceGold
    }))
    .filter((book) => book.qty > 0);
    
  const result = {
    maxOwned: PET_MAX_OWNED,
    captureCostGold: 0,
    comprehendCostGold: PET_COMPREHEND_COST_GOLD,
    synthesisCostGold: PET_SYNTHESIS_COST_GOLD,
    activePetId: state?.activePetId || null,
    pets,
    books
  };
  
  // 存入缓存
  petStateCache.set(player, { at: now, data: result });
  return result;
}

function attachGuildMeta(player, guild, role = 'member') {
  if (!player || !guild) return null;
  const building = buildGuildBuildingPayload(guild);
  player.guild = {
    id: guild.id,
    name: guild.name,
    role,
    buildExp: building.exp,
    buildGold: building.gold,
    buildPoints: building.points,
    buildLevel: building.level,
    buildBranchLevels: Array.isArray(building.branches)
      ? Object.fromEntries(building.branches.map((branch) => [branch.id, branch.level]))
      : {},
    buildMemberLimit: building.memberLimit,
    buildExpBonusPct: building.expBonusPct,
    buildGoldBonusPct: building.goldBonusPct,
    buildHpBonusPct: building.hpBonusPct,
    buildAtkBonusPct: building.atkBonusPct,
    buildMagBonusPct: building.magBonusPct,
    buildSpiritBonusPct: building.spiritBonusPct,
    buildDefBonusPct: building.defBonusPct,
    buildMdefBonusPct: building.mdefBonusPct,
    buildRewardBonusPct: building.rewardBonusPct,
    buildBattleBonusPct: building.battleBonusPct,
    buildUpgradeStartedAt: building.upgradeStartedAt || null,
    buildUpgradeEndsAt: building.upgradeEndsAt || null,
    buildUpgradeBranch: building.activeUpgradeBranch || null
  };
  return building;
}

function syncGuildMetaToOnlineMembers(guildId, building) {
  if (!guildId || !building) return;
  players.forEach((onlinePlayer) => {
    if (!onlinePlayer?.guild || String(onlinePlayer.guild.id) !== String(guildId)) return;
    onlinePlayer.guild.buildExp = building.exp;
    onlinePlayer.guild.buildGold = building.gold;
    onlinePlayer.guild.buildPoints = building.points;
    onlinePlayer.guild.buildLevel = building.level;
    onlinePlayer.guild.buildBranchLevels = Array.isArray(building.branches)
      ? Object.fromEntries(building.branches.map((branch) => [branch.id, branch.level]))
      : {};
    onlinePlayer.guild.buildMemberLimit = building.memberLimit;
    onlinePlayer.guild.buildExpBonusPct = building.expBonusPct;
    onlinePlayer.guild.buildGoldBonusPct = building.goldBonusPct;
    onlinePlayer.guild.buildHpBonusPct = building.hpBonusPct;
    onlinePlayer.guild.buildAtkBonusPct = building.atkBonusPct;
    onlinePlayer.guild.buildMagBonusPct = building.magBonusPct;
    onlinePlayer.guild.buildSpiritBonusPct = building.spiritBonusPct;
    onlinePlayer.guild.buildDefBonusPct = building.defBonusPct;
    onlinePlayer.guild.buildMdefBonusPct = building.mdefBonusPct;
    onlinePlayer.guild.buildRewardBonusPct = building.rewardBonusPct;
    onlinePlayer.guild.buildBattleBonusPct = building.battleBonusPct;
    onlinePlayer.guild.buildUpgradeStartedAt = building.upgradeStartedAt || null;
    onlinePlayer.guild.buildUpgradeEndsAt = building.upgradeEndsAt || null;
    onlinePlayer.guild.buildUpgradeBranch = building.activeUpgradeBranch || null;
    computeDerived(onlinePlayer);
    onlinePlayer.forceStateRefresh = true;
  });
}

function normalizeGuildDonateDailyState(player, now = Date.now()) {
  if (!player?.flags) player.flags = {};
  const t = getChinaDateParts(now);
  const todayKey = String(t.dateKey || '');
  const current = player.flags.guildDonateDaily;
  if (!current || typeof current !== 'object' || current.dateKey !== todayKey) {
    player.flags.guildDonateDaily = {
      dateKey: todayKey,
      goldCount: 0,
      pointsCount: 0
    };
  }
  return player.flags.guildDonateDaily;
}

function getGuildDonateDailyInfo(player, now = Date.now()) {
  const guildConfig = getGuildSystemConfigSnapshot();
  const state = normalizeGuildDonateDailyState(player, now);
  const goldCount = Math.max(0, Math.floor(Number(state.goldCount || 0)));
  const pointsCount = Math.max(0, Math.floor(Number(state.pointsCount || 0)));
  const goldLimit = Math.max(0, Math.floor(Number(guildConfig.donateLimits?.gold || 0)));
  const pointsLimit = Math.max(0, Math.floor(Number(guildConfig.donateLimits?.points || 0)));
  return {
    dateKey: state.dateKey,
    gold: {
      limit: goldLimit,
      used: goldCount,
      remaining: Math.max(0, goldLimit - goldCount)
    },
    points: {
      limit: pointsLimit,
      used: pointsCount,
      remaining: Math.max(0, pointsLimit - pointsCount)
    }
  };
}

function normalizeGuildContribution(player) {
  if (!player?.flags) player.flags = {};
  const value = Math.max(0, Math.floor(Number(player.flags.guildContribution || 0)));
  player.flags.guildContribution = value;
  return value;
}

async function buildState(player) {
  normalizeVipStatus(player);
  normalizeSvipStatus(player);
  // 行会建筑升级检查：如果升级时间已到，触发完成升级并同步状态
  if (player.guild?.id && player.guild.buildUpgradeEndsAt && Number(player.guild.buildUpgradeEndsAt) <= Date.now()) {
    try {
      const refreshedGuildBuilding = await getGuildBuildingInfo(player.guild.id);
      if (refreshedGuildBuilding) {
        syncGuildMetaToOnlineMembers(player.guild.id, refreshedGuildBuilding);
        // 升级完成后立即刷新玩家状态
        player.forceStateRefresh = true;
      }
    } catch (err) {
      // 静默处理错误，不影响主流程
    }
  }
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
    roomPlayers = getCachedRoomPlayers(roomRealmId, player.position.zone, player.position.room);
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
  // 技能列表缓存
  const skillsCacheKey = 'skills';
  let skills = player._stateCache?.[skillsCacheKey];
  if (!skills || !player._stateCache?._at || Date.now() - player._stateCache._at > 500) {
    player._stateCache = { _at: Date.now() };
    skills = getLearnedSkills(player).map((s) => {
      const mastery = player.flags?.skillMastery?.[s.id];
      return {
        id: s.id,
        name: s.name,
        mp: s.mp,
        type: s.type,
        effect: s.effect || '',
        level: getSkillLevel(player, s.id),
        exp: mastery?.exp || 0,
        expNext: mastery?.level ? SKILL_MASTERY_LEVELS[mastery.level] : SKILL_MASTERY_LEVELS[1]
      };
    });
    player._stateCache[skillsCacheKey] = skills;
  }
  // 物品列表缓存（使用inventory的引用作为缓存键）
  const itemsCacheKey = `items_${player.inventory?.length || 0}`;
  let items = player._stateCache?.[itemsCacheKey];
  if (!items) {
    items = player.inventory.map((i) => buildInventoryItemPayload(i));
    player._stateCache[itemsCacheKey] = items;
  }
  
  // 仓库列表缓存
  const warehouseCacheKey = `warehouse_${player.warehouse?.length || 0}`;
  let warehouse = player._stateCache?.[warehouseCacheKey];
  if (!warehouse) {
    warehouse = (player.warehouse || []).map((i) => buildInventoryItemPayload(i));
    player._stateCache[warehouseCacheKey] = warehouse;
  }
  
  // 装备列表缓存
  const equipmentEntries = Object.entries(player.equipment || {}).filter(([, equipped]) => equipped && equipped.id);
  const equipmentCacheKey = `equip_${equipmentEntries.map(([, e]) => `${e.id}_${e.durability}_${e.refine_level}`).join('_')}`;
  let equipment = player._stateCache?.[equipmentCacheKey];
  if (!equipment) {
    equipment = equipmentEntries.map(([slot, equipped]) => ({
      slot,
      durability: equipped.durability ?? null,
      max_durability: equipped.max_durability ?? null,
      refine_level: equipped.refine_level || 0,
      base_roll_pct: equipped.base_roll_pct ?? null,
      growth_level: Math.max(0, Math.floor(Number(equipped.growth_level || 0))),
      growth_fail_stack: Math.max(0, Math.floor(Number(equipped.growth_fail_stack || 0))),
      item: buildItemView(
        equipped.id,
        equipped.effects || null,
        equipped.durability ?? null,
        equipped.max_durability ?? null,
        equipped.refine_level || 0,
        equipped.base_roll_pct ?? null,
        equipped.growth_level ?? 0,
        equipped.growth_fail_stack ?? 0
      )
    }));
    player._stateCache[equipmentCacheKey] = equipment;
  }
  const party = getPartyByMember(player.name, realmId);
  const partyMembers = party
    ? party.members.map((name) => ({
        name,
        online: Boolean(playersByName(name, realmId)),
        managed: isManagedHostedPlayer(playersByName(name, realmId))
      }))
    : null;
  const guildBonus = Boolean(player.guild);
  const onlineCount = listOnlinePlayers(realmId).length;
  const dailyLuckyInfo = await getDailyLuckyInfoCached(realmId);
  const zhuxianTowerProgress = normalizeZhuxianTowerProgress(player);
  const zhuxianTowerRankTop10 = await getZhuxianTowerRankTop10Cached(realmId);
  // 法宝状态缓存
  const treasureCacheKey = `treasure_${(player.flags?.treasure?.equipped || []).join('_')}`;
  let treasureState, treasureEquipped, treasureRandomAttrTotal;
  const cachedTreasure = player._stateCache?.[treasureCacheKey];
  if (cachedTreasure) {
    treasureState = cachedTreasure.state;
    treasureEquipped = cachedTreasure.equipped;
    treasureRandomAttrTotal = cachedTreasure.randomAttrTotal;
  } else {
    treasureState = normalizeTreasureState(player);
    treasureEquipped = (treasureState.equipped || []).map((id, index) => {
      const def = getTreasureDef(id);
      const advanceCount = getTreasureAdvanceCount(player, id);
      const randomAttr = getTreasureRandomAttrById(player, id);
      return {
        slot: index + 1,
        id,
        name: def?.name || id,
        level: getTreasureLevel(player, id),
        advanceCount,
        stage: getTreasureStageByAdvanceCount(advanceCount),
        effectBonusPct: Math.max(0, Number((advanceCount * TREASURE_ADVANCE_EFFECT_BONUS_PER_STACK * 100).toFixed(1))),
        randomAttr
      };
    });
    treasureRandomAttrTotal = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
    treasureEquipped.forEach((entry) => {
      const attrs = entry.randomAttr || {};
      Object.keys(treasureRandomAttrTotal).forEach((key) => {
        treasureRandomAttrTotal[key] += Math.max(0, Math.floor(Number(attrs[key] || 0)));
      });
    });
    player._stateCache[treasureCacheKey] = { state: treasureState, equipped: treasureEquipped, randomAttrTotal: treasureRandomAttrTotal };
  }
  const treasureExpMaterial = Math.floor((player.inventory || []).find((slot) => slot.id === TREASURE_EXP_ITEM_ID)?.qty || 0);
  
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
  const guildBuilding = player.guild
    ? buildGuildBuildingPayload({
        id: player.guild.id,
        build_exp: player.guild.buildExp || 0,
        build_gold: player.guild.buildGold || 0,
        build_points: player.guild.buildPoints || 0,
        build_branch_levels: player.guild.buildBranchLevels || null,
        build_upgrade_started_at: player.guild.buildUpgradeStartedAt || null,
        build_upgrade_ends_at: player.guild.buildUpgradeEndsAt || null,
        build_upgrade_branch: player.guild.buildUpgradeBranch || null
      })
    : null;
  const guildDonateDaily = player.guild ? getGuildDonateDailyInfo(player) : null;
  const guildSystemConfig = getGuildSystemConfigSnapshot();
  const bonusBreakdown = buildRewardBonusBreakdown(player, party);

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
      guild_build_level: guildBuilding?.level || 0,
      guild_build_reward_bonus_pct: guildBuilding?.rewardBonusPct || 0,
      guild_build_battle_bonus_pct: guildBuilding?.battleBonusPct || 0,
      guild_build_hp_bonus_pct: guildBuilding?.hpBonusPct || 0,
      set_bonus: Boolean(player.flags?.setBonusActive),
      exp_bonus_pct: bonusBreakdown.expPct,
      gold_bonus_pct: bonusBreakdown.goldPct,
      exp_bonus_sources: bonusBreakdown.expSources,
      gold_bonus_sources: bonusBreakdown.goldSources,
      exp_gold_bonus_pct: Math.max(bonusBreakdown.expPct, bonusBreakdown.goldPct)
    },
    summon: summonPayloads[0] || null,
    summons: summonPayloads,
    equipment,
    warehouse,
    guild: player.guild?.name || null,
    guild_role: player.guild?.role || null,
    guild_contribution: normalizeGuildContribution(player),
    guild_system: {
      donateCost: { ...guildSystemConfig.donateCost },
      contributionGain: { ...guildSystemConfig.contributionGain }
    },
    guild_shop_items: guildSystemConfig.shopItems.map((item) => ({ ...item })),
    guild_building: guildBuilding
      ? {
          ...guildBuilding,
          donationLimits: guildDonateDaily
        }
      : null,
    party: party ? { size: party.members.length, leader: party.leader, members: partyMembers } : null,
    training: player.flags?.training || { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 },
    online: { count: onlineCount },
    daily_lucky: dailyLuckyInfo,
    activities: getActivityStatePayload(player),
    zhuxian_tower: {
      highestClearedFloor: Math.max(0, Math.floor(Number(zhuxianTowerProgress.highestClearedFloor || 0))),
      currentChallengeFloor: Math.max(1, Math.floor(Number(zhuxianTowerProgress.highestClearedFloor || 0)) + 1),
      bestFloor: Math.max(0, Math.floor(Number(zhuxianTowerProgress.bestFloor || 0)))
    },
    zhuxian_tower_rank_top10: zhuxianTowerRankTop10,
    treasure: {
      slotCount: TREASURE_SLOT_COUNT,
      maxLevel: TREASURE_MAX_LEVEL,
      upgradeConsume: TREASURE_UPGRADE_CONSUME,
      advanceConsume: TREASURE_ADVANCE_CONSUME,
      advancePerStage: TREASURE_ADVANCE_PER_STAGE,
      worldBossDropMultiplier: TREASURE_WORLD_BOSS_DROP_MULTIPLIER,
      crossWorldBossDropMultiplier: TREASURE_CROSS_WORLD_BOSS_DROP_MULTIPLIER,
      towerXuanmingDropChance: TREASURE_TOWER_XUANMING_DROP_CHANCE,
      equipped: treasureEquipped,
      expMaterial: treasureExpMaterial,
      randomAttr: treasureRandomAttrTotal
    },
    pet: buildPetStatePayload(player),
    specialization: (() => {
      // 专精状态缓存
      const specCacheKey = `spec_${player.classId}_${player.level}_${player.flags?.specialization?.trackId || ''}`;
      let spec = player._stateCache?.[specCacheKey];
      if (!spec) {
        spec = buildSpecializationPayload(player);
        player._stateCache[specCacheKey] = spec;
      }
      return spec;
    })(),
    anti: {
      key: player.socket?.data?.antiKey || null,
      seq: player.socket?.data?.antiSeq || 0
    },
    trade: (() => {
      const tradeResult = getTradeByPlayerAny(player.name, realmId);
      if (!tradeResult.trade) return null;
      const trade = tradeResult.trade;
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
    })(),
    sabak: (() => {
      const sabakState = getSabakState(realmId);
      const inPalace = isSabakPalace(player.position.zone, player.position.room);
      return {
        inZone: isSabakZone(player.position.zone),
        active: sabakState.active,
        ownerGuildId: sabakState.ownerGuildId,
        ownerGuildName: sabakState.ownerGuildName,
        inPalace,
        palaceKillStats: inPalace ? getSabakPalaceKillStats(realmId) : null,
        siegeEndsAt: sabakState.siegeEndsAt || null
      };
    })(),
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
    ultimate_growth_config: withUltimateGrowthMaterialNames(getUltimateGrowthConfigMem()),
    treasure_sets: TREASURE_SETS,
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
    high_tier_recycle_config: getHighTierRecycleStatePayload(),
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
  const guardMode = getRuntimeGuardMode();
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
  const guardMinIntervalMs = guardMode === 'aggressive'
    ? (inBossRoom ? 1400 : 2200)
    : (guardMode === 'normal' ? (inBossRoom ? 1000 : 1500) : 0);
  if (!override && !forceSend && guardMinIntervalMs > 0 && key) {
    const now = Date.now();
    const lastSent = Number(stateThrottleLastSent.get(key) || 0);
    if (now - lastSent < guardMinIntervalMs) {
      return;
    }
    stateThrottleLastSent.set(key, now);
  }
  const state = await buildState(player);
  const now = Date.now();
  if (!player._stateAuxSentAt) player._stateAuxSentAt = {};
  const auxSentAt = player._stateAuxSentAt;
  const shouldSendAux = (bucket, ttlMs) => {
    if (forceSend) {
      auxSentAt[bucket] = now;
      return true;
    }
    const lastAt = Number(auxSentAt[bucket] || 0);
    if (now - lastAt >= ttlMs) {
      auxSentAt[bucket] = now;
      return true;
    }
    return false;
  };
  if (!shouldSendAux('dynamic_aux', STATE_DYNAMIC_AUX_TTL)) {
    delete state.crossRank;
    delete state.daily_lucky;
    delete state.zhuxian_tower_rank_top10;
    delete state.worldBossRank;
    delete state.worldBossClassRank;
    delete state.worldBossNextRespawn;
  }
  if (!shouldSendAux('static_aux', STATE_STATIC_AUX_TTL)) {
    delete state.treasure_sets;
    delete state.auto_full_boss_list;
    delete state.svip_settings;
    delete state.refine_config;
    delete state.ultimate_growth_config;
    delete state.high_tier_recycle_config;
    delete state.effect_reset_config;
  }
  if (!forceSend) {
    // 房间动态数据优先走 room_state，避免与 state 重复下发
    delete state.players;
    delete state.bossRespawn;
    delete state.worldBossRank;
    delete state.worldBossClassRank;
    delete state.worldBossNextRespawn;
  }
  if (!player._stateServerTimeAt) player._stateServerTimeAt = 0;
  if (!forceSend) {
    const nowMs = Date.now();
    if (nowMs - Number(player._stateServerTimeAt || 0) < 1000) {
      delete state.server_time;
    } else {
      player._stateServerTimeAt = nowMs;
    }
  } else {
    player._stateServerTimeAt = Date.now();
  }
  const diffableObjects = ['player', 'stats', 'room'];
  if (!player._stateObjectSnapshots) player._stateObjectSnapshots = {};
  const objectSnapshots = player._stateObjectSnapshots;
  diffableObjects.forEach((field) => {
    if (!(field in state) || !state[field] || typeof state[field] !== 'object') return;
    if (forceSend || !objectSnapshots[field]) {
      objectSnapshots[field] = state[field];
      return;
    }
    const diff = buildShallowStateObjectDiff(objectSnapshots[field], state[field]);
    objectSnapshots[field] = state[field];
    if (!diff) {
      delete state[field];
      return;
    }
    state[field] = diff;
  });
  const dedupeFields = [
    'items',
    'warehouse',
    'equipment',
    'skills',
    'treasure',
    'pet',
    'trade',
    'mobs',
    'players',
    'exits',
    'summon',
    'summons',
    'party',
    'activities',
    'training',
    'zhuxian_tower',
    'online',
    'sabak'
  ];
  if (!player._stateFieldHashes) player._stateFieldHashes = {};
  const fieldHashes = player._stateFieldHashes;
  dedupeFields.forEach((field) => {
    if (!(field in state)) return;
    const nextHash = JSON.stringify(state[field]);
    if (!forceSend && fieldHashes[field] === nextHash) {
      delete state[field];
      return;
    }
    fieldHashes[field] = nextHash;
  });
  if (!player?.socket) {
    player.forceStateRefresh = false;
    return;
  }
  player.socket.emit('state', state);
  player.forceStateRefresh = false;
  if (exitsHash && key) {
    stateThrottleLastExits.set(key, exitsHash);
    if (roomKey) stateThrottleLastRoom.set(key, roomKey);
  }
  if (key) {
    stateThrottleLastInBoss.set(key, inBossRoom);
    if (player.position) {
      stateThrottleLastRoom.set(key, `${player.position.zone}:${player.position.room}`);
    }
  }
}

function buildRoomStatePayload(zoneId, roomId, realmId = 1) {
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  const cached = getRoomCommonState(zoneId, roomId, effectiveRealmId);
  const cacheKey = `${effectiveRealmId}:${zoneId}:${roomId}`;
  const now = Date.now();
  const meta = roomStatePatchMetaCache.get(cacheKey) || {
    mobsHash: null,
    lastMobsAt: 0,
    playersHash: null,
    rankHash: null,
    lastServerTimeAt: 0,
    lastPlayersAt: 0,
    lastRankAt: 0
  };
  const mobsHash = JSON.stringify({
    mobs: cached.mobs || [],
    bossRespawn: cached.nextRespawn || null
  });
  const playersHash = JSON.stringify((cached.roomPlayers || []).map((p) => [
    p.name,
    p.classId,
    p.level,
    p.guildId || '',
    p.realmId || 1,
    p.pk || 0
  ]));
  const rankHash = JSON.stringify({
    rank: cached.bossRank || [],
    classRank: cached.bossClassRank || null,
    next: cached.bossNextRespawn || null
  });
  const guardMode = getRuntimeGuardMode(now);
  const guardTtlMul = guardMode === 'aggressive' ? 2.0 : (guardMode === 'normal' ? 1.4 : 1);
  const includeMobs = mobsHash !== meta.mobsHash || (now - meta.lastMobsAt >= ROOM_STATE_MOBS_TTL * guardTtlMul);
  const includePlayers = playersHash !== meta.playersHash || (now - meta.lastPlayersAt >= ROOM_STATE_PLAYERS_TTL * guardTtlMul);
  const includeRank = rankHash !== meta.rankHash || (now - meta.lastRankAt >= ROOM_STATE_RANK_TTL * guardTtlMul);
  if (includeMobs) {
    meta.mobsHash = mobsHash;
    meta.lastMobsAt = now;
  }
  if (includePlayers) {
    meta.playersHash = playersHash;
    meta.lastPlayersAt = now;
  }
  if (includeRank) {
    meta.rankHash = rankHash;
    meta.lastRankAt = now;
  }
  const includeServerTime = now - Number(meta.lastServerTimeAt || 0) >= ROOM_STATE_SERVER_TIME_TTL * guardTtlMul;
  if (includeServerTime) {
    meta.lastServerTimeAt = now;
  }
  roomStatePatchMetaCache.set(cacheKey, meta);

  if (!includeMobs && !includePlayers && !includeRank && !includeServerTime) {
    return null;
  }

  const payload = {
    room: {
      zone: zone?.name || zoneId,
      name: room?.name || roomId,
      zoneId,
      roomId
    }
  };
  if (includeServerTime) {
    payload.server_time = now;
  }
  if (includeMobs) {
    payload.mobs = cached.mobs;
    payload.bossRespawn = cached.nextRespawn;
  }
  if (includePlayers) {
    payload.players = cached.roomPlayers;
  }
  if (includeRank) {
    payload.worldBossRank = cached.bossRank;
    payload.worldBossClassRank = cached.bossClassRank || null;
    payload.worldBossNextRespawn = cached.bossNextRespawn;
  }
  return payload;
}

function buildShallowStateObjectDiff(prevObj, nextObj) {
  const prev = (prevObj && typeof prevObj === 'object') ? prevObj : {};
  const next = (nextObj && typeof nextObj === 'object') ? nextObj : {};
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const diff = {};
  let changed = false;
  keys.forEach((key) => {
    const hasNext = Object.prototype.hasOwnProperty.call(next, key);
    if (!hasNext) {
      diff[key] = null;
      changed = true;
      return;
    }
    const prevVal = prev[key];
    const nextVal = next[key];
    const same =
      (prevVal === nextVal) ||
      (typeof prevVal === 'object' && typeof nextVal === 'object' && JSON.stringify(prevVal) === JSON.stringify(nextVal));
    if (!same) {
      diff[key] = nextVal;
      changed = true;
    }
  });
  return changed ? diff : null;
}

async function sendRoomState(zoneId, roomId, realmId = 1) {
  const effectiveRealmId = getRoomRealmId(zoneId, roomId, realmId);
  const roomCacheKey = `${effectiveRealmId}:${zoneId}:${roomId}`;
  const players = listConnectedPlayers(effectiveRealmId)
    .filter((p) => p.position.zone === zoneId && p.position.room === roomId);
  
  if (players.length === 0) {
    roomStatePatchMetaCache.delete(roomCacheKey);
    return;
  }
  
  // BOSS房间优化：批量处理，减少序列化开销
  const isBoss = isBossRoom(zoneId, roomId, effectiveRealmId);
  const guardMode = getRuntimeGuardMode();
  let minIntervalMs = ROOM_STATE_TTL;
  if (guardMode === 'normal') minIntervalMs = Math.max(minIntervalMs, 150);
  if (guardMode === 'aggressive') minIntervalMs = Math.max(minIntervalMs, 240);
  if (isBoss && players.length > 5) {
    minIntervalMs = Math.max(minIntervalMs, guardMode === 'aggressive' ? 360 : 220);
  }
  const cacheKey = roomCacheKey;
  const now = Date.now();
  const lastUpdate = roomStateCache.get(cacheKey) || 0;
  if (now - lastUpdate < minIntervalMs) {
    return;
  }
  roomStateCache.set(cacheKey, now);
  
  // 使用Promise.all并行发送
  const roomState = buildRoomStatePayload(zoneId, roomId, effectiveRealmId);
  if (!roomState) return;
  const hasMobSnapshot = Object.prototype.hasOwnProperty.call(roomState, 'mobs');
  const hasBossRespawnTimer =
    Number(roomState?.bossRespawn || 0) > 0 ||
    Number(roomState?.worldBossNextRespawn || 0) > 0;
  players.forEach((p) => {
    if (hasBossRespawnTimer || hasMobSnapshot) {
      p.socket.emit('room_state', roomState);
    } else {
      p.socket.volatile.emit('room_state', roomState);
    }
  });
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

        if (specialBossRespawned && zoneId !== PERSONAL_BOSS_ZONE_ID) {
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
  const suppressBloodAnnouncement = mobTemplate?.id === 'vip_personal_boss' || mobTemplate?.id === 'svip_personal_boss';

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
        return { damageTaken: 0, actualDamage: 0 };
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
        return { damageTaken: 0, actualDamage: 0 };
    }
  }

  recordMobDamage(mob, attackerName, dmg);

  // 特殊BOSS血量百分比公告（在应用伤害前计算）
  let announcedBlood = false;
  if (isSpecialBoss && mob.hp > 0 && !suppressBloodAnnouncement) {
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

    return { damageTaken: dmg, actualDamage: dmg };
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
  const buffs = target.status?.buffs || {};
  const applyMdefBuffMultiplier = (key) => {
    const buff = buffs[key];
    if (!buff) return;
    if (buff.expiresAt && buff.expiresAt < now) {
      delete buffs[key];
      return;
    }
    multiplier *= buff.mdefMultiplier || 1;
  };
  applyMdefBuffMultiplier('mdefBuff');
  applyMdefBuffMultiplier('moonFairyMdefBuff');
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
  const petMagicBreak = debuffs.petMagicBreak;
  if (petMagicBreak) {
    if (petMagicBreak.expiresAt && petMagicBreak.expiresAt < now) {
      delete debuffs.petMagicBreak;
    } else {
      multiplier *= petMagicBreak.mdefMultiplier || 1;
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
  const petBonus = hasActivePetSkill(target, 'pet_bloodline_adv') ? PET_COMBAT_BALANCE.bloodlineAdvHealMul :
                    hasActivePetSkill(target, 'pet_bloodline') ? PET_COMBAT_BALANCE.bloodlineHealMul : 1;
  if (!debuff) return petBonus;
  if (debuff.expiresAt && debuff.expiresAt < Date.now()) {
    delete target.status.debuffs.healBlock;
    return petBonus;
  }
  return (debuff.healMultiplier || 1) * petBonus;
}

function tryApplyHealBlockEffect(attacker, target) {
  if (!attacker || !target) return false;
  if (!hasHealBlockEffect(attacker)) return false;
  const warHornBonus = hasActivePetSkill(attacker, 'pet_war_horn_adv') ? PET_COMBAT_BALANCE.warHornAdvHealBlockBonusChance :
                        hasActivePetSkill(attacker, 'pet_war_horn') ? PET_COMBAT_BALANCE.warHornHealBlockBonusChance : 0;
  const chance = PET_COMBAT_BALANCE.healBlockBaseChance + warHornBonus;
  if (Math.random() > chance) return false;
  applyHealBlockDebuff(target);
  if (hasActivePetSkill(attacker, 'pet_magic_break')) {
    if (!target.status) target.status = {};
    if (!target.status.debuffs) target.status.debuffs = {};
    target.status.debuffs.petMagicBreak = {
      mdefMultiplier: PET_COMBAT_BALANCE.magicBreakMdefMultiplier,
      expiresAt: Date.now() + PET_COMBAT_BALANCE.magicBreakDurationMs
    };
  }
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

    let loaded = await loadCharacter(session.user_id, name, realmInfo.realmId);
    if (!loaded) {
      const fallbackRow = await knex('characters')
        .where({ user_id: session.user_id, name: String(name || '').trim() })
        .orderBy('updated_at', 'desc')
        .first();
      if (fallbackRow) {
        realmInfo = { realmId: fallbackRow.realm_id || 1 };
        loaded = await loadCharacter(session.user_id, fallbackRow.name, fallbackRow.realm_id || 1);
      }
    }
    if (!loaded) {
      socket.emit('auth_error', { error: '角色不存在。' });
      socket.disconnect();
      return;
    }

    // 清理同账号下“无连接”的托管/残留角色，避免误判为多角色同时登录
    for (const [onlineSocketId, onlinePlayer] of Array.from(players.entries())) {
      if (!onlinePlayer) continue;
      if ((onlinePlayer.userId || 0) !== session.user_id) continue;
      if (onlinePlayer.socket) continue;
      if (onlinePlayer.name === loaded.name) continue;
      if (!onlinePlayer.flags) onlinePlayer.flags = {};
      onlinePlayer.flags.offlineAt = Date.now();
      delete onlinePlayer.flags.offlineManagedAuto;
      delete onlinePlayer.flags.offlineManagedAt;
      delete onlinePlayer.flags.offlineManagedPending;
      delete onlinePlayer.flags.offlineManagedStartAt;
      onlinePlayer.deviceKey = null;
      onlinePlayer.send = () => {};
      await savePlayer(onlinePlayer);
      getRealmState(onlinePlayer.realmId || 1).lastSaveTime.delete(onlinePlayer.name);
      onlinePlayerRankTitles.delete(onlinePlayer.name);
      players.delete(onlineSocketId);
    }

    // 同账号仅允许一个角色在线：允许同角色重登（走下面的顶号逻辑），禁止其他角色并发登录
    const hasOtherCharacterOnline = Array.from(players.values()).some((onlinePlayer) => {
      if (!onlinePlayer) return false;
      if ((onlinePlayer.userId || 0) !== session.user_id) return false;
      return onlinePlayer.name !== loaded.name;
    });
    if (hasOtherCharacterOnline) {
      socket.emit('auth_error', { error: '同一账号不能同时登录多个角色。' });
      socket.disconnect();
      return;
    }

    // 检查是否已有同名角色在线，如果有则踢掉之前的连接
    const existingSocketId = Array.from(players.keys()).find((key) => {
      const existing = players.get(key);
      if (!existing) return false;
      return (existing.userId || 0) === session.user_id && existing.name === loaded.name;
    });
    let replacedExistingSession = false;
    let replacedManagedSession = false;
    let managedSummonsSnapshot = [];
    if (existingSocketId) {
      const existingPlayer = players.get(existingSocketId);
      if (existingPlayer) {
        const existingIsManaged = isManagedHostedPlayer(existingPlayer);
        if (existingIsManaged) {
          managedSummonsSnapshot = getAliveSummons(existingPlayer).map((summon) => ({
            id: summon.id,
            exp: summon.exp || 0,
            level: summon.level || summon.summonLevel || 1,
            hp: summon.hp || 0,
            max_hp: summon.max_hp || 0
          }));
          await savePlayer(existingPlayer);
          players.delete(existingSocketId);
          replacedExistingSession = true;
          replacedManagedSession = true;
        } else {
          // 通知旧连接被踢下线
          existingPlayer.send('您的账号在别处登录，您已被强制下线。');
          // 保存并移除之前的会话
          await savePlayer(existingPlayer);
          // 断开旧连接
          existingPlayer.socket?.disconnect?.();
          // 移除旧的玩家数据
          players.delete(existingSocketId);
          replacedExistingSession = true;
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
    }

    // 顶号/接管后重新读取角色，确保拿到刚保存的最新 flags（如托管期间保存的召唤兽）。
    if (replacedExistingSession) {
      const reloaded = await loadCharacter(session.user_id, name, realmInfo.realmId);
      if (!reloaded) {
        socket.emit('auth_error', { error: '角色读取失败，请重试。' });
        socket.disconnect();
        return;
      }
      loaded = reloaded;
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
    const wasOfflineManagedAuto = Boolean(loaded.flags.offlineManagedAuto);
    const wasOfflineManagedPending = Boolean(loaded.flags.offlineManagedPending);
    delete loaded.flags.offlineManagedAuto;
    delete loaded.flags.offlineManagedAt;
    delete loaded.flags.offlineManagedPending;
    delete loaded.flags.offlineManagedStartAt;
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
    const savedSummons = managedSummonsSnapshot.length
      ? managedSummonsSnapshot
      : (Array.isArray(loaded.flags.savedSummons)
        ? loaded.flags.savedSummons
        : (loaded.flags.savedSummon ? [loaded.flags.savedSummon] : []));
    if (savedSummons.length) {
      savedSummons.forEach((saved) => {
        const skill = getSkill(loaded.classId, saved.id);
        if (skill && (replacedManagedSession || loaded.mp >= skill.mp)) {
          const skillLevel = getSkillLevel(loaded, skill.id);
          const summon = summonStats(loaded, skill, skillLevel);
          const restored = { ...summon, exp: saved.exp || 0 };
          restored.hp = Math.min(saved.hp || restored.max_hp, restored.max_hp);
          if (!replacedManagedSession) {
            loaded.mp = clamp(loaded.mp - skill.mp, 0, loaded.max_mp);
          }
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
      attachGuildMeta(loaded, member.guild, member.role);
    }
    normalizeZhuxianTowerProgress(loaded);
    normalizePetState(loaded);
    ensureZhuxianTowerPosition(loaded);
    ensurePersonalBossPosition(loaded);

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
    if ((wasOfflineManagedAuto || wasOfflineManagedPending) && loaded.flags?.autoFullEnabled && isSvipActive(loaded)) {
      loaded.combat = null;
      loaded.flags.autoFullLastMoveAt = 0;
      const relogRoomMobs = getAliveMobs(loaded.position.zone, loaded.position.room, loaded.realmId || 1);
      const relogAutoResult = tryAutoFullAction(loaded, relogRoomMobs);
      if (relogAutoResult === 'moved') {
        await savePlayer(loaded).catch(() => {});
      }
    }
    tryRecoverZhuxianTowerEmptyRoom(loaded);
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
    const rateLimitExempt = new Set(['refine', 'forge', 'train', 'effect', 'growth']);
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
      allCharacters: () => getAllCharactersCached(player.realmId || 1),
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
      activityApi: {
        getPointShopConfig: () => getActivityPointShopConfigCached(false),
        // 神兽碎片兑换配置改为每次按后台最新值读取，避免缓存导致前台看到旧配置
        getDivineBeastFragmentExchangeConfig: () => getDivineBeastFragmentExchangeConfigCached(true),
        grantFixedPet: (species) => grantFixedPetToPlayer(player, species, 'ultimate')
      },
      consignApi,
      characterApi: {
        renameSelf: async (newName) => {
          const oldName = String(player.name || '').trim();
          const targetName = String(newName || '').trim();
          const nameResult = validatePlayerName(targetName);
          if (!nameResult.ok) return { ok: false, msg: nameResult.error || '角色名不合法。' };
          const finalName = nameResult.value;
          if (finalName === oldName) return { ok: false, msg: '新角色名不能与当前相同。' };
          if (getTradeByPlayerAny(oldName, player.realmId || 1).trade) {
            return { ok: false, msg: '交易状态中无法改名，请先取消交易。' };
          }
          if (playersByName(finalName, player.realmId || 1)) return { ok: false, msg: '该角色名已在线。' };
          const existed = await findCharacterByName(finalName);
          if (existed) return { ok: false, msg: '该角色名已存在。' };
          try {
            await renameCharacterEverywhere({
              userId: player.userId,
              realmId: player.realmId || 1,
              oldName,
              newName: finalName
            });
            await applyOnlineCharacterRename(player, finalName);
            return { ok: true, oldName, newName: finalName };
          } catch (err) {
            return { ok: false, msg: err?.message || '改名失败。' };
          }
        }
      },
      mailApi: {
        sendMail,
        listMail,
        markMailRead
      }
    });
    tryRecoverZhuxianTowerEmptyRoom(player);
    markAutoFullManualMove(
      player,
      prevZone,
      prevRoom,
      player.position.zone,
      player.position.room
    );
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
    tryRecoverZhuxianTowerEmptyRoom(player);
    player.forceStateRefresh = true;
    await sendState(player);
  });

  socket.on('pet_action', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const emitResult = (ok, msg) => socket.emit('pet_result', { ok, msg });
    try {
      const { clean } = sanitizePayload(
        payload,
        ['action', 'petId', 'name', 'bookId', 'qty', 'mainPetId', 'subPetId', 'itemKey', 'slot', 'attr', 'count', 'targetName'],
        'pet_action'
      );
      const action = String(clean?.action || '').trim().toLowerCase();
      const petState = normalizePetState(player);
      const getPetById = (id) => petState.pets.find((pet) => pet.id === String(id || '').trim());
      const fail = (msg) => emitResult(false, msg);
      let dirty = false;
      const divineAdvanceCost = 500;
      const petRarityIndex = (rarity) => PET_RARITY_ORDER.indexOf(String(rarity || ''));
      const synthesizePetPair = (mainPet, subPet) => {
      if (!mainPet || !subPet) return { ok: false, msg: '宠物不存在' };
      if (mainPet.id === subPet.id) return { ok: false, msg: '主宠和副宠不能相同' };
      if (player.gold < PET_SYNTHESIS_COST_GOLD) return { ok: false, msg: '金币不足' };

      const beforeMain = JSON.parse(JSON.stringify(mainPet));
      const beforeSub = JSON.parse(JSON.stringify(subPet));
      player.gold -= PET_SYNTHESIS_COST_GOLD;

      const basePet = mainPet;
      const feedPet = subPet;
      const baseRarity = PET_RARITY_ORDER.includes(String(basePet.rarity || '')) ? String(basePet.rarity) : 'normal';
      const growthRange = PET_RARITY_GROWTH_RANGE[baseRarity] || PET_RARITY_GROWTH_RANGE.normal;
      const aptRange = PET_RARITY_APTITUDE_RANGE[baseRarity] || PET_RARITY_APTITUDE_RANGE.normal;

      const mainGrowth = Number(basePet.growth || growthRange[0]);
      const subGrowth = Number(feedPet.growth || growthRange[0]);
      let growthMin = Math.min(mainGrowth, subGrowth) * 0.98;
      let growthMax = Math.max(mainGrowth, subGrowth) * 1.03;
      if (growthMax < growthMin) growthMax = growthMin;
      let nextGrowth = growthMin + Math.random() * Math.max(0, growthMax - growthMin);
      if (Math.random() < 0.08) nextGrowth += 0.01 + Math.random() * 0.02;
      basePet.growth = Number(Math.max(growthRange[0], Math.min(growthRange[1], nextGrowth)).toFixed(3));

      if (!basePet.aptitude || typeof basePet.aptitude !== 'object') basePet.aptitude = {};
      ['hp', 'atk', 'def', 'mag', 'agility'].forEach((key) => {
        const parentA = Math.floor(Number(basePet?.aptitude?.[key] || aptRange[key][0]));
        const parentB = Math.floor(Number(feedPet?.aptitude?.[key] || aptRange[key][0]));
        let rollMin = Math.floor(Math.min(parentA, parentB) * 0.9);
        let rollMax = Math.floor(Math.max(parentA, parentB) * 1.1);
        if (rollMax < rollMin) rollMax = rollMin;
        let rolled = randInt(Math.max(1, rollMin), Math.max(1, rollMax));
        if (Math.random() < 0.12) {
          const burstFactor = 1.03 + Math.random() * 0.05;
          rolled = Math.floor(rolled * burstFactor);
        }
        basePet.aptitude[key] = Math.max(aptRange[key][0], Math.min(aptRange[key][1], rolled));
      });
      const baseBattleType = normalizePetBattleType({ battleType: basePet.battleType }, basePet.aptitude);
      basePet.battleType = baseBattleType;
      biasSynthesizedPetAptitudeByBattleType(basePet, aptRange, baseBattleType);

      const mainSkills = Array.isArray(basePet.skills) ? basePet.skills : [];
      const subSkills = Array.isArray(feedPet.skills) ? feedPet.skills : [];
      const mainSkillSet = new Set(mainSkills.map((id) => String(id || '').trim()).filter(Boolean));
      const skillPool = Array.from(new Set([...mainSkills, ...subSkills]
        .map((id) => String(id || '').trim())
        .filter((id) => id && getPetSkillDef(id))
        .filter((id) => !isPetLockedSkill(id) || mainSkillSet.has(id))));

      const mainSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.floor(Number(basePet.skillSlots || PET_BASE_SKILL_SLOTS)));
      const subSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.floor(Number(feedPet.skillSlots || PET_BASE_SKILL_SLOTS)));
      const parentMinSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.min(mainSlots, subSlots));
      const parentMaxSlots = Math.max(parentMinSlots, Math.min(PET_MAX_SKILL_SLOTS, Math.max(mainSlots, subSlots)));
      let nextSkillSlots = randInt(parentMinSlots, parentMaxSlots);
      if (Math.random() < 0.35) nextSkillSlots += 1;
      if (Math.random() < 0.10) nextSkillSlots += 1;
      const lockedMainSkills = mainSkills.filter((id) => isPetLockedSkill(id));
      nextSkillSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.min(PET_MAX_SKILL_SLOTS, nextSkillSlots));
      nextSkillSlots = Math.max(nextSkillSlots, lockedMainSkills.length);
      const slotDelta = nextSkillSlots - mainSlots;
      basePet.skillSlots = nextSkillSlots;

      let inheritCount = randInt(2, 4);
      if (skillPool.length >= 6 && Math.random() < 0.35) inheritCount += 1;
      if (skillPool.length >= 8 && Math.random() < 0.2) inheritCount += 1;
      inheritCount = skillPool.length <= 0 ? 0 : Math.max(1, Math.min(inheritCount, nextSkillSlots, skillPool.length));
      const remainingPool = skillPool.slice();
      const nextSkills = [];
      lockedMainSkills.forEach((id) => {
        if (nextSkills.length < nextSkillSlots && !nextSkills.includes(id)) nextSkills.push(id);
      });
      while (remainingPool.length > 0 && nextSkills.length < inheritCount) {
        const idx = randInt(0, remainingPool.length - 1);
        const picked = remainingPool.splice(idx, 1)[0];
        if (!picked || nextSkills.includes(picked)) continue;
        nextSkills.push(picked);
      }
      while (remainingPool.length > 0 && nextSkills.length < Math.min(nextSkillSlots, inheritCount)) {
        const idx = randInt(0, remainingPool.length - 1);
        const picked = remainingPool.splice(idx, 1)[0];
        if (!picked || nextSkills.includes(picked)) continue;
        nextSkills.push(picked);
      }
      basePet.skills = nextSkills;

      basePet.level = 1;
      basePet.exp = 0;

      petState.pets = petState.pets.filter((pet) => pet.id !== feedPet.id);
      if (petState.activePetId === feedPet.id) petState.activePetId = basePet.id;
      dirty = true;

      let slotText = '';
      if (slotDelta > 0) slotText = ` | slot +${slotDelta}`;
      else if (slotDelta < 0) slotText = ` | slot ${slotDelta}`;

      if (logLoot) {
        logLoot(
          `[pet][alchemy] ${player.name} main=${beforeMain.name}/${beforeMain.id} sub=${beforeSub.name}/${beforeSub.id} ` +
          `growth:${Number(beforeMain.growth || 0).toFixed(3)}+${Number(beforeSub.growth || 0).toFixed(3)}->${Number(basePet.growth || 0).toFixed(3)} ` +
          `slots:${Number(beforeMain.skillSlots || 0)}|${Number(beforeSub.skillSlots || 0)}->${Number(basePet.skillSlots || 0)} ` +
          `skills:${(Array.isArray(beforeMain.skills) ? beforeMain.skills.length : 0)}|${(Array.isArray(beforeSub.skills) ? beforeSub.skills.length : 0)}->${(Array.isArray(basePet.skills) ? basePet.skills.length : 0)} ` +
          `rarity=${baseRarity}`
        );
      }
      return { ok: true, pet: basePet, slotText };
    };

      if (!action) return fail('无效宠物操作');

    if (action === 'set_active') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      petState.activePetId = pet.id;
      dirty = true;
      emitResult(true, `已设为出战宠物：${pet.name}`);
    } else if (action === 'set_rest') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      if (petState.activePetId === pet.id) {
        petState.activePetId = null;
        dirty = true;
      }
      emitResult(true, `${pet.name} 已休息`);
    } else if (action === 'release') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      if (isDivineBeastSpeciesName(pet.role || pet.species || '')) return fail('生肖神兽不允许放生');
      pet.equipment = normalizePetEquipmentState(pet.equipment);
      if (Object.values(pet.equipment).some(Boolean)) return fail('宠物已穿戴装备，无法放生');
      petState.pets = petState.pets.filter((entry) => entry.id !== pet.id);
      if (petState.activePetId === pet.id) {
        petState.activePetId = null;
      }
      dirty = true;
      emitResult(true, `已放生宠物：${pet.name}`);
    } else if (action === 'rename') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      const name = String(clean?.name || '').trim();
      const len = [...name].length;
      if (len < 2 || len > 12) return fail('宠物名称长度需为2-12个字符');
      pet.name = name;
      dirty = true;
      emitResult(true, `宠物改名成功：${pet.name}`);
    } else if (action === 'gift') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      pet.equipment = normalizePetEquipmentState(pet.equipment);
      if (petState.activePetId === pet.id) return fail('出战中的宠物不能赠送');
      if (Object.values(pet.equipment).some(Boolean)) return fail('已穿戴装备的宠物不能赠送');
      const targetName = String(clean?.targetName || clean?.name || '').trim();
      if (!targetName) return fail('请输入目标玩家名');
      if (targetName === String(player.name || '').trim()) return fail('不能赠送给自己');
      const targetRow = await findCharacterByNameInRealm(targetName, player.realmId || 1);
      if (!targetRow) return fail('未找到目标玩家');
      const onlineTarget = playersByName(targetName, player.realmId || 1);
      const targetPlayer = onlineTarget || await loadCharacter(targetRow.user_id, targetRow.name, targetRow.realm_id || 1);
      if (!targetPlayer) return fail('目标玩家数据加载失败');
      const targetPetState = normalizePetState(targetPlayer);
      const giftCardOwned = Math.max(0, Math.floor(Number((player.inventory || []).find((i) => i?.id === 'pet_gift_card')?.qty || 0)));
      if (giftCardOwned < 1) return fail('宠物赠送卡不足，需要宠物赠送卡 x1');
      if (!removeItem(player, 'pet_gift_card', 1)) return fail('宠物赠送卡扣除失败');

      const clonedPet = JSON.parse(JSON.stringify(pet));
      const targetPetIds = new Set((targetPetState.pets || []).map((entry) => String(entry?.id || '').trim()).filter(Boolean));
      let nextPetId = String(clonedPet.id || '').trim();
      if (!nextPetId || targetPetIds.has(nextPetId)) {
        do {
          nextPetId = `pet_${Date.now()}_${randInt(100, 999)}`;
        } while (targetPetIds.has(nextPetId));
      }
      clonedPet.id = nextPetId;
      targetPetState.pets.push(clonedPet);

      petState.pets = petState.pets.filter((entry) => entry.id !== pet.id);
      if (petState.activePetId === pet.id) {
        petState.activePetId = null;
        computeDerived(player);
      }

      if (onlineTarget) {
        onlineTarget.forceStateRefresh = true;
        await sendState(onlineTarget);
        await savePlayer(onlineTarget);
      } else {
        await saveCharacter(targetRow.user_id, targetPlayer, targetRow.realm_id || 1);
      }

      await sendMail(
        targetRow.user_id,
        targetRow.name || targetName,
        '系统',
        null,
        '宠物赠送通知',
        `${player.name} 向你赠送了宠物：${clonedPet.name}。\n请前往宠物系统查看。`,
        null,
        0,
        targetRow.realm_id || 1
      );

      dirty = true;
      emitResult(true, `宠物赠送成功：${pet.name} -> ${targetName}`);
    } else if (action === 'equip_item') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      pet.equipment = normalizePetEquipmentState(pet.equipment);
      const itemKey = String(clean?.itemKey || '').trim();
      if (!itemKey) return fail('请选择装备');
      normalizeInventory(player);
      const invIndex = Array.isArray(player.inventory)
        ? player.inventory.findIndex((entry) => entry && getItemKey(entry) === itemKey)
        : -1;
      if (invIndex < 0) return fail('背包中未找到该物品');
      const inv = player.inventory[invIndex];
      const itemTpl = ITEM_TEMPLATES[inv?.id];
      if (!itemTpl || !itemTpl.slot) return fail('只有装备可以给宠物穿戴');
      const slotKey = resolvePetEquipSlotForItem(pet, itemTpl);
      if (!slotKey) {
        if (String(itemTpl.slot) === 'ring') return fail('宠物戒指栏已满');
        if (String(itemTpl.slot) === 'bracelet') return fail('宠物手镯栏已满');
        return fail('宠物装备栏不支持或已被占用');
      }

      const equipEntry = {
        id: String(inv.id),
        qty: 1,
        effects: normalizeEffects(inv.effects || null),
        durability: inv.durability == null ? null : Math.floor(Number(inv.durability || 0)),
        max_durability: inv.max_durability == null ? null : Math.floor(Number(inv.max_durability || 0)),
        refine_level: Math.max(0, Math.floor(Number(inv.refine_level || 0))),
        base_roll_pct: inv.base_roll_pct == null ? null : Math.max(100, Math.min(200, Math.floor(Number(inv.base_roll_pct || 100)))),
        growth_level: Math.max(0, Math.floor(Number(inv.growth_level || 0))),
        growth_fail_stack: Math.max(0, Math.floor(Number(inv.growth_fail_stack || 0)))
      };
      const replaced = pet.equipment[slotKey] && pet.equipment[slotKey].id ? { ...pet.equipment[slotKey] } : null;
      if (replaced) {
        addItem(
          player,
          replaced.id,
          1,
          replaced.effects || null,
          replaced.durability ?? null,
          replaced.max_durability ?? null,
          replaced.refine_level ?? 0,
          replaced.base_roll_pct ?? null,
          replaced.growth_level ?? null,
          replaced.growth_fail_stack ?? null
        );
      }
      if (Number(inv.qty || 1) > 1) {
        inv.qty = Math.max(0, Math.floor(Number(inv.qty || 1)) - 1);
        if (inv.qty <= 0) player.inventory.splice(invIndex, 1);
      } else {
        player.inventory.splice(invIndex, 1);
      }
      pet.equipment[slotKey] = equipEntry;
      normalizeInventory(player);
      dirty = true;
      emitResult(true, replaced ? `宠物装备成功：${itemTpl.name}（已替换${slotKey}位装备）` : `宠物装备成功：${itemTpl.name} -> ${slotKey}`);
    } else if (action === 'unequip_item') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      pet.equipment = normalizePetEquipmentState(pet.equipment);
      const slotKey = String(clean?.slot || '').trim();
      if (!PET_EQUIP_SLOT_KEYS.includes(slotKey)) return fail('无效装备栏位');
      const equipped = pet.equipment[slotKey];
      if (!equipped || !equipped.id) return fail('该栏位没有装备');
      const itemTpl = ITEM_TEMPLATES[equipped.id];
      addItem(
        player,
        equipped.id,
        1,
        equipped.effects || null,
        equipped.durability ?? null,
        equipped.max_durability ?? null,
        equipped.refine_level ?? 0,
        equipped.base_roll_pct ?? null,
        equipped.growth_level ?? null,
        equipped.growth_fail_stack ?? null
      );
      pet.equipment[slotKey] = null;
      normalizeInventory(player);
      dirty = true;
      emitResult(true, `宠物卸下装备：${itemTpl?.name || equipped.id}`);
    } else if (action === 'comprehend') {
      return fail('宠物领悟为升级自动触发，无需手动操作');
    } else if (action === 'buy_book') {
      return fail('宠物技能书仅能通过BOSS掉落获得');
    } else if (action === 'use_book') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      const book = getPetBookDef(String(clean?.bookId || '').trim());
      if (!book) return fail('未找到该技能书');
      const owned = Math.max(0, Math.floor(Number(petState.books[book.id] || 0)));
      if (owned <= 0) return fail('宠物技能书数量不足');
      if ((pet.skills || []).includes(book.skillId)) return fail('该宠物已学会此技能');
      const learned = learnPetSkill(pet, book.skillId, true);
      if (!learned.ok) return fail('学习技能失败');
      petState.books[book.id] = owned - 1;
      if (petState.books[book.id] <= 0) delete petState.books[book.id];
      let unlocked = false;
      if (Number(pet.skillSlots || PET_BASE_SKILL_SLOTS) < 4 && Math.random() < PET_BOOK_UNLOCK_SLOT4_CHANCE) {
        pet.skillSlots = Math.min(4, Number(pet.skillSlots || PET_BASE_SKILL_SLOTS) + 1);
        unlocked = true;
      }
      dirty = true;
      const learnedName = getPetSkillDef(book.skillId)?.name || book.skillName || book.skillId;
      const replacedName = learned.replaced ? (getPetSkillDef(learned.replaced)?.name || learned.replaced) : '';
      const replacedText = replacedName ? `（替换 ${replacedName}）` : '';
      const unlockText = unlocked ? '｜技能格已解锁' : '';
      const activityMsgs = recordTreasurePetFestivalActivity(player, { petBookUses: 1 });
      activityMsgs.forEach((msg) => player.send?.(msg));
      const currentSkillsText = (Array.isArray(pet.skills) ? pet.skills : [])
        .map((id) => getPetSkillDef(id)?.name || id)
        .join('、');
      emitResult(true, `打书成功：${learnedName}${replacedText}${unlockText}`);
      player.send?.(`【打书结果】${pet.name} 学会 ${learnedName}${replacedText}${unlockText}。当前技能：${currentSkillsText || '无'}`);
    } else if (action === 'train') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      const attrAliases = {
        hp: 'hp',
        mp: 'mp',
        atk: 'atk',
        def: 'def',
        mag: 'mag',
        mdef: 'mdef',
        dex: 'dex',
        生命: 'hp',
        魔法值: 'mp',
        攻击: 'atk',
        防御: 'def',
        魔法: 'mag',
        魔御: 'mdef',
        敏捷: 'dex'
      };
      const validKeys = ['hp', 'mp', 'atk', 'def', 'mag', 'mdef', 'dex'];
      const attrRaw = String(clean?.attr || clean?.slot || '').trim();
      const key = attrAliases[attrRaw] || attrAliases[attrRaw.toLowerCase?.() ? attrRaw.toLowerCase() : attrRaw];
      if (!key || !validKeys.includes(key)) return fail('无效修炼属性');
      const reqCount = Math.max(1, Math.floor(Number(clean?.count ?? clean?.qty ?? 1)));
      pet.training = normalizePetTrainingRecord(pet.training);
      const curLv = Math.max(0, Math.floor(Number(pet.training[key] || 0)));
      let totalCost = 0;
      for (let i = 0; i < reqCount; i += 1) {
        totalCost += Math.max(1, Math.floor(10000 + (curLv + i) * 2000));
      }
      const ownedFruit = Math.max(0, Math.floor(Number((player.inventory || []).find((i) => i?.id === 'pet_training_fruit')?.qty || 0)));
      if (ownedFruit < reqCount) return fail(`宠物修炼果不足，需要${reqCount}个`);
      if (player.gold < totalCost) return fail(`金币不足，需要${totalCost}`);
      if (!removeItem(player, 'pet_training_fruit', reqCount)) return fail('扣除宠物修炼果失败');
      player.gold -= totalCost;
      pet.training[key] = curLv + reqCount;
      dirty = true;
      emitResult(true, reqCount > 1 ? `宠物修炼成功：${key} Lv${curLv}->Lv${pet.training[key]}` : `宠物修炼成功：${key} Lv${pet.training[key]}`);
    } else if (action === 'divine_advance') {
      const pet = getPetById(clean?.petId);
      if (!pet) return fail('宠物不存在');
      if (!isDivineBeastSpecies(pet.role)) return fail('仅生肖神兽可进阶');
      const owned = Math.max(0, Math.floor(Number((player.inventory || []).find((i) => i?.id === 'divine_beast_fragment')?.qty || 0)));
      if (owned < divineAdvanceCost) return fail(`神兽碎片不足，需要${divineAdvanceCost}个`);
      if (!removeItem(player, 'divine_beast_fragment', divineAdvanceCost)) return fail('扣除神兽碎片失败');
      if (!pet.aptitude || typeof pet.aptitude !== 'object') pet.aptitude = {};
      ['hp', 'atk', 'def', 'mag', 'agility'].forEach((key) => {
        const current = Math.max(1, Math.floor(Number(pet.aptitude?.[key] || 0)));
        pet.aptitude[key] = Math.max(current + 1, Math.floor(current * 1.1));
      });
      pet.growth = Number((Math.max(0.1, Number(pet.growth || 1)) * 1.1).toFixed(3));
      pet.skillSlots = Math.max(
        Math.floor(Number(pet.skillSlots || PET_BASE_SKILL_SLOTS)) + 1,
        Array.isArray(pet.skills) ? pet.skills.length : 0
      );
      pet.divineAdvanceCount = Math.max(0, Math.floor(Number(pet.divineAdvanceCount || 0))) + 1;
      dirty = true;
      if (logLoot) {
        logLoot(
          `[pet][divine_advance] ${player.name} pet=${pet.name}/${pet.id} tier=${pet.divineAdvanceCount} ` +
          `growth=${Number(pet.growth || 0).toFixed(3)} slots=${Number(pet.skillSlots || 0)}`
        );
      }
      emitResult(
        true,
        `神兽进阶成功：${pet.name} 已进阶 ${pet.divineAdvanceCount} 次｜成长 ${Number(pet.growth || 0).toFixed(3)}｜技能格 ${Number(pet.skillSlots || 0)}`
      );
    } else if (action === 'synthesize' || action === 'synthesis') {
      const mainPet = getPetById(clean?.mainPetId);
      const subPet = getPetById(clean?.subPetId);
      if (!mainPet || !subPet) return fail('宠物不存在');
      mainPet.equipment = normalizePetEquipmentState(mainPet.equipment);
      subPet.equipment = normalizePetEquipmentState(subPet.equipment);
      if (Object.values(subPet.equipment).some(Boolean)) return fail('副宠已穿戴装备，无法合成');
      if (mainPet.id === subPet.id) return fail('主宠和副宠不能相同');
      if (player.gold < PET_SYNTHESIS_COST_GOLD) return fail('金币不足');
      const beforeMain = JSON.parse(JSON.stringify(mainPet));
      const beforeSub = JSON.parse(JSON.stringify(subPet));
      player.gold -= PET_SYNTHESIS_COST_GOLD;

      // 梦幻风炼妖：固定主宠外形，副宠作为材料
      const basePet = mainPet;
      const feedPet = subPet;
      const baseRarity = PET_RARITY_ORDER.includes(String(basePet.rarity || '')) ? String(basePet.rarity) : 'normal';
      const growthRange = PET_RARITY_GROWTH_RANGE[baseRarity] || PET_RARITY_GROWTH_RANGE.normal;
      const aptRange = PET_RARITY_APTITUDE_RANGE[baseRarity] || PET_RARITY_APTITUDE_RANGE.normal;

      const mainGrowth = Number(basePet.growth || growthRange[0]);
      const subGrowth = Number(feedPet.growth || growthRange[0]);
      let growthMin = Math.min(mainGrowth, subGrowth) * 0.98;
      let growthMax = Math.max(mainGrowth, subGrowth) * 1.03;
      if (growthMax < growthMin) growthMax = growthMin;
      let nextGrowth = growthMin + Math.random() * Math.max(0, growthMax - growthMin);
      if (Math.random() < 0.08) {
        nextGrowth += 0.01 + Math.random() * 0.02; // 超成长
      }
      basePet.growth = Number(Math.max(growthRange[0], Math.min(growthRange[1], nextGrowth)).toFixed(3));

      if (!basePet.aptitude || typeof basePet.aptitude !== 'object') basePet.aptitude = {};
      ['hp', 'atk', 'def', 'mag', 'agility'].forEach((key) => {
        const parentA = Math.floor(Number(basePet?.aptitude?.[key] || aptRange[key][0]));
        const parentB = Math.floor(Number(feedPet?.aptitude?.[key] || aptRange[key][0]));
        let rollMin = Math.floor(Math.min(parentA, parentB) * 0.9);
        let rollMax = Math.floor(Math.max(parentA, parentB) * 1.1);
        if (rollMax < rollMin) rollMax = rollMin;
        let rolled = randInt(Math.max(1, rollMin), Math.max(1, rollMax));
        if (Math.random() < 0.12) {
          const burstFactor = 1.03 + Math.random() * 0.05;
          rolled = Math.floor(rolled * burstFactor);
        }
        basePet.aptitude[key] = Math.max(
          aptRange[key][0],
          Math.min(aptRange[key][1], rolled)
        );
      });
      const baseBattleType = normalizePetBattleType({ battleType: basePet.battleType }, basePet.aptitude);
      basePet.battleType = baseBattleType;
      biasSynthesizedPetAptitudeByBattleType(basePet, aptRange, baseBattleType);

      const mainSkills = Array.isArray(basePet.skills) ? basePet.skills : [];
      const subSkills = Array.isArray(feedPet.skills) ? feedPet.skills : [];
      const skillPool = Array.from(new Set([...mainSkills, ...subSkills]
        .map((id) => String(id || '').trim())
        .filter((id) => id && getPetSkillDef(id))));

      const mainSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.floor(Number(basePet.skillSlots || PET_BASE_SKILL_SLOTS)));
      const subSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.floor(Number(feedPet.skillSlots || PET_BASE_SKILL_SLOTS)));
      const parentMinSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.min(mainSlots, subSlots));
      const parentMaxSlots = Math.max(parentMinSlots, Math.min(PET_MAX_SKILL_SLOTS, Math.max(mainSlots, subSlots)));
      // 梦幻风炼妖不做父母最大格数保底：先在父母区间随机，再小概率扩格
      let nextSkillSlots = randInt(parentMinSlots, parentMaxSlots);
      if (Math.random() < 0.35) {
        nextSkillSlots += 1;
      }
      if (Math.random() < 0.10) {
        nextSkillSlots += 1;
      }
      nextSkillSlots = Math.max(PET_BASE_SKILL_SLOTS, Math.min(PET_MAX_SKILL_SLOTS, nextSkillSlots));
      const slotDelta = nextSkillSlots - mainSlots;
      basePet.skillSlots = nextSkillSlots;

      let inheritCount = randInt(2, 4);
      if (skillPool.length >= 6 && Math.random() < 0.35) inheritCount += 1;
      if (skillPool.length >= 8 && Math.random() < 0.2) inheritCount += 1;
      inheritCount = skillPool.length <= 0
        ? 0
        : Math.max(1, Math.min(inheritCount, nextSkillSlots, skillPool.length));

      const remainingPool = skillPool.slice();
      const nextSkills = [];
      while (remainingPool.length > 0 && nextSkills.length < inheritCount) {
        const idx = randInt(0, remainingPool.length - 1);
        nextSkills.push(remainingPool.splice(idx, 1)[0]);
      }
      basePet.skills = nextSkills;

      // 炼妖后重置等级，重新养成
      basePet.level = 1;
      basePet.exp = 0;

      petState.pets = petState.pets.filter((pet) => pet.id !== feedPet.id);
      if (petState.activePetId === feedPet.id) {
        petState.activePetId = basePet.id;
      }
      dirty = true;
      let slotText = '';
      if (slotDelta > 0) slotText = ` | slot +${slotDelta}`;
      else if (slotDelta < 0) slotText = ` | slot ${slotDelta}`;
      if (logLoot) {
        logLoot(
          `[pet][alchemy] ${player.name} main=${beforeMain.name}/${beforeMain.id} sub=${beforeSub.name}/${beforeSub.id} ` +
          `growth:${Number(beforeMain.growth || 0).toFixed(3)}+${Number(beforeSub.growth || 0).toFixed(3)}->${Number(basePet.growth || 0).toFixed(3)} ` +
          `slots:${Number(beforeMain.skillSlots || 0)}|${Number(beforeSub.skillSlots || 0)}->${Number(basePet.skillSlots || 0)} ` +
          `skills:${(Array.isArray(beforeMain.skills) ? beforeMain.skills.length : 0)}|${(Array.isArray(beforeSub.skills) ? beforeSub.skills.length : 0)}->${(Array.isArray(basePet.skills) ? basePet.skills.length : 0)} ` +
          `rarity=${baseRarity}`
        );
      }
      const activityMsgs = recordTreasurePetFestivalActivity(player, { petSyntheses: 1 });
      activityMsgs.forEach((msg) => player.send?.(msg));
      emitResult(true, `合宠成功：${basePet.name}｜成长 ${basePet.growth.toFixed(3)}｜技能 ${basePet.skills.length}/${basePet.skillSlots}${slotText}`);
    } else if (action === 'synthesize_below_epic') {
      const epicIndex = PET_RARITY_ORDER.indexOf('epic');
      if (epicIndex < 0) return fail('未配置史诗稀有度');
      let synthCount = 0;
      let stopReason = '宠物数量不足';
      for (let i = 0; i < 1000; i += 1) {
        const candidates = (Array.isArray(petState.pets) ? petState.pets : [])
          .filter((pet) => pet && pet.id !== petState.activePetId)
          .filter((pet) => {
            const eq = normalizePetEquipmentState(pet.equipment);
            return !Object.values(eq).some(Boolean);
          })
          .filter((pet) => {
            const idx = petRarityIndex(pet.rarity);
            return idx >= 0 && idx < epicIndex;
          })
          .sort((a, b) => {
            const r = petRarityIndex(a.rarity) - petRarityIndex(b.rarity);
            if (r !== 0) return r;
            const lv = Number(a.level || 1) - Number(b.level || 1);
            if (lv !== 0) return lv;
            return String(a.id || '').localeCompare(String(b.id || ''));
          });
        if (candidates.length < 2) {
          stopReason = '宠物数量不足';
          break;
        }
        if (player.gold < PET_SYNTHESIS_COST_GOLD) {
          stopReason = '金币不足';
          break;
        }
        const result = synthesizePetPair(candidates[0], candidates[1]);
        if (!result.ok) {
          stopReason = result.msg || '合宠失败';
          break;
        }
        synthCount += 1;
      }
      if (synthCount <= 0) return fail(stopReason);
      const remainCount = (Array.isArray(petState.pets) ? petState.pets : [])
        .filter((pet) => pet && pet.id !== petState.activePetId)
        .filter((pet) => {
          const idx = petRarityIndex(pet.rarity);
          return idx >= 0 && idx < epicIndex;
        }).length;
      const activityMsgs = recordTreasurePetFestivalActivity(player, { petSyntheses: synthCount });
      activityMsgs.forEach((msg) => player.send?.(msg));
      emitResult(true, `批量合宠完成：${synthCount}次｜消耗金币 ${synthCount * PET_SYNTHESIS_COST_GOLD}｜剩余史诗以下 ${remainCount}｜停止原因：${stopReason}`);
    } else {
      return fail('未知宠物操作');
    }

      if (!dirty) return;
      normalizePetState(player);
      await sendState(player);
      await savePlayer(player);
    } catch (err) {
      console.error('[pet_action] failed:', err);
      emitResult(false, String(err?.message || '宠物操作失败。'));
    }
  });

  socket.on('character_action', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const { clean } = sanitizePayload(payload, ['action', 'targetUsername', 'targetPassword', 'newName'], 'character_action');
    const action = String(clean?.action || '').trim().toLowerCase();
    if (action === 'rename') {
      const oldName = String(player.name || '').trim();
      const targetName = String(clean?.newName || '').trim();
      const nameResult = validatePlayerName(targetName);
      if (!nameResult.ok) {
        socket.emit('character_action_result', { ok: false, msg: nameResult.error || '角色名不合法。' });
        return;
      }
      const finalName = String(nameResult.value || '').trim();
      if (!finalName || finalName === oldName) {
        socket.emit('character_action_result', { ok: false, msg: '新角色名不能与当前相同。' });
        return;
      }
      if (getTradeByPlayerAny(oldName, player.realmId || 1).trade) {
        socket.emit('character_action_result', { ok: false, msg: '交易状态中无法改名，请先取消交易。' });
        return;
      }
      if (!removeItem(player, 'rename_card', 1)) {
        socket.emit('character_action_result', { ok: false, msg: '改名需要改名卡 x1。' });
        return;
      }
      try {
        if (playersByName(finalName, player.realmId || 1)) {
          addItem(player, 'rename_card', 1);
          socket.emit('character_action_result', { ok: false, msg: '该角色名已在线。' });
          return;
        }
        const existed = await findCharacterByName(finalName);
        if (existed) {
          addItem(player, 'rename_card', 1);
          socket.emit('character_action_result', { ok: false, msg: '该角色名已存在。' });
          return;
        }
        await renameCharacterEverywhere({
          userId: player.userId,
          realmId: player.realmId || 1,
          oldName,
          newName: finalName
        });
        await applyOnlineCharacterRename(player, finalName);
        player.forceStateRefresh = true;
        await sendState(player);
        await savePlayer(player);
        socket.emit('character_action_result', {
          ok: true,
          action: 'rename',
          oldName,
          newName: finalName,
          msg: `角色改名成功：${oldName} -> ${finalName}`
        });
      } catch (err) {
        addItem(player, 'rename_card', 1);
        socket.emit('character_action_result', {
          ok: false,
          action: 'rename',
          msg: String(err?.message || '改名失败。')
        });
      }
      return;
    }
    if (action !== 'migrate') {
      socket.emit('character_action_result', { ok: false, msg: '未知角色操作。' });
      return;
    }

    const targetUsername = String(clean?.targetUsername || '').trim();
    const targetPassword = String(clean?.targetPassword || '');
    if (!targetUsername || !targetPassword) {
      socket.emit('character_action_result', { ok: false, msg: '请输入目标账号和密码。' });
      return;
    }
    if (Number(player.yuanbao || 0) < CHARACTER_MIGRATE_YUANBAO_COST) {
      socket.emit('character_action_result', { ok: false, msg: `角色迁移需要 ${CHARACTER_MIGRATE_YUANBAO_COST} 元宝。` });
      return;
    }

    let charged = false;
    const prevYuanbao = Number(player.yuanbao || 0);
    try {
      const targetUser = await verifyUser(targetUsername, targetPassword);
      if (!targetUser) {
        socket.emit('character_action_result', { ok: false, msg: '目标账号或密码错误。' });
        return;
      }
      if (Number(targetUser.id || 0) === Number(player.userId || 0)) {
        socket.emit('character_action_result', { ok: false, msg: '目标账号不能是当前账号。' });
        return;
      }
      const targetHasOnline = Array.from(players.values()).some((p) => p && Number(p.userId || 0) === Number(targetUser.id || 0));
      if (targetHasOnline) {
        socket.emit('character_action_result', { ok: false, msg: '目标账号当前有角色在线，请先下线后再迁移。' });
        return;
      }

      player.yuanbao = Math.max(0, Number(player.yuanbao || 0) - CHARACTER_MIGRATE_YUANBAO_COST);
      charged = true;
      player.forceStateRefresh = true;
      await savePlayer(player, { immediate: true });

      await migrateCharacterToUser({
        realmId: player.realmId || 1,
        charName: player.name,
        targetUserId: targetUser.id,
        allowOnline: true
      });

      player.userId = Number(targetUser.id || 0);
      player.send(`角色迁移成功，已扣除 ${CHARACTER_MIGRATE_YUANBAO_COST} 元宝，请重新登录目标账号。`);
      socket.emit('character_action_result', {
        ok: true,
        msg: `角色已迁移到账号【${targetUsername}】，已扣除 ${CHARACTER_MIGRATE_YUANBAO_COST} 元宝，请重新登录。`
      });
      setTimeout(() => {
        try { socket.disconnect(true); } catch {}
      }, 300);
    } catch (err) {
      if (charged && players.get(socket.id) === player) {
        player.yuanbao = Math.max(0, prevYuanbao);
        player.forceStateRefresh = true;
        await savePlayer(player).catch(() => {});
        await sendState(player).catch(() => {});
      }
      socket.emit('character_action_result', { ok: false, msg: String(err?.message || err || '角色迁移失败。') });
    }
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
    const { clean } = sanitizePayload(payload, ['toName', 'title', 'body', 'items', 'gold'], 'mail_send');
    const toName = String(clean?.toName || '').trim();
    const title = String(clean?.title || '').trim();
    const body = String(clean?.body || '').trim();
    const itemsPayload = Array.isArray(clean?.items) ? clean.items : [];
    const gold = Math.max(0, Number(clean?.gold || 0));
    if (!toName) return socket.emit('mail_send_result', { ok: false, msg: '请输入收件人。' });
    if (!title) return socket.emit('mail_send_result', { ok: false, msg: '请输入邮件标题。' });
    if (!body) return socket.emit('mail_send_result', { ok: false, msg: '请输入邮件内容。' });

    let target = await findCharacterByNameInRealm(toName, player.realmId || 1);
    if (!target) {
      const anyTarget = await findCharacterByName(toName);
      if (anyTarget) {
        return socket.emit('mail_send_result', { ok: false, msg: '邮件只能发送给同区服玩家。' });
      }
      return socket.emit('mail_send_result', { ok: false, msg: '收件人不存在。' });
    }

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
          if (item.untradable || item.unconsignable || item.unmail || isBoundHighTierEquipment(item) || isGrowthMaterialLockedItem(slot.id)) {
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
          if (!removeItem(player, slot.id, qty, slot.effects, slot.durability ?? null, slot.max_durability ?? null, slot.refine_level ?? null, slot.base_roll_pct ?? null, slot.growth_level ?? null, slot.growth_fail_stack ?? null)) {
            return socket.emit('mail_send_result', { ok: false, msg: '附件数量超过背包数量。' });
          }
        items.push({
          id: slot.id,
          qty,
          effects: slot.effects || null,
          durability: slot.durability ?? null,
          max_durability: slot.max_durability ?? null,
          refine_level: slot.refine_level ?? null,
          base_roll_pct: slot.base_roll_pct ?? null,
          growth_level: slot.growth_level ?? null,
          growth_fail_stack: slot.growth_fail_stack ?? null
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
            entry.refine_level ?? null,
            entry.base_roll_pct ?? null,
            entry.growth_level ?? null,
            entry.growth_fail_stack ?? null
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
          entry.refine_level ?? null,
          entry.base_roll_pct ?? null,
          entry.growth_level ?? null,
          entry.growth_fail_stack ?? null
        );
      });
    }
    if (gold > 0) {
      player.gold += gold;
    }
    await markMailClaimed(player.userId, mailId, player.realmId || 1);
    await markMailRead(player.userId, mailId, player.realmId || 1);
    socket.emit('mail_claim_result', { ok: true, msg: '领取成功：附件已到账。' });
    const refreshedMails = await listMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: refreshedMails.map(buildMailPayload) });
    await sendState(player);
    await savePlayer(player);
  });

  socket.on('mail_claim_all', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    sanitizePayload(payload, [], 'mail_claim_all');
    const mails = await listMail(player.userId, player.realmId || 1);
    let claimedCount = 0;
    let gainedGold = 0;
    let gainedItems = 0;
    for (const mail of mails) {
      if (!mail || mail.claimed_at) continue;
      const items = parseJson(mail.items_json, []);
      const gold = Number(mail.gold || 0);
      const hasItems = Array.isArray(items) && items.length > 0;
      const hasGold = gold > 0;
      if (!hasItems && !hasGold) continue;
      if (hasItems) {
        items.forEach((entry) => {
          if (!entry || !entry.id) return;
          const qty = Math.max(1, Math.floor(Number(entry.qty || 1)));
          addItem(
            player,
            entry.id,
            qty,
            entry.effects || null,
            entry.durability ?? null,
            entry.max_durability ?? null,
            entry.refine_level ?? null,
            entry.base_roll_pct ?? null,
            entry.growth_level ?? null,
            entry.growth_fail_stack ?? null
          );
          gainedItems += qty;
        });
      }
      if (hasGold) {
        player.gold += gold;
        gainedGold += gold;
      }
      await markMailClaimed(player.userId, mail.id, player.realmId || 1);
      await markMailRead(player.userId, mail.id, player.realmId || 1);
      claimedCount += 1;
    }
    if (claimedCount <= 0) {
      return socket.emit('mail_claim_result', { ok: false, msg: '没有可领取的附件。' });
    }
    socket.emit('mail_claim_result', { ok: true, msg: `一键领取成功：已领取 ${claimedCount} 封邮件附件（金币+${gainedGold}，物品+${gainedItems}）。` });
    const refreshedMails = await listMail(player.userId, player.realmId || 1);
    socket.emit('mail_list', { ok: true, mails: refreshedMails.map(buildMailPayload) });
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
    const building = await getGuildBuildingInfo(player.guild.id);
    if (building) syncGuildMetaToOnlineMembers(player.guild.id, building);
    const buildingPayload = building
      ? {
          ...building,
          donationLimits: getGuildDonateDailyInfo(player)
        }
      : null;
    const members = await listGuildMembers(player.guild.id, player.realmId || 1);
    const online = listOnlinePlayers(player.realmId || 1);
    const memberList = members.map((m) => ({
      name: m.char_name,
      role: m.role,
      online: online.some((p) => p.name === m.char_name),
      managed: online.some((p) => p.name === m.char_name && isManagedHostedPlayer(p)),
      level: m.level || 1,
      classId: m.class_id || ''
    }));
    socket.emit('guild_members', {
      ok: true,
      guild: { id: player.guild.id, name: player.guild.name },
      guildId: player.guild.id,
      guildName: player.guild.name,
      role: player.guild.role || 'member',
      building: buildingPayload,
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
    const buildingInfo = await getGuildBuildingInfo(player.guild.id);
    const memberLimit = Math.max(1, Math.floor(Number(buildingInfo?.memberLimit || 20)));
    const currentMembers = await listGuildMembers(player.guild.id, player.realmId || 1);
    if (Array.isArray(currentMembers) && currentMembers.length >= memberLimit) {
      return socket.emit('guild_approve_result', { ok: false, msg: `行会人数已满（${currentMembers.length}/${memberLimit}），请先升级成员殿。` });
    }

    try {
      await approveGuildApplication(player.guild.id, targetApp.user_id, clean.charName, player.realmId || 1);
      socket.emit('guild_approve_result', { ok: true, msg: `已批准 ${clean.charName} 加入行会` });

      const onlineTarget = playersByName(clean.charName, player.realmId || 1);
      if (onlineTarget) {
        const guildRow = await getGuildById(player.guild.id);
        if (guildRow) attachGuildMeta(onlineTarget, guildRow, 'member');
        else onlineTarget.guild = { id: player.guild.id, name: player.guild.name, role: 'member' };
        computeDerived(onlineTarget);
        onlineTarget.forceStateRefresh = true;
        await sendState(onlineTarget);
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

  socket.on('guild_donate', async (payload) => {
    const player = players.get(socket.id);
    if (!player || !player.guild) {
      socket.emit('guild_donate_result', { ok: false, msg: '你不在行会中。' });
      return;
    }
    const guildConfig = getGuildSystemConfigSnapshot();
    const { clean } = sanitizePayload(payload, ['type'], 'guild_donate');
    const donateType = String(clean?.type || '').trim().toLowerCase();
    const donateDaily = getGuildDonateDailyInfo(player);
    let costGold = 0;
    let costPoints = 0;
    if (donateType === 'gold') {
      if (donateDaily.gold.remaining <= 0) {
        socket.emit('guild_donate_result', { ok: false, msg: `今日金币捐献次数已达上限（${donateDaily.gold.limit}次）。`, building: player.guild ? { ...buildGuildBuildingPayload({ id: player.guild.id, build_exp: player.guild.buildExp || 0, build_gold: player.guild.buildGold || 0, build_points: player.guild.buildPoints || 0, build_branch_levels: player.guild.buildBranchLevels || null, build_upgrade_started_at: player.guild.buildUpgradeStartedAt || null, build_upgrade_ends_at: player.guild.buildUpgradeEndsAt || null, build_upgrade_branch: player.guild.buildUpgradeBranch || null }), donationLimits: donateDaily } : null });
        return;
      }
      costGold = Math.max(0, Math.floor(Number(guildConfig.donateCost?.gold || 0)));
      if (Number(player.gold || 0) < costGold) {
        socket.emit('guild_donate_result', { ok: false, msg: `金币不足，捐献需要 ${costGold} 金币。` });
        return;
      }
      player.gold -= costGold;
    } else if (donateType === 'points') {
      if (donateDaily.points.remaining <= 0) {
        socket.emit('guild_donate_result', { ok: false, msg: `今日活动积分捐献次数已达上限（${donateDaily.points.limit}次）。`, building: player.guild ? { ...buildGuildBuildingPayload({ id: player.guild.id, build_exp: player.guild.buildExp || 0, build_gold: player.guild.buildGold || 0, build_points: player.guild.buildPoints || 0, build_branch_levels: player.guild.buildBranchLevels || null, build_upgrade_started_at: player.guild.buildUpgradeStartedAt || null, build_upgrade_ends_at: player.guild.buildUpgradeEndsAt || null, build_upgrade_branch: player.guild.buildUpgradeBranch || null }), donationLimits: donateDaily } : null });
        return;
      }
      costPoints = Math.max(0, Math.floor(Number(guildConfig.donateCost?.points || 0)));
      const spendResult = spendActivityPoints(player, costPoints);
      if (!spendResult.ok) {
        socket.emit('guild_donate_result', { ok: false, msg: spendResult.error || '活动积分不足。' });
        return;
      }
    } else {
      socket.emit('guild_donate_result', { ok: false, msg: '无效捐献类型。' });
      return;
    }
    const donateState = normalizeGuildDonateDailyState(player);
    if (donateType === 'gold') donateState.goldCount = Math.max(0, Math.floor(Number(donateState.goldCount || 0))) + 1;
    if (donateType === 'points') donateState.pointsCount = Math.max(0, Math.floor(Number(donateState.pointsCount || 0))) + 1;
    const contributionGain = donateType === 'gold'
      ? Math.max(0, Math.floor(Number(guildConfig.contributionGain?.gold || 0)))
      : Math.max(0, Math.floor(Number(guildConfig.contributionGain?.points || 0)));
    player.flags.guildContribution = normalizeGuildContribution(player) + contributionGain;
    const building = await addGuildBuildingContribution(player.guild.id, { gold: costGold, points: costPoints });
    if (building) syncGuildMetaToOnlineMembers(player.guild.id, building);
    player.forceStateRefresh = true;
    await sendState(player);
    await savePlayer(player);
    const resultBuilding = building
      ? {
          ...building,
          donationLimits: getGuildDonateDailyInfo(player)
        }
      : null;
    socket.emit('guild_donate_result', {
      ok: true,
      msg: donateType === 'gold'
        ? `行会建设捐献成功：投入 ${costGold} 金币，获得 ${contributionGain} 行会贡献，建设等级 Lv${building?.level || 0}。`
        : `行会建设捐献成功：投入 ${costPoints} 活动积分，获得 ${contributionGain} 行会贡献，建设等级 Lv${building?.level || 0}。`,
      building: resultBuilding
    });
  });

  socket.on('guild_build_upgrade', async (payload) => {
    const player = players.get(socket.id);
    if (!player || !player.guild) {
      socket.emit('guild_build_upgrade_result', { ok: false, msg: '你不在行会中。' });
      return;
    }
    const isLeaderOrVice = await isGuildLeaderOrVice(player.guild.id, player.userId, player.name, player.realmId || 1);
    if (!isLeaderOrVice) {
      socket.emit('guild_build_upgrade_result', { ok: false, msg: '只有会长或副会长可以发起行会建筑升级。' });
      return;
    }
    const { clean } = sanitizePayload(payload, ['branchId'], 'guild_build_upgrade');
    const branchId = String(clean?.branchId || '').trim().toLowerCase() || 'exp';
    const result = await startGuildBuildingUpgrade(player.guild.id, branchId);
    if (result.building) syncGuildMetaToOnlineMembers(player.guild.id, result.building);
    player.forceStateRefresh = true;
    await sendState(player);
    await savePlayer(player);
    const activeBranch = (result.building?.branches || []).find((entry) => entry.id === result.building?.activeUpgradeBranch);
    socket.emit('guild_build_upgrade_result', {
      ok: Boolean(result.ok),
      msg: result.ok
        ? `${activeBranch?.label || '行会建筑'}已开始升级，预计 ${Math.max(0, Number(activeBranch?.nextDurationSec || result.building?.nextDurationSec || 0))} 秒后完成。`
        : (result.error || '行会建筑升级发起失败。'),
      building: result.building || null
    });
  });

  socket.on('guild_shop_buy', async (payload) => {
    const player = players.get(socket.id);
    if (!player || !player.guild) {
      socket.emit('guild_shop_result', { ok: false, msg: '你不在行会中。' });
      return;
    }
    const guildConfig = getGuildSystemConfigSnapshot();
    const { clean } = sanitizePayload(payload, ['itemId'], 'guild_shop_buy');
    const itemId = String(clean?.itemId || '').trim();
    const item = (Array.isArray(guildConfig.shopItems) ? guildConfig.shopItems : []).find((entry) => entry.id === itemId);
    if (!item) {
      socket.emit('guild_shop_result', { ok: false, msg: '无效商城物品。' });
      return;
    }
    const currentContribution = normalizeGuildContribution(player);
    if (currentContribution < item.cost) {
      socket.emit('guild_shop_result', { ok: false, msg: `行会贡献不足，需要 ${item.cost}。` });
      return;
    }
    const addResult = addItem(player, item.id, item.qty);
    if (!addResult?.ok) {
      socket.emit('guild_shop_result', { ok: false, msg: addResult?.error || '奖励发放失败。' });
      return;
    }
    player.flags.guildContribution = currentContribution - item.cost;
    player.forceStateRefresh = true;
    await sendState(player);
    await savePlayer(player);
    socket.emit('guild_shop_result', {
      ok: true,
      msg: `兑换成功：${item.name} x${item.qty}，消耗 ${item.cost} 行会贡献。`,
      itemId: item.id
    });
  });

  socket.on('commission_claim', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const { clean } = sanitizePayload(payload, ['taskId'], 'commission_claim');
    const taskId = String(clean?.taskId || '').trim().toLowerCase() || 'all';
    const result = claimCommissionTask(player, taskId);
    player.forceStateRefresh = true;
    await sendState(player);
    await savePlayer(player);
    socket.emit('commission_result', {
      ok: Boolean(result.ok),
      msg: result.ok
        ? `委托奖励已领取：获得活动积分 ${Math.max(0, Math.floor(Number(result.points || 0)))}。`
        : (result.error || '委托奖励领取失败。'),
      taskIds: result.taskIds || []
    });
  });

  socket.on('specialization_set', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const { clean } = sanitizePayload(payload, ['trackId'], 'specialization_set');
    const trackId = String(clean?.trackId || '').trim();
    const defs = SPECIALIZATION_DEFS[player.classId] || [];
    const picked = defs.find((entry) => entry.id === trackId);
    if (!picked) {
      socket.emit('specialization_result', { ok: false, msg: '无效专精路线。' });
      return;
    }
    if (!player.flags) player.flags = {};
    if (!player.flags.specialization || typeof player.flags.specialization !== 'object') {
      player.flags.specialization = {};
    }
    player.flags.specialization.trackId = trackId;
    computeDerived(player);
    player.forceStateRefresh = true;
    await sendState(player);
    await savePlayer(player);
    socket.emit('specialization_result', { ok: true, msg: `已切换到 ${picked.name}。`, trackId });
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
    const isLeaderOrVice = player.guild && (
      player.guild.role === 'leader' ||
      player.guild.role === 'vice_leader' ||
      player.guild.role === 'vice'
    );
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
        const oldDeviceKey = player.deviceKey;
        const svipActive = Boolean(isSvipActive(player));
        const shouldKeepManagedAuto = Boolean(svipActive && player.flags.autoFullEnabled);
        const shouldKeepManagedPending = Boolean(svipActive && !player.flags.autoFullEnabled);
        if (!shouldKeepManagedAuto && !shouldKeepManagedPending) {
          player.flags.offlineAt = Date.now();
          if (player.flags.offlineManagedAuto) delete player.flags.offlineManagedAuto;
          if (player.flags.offlineManagedAt) delete player.flags.offlineManagedAt;
          if (player.flags.offlineManagedPending) delete player.flags.offlineManagedPending;
          if (player.flags.offlineManagedStartAt) delete player.flags.offlineManagedStartAt;
        } else {
          player.flags.offlineAt = null;
          if (shouldKeepManagedAuto) {
            player.flags.offlineManagedAuto = true;
            player.flags.offlineManagedAt = Date.now();
            if (player.flags.offlineManagedPending) delete player.flags.offlineManagedPending;
            if (player.flags.offlineManagedStartAt) delete player.flags.offlineManagedStartAt;
          } else {
            if (player.flags.offlineManagedAuto) delete player.flags.offlineManagedAuto;
            player.flags.offlineManagedPending = true;
            player.flags.offlineManagedStartAt = Date.now() + SVIP_AUTO_MANAGED_START_DELAY_MS;
            if (player.flags.offlineManagedAt) delete player.flags.offlineManagedAt;
          }
          player.socket = null;
          player.deviceKey = null;
          player.send = () => {};
        }
    const lookup = getTradeByPlayerAny(player.name, player.realmId || 1);
    const trade = lookup.trade;
    if (trade) {
      clearTrade(trade, `交易已取消（${player.name} 离线）。`, trade.realmId ?? lookup.realmId ?? (player.realmId || 1));
    }
      await savePlayer(player, { immediate: true });
      if (shouldKeepManagedAuto || shouldKeepManagedPending) {
        compactManagedPlayerState(player);
      }
      if (!shouldKeepManagedAuto && !shouldKeepManagedPending) {
        getRealmState(player.realmId || 1).lastSaveTime.delete(player.name); // 清理保存时间记录
      }
      const throttleKey = getStateThrottleKey(player, socket);
      if (throttleKey) {
        stateThrottleLastSent.delete(throttleKey);
        stateThrottleLastExits.delete(throttleKey);
        stateThrottleLastRoom.delete(throttleKey);
        stateThrottleLastInBoss.delete(throttleKey);
      }
      if (!shouldKeepManagedAuto && !shouldKeepManagedPending) {
        // 从在线玩家称号Map中移除
        onlinePlayerRankTitles.delete(player.name);
      }
      if (oldDeviceKey && deviceOnlineMap.get(oldDeviceKey) === socket.id) {
        deviceOnlineMap.delete(oldDeviceKey);
      }
      if (!shouldKeepManagedAuto && !shouldKeepManagedPending) {
        players.delete(socket.id);
      }
    }
  });

  socket.on('mail_delete_all', async (payload) => {
    const player = players.get(socket.id);
    if (!player) return;
    const { clean } = sanitizePayload(payload, ['folder'], 'mail_delete_all');
    const folder = String(clean?.folder || 'inbox').toLowerCase() === 'sent' ? 'sent' : 'inbox';
    let deletedCount = 0;
    let skippedCount = 0;
    if (folder === 'inbox') {
      const mails = await listMail(player.userId, player.realmId || 1);
      for (const mail of mails) {
        const items = parseJson(mail?.items_json, []);
        const hasItems = Array.isArray(items) && items.length > 0;
        const hasGold = Number(mail?.gold || 0) > 0;
        if ((hasItems || hasGold) && !mail?.claimed_at) {
          skippedCount += 1;
          continue;
        }
        await deleteMail(player.userId, mail.id, player.realmId || 1, 'inbox');
        deletedCount += 1;
      }
      const refreshedMails = await listMail(player.userId, player.realmId || 1);
      socket.emit('mail_list', { ok: true, mails: refreshedMails.map(buildMailPayload) });
    } else {
      const sentMails = await listSentMail(player.userId, player.realmId || 1);
      for (const mail of sentMails) {
        await deleteMail(player.userId, mail.id, player.realmId || 1, 'sent');
        deletedCount += 1;
      }
      const refreshedSent = await listSentMail(player.userId, player.realmId || 1);
      socket.emit('mail_list', { ok: true, mails: refreshedSent.map(buildMailPayload), folder: 'sent' });
    }
    if (deletedCount <= 0 && skippedCount <= 0) {
      return socket.emit('mail_delete_result', { ok: false, msg: '没有可删除的邮件。' });
    }
    const skippedText = skippedCount > 0 ? `，未领取附件邮件跳过 ${skippedCount} 封` : '';
    socket.emit('mail_delete_result', { ok: true, msg: `一键删除完成：删除 ${deletedCount} 封${skippedText}。` });
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
    const heal = Math.max(1, Math.floor((target.max_hp || 0) * 0.01));
    applyHealing(target, heal);
    applyBuff(target, { key: 'moonFairyDefBuff', expiresAt: now + 1500, defMultiplier: 1.2 });
    applyBuff(target, { key: 'moonFairyMdefBuff', expiresAt: now + 1500, mdefMultiplier: 1.2 });
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
    const playerTargets = members.slice();
    const summonTargets = [];
    members.forEach((p) => {
      const summons = getAliveSummons(p);
      summons.forEach((summon) => summonTargets.push(summon));
    });
    const targets = playerTargets.concat(summonTargets);

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
        if (p.send && p.name && p.name !== player.name) {
          p.send(`${player.name} 自动为你施放 ${buffSkill.name}。`);
        }
      });
      if (!player.status) player.status = {};
      if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
      if (buffSkill.cooldown) {
        player.status.skillCooldowns[buffSkill.id] = Date.now();
      }
      player.send(`自动施放 ${buffSkill.name}，自己和召唤兽 ${duration} 秒内免疫所有伤害。`);
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
    const buffActive = playerTargets.every((p) => {
      const buff = p.status?.buffs?.[buffKey];
      if (!buff) return false;
      if (buff.expiresAt && buff.expiresAt < now + 5000) return false;
      return true;
    });
    if (buffActive) continue;

    player.mp = clamp(player.mp - buffSkill.mp, 0, player.max_mp);
    const duration = 60;
    const buffPayload = { key: buffKey, expiresAt: now + duration * 1000, [multiplierKey]: 1.1 };

    playerTargets.forEach((p) => {
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

function tryAutoSummon(player) {
  if (!player || player.hp <= 0) return false;
  if (!player.flags?.autoSkillId) return false;
  if (!isVipAutoEnabled(player)) return false;
  const skills = getLearnedSkills(player).filter((skill) => skill.type === 'summon');
  if (!skills.length) return false;

  const autoSkill = player.flags.autoSkillId;
  let allowedSummonSkills = [];
  if (autoSkill === 'all') {
    allowedSummonSkills = skills;
  } else if (Array.isArray(autoSkill)) {
    allowedSummonSkills = skills.filter((skill) => autoSkill.includes(skill.id));
  } else if (typeof autoSkill === 'string') {
    allowedSummonSkills = skills.filter((skill) => skill.id === autoSkill);
  }
  if (!allowedSummonSkills.length) return false;

  const now = Date.now();
  const aliveIds = new Set(getAliveSummons(player).map((summon) => summon.id));
  const candidates = allowedSummonSkills
    .filter((skill) => !aliveIds.has(skill.id))
    .filter((skill) => {
      if (player.mp < skill.mp) return false;
      if (!skill.cooldown) return true;
      const lastUse = Number(player.status?.skillCooldowns?.[skill.id] || 0);
      return lastUse + skill.cooldown <= now;
    });
  if (!candidates.length) return false;

  const lastSkillId = String(player.flags?.lastSummonSkill || '').trim();
  let summonSkill = null;
  if (lastSkillId) {
    summonSkill = candidates.find((skill) => skill.id === lastSkillId) || null;
  }
  if (!summonSkill) {
    candidates.sort((a, b) => getSkillLevel(player, b.id) - getSkillLevel(player, a.id));
    summonSkill = candidates[0] || null;
  }
  if (!summonSkill) return false;

  player.mp = clamp(player.mp - summonSkill.mp, 0, player.max_mp);
  if (summonSkill.cooldown) {
    if (!player.status) player.status = {};
    if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
    player.status.skillCooldowns[summonSkill.id] = now;
  }
  const skillLevel = getSkillLevel(player, summonSkill.id);
  const summon = summonStats(player, summonSkill, skillLevel);
  addOrReplaceSummon(player, { ...summon, exp: 0 });
  if (!player.flags) player.flags = {};
  player.flags.lastSummonSkill = summonSkill.id;
  player.send(`自动召唤 ${summon.name} (等级 ${summon.level})。`);
  return true;
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

function autoRepairEquipmentForSvip(player) {
  if (!player?.equipment) return false;
  let totalCost = 0;
  const targets = [];
  Object.values(player.equipment).forEach((equipped) => {
    if (!equipped || !equipped.id) return;
    const item = ITEM_TEMPLATES[equipped.id];
    if (!item) return;
    const maxDur = Number(equipped.max_durability || getDurabilityMax(item) || 0);
    if (maxDur <= 0) return;
    const curDur = equipped.durability == null ? maxDur : Number(equipped.durability || 0);
    const missing = Math.max(0, maxDur - curDur);
    if (missing <= 0) return;
    const cost = Math.max(0, Math.floor(getRepairCost(item, missing, player)));
    totalCost += cost;
    targets.push({ equipped, maxDur });
  });
  if (!targets.length) return false;
  if (Number(player.gold || 0) < totalCost) return false;
  player.gold = Math.max(0, Number(player.gold || 0) - totalCost);
  let changed = false;
  targets.forEach(({ equipped, maxDur }) => {
    if (equipped.durability == null || equipped.durability < maxDur) {
      equipped.max_durability = maxDur;
      equipped.durability = maxDur;
      changed = true;
    }
  });
  if (changed) {
    computeDerived(player);
    player.forceStateRefresh = true;
  }
  return changed;
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
  if (isSvipActive(player) && autoRepairEquipmentForSvip(player)) {
    broken = false;
  }
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
    player.flags.autoFullRepathAfterDeath = true;
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
    // removeMob 内部已通过 respawnStore.set 将数据加入批量队列
    // 只需处理跨服世界BOSS的特殊设置
    if (roomRealmId === CROSS_REALM_REALM_ID && removedMob.templateId === 'cross_world_boss') {
      try {
        await setCrossWorldBossRespawnAt(removedMob.respawnAt);
      } catch (err) {
        console.warn('Failed to persist cross world boss respawn:', err);
      }
    }
  }
  removeSummonedMobsByOwner(mob, roomRealmId, mobZoneId, mobRoomId);
  if (template?.summoned || mob.summoned || mob.status?.summoned) {
    return;
  }
  const towerFloor = getZhuxianTowerFloor(mobZoneId, mobRoomId);
  const towerRoomCleared = towerFloor > 0 && getAliveMobs(mobZoneId, mobRoomId, roomRealmId).length === 0;
  const towerClearOwner = towerRoomCleared
    ? (playersByName(lastHitSnapshot || player?.name, roomRealmId) || player)
    : null;
  gainSummonExp(player);
  let exp = template.exp;
  let gold = randInt(template.gold[0], template.gold[1]);
  if (isCultivationRoom(mobZoneId) && !isCultivationBoss(template)) {
    exp = Math.max(1, Math.floor(exp * 0.7));
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
  const isCrossWorldBoss = template.id === 'cross_world_boss';
  const isSabakBoss = Boolean(template.sabakBoss);
  const isMolongBoss = template.id === 'molong_boss';
  const isPersonalBoss = template.id === 'vip_personal_boss' || template.id === 'svip_personal_boss';
  const isCultivationBossMob = Boolean(template.id && template.id.startsWith('cultivation_boss_'));
  const isSpecialBossMob = isWorldBoss || isSabakBoss || isMolongBoss || isSpecialBoss(template);
  if (isCrossWorldBoss) {
    const killer = playersByName(lastHitSnapshot || player?.name, roomRealmId) || player;
    if (killer && killer.flags) {
      killer.flags.autoFullCrossBossCooldownUntil = Date.now() + AUTO_FULL_CROSS_BOSS_COOLDOWN_MS;
    }
  }
  if (isWorldBoss && !isPersonalBoss) {
    const nextKills = incrementWorldBossKills(1, roomRealmId);
    void setWorldBossKillCount(nextKills, roomRealmId).catch((err) => {
      console.warn('Failed to persist world boss kill count:', err);
    });
  }
  if (template.specialBoss && !template.worldBoss && !isPersonalBoss && !isCultivationBossMob) {
    const nextKills = incrementSpecialBossKills(1, roomRealmId);
    void setSpecialBossKillCount(nextKills, roomRealmId).catch((err) => {
      console.warn('Failed to persist special boss kill count:', err);
    });
  }
  if (isCultivationBossMob) {
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
  if (isBoss) {
    const activityMsgs = recordBossKillActivities({
      template,
      damageEntries: entries,
      lastHitName: lastHitSnapshot || null,
      playerResolver: (name) => playersByName(name, roomRealmId) || null
    });
    activityMsgs.forEach((entry) => {
      if (entry?.player?.send && entry?.text) entry.player.send(entry.text);
    });
  }
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
  const personalDropCap = getPersonalBossDropCap(mobZoneId, mobRoomId);
  const personalDropCapRank = personalDropCap ? (RARITY_RANK[personalDropCap] || 0) : 0;

  // 追踪传说和至尊装备掉落数量
  let legendaryDropCount = 0;
  let supremeDropCount = 0;
  let ultimateDropCount = 0;

    partyMembersForReward.forEach((member) => {
      const cultivationMult = cultivationRewardMultiplier(member);
      const rewardMult = totalRewardMultiplier({
        vipActive: isVipActive(member),
        svipActive: isSvipActive(member),
        guildActive: Boolean(member.guild),
        guildBuildRewardPct: Number(member.guild?.buildExpBonusPct || member.guild?.buildRewardBonusPct || 0),
        cultivationMult,
        treasureExpPct: Number(member.flags?.treasureExpBonusPct || 0)
      });
      const goldRewardMult = totalGoldRewardMultiplier({
        vipActive: isVipActive(member),
        svipActive: isSvipActive(member),
        guildActive: Boolean(member.guild),
        guildBuildGoldPct: Number(member.guild?.buildGoldBonusPct || 0),
        cultivationMult
      });
      const activityBonus = getMobRewardActivityBonus(member, template, Date.now(), { zoneId: mobZoneId, roomId: mobRoomId });
      const finalExp = Math.floor(shareExp * rewardMult * (activityBonus.expMult || 1));
      const finalGold = Math.floor(shareGold * goldRewardMult * (activityBonus.goldMult || 1));
      member.gold += finalGold;
      const leveled = gainExp(member, finalExp);
      const petExpResult = gainActivePetExp(member, finalExp);
      awardKill(member, mob.templateId);
      member.send(`队伍分配: 获得 ${finalExp} 经验和 ${finalGold} 金币。`);
      if (leveled) member.send('你升级了！');
      if (petExpResult?.leveled > 0) {
        member.send(`出战宠物升级 +${petExpResult.leveled}。`);
      }
      if (Array.isArray(petExpResult?.autoLearned) && petExpResult.autoLearned.length > 0) {
        member.send(`宠物领悟技能: ${petExpResult.autoLearned.map((s) => s.name).join('、')}。`);
      }
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

    const skipClassFirstDamageReward = mobZoneId === PERSONAL_BOSS_ZONE_ID
      || template?.id === 'vip_personal_boss'
      || template?.id === 'svip_personal_boss';
    if (isSpecialBossMob && entries.length && !skipClassFirstDamageReward) {
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
        const forcedCandidate = ITEM_TEMPLATES[forcedId];
        if (forcedCandidate && personalDropCapRank > 0) {
          const forcedRank = RARITY_RANK[rarityByPrice(forcedCandidate)] || 0;
          if (forcedRank > personalDropCapRank) return;
        }
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
      const drops = filterDropsByMaxRarity(dropLoot(template, vipDropBonus), personalDropCap);
      if (!drops.length) return;
      if (!isSpecialBoss && party && partyMembersForLoot.length > 0) {
        const distributed = distributeLootWithBonus(
          party,
          partyMembersForLoot,
          template,
          (member) => (isVipActive(member) ? 1.01 : 1),
          personalDropCap
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

  if (isBossMob(template) && dropTargets.length > 0) {
    dropTargets.forEach(({ player: owner, damageRatio }) => {
      if (!owner) return;
      const chanceBonus = Math.max(0.35, Math.min(1.5, Number(damageRatio || 1)));
      const pet = rollPetDropForBoss(template, chanceBonus);
      if (!pet) return;
      if (grantPetDropToPlayer(owner, pet, template) && owner?.userId) {
        lootOwnersToSave.add(owner);
      }
    });
  }
  if (isBossMob(template) && dropTargets.length > 0) {
    dropTargets.forEach(({ player: owner, damageRatio }) => {
      if (!owner) return;
      const chanceBonus = Math.max(0.35, Math.min(1.5, Number(damageRatio || 1)));
      const bookDrops = rollPetBookDropsForBoss(template, chanceBonus);
      if (!bookDrops.length) return;
      const petState = normalizePetState(owner);
      if (!petState) return;
      const labels = [];
      bookDrops.forEach((entry) => {
        const def = getPetBookDef(entry.bookId);
        if (!def) return;
        const qty = Math.max(1, Math.floor(Number(entry.qty || 1)));
        petState.books[def.id] = Math.max(0, Math.floor(Number(petState.books[def.id] || 0))) + qty;
        labels.push(`${def.skillName} x${qty}`);
        logLoot(`[loot][pet_book] ${owner.name} <- ${def.id} x${qty} (${template.id})`);
      });
      if (labels.length > 0) {
        owner.send(`宠物技能书掉落：${labels.join('、')}`);
        if (owner?.userId) lootOwnersToSave.add(owner);
      }
    });
  }
  // 金柳露掉落（所有BOSS）
  if (isBossMob(template) && dropTargets.length > 0) {
    dropTargets.forEach(({ player: owner, damageRatio }) => {
      if (!owner) return;
      const chanceBonus = Math.max(0.35, Math.min(1.5, Number(damageRatio || 1)));
      if (rollWillowDewDropForBoss(template, chanceBonus)) {
        addItem(owner, 'willow_dew', 1);
        owner.send('获得了金柳露 x1');
        logLoot(`[loot][willow_dew] ${owner.name} <- willow_dew x1 (${template.id})`);
        if (owner?.userId) lootOwnersToSave.add(owner);
      }
    });
  }

  if (towerRoomCleared && towerClearOwner) {
    const reward = await grantZhuxianTowerClearReward(towerClearOwner, towerFloor);
    if (reward.granted && towerClearOwner.userId) {
      lootOwnersToSave.add(towerClearOwner);
    }
    if (
      reward.granted &&
      towerClearOwner.position?.zone === mobZoneId &&
      towerClearOwner.position?.room === mobRoomId
    ) {
      const currentRoom = WORLD[mobZoneId]?.rooms?.[mobRoomId];
      const nextRoomRaw = currentRoom?.exits?.north;
      if (nextRoomRaw) {
        let nextZoneId = mobZoneId;
        let nextRoomId = nextRoomRaw;
        if (String(nextRoomRaw).includes(':')) {
          const [zid, rid] = String(nextRoomRaw).split(':');
          nextZoneId = zid;
          nextRoomId = rid;
        }
        if (nextZoneId === ZHUXIAN_TOWER_ZONE_ID && nextRoomId) {
          ensureZhuxianTowerRoom(nextRoomId);
          towerClearOwner.position.zone = nextZoneId;
          towerClearOwner.position.room = nextRoomId;
          towerClearOwner.combat = null;
          towerClearOwner.forceStateRefresh = true;
          towerClearOwner.send(`已自动进入诛仙浮图塔第${towerFloor + 1}层。`);
        }
      }
    }
  }

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
        const scalingBaseStats = specialBoss.status?.scalingBaseStats || specialBoss.status?.baseStats || null;
        const baseAtk = scalingBaseStats?.atk ?? tpl.atk ?? 0;
        const baseDef = scalingBaseStats?.def ?? tpl.def ?? 0;
        const baseMdef = scalingBaseStats?.mdef ?? tpl.mdef ?? 0;
        const baseMaxHp = scalingBaseStats?.max_hp ?? tpl.hp ?? 0;

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
        if (!specialBoss.status.scalingBaseStats) {
          specialBoss.status.scalingBaseStats = {
            max_hp: Math.floor(baseMaxHp),
            atk: Math.floor(baseAtk),
            def: Math.floor(baseDef),
            mdef: Math.floor(baseMdef)
          };
        }

        // 如果有HP加成，应用到max_hp
        specialBoss.max_hp = Math.floor(baseMaxHp + hpBonus);
        specialBoss.hp = Math.min(specialBoss.hp, specialBoss.max_hp);
        specialBoss.status.baseStats.max_hp = specialBoss.max_hp;
      });
    });
  });
}

const COMBAT_STATE_FLUSH_BATCH_SIZE = 24;
const COMBAT_NON_CRITICAL_INTERVAL_MS = 5000;
const COMBAT_NON_CRITICAL_INTERVAL_NORMAL_MS = 6000;
const COMBAT_NON_CRITICAL_INTERVAL_AGGRESSIVE_MS = 9000;
const COMBAT_BOSS_SCALE_INTERVAL_MS = 3000;
const COMBAT_BOSS_SCALE_INTERVAL_NORMAL_MS = 4500;
const COMBAT_BOSS_SCALE_INTERVAL_AGGRESSIVE_MS = 7000;
const COMBAT_MANAGED_SHARDS = 3;
const COMBAT_MANAGED_SHARDS_NORMAL = 5;
const COMBAT_MANAGED_SHARDS_AGGRESSIVE = 8;
const COMBAT_MANAGED_AURA_INTERVAL_MS = 2500;
const combatStateDirtyQueue = new Set();
let combatStateFlushScheduled = false;
let combatStateFlushRunning = false;
let combatTickSeq = 0;
let combatLastBossScaleAt = 0;

function scheduleCombatStateFlush() {
  if (combatStateFlushScheduled) return;
  combatStateFlushScheduled = true;
  setTimeout(() => {
    flushCombatStateQueue().catch((err) => {
      console.warn('[state-flush] failed:', err?.message || err);
    });
  }, 0);
}

function enqueueCombatStateFlush(player) {
  if (!player) return;
  combatStateDirtyQueue.add(player);
  scheduleCombatStateFlush();
}

async function flushCombatStateQueue() {
  if (combatStateFlushRunning) {
    combatStateFlushScheduled = false;
    return;
  }
  combatStateFlushRunning = true;
  combatStateFlushScheduled = false;
  try {
    while (combatStateDirtyQueue.size > 0) {
      const batch = [];
      for (const player of combatStateDirtyQueue) {
        batch.push(player);
        combatStateDirtyQueue.delete(player);
        if (batch.length >= COMBAT_STATE_FLUSH_BATCH_SIZE) break;
      }
      if (batch.length <= 0) break;
      await Promise.allSettled(batch.map((player) => sendState(player)));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    combatStateFlushRunning = false;
    if (combatStateDirtyQueue.size > 0) {
      scheduleCombatStateFlush();
    }
  }
}

function hashCombatShardKey(text) {
  const str = String(text || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function shouldProcessManagedPlayerThisTick(player, shardIndex, shardCount = COMBAT_MANAGED_SHARDS) {
  const size = Math.max(1, Math.floor(Number(shardCount || 1)));
  if (size <= 1) return true;
  const key = player?.name || player?.id || '';
  if (!key) return true;
  return (hashCombatShardKey(key) % size) === (Math.max(0, shardIndex) % size);
}

async function combatTick() {
  const markStateDirty = (player) => {
    if (!player) return;
    enqueueCombatStateFlush(player);
  };
  combatTickSeq += 1;
  const tickNow = Date.now();
  const guardMode = getRuntimeGuardMode(tickNow);
  const managedShardCount = guardMode === 'aggressive'
    ? COMBAT_MANAGED_SHARDS_AGGRESSIVE
    : (guardMode === 'normal' ? COMBAT_MANAGED_SHARDS_NORMAL : COMBAT_MANAGED_SHARDS);
  const managedShardIndex = combatTickSeq % managedShardCount;
  const bossScaleIntervalMs = guardMode === 'aggressive'
    ? COMBAT_BOSS_SCALE_INTERVAL_AGGRESSIVE_MS
    : (guardMode === 'normal' ? COMBAT_BOSS_SCALE_INTERVAL_NORMAL_MS : COMBAT_BOSS_SCALE_INTERVAL_MS);
  const nonCriticalIntervalMs = guardMode === 'aggressive'
    ? COMBAT_NON_CRITICAL_INTERVAL_AGGRESSIVE_MS
    : (guardMode === 'normal' ? COMBAT_NON_CRITICAL_INTERVAL_NORMAL_MS : COMBAT_NON_CRITICAL_INTERVAL_MS);
  const online = listOnlinePlayers();
  const roomMobsCache = new Map();
  const regenRooms = new Set();

  // 特殊BOSS人数缩放改为低频执行，避免每秒全图扫描
  if (tickNow - combatLastBossScaleAt >= bossScaleIntervalMs) {
    updateSpecialBossStatsBasedOnPlayers();
    combatLastBossScaleAt = tickNow;
  }

  for (const player of online) {
    const now = Date.now();
    const isManagedPlayer = Boolean(!player?.socket && (player?.flags?.offlineManagedAuto || player?.flags?.offlineManagedPending));
    if (isManagedPlayer && !shouldProcessManagedPlayerThisTick(player, managedShardIndex, managedShardCount)) {
      continue;
    }
    if (!player?.socket && player?.flags?.offlineManagedPending) {
      const startAt = Number(player.flags.offlineManagedStartAt || 0);
      if (!isSvipActive(player)) {
        delete player.flags.offlineManagedPending;
        delete player.flags.offlineManagedStartAt;
        player.flags.offlineAt = now;
        continue;
      }
      if (startAt > now) {
        continue;
      }
      player.flags.autoFullEnabled = true;
      player.flags.autoFullManualDowngraded = false;
      player.flags.autoFullManualMoveAt = null;
      player.flags.autoFullManualRestoreAt = null;
      player.flags.offlineManagedAuto = true;
      player.flags.offlineManagedAt = now;
      delete player.flags.offlineManagedPending;
      delete player.flags.offlineManagedStartAt;
      savePlayer(player).catch(() => {});
      continue;
    }
    if (player.hp <= 0) {
      handleDeath(player);
      continue;
    }

    refreshBuffs(player);
    if (!isManagedPlayer || !player._managedAuraAt || (now - Number(player._managedAuraAt || 0)) >= COMBAT_MANAGED_AURA_INTERVAL_MS) {
      applyMoonFairyAura(player, online);
      if (isManagedPlayer) player._managedAuraAt = now;
    }
    processPotionRegen(player);
    updateRedNameAutoClear(player);
    tryRestoreAutoFullAfterManualDowngrade(player);
    downgradeAutoFullInZhuxianTower(player);
    if (!player._combatAuxAt || (now - Number(player._combatAuxAt || 0)) >= nonCriticalIntervalMs) {
      updateAutoDailyUsage(player);
      recordHarvestOnlineMinute(player);
      autoClaimActivityRewardsForPlayer(player, now).catch(() => {});
      normalizeZhuxianTowerProgress(player);
      ensureZhuxianTowerPosition(player);
      ensurePersonalBossPosition(player);
      player._combatAuxAt = now;
    }
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

    if (player.flags?.autoFullEnabled) {
      const bossMove = tryAutoFullBossMove(player);
      if (bossMove === 'moved') {
        player.combat = null;
        continue;
      }
    }

    if (!player.combat) {
      regenOutOfCombat(player);
      tryAutoSummon(player);
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
    tryAutoSummon(player);
    tryPendingResummon(player);
    tryAutoHeal(player);
    tryAutoBuff(player);

    if (player.status && player.status.stunTurns > 0) {
      if (tryResolvePetStun(player)) {
        // 宠物不屈触发则本回合可继续行动
      } else {
      player.status.stunTurns -= 1;
      player.send('你被麻痹，无法行动。');
      continue;
      }
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

    const hitChance = clamp(
      calcHitChance(player, target) + getPetHitChanceBonus(player) - getPetEvadeChanceBonus(target),
      0.05,
      0.98
    );
    if (Math.random() <= hitChance) {
      const targetEvadeChance = clamp((target.evadeChance || 0) + getPetEvadeChanceBonus(target), 0, 0.85);
      if (targetEvadeChance > 0 && Math.random() <= targetEvadeChance) {
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
      const now = Date.now();
      // 检查攻击者的弱化效果（来自破防戒指）
      if (player.status?.debuffs?.weak) {
        const weak = player.status.debuffs.weak;
        if (weak.expiresAt && weak.expiresAt < now) {
          delete player.status.debuffs.weak;
        } else {
          dmg = Math.floor(dmg * (1 - (weak.dmgReduction || 0)));
        }
      }
      dmg = applyPetOffenseModifiers(player, dmg, skill?.type || 'attack');
      const petCritResult = maybeApplyPetCrit(player, dmg);
      dmg = petCritResult.damage;
      if (petCritResult.crit) {
        player.send('宠物技能【会心】触发，造成暴击伤害！');
      }

        const damageDealt = applyDamageToPlayer(target, dmg);
        target.flags.lastCombatAt = Date.now();
        player.send(`你对 ${target.name} 造成 ${damageDealt} 点伤害。`);
        target.send(`${player.name} 对你造成 ${damageDealt} 点伤害。`);
        const counterChance = hasActivePetSkill(target, 'pet_counter_adv') ? PET_COMBAT_BALANCE.counterAdvChance :
                             hasActivePetSkill(target, 'pet_counter') ? PET_COMBAT_BALANCE.counterChance : 0;
        if (counterChance > 0 && Math.random() <= counterChance && player.hp > 0) {
          const counterRatio = hasActivePetSkill(target, 'pet_counter_adv') ? PET_COMBAT_BALANCE.counterAdvDamageRatio :
                              hasActivePetSkill(target, 'pet_counter') ? PET_COMBAT_BALANCE.counterDamageRatio : 0;
          const counterDmg = Math.max(1, Math.floor(Math.max(1, damageDealt) * counterRatio));
          const counterDealt = applyDamageToPlayer(player, counterDmg);
          target.send(`宠物技能【反击】触发，对 ${player.name} 反弹 ${counterDealt} 点伤害。`);
          player.send(`${target.name} 的宠物反击造成 ${counterDealt} 点伤害。`);
        }
        applyPetLifesteal(player, damageDealt);
        if (tryApplyPetMagicBreak(player, target)) {
          player.send(`宠物技能【破魔】触发，${target.name} 魔御降低。`);
        }
        if (tryTriggerPetArcaneEcho(player, skill) && target.hp > 0) {
          const echoRatio = hasActivePetSkill(player, 'pet_arcane_echo_adv') ? PET_COMBAT_BALANCE.arcaneEchoAdvDamageRatio :
                            hasActivePetSkill(player, 'pet_arcane_echo') ? PET_COMBAT_BALANCE.arcaneEchoDamageRatio : 0;
          const echoBase = Math.max(1, Math.floor(damageDealt * echoRatio));
          const echoDealt = applyDamageToPlayer(target, echoBase);
          player.send(`宠物技能【奥术回响】触发，追加 ${echoDealt} 点伤害。`);
          target.send(`你受到奥术回响追加伤害 ${echoDealt} 点。`);
          applyPetLifesteal(player, echoDealt);
        }
        if (skill && (skill.type === 'aoe' || skill.type === 'cleave')) {
          target.send('你受到群体技能伤害。');
        }
        if (hasComboWeapon(player) && target.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          const comboDealt = applyDamageToPlayer(target, dmg);
          target.flags.lastCombatAt = Date.now();
          player.send(`连击触发，对 ${target.name} 造成 ${comboDealt} 点伤害。`);
          target.send(`${player.name} 连击对你造成 ${comboDealt} 点伤害。`);
          applyPetLifesteal(player, comboDealt);
        }
        if (target.hp > 0 && shouldTriggerPetCombo(player)) {
          const comboRatio = hasActivePetSkill(player, 'pet_combo_adv') ? PET_COMBAT_BALANCE.comboAdvDamageRatio :
                             hasActivePetSkill(player, 'pet_combo') ? PET_COMBAT_BALANCE.comboDamageRatio : 0;
          const petComboDmg = Math.max(1, Math.floor(dmg * comboRatio));
          const petComboDealt = applyDamageToPlayer(target, petComboDmg);
          player.send(`宠物技能【连击】触发，对 ${target.name} 追加 ${petComboDealt} 点伤害。`);
          target.send(`你受到宠物连击追加伤害 ${petComboDealt} 点。`);
          applyPetLifesteal(player, petComboDealt);
        }
        if (tryApplyHealBlockEffect(player, target)) {
          target.send('你受到禁疗影响，回血降低。');
          player.send(`禁疗效果作用于 ${target.name}。`);
        }
        if (!target.combat || target.combat.targetType !== 'player' || target.combat.targetId !== player.name) {
          target.combat = { targetId: player.name, targetType: 'player', skillId: 'slash' };
        }
      tryTriggerTreasureAutoPassiveOnHit(player, target, { targetType: 'player', baseDamage: dmg });
      if (skill && skill.type === 'dot') {
        if (skill.id === 'poison') {
          const poisonTargets = online.filter((p) =>
            p.name !== player.name &&
            p.position.zone === player.position.zone &&
            p.position.room === player.position.room &&
            p.hp > 0 &&
            !((inCultivationRoom || inCrossBossRoom || inCrossRankRoom) && (p.realmId || 1) === (player.realmId || 1)) &&
            !(isSabakZone(player.position.zone) && player.guild && p.guild && String(player.guild.id) === String(p.guild.id)) &&
            !(myParty && myParty.members.includes(p.name))
          );
          let successCount = 0;
          poisonTargets.forEach((poisonTarget) => {
            if (!poisonTarget.status) poisonTarget.status = {};
            applyPoison(poisonTarget, 30, calcPoisonTickDamage(poisonTarget), player.name);
            applyPoisonDebuff(poisonTarget);
            poisonTarget.send('你中了施毒术。');
            successCount += 1;
          });
          player.send(successCount > 0 ? `施毒成功，命中 ${successCount} 个目标。` : '施毒失败。');
        } else {
          if (!target.status) target.status = {};
          applyPoison(target, 30, calcPoisonTickDamage(target), player.name);
          applyPoisonDebuff(target);
          player.send('施毒成功。');
          target.send('你中了施毒术。');
        }
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
            applyPetKillSoulOnKill(player);
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
      if (target.hp > 0) {
        applyPetAssistAttackToPlayer(player, target);
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
      tryTriggerTreasureAutoPassiveOnHit(player, target, { targetType: 'player', roomRealmId, baseDamage: 0 });
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
        applyPetKillSoulOnKill(player);
        handleDeath(target);
      }
      markStateDirty(player);
      markStateDirty(target);
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

    const hitChance = clamp(calcHitChance(player, mob) + getPetHitChanceBonus(player), 0.05, 0.98);
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
        const hasFalloff = skill.id === 'earth_spike' || skill.id === 'thunder' || skill.id === 'thunderstorm' || skill.id === 'savage';
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
            const falloffRatio = skill.id === 'thunderstorm' ? 0.7 : 0.5;
            aoeDmg = Math.max(1, Math.floor(aoeDmg * falloffRatio));
          }
          const elementAtk = Math.max(0, Math.floor(player.elementAtk || 0));
          if (elementAtk > 0) {
            aoeDmg += elementAtk * 10;
          }
          aoeDmg = applyPetOffenseModifiers(player, aoeDmg, skill?.type || 'aoe');
          const aoePetCrit = maybeApplyPetCrit(player, aoeDmg);
          aoeDmg = aoePetCrit.damage;
          const result = applyDamageToMob(target, aoeDmg, player.name, roomRealmId);
          if (result?.damageTaken) {
            player.send(`你对 ${target.name} 造成 ${aoeDmg} 点伤害。`);
            applyPetLifesteal(player, result.damageTaken);
            tryApplyPetMagicBreak(player, target);
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
        if (mob.hp > 0) {
          applyPetAssistAttackToMob(player, mob, roomRealmId, mobs);
        }
        const deadTargetsAfterPet = mobs.filter((target) => target.hp <= 0);
        if (deadTargetsAfterPet.length) {
          for (const target of deadTargetsAfterPet) {
            applyPetKillSoulOnKill(player);
            await processMobDeath(player, target, online);
          }
          if (deadTargetsAfterPet.some((target) => target.id === mob.id)) {
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
        dmg = applyPetOffenseModifiers(player, dmg, skill?.type || 'attack');
        const petCritResult = maybeApplyPetCrit(player, dmg);
        dmg = petCritResult.damage;
        if (petCritResult.crit) {
          player.send('宠物技能【会心】触发，造成暴击伤害！');
        }
        const result = applyDamageToMob(mob, dmg, player.name, roomRealmId);
        if (result?.damageTaken) {
          player.send(`你对 ${mob.name} 造成 ${dmg} 点伤害。`);
          applyPetLifesteal(player, result.damageTaken);
          tryApplyPetMagicBreak(player, mob);
          if (tryTriggerPetArcaneEcho(player, skill) && mob.hp > 0) {
            const echoRatio = hasActivePetSkill(player, 'pet_arcane_echo_adv') ? PET_COMBAT_BALANCE.arcaneEchoAdvDamageRatio :
                              hasActivePetSkill(player, 'pet_arcane_echo') ? PET_COMBAT_BALANCE.arcaneEchoDamageRatio : 0;
            const echoBase = Math.max(1, Math.floor(result.damageTaken * echoRatio));
            const echoResult = applyDamageToMob(mob, echoBase, player.name, roomRealmId);
            const echoDealt = Number(echoResult?.damageTaken || 0);
            if (echoDealt > 0) {
              player.send(`宠物技能【奥术回响】触发，追加 ${echoDealt} 点伤害。`);
              applyPetLifesteal(player, echoDealt);
            }
          }
        }
        if (hasComboWeapon(player) && mob.hp > 0 && Math.random() <= COMBO_PROC_CHANCE) {
          const comboResult = applyDamageToMob(mob, dmg, player.name, roomRealmId);
          if (comboResult?.damageTaken) {
            player.send(`连击触发，对 ${mob.name} 造成 ${dmg} 点伤害。`);
            applyPetLifesteal(player, comboResult.damageTaken);
          }
        }
        if (mob.hp > 0 && shouldTriggerPetCombo(player)) {
          const comboRatio = hasActivePetSkill(player, 'pet_combo_adv') ? PET_COMBAT_BALANCE.comboAdvDamageRatio :
                             hasActivePetSkill(player, 'pet_combo') ? PET_COMBAT_BALANCE.comboDamageRatio : 0;
          const petComboDmg = Math.max(1, Math.floor(dmg * comboRatio));
          const petComboResult = applyDamageToMob(mob, petComboDmg, player.name, roomRealmId);
          if (petComboResult?.damageTaken) {
            player.send(`宠物技能【连击】触发，对 ${mob.name} 追加 ${petComboResult.damageTaken} 点伤害。`);
            applyPetLifesteal(player, petComboResult.damageTaken);
          }
        }
        if (tryApplyHealBlockEffect(player, mob)) {
          player.send(`禁疗效果作用于 ${mob.name}。`);
        }
        if (mob.hp > 0) {
          applyPetAssistAttackToMob(player, mob, roomRealmId, mobs);
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
              applyPetKillSoulOnKill(player);
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
        if (skill.id === 'poison') {
          let successCount = 0;
          mobs.forEach((poisonMob) => {
            const immune = enforceSpecialBossDebuffImmunity(poisonMob, roomRealmId);
            if (immune) return;
            if (!poisonMob.status) poisonMob.status = {};
            applyPoison(poisonMob, 30, calcPoisonTickDamage(poisonMob), player.name);
            applyPoisonDebuff(poisonMob);
            successCount += 1;
          });
          player.send(successCount > 0 ? `施毒成功，命中 ${successCount} 个怪物。` : '施毒失败。');
        } else {
          if (!mob.status) mob.status = {};
          applyPoison(mob, 30, calcPoisonTickDamage(mob), player.name);
          applyPoisonDebuff(mob);
          player.send(`施毒成功：${mob.name} 中毒。`);
        }
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
          cleaveDmg = applyPetOffenseModifiers(player, cleaveDmg, 'cleave');
          const cleaveResult = applyDamageToMob(other, cleaveDmg, player.name, roomRealmId);
          if (cleaveResult?.damageTaken) {
            player.send(`你对 ${other.name} 造成 ${cleaveDmg} 点伤害。`);
            applyPetLifesteal(player, cleaveResult.damageTaken);
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
      applyPetKillSoulOnKill(player);
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
      const mobTargetEvadeChance = mobTarget?.userId
        ? clamp((mobTarget.evadeChance || 0) + getPetEvadeChanceBonus(mobTarget), 0, 0.85)
        : (mobTarget?.evadeChance || 0);
      if (!isBoss && !isWorldBoss && !isSpecialBoss && mobTarget && mobTargetEvadeChance && Math.random() <= mobTargetEvadeChance) {
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
        const counterChance = hasActivePetSkill(mobTarget, 'pet_counter_adv') ? PET_COMBAT_BALANCE.counterAdvChance :
                             hasActivePetSkill(mobTarget, 'pet_counter') ? PET_COMBAT_BALANCE.counterChance : 0;
        if (counterChance > 0 && Math.random() <= counterChance && mob.hp > 0) {
          const counterRatio = hasActivePetSkill(mobTarget, 'pet_counter_adv') ? PET_COMBAT_BALANCE.counterAdvDamageRatio :
                              hasActivePetSkill(mobTarget, 'pet_counter') ? PET_COMBAT_BALANCE.counterDamageRatio : 0;
          const counterDmg = Math.max(1, Math.floor(Math.max(1, damageDealt) * counterRatio));
          const counterResult = applyDamageToMob(mob, counterDmg, mobTarget.name, roomRealmId);
          if (counterResult?.damageTaken) {
            mobTarget.send(`宠物技能【反击】触发，对 ${mob.name} 反弹 ${counterResult.damageTaken} 点伤害。`);
          }
        }
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
    markStateDirty(player);

    // 每30秒保存一次玩家数据,避免频繁写入数据库
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
  await loadPetSettingsFromDb();
  await loadGuildBuildingConfig();
  await applyWorldBossSettings();
  await applyCultivationBossSettings();
  await applySpecialBossSettings();
  await applyPersonalBossSettings();
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
  await cleanupConsignmentHistory();
  scheduleAutoBackup();

  // 启动排行榜自动更新定时任务
  setupRankUpdate();

  // 启动每日幸运玩家定时任务
  setupDailyLucky();

  // 活动排行榜结算（每日/每周）自动发奖（邮件）
  setInterval(async () => {
    await runActivityRankingSettlements();
  }, 60 * 1000);
  await runActivityRankingSettlements();

  // 批量持久化队列配置
  const RESPAWN_PERSIST_BATCH_SIZE = 200; // 每批写入数量
  const RESPAWN_PERSIST_INTERVAL_MS = 10000; // 每10秒刷新一次，减少数据库压力
  const respawnUpsertQueue = new Map(); // 待写入队列 set操作
  const respawnDeleteQueue = new Map(); // 待删除队列 clear操作
  let respawnPersistTimer = null;
  let isPersisting = false;

  // 生成队列键
  function respawnQueueKey(realmId, zoneId, roomId, slotIndex) {
    return `${realmId}:${zoneId}:${roomId}:${slotIndex}`;
  }

  // 执行批量持久化
  async function flushRespawnPersistQueue() {
    if (isPersisting) return; // 防止并发执行
    if (respawnUpsertQueue.size === 0 && respawnDeleteQueue.size === 0) return;

    isPersisting = true;
    const upsertBatch = [];
    const deleteBatch = [];

    // 提取待写入记录（优先处理 upsert，同一 key 在 delete 队列中则移除 delete）
    for (const [key, record] of respawnUpsertQueue) {
      if (respawnDeleteQueue.has(key)) {
        // 如果同时有 set 和 clear，以 set 为准，移除 clear
        respawnDeleteQueue.delete(key);
      }
      upsertBatch.push(record);
      if (upsertBatch.length >= RESPAWN_PERSIST_BATCH_SIZE) break;
    }

    // 提取待删除记录
    for (const [key, delKey] of respawnDeleteQueue) {
      deleteBatch.push(delKey);
      if (deleteBatch.length >= RESPAWN_PERSIST_BATCH_SIZE) break;
    }

    // 从队列中移除已提取的记录
    for (const record of upsertBatch) {
      respawnUpsertQueue.delete(respawnQueueKey(record.realm_id, record.zone_id, record.room_id, record.slot_index));
    }
    for (const delKey of deleteBatch) {
      respawnDeleteQueue.delete(respawnQueueKey(delKey.realm_id, delKey.zone_id, delKey.room_id, delKey.slot_index));
    }

    // 执行数据库操作
    try {
      if (upsertBatch.length > 0) {
        await batchUpsertMobRespawns(upsertBatch);
      }
      if (deleteBatch.length > 0) {
        await batchClearMobRespawns(deleteBatch);
      }
    } catch (err) {
      console.error('[respawn-persist] Batch persist failed:', err);
      // 失败的记录重新放回队列（避免数据丢失）
      for (const record of upsertBatch) {
        const key = respawnQueueKey(record.realm_id, record.zone_id, record.room_id, record.slot_index);
        if (!respawnUpsertQueue.has(key)) {
          respawnUpsertQueue.set(key, record);
        }
      }
      for (const delKey of deleteBatch) {
        const key = respawnQueueKey(delKey.realm_id, delKey.zone_id, delKey.room_id, delKey.slot_index);
        if (!respawnDeleteQueue.has(key)) {
          respawnDeleteQueue.set(key, delKey);
        }
      }
    } finally {
      isPersisting = false;
    }
  }

  // 启动定时刷新（使用递归 setTimeout 避免回调堆积）
  async function startRespawnPersistLoop() {
    while (respawnPersistTimer !== null) {
      const startTime = Date.now();
      await flushRespawnPersistQueue();
      const elapsed = Date.now() - startTime;
      // 动态调整间隔：如果执行快，按正常间隔；如果执行慢，延长间隔避免堆积
      const waitTime = Math.max(1000, RESPAWN_PERSIST_INTERVAL_MS - elapsed);
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }
  respawnPersistTimer = true; // 标记为运行中
  void startRespawnPersistLoop();

  // 立即刷新函数（用于服务器关闭时）
  async function immediateFlushRespawnQueue() {
    // 停止循环（设置标记让 while 循环退出）
    respawnPersistTimer = null;
    // 循环直到队列为空
    while (respawnUpsertQueue.size > 0 || respawnDeleteQueue.size > 0) {
      await flushRespawnPersistQueue();
      if (isPersisting) await new Promise((r) => setTimeout(r, 100));
    }
  }

  // 导出立即刷新函数供进程退出时使用
  global.immediateFlushRespawnQueue = immediateFlushRespawnQueue;

  setRespawnStore({
    set: (realmId, zoneId, roomId, slotIndex, templateId, respawnAt) => {
      // 写入内存队列，不立即操作数据库
      const key = respawnQueueKey(realmId, zoneId, roomId, slotIndex);
      respawnUpsertQueue.set(key, {
        realm_id: realmId,
        zone_id: zoneId,
        room_id: roomId,
        slot_index: slotIndex,
        template_id: templateId,
        respawn_at: respawnAt
      });
      // 同时从删除队列中移除（如果有）
      respawnDeleteQueue.delete(key);
      return Promise.resolve(); // 立即返回，不等待数据库
    },
    clear: (realmId, zoneId, roomId, slotIndex) => {
      // 写入删除队列，不立即操作数据库
      const key = respawnQueueKey(realmId, zoneId, roomId, slotIndex);
      respawnDeleteQueue.set(key, {
        realm_id: realmId,
        zone_id: zoneId,
        room_id: roomId,
        slot_index: slotIndex
      });
      // 同时从写入队列中移除（如果有）
      respawnUpsertQueue.delete(key);
      return Promise.resolve(); // 立即返回，不等待数据库
    }
  });
  seedRespawnCache([]);
  const now = Date.now();
  const MOB_RESPAWN_LOAD_PAGE_SIZE = 2000;
  const persistedMobTemplateIds = Object.values(MOB_TEMPLATES)
    .filter((tpl) => tpl && shouldPersistMobTemplate(tpl))
    .map((tpl) => String(tpl.id || ''))
    .filter((id) => id.length > 0);
  let hasCrossWorldBossRespawn = false;
  const loadRespawnCacheForRealm = async (realmId) => {
    let cursor = null;
    while (true) {
      const rows = await listMobRespawnsPage(realmId, {
        limit: MOB_RESPAWN_LOAD_PAGE_SIZE,
        cursor,
        templateIds: persistedMobTemplateIds
      });
      if (!rows || rows.length <= 0) break;
      const activeRows = [];
      for (const row of rows) {
        if (realmId === CROSS_REALM_REALM_ID && row.zone_id === 'crb' && row.room_id === 'arena') {
          hasCrossWorldBossRespawn = true;
        }
        if (row.respawn_at && Number(row.respawn_at) > now) {
          activeRows.push(row);
          continue;
        }
        if (row.current_hp && row.current_hp > 0) {
          activeRows.push(row);
        }
      }
      if (activeRows.length > 0) {
        appendRespawnCache(activeRows);
      }
      if (rows.length < MOB_RESPAWN_LOAD_PAGE_SIZE) break;
      const last = rows[rows.length - 1];
      cursor = {
        zone_id: last.zone_id,
        room_id: last.room_id,
        slot_index: Number(last.slot_index)
      };
    }
  };

  await loadRespawnCacheForRealm(CROSS_REALM_REALM_ID);
  for (const realm of realmCache) {
    await loadRespawnCacheForRealm(realm.id);
  }

  if (!hasCrossWorldBossRespawn) {
    const fallbackAt = await getCrossWorldBossRespawnAt();
    if (fallbackAt && fallbackAt > now) {
      try {
        await upsertMobRespawn(CROSS_REALM_REALM_ID, 'crb', 'arena', 0, 'cross_world_boss', fallbackAt);
        appendRespawnCache([{
          zone_id: 'crb',
          room_id: 'arena',
          slot_index: 0,
          template_id: 'cross_world_boss',
          respawn_at: fallbackAt,
          realm_id: CROSS_REALM_REALM_ID
        }]);
      } catch (err) {
        console.warn('Failed to restore cross world boss respawn fallback:', err);
      }
    }
  }
  
  // 定期保存怪物血量状态（每60秒）
  setInterval(async () => {
    try {
      // 检查缓存怪物血量开关
      const cacheEnabled = await getCacheMonsterHealthEnabled();
      if (!cacheEnabled) {
        // 如果关闭缓存，清理已有的缓存记录
        if (mobStatePersistCache.size > 0) {
          for (const key of mobStatePersistCache.keys()) {
            mobStatePersistCache.delete(key);
          }
        }
        return;
      }
      const realmIds = getRealmIds();
      const activeMobKeys = new Set();
      for (const realmId of realmIds) {
        const aliveMobs = getAllAliveMobs(realmId);
        for (const mob of aliveMobs) {
          const cacheKey = getMobPersistCacheKey(mob);
          activeMobKeys.add(cacheKey);
          if (!shouldPersistMobState(mob)) {
            if (mobStatePersistCache.has(cacheKey)) {
              await clearMobRespawn(realmId, mob.zoneId, mob.roomId, mob.slotIndex);
              mobStatePersistCache.delete(cacheKey);
            }
            continue;
          }
          const nextSnapshot = getMobPersistSnapshot(mob);
          if (mobStatePersistCache.get(cacheKey) === nextSnapshot) continue;
          await saveMobState(
            realmId,
            mob.zoneId,
            mob.roomId,
            mob.slotIndex,
            mob.templateId,
            mob.currentHp,
            mob.status
          );
          mobStatePersistCache.set(cacheKey, nextSnapshot);
        }
      }
      for (const key of mobStatePersistCache.keys()) {
        if (!activeMobKeys.has(key)) {
          mobStatePersistCache.delete(key);
        }
      }
    } catch (err) {
      console.warn('Failed to save mob states:', err);
    }
  }, 60000);

  // 定期分批清理 mob_respawns 中已过期且无血量快照的无效记录，避免大事务长时间锁表
  setInterval(async () => {
    try {
      const deleted = await runMobRespawnCleanupSweep({
        batchSize: MOB_RESPAWN_CLEANUP_BATCH_SIZE,
        maxRounds: MOB_RESPAWN_CLEANUP_MAX_ROUNDS,
        delayMs: 20
      });
      if (Number(deleted || 0) > 0) {
        console.log(`[mob_respawns] cleaned expired rows: ${deleted}`);
      }
    } catch (err) {
      console.warn('Failed to cleanup expired mob respawns:', err);
    }
  }, MOB_RESPAWN_CLEANUP_INTERVAL_MS);
  try {
    const deleted = await runMobRespawnCleanupSweep({
      batchSize: MOB_RESPAWN_CLEANUP_BATCH_SIZE,
      maxRounds: MOB_RESPAWN_CLEANUP_MAX_ROUNDS,
      delayMs: 10
    });
    if (Number(deleted || 0) > 0) {
      console.log(`[mob_respawns] startup cleaned expired rows: ${deleted}`);
    }
  } catch (err) {
    console.warn('Failed to cleanup expired mob respawns on startup:', err);
  }
  setTimeout(() => {
    runStartupMobRespawnCleanup().catch((err) => {
      console.warn('Failed to run startup background mob respawn cleanup:', err);
    });
  }, 5000);

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

  // 定期清理长时间未访问的限频/冷却缓存，避免长时间运行后 Map 持续增长
  setInterval(() => {
    cleanupStaleCommandState(Date.now());
  }, 10 * 60 * 1000);

  // 定期清理过期验证码缓存
  setInterval(() => {
    cleanupCaptchas();
  }, 5 * 60 * 1000);
  
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
  const petTrainingFruitDropRate = await getPetTrainingFruitDropRateDb();
  setPetTrainingFruitDropRateConfig(petTrainingFruitDropRate);

  // 加载修炼系统配置
  const trainingPerLevelConfig = await getTrainingPerLevelConfigDb();
  setTrainingPerLevelConfigMem(trainingPerLevelConfig);
  await loadGuildSystemConfig();
  await loadRouteLinesConfig();
  await loadEquipmentRecycleConfigFromDb();
  await loadHarvestSeasonRewardConfigFromDb();
  await loadHarvestSeasonSignConfigFromDb();
  const ultimateGrowthConfig = await getUltimateGrowthConfigDb();
  if (ultimateGrowthConfig && typeof ultimateGrowthConfig === 'object') {
    setUltimateGrowthConfigMem(ultimateGrowthConfig);
    const normalizedGrowth = getUltimateGrowthConfigMem();
    const growthMaterialId = String(normalizedGrowth.materialId || '').trim();
    const growthMaterialTpl = ITEM_TEMPLATES[growthMaterialId];
    const growthBreakMaterialId = String(normalizedGrowth.breakthroughMaterialId || '').trim();
    const growthBreakMaterialTpl = ITEM_TEMPLATES[growthBreakMaterialId];
    if (!growthMaterialTpl?.noDrop) {
      normalizedGrowth.materialId = 'ultimate_growth_stone';
    }
    if (!growthBreakMaterialTpl?.noDrop) {
      normalizedGrowth.breakthroughMaterialId = 'ultimate_growth_break_stone';
    }
    if (!growthMaterialTpl?.noDrop || !growthBreakMaterialTpl?.noDrop) {
      setUltimateGrowthConfigMem(normalizedGrowth);
      await setUltimateGrowthConfigDb(getUltimateGrowthConfigMem());
      console.log('[ultimate-growth] 已自动修正成长/突破材料为不可掉落道具');
    }
  }
  await loadFirstRechargeWelfareConfig();
  await loadInviteRewardConfig();

  // 加载职业升级属性配置
  const classLevelConfigs = {
    warrior: await getClassLevelBonusConfig('warrior'),
    mage: await getClassLevelBonusConfig('mage'),
    taoist: await getClassLevelBonusConfig('taoist')
  };
  setAllClassLevelBonusConfigs(classLevelConfigs);

  try {
    const managedRecovery = await recoverManagedHostedPlayersOnStartup();
    console.log(`[managed-recover] recovered=${managedRecovery.recovered}, skipped=${managedRecovery.skipped}`);
  } catch (err) {
    console.warn('[managed-recover] startup restore failed:', err?.message || err);
  }

  // 加载锻造系统配置
  const refineBaseSuccessRate = await getRefineBaseSuccessRateDb();
  setRefineBaseSuccessRate(refineBaseSuccessRate);
  const refineDecayRate = await getRefineDecayRateDb();
  setRefineDecayRate(refineDecayRate);
  const refineMaterialCount = await getRefineMaterialCountDb();
  setRefineMaterialCount(refineMaterialCount);
  const refineBonusPerLevel = await getRefineBonusPerLevelDb();
  setRefineBonusPerLevel(refineBonusPerLevel);

  // 加载法宝系统配置
  const treasureSlotCount = await getTreasureSlotCountDb();
  setTreasureSlotCount(treasureSlotCount);
  const treasureMaxLevel = await getTreasureMaxLevelDb();
  setTreasureMaxLevel(treasureMaxLevel);
  const treasureUpgradeConsume = await getTreasureUpgradeConsumeDb();
  setTreasureUpgradeConsume(treasureUpgradeConsume);
  const treasureAdvanceConsume = await getTreasureAdvanceConsumeDb();
  setTreasureAdvanceConsume(treasureAdvanceConsume);
  const treasureAdvancePerStage = await getTreasureAdvancePerStageDb();
  setTreasureAdvancePerStage(treasureAdvancePerStage);
  const treasureAdvanceEffectBonusPerStack = await getTreasureAdvanceEffectBonusPerStackDb();
  setTreasureAdvanceEffectBonusPerStack(treasureAdvanceEffectBonusPerStack);
  const treasureWorldBossDropMultiplier = await getTreasureWorldBossDropMultiplierDb();
  setTreasureWorldBossDropMultiplier(treasureWorldBossDropMultiplier);
  const treasureCrossWorldBossDropMultiplier = await getTreasureCrossWorldBossDropMultiplierDb();
  setTreasureCrossWorldBossDropMultiplier(treasureCrossWorldBossDropMultiplier);
  const treasureTowerXuanmingDropChance = await getTreasureTowerXuanmingDropChanceDb();
  setTreasureTowerXuanmingDropChance(treasureTowerXuanmingDropChance);

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
  startRuntimeHealthLogging();
  server.listen(config.port, () => {
    console.log(`Server on http://localhost:${config.port}`);
  });
}

let shuttingDown = false;

async function gracefulShutdown(reason, exitCode = 0) {
  if (shuttingDown) {
    if (typeof exitCode === 'number' && exitCode > 0) {
      process.exitCode = exitCode;
    }
    return;
  }
  shuttingDown = true;
  process.exitCode = exitCode;
  console.log(`[shutdown] ${reason}`);

  if (runtimeHealthTimer) {
    clearInterval(runtimeHealthTimer);
    runtimeHealthTimer = null;
  }

  try {
    await flushPendingPlayerSaves();
  } catch (err) {
    console.warn('[shutdown] flushPendingPlayerSaves failed:', err?.message || err);
  }

  // 立即刷新怪物刷新队列到数据库
  try {
    if (typeof global.immediateFlushRespawnQueue === 'function') {
      console.log('[shutdown] Flushing mob respawn queue...');
      await global.immediateFlushRespawnQueue();
      console.log('[shutdown] Mob respawn queue flushed.');
    }
  } catch (err) {
    console.warn('[shutdown] flushRespawnQueue failed:', err?.message || err);
  }

  try {
    await new Promise((resolve) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.close(() => {
        resolve();
      });
    });
  } catch (err) {
    console.warn('[shutdown] server.close failed:', err?.message || err);
  }

  try {
    await knex.destroy();
  } catch (err) {
    console.warn('[shutdown] knex.destroy failed:', err?.message || err);
  }

  process.exit(process.exitCode || 0);
}

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT', 0);
});

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM', 0);
});

process.on('uncaughtException', (err) => {
  console.error(err);
  void gracefulShutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (err) => {
  console.error(err);
  void gracefulShutdown('unhandledRejection', 1);
});

start().catch((err) => {
  console.error(err);
  void gracefulShutdown('start-failed', 1);
});





