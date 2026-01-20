import { WORLD } from './world.js';
import { MOB_TEMPLATES } from './mobs.js';
import { randInt } from './utils.js';

const ROOM_MOBS = new Map();
const RESPAWN_CACHE = new Map();
let respawnStore = null;
const BOSS_SCALE = { hp: 1.25, atk: 1.18, def: 1.18 };
const MOB_HP_SCALE = 2;

function respawnKey(zoneId, roomId, slotIndex) {
  return `${zoneId}:${roomId}:${slotIndex}`;
}

function isBossTemplate(tpl) {
  if (!tpl) return false;
  return Boolean(
    tpl.worldBoss ||
    tpl.id.includes('boss') ||
    tpl.id.includes('leader') ||
    tpl.id.includes('demon') ||
    ['bug_queen', 'huangquan', 'evil_snake', 'pig_white'].includes(tpl.id)
  );
}

function scaledStats(tpl) {
  if (!tpl) return { hp: 0, atk: 0, def: 0 };
  if (!isBossTemplate(tpl)) {
    return { hp: Math.floor(tpl.hp * MOB_HP_SCALE), atk: tpl.atk, def: tpl.def };
  }
  return {
    hp: Math.floor(tpl.hp * MOB_HP_SCALE * BOSS_SCALE.hp),
    atk: Math.floor(tpl.atk * BOSS_SCALE.atk),
    def: Math.floor(tpl.def * BOSS_SCALE.def)
  };
}

function roomKey(zoneId, roomId) {
  return `${zoneId}:${roomId}`;
}

export function getRoom(zoneId, roomId) {
  const zone = WORLD[zoneId];
  if (!zone) return null;
  return zone.rooms[roomId] || null;
}

export function getRoomMobs(zoneId, roomId) {
  const key = roomKey(zoneId, roomId);
  if (!ROOM_MOBS.has(key)) {
    ROOM_MOBS.set(key, []);
  }
  return ROOM_MOBS.get(key);
}

export function seedRespawnCache(records) {
  RESPAWN_CACHE.clear();
  if (!Array.isArray(records)) return;
  records.forEach((row) => {
    if (!row) return;
    const zoneId = row.zone_id || row.zoneId;
    const roomId = row.room_id || row.roomId;
    const slotIndex = Number(row.slot_index ?? row.slotIndex);
    if (!zoneId || !roomId || Number.isNaN(slotIndex)) return;
    RESPAWN_CACHE.set(respawnKey(zoneId, roomId, slotIndex), {
      templateId: row.template_id || row.templateId,
      respawnAt: Number(row.respawn_at ?? row.respawnAt)
    });
  });
}

export function setRespawnStore(store) {
  respawnStore = store;
}

export function getAliveMobs(zoneId, roomId) {
  return getRoomMobs(zoneId, roomId).filter((m) => m.hp > 0);
}

export function spawnMobs(zoneId, roomId) {
  const room = getRoom(zoneId, roomId);
  if (!room || !room.spawns || room.spawns.length === 0) return [];
  const mobList = getRoomMobs(zoneId, roomId);
  const now = Date.now();
  room.spawns.forEach((templateId, index) => {
    let mob = mobList.find((m) => m.slotIndex === index);
    const tpl = MOB_TEMPLATES[templateId];
    const scaled = scaledStats(tpl);
    if (!mob) {
      const cached = RESPAWN_CACHE.get(respawnKey(zoneId, roomId, index));
      if (cached && cached.respawnAt && cached.respawnAt > now && (!cached.templateId || cached.templateId === templateId)) {
        mob = {
          id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
          templateId,
          slotIndex: index,
          name: tpl.name,
          level: tpl.level,
          hp: 0,
          max_hp: scaled.hp,
          atk: scaled.atk,
          def: scaled.def,
          dex: tpl.dex || 6,
          status: {},
          respawnAt: cached.respawnAt,
          justRespawned: false
        };
        mobList.push(mob);
        return;
      }
      mob = {
        id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
        templateId,
        slotIndex: index,
        name: tpl.name,
        level: tpl.level,
        hp: scaled.hp,
        max_hp: scaled.hp,
        atk: scaled.atk,
        def: scaled.def,
        dex: tpl.dex || 6,
        status: {},
        respawnAt: null,
        justRespawned: false
      };
      mobList.push(mob);
      return;
    }
    if (mob.hp <= 0 && mob.respawnAt && now >= mob.respawnAt) {
      mob.id = `${templateId}-${Date.now()}-${randInt(100, 999)}`;
      mob.templateId = templateId;
      mob.name = tpl.name;
      mob.level = tpl.level;
      mob.hp = scaled.hp;
      mob.max_hp = scaled.hp;
      mob.atk = scaled.atk;
      mob.def = scaled.def;
      mob.dex = tpl.dex || 6;
      mob.status = {};
      mob.respawnAt = null;
      mob.justRespawned = Boolean(tpl.worldBoss);
      RESPAWN_CACHE.delete(respawnKey(zoneId, roomId, index));
      if (respawnStore && respawnStore.clear) {
        respawnStore.clear(zoneId, roomId, index);
      }
    }
  });
  return mobList;
}

export function removeMob(zoneId, roomId, mobId) {
  const mobs = getRoomMobs(zoneId, roomId);
  const idx = mobs.findIndex((m) => m.id === mobId);
  if (idx >= 0) {
    const mob = mobs[idx];
    mob.hp = 0;
    mob.status = {};
    const tpl = MOB_TEMPLATES[mob.templateId];
    const isBoss = tpl && (
      tpl.worldBoss ||
      tpl.id.includes('boss') ||
      tpl.id.includes('leader') ||
      tpl.id.includes('demon') ||
      ['bug_queen', 'huangquan', 'evil_snake', 'pig_white'].includes(tpl.id)
    );
    const delayMs = tpl && tpl.worldBoss ? 60 * 60 * 1000 : (isBoss ? 60 * 1000 : 0);
    mob.respawnAt = Date.now() + delayMs;
    if (delayMs > 0) {
      RESPAWN_CACHE.set(respawnKey(zoneId, roomId, mob.slotIndex), {
        templateId: mob.templateId,
        respawnAt: mob.respawnAt
      });
      if (respawnStore && respawnStore.set) {
        respawnStore.set(zoneId, roomId, mob.slotIndex, mob.templateId, mob.respawnAt);
      }
    } else {
      RESPAWN_CACHE.delete(respawnKey(zoneId, roomId, mob.slotIndex));
      if (respawnStore && respawnStore.clear) {
        respawnStore.clear(zoneId, roomId, mob.slotIndex);
      }
    }
    return mob;
  }
  return null;
}

export function resetRoom(zoneId, roomId) {
  ROOM_MOBS.delete(roomKey(zoneId, roomId));
}
