import knex from './index.js';

function isRetryableWriteError(err) {
  if (!err) return false;
  const code = String(err.code || '');
  const errno = Number(err.errno);
  const sqlState = String(err.sqlState || '');
  return (
    code === 'SQLITE_BUSY' ||
    code === 'ER_LOCK_WAIT_TIMEOUT' ||
    code === 'ER_LOCK_DEADLOCK' ||
    errno === 1205 ||
    errno === 1213 ||
    sqlState === '40001'
  );
}

async function withWriteRetry(operation, retries = 5, baseDelayMs = 75) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      if (!isRetryableWriteError(err) || attempt >= retries) throw err;
      attempt += 1;
      const backoff = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 50);
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }
}

export async function listMobRespawns(realmId = 1) {
  return knex('mob_respawns')
    .where({ realm_id: realmId })
    .select('zone_id', 'room_id', 'slot_index', 'template_id', 'respawn_at', 'current_hp', 'status', 'realm_id');
}

export async function listMobRespawnsPage(realmId = 1, options = {}) {
  const limit = Math.max(100, Math.min(5000, Math.floor(Number(options.limit) || 2000)));
  const cursor = options.cursor && typeof options.cursor === 'object' ? options.cursor : null;
  const templateIds = Array.isArray(options.templateIds) ? options.templateIds : [];
  const query = knex('mob_respawns')
    .where({ realm_id: realmId })
    .select('zone_id', 'room_id', 'slot_index', 'template_id', 'respawn_at', 'current_hp', 'status', 'realm_id')
    .orderBy('zone_id', 'asc')
    .orderBy('room_id', 'asc')
    .orderBy('slot_index', 'asc')
    .limit(limit);
  if (templateIds.length > 0) {
    query.whereIn('template_id', templateIds);
  }

  if (cursor && cursor.zone_id !== undefined && cursor.room_id !== undefined && cursor.slot_index !== undefined) {
    query.andWhere((q) => {
      q.where('zone_id', '>', String(cursor.zone_id))
        .orWhere((q2) => {
          q2.where('zone_id', String(cursor.zone_id))
            .andWhere('room_id', '>', String(cursor.room_id));
        })
        .orWhere((q2) => {
          q2.where('zone_id', String(cursor.zone_id))
            .andWhere('room_id', String(cursor.room_id))
            .andWhere('slot_index', '>', Number(cursor.slot_index));
        });
    });
  }
  return query;
}

export async function upsertMobRespawn(realmId, zoneId, roomId, slotIndex, templateId, respawnAt, currentHp = null, status = null) {
  const insertData = {
    realm_id: realmId,
    zone_id: zoneId,
    room_id: roomId,
    slot_index: slotIndex,
    template_id: templateId,
    respawn_at: respawnAt
  };
  const mergeData = {
    template_id: templateId,
    respawn_at: respawnAt
  };
  
  if (currentHp !== null) {
    insertData.current_hp = currentHp;
    mergeData.current_hp = currentHp;
  }
  
  if (status !== null) {
    const normalizedStatus = typeof status === 'string' ? status : JSON.stringify(status);
    insertData.status = normalizedStatus;
    mergeData.status = normalizedStatus;
  }
  
  return withWriteRetry(() =>
    knex('mob_respawns')
      .insert(insertData)
      .onConflict(['realm_id', 'zone_id', 'room_id', 'slot_index'])
      .merge(mergeData)
  );
}

export async function clearMobRespawn(realmId, zoneId, roomId, slotIndex) {
  return withWriteRetry(() =>
    knex('mob_respawns')
      .where({ realm_id: realmId, zone_id: zoneId, room_id: roomId, slot_index: slotIndex })
      .del()
  );
}

export async function clearInvalidCrossWorldBossRespawns() {
  return withWriteRetry(() =>
    knex('mob_respawns')
      .where({ zone_id: 'crb', template_id: 'cross_world_boss' })
      .whereNot('realm_id', 0)
      .del()
  );
}

export async function saveMobState(realmId, zoneId, roomId, slotIndex, templateId, currentHp, status) {
  return upsertMobRespawn(realmId, zoneId, roomId, slotIndex, templateId, 0, currentHp, status);
}

export async function cleanupExpiredMobRespawns(nowMs = Date.now()) {
  const now = Math.max(0, Math.floor(Number(nowMs) || 0));
  return withWriteRetry(() =>
    knex('mob_respawns')
      .where('respawn_at', '<=', now)
      .andWhere((q) => q.whereNull('current_hp').orWhere('current_hp', '<=', 0))
      .del()
  );
}

export async function cleanupExpiredMobRespawnsBatch(nowMs = Date.now(), limit = 1000) {
  const now = Math.max(0, Math.floor(Number(nowMs) || 0));
  const batchSize = Math.max(1, Math.min(5000, Math.floor(Number(limit) || 1000)));
  const rows = await knex('mob_respawns')
    .where('respawn_at', '<=', now)
    .andWhere((q) => q.whereNull('current_hp').orWhere('current_hp', '<=', 0))
    .select('realm_id', 'zone_id', 'room_id', 'slot_index')
    .limit(batchSize);
  if (!rows.length) return 0;
  return withWriteRetry(() =>
    knex('mob_respawns')
      .where((q) => {
        rows.forEach((row, index) => {
          const clause = {
            realm_id: row.realm_id,
            zone_id: row.zone_id,
            room_id: row.room_id,
            slot_index: row.slot_index
          };
          if (index === 0) q.where(clause);
          else q.orWhere(clause);
        });
      })
      .del()
  );
}

/**
 * 批量 upsert 怪物刷新记录
 * @param {Array} records - 记录数组，每项包含 {realm_id, zone_id, room_id, slot_index, template_id, respawn_at, current_hp?, status?}
 */
export async function batchUpsertMobRespawns(records) {
  if (!Array.isArray(records) || records.length === 0) return 0;
  return withWriteRetry(async () => {
    const insertData = records.map((r) => ({
      realm_id: r.realm_id,
      zone_id: r.zone_id,
      room_id: r.room_id,
      slot_index: r.slot_index,
      template_id: r.template_id,
      respawn_at: r.respawn_at,
      current_hp: r.current_hp ?? null,
      status: r.status ?? null
    }));
    // 使用显式事务减少提交开销
    await knex.transaction(async (trx) => {
      await trx('mob_respawns')
        .insert(insertData)
        .onConflict(['realm_id', 'zone_id', 'room_id', 'slot_index'])
        .merge(['template_id', 'respawn_at', 'current_hp', 'status']);
    });
    return records.length;
  });
}

/**
 * 批量删除怪物刷新记录
 * @param {Array} keys - 键数组，每项包含 {realm_id, zone_id, room_id, slot_index}
 */
export async function batchClearMobRespawns(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return 0;
  return withWriteRetry(async () => {
    // 使用显式事务
    const deleted = await knex.transaction(async (trx) => {
      return trx('mob_respawns')
        .whereIn(
          ['realm_id', 'zone_id', 'room_id', 'slot_index'],
          keys.map((k) => [k.realm_id, k.zone_id, k.room_id, k.slot_index])
        )
        .del();
    });
    return deleted;
  });
}
