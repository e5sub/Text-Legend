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

const EXP_TABLE = [
  0,
  100, 200, 400, 700, 1100, 1600, 2200, 2900, 3700, 4600,
  5600, 6700, 7900, 9200, 10600, 12100, 13700, 15400, 17200, 19100,
  21100, 23200, 25400, 27700, 30100, 32600, 35200, 37900, 40700, 43600,
  46600, 49700, 52900, 56200, 59600, 63100, 66700, 70400, 74200, 78100,
  82100, 86200, 90400, 94700, 99100, 103600, 108200, 112900, 117700, 122600,
  127600, 132700, 137900, 143200, 148600, 154100, 159700, 165400, 171200, 177100
];

export function expForLevel(level) {
  if (level < EXP_TABLE.length) return EXP_TABLE[level];
  const base = EXP_TABLE[EXP_TABLE.length - 1];
  const extra = level - (EXP_TABLE.length - 1);
  return base + extra * extra * 120 + extra * 800;
}

export function maxBagSlots(level) {
  return 500;
}

export const START_POSITION = {
  zone: 'bq_town',
  room: 'gate'
};
