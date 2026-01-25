import knex from './index.js';

async function withSqliteRetry(operation, retries = 3, delayMs = 100) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      const isBusy = err && err.code === 'SQLITE_BUSY';
      if (!isBusy || attempt >= retries) throw err;
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

export async function listMobRespawns() {
  return knex('mob_respawns').select('zone_id', 'room_id', 'slot_index', 'template_id', 'respawn_at', 'current_hp', 'status');
}

export async function upsertMobRespawn(zoneId, roomId, slotIndex, templateId, respawnAt, currentHp = null, status = null) {
  const data = {
    zone_id: zoneId,
    room_id: roomId,
    slot_index: slotIndex,
    template_id: templateId,
    respawn_at: respawnAt
  };
  
  if (currentHp !== null) {
    data.current_hp = currentHp;
  }
  
  if (status !== null) {
    data.status = typeof status === 'string' ? status : JSON.stringify(status);
  }
  
  return withSqliteRetry(() =>
    knex('mob_respawns')
      .insert(data)
      .onConflict(['zone_id', 'room_id', 'slot_index'])
      .merge(data)
  );
}

export async function clearMobRespawn(zoneId, roomId, slotIndex) {
  return withSqliteRetry(() =>
    knex('mob_respawns')
      .where({ zone_id: zoneId, room_id: roomId, slot_index: slotIndex })
      .del()
  );
}

export async function saveMobState(zoneId, roomId, slotIndex, templateId, currentHp, status) {
  return upsertMobRespawn(zoneId, roomId, slotIndex, templateId, 0, currentHp, status);
}
