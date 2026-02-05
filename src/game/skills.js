export const SKILLS = {
  warrior: {
    slash: { id: 'slash', name: '\u57fa\u672c\u5251\u672f', mp: 0, power: 1.0, type: 'attack' },
    attack: { id: 'attack', name: '\u653b\u6740\u5251\u672f', mp: 0, power: 1.3, type: 'attack' },
    assassinate: { id: 'assassinate', name: '\u523a\u6740\u5251\u672f', mp: 0, power: 1.6, type: 'attack' },
    halfmoon: { id: 'halfmoon', name: '\u534a\u6708\u5f2f\u5200', mp: 12, power: 1.2, type: 'cleave' },
    firestrike: { id: 'firestrike', name: '\u70c8\u706b\u5251\u6cd5', mp: 18, power: 2.2, type: 'attack', cooldown: 5000 },
    savage: { id: 'savage', name: '\u91ce\u86ee\u51b2\u649e', mp: 12, power: 1.2, type: 'attack' },
    earth_spike: { id: 'earth_spike', name: '彻地钉', mp: 20, power: 2.0, type: 'aoe', powerStat: 'atk' },
    tiangang: { id: 'tiangang', name: '先天罡气', mp: 24, power: 1.0, type: 'buff_tiangang', cooldown: 60000 }
  },
  mage: {
    fireball: { id: 'fireball', name: '\u5c0f\u706b\u7403', mp: 10, power: 1.15, type: 'spell' },
    resist: { id: 'resist', name: '\u6297\u62d2\u706b\u73af', mp: 12, power: 0.6, type: 'repel' },
    inferno: { id: 'inferno', name: '\u5730\u72f1\u706b', mp: 12, power: 1.15, type: 'spell' },
    explode: { id: 'explode', name: '\u7206\u88c2\u706b\u7130', mp: 14, power: 1.25, type: 'spell' },
    lightning: { id: 'lightning', name: '\u96f7\u7535\u672f', mp: 16, power: 1.45, type: 'spell' },
    flash: { id: 'flash', name: '\u75be\u5149\u7535\u5f71', mp: 18, power: 1.3, type: 'spell' },
    thunder: { id: 'thunder', name: '\u5730\u72f1\u96f7\u5149', mp: 20, power: 1.0, type: 'aoe' },
    thunderstorm: { id: 'thunderstorm', name: '雷霆万钧', mp: 24, power: 2.0, type: 'aoe', powerStat: 'mag' },
    shield: { id: 'shield', name: '\u9b54\u6cd5\u76fe', mp: 22, power: 1.0, type: 'buff_shield' },
    iceblast: { id: 'iceblast', name: '冰咆哮', mp: 24, power: 1.6, type: 'spell' },
    group_magic_shield: { id: 'group_magic_shield', name: '群体魔法盾', mp: 28, power: 1.0, type: 'buff_magic_shield_group', cooldown: 60000 }
  },
  taoist: {
    heal: { id: 'heal', name: '\u6cbb\u6108\u672f', mp: 12, power: 1.0, type: 'heal' },
    group_heal: { id: 'group_heal', name: '\u7fa4\u4f53\u6cbb\u7597\u672f', mp: 22, power: 1.0, type: 'heal_group' },
    poison: { id: 'poison', name: '\u65bd\u6bd2\u672f', mp: 10, power: 0.75, type: 'dot' },
    soul: { id: 'soul', name: '\u7075\u9b42\u706b\u7b26', mp: 14, power: 1.5, type: 'spell' },
    invis: { id: 'invis', name: '\u9690\u8eab\u672f', mp: 14, power: 1.0, type: 'stealth' },
    group_invis: { id: 'group_invis', name: '\u7fa4\u4f53\u9690\u8eab\u672f', mp: 22, power: 1.0, type: 'stealth_group', cooldown: 60000 },
    armor: { id: 'armor', name: '\u795e\u5723\u6218\u7532\u672f', mp: 18, power: 1.0, type: 'buff_def' },
    ghost: { id: 'ghost', name: '\u5e7d\u7075\u76fe', mp: 18, power: 1.0, type: 'buff_mdef' },
    skeleton: {
      id: 'skeleton',
      name: '\u53ec\u5524\u9ab7\u9ac5',
      mp: 18,
      power: 1.0,
      type: 'summon',
      summon: { name: '\u9ab7\u9ac5', level: 2, baseHp: 192, baseAtk: 18, baseDef: 7 }
    },
    summon: {
      id: 'summon',
      name: '\u53ec\u5524\u795e\u517d',
      mp: 28,
      power: 1.0,
      type: 'summon',
      summon: { name: '\u795e\u517d', level: 3, baseHp: 320, baseAtk: 30, baseDef: 12 }
    },
    white_tiger: {
      id: 'white_tiger',
      name: '\u53ec\u5524\u767d\u864e',
      mp: 36,
      power: 1.0,
      type: 'summon',
      summon: { name: '\u767d\u864e', level: 4, baseHp: 480, baseAtk: 45, baseDef: 16 }
    },
    moon_fairy: {
      id: 'moon_fairy',
      name: '\u53ec\u5524\u6708\u4ed9',
      mp: 40,
      power: 1.0,
      type: 'summon',
      summon: { name: '\u6708\u4ed9', level: 5, baseHp: 0, baseAtk: 0, baseDef: 0 }
    }
  }
};

export const DEFAULT_SKILLS = {
  warrior: 'slash',
  mage: 'fireball',
  taoist: 'heal'
};

export const BOOK_SKILLS = {
  book_war_basic: { classId: 'warrior', skillId: 'slash' },
  book_war_attack: { classId: 'warrior', skillId: 'attack' },
  book_war_assassinate: { classId: 'warrior', skillId: 'assassinate' },
  book_war_halfmoon: { classId: 'warrior', skillId: 'halfmoon' },
  book_war_fire: { classId: 'warrior', skillId: 'firestrike' },
  book_war_savage: { classId: 'warrior', skillId: 'savage' },
  book_war_earth_spike: { classId: 'warrior', skillId: 'earth_spike' },
  book_war_tiangang: { classId: 'warrior', skillId: 'tiangang' },
  book_mage_fireball: { classId: 'mage', skillId: 'fireball' },
  book_mage_resist: { classId: 'mage', skillId: 'resist' },
  book_mage_inferno: { classId: 'mage', skillId: 'inferno' },
  book_mage_explode: { classId: 'mage', skillId: 'explode' },
  book_mage_lightning: { classId: 'mage', skillId: 'lightning' },
  book_mage_flash: { classId: 'mage', skillId: 'flash' },
  book_mage_thunder: { classId: 'mage', skillId: 'thunder' },
  book_mage_thunderstorm: { classId: 'mage', skillId: 'thunderstorm' },
  book_mage_shield: { classId: 'mage', skillId: 'shield' },
  book_mage_ice: { classId: 'mage', skillId: 'iceblast' },
  book_mage_group_shield: { classId: 'mage', skillId: 'group_magic_shield' },
  book_tao_heal: { classId: 'taoist', skillId: 'heal' },
  book_tao_group_heal: { classId: 'taoist', skillId: 'group_heal' },
  book_tao_poison: { classId: 'taoist', skillId: 'poison' },
  book_tao_soul: { classId: 'taoist', skillId: 'soul' },
  book_tao_invis: { classId: 'taoist', skillId: 'invis' },
  book_tao_group_invis: { classId: 'taoist', skillId: 'group_invis' },
  book_tao_armor: { classId: 'taoist', skillId: 'armor' },
  book_tao_shield: { classId: 'taoist', skillId: 'ghost' },
  book_tao_skeleton: { classId: 'taoist', skillId: 'skeleton' },
  book_tao_summon: { classId: 'taoist', skillId: 'summon' },
  book_tao_white_tiger: { classId: 'taoist', skillId: 'white_tiger' },
  book_tao_moon_fairy: { classId: 'taoist', skillId: 'moon_fairy' }
};

export const SKILL_MASTERY_LEVELS = [0, 100, 400];
const MAX_SKILL_LEVEL = SKILL_MASTERY_LEVELS.length;

function ensureSkillMastery(player) {
  if (!player.flags) player.flags = {};
  if (!player.flags.skillMastery) player.flags.skillMastery = {};
  return player.flags.skillMastery;
}

export function getSkillLevel(player, skillId) {
  return MAX_SKILL_LEVEL;
}

export function gainSkillMastery(player, skillId, amount = 1) {
  ensureSkillMastery(player);
  return false;
}

export function scaledSkillPower(skill, level) {
  const lv = Math.max(1, level || 1);
  return (skill.power || 1) * (1 + (lv - 1) * 0.1);
}

export function getSkill(classId, skillId) {
  return SKILLS[classId]?.[skillId] || null;
}

export function ensurePlayerSkills(player) {
  if (!Array.isArray(player.skills)) player.skills = [];
  const base = DEFAULT_SKILLS[player.classId];
  if (base && !player.skills.includes(base)) {
    player.skills.unshift(base);
  }
  return player.skills;
}

export function hasSkill(player, skillId) {
  ensurePlayerSkills(player);
  return player.skills.includes(skillId);
}

export function getLearnedSkills(player) {
  ensurePlayerSkills(player);
  return player.skills.map((id) => getSkill(player.classId, id)).filter(Boolean);
}
