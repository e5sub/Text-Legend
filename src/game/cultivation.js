const BASE_LEVEL_COST = 200;

function legacyLevelExpMult(level) {
  const normalized = Math.max(0, Math.floor(Number(level) || 0));
  let mult = 1 + (normalized + 1) * 0.5;
  if (normalized >= 11) {
    mult *= 100;
  }
  return mult;
}

const BASE_RANK_NAMES = [
  '筑基',
  '灵虚',
  '和合',
  '元婴',
  '空冥',
  '履霜',
  '渡劫',
  '寂灭',
  '大乘',
  '上仙',
  '真仙',
  '天仙',
  '声闻',
  '缘觉',
  '菩萨',
  '佛'
];

const BASE_RANKS = BASE_RANK_NAMES.map((name, idx) => ({
  name,
  statBonus: (idx + 1) * 100,
  rewardExpPct: (idx + 1) * 10,
  maxHpPct: 0,
  rebirthStoneCost: idx >= 12 ? 1 : 0,
  levelCost: BASE_LEVEL_COST,
  levelExpMult: legacyLevelExpMult(idx)
}));

const EXTRA_RANKS = [
  {
    name: '罗汉',
    statBonus: 1700,
    rewardExpPct: 170,
    maxHpPct: 0,
    rebirthStoneCost: 2,
    levelCost: BASE_LEVEL_COST,
    levelExpMult: 1500
  },
  {
    name: '金身',
    statBonus: 1800,
    rewardExpPct: 190,
    maxHpPct: 0,
    rebirthStoneCost: 2,
    levelCost: BASE_LEVEL_COST,
    levelExpMult: 2000
  },
  {
    name: '尊者',
    statBonus: 1900,
    rewardExpPct: 205,
    maxHpPct: 0,
    rebirthStoneCost: 3,
    levelCost: BASE_LEVEL_COST,
    levelExpMult: 2500
  },
  {
    name: '圣王',
    statBonus: 2000,
    rewardExpPct: 220,
    maxHpPct: 0.1,
    rebirthStoneCost: 3,
    levelCost: BASE_LEVEL_COST,
    levelExpMult: 3000
  },
  {
    name: '道祖',
    statBonus: 2200,
    rewardExpPct: 245,
    maxHpPct: 0.15,
    rebirthStoneCost: 4,
    levelCost: BASE_LEVEL_COST,
    levelExpMult: 3500
  },
  {
    name: '混元',
    statBonus: 2500,
    rewardExpPct: 270,
    maxHpPct: 0.2,
    rebirthStoneCost: 5,
    levelCost: BASE_LEVEL_COST,
    levelExpMult: 4000
  }
];

export const CULTIVATION_RANKS = [...BASE_RANKS, ...EXTRA_RANKS];

export function getCultivationInfo(levelValue) {
  const level = Math.floor(Number(levelValue ?? -1));
  if (Number.isNaN(level) || level < 0) {
    return {
      name: '无',
      bonus: 0,
      rewardExpPct: 0,
      maxHpPct: 0,
      rebirthStoneCost: 0,
      levelCost: BASE_LEVEL_COST,
      levelExpMult: 1,
      idx: -1
    };
  }
  const idx = Math.min(CULTIVATION_RANKS.length - 1, level);
  const rank = CULTIVATION_RANKS[idx] || CULTIVATION_RANKS[0];
  return {
    ...rank,
    bonus: Math.max(0, Math.floor(Number(rank.statBonus || 0))),
    rewardExpPct: Math.max(0, Math.floor(Number(rank.rewardExpPct || 0))),
    maxHpPct: Math.max(0, Number(rank.maxHpPct || 0)),
    rebirthStoneCost: Math.max(0, Math.floor(Number(rank.rebirthStoneCost || 0))),
    levelCost: Math.max(1, Math.floor(Number(rank.levelCost || BASE_LEVEL_COST))),
    levelExpMult: Math.max(1, Number(rank.levelExpMult || 1)),
    idx
  };
}

export function getCultivationRewardMultiplier(levelValue) {
  const info = getCultivationInfo(levelValue);
  if (info.idx < 0) return 1;
  return 1 + (info.rewardExpPct / 100);
}

export function getCultivationLevelExpMultiplier(levelValue) {
  const info = getCultivationInfo(levelValue);
  return info.idx < 0 ? 1 : info.levelExpMult;
}

export function getCultivationBreakthroughCost(nextLevelValue) {
  const info = getCultivationInfo(nextLevelValue);
  return {
    levelCost: info.levelCost,
    rebirthStoneCost: info.rebirthStoneCost
  };
}

export function formatCultivationEffectSummary(levelValue) {
  const info = getCultivationInfo(levelValue);
  if (info.idx < 0) return '无';
  const parts = [`所有属性+${info.bonus}`];
  if (info.rewardExpPct > 0) parts.push(`打怪经验+${info.rewardExpPct}%`);
  if (info.maxHpPct > 0) parts.push(`生命上限+${Math.round(info.maxHpPct * 100)}%`);
  return parts.join('，');
}
