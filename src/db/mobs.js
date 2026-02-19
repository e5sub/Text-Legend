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
