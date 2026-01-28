import knex from './index.js';

/**
 * 获取游戏设置
 */
export async function getSetting(key, defaultValue = null) {
  const row = await knex('game_settings').where({ key }).first();
  return row ? row.value : defaultValue;
}

/**
 * 设置游戏配置
 */
export async function setSetting(key, value) {
  await knex('game_settings')
    .insert({ key, value })
    .onConflict('key')
    .merge({ value, updated_at: knex.fn.now() });
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

/**
 * 设置掉落日志开关
 */
export async function setLootLogEnabled(enabled) {
  await setSetting('loot_log_enabled', enabled ? 'true' : 'false');
}

/**
 * 获取状态刷新节流开关
 */
export async function getStateThrottleEnabled() {
  const enabled = await getSetting('state_throttle_enabled', 'false');
  return enabled === 'true' || enabled === '1';
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
 * 获取角色是否可以领取VIP激活码（限制每个角色只能领取一次）
 */
export async function canUserClaimVip(characterName) {
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
