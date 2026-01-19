export const SKILLS = {
  warrior: {
    slash: { id: 'slash', name: '\u57fa\u672c\u5251\u672f', mp: 0, power: 1.0, type: 'attack' },
    attack: { id: 'attack', name: '\u653b\u6740\u5251\u672f', mp: 4, power: 1.2, type: 'attack' },
    assassinate: { id: 'assassinate', name: '\u523a\u6740\u5251\u672f', mp: 8, power: 1.4, type: 'attack' },
    halfmoon: { id: 'halfmoon', name: '\u534a\u6708\u5f2f\u5200', mp: 12, power: 1.1, type: 'cleave' },
    firestrike: { id: 'firestrike', name: '\u70c8\u706b\u5251\u6cd5', mp: 18, power: 1.8, type: 'attack' },
    savage: { id: 'savage', name: '\u91ce\u86ee\u51b2\u649e', mp: 12, power: 1.1, type: 'attack' }
  },
  mage: {
    fireball: { id: 'fireball', name: '\u5c0f\u706b\u7403', mp: 10, power: 1.3, type: 'spell' },
    inferno: { id: 'inferno', name: '\u5730\u72f1\u706b', mp: 12, power: 1.2, type: 'spell' },
    explode: { id: 'explode', name: '\u7206\u88c2\u706b\u7130', mp: 14, power: 1.4, type: 'spell' },
    lightning: { id: 'lightning', name: '\u96f7\u7535\u672f', mp: 16, power: 1.7, type: 'spell' },
    flash: { id: 'flash', name: '\u75be\u5149\u7535\u5f71', mp: 18, power: 1.5, type: 'spell' },
    thunder: { id: 'thunder', name: '\u5730\u72f1\u96f7\u5149', mp: 20, power: 1.6, type: 'spell' },
    iceblast: { id: 'iceblast', name: '\u51b0\u54c1\u5578', mp: 22, power: 2.0, type: 'spell' }
  },
  taoist: {
    heal: { id: 'heal', name: '\u6cbb\u6108\u672f', mp: 12, power: 1.0, type: 'heal' },
    poison: { id: 'poison', name: '\u65bd\u6bd2\u672f', mp: 10, power: 0.6, type: 'dot' },
    soul: { id: 'soul', name: '\u7075\u9b42\u706b\u7b26', mp: 14, power: 1.4, type: 'spell' }
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
  book_mage_fireball: { classId: 'mage', skillId: 'fireball' },
  book_mage_inferno: { classId: 'mage', skillId: 'inferno' },
  book_mage_explode: { classId: 'mage', skillId: 'explode' },
  book_mage_lightning: { classId: 'mage', skillId: 'lightning' },
  book_mage_flash: { classId: 'mage', skillId: 'flash' },
  book_mage_thunder: { classId: 'mage', skillId: 'thunder' },
  book_mage_ice: { classId: 'mage', skillId: 'iceblast' },
  book_tao_heal: { classId: 'taoist', skillId: 'heal' },
  book_tao_poison: { classId: 'taoist', skillId: 'poison' },
  book_tao_soul: { classId: 'taoist', skillId: 'soul' }
};

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
