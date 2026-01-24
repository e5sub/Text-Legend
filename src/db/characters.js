import knex from './index.js';
import { normalizeInventory, normalizeEquipment } from '../game/player.js';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function listCharacters(userId) {
  return knex('characters').where({ user_id: userId }).select('name', 'class', 'level');
}

export async function loadCharacter(userId, name) {
  const row = await knex('characters').where({ user_id: userId, name }).first();
  if (!row) return null;
  const player = {
    id: row.id,
    user_id: row.user_id,
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

export async function saveCharacter(userId, player) {
  normalizeInventory(player);
  // 保存召唤物信息到flags中（只有在召唤物存在且活着时保存）
  if (!player.flags) player.flags = {};
  if (player.summon && player.summon.hp > 0) {
    player.flags.savedSummon = {
      id: player.summon.id,
      exp: player.summon.exp || 0,
      level: player.summon.level,
      hp: player.summon.hp,
      max_hp: player.summon.max_hp
    };
  } else if (player.summon && player.summon.hp <= 0) {
    // 召唤物死亡时清除保存的数据
    delete player.flags.savedSummon;
  }
  const data = {
    user_id: userId,
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

  const exists = await knex('characters').where({ user_id: userId, name: player.name }).first();
  if (exists) {
    await knex('characters').where({ user_id: userId, name: player.name }).update({ ...data, updated_at: knex.fn.now() });
    return exists.id;
  }
  const [id] = await knex('characters').insert(data);
  return id;
}
