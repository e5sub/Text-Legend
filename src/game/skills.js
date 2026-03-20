import { ITEM_TEMPLATES } from './items.js';

export const SKILLS = {
  warrior: {
    slash: { id: 'slash', name: '基本剑术', mp: 0, power: 1.0, type: 'attack', effect: '对单体造成100%物理伤害。' },
    attack: { id: 'attack', name: '攻杀剑术', mp: 0, power: 1.3, type: 'attack', effect: '对单体造成130%物理伤害。' },
    assassinate: { id: 'assassinate', name: '刺杀剑术', mp: 0, power: 1.6, type: 'attack', effect: '对单体造成160%物理伤害，并可能波及附近目标。' },
    halfmoon: { id: 'halfmoon', name: '半月弯刀', mp: 12, power: 1.2, type: 'cleave', effect: '对周围目标造成120%物理伤害。' },
    firestrike: { id: 'firestrike', name: '烈火剑法', mp: 18, power: 2.5, type: 'attack', effect: '对单体造成250%物理伤害。' },
    savage: { id: 'savage', name: '野蛮冲撞', mp: 12, power: 1.4, type: 'aoe', powerStat: 'atk', effect: '对周围目标造成140%物理伤害。' },
    earth_spike: { id: 'earth_spike', name: '彻地钉', mp: 20, power: 2.0, type: 'aoe', powerStat: 'atk', effect: '对周围目标造成200%物理伤害。' },
    tiangang: { id: 'tiangang', name: '先天罡气', mp: 24, power: 1.0, type: 'buff_tiangang', cooldown: 60000, effect: '5秒内攻击*2，防御/魔御*1.5，60秒冷却。' }
  },
  mage: {
    fireball: { id: 'fireball', name: '小火球', mp: 10, power: 1.15, type: 'spell', effect: '对单体造成115%法术伤害。' },
    resist: { id: 'resist', name: '抗拒火环', mp: 12, power: 0.6, type: 'repel', effect: '震退目标并造成60%法术伤害。' },
    inferno: { id: 'inferno', name: '地狱火', mp: 12, power: 1.15, type: 'spell', effect: '对单体造成115%法术伤害。' },
    explode: { id: 'explode', name: '爆裂火焰', mp: 14, power: 1.25, type: 'spell', effect: '对单体造成125%法术伤害。' },
    lightning: { id: 'lightning', name: '雷电术', mp: 16, power: 1.45, type: 'spell', effect: '对单体造成145%法术伤害。' },
    flash: { id: 'flash', name: '疾光电影', mp: 18, power: 1.3, type: 'spell', effect: '对单体造成130%法术伤害。' },
    thunder: { id: 'thunder', name: '地狱雷光', mp: 20, power: 1.0, type: 'aoe', effect: '对周围目标造成100%法术伤害。' },
    thunderstorm: { id: 'thunderstorm', name: '雷霆万钧', mp: 24, power: 2.5, type: 'aoe', powerStat: 'mag', effect: '对周围目标造成250%法术伤害。' },
    shield: { id: 'shield', name: '魔法盾', mp: 22, power: 1.0, type: 'buff_shield', effect: '开启魔法盾，按比例消耗MP抵消伤害。' },
    iceblast: { id: 'iceblast', name: '冰咆哮', mp: 24, power: 1.6, type: 'spell', effect: '对单体造成160%法术伤害。' },
    group_magic_shield: { id: 'group_magic_shield', name: '群体魔法盾', mp: 28, power: 1.0, type: 'buff_magic_shield_group', cooldown: 60000, effect: '为自己与召唤兽施放魔法盾，持续5秒，60秒冷却。' }
  },
  taoist: {
    heal: { id: 'heal', name: '治愈术', mp: 12, power: 1.0, type: 'heal', effect: '恢复单体生命。' },
    group_heal: { id: 'group_heal', name: '群体治疗术', mp: 22, power: 1.0, type: 'heal_group', effect: '恢复自己与队友生命。' },
    poison: { id: 'poison', name: '施毒术', mp: 10, power: 0.75, type: 'dot', effect: '施放毒伤，持续掉血并削弱目标。' },
    soul: { id: 'soul', name: '灵魂火符', mp: 14, power: 1.5, type: 'spell', effect: '对单体造成150%法术伤害。' },
    invis: { id: 'invis', name: '隐身术', mp: 14, power: 1.0, type: 'stealth', effect: '隐身90+等级*45秒。' },
    group_invis: { id: 'group_invis', name: '群体隐身术', mp: 22, power: 1.0, type: 'stealth_group', cooldown: 60000, effect: '自己与召唤兽5秒内免疫所有伤害，60秒冷却。' },
    armor: { id: 'armor', name: '神圣战甲术', mp: 18, power: 1.0, type: 'buff_def', effect: '提升防御10%，持续60秒。' },
    ghost: { id: 'ghost', name: '幽灵盾', mp: 18, power: 1.0, type: 'buff_mdef', effect: '提升魔御10%，持续60秒。' },
    skeleton: {
      id: 'skeleton',
      name: '召唤骷髅',
      mp: 18,
      power: 1.0,
      type: 'summon',
      effect: '召唤骷髅协助作战。',
      summon: { name: '骷髅', level: 2, baseHp: 192, baseAtk: 18, baseDef: 7 }
    },
    summon: {
      id: 'summon',
      name: '召唤神兽',
      mp: 28,
      power: 1.0,
      type: 'summon',
      effect: '召唤神兽协助作战。',
      summon: { name: '神兽', level: 3, baseHp: 320, baseAtk: 30, baseDef: 12 }
    },
    white_tiger: {
      id: 'white_tiger',
      name: '召唤白虎',
      mp: 36,
      power: 1.0,
      type: 'summon',
      effect: '召唤白虎协助作战。',
      summon: { name: '白虎', level: 4, baseHp: 480, baseAtk: 45, baseDef: 16 }
    },
    moon_fairy: {
      id: 'moon_fairy',
      name: '召唤月仙',
      mp: 40,
      power: 1.0,
      type: 'summon',
      effect: '召唤月仙协助作战。',
      summon: { name: '月仙', level: 5, baseHp: 0, baseAtk: 0, baseDef: 0 }
    }
  },
  assassin: {
    shadow_strike: { id: 'shadow_strike', name: '影袭', mp: 0, power: 1.1, type: 'attack', effect: '快速突刺造成110%物理伤害，并附加1层影印。' },
    backstab: { id: 'backstab', name: '残月连斩', mp: 6, power: 0.8, type: 'attack', effect: '连续斩击两次，每次造成80%物理伤害，第二击若暴击则追加1层影印。' },
    dual_slash: { id: 'dual_slash', name: '影噬', mp: 12, power: 1.2, type: 'attack', effect: '消耗全部影印层数造成爆发伤害：基础120% + 每层影印15%。' },
    shadow_burst: { id: 'shadow_burst', name: '断魂刃', mp: 16, power: 1.3, type: 'attack', cooldown: 20000, effect: '对单体造成130%物理伤害；目标影印≥3时定身1回合并消耗3层影印。' },
    shadow_dance: { id: 'shadow_dance', name: '烟雾步', mp: 18, power: 1.0, type: 'buff_smoke', cooldown: 30000, effect: '3秒内闪避率提高并减免伤害。' },
    shadow_fury: { id: 'shadow_fury', name: '影息', mp: 0, power: 1.0, type: 'passive', effect: '击杀目标后回复部分生命与法力。' },
    shadow_rage: { id: 'shadow_rage', name: '影怒', mp: 30, power: 2.8, type: 'attack', cooldown: 60000, effect: '消耗全部影印层数爆发：基础280% + 每层影印25%。' }
  }
};

export const DEFAULT_SKILLS = {
  warrior: 'slash',
  mage: 'fireball',
  taoist: 'heal',
  assassin: 'shadow_strike'
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
  book_tao_moon_fairy: { classId: 'taoist', skillId: 'moon_fairy' },
  book_assassin_shadow: { classId: 'assassin', skillId: 'shadow_strike' },
  book_assassin_backstab: { classId: 'assassin', skillId: 'backstab' },
  book_assassin_dual: { classId: 'assassin', skillId: 'dual_slash' },
  book_assassin_burst: { classId: 'assassin', skillId: 'shadow_burst' },
  book_assassin_dance: { classId: 'assassin', skillId: 'shadow_dance' },
  book_assassin_fury: { classId: 'assassin', skillId: 'shadow_fury' },
  book_assassin_rage: { classId: 'assassin', skillId: 'shadow_rage' }
};

export function getInitialSkillsForClass(classId) {
  const skillIds = [];
  Object.entries(BOOK_SKILLS).forEach(([bookId, mapping]) => {
    if (!mapping || mapping.classId !== classId || !mapping.skillId) return;
    const rarity = String(ITEM_TEMPLATES[bookId]?.rarity || '').toLowerCase();
    if (classId === 'assassin') {
      if (rarity && rarity !== 'supreme') {
        skillIds.push(mapping.skillId);
      }
      return;
    }
    if (rarity === 'common') {
      skillIds.push(mapping.skillId);
    }
  });
  const base = DEFAULT_SKILLS[classId];
  if (base) skillIds.push(base);
  return Array.from(new Set(skillIds.filter(Boolean)));
}

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
  if (SKILLS[classId]?.[skillId]) return SKILLS[classId][skillId];
  for (const cls of Object.keys(SKILLS)) {
    if (SKILLS[cls]?.[skillId]) return SKILLS[cls][skillId];
  }
  return null;
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
  if (player.skills.includes(skillId)) return true;
  const extra = player.flags?.equipSkillId;
  if (extra && extra === skillId) return true;
  const extras = Array.isArray(player.flags?.equipSkills) ? player.flags.equipSkills : [];
  return extras.includes(skillId);
}

export function getLearnedSkills(player) {
  ensurePlayerSkills(player);
  const extras = [];
  if (player.flags?.equipSkillId) extras.push(player.flags.equipSkillId);
  if (Array.isArray(player.flags?.equipSkills)) extras.push(...player.flags.equipSkills);
  const ids = Array.from(new Set([...player.skills, ...extras].filter(Boolean)));
  return ids.map((id) => getSkill(player.classId, id)).filter(Boolean);
}



