import knex from './index.js';
import { normalizeInventory } from '../game/player.js';

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
    flags: parseJson(row.flags_json, {}),
    status: {}
  };
  normalizeInventory(player);
  return player;
}

export async function saveCharacter(userId, player) {
  normalizeInventory(player);
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
