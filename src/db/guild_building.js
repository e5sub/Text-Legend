import knex from './index.js';
import { getSetting, setSetting } from './settings.js';

const GUILD_BUILDING_CONFIG_KEY = 'guild_building_config_v1';
const GUILD_MEMBER_TIME_REDUCTION_PCT_PER_LEVEL_DEFAULT = 5;
const GUILD_MEMBER_TIME_REDUCTION_PCT_CAP = 50;
const DEFAULT_GUILD_BUILDING_CONFIG = {
  thresholds: [0, 100000, 300000, 600000, 1000000, 1600000, 2400000, 3600000, 5200000, 7200000],
  durationsSec: [0, 300, 900, 1800, 3600, 7200, 10800, 14400, 21600, 28800],
  gains: {
    memberBaseLimit: 20,
    memberPerLevel: 5,
    memberBuildTimeReductionPctPerLevel: GUILD_MEMBER_TIME_REDUCTION_PCT_PER_LEVEL_DEFAULT,
    expPctPerLevel: 10,
    goldPctPerLevel: 0.2,
    hpPctPerLevel: 0.2,
    atkPctPerLevel: 0.2,
    magPctPerLevel: 0.2,
    spiritPctPerLevel: 0.2,
    defPctPerLevel: 0.2,
    mdefPctPerLevel: 0.2
  }
};
let guildBuildingConfigCache = JSON.parse(JSON.stringify(DEFAULT_GUILD_BUILDING_CONFIG));

export const GUILD_BUILD_BRANCH_DEFS = [
  { id: 'member', label: '成员殿' },
  { id: 'exp', label: '历练阁' },
  { id: 'gold', label: '财库阁' },
  { id: 'hp', label: '生命殿' },
  { id: 'atk', label: '武殿' },
  { id: 'mag', label: '法殿' },
  { id: 'spirit', label: '道殿' },
  { id: 'def', label: '甲殿' },
  { id: 'mdef', label: '灵盾阁' }
];

function cloneConfig(input) {
  return JSON.parse(JSON.stringify(input));
}

function normalizePctValue(value, fallback = 0) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 10) / 10;
}

function formatPctText(value) {
  const rounded = normalizePctValue(value, 0);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded.toFixed(1));
}

function normalizeGuildBuildingConfig(raw) {
  const defaults = DEFAULT_GUILD_BUILDING_CONFIG;
  const thresholdsInput = Array.isArray(raw?.thresholds) ? raw.thresholds : defaults.thresholds;
  const durationsInput = Array.isArray(raw?.durationsSec) ? raw.durationsSec : defaults.durationsSec;
  const targetLength = Math.max(2, Math.min(20, Math.max(thresholdsInput.length || 0, durationsInput.length || 0, defaults.thresholds.length)));
  const thresholds = [];
  const durationsSec = [];
  for (let i = 0; i < targetLength; i += 1) {
    const thresholdFallback = defaults.thresholds[Math.min(i, defaults.thresholds.length - 1)] || 0;
    const durationFallback = defaults.durationsSec[Math.min(i, defaults.durationsSec.length - 1)] || 0;
    const threshold = Math.max(0, Math.floor(Number(thresholdsInput[i] ?? thresholdFallback) || 0));
    const duration = Math.max(0, Math.floor(Number(durationsInput[i] ?? durationFallback) || 0));
    thresholds.push(i === 0 ? 0 : Math.max(thresholds[i - 1], threshold));
    durationsSec.push(i === 0 ? 0 : duration);
  }
  const gainsInput = raw?.gains || {};
  const gains = {
    memberBaseLimit: Math.max(1, Math.floor(Number(gainsInput.memberBaseLimit ?? defaults.gains.memberBaseLimit) || defaults.gains.memberBaseLimit)),
    memberPerLevel: Math.max(1, Math.floor(Number(gainsInput.memberPerLevel ?? defaults.gains.memberPerLevel) || defaults.gains.memberPerLevel)),
    memberBuildTimeReductionPctPerLevel: Math.max(
      0,
      Math.min(
        GUILD_MEMBER_TIME_REDUCTION_PCT_CAP,
        normalizePctValue(
          gainsInput.memberBuildTimeReductionPctPerLevel,
          defaults.gains.memberBuildTimeReductionPctPerLevel
        )
      )
    ),
    expPctPerLevel: normalizePctValue(gainsInput.expPctPerLevel, defaults.gains.expPctPerLevel),
    goldPctPerLevel: normalizePctValue(gainsInput.goldPctPerLevel, defaults.gains.goldPctPerLevel),
    hpPctPerLevel: normalizePctValue(gainsInput.hpPctPerLevel, defaults.gains.hpPctPerLevel),
    atkPctPerLevel: normalizePctValue(gainsInput.atkPctPerLevel, defaults.gains.atkPctPerLevel),
    magPctPerLevel: normalizePctValue(gainsInput.magPctPerLevel, defaults.gains.magPctPerLevel),
    spiritPctPerLevel: normalizePctValue(gainsInput.spiritPctPerLevel, defaults.gains.spiritPctPerLevel),
    defPctPerLevel: normalizePctValue(gainsInput.defPctPerLevel, defaults.gains.defPctPerLevel),
    mdefPctPerLevel: normalizePctValue(gainsInput.mdefPctPerLevel, defaults.gains.mdefPctPerLevel)
  };
  return { thresholds, durationsSec, gains };
}

function getGuildBuildingConfig() {
  return guildBuildingConfigCache || cloneConfig(DEFAULT_GUILD_BUILDING_CONFIG);
}

export function getGuildBuildingConfigSnapshot() {
  return cloneConfig(getGuildBuildingConfig());
}

export async function loadGuildBuildingConfig(forceRefresh = false) {
  if (!forceRefresh && guildBuildingConfigCache) return getGuildBuildingConfigSnapshot();
  const raw = await getSetting(GUILD_BUILDING_CONFIG_KEY, '');
  if (!raw) {
    guildBuildingConfigCache = cloneConfig(DEFAULT_GUILD_BUILDING_CONFIG);
    return getGuildBuildingConfigSnapshot();
  }
  try {
    guildBuildingConfigCache = normalizeGuildBuildingConfig(JSON.parse(String(raw)));
  } catch {
    guildBuildingConfigCache = cloneConfig(DEFAULT_GUILD_BUILDING_CONFIG);
  }
  return getGuildBuildingConfigSnapshot();
}

export async function setGuildBuildingConfig(raw) {
  const normalized = normalizeGuildBuildingConfig(raw);
  await setSetting(GUILD_BUILDING_CONFIG_KEY, JSON.stringify(normalized));
  guildBuildingConfigCache = normalized;
  return getGuildBuildingConfigSnapshot();
}

function getBuildMaxLevel() {
  return getGuildBuildingConfig().thresholds.length - 1;
}

function getBuildThreshold(level) {
  const config = getGuildBuildingConfig();
  const thresholds = Array.isArray(config.thresholds) ? config.thresholds : [];
  const safeLevel = Math.max(0, Math.floor(Number(level || 0)));
  const configuredMaxLevel = Math.max(0, thresholds.length - 1);
  if (safeLevel <= configuredMaxLevel) {
    return Math.max(0, Math.floor(Number(thresholds[safeLevel] || 0)));
  }
  const lastThreshold = Math.max(0, Math.floor(Number(thresholds[configuredMaxLevel] || 0)));
  const prevThreshold = configuredMaxLevel > 0
    ? Math.max(0, Math.floor(Number(thresholds[configuredMaxLevel - 1] || 0)))
    : 0;
  const step = Math.max(1, lastThreshold - prevThreshold, lastThreshold || 100000);
  return lastThreshold + (safeLevel - configuredMaxLevel) * step;
}

function getBuildDurationSec(level) {
  const config = getGuildBuildingConfig();
  const durations = Array.isArray(config.durationsSec) ? config.durationsSec : [];
  const safeLevel = Math.max(0, Math.floor(Number(level || 0)));
  const configuredMaxLevel = Math.max(0, durations.length - 1);
  if (safeLevel <= configuredMaxLevel) {
    return Math.max(0, Math.floor(Number(durations[safeLevel] || 0)));
  }
  return Math.max(0, Math.floor(Number(durations[configuredMaxLevel] || 0)));
}

function parseGuildBuildTimeMs(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : null;
}

export function getGuildBuildLevel(buildExp = 0) {
  const exp = Math.max(0, Math.floor(Number(buildExp || 0)));
  const configuredMaxLevel = getBuildMaxLevel();
  let level = 0;
  for (let i = 0; i <= configuredMaxLevel; i += 1) {
    if (exp >= getBuildThreshold(i)) level = i;
    else break;
  }
  if (exp < getBuildThreshold(configuredMaxLevel)) return level;
  const lastThreshold = getBuildThreshold(configuredMaxLevel);
  const nextThreshold = getBuildThreshold(configuredMaxLevel + 1);
  const step = Math.max(1, nextThreshold - lastThreshold);
  return configuredMaxLevel + Math.floor((exp - lastThreshold) / step);
}

function normalizeBranchLevels(raw, fallbackLevel = 0) {
  let parsed = raw;
  if (typeof parsed === 'string' && parsed.trim()) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  const safeFallback = Math.max(0, Math.floor(Number(fallbackLevel || 0)));
  const levels = {};
  for (const def of GUILD_BUILD_BRANCH_DEFS) {
    const source = parsed && typeof parsed === 'object' ? parsed[def.id] : undefined;
    const useFallback = source === undefined || source === null || source === '';
    const rawLevel = useFallback ? safeFallback : source;
    levels[def.id] = Math.max(0, Math.floor(Number(rawLevel || 0)));
  }
  return levels;
}

function serializeBranchLevels(levels, fallbackLevel = 0) {
  return JSON.stringify(normalizeBranchLevels(levels, fallbackLevel));
}

function getBranchBonus(branchId, level) {
  const config = getGuildBuildingConfig();
  const gains = config.gains || DEFAULT_GUILD_BUILDING_CONFIG.gains;
  const safeLevel = Math.max(0, Math.floor(Number(level || 0)));
  switch (branchId) {
    case 'member': {
      const value = Math.max(1, Math.floor(Number(gains.memberBaseLimit || 20))) + safeLevel * Math.max(1, Math.floor(Number(gains.memberPerLevel || 5)));
      const timeReductionPerLevel = Math.max(
        0,
        Math.min(
          GUILD_MEMBER_TIME_REDUCTION_PCT_CAP,
          normalizePctValue(
            gains.memberBuildTimeReductionPctPerLevel,
            DEFAULT_GUILD_BUILDING_CONFIG.gains.memberBuildTimeReductionPctPerLevel
          )
        )
      );
      const buildTimeReductionPct = Math.min(
        GUILD_MEMBER_TIME_REDUCTION_PCT_CAP,
        normalizePctValue(safeLevel * timeReductionPerLevel)
      );
      return {
        kind: 'member',
        value,
        buildTimeReductionPct,
        text: `成员上限 ${value} / 建造耗时 -${formatPctText(buildTimeReductionPct)}%`
      };
    }
    case 'exp': {
      const value = normalizePctValue(safeLevel * Number(gains.expPctPerLevel || 0));
      return { kind: 'pct', value, text: `经验 +${formatPctText(value)}%` };
    }
    case 'gold': {
      const value = normalizePctValue(safeLevel * Number(gains.goldPctPerLevel || 0));
      return { kind: 'pct', value, text: `金币 +${formatPctText(value)}%` };
    }
    case 'hp': {
      const value = normalizePctValue(safeLevel * Number(gains.hpPctPerLevel || 0));
      return { kind: 'pct', value, text: `生命 +${formatPctText(value)}%` };
    }
    case 'atk': {
      const value = normalizePctValue(safeLevel * Number(gains.atkPctPerLevel || 0));
      return { kind: 'pct', value, text: `攻击 +${formatPctText(value)}%` };
    }
    case 'mag': {
      const value = normalizePctValue(safeLevel * Number(gains.magPctPerLevel || 0));
      return { kind: 'pct', value, text: `魔法 +${formatPctText(value)}%` };
    }
    case 'spirit': {
      const value = normalizePctValue(safeLevel * Number(gains.spiritPctPerLevel || 0));
      return { kind: 'pct', value, text: `道术 +${formatPctText(value)}%` };
    }
    case 'def': {
      const value = normalizePctValue(safeLevel * Number(gains.defPctPerLevel || 0));
      return { kind: 'pct', value, text: `防御 +${formatPctText(value)}%` };
    }
    case 'mdef': {
      const value = normalizePctValue(safeLevel * Number(gains.mdefPctPerLevel || 0));
      return { kind: 'pct', value, text: `魔御 +${formatPctText(value)}%` };
    }
    default:
      return { kind: 'pct', value: 0, text: '无加成' };
  }
}

async function ensureGuildBuildingBaseline(guild) {
  if (!guild?.id) return guild || null;
  const legacyLevel = getGuildBuildLevel(guild.build_exp || 0);
  const branchLevels = normalizeBranchLevels(guild.build_branch_levels, legacyLevel);
  const branchJson = serializeBranchLevels(branchLevels, legacyLevel);
  const currentRaw = typeof guild.build_branch_levels === 'string' ? guild.build_branch_levels : '';
  const updatePayload = {};
  if (!currentRaw || currentRaw !== branchJson) {
    updatePayload.build_branch_levels = branchJson;
  }
  if (Object.keys(updatePayload).length > 0) {
    await knex('guilds').where({ id: guild.id }).update(updatePayload);
    return { ...guild, ...updatePayload, build_branch_levels: branchJson };
  }
  return { ...guild, build_branch_levels: branchJson };
}

async function getGuildBuildingRow(guildId) {
  if (!guildId) return null;
  const guild = await knex('guilds')
    .where({ id: guildId })
    .select(
      'id',
      'build_exp',
      'build_gold',
      'build_points',
      'build_level',
      'build_branch_levels',
      'build_upgrade_started_at',
      'build_upgrade_ends_at',
      'build_upgrade_branch'
    )
    .first();
  if (!guild) return null;
  return ensureGuildBuildingBaseline(guild);
}

async function completeGuildBuildingUpgradeIfReady(guildId) {
  const guild = await getGuildBuildingRow(guildId);
  if (!guild) return null;
  const endsAtMs = parseGuildBuildTimeMs(guild.build_upgrade_ends_at);
  const branchId = String(guild.build_upgrade_branch || '').trim();
  if (!endsAtMs || endsAtMs > Date.now() || !branchId) return guild;
  const legacyLevel = getGuildBuildLevel(guild.build_exp || 0);
  const levels = normalizeBranchLevels(guild.build_branch_levels, legacyLevel);
  if (Object.prototype.hasOwnProperty.call(levels, branchId)) {
    levels[branchId] = Math.max(0, Math.floor(Number(levels[branchId] || 0))) + 1;
  }
  await knex('guilds').where({ id: guildId }).update({
    build_branch_levels: serializeBranchLevels(levels, legacyLevel),
    build_upgrade_started_at: null,
    build_upgrade_ends_at: null,
    build_upgrade_branch: null,
    build_level: Math.max(0, ...Object.values(levels).map((v) => Math.floor(Number(v || 0))))
  });
  return getGuildBuildingRow(guildId);
}

export function buildGuildBuildingPayload(guild) {
  const config = getGuildBuildingConfig();
  const buildExp = Math.max(0, Math.floor(Number(guild?.build_exp || 0)));
  const buildGold = Math.max(0, Math.floor(Number(guild?.build_gold || 0)));
  const buildPoints = Math.max(0, Math.floor(Number(guild?.build_points || 0)));
  const legacyLevel = getGuildBuildLevel(buildExp);
  const branchLevels = normalizeBranchLevels(guild?.build_branch_levels, legacyLevel);
  const upgradeStartedAt = parseGuildBuildTimeMs(guild?.build_upgrade_started_at);
  const upgradeEndsAt = parseGuildBuildTimeMs(guild?.build_upgrade_ends_at);
  const rawUpgradeBranch = String(guild?.build_upgrade_branch || '').trim().toLowerCase();
  const activeUpgradeBranch = GUILD_BUILD_BRANCH_DEFS.some((def) => def.id === rawUpgradeBranch)
    ? rawUpgradeBranch
    : null;
  const upgrading = Boolean(upgradeEndsAt && upgradeEndsAt > Date.now() && activeUpgradeBranch);
  const maxLevel = Math.max(0, ...Object.values(branchLevels).map((v) => Math.floor(Number(v || 0))));
  const bonuses = {
    memberLimit: Math.max(1, Math.floor(Number(config.gains?.memberBaseLimit || DEFAULT_GUILD_BUILDING_CONFIG.gains.memberBaseLimit))),
    buildTimeReductionPct: 0,
    expPct: 0,
    goldPct: 0,
    hpPct: 0,
    atkPct: 0,
    magPct: 0,
    spiritPct: 0,
    defPct: 0,
    mdefPct: 0
  };
  const memberLevel = Math.max(0, Math.floor(Number(branchLevels.member || 0)));
  const memberTimeReductionPerLevel = Math.max(
    0,
    Math.min(
      GUILD_MEMBER_TIME_REDUCTION_PCT_CAP,
      normalizePctValue(
        config.gains?.memberBuildTimeReductionPctPerLevel,
        DEFAULT_GUILD_BUILDING_CONFIG.gains.memberBuildTimeReductionPctPerLevel
      )
    )
  );
  const buildTimeReductionPct = Math.min(
    GUILD_MEMBER_TIME_REDUCTION_PCT_CAP,
    normalizePctValue(memberLevel * memberTimeReductionPerLevel)
  );
  const buildTimeMultiplier = Math.max(0, 1 - buildTimeReductionPct / 100);

  const branches = GUILD_BUILD_BRANCH_DEFS.map((def) => {
    const level = Math.max(0, Math.floor(Number(branchLevels[def.id] || 0)));
    const currentThreshold = getBuildThreshold(level);
    const nextThreshold = getBuildThreshold(level + 1);
    const nextNeed = Math.max(0, nextThreshold - buildExp);
    const baseNextDurationSec = getBuildDurationSec(level + 1);
    const nextDurationSec = baseNextDurationSec > 0
      ? Math.max(1, Math.floor(baseNextDurationSec * buildTimeMultiplier))
      : 0;
    const bonus = getBranchBonus(def.id, level);
    if (def.id === 'member') {
      bonuses.memberLimit = bonus.value;
      bonuses.buildTimeReductionPct = Math.max(0, normalizePctValue(bonus.buildTimeReductionPct || 0));
    }
    if (def.id === 'exp') bonuses.expPct = bonus.value;
    if (def.id === 'gold') bonuses.goldPct = bonus.value;
    if (def.id === 'hp') bonuses.hpPct = bonus.value;
    if (def.id === 'atk') bonuses.atkPct = bonus.value;
    if (def.id === 'mag') bonuses.magPct = bonus.value;
    if (def.id === 'spirit') bonuses.spiritPct = bonus.value;
    if (def.id === 'def') bonuses.defPct = bonus.value;
    if (def.id === 'mdef') bonuses.mdefPct = bonus.value;
    const branchUpgrading = upgrading && activeUpgradeBranch === def.id;
    return {
      id: def.id,
      label: def.label,
      level,
      currentThreshold,
      nextThreshold,
      nextNeed,
      baseNextDurationSec,
      nextDurationSec,
      readyToUpgrade: !upgrading && buildExp >= nextThreshold,
      upgrading: branchUpgrading,
      upgradeStartedAt: branchUpgrading ? upgradeStartedAt : null,
      upgradeEndsAt: branchUpgrading ? upgradeEndsAt : null,
      upgradeRemainingSec: branchUpgrading ? Math.max(0, Math.ceil((upgradeEndsAt - Date.now()) / 1000)) : 0,
      bonusKind: bonus.kind,
      bonusValue: bonus.value,
      bonusText: bonus.text
    };
  });

  const activeBranch = branches.find((entry) => entry.id === activeUpgradeBranch) || null;
  return {
    level: maxLevel,
    exp: buildExp,
    gold: buildGold,
    points: buildPoints,
    currentThreshold: getBuildThreshold(maxLevel),
    nextThreshold: getBuildThreshold(maxLevel + 1),
    nextNeed: Math.max(0, getBuildThreshold(maxLevel + 1) - buildExp),
    nextDurationSec: activeBranch?.nextDurationSec || 0,
    upgrading,
    upgradeStartedAt,
    upgradeEndsAt,
    upgradeRemainingSec: upgrading ? Math.max(0, Math.ceil((upgradeEndsAt - Date.now()) / 1000)) : 0,
    readyToUpgrade: branches.some((entry) => entry.readyToUpgrade),
    activeUpgradeBranch,
    activeUpgradeBranchLabel: activeBranch?.label || null,
    rewardBonusPct: bonuses.expPct,
    battleBonusPct: Math.max(bonuses.hpPct, bonuses.atkPct, bonuses.magPct, bonuses.spiritPct, bonuses.defPct, bonuses.mdefPct),
    memberLimit: bonuses.memberLimit,
    buildTimeReductionPct: bonuses.buildTimeReductionPct,
    expBonusPct: bonuses.expPct,
    goldBonusPct: bonuses.goldPct,
    hpBonusPct: bonuses.hpPct,
    atkBonusPct: bonuses.atkPct,
    magBonusPct: bonuses.magPct,
    spiritBonusPct: bonuses.spiritPct,
    defBonusPct: bonuses.defPct,
    mdefBonusPct: bonuses.mdefPct,
    branches
  };
}

export async function getGuildBuildingInfo(guildId) {
  const guild = await completeGuildBuildingUpgradeIfReady(guildId);
  if (!guild) return null;
  return buildGuildBuildingPayload(guild);
}

export async function startGuildBuildingUpgrade(guildId, branchId = 'exp') {
  const guild = await completeGuildBuildingUpgradeIfReady(guildId);
  if (!guild) return { ok: false, error: '行会不存在。', building: null };
  const building = buildGuildBuildingPayload(guild);
  if (building.upgrading) {
    return { ok: false, error: '当前已有建筑正在升级中。', building };
  }
  const targetBranchId = GUILD_BUILD_BRANCH_DEFS.some((def) => def.id === branchId) ? String(branchId) : 'exp';
  const branch = (building.branches || []).find((entry) => entry.id === targetBranchId);
  if (!branch) {
    return { ok: false, error: '无效建筑分支。', building };
  }
  if (building.exp < branch.nextThreshold) {
    return { ok: false, error: `建设值不足，${branch.label}距离下一级还差 ${branch.nextNeed}。`, building };
  }
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + Math.max(0, Number(branch.nextDurationSec || 0)) * 1000);
  await knex('guilds')
    .where({ id: guildId })
    .update({
      build_upgrade_started_at: startedAt,
      build_upgrade_ends_at: endsAt,
      build_upgrade_branch: targetBranchId
    });
  const nextGuild = await getGuildBuildingRow(guildId);
  return { ok: true, building: buildGuildBuildingPayload(nextGuild) };
}

export async function addGuildBuildingContribution(guildId, { gold = 0, points = 0 } = {}) {
  const goldValue = Math.max(0, Math.floor(Number(gold || 0)));
  const pointValue = Math.max(0, Math.floor(Number(points || 0)));
  const expGain = Math.floor(goldValue * 0.2) + pointValue * 10000;
  if (expGain <= 0) {
    return getGuildBuildingInfo(guildId);
  }
  await knex('guilds')
    .where({ id: guildId })
    .update({
      build_exp: knex.raw('COALESCE(build_exp, 0) + ?', [expGain]),
      build_gold: knex.raw('COALESCE(build_gold, 0) + ?', [goldValue]),
      build_points: knex.raw('COALESCE(build_points, 0) + ?', [pointValue])
    });
  return getGuildBuildingInfo(guildId);
}
