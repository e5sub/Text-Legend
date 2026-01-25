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
 * 获取VIP自助获取开关
 */
export async function getVipSelfClaimEnabled() {
  const enabled = await getSetting('vip_self_claim_enabled', 'true');
  return enabled === 'true' || enabled === '1';
}

/**
 * 设置VIP自助获取开关
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

/**
 * 设置掉落日志开关
 */
export async function setLootLogEnabled(enabled) {
  await setSetting('loot_log_enabled', enabled ? 'true' : 'false');
}

/**
 * 获取玩家已领取的VIP激活码数量
 */
export async function getUserVipClaimCount(userId) {
  const count = await getSetting(`vip_claim_count_${userId}`, '0');
  return parseInt(count, 10);
}

/**
 * 增加玩家已领取的VIP激活码数量
 */
export async function incrementUserVipClaimCount(userId) {
  const current = await getUserVipClaimCount(userId);
  await setSetting(`vip_claim_count_${userId}`, String(current + 1));
}

/**
 * 获取玩家可以领取的VIP激活码数量（限制每个账号只能领取1次）
 */
export async function canUserClaimVip(userId) {
  const count = await getUserVipClaimCount(userId);
  return count === 0;
}
