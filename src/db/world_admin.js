import knex from './index.js';

export async function listWorldZoneOverrides() {
  return knex('world_zones')
    .select('zone_id', 'data_json', 'updated_at');
}

export async function listWorldRoomOverrides(zoneId = null) {
  const query = knex('world_rooms').select('zone_id', 'room_id', 'data_json', 'updated_at');
  if (zoneId) {
    query.where({ zone_id: String(zoneId) });
  }
  return query;
}

export async function getWorldZoneOverride(zoneId) {
  const id = String(zoneId || '').trim();
  if (!id) return null;
  return knex('world_zones').where({ zone_id: id }).first();
}

export async function getWorldRoomOverride(zoneId, roomId) {
  const zid = String(zoneId || '').trim();
  const rid = String(roomId || '').trim();
  if (!zid || !rid) return null;
  return knex('world_rooms').where({ zone_id: zid, room_id: rid }).first();
}

export async function upsertWorldZoneOverride(zoneId, data) {
  const id = String(zoneId || '').trim();
  if (!id) throw new Error('zone_id is required');
  const payload = JSON.stringify(data || {});
  await knex('world_zones')
    .insert({ zone_id: id, data_json: payload })
    .onConflict('zone_id')
    .merge({ data_json: payload, updated_at: knex.fn.now() });
}

export async function upsertWorldRoomOverride(zoneId, roomId, data) {
  const zid = String(zoneId || '').trim();
  const rid = String(roomId || '').trim();
  if (!zid || !rid) throw new Error('zone_id and room_id are required');
  const payload = JSON.stringify(data || {});
  await knex('world_rooms')
    .insert({ zone_id: zid, room_id: rid, data_json: payload })
    .onConflict(['zone_id', 'room_id'])
    .merge({ data_json: payload, updated_at: knex.fn.now() });
}

export async function deleteWorldZoneOverride(zoneId) {
  const id = String(zoneId || '').trim();
  if (!id) return 0;
  return knex('world_zones').where({ zone_id: id }).del();
}

export async function deleteWorldRoomOverride(zoneId, roomId) {
  const zid = String(zoneId || '').trim();
  const rid = String(roomId || '').trim();
  if (!zid || !rid) return 0;
  return knex('world_rooms').where({ zone_id: zid, room_id: rid }).del();
}
