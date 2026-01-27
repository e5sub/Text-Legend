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

export async function listMobRespawns(realmId = 1) {
  return knex('mob_respawns')
    .where({ realm_id: realmId })
    .select('zone_id', 'room_id', 'slot_index', 'template_id', 'respawn_at', 'current_hp', 'status', 'realm_id');
}

export async function upsertMobRespawn(realmId, zoneId, roomId, slotIndex, templateId, respawnAt, currentHp = null, status = null) {
  const data = {
    realm_id: realmId,
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
      .onConflict(['realm_id', 'zone_id', 'room_id', 'slot_index'])
      .merge(data)
  );
}

export async function clearMobRespawn(realmId, zoneId, roomId, slotIndex) {
  return withSqliteRetry(() =>
    knex('mob_respawns')
      .where({ realm_id: realmId, zone_id: zoneId, room_id: roomId, slot_index: slotIndex })
      .del()
  );
}

export async function saveMobState(realmId, zoneId, roomId, slotIndex, templateId, currentHp, status) {
  return upsertMobRespawn(realmId, zoneId, roomId, slotIndex, templateId, 0, currentHp, status);
}
