import knex from './index.js';

// ===== 内存缓存 =====
const settingsCache = new Map();
let cacheLoaded = false;

/**
 * 从数据库加载所有设置到内存缓存
 * 服务端启动时调用一次
 */
export async function loadSettingsCache() {
  const rows = await knex('game_settings').select('key', 'value');
  settingsCache.clear();
  for (const row of rows) {
    settingsCache.set(row.key, row.value);
  }
  cacheLoaded = true;
  console.log(`[settings] loaded ${rows.length} settings into cache`);
  return rows.length;
}

/**
 * 刷新单个设置项（从数据库重新加载）
 */
export async function refreshSettingCache(key) {
  const row = await knex('game_settings').where({ key }).first();
  if (row) {
    settingsCache.set(row.key, row.value);
  } else {
    settingsCache.delete(key);
  }
  return row ? row.value : null;
}

/**
 * 清空并重新加载缓存
 */
export async function reloadSettingsCache() {
  cacheLoaded = false;
  return loadSettingsCache();
}

/**
 * 获取游戏设置（优先从内存缓存读取）
 */
export async function getSetting(key, defaultValue = null) {
  // 如果缓存已加载，直接读取内存
  if (cacheLoaded) {
    return settingsCache.has(key) ? settingsCache.get(key) : defaultValue;
  }
  // 缓存未加载时回退到数据库查询（兼容启动阶段）
  const row = await knex('game_settings').where({ key }).first();
  return row ? row.value : defaultValue;
}

/**
 * 同步获取设置（仅用于缓存加载后的高频调用）
 * 注意：使用此函数前确保已调用 loadSettingsCache()
 */
export function getSettingSync(key, defaultValue = null) {
  return settingsCache.has(key) ? settingsCache.get(key) : defaultValue;
}

/**
 * 设置游戏配置（更新缓存和数据库）
 */
export async function setSetting(key, value) {
  // 先更新数据库
  await knex('game_settings')
    .insert({ key, value })
    .onConflict('key')
    .merge({ value, updated_at: knex.fn.now() });
  // 同步更新缓存
  settingsCache.set(key, value);
}

/**
 * 批量设置（减少数据库往返）
 */
export async function setSettingsBatch(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const now = knex.fn.now();
  const rows = entries.map(e => ({ key: e.key, value: e.value, updated_at: now }));
  await knex('game_settings')
    .insert(rows)
    .onConflict('key')
    .merge({ value: knex.raw('excluded.value'), updated_at: now });
  // 同步更新缓存
  for (const e of entries) {
    settingsCache.set(e.key, e.value);
  }
}

export async function getPetSettings() {
  const value = await getSetting('pet_settings', null);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function setPetSettings(settings) {
  const normalized = JSON.stringify(settings || {});
  await setSetting('pet_settings', normalized);
}

/**
 * 获取VIP自助领取开关
 */
export async function getVipSelfClaimEnabled() {
  const enabled = await getSetting('vip_self_claim_enabled', 'true');
  return enabled === 'true' || enabled === '1';
}

/**
 * 设置VIP自助领取开关
 */
export async function setVipSelfClaimEnabled(enabled) {
  await setSetting('vip_self_claim_enabled', enabled ? 'true' : 'false');
}

export async function getSvipPrices() {
  const month = await getSetting('svip_price_month', '100');
  const quarter = await getSetting('svip_price_quarter', '260');
  const year = await getSetting('svip_price_year', '900');
  const permanent = await getSetting('svip_price_permanent', '3000');
  const parse = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  };
  return {
    month: parse(month, 100),
    quarter: parse(quarter, 260),
    year: parse(year, 900),
    permanent: parse(permanent, 3000)
  };
}

export async function setSvipPrices(prices) {
  const normalize = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const next = prices || {};
  await setSetting('svip_price_month', String(normalize(next.month)));
  await setSetting('svip_price_quarter', String(normalize(next.quarter)));
  await setSetting('svip_price_year', String(normalize(next.year)));
  await setSetting('svip_price_permanent', String(normalize(next.permanent)));
}

/**
 * 获取掉落日志开关
 */
export async function getLootLogEnabled() {
  const enabled = await getSetting('loot_log_enabled', 'false');
  return enabled === 'true' || enabled === '1';
}

export async function getWorldBossKillCount(realmId = 1) {
  const count = await getSetting(`world_boss_kill_count_${realmId}`, '0');
  const parsed = parseInt(count, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setWorldBossKillCount(count, realmId = 1) {
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  await setSetting(`world_boss_kill_count_${realmId}`, String(normalized));
}

export async function getSpecialBossKillCount(realmId = 1) {
  const count = await getSetting(`special_boss_kill_count_${realmId}`, '0');
  const parsed = parseInt(count, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setSpecialBossKillCount(count, realmId = 1) {
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  await setSetting(`special_boss_kill_count_${realmId}`, String(normalized));
}

export async function getCultivationBossKillCount(realmId = 1) {
  const count = await getSetting(`cultivation_boss_kill_count_${realmId}`, '0');
  const parsed = parseInt(count, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setCultivationBossKillCount(count, realmId = 1) {
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  await setSetting(`cultivation_boss_kill_count_${realmId}`, String(normalized));
}

/**
 * 设置掉落日志开关
 */
export async function setLootLogEnabled(enabled) {
  await setSetting('loot_log_enabled', enabled ? 'true' : 'false');
}

export async function getCrossWorldBossRespawnAt() {
  const value = await getSetting('cross_world_boss_respawn_at', '0');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setCrossWorldBossRespawnAt(timestamp) {
  const normalized = Math.max(0, Math.floor(Number(timestamp) || 0));
  await setSetting('cross_world_boss_respawn_at', String(normalized));
}

/**
 * 获取状态刷新节流开关
 */
export async function getStateThrottleEnabled() {
  const enabled = await getSetting('state_throttle_enabled', 'false');
  return enabled === 'true' || enabled === '1';
}

// 默认实时更新（节流关闭）
export function getStateThrottleEnabledDefault() {
  return false;
}

/**
 * 设置状态刷新节流开关
 */
export async function setStateThrottleEnabled(enabled) {
  await setSetting('state_throttle_enabled', enabled ? 'true' : 'false');
}

export async function getStateThrottleIntervalSec() {
  const value = await getSetting('state_throttle_interval_sec', '10');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 10;
}

export async function setStateThrottleIntervalSec(seconds) {
  const normalized = Math.max(1, Math.floor(Number(seconds) || 1));
  await setSetting('state_throttle_interval_sec', String(normalized));
}

export async function getStateThrottleOverrideServerAllowed() {
  const enabled = await getSetting('state_throttle_override_server_allowed', 'true');
  return enabled === 'true' || enabled === '1';
}

export async function setStateThrottleOverrideServerAllowed(enabled) {
  await setSetting('state_throttle_override_server_allowed', enabled ? 'true' : 'false');
}

// 命令限频配置
export async function getCmdRateLimits() {
  const value = await getSetting('cmd_rate_limits', '{"global":{"limit":12,"windowMs":10000},"burst":{"limit":60,"windowMs":10000}}');
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed ? parsed : { global: { limit: 12, windowMs: 1000 }, burst: { limit: 60, windowMs: 10000 } };
  } catch {
    return { global: { limit: 12, windowMs: 1000 }, burst: { limit: 60, windowMs: 10000 } };
  }
}

export async function setCmdRateLimits(limits) {
  const normalized = JSON.stringify(limits || {});
  await setSetting('cmd_rate_limits', normalized);
}

export async function getCmdCooldowns() {
  const value = await getSetting(
    'cmd_cooldowns_ms',
    '{"forge":1200,"refine":1200,"effect":1200,"consign":800,"trade":800,"mail":800}'
  );
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export async function setCmdCooldowns(cooldowns) {
  const normalized = JSON.stringify(cooldowns || {});
  await setSetting('cmd_cooldowns_ms', normalized);
}

export async function getConsignExpireHours() {
  const value = await getSetting('consign_expire_hours', '48');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 48;
}

export async function setConsignExpireHours(hours) {
  const normalized = Math.max(0, Math.floor(Number(hours) || 0));
  await setSetting('consign_expire_hours', String(normalized));
}

export async function getRoomVariantCount() {
  const value = await getSetting('room_variant_count', '5');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 5;
}

export async function setRoomVariantCount(count) {
  const normalized = Math.max(1, Math.floor(Number(count) || 1));
  await setSetting('room_variant_count', String(normalized));
}

export async function getSabakStartHour() {
  const value = await getSetting('sabak_start_hour', '20');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(23, Math.max(0, parsed)) : 20;
}

export async function setSabakStartHour(hour) {
  const normalized = Math.min(23, Math.max(0, Math.floor(Number(hour) || 20)));
  await setSetting('sabak_start_hour', String(normalized));
}

export async function getSabakStartMinute() {
  const value = await getSetting('sabak_start_minute', '0');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(59, Math.max(0, parsed)) : 0;
}

export async function setSabakStartMinute(minute) {
  const normalized = Math.min(59, Math.max(0, Math.floor(Number(minute) || 0)));
  await setSetting('sabak_start_minute', String(normalized));
}

export async function getSabakDurationMinutes() {
  const value = await getSetting('sabak_duration_minutes', '10');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 10;
}

export async function setSabakDurationMinutes(minutes) {
  const normalized = Math.max(1, Math.floor(Number(minutes) || 10));
  await setSetting('sabak_duration_minutes', String(normalized));
}

export async function getSabakSiegeMinutes() {
  const value = await getSetting('sabak_siege_minutes', '10');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 10;
}

export async function setSabakSiegeMinutes(minutes) {
  const normalized = Math.max(1, Math.floor(Number(minutes) || 10));
  await setSetting('sabak_siege_minutes', String(normalized));
}

export async function getCrossRankStartHour() {
  const value = await getSetting('cross_rank_start_hour', '19');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(23, Math.max(0, parsed)) : 19;
}

export async function setCrossRankStartHour(hour) {
  const normalized = Math.min(23, Math.max(0, Math.floor(Number(hour) || 19)));
  await setSetting('cross_rank_start_hour', String(normalized));
}

export async function getCrossRankStartMinute() {
  const value = await getSetting('cross_rank_start_minute', '0');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(59, Math.max(0, parsed)) : 0;
}

export async function setCrossRankStartMinute(minute) {
  const normalized = Math.min(59, Math.max(0, Math.floor(Number(minute) || 0)));
  await setSetting('cross_rank_start_minute', String(normalized));
}

export async function getCrossRankDurationMinutes() {
  const value = await getSetting('cross_rank_duration_minutes', '10');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 10;
}

export async function setCrossRankDurationMinutes(minutes) {
  const normalized = Math.max(1, Math.floor(Number(minutes) || 10));
  await setSetting('cross_rank_duration_minutes', String(normalized));
}

export async function getRealmCount() {
  const value = await getSetting('realm_count', '1');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export async function setRealmCount(count) {
  const normalized = Math.max(1, Math.floor(Number(count) || 1));
  await setSetting('realm_count', String(normalized));
}

/**
 * 获取角色已领取VIP激活码的次数（限制每个角色只能领取一次）
 */
export async function getCharacterVipClaimCount(characterName) {
  const count = await getSetting(`vip_claim_count_char_${characterName}`, '0');
  return parseInt(count, 10);
}

/**
 * 增加角色已领取VIP激活码的次数
 */
export async function incrementCharacterVipClaimCount(characterName) {
  const current = await getCharacterVipClaimCount(characterName);
  await setSetting(`vip_claim_count_char_${characterName}`, String(current + 1));
}

/**
 * 获取是否限制VIP领取次数（每个角色只能领取一次）
 */
export async function getVipClaimLimitEnabled() {
  const enabled = await getSetting('vip_claim_limit_enabled', 'false');
  return enabled === 'true' || enabled === '1';
}

/**
 * 设置是否限制VIP领取次数
 */
export async function setVipClaimLimitEnabled(enabled) {
  await setSetting('vip_claim_limit_enabled', enabled ? 'true' : 'false');
}

/**
 * 获取角色是否可以领取VIP激活码
 * 根据 vip_claim_limit_enabled 设置决定是否限制次数
 */
export async function canUserClaimVip(characterName) {
  const limitEnabled = await getVipClaimLimitEnabled();
  if (!limitEnabled) {
    return true;
  }
  const count = await getCharacterVipClaimCount(characterName);
  return count === 0;
}

// 世界BOSS设置
export async function getWorldBossDropBonus() {
  const value = await getSetting('world_boss_drop_bonus', '1.5');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1.5;
}

export async function setWorldBossDropBonus(bonus) {
  const normalized = Math.max(1, Math.floor(Number(bonus || 1.5) * 100) / 100);
  await setSetting('world_boss_drop_bonus', String(normalized));
}

export async function getWorldBossBaseHp() {
  const value = await getSetting('world_boss_base_hp', '600000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 600000;
}

export async function setWorldBossBaseHp(hp) {
  const normalized = Math.max(1, Math.floor(Number(hp) || 600000));
  await setSetting('world_boss_base_hp', String(normalized));
}

export async function getWorldBossBaseAtk() {
  const value = await getSetting('world_boss_base_atk', '180');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 180;
}

export async function setWorldBossBaseAtk(atk) {
  const normalized = Math.max(1, Math.floor(Number(atk) || 180));
  await setSetting('world_boss_base_atk', String(normalized));
}

export async function getWorldBossBaseDef() {
  const value = await getSetting('world_boss_base_def', '210');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 210;
}

export async function setWorldBossBaseDef(def) {
  const normalized = Math.max(1, Math.floor(Number(def) || 210));
  await setSetting('world_boss_base_def', String(normalized));
}

export async function getWorldBossBaseMdef() {
  const value = await getSetting('world_boss_base_mdef', '210');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 210;
}

export async function setWorldBossBaseMdef(mdef) {
  const normalized = Math.max(1, Math.floor(Number(mdef) || 210));
  await setSetting('world_boss_base_mdef', String(normalized));
}

export async function getWorldBossBaseExp() {
  const value = await getSetting('world_boss_base_exp', '9000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 9000;
}

export async function setWorldBossBaseExp(exp) {
  const normalized = Math.max(1, Math.floor(Number(exp) || 9000));
  await setSetting('world_boss_base_exp', String(normalized));
}

export async function getWorldBossBaseGold() {
  const value = await getSetting('world_boss_base_gold', '2000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 2000;
}

export async function setWorldBossBaseGold(gold) {
  const normalized = Math.max(0, Math.floor(Number(gold) || 2000));
  await setSetting('world_boss_base_gold', String(normalized));
}

export async function getWorldBossRespawnMinutes() {
  const value = await getSetting('world_boss_respawn_minutes', '60');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 60;
}

export async function setWorldBossRespawnMinutes(minutes) {
  const normalized = Math.max(1, Math.floor(Number(minutes) || 60));
  await setSetting('world_boss_respawn_minutes', String(normalized));
}

// 按人数分段加成配置
// 格式: [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}]
// 1人: +1000攻击, +5000防御, +5000魔御
// 2人及以上: +1000攻击, 防御和魔御恢复基础
export async function getWorldBossPlayerBonusConfig() {
  const value = await getSetting('world_boss_player_bonus', '[{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}]');
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}];
  } catch {
    return [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}];
  }
}

export async function setWorldBossPlayerBonusConfig(config) {
  const normalized = JSON.stringify(config || []);
  await setSetting('world_boss_player_bonus', normalized);
}

// 特殊BOSS配置（魔龙BOSS、暗之系列BOSS、沙巴克BOSS统一配置）
export async function getSpecialBossDropBonus() {
  const value = await getSetting('special_boss_drop_bonus', '1.5');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1.5;
}

export async function setSpecialBossDropBonus(bonus) {
  const normalized = Math.max(1, Math.floor(Number(bonus || 1.5) * 100) / 100);
  await setSetting('special_boss_drop_bonus', String(normalized));
}

export async function getSpecialBossBaseHp() {
  const value = await getSetting('special_boss_base_hp', '600000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 600000;
}

export async function setSpecialBossBaseHp(hp) {
  const normalized = Math.max(1, Math.floor(Number(hp) || 600000));
  await setSetting('special_boss_base_hp', String(normalized));
}

export async function getSpecialBossBaseAtk() {
  const value = await getSetting('special_boss_base_atk', '180');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 180;
}

export async function setSpecialBossBaseAtk(atk) {
  const normalized = Math.max(1, Math.floor(Number(atk) || 180));
  await setSetting('special_boss_base_atk', String(normalized));
}

export async function getSpecialBossBaseDef() {
  const value = await getSetting('special_boss_base_def', '210');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 210;
}

export async function setSpecialBossBaseDef(def) {
  const normalized = Math.max(1, Math.floor(Number(def) || 210));
  await setSetting('special_boss_base_def', String(normalized));
}

export async function getSpecialBossBaseMdef() {
  const value = await getSetting('special_boss_base_mdef', '210');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 210;
}

export async function setSpecialBossBaseMdef(mdef) {
  const normalized = Math.max(1, Math.floor(Number(mdef) || 210));
  await setSetting('special_boss_base_mdef', String(normalized));
}

export async function getSpecialBossBaseExp() {
  const value = await getSetting('special_boss_base_exp', '9000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 9000;
}

export async function setSpecialBossBaseExp(exp) {
  const normalized = Math.max(1, Math.floor(Number(exp) || 9000));
  await setSetting('special_boss_base_exp', String(normalized));
}

export async function getSpecialBossBaseGold() {
  const value = await getSetting('special_boss_base_gold', '2000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 2000;
}

export async function setSpecialBossBaseGold(gold) {
  const normalized = Math.max(0, Math.floor(Number(gold) || 2000));
  await setSetting('special_boss_base_gold', String(normalized));
}

export async function getSpecialBossRespawnMinutes() {
  const value = await getSetting('special_boss_respawn_minutes', '60');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 60;
}

export async function setSpecialBossRespawnMinutes(minutes) {
  const normalized = Math.max(1, Math.floor(Number(minutes) || 60));
  await setSetting('special_boss_respawn_minutes', String(normalized));
}

export async function getSpecialBossPlayerBonusConfig() {
  const value = await getSetting('special_boss_player_bonus', '[{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}]');
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}];
  } catch {
    return [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}];
  }
}

export async function setSpecialBossPlayerBonusConfig(config) {
  const normalized = JSON.stringify(config || []);
  await setSetting('special_boss_player_bonus', normalized);
}

// 修真BOSS配置
export async function getCultivationBossDropBonus() {
  const value = await getSetting('cultivation_boss_drop_bonus', '1.5');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1.5;
}

export async function setCultivationBossDropBonus(bonus) {
  const normalized = Math.max(1, Math.floor(Number(bonus || 1.5) * 100) / 100);
  await setSetting('cultivation_boss_drop_bonus', String(normalized));
}

export async function getCultivationBossPlayerBonusConfig() {
  const value = await getSetting('cultivation_boss_player_bonus', '[{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}]');
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}];
  } catch {
    return [{"min":1,"hp":0,"atk":1000,"def":5000,"mdef":5000},{"min":2,"hp":0,"atk":1000,"def":0,"mdef":0}];
  }
}

export async function setCultivationBossPlayerBonusConfig(config) {
  const normalized = JSON.stringify(config || []);
  await setSetting('cultivation_boss_player_bonus', normalized);
}

// 修真BOSS配置（按倍率调整，保持各阶层差异）
export async function getCultivationBossBaseHp() {
  const value = await getSetting('cultivation_boss_base_hp', '12000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 12000;
}

export async function setCultivationBossBaseHp(hp) {
  const normalized = Math.max(1, Math.floor(Number(hp) || 12000));
  await setSetting('cultivation_boss_base_hp', String(normalized));
}

export async function getCultivationBossBaseAtk() {
  const value = await getSetting('cultivation_boss_base_atk', '180');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 180;
}

export async function setCultivationBossBaseAtk(atk) {
  const normalized = Math.max(1, Math.floor(Number(atk) || 180));
  await setSetting('cultivation_boss_base_atk', String(normalized));
}

export async function getCultivationBossBaseDef() {
  const value = await getSetting('cultivation_boss_base_def', '80');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 80;
}

export async function setCultivationBossBaseDef(def) {
  const normalized = Math.max(0, Math.floor(Number(def) || 80));
  await setSetting('cultivation_boss_base_def', String(normalized));
}

export async function getCultivationBossBaseMdef() {
  const value = await getSetting('cultivation_boss_base_mdef', '80');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 80;
}

export async function setCultivationBossBaseMdef(mdef) {
  const normalized = Math.max(0, Math.floor(Number(mdef) || 80));
  await setSetting('cultivation_boss_base_mdef', String(normalized));
}

export async function getCultivationBossBaseExp() {
  const value = await getSetting('cultivation_boss_base_exp', '6000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 6000;
}

export async function setCultivationBossBaseExp(exp) {
  const normalized = Math.max(1, Math.floor(Number(exp) || 6000));
  await setSetting('cultivation_boss_base_exp', String(normalized));
}

export async function getCultivationBossBaseGold() {
  const value = await getSetting('cultivation_boss_base_gold', '1000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 1000;
}

export async function setCultivationBossBaseGold(gold) {
  const normalized = Math.max(0, Math.floor(Number(gold) || 1000));
  await setSetting('cultivation_boss_base_gold', String(normalized));
}

export async function getCultivationBossRespawnMinutes() {
  const value = await getSetting('cultivation_boss_respawn_minutes', '30');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 30;
}

export async function setCultivationBossRespawnMinutes(minutes) {
  const normalized = Math.max(1, Math.floor(Number(minutes) || 30));
  await setSetting('cultivation_boss_respawn_minutes', String(normalized));
}

// 职业升级属性配置
export async function getClassLevelBonusConfig(classId) {
  const value = await getSetting(`class_level_bonus_${classId}`, null);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

export async function setClassLevelBonusConfig(classId, config) {
  const normalized = JSON.stringify(config || {});
  await setSetting(`class_level_bonus_${classId}`, normalized);
}

// 修炼系统每级效果配置
export async function getTrainingPerLevelConfig() {
  const value = await getSetting('training_per_level', '{"hp":1,"mp":1,"atk":0.1,"def":0.1,"mag":0.1,"mdef":0.1,"spirit":0.1,"dex":0.1}');
  try {
    const parsed = JSON.parse(value);
    return {
      hp: typeof parsed.hp === 'number' ? parsed.hp : 1,
      mp: typeof parsed.mp === 'number' ? parsed.mp : 1,
      atk: typeof parsed.atk === 'number' ? parsed.atk : 0.1,
      def: typeof parsed.def === 'number' ? parsed.def : 0.1,
      mag: typeof parsed.mag === 'number' ? parsed.mag : 0.1,
      mdef: typeof parsed.mdef === 'number' ? parsed.mdef : 0.1,
      spirit: typeof parsed.spirit === 'number' ? parsed.spirit : 0.1,
      dex: typeof parsed.dex === 'number' ? parsed.dex : 0.1
    };
  } catch (e) {
    return { hp: 1, mp: 1, atk: 0.1, def: 0.1, mag: 0.1, mdef: 0.1, spirit: 0.1, dex: 0.1 };
  }
}

export async function setTrainingPerLevelConfig(config) {
  const normalized = JSON.stringify(config || {});
  await setSetting('training_per_level', normalized);
}

// 修炼果系数配置
export async function getTrainingFruitCoefficient() {
  const value = await getSetting('training_fruit_coefficient', '0.5');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0.5;
}

// 锻造系统配置
// 锻造成功率：基础成功率(%)，第2级开始使用
export async function getRefineBaseSuccessRate() {
  const value = await getSetting('refine_base_success_rate', '50');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : 50;
}

export async function setRefineBaseSuccessRate(rate) {
  const normalized = Math.max(1, Math.min(100, Number(rate) || 50));
  await setSetting('refine_base_success_rate', String(normalized));
}

// 锻造成功率衰减：每10级降低的百分比
export async function getRefineDecayRate() {
  const value = await getSetting('refine_decay_rate', '3');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 3;
}

export async function setRefineDecayRate(rate) {
  const normalized = Math.max(0, Number(rate) || 3);
  await setSetting('refine_decay_rate', String(normalized));
}

// 锻造所需材料数量
export async function getRefineMaterialCount() {
  const value = await getSetting('refine_material_count', '20');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 20;
}

export async function setRefineMaterialCount(count) {
  const normalized = Math.max(1, Math.floor(Number(count) || 20));
  await setSetting('refine_material_count', String(normalized));
}

// 特效重置成功率(%)
export async function getEffectResetSuccessRate() {
  const value = await getSetting('effect_reset_success_rate', '0.1');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.1;
}

export async function setEffectResetSuccessRate(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.1));
  await setSetting('effect_reset_success_rate', String(normalized));
}

// 特效重置双特效概率(%)
export async function getEffectResetDoubleRate() {
  const value = await getSetting('effect_reset_double_rate', '0.01');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.01;
}

export async function setEffectResetDoubleRate(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.01));
  await setSetting('effect_reset_double_rate', String(normalized));
}

// 特效重置3特效概率(%)
export async function getEffectResetTripleRate() {
  const value = await getSetting('effect_reset_triple_rate', '0.001');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.001;
}

export async function setEffectResetTripleRate(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.001));
  await setSetting('effect_reset_triple_rate', String(normalized));
}

// 特效重置4特效概率(%)
export async function getEffectResetQuadrupleRate() {
  const value = await getSetting('effect_reset_quadruple_rate', '0.0001');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.0001;
}

export async function setEffectResetQuadrupleRate(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.0001));
  await setSetting('effect_reset_quadruple_rate', String(normalized));
}

// 特效重置5特效概率(%)
export async function getEffectResetQuintupleRate() {
  const value = await getSetting('effect_reset_quintuple_rate', '0.00001');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.00001;
}

export async function setEffectResetQuintupleRate(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.00001));
  await setSetting('effect_reset_quintuple_rate', String(normalized));
}

// 锻造每级加成值
export async function getRefineBonusPerLevel() {
  const value = await getSetting('refine_bonus_per_level', '1');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 1;
}

export async function setRefineBonusPerLevel(bonus) {
  const normalized = Math.max(0, Number(bonus) || 1);
  await setSetting('refine_bonus_per_level', String(normalized));
}

export async function setTrainingFruitCoefficient(coefficient) {
  const normalized = Math.max(0, Number(coefficient) || 0.5);
  await setSetting('training_fruit_coefficient', String(normalized));
}

// 修炼果爆率配置
export async function getTrainingFruitDropRate() {
  const value = await getSetting('training_fruit_drop_rate', '0.01');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.01;
}

export async function setTrainingFruitDropRate(rate) {
  const normalized = Math.max(0, Math.min(1, Number(rate) || 0.01));
  await setSetting('training_fruit_drop_rate', String(normalized));
}

export async function getTrainingFruitDropEnabled() {
  const value = await getSetting('training_fruit_drop_enabled', 'true');
  return value === 'true' || value === '1';
}

export async function setTrainingFruitDropEnabled(enabled) {
  await setSetting('training_fruit_drop_enabled', enabled ? 'true' : 'false');
}

export async function getPetTrainingFruitDropRate() {
  const value = await getSetting('pet_training_fruit_drop_rate', '0.01');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.01;
}

export async function setPetTrainingFruitDropRate(rate) {
  const normalized = Math.max(0, Math.min(1, Number(rate) || 0.01));
  await setSetting('pet_training_fruit_drop_rate', String(normalized));
}

export async function getPetTrainingFruitDropEnabled() {
  const value = await getSetting('pet_training_fruit_drop_enabled', 'true');
  return value === 'true' || value === '1';
}

export async function setPetTrainingFruitDropEnabled(enabled) {
  await setSetting('pet_training_fruit_drop_enabled', enabled ? 'true' : 'false');
}

/**
 * 获取缓存怪物血量开关
 */
export async function getCacheMonsterHealthEnabled() {
  const enabled = await getSetting('cache_monster_health_enabled', 'true');
  return enabled === 'true' || enabled === '1';
}

/**
 * 设置缓存怪物血量开关
 */
export async function setCacheMonsterHealthEnabled(enabled) {
  await setSetting('cache_monster_health_enabled', enabled ? 'true' : 'false');
}

// 玩家保存频率配置
export async function getPlayerSaveDebounceMs() {
  const value = await getSetting('player_save_debounce_ms', '500');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 500;
}

export async function setPlayerSaveDebounceMs(value) {
  const normalized = Math.max(0, Math.floor(Number(value) || 0));
  await setSetting('player_save_debounce_ms', String(normalized));
}

export async function getPlayerSaveMinIntervalMs() {
  const value = await getSetting('player_save_min_interval_ms', '500');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 500;
}

export async function setPlayerSaveMinIntervalMs(value) {
  const normalized = Math.max(0, Math.floor(Number(value) || 0));
  await setSetting('player_save_min_interval_ms', String(normalized));
}

export async function getPlayerSaveManagedMinIntervalMs() {
  const value = await getSetting('player_save_managed_min_interval_ms', '20000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 20000;
}

export async function setPlayerSaveManagedMinIntervalMs(value) {
  const normalized = Math.max(0, Math.floor(Number(value) || 0));
  await setSetting('player_save_managed_min_interval_ms', String(normalized));
}

export async function getPlayerSaveManagedForceIntervalMs() {
  const value = await getSetting('player_save_managed_force_interval_ms', '300000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(10000, parsed) : 300000;
}

export async function setPlayerSaveManagedForceIntervalMs(value) {
  const normalized = Math.max(10000, Math.floor(Number(value) || 0));
  await setSetting('player_save_managed_force_interval_ms', String(normalized));
}

export async function getPlayerSaveDetachedMinIntervalMs() {
  const value = await getSetting('player_save_detached_min_interval_ms', '60000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 60000;
}

export async function setPlayerSaveDetachedMinIntervalMs(value) {
  const normalized = Math.max(0, Math.floor(Number(value) || 0));
  await setSetting('player_save_detached_min_interval_ms', String(normalized));
}

export async function getPlayerSaveForceDeadlineMs() {
  const value = await getSetting('player_save_force_deadline_ms', '30000');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 30000;
}

export async function setPlayerSaveForceDeadlineMs(value) {
  const normalized = Math.max(0, Math.floor(Number(value) || 0));
  await setSetting('player_save_force_deadline_ms', String(normalized));
}

export async function getPlayerSaveMaxWritesPerFlush() {
  const value = await getSetting('player_save_max_writes_per_flush', '80');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 80;
}

export async function setPlayerSaveMaxWritesPerFlush(value) {
  const normalized = Math.max(1, Math.floor(Number(value) || 80));
  await setSetting('player_save_max_writes_per_flush', String(normalized));
}

export async function getPlayerSaveForceFullEnabled() {
  const enabled = await getSetting('player_save_force_full_enabled', 'true');
  return enabled === 'true' || enabled === '1';
}

export async function setPlayerSaveForceFullEnabled(enabled) {
  await setSetting('player_save_force_full_enabled', enabled ? 'true' : 'false');
}

// 特效装备掉落配置
export async function getEffectDropSingleChance() {
  const value = await getSetting('effect_drop_single_chance', '0.009');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.009;
}

export async function setEffectDropSingleChance(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.009));
  await setSetting('effect_drop_single_chance', String(normalized));
}

export async function getEffectDropDoubleChance() {
  const value = await getSetting('effect_drop_double_chance', '0.001');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.001;
}

export async function setEffectDropDoubleChance(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.001));
  await setSetting('effect_drop_double_chance', String(normalized));
}

export async function getEquipSkillDropChance() {
  const value = await getSetting('equip_skill_drop_chance', '0.5');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0.5;
}

export async function setEquipSkillDropChance(rate) {
  const normalized = Math.max(0, Math.min(100, Number(rate) || 0.5));
  await setSetting('equip_skill_drop_chance', String(normalized));
}

// 法宝系统配置
export async function getTreasureSlotCount() {
  const value = await getSetting('treasure_slot_count', '6');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 6;
}

export async function setTreasureSlotCount(count) {
  const normalized = Math.max(1, Math.floor(Number(count) || 6));
  await setSetting('treasure_slot_count', String(normalized));
}

export async function getTreasureMaxLevel() {
  const value = await getSetting('treasure_max_level', '999999');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 999999;
}

export async function setTreasureMaxLevel(level) {
  const normalized = Math.max(1, Math.floor(Number(level) || 999999));
  await setSetting('treasure_max_level', String(normalized));
}

export async function getTreasureUpgradeConsume() {
  const value = await getSetting('treasure_upgrade_consume', '2');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 2;
}

export async function setTreasureUpgradeConsume(consume) {
  const normalized = Math.max(1, Math.floor(Number(consume) || 2));
  await setSetting('treasure_upgrade_consume', String(normalized));
}

export async function getTreasureAdvanceConsume() {
  const value = await getSetting('treasure_advance_consume', '1');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export async function setTreasureAdvanceConsume(consume) {
  const normalized = Math.max(1, Math.floor(Number(consume) || 1));
  await setSetting('treasure_advance_consume', String(normalized));
}

export async function getTreasureAdvancePerStage() {
  const value = await getSetting('treasure_advance_per_stage', '10');
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 10;
}

export async function setTreasureAdvancePerStage(count) {
  const normalized = Math.max(1, Math.floor(Number(count) || 10));
  await setSetting('treasure_advance_per_stage', String(normalized));
}

export async function getTreasureAdvanceEffectBonusPerStack() {
  const value = await getSetting('treasure_advance_effect_bonus_per_stack', '0.001');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0.001;
}

export async function setTreasureAdvanceEffectBonusPerStack(bonus) {
  const normalized = Math.max(0, Number(bonus) || 0.001);
  await setSetting('treasure_advance_effect_bonus_per_stack', String(normalized));
}

export async function getTreasureWorldBossDropMultiplier() {
  const value = await getSetting('treasure_world_boss_drop_multiplier', '1');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 1;
}

export async function setTreasureWorldBossDropMultiplier(multiplier) {
  const normalized = Math.max(0, Number(multiplier) || 1);
  await setSetting('treasure_world_boss_drop_multiplier', String(normalized));
}

export async function getTreasureCrossWorldBossDropMultiplier() {
  const value = await getSetting('treasure_cross_world_boss_drop_multiplier', '1');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 1;
}

export async function setTreasureCrossWorldBossDropMultiplier(multiplier) {
  const normalized = Math.max(0, Number(multiplier) || 1);
  await setSetting('treasure_cross_world_boss_drop_multiplier', String(normalized));
}

export async function getTreasureTowerXuanmingDropChance() {
  const value = await getSetting('treasure_tower_xuanming_drop_chance', '0.2');
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.2;
}

export async function setTreasureTowerXuanmingDropChance(chance) {
  const normalized = Math.max(0, Math.min(1, Number(chance) || 0.2));
  await setSetting('treasure_tower_xuanming_drop_chance', String(normalized));
}

export async function getUltimateGrowthConfig() {
  const raw = await getSetting('ultimate_growth_config', '');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function setUltimateGrowthConfig(config) {
  const payload = config && typeof config === 'object' ? config : {};
  await setSetting('ultimate_growth_config', JSON.stringify(payload));
}

