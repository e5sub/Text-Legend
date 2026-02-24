const CN_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

const ACTIVITY_DEFS = [
  { id: 'demon_slayer_order', name: '限时屠魔令', type: 'daily', desc: '击杀各类BOSS获得积分（个人）' },
  { id: 'cultivation_rush_week', name: '修真冲关周', type: 'weekly', desc: '修真BOSS奖励加成与击杀任务' },
  { id: 'refine_carnival', name: '锻造狂欢', type: 'weekly', desc: '锻造材料减免与里程碑统计' },
  { id: 'guild_boss_assault', name: '行会攻坚赛', type: 'weekly', desc: '击杀BOSS累计行会战功（个人贡献）' },
  { id: 'cross_hunter', name: '跨服猎王', type: 'weekly', desc: '跨服玩法时段加成活动' },
  { id: 'treasure_pet_festival', name: '宝藏奇缘', type: 'weekly', desc: '法宝/宠物养成节日（预留）' },
  { id: 'newbie_catchup', name: '新手追赶计划', type: 'always', desc: '低等级角色额外经验/金币加成' },
  { id: 'lucky_drop_day', name: '幸运掉落日', type: 'weekly', desc: '指定时段BOSS活动积分额外加成' }
];

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
    case 'newbie_catchup':
      return true;
    case 'lucky_drop_day':
      return t.weekday === 3 && inWindow(t.minuteOfDay, 19 * 60, 24 * 60); // Wed evening
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
    ap.refineCarnival = ap.refineCarnival && ap.refineCarnival._weekKey === t.weekKey
      ? ap.refineCarnival
      : { _weekKey: t.weekKey, attempts: 0, milestones: {} };
  }
  if (!ap.cultivationRush || ap.cultivationRush._weekKey !== t.weekKey) {
    ap.cultivationRush = { _weekKey: t.weekKey, kills: 0 };
  }
  if (!ap.refineCarnival || ap.refineCarnival._weekKey !== t.weekKey) {
    ap.refineCarnival = { _weekKey: t.weekKey, attempts: 0, milestones: {} };
  }
  return ap;
}

export function getActivityStatePayload(player, now = Date.now()) {
  const active = listActiveActivities(now);
  const ap = normalizeActivityProgress(player, now);
  return {
    active,
    progress: {
      demon_slayer_order: ap.demonSlayer || { points: 0, bossKills: 0, lastHitBonus: 0 },
      cultivation_rush_week: ap.cultivationRush || { kills: 0 },
      guild_boss_assault: ap.guildAssault || { contribution: 0 },
      refine_carnival: {
        attempts: Number(ap.refineCarnival?.attempts || 0),
        milestones: ap.refineCarnival?.milestones || {}
      }
    }
  };
}

export function getMobRewardActivityBonus(member, mobTemplate, now = Date.now()) {
  let expMult = 1;
  let goldMult = 1;
  const notes = [];
  if (isActivityActive('newbie_catchup', now)) {
    const lv = Math.max(1, Number(member?.level || 1));
    if (lv < 100) {
      expMult *= 1.6;
      goldMult *= 1.3;
      notes.push('新手追赶');
    } else if (lv < 200) {
      expMult *= 1.3;
      goldMult *= 1.15;
      notes.push('新手追赶');
    }
  }
  const isCultivationBoss = Boolean(mobTemplate?.id && String(mobTemplate.id).startsWith('cultivation_boss_'));
  if (isCultivationBoss && isActivityActive('cultivation_rush_week', now)) {
    expMult *= 1.5;
    goldMult *= 1.2;
    notes.push('修真冲关周');
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
  const msgs = [];
  if (success && [10, 20, 30].includes(Number(newLevel || 0)) && !carnival.milestones?.[String(newLevel)]) {
    if (!carnival.milestones) carnival.milestones = {};
    carnival.milestones[String(newLevel)] = true;
    const goldReward = newLevel * 10000;
    player.gold = Math.max(0, Number(player.gold || 0)) + goldReward;
    msgs.push(`锻造狂欢里程碑：达成 +${newLevel}，获得 ${goldReward} 金币。`);
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
  const awarded = new Set();

  if (isActivityActive('demon_slayer_order', now)) {
    damageEntries.forEach(([name], idx) => {
      const p = playerResolver(name);
      if (!p) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      const gain = Math.floor((idx === 0 ? 10 : 3) * pointBonus);
      ap.demonSlayer.points = Math.max(0, Number(ap.demonSlayer?.points || 0)) + gain;
      ap.demonSlayer.bossKills = Math.max(0, Number(ap.demonSlayer?.bossKills || 0)) + 1;
      awarded.add(name);
      if (idx === 0) {
        messages.push({ player: p, text: `限时屠魔令：伤害第1，积分 +${gain}` });
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
    });
  }

  if (isCrossBoss && isActivityActive('cross_hunter', now)) {
    damageEntries.slice(0, 10).forEach(([name], idx) => {
      const p = playerResolver(name);
      if (!p) return;
      normalizeActivityProgress(p, now);
      const ap = p.flags.activityProgress;
      const gain = idx === 0 ? 20 : 8;
      ap.demonSlayer.points = Math.max(0, Number(ap.demonSlayer?.points || 0)) + gain;
    });
  }

  return messages;
}

export function getActivityChatLines(player, now = Date.now()) {
  const active = listActiveActivities(now);
  const ap = normalizeActivityProgress(player, now);
  const lines = [];
  if (!active.length) {
    lines.push('当前没有进行中的限时活动。');
  } else {
    lines.push(`当前活动：${active.map((a) => a.name).join('、')}`);
  }
  lines.push(`屠魔令积分：${Number(ap.demonSlayer?.points || 0)}（BOSS击杀 ${Number(ap.demonSlayer?.bossKills || 0)}）`);
  lines.push(`修真冲关周：修真BOSS击杀 ${Number(ap.cultivationRush?.kills || 0)}`);
  lines.push(`行会攻坚赛个人贡献：${Number(ap.guildAssault?.contribution || 0)}`);
  lines.push(`锻造狂欢次数：${Number(ap.refineCarnival?.attempts || 0)}（+10/${ap.refineCarnival?.milestones?.['10'] ? '已达成' : '未达成'}，+20/${ap.refineCarnival?.milestones?.['20'] ? '已达成' : '未达成'}，+30/${ap.refineCarnival?.milestones?.['30'] ? '已达成' : '未达成'}）`);
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
    refineAttempts: Number(ap.refineCarnival?.attempts || 0)
  };
}

function rewardDefsForClaims() {
  return [
    { key: 'demon_20', period: 'daily', title: '屠魔令积分奖励', threshold: 20, metric: 'demonPoints', gold: 50000, body: '达成屠魔令积分 20。' },
    { key: 'demon_60', period: 'daily', title: '屠魔令积分奖励', threshold: 60, metric: 'demonPoints', gold: 150000, body: '达成屠魔令积分 60。' },
    { key: 'demon_120', period: 'daily', title: '屠魔令积分奖励', threshold: 120, metric: 'demonPoints', gold: 300000, body: '达成屠魔令积分 120。' },
    { key: 'cult_5', period: 'weekly', title: '修真冲关周奖励', threshold: 5, metric: 'cultivationKills', gold: 100000, body: '达成修真BOSS击杀 5。' },
    { key: 'cult_15', period: 'weekly', title: '修真冲关周奖励', threshold: 15, metric: 'cultivationKills', gold: 300000, body: '达成修真BOSS击杀 15。' },
    { key: 'guild_30', period: 'daily', title: '行会攻坚赛奖励', threshold: 30, metric: 'guildContribution', gold: 120000, body: '达成行会攻坚贡献 30。' },
    { key: 'guild_80', period: 'daily', title: '行会攻坚赛奖励', threshold: 80, metric: 'guildContribution', gold: 300000, body: '达成行会攻坚贡献 80。' },
    { key: 'refine_20', period: 'weekly', title: '锻造狂欢奖励', threshold: 20, metric: 'refineAttempts', gold: 100000, body: '达成锻造狂欢次数 20。' },
    { key: 'refine_60', period: 'weekly', title: '锻造狂欢奖励', threshold: 60, metric: 'refineAttempts', gold: 300000, body: '达成锻造狂欢次数 60。' }
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
    await sendMail(
      player.userId,
      player.name,
      '系统',
      null,
      def.title,
      `${def.body}\n奖励：${def.gold} 金币（邮件领取）`,
      null,
      def.gold,
      realmId
    );
    bucket.keys[def.key] = true;
    sent += 1;
    messages.push(`${def.title} 已发放（条件 ${def.threshold}，当前 ${value}）`);
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
  return {
    demon_slayer_order: rankRows(rows, (row) => {
      if (!dailyOk(row)) return 0;
      return getAp(row)?.demonSlayer?.points || 0;
    }, limit),
    cultivation_rush_week: rankRows(rows, (row) => {
      if (!weeklyCultivationOk(row)) return 0;
      return getAp(row)?.cultivationRush?.kills || 0;
    }, limit),
    guild_boss_assault: rankRows(rows, (row) => {
      if (!dailyOk(row)) return 0;
      return getAp(row)?.guildAssault?.contribution || 0;
    }, limit),
    refine_carnival: rankRows(rows, (row) => {
      if (!weeklyRefineOk(row)) return 0;
      return getAp(row)?.refineCarnival?.attempts || 0;
    }, limit)
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
  if (type === 'all' || type === 'demon') pushBoard('屠魔令积分榜', 'demon_slayer_order', '分');
  if (type === 'all' || type === 'cultivation') pushBoard('修真冲关榜', 'cultivation_rush_week', '次');
  if (type === 'all' || type === 'guild') pushBoard('行会攻坚个人贡献榜', 'guild_boss_assault', '点');
  if (type === 'all' || type === 'refine') pushBoard('锻造狂欢次数榜', 'refine_carnival', '次');
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
        body: `${label}${period === 'daily' ? '（日榜）' : '（周榜）'}第${rank}名，成绩 ${entry.score}，奖励 ${gold} 金币。`,
        gold
      });
    });
  };
  if (dailyKey) {
    pushRewards('demon_slayer_order', '屠魔令积分榜', 'daily', dailyKey, 50000);
    pushRewards('guild_boss_assault', '行会攻坚个人贡献榜', 'daily', dailyKey, 60000);
  }
  if (weekKey) {
    pushRewards('cultivation_rush_week', '修真冲关榜', 'weekly', weekKey, 100000);
    pushRewards('refine_carnival', '锻造狂欢次数榜', 'weekly', weekKey, 80000);
  }
  return rewards;
}
