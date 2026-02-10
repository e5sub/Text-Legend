export const CLASSES = {
  warrior: {
    name: '战士',
    base: { str: 12, dex: 7, int: 3, con: 10, spirit: 4 },
    hpPerLevel: 18,
    mpPerLevel: 3
  },
  mage: {
    name: '法师',
    base: { str: 4, dex: 6, int: 14, con: 6, spirit: 10 },
    hpPerLevel: 8,
    mpPerLevel: 15
  },
  taoist: {
    name: '道士',
    base: { str: 7, dex: 8, int: 9, con: 8, spirit: 12 },
    hpPerLevel: 12,
    mpPerLevel: 10
  }
};

// 职业升级属性配置（默认值）
export const CLASS_LEVEL_BONUS = {
  warrior: {
    hpPerLevel: 0,
    mpPerLevel: 0,
    atkPerLevel: 0,
    defPerLevel: 0,
    magPerLevel: 0,
    mdefPerLevel: 0,
    spiritPerLevel: 0,
    dexPerLevel: 0
  },
  mage: {
    hpPerLevel: 0,
    mpPerLevel: 0,
    atkPerLevel: 0,
    defPerLevel: 0,
    magPerLevel: 0,
    mdefPerLevel: 0,
    spiritPerLevel: 0,
    dexPerLevel: 0
  },
  taoist: {
    hpPerLevel: 0,
    mpPerLevel: 0,
    atkPerLevel: 0,
    defPerLevel: 0,
    magPerLevel: 0,
    mdefPerLevel: 0,
    spiritPerLevel: 0,
    dexPerLevel: 0
  }
};

export let ROOM_VARIANT_COUNT = 5;

export function setRoomVariantCount(count) {
  const normalized = Math.max(1, Math.floor(Number(count) || 1));
  ROOM_VARIANT_COUNT = normalized;
  return ROOM_VARIANT_COUNT;
}

const EXP_TABLE = [
  0,
  100, 200, 400, 700, 1100, 1600, 2200, 2900, 3700, 4600,
  5600, 6700, 7900, 9200, 10600, 12100, 13700, 15400, 17200, 19100,
  21100, 23200, 25400, 27700, 30100, 32600, 35200, 37900, 40700, 43600,
  46600, 49700, 52900, 56200, 59600, 63100, 66700, 70400, 74200, 78100,
  82100, 86200, 90400, 94700, 99100, 103600, 108200, 112900, 117700, 122600,
  127600, 132700, 137900, 143200, 148600, 154100, 159700, 165400, 171200, 177100
];

export function expForLevel(level, cultivationLevel = null) {
  if (level < EXP_TABLE.length) {
    return Math.floor(applyCultivationExpMult(EXP_TABLE[level], cultivationLevel));
  }
  const base = EXP_TABLE[EXP_TABLE.length - 1];
  const extra = level - (EXP_TABLE.length - 1);
  const exp = base + extra * extra * 120 + extra * 800;
  if (level >= 140) {
    const steps = Math.floor((level - 140) / 20);
    const mult = 50 + steps * 10;
    return Math.floor(applyCultivationExpMult(exp * mult, cultivationLevel));
  }
  if (level >= 120) return Math.floor(applyCultivationExpMult(exp * 40, cultivationLevel));
  if (level >= 100) return Math.floor(applyCultivationExpMult(exp * 20, cultivationLevel));
  if (level >= 80) return Math.floor(applyCultivationExpMult(exp * 12, cultivationLevel));
  if (level >= 60) return Math.floor(applyCultivationExpMult(exp * 5, cultivationLevel));
  return Math.floor(applyCultivationExpMult(exp, cultivationLevel));
}

function applyCultivationExpMult(exp, cultivationLevel) {
  const level = Math.floor(Number(cultivationLevel ?? -1));
  if (Number.isNaN(level) || level < 0) return exp;
  return exp * (1 + (level + 1) * 0.5);
}

export function maxBagSlots(level) {
  return 5000;
}

export function getStartPosition() {
  const plainsVariants = Array.from({ length: ROOM_VARIANT_COUNT + 1 }, (_, i) =>
    i === 0 ? 'plains' : `plains${i}`
  );
  const randomPlains = plainsVariants[Math.floor(Math.random() * plainsVariants.length)];
  return {
    zone: 'bq_plains',
    room: randomPlains
  };
}

// 保持向后兼容，但每次调用都会随机
export const START_POSITION = {
  get zone() {
    return getStartPosition().zone;
  },
  get room() {
    return getStartPosition().room;
  }
};
