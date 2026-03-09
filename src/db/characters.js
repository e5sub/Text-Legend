import knex from './index.js';
import { normalizeInventory, normalizeEquipment, normalizeWarehouse } from '../game/player.js';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// 深拷贝 JSON 字段（snapshot 隔离）
function cloneJsonSafe(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch {
    return fallback;
  }
}

function getZhuxianTowerBestFloorFromFlags(flags) {
  if (!flags || typeof flags !== 'object') return 0;
  const zxft = flags.zxft;
  if (!zxft || typeof zxft !== 'object') return 0;
  const best = Math.floor(Number(zxft.bestFloor || 0));
  const highest = Math.floor(Number(zxft.highestClearedFloor || 0));
  return Math.max(0, best, highest);
}

function cloneRawData(rawData) {
  return {
    user_id: rawData.user_id,
    realm_id: rawData.realm_id,
    name: rawData.name,
    class: rawData.class,
    level: rawData.level,
    exp: rawData.exp,
    gold: rawData.gold,
    yuanbao: rawData.yuanbao,
    hp: rawData.hp,
    mp: rawData.mp,
    max_hp: rawData.max_hp,
    max_mp: rawData.max_mp,
    stats: cloneJsonSafe(rawData.stats, {}),
    position: cloneJsonSafe(rawData.position, {}),
    inventory: cloneJsonSafe(rawData.inventory, []),
    warehouse: cloneJsonSafe(rawData.warehouse, []),
    equipment: cloneJsonSafe(rawData.equipment, {}),
    quests: cloneJsonSafe(rawData.quests, {}),
    skills: cloneJsonSafe(rawData.skills, []),
    flags: cloneJsonSafe(rawData.flags, {})
  };
}

// JSON 大字段映射：raw字段名 -> DB字段名
const JSON_FIELD_MAP = {
  stats: 'stats_json',
  position: 'position_json',
  inventory: 'inventory_json',
  warehouse: 'warehouse_json',
  equipment: 'equipment_json',
  quests: 'quests_json',
  skills: 'skills_json',
  flags: 'flags_json'
};

// 轻量字段（标量，无需序列化）
const LIGHT_FIELDS = ['user_id', 'realm_id', 'name', 'class', 'level', 'exp', 'gold', 'yuanbao', 'hp', 'mp', 'max_hp', 'max_mp', 'zhuxian_tower_best_floor'];

// 构建原始数据对象（不进行JSON序列化）
function buildCharacterRawData(userId, player, realmId) {
  // 计算诛仙塔最佳层数
  const zhuxianTowerBestFloor = getZhuxianTowerBestFloorFromFlags(player.flags || {});
  
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
    zhuxian_tower_best_floor: zhuxianTowerBestFloor,
    stats: player.stats || {},
    position: player.position || {},
    inventory: player.inventory || [],
    warehouse: player.warehouse || [],
    equipment: player.equipment || {},
    quests: player.quests || {},
    skills: player.skills || [],
    flags: player.flags || {}
  };
}

// 序列化指定字段（按需序列化）
function serializeFields(rawData, fields) {
  const result = {};
  for (const key of fields) {
    if (LIGHT_FIELDS.includes(key)) {
      result[key] = rawData[key];
    } else if (JSON_FIELD_MAP[key]) {
      result[JSON_FIELD_MAP[key]] = JSON.stringify(rawData[key]);
    }
  }
  return result;
}

// 全量序列化（用于insert/force全量）
function serializeAll(rawData) {
  const result = {};
  for (const key of LIGHT_FIELDS) {
    result[key] = rawData[key];
  }
  for (const [rawKey, dbKey] of Object.entries(JSON_FIELD_MAP)) {
    result[dbKey] = JSON.stringify(rawData[rawKey]);
  }
  return result;
}

function setCharacterPersistSnapshot(player, snapshot) {
  if (!player || typeof player !== 'object') return;
  Object.defineProperty(player, '__persistSnapshot', {
    value: snapshot,
    writable: true,
    configurable: true,
    enumerable: false
  });
}

function getCharacterPersistSnapshot(player) {
  return player?.__persistSnapshot || null;
}

// 需要 JSON 内容比较的字段
const JSON_RAW_FIELDS = Object.keys(JSON_FIELD_MAP);

// 比较原始数据，返回变化的字段名列表
function diffRawData(prev, next, allowHeavy) {
  const changed = [];
  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);

  for (const key of allKeys) {
    if (JSON_RAW_FIELDS.includes(key)) {
      // JSON 字段：内容比较（只有允许保存时才比较）
      if (allowHeavy) {
        if (JSON.stringify(prev?.[key] ?? null) !== JSON.stringify(next?.[key] ?? null)) {
          changed.push(key);
        }
      }
    } else if (prev?.[key] !== next[key]) {
      // 标量字段：引用比较
      changed.push(key);
    }
  }

  return changed;
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

  // 初始化原始数据快照（深拷贝隔离）
  const rawData = buildCharacterRawData(row.user_id, player, row.realm_id || realmId);
  setCharacterPersistSnapshot(player, cloneRawData(rawData));

  return player;
}

export async function findCharacterByName(name) {
  return knex('characters').where({ name }).first();
}

export async function findCharacterByNameInRealm(name, realmId = 1) {
  return knex('characters').where({ name, realm_id: realmId }).first();
}

/**
 * 保存角色数据（延迟序列化优化版）
 * @param {string|number} userId - 用户ID
 * @param {object} player - 玩家对象
 * @param {number} realmId - 区服ID
 * @param {object} options - 选项
 * @param {boolean} options.allowHeavy - 是否允许保存JSON大字段
 * @param {boolean} options.force - 是否强制保存（即使没有变化）
 * @param {boolean} options.upsert - 是否允许插入新记录（默认true）
 * @returns {Promise<number|null>} - 新插入的ID或null
 *
 * 使用策略：
 * 1. 高频轻存（战斗/移动中）：saveCharacter(uid, player, realm, { allowHeavy: false })
 *    - 只序列化标量字段，避免JSON.stringify大数组
 * 2. 低频重存（定时30-60秒）：saveCharacter(uid, player, realm, { allowHeavy: true })
 *    - 序列化所有变化的字段
 * 3. 强制落盘（下线/切服）：saveCharacter(uid, player, realm, { allowHeavy: true, force: true })
 *    - 全量保存，无视diff
 */
export async function saveCharacter(userId, player, realmId = 1, options = {}) {
  const resolvedRealmId = Number(player?.realmId ?? realmId ?? 1) || 1;
  const allowHeavy = Boolean(options.allowHeavy);
  const force = Boolean(options.force);
  const allowUpsert = options.upsert !== false;

  normalizeInventory(player);
  normalizeWarehouse(player);

  // 保存召唤兽信息到flags中
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

  // 构建当前原始数据（无序列化）
  const rawData = buildCharacterRawData(userId, player, resolvedRealmId);
  const prev = getCharacterPersistSnapshot(player);

  // 确定要保存的字段
  let fieldsToSave = [];

  if (force) {
    // 强制模式：根据 allowHeavy 决定保存范围
    fieldsToSave = allowHeavy
      ? [...LIGHT_FIELDS, ...Object.keys(JSON_FIELD_MAP)]  // 全量
      : [...LIGHT_FIELDS];  // 仅标量
  } else {
    // diff 模式：只保存变化的字段
    const changed = diffRawData(prev, rawData, allowHeavy);
    const heavyKeys = Object.keys(JSON_FIELD_MAP);

    if (allowHeavy) {
      fieldsToSave = changed;
    } else {
      // 排除 heavy 字段
      fieldsToSave = changed.filter(k => !heavyKeys.includes(k));
    }
  }

  // 无字段需要保存
  if (fieldsToSave.length === 0) {
    return null;
  }

  // 按需序列化（只在此时做 JSON.stringify）
  const updateData = force && allowHeavy
    ? serializeAll(rawData)  // force全量：全部序列化
    : serializeFields(rawData, fieldsToSave);  // 增量：只序列化变化的字段

  // 执行更新
  const characterId = player.id;
  let updated = 0;

  if (characterId && typeof characterId === 'number') {
    updated = await knex('characters')
      .where({ id: characterId })
      .update({ ...updateData, updated_at: knex.fn.now() });
  }

  // 回退到复合条件更新
  if (Number(updated || 0) === 0) {
    const where = { user_id: userId, name: player.name, realm_id: resolvedRealmId };
    updated = await knex('characters')
      .where(where)
      .update({ ...updateData, updated_at: knex.fn.now() });

    // 无记录更新且允许插入，执行upsert
    if (Number(updated || 0) === 0 && allowUpsert) {
      try {
        const insertData = serializeAll(rawData);
        const [id] = await knex('characters').insert(insertData);
        player.id = id;
        setCharacterPersistSnapshot(player, cloneRawData(rawData));
        return id;
      } catch (err) {
        const message = String(err?.sqlMessage || err?.message || '');
        const isDuplicate = message.includes('Duplicate')
          || message.includes('UNIQUE constraint failed')
          || message.includes('duplicate key value');
        if (!isDuplicate) {
          throw err;
        }
        // 冲突时重试更新
        await knex('characters')
          .where(where)
          .update({ ...updateData, updated_at: knex.fn.now() });
        setCharacterPersistSnapshot(player, cloneRawData(rawData));
        return null;
      }
    }
  }

  // 更新快照（深拷贝隔离）
  setCharacterPersistSnapshot(player, cloneRawData(rawData));
  return null;
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
