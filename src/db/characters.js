import knex from './index.js';
import { normalizeInventory, normalizeEquipment } from '../game/player.js';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function listCharacters(userId, realmId = 1) {
  return knex('characters')
    .where({ user_id: userId, realm_id: realmId })
    .select('name', 'class', 'level');
}

export async function listAllCharacters(realmId = 1) {
  const characters = await knex('characters')
    .where({ realm_id: realmId })
    .select('id', 'name', 'class', 'level', 'exp', 'gold', 'hp', 'mp', 'max_hp', 'max_mp', 'stats_json', 'equipment_json');
  
  return characters.map(char => ({
    name: char.name,
    classId: char.class,
    level: char.level,
    exp: char.exp,
    gold: char.gold,
    hp: char.hp,
    mp: char.mp,
    max_hp: char.max_hp,
    max_mp: char.max_mp,
    stats: parseJson(char.stats_json, {}),
    equipment: parseJson(char.equipment_json, {})
  }));
}

export async function loadCharacter(userId, name, realmId = 1) {
  const row = await knex('characters').where({ user_id: userId, name, realm_id: realmId }).first();
  if (!row) return null;
  const player = {
    id: row.id,
    user_id: row.user_id,
    realmId: row.realm_id || realmId,
    name: row.name,
    classId: row.class,
    level: row.level,
    exp: row.exp,
    gold: row.gold,
    hp: row.hp,
    mp: row.mp,
    max_hp: row.max_hp,
    max_mp: row.max_mp,
    stats: parseJson(row.stats_json, {}),
    position: parseJson(row.position_json, {}),
    inventory: parseJson(row.inventory_json, []),
    equipment: parseJson(row.equipment_json, {}),
    quests: parseJson(row.quests_json, {}),
    skills: parseJson(row.skills_json, []),
    flags: parseJson(row.flags_json, {}),
    status: {}
  };
  normalizeInventory(player);
  normalizeEquipment(player);
  return player;
}

export async function findCharacterByName(name) {
  return knex('characters').where({ name }).first();
}

export async function findCharacterByNameInRealm(name, realmId = 1) {
  return knex('characters').where({ name, realm_id: realmId }).first();
}

export async function saveCharacter(userId, player, realmId = 1) {
  const resolvedRealmId = Number(player?.realmId ?? realmId ?? 1) || 1;
  normalizeInventory(player);
  // 保存召唤物信息到flags中（只有在召唤物存在且活着时保存）
  if (!player.flags) player.flags = {};
  const summons = Array.isArray(player.summons)
    ? player.summons
    : (player.summon ? [player.summon] : []);
  const aliveSummons = summons.filter((summon) => summon && summon.hp > 0);
  if (aliveSummons.length) {
    player.flags.savedSummons = aliveSummons.map((summon) => ({
      id: summon.id,
      exp: summon.exp || 0,
      level: summon.level,
      hp: summon.hp,
      max_hp: summon.max_hp
    }));
    delete player.flags.savedSummon;
  } else {
    delete player.flags.savedSummons;
    delete player.flags.savedSummon;
  }
  const data = {
    user_id: userId,
    realm_id: resolvedRealmId,
    name: player.name,
    class: player.classId,
    level: player.level,
    exp: player.exp,
    gold: player.gold,
    hp: player.hp,
    mp: player.mp,
    max_hp: player.max_hp,
    max_mp: player.max_mp,
    stats_json: JSON.stringify(player.stats || {}),
    position_json: JSON.stringify(player.position || {}),
    inventory_json: JSON.stringify(player.inventory || []),
    equipment_json: JSON.stringify(player.equipment || {}),
    quests_json: JSON.stringify(player.quests || {}),
    skills_json: JSON.stringify(player.skills || []),
    flags_json: JSON.stringify(player.flags || {})
  };

  const exists = await knex('characters').where({ user_id: userId, name: player.name, realm_id: resolvedRealmId }).first();
  if (exists) {
    await knex('characters')
      .where({ user_id: userId, name: player.name, realm_id: resolvedRealmId })
      .update({ ...data, updated_at: knex.fn.now() });
    return exists.id;
  }
  const [id] = await knex('characters').insert(data);
  return id;
}
