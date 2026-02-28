import { WORLD } from './world.js';
import { MOB_TEMPLATES } from './mobs.js';
import { ITEM_TEMPLATES } from './items.js';

const CN_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

const DOUBLE_DUNGEON_ZONE_IDS = ['dssv', 'mine', 'wgc', 'sm', 'wms', 'zm', 'cr'];
const WORLD_BOSS_BOUNTY_IDS = Object.values(MOB_TEMPLATES || {})
  .filter((m) => m && m.id && m.worldBoss && m.id !== 'cross_world_boss' && m.id !== 'vip_personal_boss' && m.id !== 'svip_personal_boss')
  .map((m) => m.id);

const ACTIVITY_DEFS = [
  { id: 'demon_slayer_order', name: '限时屠魔令', type: 'daily', desc: '击杀各类BOSS获得积分（个人）' },
  { id: 'cultivation_rush_week', name: '修真冲关周', type: 'weekly', desc: '修真BOSS奖励加成与击杀任务' },
  { id: 'refine_carnival', name: '锻造狂欢', type: 'weekly', desc: '锻造材料减免与里程碑统计' },
  { id: 'guild_boss_assault', name: '行会攻坚赛', type: 'weekly', desc: '击杀BOSS累计行会战功（个人贡献）' },
  { id: 'cross_hunter', name: '跨服猎王', type: 'weekly', desc: '跨服玩法时段加成活动' },
  { id: 'treasure_pet_festival', name: '宝藏奇缘', type: 'weekly', desc: '法宝与宠物养成节日（主活动）' },
  { id: 'double_dungeon', name: '双倍秘境', type: 'daily', desc: '每日轮换地图，经验金币双倍' },
  { id: 'pet_carnival_day', name: '宠物狂欢日', type: 'weekly', desc: '宠物打书与合成活跃加成' },
  { id: 'treasure_sprint_day', name: '法宝冲刺日', type: 'weekly', desc: '法宝升级与升段活跃加成' },
  { id: 'world_boss_bounty', name: '世界BOSS悬赏', type: 'daily', desc: '每日指定悬赏BOSS，击杀获得悬赏积分' },
  { id: 'newbie_catchup', name: '新人追赶计划', type: 'always', desc: '未修真玩家打怪经验加成' },
  { id: 'lucky_drop_day', name: '幸运掉落日', type: 'weekly', desc: '指定时段BOSS活动积分额外加成' },
  { id: 'harvest_season', name: '丰收季', type: 'daily', desc: '每日签到、挂机进度、丰收赐福、收菜补给与整点巡礼活动' }
];

const DEFAULT_HARVEST_SEASON_REWARD_CONFIG = {
  version: 1,
  items: [
    { id: 'harvest_30', threshold: 30, title: '丰收挂机奖励', gold: 100000, itemId: 'training_fruit', itemQty: 5, sort: 0 },
    { id: 'harvest_60', threshold: 60, title: '丰收挂机奖励', gold: 160000, itemId: 'pet_training_fruit', itemQty: 5, sort: 1 },
    { id: 'harvest_120', threshold: 120, title: '丰收挂机奖励', gold: 220000, itemId: 'treasure_exp_material', itemQty: 10, sort: 2 },
    { id: 'harvest_180', threshold: 180, title: '丰收挂机奖励', gold: 300000, itemId: 'ultimate_growth_stone', itemQty: 5, sort: 3 }
  ]
};

const DEFAULT_HARVEST_SEASON_SIGN_CONFIG = {
  version: 1,
  title: '丰收签到奖励',
  points: 20,
  gold: 200000,
  items: [
    { id: 'training_fruit', qty: 5 },
    { id: 'pet_training_fruit', qty: 5 },
    { id: 'treasure_exp_material', qty: 5 }
  ]
};

let harvestSeasonRewardConfigCache = JSON.parse(JSON.stringify(DEFAULT_HARVEST_SEASON_REWARD_CONFIG));
let harvestSeasonSignConfigCache = JSON.parse(JSON.stringify(DEFAULT_HARVEST_SEASON_SIGN_CONFIG));

function isHarvestPatrolWindow(now = Date.now()) {
  const t = getChinaDate(now);
  return t.minute >= 0 && t.minute < 10;
}

function describeRewardBundle(reward = {}) {
  const parts = [];
  const gold = Math.max(0, Math.floor(Number(reward?.gold || 0)));
  if (gold > 0) parts.push(`${gold} 金币`);
  const items = Array.isArray(reward?.items) ? reward.items : [];
  items.forEach((entry) => {
    const itemId = String(entry?.id || '').trim();
    const qty = Math.max(1, Math.floor(Number(entry?.qty || 1)));
    const tpl = ITEM_TEMPLATES?.[itemId];
    parts.push(`${tpl?.name || itemId} x${qty}`);
  });
  return parts.join('、');
}

export function normalizeHarvestSeasonRewardConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const list = Array.isArray(src.items) ? src.items : [];
  const items = list.map((entry, index) => {
    const threshold = Math.max(1, Math.floor(Number(entry?.threshold || 0)));
    if (threshold <= 0) return null;
    const itemId = String(entry?.itemId || '').trim();
    if (itemId && !ITEM_TEMPLATES[itemId]) return null;
    const gold = Math.max(0, Math.floor(Number(entry?.gold || 0)));
    const itemQty = Math.max(1, Math.floor(Number(entry?.itemQty || 1)));
    if (!gold && !itemId) return null;
    return {
      id: String(entry?.id || `harvest_${threshold}_${index + 1}`).trim(),
      threshold,
      title: String(entry?.title || '丰收挂机奖励').trim() || '丰收挂机奖励',
      gold,
      itemId,
      itemQty,
      sort: Number.isFinite(Number(entry?.sort)) ? Number(entry.sort) : index
    };
  }).filter(Boolean);
  items.sort((a, b) => (a.threshold - b.threshold) || (a.sort - b.sort) || a.id.localeCompare(b.id));
  if (!items.length) {
    return JSON.parse(JSON.stringify(DEFAULT_HARVEST_SEASON_REWARD_CONFIG));
  }
  return { version: 1, items };
}

export function getHarvestSeasonRewardConfig() {
  return normalizeHarvestSeasonRewardConfig(harvestSeasonRewardConfigCache);
}

export function setHarvestSeasonRewardConfig(raw) {
  harvestSeasonRewardConfigCache = normalizeHarvestSeasonRewardConfig(raw);
  return getHarvestSeasonRewardConfig();
}

export function normalizeHarvestSeasonSignConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const hasItems = Array.isArray(src.items);
  const sourceItems = hasItems ? src.items : DEFAULT_HARVEST_SEASON_SIGN_CONFIG.items;
  const items = sourceItems
    .map((entry) => ({
      id: String(entry?.id || '').trim(),
      qty: Math.max(1, Math.floor(Number(entry?.qty || 1)))
    }))
    .filter((entry) => entry.id && ITEM_TEMPLATES?.[entry.id]);
  return {
    version: 1,
    title: String(src.title || DEFAULT_HARVEST_SEASON_SIGN_CONFIG.title).trim() || DEFAULT_HARVEST_SEASON_SIGN_CONFIG.title,
    points: Math.max(0, Math.floor(Number(src.points ?? DEFAULT_HARVEST_SEASON_SIGN_CONFIG.points) || 0)),
    gold: Math.max(0, Math.floor(Number(src.gold ?? DEFAULT_HARVEST_SEASON_SIGN_CONFIG.gold) || 0)),
    items: hasItems ? items : DEFAULT_HARVEST_SEASON_SIGN_CONFIG.items.map((entry) => ({ ...entry }))
  };
}

export function getHarvestSeasonSignConfig() {
  return normalizeHarvestSeasonSignConfig(harvestSeasonSignConfigCache);
}

export function setHarvestSeasonSignConfig(raw) {
  harvestSeasonSignConfigCache = normalizeHarvestSeasonSignConfig(raw);
  return getHarvestSeasonSignConfig();
}

function getChinaDate(now = Date.now()) {
  const d = new Date(now + CN_TZ_OFFSET_MS);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekday = d.getUTCDay(); // 0 Sun ... 6 Sat
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const minuteOfDay = hour * 60 + minute;
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const weekStart = new Date(Date.UTC(year, d.getUTCMonth(), day));
  const delta = (weekday + 6) % 7; // Monday=0
  weekStart.setUTCDate(weekStart.getUTCDate() - delta);
  const weekKey = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}-${String(weekStart.getUTCDate()).padStart(2, '0')}`;
  return { year, month, day, weekday, hour, minute, minuteOfDay, dateKey, weekKey };
}

export function getChinaDateParts(now = Date.now()) {
  return getChinaDate(now);
}

export function formatPrevDateKey(now = Date.now()) {
  const t = getChinaDate(now);
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day));
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function formatPrevWeekKey(now = Date.now()) {
  const t = getChinaDate(now);
  const [y, m, d] = String(t.weekKey).split('-').map((v) => Number(v));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() - 7);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function inWindow(minuteOfDay, start, end) {
  return minuteOfDay >= start && minuteOfDay < end;
}

function dailyIndex(dateKey = '') {
  return String(dateKey || '')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export function getDoubleDungeonTarget(now = Date.now()) {
  const t = getChinaDate(now);
  const zones = DOUBLE_DUNGEON_ZONE_IDS.filter((id) => WORLD?.[id]);
  const zoneId = zones.length ? zones[dailyIndex(t.dateKey) % zones.length] : 'bq_plains';
  return {
    zoneId,
    zoneName: WORLD?.[zoneId]?.name || zoneId,
    expMult: 2,
    goldMult: 2
  };
}

export function getWorldBossBountyTarget(now = Date.now()) {
  const t = getChinaDate(now);
  const list = WORLD_BOSS_BOUNTY_IDS.length ? WORLD_BOSS_BOUNTY_IDS : ['cross_world_boss'];
  const mobId = list[dailyIndex(`${t.dateKey}:bounty`) % list.length];
  const mob = MOB_TEMPLATES?.[mobId];
  return {
    mobId,
    mobName: mob?.name || mobId
  };
}

export function isActivityActive(id, now = Date.now()) {
  const t = getChinaDate(now);
  switch (id) {
    case 'demon_slayer_order':
      return inWindow(t.minuteOfDay, 20 * 60, 20 * 60 + 30);
    case 'cultivation_rush_week':
      return t.weekday === 6 || t.weekday === 0; // Sat/Sun
    case 'refine_carnival':
      return t.weekday === 5 || t.weekday === 6 || t.weekday === 0; // Fri-Sun
    case 'guild_boss_assault':
      return inWindow(t.minuteOfDay, 21 * 60, 22 * 60) && (t.weekday === 2 || t.weekday === 6); // Tue/Sat
    case 'cross_hunter':
      return t.weekday === 6 && inWindow(t.minuteOfDay, 19 * 60 + 30, 20 * 60 + 30); // Sat 19:30-20:30
    case 'treasure_pet_festival':
      return t.weekday === 0; // Sun
    case 'double_dungeon':
      return inWindow(t.minuteOfDay, 18 * 60, 24 * 60); // daily evening
    case 'pet_carnival_day':
      return t.weekday === 5; // Fri
    case 'treasure_sprint_day':
      return t.weekday === 6; // Sat
    case 'world_boss_bounty':
      return true;
    case 'newbie_catchup':
      return true;
    case 'lucky_drop_day':
      return t.weekday === 3 && inWindow(t.minuteOfDay, 19 * 60, 24 * 60); // Wed evening
    case 'harvest_season':
      return true;
    default:
      return false;
  }
}

export function listActiveActivities(now = Date.now()) {
  return ACTIVITY_DEFS.filter((def) => isActivityActive(def.id, now)).map((def) => ({
    id: def.id,
    name: def.name,
    desc: def.desc
  }));
}

function ensureFlags(player) {
  if (!player.flags) player.flags = {};
  if (!player.flags.activityProgress || typeof player.flags.activityProgress !== 'object') {
    player.flags.activityProgress = {};
  }
  return player.flags.activityProgress;
}

export function normalizeActivityProgress(player, now = Date.now()) {
  const t = getChinaDate(now);
  const ap = ensureFlags(player);
  if (ap._dailyKey !== t.dateKey) {
    ap._dailyKey = t.dateKey;
    ap.demonSlayer = { points: 0, bossKills: 0, lastHitBonus: 0 };
    ap.guildAssault = { contribution: 0 };
    ap.luckyDropDay = { points: 0, bossKills: 0, lastHitBonus: 0 };
    ap.doubleDungeon = { zoneId: getDoubleDungeonTarget(now).zoneId, kills: 0, score: 0 };
    ap.worldBossBounty = { mobId: getWorldBossBountyTarget(now).mobId, points: 0, kills: 0, lastHitBonus: 0 };
    ap.petCarnival = { petBookUses: 0, petSyntheses: 0, score: 0 };
    ap.treasureSprint = { treasureUpgrades: 0, treasureAdvances: 0, score: 0 };
    ap.harvestSeason = {
      loginClaimed: false,
      onlineMinutes: 0,
      patrolPoints: 0,
      minuteStamp: 0,
      blessingClaimed: false,
      supplyClaimed: false,
      blessing: null
    };
    ap.refineCarnival = ap.refineCarnival && ap.refineCarnival._weekKey === t.weekKey
      ? ap.refineCarnival
      : { _weekKey: t.weekKey, attempts: 0, milestones: {} };
  }
  if (!ap.cultivationRush || ap.cultivationRush._weekKey !== t.weekKey) {
    ap.cultivationRush = { _weekKey: t.weekKey, kills: 0 };
  }
  if (!ap.crossHunter || ap.crossHunter._weekKey !== t.weekKey) {
    ap.crossHunter = { _weekKey: t.weekKey, points: 0, kills: 0 };
  }
  if (!ap.treasurePetFestival || ap.treasurePetFestival._weekKey !== t.weekKey) {
    ap.treasurePetFestival = {
      _weekKey: t.weekKey,
      treasureUpgrades: 0,
      treasureAdvances: 0,
      petBookUses: 0,
      petSyntheses: 0,
      score: 0
    };
  }
  if (!ap.refineCarnival || ap.refineCarnival._weekKey !== t.weekKey) {
    ap.refineCarnival = { _weekKey: t.weekKey, attempts: 0, milestones: {} };
  }
  ap.activityPoints = Math.max(0, Math.floor(Number(ap.activityPoints || 0)));
  ap.activityPointsEarned = Math.max(0, Math.floor(Number(ap.activityPointsEarned || 0)));
  ap.activityPointsSpent = Math.max(0, Math.floor(Number(ap.activityPointsSpent || 0)));
  if (!ap.pointShopRedeems || typeof ap.pointShopRedeems !== 'object') ap.pointShopRedeems = {};
  if (!ap.pointShopRedeems.daily || ap.pointShopRedeems.daily._dateKey !== t.dateKey) {
    ap.pointShopRedeems.daily = { _dateKey: t.dateKey, keys: {} };
  }
  if (!ap.pointShopRedeems.weekly || ap.pointShopRedeems.weekly._weekKey !== t.weekKey) {
    ap.pointShopRedeems.weekly = { _weekKey: t.weekKey, keys: {} };
  }
  if (!ap.pointShopRedeems.lifetime || typeof ap.pointShopRedeems.lifetime !== 'object') {
    ap.pointShopRedeems.lifetime = {};
  }
  if (!ap.harvestSeason || typeof ap.harvestSeason !== 'object') {
    ap.harvestSeason = {
      loginClaimed: false,
      onlineMinutes: 0,
      patrolPoints: 0,
      minuteStamp: 0,
      blessingClaimed: false,
      supplyClaimed: false,
      blessing: null
    };
  }
  ap.harvestSeason.loginClaimed = Boolean(ap.harvestSeason.loginClaimed);
  ap.harvestSeason.onlineMinutes = Math.max(0, Math.floor(Number(ap.harvestSeason.onlineMinutes || 0)));
  ap.harvestSeason.patrolPoints = Math.max(0, Math.floor(Number(ap.harvestSeason.patrolPoints || 0)));
  ap.harvestSeason.minuteStamp = Math.max(0, Math.floor(Number(ap.harvestSeason.minuteStamp || 0)));
  ap.harvestSeason.blessingClaimed = Boolean(ap.harvestSeason.blessingClaimed);
  ap.harvestSeason.supplyClaimed = Boolean(ap.harvestSeason.supplyClaimed);
  if (!ap.harvestSeason.blessing || typeof ap.harvestSeason.blessing !== 'object') {
    ap.harvestSeason.blessing = null;
  }
  return ap;
}

export function getActivityPointBalance(player, now = Date.now()) {
  const ap = normalizeActivityProgress(player, now);
  return Math.max(0, Math.floor(Number(ap.activityPoints || 0)));
}

export function addActivityPoints(player, amount, now = Date.now()) {
  const gain = Math.max(0, Math.floor(Number(amount || 0)));
  const ap = normalizeActivityProgress(player, now);
  if (gain <= 0) return { ok: true, amount: 0, balance: Number(ap.activityPoints || 0) };
  ap.activityPoints = Math.max(0, Math.floor(Number(ap.activityPoints || 0))) + gain;
  ap.activityPointsEarned = Math.max(0, Math.floor(Number(ap.activityPointsEarned || 0))) + gain;
  return { ok: true, amount: gain, balance: ap.activityPoints };
}

export function spendActivityPoints(player, amount, now = Date.now()) {
  const cost = Math.max(0, Math.floor(Number(amount || 0)));
  const ap = normalizeActivityProgress(player, now);
  const balance = Math.max(0, Math.floor(Number(ap.activityPoints || 0)));
  if (cost <= 0) return { ok: true, amount: 0, balance };
  if (balance < cost) return { ok: false, error: '活动积分不足。', balance };
  ap.activityPoints = balance - cost;
  ap.activityPointsSpent = Math.max(0, Math.floor(Number(ap.activityPointsSpent || 0))) + cost;
  return { ok: true, amount: cost, balance: ap.activityPoints };
}

export async function claimHarvestLoginRewardByMail(player, {
  sendMail,
  realmId = 1,
  now = Date.now()
} = {}) {
  const ap = normalizeActivityProgress(player, now);
  if (ap.harvestSeason?.loginClaimed) {
    return { ok: false, error: '今日丰收签到已领取。' };
  }
  if (typeof sendMail !== 'function') {
    return { ok: false, error: '邮件系统不可用。' };
  }
  const signConfig = getHarvestSeasonSignConfig();
  const reward = {
    gold: Math.max(0, Math.floor(Number(signConfig.gold || 0))),
    items: Array.isArray(signConfig.items)
      ? signConfig.items
          .map((entry) => ({
            id: String(entry?.id || '').trim(),
            qty: Math.max(1, Math.floor(Number(entry?.qty || 1)))
          }))
          .filter((entry) => entry.id)
      : []
  };
  const pointReward = Math.max(0, Math.floor(Number(signConfig.points || 0)));
  try {
    await sendMail(
      player.userId,
      player.name,
      '系统',
      null,
      signConfig.title || '丰收签到奖励',
      `今日签到完成。\n奖励：${describeRewardBundle(reward)}${pointReward > 0 ? `\n另赠送活动积分 ${pointReward}。` : ''}`,
      reward.items,
      reward.gold,
      realmId
    );
    ap.harvestSeason.loginClaimed = true;
    if (pointReward > 0) addActivityPoints(player, pointReward, now);
    return { ok: true, reward, points: pointReward };
  } catch (err) {
    return { ok: false, error: err?.message || '邮件发送失败。' };
  }
}

export function claimHarvestBlessing(player, { now = Date.now() } = {}) {
  const ap = normalizeActivityProgress(player, now);
  if (ap.harvestSeason?.blessingClaimed) {
    return { ok: false, error: '今日已领取丰收赐福。' };
  }
  const blessDefs = [
    { id: 'exp', name: '经验丰收', expMult: 1.2, goldMult: 1, patrolBonus: 0, points: 8 },
    { id: 'gold', name: '金币丰收', expMult: 1, goldMult: 1.2, patrolBonus: 0, points: 8 },
    { id: 'double', name: '双收赐福', expMult: 1.1, goldMult: 1.1, patrolBonus: 0, points: 10 },
    { id: 'patrol', name: '巡礼加持', expMult: 1, goldMult: 1, patrolBonus: 1, points: 12 }
  ];
  const t = getChinaDate(now);
  const seed = `${player?.userId || 0}:${player?.id || player?.name || ''}:${t.dateKey}`;
  const blessing = blessDefs[dailyIndex(seed) % blessDefs.length];
  ap.harvestSeason.blessingClaimed = true;
  ap.harvestSeason.blessing = { ...blessing };
  if (blessing.points > 0) addActivityPoints(player, blessing.points, now);
  return { ok: true, blessing: { ...blessing } };
}

export async function claimHarvestSupplyByMail(player, {
  sendMail,
  realmId = 1,
  now = Date.now()
} = {}) {
  const ap = normalizeActivityProgress(player, now);
  if (ap.harvestSeason?.supplyClaimed) {
    return { ok: false, error: '今日收菜补给已领取。' };
  }
  if (Number(ap.harvestSeason?.onlineMinutes || 0) < 60) {
    return { ok: false, error: '挂机满60分钟后才能领取收菜补给。' };
  }
  if (typeof sendMail !== 'function') {
    return { ok: false, error: '邮件系统不可用。' };
  }
  const reward = {
    gold: 150000,
    items: [
      { id: 'training_fruit', qty: 3 },
      { id: 'pet_training_fruit', qty: 3 }
    ]
  };
  const pointReward = 10;
  try {
    await sendMail(
      player.userId,
      player.name,
      '系统',
      null,
      '收菜补给奖励',
      `挂机已达 ${Math.max(0, Math.floor(Number(ap.harvestSeason?.onlineMinutes || 0)))} 分钟。\n奖励：${describeRewardBundle(reward)}\n另赠送活动积分 ${pointReward}。`,
      reward.items,
      reward.gold,
      realmId
    );
    ap.harvestSeason.supplyClaimed = true;
    addActivityPoints(player, pointReward, now);
    return { ok: true, reward, points: pointReward };
  } catch (err) {
    return { ok: false, error: err?.message || '邮件发送失败。' };
  }
}

export function recordHarvestOnlineMinute(player, now = Date.now()) {
  if (!player) return false;
  const autoEnabled = Boolean(player?.flags?.autoFullEnabled || player?.flags?.autoSkillId || player?.flags?.offlineManagedAuto);
  if (!autoEnabled) return false;
  const ap = normalizeActivityProgress(player, now);
  const minuteStamp = Math.floor(Number(now || Date.now()) / 60000);
  if (Number(ap.harvestSeason?.minuteStamp || 0) === minuteStamp) return false;
  ap.harvestSeason.minuteStamp = minuteStamp;
  ap.harvestSeason.onlineMinutes = Math.max(0, Math.floor(Number(ap.harvestSeason.onlineMinutes || 0))) + 1;
  return true;
}

export function getActivityStatePayload(player, now = Date.now()) {
  const active = listActiveActivities(now);
  const ap = normalizeActivityProgress(player, now);
  const doubleDungeonTarget = getDoubleDungeonTarget(now);
  const bountyTarget = getWorldBossBountyTarget(now);
  return {
    active,
    meta: {
      double_dungeon: doubleDungeonTarget,
      world_boss_bounty: bountyTarget
    },
    currency: {
      activity_points: Number(ap.activityPoints || 0),
      activity_points_earned: Number(ap.activityPointsEarned || 0),
      activity_points_spent: Number(ap.activityPointsSpent || 0)
    },
    progress: {
      demon_slayer_order: ap.demonSlayer || { points: 0, bossKills: 0, lastHitBonus: 0 },
      cultivation_rush_week: ap.cultivationRush || { kills: 0 },
      guild_boss_assault: ap.guildAssault || { contribution: 0 },
      cross_hunter: ap.crossHunter || { points: 0, kills: 0 },
      treasure_pet_festival: ap.treasurePetFestival || { treasureUpgrades: 0, treasureAdvances: 0, petBookUses: 0, petSyntheses: 0, score: 0 },
      double_dungeon: ap.doubleDungeon || { zoneId: doubleDungeonTarget.zoneId, kills: 0, score: 0 },
      pet_carnival_day: ap.petCarnival || { petBookUses: 0, petSyntheses: 0, score: 0 },
      treasure_sprint_day: ap.treasureSprint || { treasureUpgrades: 0, treasureAdvances: 0, score: 0 },
      world_boss_bounty: ap.worldBossBounty || { mobId: bountyTarget.mobId, points: 0, kills: 0, lastHitBonus: 0 },
      lucky_drop_day: ap.luckyDropDay || { points: 0, bossKills: 0, lastHitBonus: 0 },
      harvest_season: ap.harvestSeason || { loginClaimed: false, onlineMinutes: 0, patrolPoints: 0, blessingClaimed: false, supplyClaimed: false, blessing: null },
      refine_carnival: {
        attempts: Number(ap.refineCarnival?.attempts || 0),
        milestones: ap.refineCarnival?.milestones || {}
      }
    }
  };
}

export function getMobRewardActivityBonus(member, mobTemplate, now = Date.now(), { zoneId = '' } = {}) {
  let expMult = 1;
  let goldMult = 1;
  const notes = [];
  if (isActivityActive('newbie_catchup', now)) {
    const lv = Math.max(1, Number(member?.level || 1));
    const cultivationLevel = Math.floor(Number(member?.flags?.cultivationLevel ?? -1));
    const neverCultivated = cultivationLevel < 0;
    if (neverCultivated && lv < 100) {
      expMult *= 5;
      notes.push('新人追赶');
    } else if (neverCultivated && lv >= 100 && lv <= 200) {
      expMult *= 2.5;
      notes.push('新人追赶');
    }
  }
  const isCultivationBoss = Boolean(mobTemplate?.id && String(mobTemplate.id).startsWith('cultivation_boss_'));
  if (isCultivationBoss && isActivityActive('cultivation_rush_week', now)) {
    expMult *= 1.5;
    goldMult *= 1.2;
    notes.push('修真冲关周');
  }
  if (zoneId && isActivityActive('double_dungeon', now)) {
    const target = getDoubleDungeonTarget(now);
    if (String(zoneId) === String(target.zoneId)) {
      expMult *= Number(target.expMult || 2);
      goldMult *= Number(target.goldMult || 2);
      const ap = normalizeActivityProgress(member, now);
      if (!ap.doubleDungeon || ap.doubleDungeon.zoneId !== target.zoneId) {
        ap.doubleDungeon = { zoneId: target.zoneId, kills: 0, score: 0 };
      }
      ap.doubleDungeon.kills = Math.max(0, Number(ap.doubleDungeon.kills || 0)) + 1;
      ap.doubleDungeon.score = Math.max(0, Number(ap.doubleDungeon.score || 0)) + 1;
      addActivityPoints(member, 1, now);
      notes.push(`双倍秘境：${target.zoneName}`);
    }
  }
  if (isActivityActive('harvest_season', now) && isHarvestPatrolWindow(now)) {
    const ap = normalizeActivityProgress(member, now);
    ap.harvestSeason.patrolPoints = Math.max(0, Math.floor(Number(ap.harvestSeason?.patrolPoints || 0))) + 1;
    addActivityPoints(member, 1, now);
    const patrolBonus = Math.max(0, Math.floor(Number(ap.harvestSeason?.blessing?.patrolBonus || 0)));
    if (patrolBonus > 0) addActivityPoints(member, patrolBonus, now);
    notes.push('整点巡礼');
  }
  const blessing = normalizeActivityProgress(member, now)?.harvestSeason?.blessing;
  if (blessing) {
    expMult *= Math.max(1, Number(blessing.expMult || 1));
    goldMult *= Math.max(1, Number(blessing.goldMult || 1));
    if (blessing.name) notes.push(blessing.name);
  }
  return { expMult, goldMult, notes };
}
export function getRefineMaterialCountForActivity(baseCount, now = Date.now()) {
  const safeBase = Math.max(1, Number(baseCount || 1));
  if (!isActivityActive('refine_carnival', now)) {
    return { count: safeBase, discountPct: 0 };
  }
  const reduced = Math.max(1, Math.floor(safeBase * 0.8));
  return { count: reduced, discountPct: Math.round((1 - reduced / safeBase) * 100) };
}

export function recordRefineActivity(player, { success = false, newLevel = 0 } = {}, now = Date.now()) {
  if (!isActivityActive('refine_carnival', now)) return [];
  const ap = normalizeActivityProgress(player, now);
  const carnival = ap.refineCarnival || (ap.refineCarnival = { _weekKey: getChinaDate(now).weekKey, attempts: 0, milestones: {} });
  carnival.attempts = Math.max(0, Number(carnival.attempts || 0)) + 1;
  addActivityPoints(player, 1, now);
  const msgs = [];
  if (success && [10, 20, 30].includes(Number(newLevel || 0)) && !carnival.milestones?.[String(newLevel)]) {
    if (!carnival.milestones) carnival.milestones = {};
    carnival.milestones[String(newLevel)] = true;
    const goldReward = newLevel * 10000;
    player.gold = Math.max(0, Number(player.gold || 0)) + goldReward;
    msgs.push(`锻造狂欢迎里程碑：达到 +${newLevel}，获得 ${goldReward} 金币。`);
  }
  return msgs;
}

export function recordTreasurePetFestivalActivity(player, {
  treasureUpgrades = 0,
  treasureAdvances = 0,
  petBookUses = 0,
  petSyntheses = 0
} = {}, now = Date.now()) {
  const ap = normalizeActivityProgress(player, now);
  const msgs = [];

  const treasureDelta = Math.max(0, Number(treasureUpgrades || 0)) + Math.max(0, Number(treasureAdvances || 0));
  const petDelta = Math.max(0, Number(petBookUses || 0)) * 2 + Math.max(0, Number(petSyntheses || 0)) * 8;

  if (isActivityActive('treasure_pet_festival', now)) {
    const fest = ap.treasurePetFestival || (ap.treasurePetFestival = {
      _weekKey: getChinaDate(now).weekKey,
      treasureUpgrades: 0,
      treasureAdvances: 0,
      petBookUses: 0,
      petSyntheses: 0,
      score: 0
    });
    fest.treasureUpgrades = Math.max(0, Number(fest.treasureUpgrades || 0)) + Math.max(0, Number(treasureUpgrades || 0));
    fest.treasureAdvances = Math.max(0, Number(fest.treasureAdvances || 0)) + Math.max(0, Number(treasureAdvances || 0));
    fest.petBookUses = Math.max(0, Number(fest.petBookUses || 0)) + Math.max(0, Number(petBookUses || 0));
    fest.petSyntheses = Math.max(0, Number(fest.petSyntheses || 0)) + Math.max(0, Number(petSyntheses || 0));
    const deltaScore = treasureDelta + petDelta;
    fest.score = Math.max(0, Number(fest.score || 0)) + deltaScore;
    if (deltaScore > 0) addActivityPoints(player, Math.max(1, Math.floor(deltaScore / 10)), now);
    if (deltaScore > 0) msgs.push(`宝藏奇缘：活跃度 +${deltaScore}（当前 ${fest.score}）`);
  }

  if (isActivityActive('pet_carnival_day', now) && (petBookUses > 0 || petSyntheses > 0)) {
    const pc = ap.petCarnival || (ap.petCarnival = { petBookUses: 0, petSyntheses: 0, score: 0 });
    pc.petBookUses = Math.max(0, Number(pc.petBookUses || 0)) + Math.max(0, Number(petBookUses || 0));
    pc.petSyntheses = Math.max(0, Number(pc.petSyntheses || 0)) + Math.max(0, Number(petSyntheses || 0));
    const deltaScore = Math.max(0, Number(petBookUses || 0)) * 3 + Math.max(0, Number(petSyntheses || 0)) * 12;
    pc.score = Math.max(0, Number(pc.score || 0)) + deltaScore;
    if (deltaScore > 0) addActivityPoints(player, Math.max(1, Math.floor(deltaScore / 10)), now);
    msgs.push(`宠物狂欢日：积分 +${deltaScore}（当前 ${pc.score}）`);
  }

  if (isActivityActive('treasure_sprint_day', now) && (treasureUpgrades > 0 || treasureAdvances > 0)) {
    const ts = ap.treasureSprint || (ap.treasureSprint = { treasureUpgrades: 0, treasureAdvances: 0, score: 0 });
    ts.treasureUpgrades = Math.max(0, Number(ts.treasureUpgrades || 0)) + Math.max(0, Number(treasureUpgrades || 0));
    ts.treasureAdvances = Math.max(0, Number(ts.treasureAdvances || 0)) + Math.max(0, Number(treasureAdvances || 0));
    const deltaScore = Math.max(0, Number(treasureUpgrades || 0)) * 2 + Math.max(0, Number(treasureAdvances || 0)) * 4;
    ts.score = Math.max(0, Number(ts.score || 0)) + deltaScore;
    if (deltaScore > 0) addActivityPoints(player, Math.max(1, Math.floor(deltaScore / 10)), now);
    msgs.push(`法宝冲刺日：积分 +${deltaScore}（当前 ${ts.score}）`);
  }

  return msgs;
}
function isBossForPoints(template) {
  if (!template) return false;
  if (template.id === 'vip_personal_boss' || template.id === 'svip_personal_boss') return false;
  const isCultivationBoss = Boolean(template.id && String(template.id).startsWith('cultivation_boss_'));
  return Boolean(template.worldBoss || template.specialBoss || isCultivationBoss || template.sabakBoss);
}

export function recordBossKillActivities({
  template,
  damageEntries = [],
  lastHitName = null,
  playerResolver = null,
  now = Date.now()
} = {}) {
  if (!template || typeof playerResolver !== 'function') return [];
  const messages = [];
  const isCultivationBoss = Boolean(template.id && String(template.id).startsWith('cultivation_boss_'));
  const isCrossBoss = template.id === 'cross_world_boss';
  const isEligibleBoss = isBossForPoints(template);
  if (!isEligibleBoss) return messages;

  const pointBonus = isActivityActive('lucky_drop_day', now) ? 1.5 : 1;

  if (isActivityActive('demon_slayer_order', now)) {
    damageEntries.forEach(([name], idx) => {
      const p = playerResolver(name);
      if (!p) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      const gain = Math.floor((idx === 0 ? 10 : 3) * pointBonus);
      ap.demonSlayer.points = Math.max(0, Number(ap.demonSlayer?.points || 0)) + gain;
      ap.demonSlayer.bossKills = Math.max(0, Number(ap.demonSlayer?.bossKills || 0)) + 1;
      addActivityPoints(p, idx === 0 ? 2 : 1, now);
      if (idx === 0) {
        messages.push({ player: p, text: `限时屠魔令：伤害第一，积分 +${gain}` });
      }
    });
    if (lastHitName) {
      const p = playerResolver(lastHitName);
      if (p) {
        normalizeActivityProgress(p, now);
        const ap = p.flags.activityProgress;
        const gain = Math.floor(5 * pointBonus);
        ap.demonSlayer.points = Math.max(0, Number(ap.demonSlayer?.points || 0)) + gain;
        ap.demonSlayer.lastHitBonus = Math.max(0, Number(ap.demonSlayer?.lastHitBonus || 0)) + gain;
        addActivityPoints(p, 1, now);
        messages.push({ player: p, text: `限时屠魔令：尾刀奖励，积分 +${gain}` });
      }
    }
  }

  if (isCultivationBoss && isActivityActive('cultivation_rush_week', now)) {
    damageEntries.forEach(([name]) => {
      const p = playerResolver(name);
      if (!p) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      ap.cultivationRush.kills = Math.max(0, Number(ap.cultivationRush?.kills || 0)) + 1;
      addActivityPoints(p, 1, now);
    });
  }

  if (isActivityActive('guild_boss_assault', now)) {
    damageEntries.forEach(([name], idx) => {
      const p = playerResolver(name);
      if (!p || !p.guild) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      const gain = idx === 0 ? 15 : 5;
      ap.guildAssault.contribution = Math.max(0, Number(ap.guildAssault?.contribution || 0)) + gain;
      addActivityPoints(p, idx === 0 ? 2 : 1, now);
    });
  }

  if (isActivityActive('lucky_drop_day', now)) {
    damageEntries.forEach(([name], idx) => {
      const p = playerResolver(name);
      if (!p) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      const gain = idx === 0 ? 6 : 2;
      ap.luckyDropDay.points = Math.max(0, Number(ap.luckyDropDay?.points || 0)) + gain;
      ap.luckyDropDay.bossKills = Math.max(0, Number(ap.luckyDropDay?.bossKills || 0)) + 1;
      addActivityPoints(p, 1, now);
      if (idx === 0) messages.push({ player: p, text: `幸运掉落日：BOSS伤害第一，幸运积分 +${gain}` });
    });
    if (lastHitName) {
      const p = playerResolver(lastHitName);
      if (p) {
        normalizeActivityProgress(p, now);
        const ap = p.flags.activityProgress;
        const gain = 3;
        ap.luckyDropDay.points = Math.max(0, Number(ap.luckyDropDay?.points || 0)) + gain;
        ap.luckyDropDay.lastHitBonus = Math.max(0, Number(ap.luckyDropDay?.lastHitBonus || 0)) + gain;
        addActivityPoints(p, 1, now);
        messages.push({ player: p, text: `幸运掉落日：尾刀奖励，幸运积分 +${gain}` });
      }
    }
  }

  if (isActivityActive('world_boss_bounty', now)) {
    const bounty = getWorldBossBountyTarget(now);
    if (String(template?.id || '') === String(bounty.mobId)) {
      damageEntries.forEach(([name], idx) => {
        const p = playerResolver(name);
        if (!p) return;
        normalizeActivityProgress(p, now);
        const ap = p.flags.activityProgress;
        if (!ap.worldBossBounty || ap.worldBossBounty.mobId !== bounty.mobId) {
          ap.worldBossBounty = { mobId: bounty.mobId, points: 0, kills: 0, lastHitBonus: 0 };
        }
        const gain = idx === 0 ? 18 : 6;
        ap.worldBossBounty.points = Math.max(0, Number(ap.worldBossBounty?.points || 0)) + gain;
        ap.worldBossBounty.kills = Math.max(0, Number(ap.worldBossBounty?.kills || 0)) + 1;
        addActivityPoints(p, idx === 0 ? 2 : 1, now);
        if (idx === 0) messages.push({ player: p, text: `世界BOSS悬赏：伤害第一，悬赏积分 +${gain}` });
      });
      if (lastHitName) {
        const p = playerResolver(lastHitName);
        if (p) {
          normalizeActivityProgress(p, now);
          const ap = p.flags.activityProgress;
          if (!ap.worldBossBounty || ap.worldBossBounty.mobId !== bounty.mobId) {
            ap.worldBossBounty = { mobId: bounty.mobId, points: 0, kills: 0, lastHitBonus: 0 };
          }
          const gain = 5;
          ap.worldBossBounty.points = Math.max(0, Number(ap.worldBossBounty?.points || 0)) + gain;
          ap.worldBossBounty.lastHitBonus = Math.max(0, Number(ap.worldBossBounty?.lastHitBonus || 0)) + gain;
          addActivityPoints(p, 1, now);
          messages.push({ player: p, text: `世界BOSS悬赏：尾刀奖励，悬赏积分 +${gain}` });
        }
      }
    }
  }

  if (isCrossBoss && isActivityActive('cross_hunter', now)) {
    damageEntries.slice(0, 10).forEach(([name], idx) => {
      const p = playerResolver(name);
      if (!p) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      const gain = idx === 0 ? 20 : 8;
      ap.demonSlayer.points = Math.max(0, Number(ap.demonSlayer?.points || 0)) + gain;
      ap.crossHunter.points = Math.max(0, Number(ap.crossHunter?.points || 0)) + gain;
      ap.crossHunter.kills = Math.max(0, Number(ap.crossHunter?.kills || 0)) + 1;
      addActivityPoints(p, idx === 0 ? 3 : 1, now);
      if (idx === 0) messages.push({ player: p, text: `跨服猎王：跨服BOSS伤害第一，猎王积分 +${gain}` });
    });
  }

  return messages;
}
export function getActivityChatLines(player, now = Date.now()) {
  const active = listActiveActivities(now);
  const ap = normalizeActivityProgress(player, now);
  const doubleDungeon = getDoubleDungeonTarget(now);
  const bounty = getWorldBossBountyTarget(now);
  const lines = [];
  if (!active.length) {
    lines.push('当前没有进行中的限时活动。');
  } else {
    lines.push(`当前活动：${active.map((a) => a.name).join('、')}`);
  }
  lines.push(`双倍秘境：${doubleDungeon.zoneName}（击杀 ${Number(ap.doubleDungeon?.kills || 0)}）`);
  lines.push(`世界BOSS悬赏：${bounty.mobName}（积分 ${Number(ap.worldBossBounty?.points || 0)} / 击杀 ${Number(ap.worldBossBounty?.kills || 0)}）`);
  lines.push(`宠物狂欢日：积分 ${Number(ap.petCarnival?.score || 0)}（打书 ${Number(ap.petCarnival?.petBookUses || 0)} / 合宠 ${Number(ap.petCarnival?.petSyntheses || 0)}）`);
  lines.push(`法宝冲刺日：积分 ${Number(ap.treasureSprint?.score || 0)}（升级 ${Number(ap.treasureSprint?.treasureUpgrades || 0)} / 升段 ${Number(ap.treasureSprint?.treasureAdvances || 0)}）`);
  lines.push(`屠魔令积分：${Number(ap.demonSlayer?.points || 0)}（BOSS击杀 ${Number(ap.demonSlayer?.bossKills || 0)}）`);
  lines.push(`修真冲关周：修真BOSS击杀 ${Number(ap.cultivationRush?.kills || 0)}`);
  lines.push(`行会攻坚赛个人贡献：${Number(ap.guildAssault?.contribution || 0)}`);
  lines.push(`跨服猎王：积分 ${Number(ap.crossHunter?.points || 0)}（击杀 ${Number(ap.crossHunter?.kills || 0)}）`);
  lines.push(`宝藏奇缘：活跃 ${Number(ap.treasurePetFestival?.score || 0)}（法宝升级 ${Number(ap.treasurePetFestival?.treasureUpgrades || 0)} / 升段 ${Number(ap.treasurePetFestival?.treasureAdvances || 0)} / 打书 ${Number(ap.treasurePetFestival?.petBookUses || 0)} / 合宠 ${Number(ap.treasurePetFestival?.petSyntheses || 0)}）`);
  lines.push(`幸运掉落日：积分 ${Number(ap.luckyDropDay?.points || 0)}（BOSS击杀 ${Number(ap.luckyDropDay?.bossKills || 0)}）`);
  lines.push(`锻造狂欢：${Number(ap.refineCarnival?.attempts || 0)} 次（+10 ${ap.refineCarnival?.milestones?.['10'] ? '已达成' : '未达成'} / +20 ${ap.refineCarnival?.milestones?.['20'] ? '已达成' : '未达成'} / +30 ${ap.refineCarnival?.milestones?.['30'] ? '已达成' : '未达成'}）`);
  lines.push(`丰收季：签到${ap.harvestSeason?.loginClaimed ? '已领' : '未领'} / 挂机 ${Number(ap.harvestSeason?.onlineMinutes || 0)} 分钟 / 巡礼 ${Number(ap.harvestSeason?.patrolPoints || 0)} / 补给 ${ap.harvestSeason?.supplyClaimed ? '已领' : '未领'} / 赐福 ${ap.harvestSeason?.blessing?.name || (ap.harvestSeason?.blessingClaimed ? '已领' : '未领')}`);
  return lines;
}
function ensureClaimStore(player, now = Date.now()) {
  const t = getChinaDate(now);
  const ap = normalizeActivityProgress(player, now);
  if (!ap.claims || typeof ap.claims !== 'object') ap.claims = {};
  if (!ap.claims.daily || ap.claims.daily._dateKey !== t.dateKey) {
    ap.claims.daily = { _dateKey: t.dateKey, keys: {} };
  }
  if (!ap.claims.weekly || ap.claims.weekly._weekKey !== t.weekKey) {
    ap.claims.weekly = { _weekKey: t.weekKey, keys: {} };
  }
  return ap.claims;
}

function getProgressSnapshot(player, now = Date.now()) {
  const ap = normalizeActivityProgress(player, now);
  return {
    demonPoints: Number(ap.demonSlayer?.points || 0),
    cultivationKills: Number(ap.cultivationRush?.kills || 0),
    guildContribution: Number(ap.guildAssault?.contribution || 0),
    refineAttempts: Number(ap.refineCarnival?.attempts || 0),
    crossHunterPoints: Number(ap.crossHunter?.points || 0),
    treasurePetScore: Number(ap.treasurePetFestival?.score || 0),
    luckyDropPoints: Number(ap.luckyDropDay?.points || 0),
    doubleDungeonScore: Number(ap.doubleDungeon?.score || 0),
    worldBossBountyPoints: Number(ap.worldBossBounty?.points || 0),
    petCarnivalScore: Number(ap.petCarnival?.score || 0),
    treasureSprintScore: Number(ap.treasureSprint?.score || 0),
    harvestOnlineMinutes: Number(ap.harvestSeason?.onlineMinutes || 0),
    harvestPatrolPoints: Number(ap.harvestSeason?.patrolPoints || 0)
  };
}
function rewardDefsForClaims() {
  const harvestRewardDefs = (getHarvestSeasonRewardConfig().items || []).map((item, index) => ({
    key: String(item?.id || `harvest_cfg_${index + 1}`),
    period: 'daily',
    title: String(item?.title || '丰收挂机奖励'),
    threshold: Math.max(1, Math.floor(Number(item?.threshold || 1))),
    metric: 'harvestOnlineMinutes',
    gold: Math.max(0, Math.floor(Number(item?.gold || 0))),
    items: item?.itemId ? [{ id: String(item.itemId), qty: Math.max(1, Math.floor(Number(item.itemQty || 1))) }] : [],
    body: `挂机时长达到 ${Math.max(1, Math.floor(Number(item?.threshold || 1)))} 分钟。`
  }));
  return [
    { key: 'double_dungeon_30', period: 'daily', title: '双倍秘境奖励', threshold: 30, metric: 'doubleDungeonScore', gold: 80000, body: '达成双倍秘境击杀 30。' },
    { key: 'double_dungeon_100', period: 'daily', title: '双倍秘境奖励', threshold: 100, metric: 'doubleDungeonScore', gold: 220000, body: '达成双倍秘境击杀 100。' },
    { key: 'bounty_20', period: 'daily', title: '世界BOSS悬赏奖励', threshold: 20, metric: 'worldBossBountyPoints', gold: 120000, body: '达成世界BOSS悬赏积分 20。' },
    { key: 'bounty_60', period: 'daily', title: '世界BOSS悬赏奖励', threshold: 60, metric: 'worldBossBountyPoints', gold: 320000, body: '达成世界BOSS悬赏积分 60。' },
    { key: 'pet_carnival_20', period: 'daily', title: '宠物狂欢日奖励', threshold: 20, metric: 'petCarnivalScore', gold: 100000, body: '达成宠物狂欢日积分 20。' },
    { key: 'pet_carnival_60', period: 'daily', title: '宠物狂欢日奖励', threshold: 60, metric: 'petCarnivalScore', gold: 260000, body: '达成宠物狂欢日积分 60。' },
    { key: 'treasure_sprint_20', period: 'daily', title: '法宝冲刺日奖励', threshold: 20, metric: 'treasureSprintScore', gold: 100000, body: '达成法宝冲刺日积分 20。' },
    { key: 'treasure_sprint_60', period: 'daily', title: '法宝冲刺日奖励', threshold: 60, metric: 'treasureSprintScore', gold: 260000, body: '达成法宝冲刺日积分 60。' },
    { key: 'demon_20', period: 'daily', title: '屠魔令积分奖励', threshold: 20, metric: 'demonPoints', gold: 50000, body: '达成屠魔令积分 20。' },
    { key: 'demon_60', period: 'daily', title: '屠魔令积分奖励', threshold: 60, metric: 'demonPoints', gold: 150000, body: '达成屠魔令积分 60。' },
    { key: 'demon_120', period: 'daily', title: '屠魔令积分奖励', threshold: 120, metric: 'demonPoints', gold: 300000, body: '达成屠魔令积分 120。' },
    { key: 'cult_5', period: 'weekly', title: '修真冲关周奖励', threshold: 5, metric: 'cultivationKills', gold: 100000, body: '达成修真BOSS击杀 5。' },
    { key: 'cult_15', period: 'weekly', title: '修真冲关周奖励', threshold: 15, metric: 'cultivationKills', gold: 300000, body: '达成修真BOSS击杀 15。' },
    { key: 'guild_30', period: 'daily', title: '行会攻坚赛奖励', threshold: 30, metric: 'guildContribution', gold: 120000, body: '达成行会攻坚贡献 30。' },
    { key: 'guild_80', period: 'daily', title: '行会攻坚赛奖励', threshold: 80, metric: 'guildContribution', gold: 300000, body: '达成行会攻坚贡献 80。' },
    { key: 'lucky_20', period: 'daily', title: '幸运掉落日奖励', threshold: 20, metric: 'luckyDropPoints', gold: 80000, body: '达成幸运掉落日积分 20。' },
    { key: 'lucky_60', period: 'daily', title: '幸运掉落日奖励', threshold: 60, metric: 'luckyDropPoints', gold: 220000, body: '达成幸运掉落日积分 60。' },
    { key: 'refine_20', period: 'weekly', title: '锻造狂欢奖励', threshold: 20, metric: 'refineAttempts', gold: 100000, body: '达成锻造狂欢次数 20。' },
    { key: 'refine_60', period: 'weekly', title: '锻造狂欢奖励', threshold: 60, metric: 'refineAttempts', gold: 300000, body: '达成锻造狂欢次数 60。' },
    { key: 'cross_30', period: 'weekly', title: '跨服猎王奖励', threshold: 30, metric: 'crossHunterPoints', gold: 150000, body: '达成跨服猎王积分 30。' },
    { key: 'cross_90', period: 'weekly', title: '跨服猎王奖励', threshold: 90, metric: 'crossHunterPoints', gold: 420000, body: '达成跨服猎王积分 90。' },
    { key: 'tpf_20', period: 'weekly', title: '宝藏奇缘奖励', threshold: 20, metric: 'treasurePetScore', gold: 120000, body: '达成宝藏奇缘活跃 20。' },
    { key: 'tpf_80', period: 'weekly', title: '宝藏奇缘奖励', threshold: 80, metric: 'treasurePetScore', gold: 360000, body: '达成宝藏奇缘活跃 80。' },
    ...harvestRewardDefs
  ];
}
export async function claimActivityRewardsByMail(player, {
  sendMail,
  realmId = 1,
  now = Date.now()
} = {}) {
  if (typeof sendMail !== 'function') {
    return { ok: false, sent: 0, messages: ['邮件系统不可用。'] };
  }
  const claims = ensureClaimStore(player, now);
  const progress = getProgressSnapshot(player, now);
  const defs = rewardDefsForClaims();
  const messages = [];
  let sent = 0;
  for (const def of defs) {
    const bucket = def.period === 'weekly' ? claims.weekly : claims.daily;
    if (!bucket.keys) bucket.keys = {};
    if (bucket.keys[def.key]) continue;
    const value = Number(progress[def.metric] || 0);
    if (value < def.threshold) continue;
    const rewardItems = Array.isArray(def.items)
      ? def.items
          .map((entry) => ({
            id: String(entry?.id || '').trim(),
            qty: Math.max(1, Math.floor(Number(entry?.qty || 1)))
          }))
          .filter((entry) => entry.id)
      : [];
    const rewardDesc = describeRewardBundle({ gold: def.gold, items: rewardItems });
    await sendMail(
      player.userId,
      player.name,
      '系统',
      null,
      def.title,
      `${def.body}\n奖励：${rewardDesc}（邮件领取）`,
      rewardItems.length ? rewardItems : null,
      def.gold,
      realmId
    );
    bucket.keys[def.key] = true;
    sent += 1;
    messages.push(`${def.title} 已发放（条件 ${def.threshold}，当前 ${value}）。`);
  }
  if (!sent) {
    messages.push('暂无可领取的活动奖励。');
  }
  return { ok: true, sent, messages };
}

function rankRows(rows, extractor, limit = 10) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const score = extractor(row);
      return { row, score: Number(score || 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.row?.level || 0) - (a.row?.level || 0);
    })
    .slice(0, Math.max(1, limit));
}

export function getActivityLeaderboards(allCharacters, now = Date.now(), limit = 10) {
  const t = getChinaDate(now);
  return getActivityLeaderboardsByPeriod(allCharacters, {
    dailyKey: t.dateKey,
    weekKey: t.weekKey,
    limit
  });
}

export function getActivityLeaderboardsByPeriod(allCharacters, { dailyKey = null, weekKey = null, limit = 10 } = {}) {
  const rows = Array.isArray(allCharacters) ? allCharacters : [];
  const getAp = (row) => row?.flags?.activityProgress || {};
  const dailyOk = (row) => !dailyKey || getAp(row)?._dailyKey === dailyKey;
  const weeklyRefineOk = (row) => !weekKey || getAp(row)?.refineCarnival?._weekKey === weekKey;
  const weeklyCultivationOk = (row) => !weekKey || getAp(row)?.cultivationRush?._weekKey === weekKey;
  const weeklyCrossOk = (row) => !weekKey || getAp(row)?.crossHunter?._weekKey === weekKey;
  const weeklyTreasurePetOk = (row) => !weekKey || getAp(row)?.treasurePetFestival?._weekKey === weekKey;
  return {
    double_dungeon: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.doubleDungeon?.score || 0) : 0, limit),
    world_boss_bounty: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.worldBossBounty?.points || 0) : 0, limit),
    pet_carnival_day: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.petCarnival?.score || 0) : 0, limit),
    treasure_sprint_day: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.treasureSprint?.score || 0) : 0, limit),
    demon_slayer_order: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.demonSlayer?.points || 0) : 0, limit),
    cultivation_rush_week: rankRows(rows, (row) => weeklyCultivationOk(row) ? (getAp(row)?.cultivationRush?.kills || 0) : 0, limit),
    guild_boss_assault: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.guildAssault?.contribution || 0) : 0, limit),
    lucky_drop_day: rankRows(rows, (row) => dailyOk(row) ? (getAp(row)?.luckyDropDay?.points || 0) : 0, limit),
    refine_carnival: rankRows(rows, (row) => weeklyRefineOk(row) ? (getAp(row)?.refineCarnival?.attempts || 0) : 0, limit),
    cross_hunter: rankRows(rows, (row) => weeklyCrossOk(row) ? (getAp(row)?.crossHunter?.points || 0) : 0, limit),
    treasure_pet_festival: rankRows(rows, (row) => weeklyTreasurePetOk(row) ? (getAp(row)?.treasurePetFestival?.score || 0) : 0, limit)
  };
}
export function formatActivityLeaderboardLines(boards, type = 'all') {
  const sections = [];
  const pushBoard = (label, key, unit) => {
    const list = boards?.[key] || [];
    sections.push(`【${label}】`);
    if (!list.length) {
      sections.push('暂无数据');
      return;
    }
    list.forEach((entry, idx) => {
      const row = entry.row || {};
      sections.push(`${idx + 1}. ${row.name} Lv${row.level || 0} ${entry.score}${unit}`);
    });
  };
  if (type === 'all' || type === 'double') pushBoard('双倍秘境击杀榜', 'double_dungeon', '次');
  if (type === 'all' || type === 'bounty') pushBoard('世界BOSS悬赏榜', 'world_boss_bounty', '分');
  if (type === 'all' || type === 'pet_carnival') pushBoard('宠物狂欢日积分榜', 'pet_carnival_day', '分');
  if (type === 'all' || type === 'treasure_sprint') pushBoard('法宝冲刺日积分榜', 'treasure_sprint_day', '分');
  if (type === 'all' || type === 'demon') pushBoard('屠魔令积分榜', 'demon_slayer_order', '分');
  if (type === 'all' || type === 'cultivation') pushBoard('修真冲关榜', 'cultivation_rush_week', '次');
  if (type === 'all' || type === 'guild') pushBoard('行会攻坚个人贡献榜', 'guild_boss_assault', '点');
  if (type === 'all' || type === 'lucky') pushBoard('幸运掉落日积分榜', 'lucky_drop_day', '分');
  if (type === 'all' || type === 'refine') pushBoard('锻造狂欢次数榜', 'refine_carnival', '次');
  if (type === 'all' || type === 'cross') pushBoard('跨服猎王榜', 'cross_hunter', '分');
  if (type === 'all' || type === 'treasure') pushBoard('宝藏奇缘活跃榜', 'treasure_pet_festival', '点');
  return sections;
}
function rankingRewardGold(rank, base) {
  if (rank === 1) return base * 10;
  if (rank === 2) return base * 6;
  if (rank === 3) return base * 4;
  if (rank <= 5) return base * 2;
  return base;
}

export function buildActivitySettlementRewards(boards, { dailyKey = null, weekKey = null } = {}) {
  const rewards = [];
  const pushRewards = (boardKey, label, period, periodKey, baseGold) => {
    const rows = Array.isArray(boards?.[boardKey]) ? boards[boardKey] : [];
    rows.slice(0, 10).forEach((entry, index) => {
      const rank = index + 1;
      const row = entry?.row || {};
      if (!row.userId || !row.name) return;
      const gold = rankingRewardGold(rank, baseGold);
      rewards.push({
        boardKey,
        period,
        periodKey,
        rank,
        score: Number(entry.score || 0),
        userId: row.userId,
        charName: row.name,
        realmId: row.realmId || 1,
        title: `${label}排行奖励`,
        body: `${label}${period === 'daily' ? '（日榜）' : '（周榜）'}第 ${rank} 名，成绩 ${entry.score}，奖励 ${gold} 金币。`,
        gold
      });
    });
  };
  if (dailyKey) {
    pushRewards('double_dungeon', '双倍秘境击杀榜', 'daily', dailyKey, 40000);
    pushRewards('world_boss_bounty', '世界BOSS悬赏榜', 'daily', dailyKey, 70000);
    pushRewards('pet_carnival_day', '宠物狂欢日积分榜', 'daily', dailyKey, 60000);
    pushRewards('treasure_sprint_day', '法宝冲刺日积分榜', 'daily', dailyKey, 60000);
    pushRewards('demon_slayer_order', '屠魔令积分榜', 'daily', dailyKey, 50000);
    pushRewards('guild_boss_assault', '行会攻坚个人贡献榜', 'daily', dailyKey, 60000);
    pushRewards('lucky_drop_day', '幸运掉落日积分榜', 'daily', dailyKey, 45000);
  }
  if (weekKey) {
    pushRewards('cultivation_rush_week', '修真冲关榜', 'weekly', weekKey, 100000);
    pushRewards('refine_carnival', '锻造狂欢次数榜', 'weekly', weekKey, 80000);
    pushRewards('cross_hunter', '跨服猎王榜', 'weekly', weekKey, 90000);
    pushRewards('treasure_pet_festival', '宝藏奇缘活跃榜', 'weekly', weekKey, 85000);
  }
  return rewards;
}



