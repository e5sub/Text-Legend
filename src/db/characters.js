import knex from './index.js';
import { normalizeInventory, normalizeEquipment, normalizeWarehouse } from '../game/player.js';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildCharacterPersistData(userId, player, realmId) {
  return {
    user_id: userId,
    realm_id: realmId,
    name: player.name,
    class: player.classId,
    level: player.level,
    exp: player.exp,
    gold: player.gold,
    yuanbao: Math.max(0, Math.floor(Number(player.yuanbao || 0))),
    hp: player.hp,
    mp: player.mp,
    max_hp: player.max_hp,
    max_mp: player.max_mp,
    stats_json: JSON.stringify(player.stats || {}),
    position_json: JSON.stringify(player.position || {}),
    inventory_json: JSON.stringify(player.inventory || []),
    warehouse_json: JSON.stringify(player.warehouse || []),
    equipment_json: JSON.stringify(player.equipment || {}),
    quests_json: JSON.stringify(player.quests || {}),
    skills_json: JSON.stringify(player.skills || []),
    flags_json: JSON.stringify(player.flags || {})
  };
}

function buildCharacterPersistSignature(data) {
  return JSON.stringify(data);
}

function setCharacterPersistSignature(player, signature) {
  if (!player || typeof player !== 'object') return;
  Object.defineProperty(player, '__persistSignature', {
    value: signature,
    writable: true,
    configurable: true,
    enumerable: false
  });
}

export async function listCharacters(userId, realmId = 1) {
  return knex('characters')
    .where({ user_id: userId, realm_id: realmId })
    .select('name', 'class', 'level');
}

export async function listAllCharacters(realmId = 1) {
  const characters = await knex('characters')
    .where({ realm_id: realmId })
    .select('id', 'user_id', 'realm_id', 'name', 'class', 'level', 'exp', 'gold', 'yuanbao', 'hp', 'mp', 'max_hp', 'max_mp', 'stats_json', 'equipment_json', 'flags_json', 'skills_json');

  return characters.map(char => ({
    id: char.id,
    userId: char.user_id,
    realmId: char.realm_id || realmId,
    name: char.name,
    classId: char.class,
    level: char.level,
    exp: char.exp,
    gold: char.gold,
    yuanbao: char.yuanbao ?? 0,
    hp: char.hp,
    mp: char.mp,
    max_hp: char.max_hp,
    max_mp: char.max_mp,
    stats: parseJson(char.stats_json, {}),
    equipment: parseJson(char.equipment_json, {}),
    flags: parseJson(char.flags_json, {}),
    skills: parseJson(char.skills_json, [])
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
    yuanbao: row.yuanbao ?? 0,
    hp: row.hp,
    mp: row.mp,
    max_hp: row.max_hp,
    max_mp: row.max_mp,
    stats: parseJson(row.stats_json, {}),
    position: parseJson(row.position_json, {}),
    inventory: parseJson(row.inventory_json, []),
    warehouse: parseJson(row.warehouse_json, []),
    equipment: parseJson(row.equipment_json, {}),
    quests: parseJson(row.quests_json, {}),
    skills: parseJson(row.skills_json, []),
    flags: parseJson(row.flags_json, {}),
    rankTitle: row.rank_title || null,
    status: {}
  };
  normalizeInventory(player);
  normalizeWarehouse(player);
  normalizeEquipment(player);
  const persistedData = buildCharacterPersistData(row.user_id, player, row.realm_id || realmId);
  setCharacterPersistSignature(player, buildCharacterPersistSignature(persistedData));
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
  normalizeWarehouse(player);
  // 保存召唤兽信息到flags中（只有在召唤兽存在且活着时保存）
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
  const data = buildCharacterPersistData(userId, player, resolvedRealmId);
  const persistSignature = buildCharacterPersistSignature(data);
  if (player.__persistSignature === persistSignature) {
    return null;
  }

  // 优先使用主键 ID 更新，性能更好（避免复合 WHERE 条件）
  const characterId = player.id;
  if (characterId && typeof characterId === 'number') {
    const updated = await knex('characters')
      .where({ id: characterId })
      .update({ ...data, updated_at: knex.fn.now() });
    if (Number(updated || 0) > 0) {
      setCharacterPersistSignature(player, persistSignature);
      return null;
    }
  }

  // 回退到复合条件更新（兼容旧数据）
  const where = { user_id: userId, name: player.name, realm_id: resolvedRealmId };
  const updated = await knex('characters')
    .where(where)
    .update({ ...data, updated_at: knex.fn.now() });
  if (Number(updated || 0) > 0) {
    setCharacterPersistSignature(player, persistSignature);
    return null;
  }

  try {
    const [id] = await knex('characters').insert(data);
    setCharacterPersistSignature(player, persistSignature);
    // 保存新创建的角色 ID 到 player 对象
    player.id = id;
    return id;
  } catch (err) {
    const message = String(err?.sqlMessage || err?.message || '');
    const isDuplicate = message.includes('Duplicate')
      || message.includes('UNIQUE constraint failed')
      || message.includes('duplicate key value');
    if (!isDuplicate) {
      throw err;
    }
    await knex('characters')
      .where(where)
      .update({ ...data, updated_at: knex.fn.now() });
    setCharacterPersistSignature(player, persistSignature);
    return null;
  }
}

export async function deleteCharacter(userId, name, realmId = 1) {
  const row = await knex('characters').where({ user_id: userId, name, realm_id: realmId }).first();
  if (!row) return 0;
  await knex('deleted_characters').insert({
    source_character_id: row.id ?? null,
    user_id: row.user_id,
    realm_id: row.realm_id || realmId,
    name: row.name,
    payload_json: JSON.stringify(row)
  });
  return knex('characters').where({ id: row.id }).del();
}

export async function restoreDeletedCharacter(name, realmId = 1) {
  const deleted = await knex('deleted_characters')
    .where({ name, realm_id: realmId })
    .whereNull('restored_at')
    .orderBy('deleted_at', 'desc')
    .first();
  if (!deleted) {
    throw new Error('未找到可恢复的已删角色。');
  }
  const payload = parseJson(deleted.payload_json, null);
  if (!payload || typeof payload !== 'object') {
    throw new Error('已删角色数据损坏，无法恢复。');
  }
  const sameNameExists = await knex('characters').where({ name, realm_id: realmId }).first();
  if (sameNameExists) {
    throw new Error('当前区服已存在同名角色，无法恢复。');
  }
  const insertRow = { ...payload };
  delete insertRow.id;
  insertRow.realm_id = realmId;
  insertRow.updated_at = knex.fn.now();
  const [restoredId] = await knex('characters').insert(insertRow);
  await knex('deleted_characters')
    .where({ id: deleted.id })
    .update({
      restored_at: knex.fn.now(),
      restored_character_id: restoredId
    });
  return {
    deletedId: deleted.id,
    restoredId,
    userId: Number(insertRow.user_id || 0),
    name: String(insertRow.name || name),
    realmId
  };
}
