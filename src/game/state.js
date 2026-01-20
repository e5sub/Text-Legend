import { WORLD } from './world.js';
import { MOB_TEMPLATES } from './mobs.js';
import { randInt } from './utils.js';

const ROOM_MOBS = new Map();

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
    if (!mob) {
      mob = {
        id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
        templateId,
        slotIndex: index,
        name: tpl.name,
        level: tpl.level,
        hp: tpl.hp,
        max_hp: tpl.hp,
        atk: tpl.atk,
        def: tpl.def,
        dex: tpl.dex || 6,
        status: {},
        respawnAt: null
      };
      mobList.push(mob);
      return;
    }
    if (mob.hp <= 0 && mob.respawnAt && now >= mob.respawnAt) {
      mob.id = `${templateId}-${Date.now()}-${randInt(100, 999)}`;
      mob.templateId = templateId;
      mob.name = tpl.name;
      mob.level = tpl.level;
      mob.hp = tpl.hp;
      mob.max_hp = tpl.hp;
      mob.atk = tpl.atk;
      mob.def = tpl.def;
      mob.dex = tpl.dex || 6;
      mob.status = {};
      mob.respawnAt = null;
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
      tpl.id.includes('boss') ||
      tpl.id.includes('leader') ||
      tpl.id.includes('demon') ||
      ['bug_queen', 'huangquan', 'evil_snake', 'pig_white'].includes(tpl.id)
    );
    const delayMs = isBoss ? 10 * 60 * 1000 : 0;
    mob.respawnAt = Date.now() + delayMs;
  }
}

export function resetRoom(zoneId, roomId) {
  ROOM_MOBS.delete(roomKey(zoneId, roomId));
}
