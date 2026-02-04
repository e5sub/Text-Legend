import { WORLD } from './world.js';
import { MOB_TEMPLATES } from './mobs.js';
import { randInt } from './utils.js';

const ROOM_MOBS = new Map();
const RESPAWN_CACHE = new Map();
let respawnStore = null;
const worldBossKillCounts = new Map();
const BOSS_SCALE = { hp: 1.25, atk: 1.42, def: 1.77 };
const MOB_HP_SCALE = 2;
const MOB_STAT_SCALE = 1.69;
const MOB_DEF_SCALE = 1.5;

function respawnKey(realmId, zoneId, roomId, slotIndex) {
  return `${realmId}:${zoneId}:${roomId}:${slotIndex}`;
}

function isBossTemplate(tpl) {
  if (!tpl) return false;
  return Boolean(
    tpl.worldBoss ||
    tpl.id.includes('boss') ||
    tpl.id.includes('leader') ||
    tpl.id.includes('demon') ||
    ['bug_queen', 'huangquan'].includes(tpl.id)
  );
}

function scaledStats(tpl, realmId = 1) {
  if (!tpl) return { hp: 0, atk: 0, def: 0, mdef: 0 };

  // 特殊BOSS：不进行任何属性缩放，直接使用GM设置的值（房间人数加成由外部函数处理）
  if (tpl.specialBoss) {
    return {
      hp: tpl.hp || 0,
      atk: tpl.atk || 0,
      def: tpl.def || 0,
      mdef: tpl.mdef || 0
    };
  }

  // 世界BOSS：只保留击杀成长机制（每击杀5次提升1%），不进行其他缩放（房间人数加成由外部函数处理）
  if (tpl.worldBoss) {
    const count = worldBossKillCounts.get(realmId) || 0;
    const growth = 1 + Math.floor(count / 5) * 0.01;
    return {
      hp: Math.floor((tpl.hp || 0) * growth),
      atk: Math.floor((tpl.atk || 0) * growth),
      def: Math.floor((tpl.def || 0) * growth),
      mdef: Math.floor((tpl.mdef || 0) * growth)
    };
  }

  // 普通怪物
  if (!isBossTemplate(tpl)) {
    const def = Math.floor(tpl.def * MOB_STAT_SCALE * MOB_DEF_SCALE);
    return {
      hp: Math.floor(tpl.hp * MOB_HP_SCALE * MOB_STAT_SCALE),
      atk: Math.floor(tpl.atk * MOB_STAT_SCALE),
      def,
      mdef: Math.floor(def * 0.5)
    };
  }

  // 其他BOSS（不包括worldBoss和specialBoss）
  let def = Math.floor(tpl.def * BOSS_SCALE.def * MOB_STAT_SCALE * MOB_DEF_SCALE);
  return {
    hp: Math.floor(tpl.hp * MOB_HP_SCALE * BOSS_SCALE.hp * MOB_STAT_SCALE),
    atk: Math.floor(tpl.atk * BOSS_SCALE.atk * MOB_STAT_SCALE),
    def,
    mdef: Math.floor(def * 0.5)
  };
}

function roomKey(realmId, zoneId, roomId) {
  return `${realmId}:${zoneId}:${roomId}`;
}

export function getRoom(zoneId, roomId) {
  const zone = WORLD[zoneId];
  if (!zone) return null;
  return zone.rooms[roomId] || null;
}

export function getRoomMobs(zoneId, roomId, realmId = 1) {
  const key = roomKey(realmId, zoneId, roomId);
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
    const realmId = Number(row.realm_id ?? row.realmId ?? 1) || 1;
    if (!zoneId || !roomId || Number.isNaN(slotIndex)) return;
    
    let status = {};
    if (row.status) {
      try {
        status = typeof row.status === 'string' ? JSON.parse(row.status) : row.status;
      } catch (e) {
        status = {};
      }
    }
    
    RESPAWN_CACHE.set(respawnKey(realmId, zoneId, roomId, slotIndex), {
      templateId: row.template_id || row.templateId,
      respawnAt: Number(row.respawn_at ?? row.respawnAt),
      currentHp: row.current_hp ?? row.currentHp ?? null,
      status
    });
  });
}

export function setRespawnStore(store) {
  respawnStore = store;
}

export function getAliveMobs(zoneId, roomId, realmId = 1) {
  return getRoomMobs(zoneId, roomId, realmId).filter((m) => m.hp > 0);
}

export function spawnMobs(zoneId, roomId, realmId = 1) {
  const room = getRoom(zoneId, roomId);
  if (!room || !room.spawns || room.spawns.length === 0) return [];
  const mobList = getRoomMobs(zoneId, roomId, realmId);
  let spawnList = room.spawns.slice();
  const bossIds = spawnList.filter((id) => isBossTemplate(MOB_TEMPLATES[id]));
  const normalIds = spawnList.filter((id) => !isBossTemplate(MOB_TEMPLATES[id]));
  const isNormalRoom = bossIds.length === 0;
  if (isNormalRoom) {
    if (spawnList.length < 5 && normalIds.length) {
      while (spawnList.length < 5) {
        spawnList.push(normalIds[randInt(0, normalIds.length - 1)]);
      }
    }
    if (spawnList.length > 5) {
      spawnList = spawnList.slice(0, 5);
    }
  } else if (spawnList.length < 5) {
    if (normalIds.length) {
      while (spawnList.length < 5) {
        spawnList.push(normalIds[randInt(0, normalIds.length - 1)]);
      }
    }
    if (bossIds.length && spawnList.length > 5) {
      spawnList = bossIds.concat(spawnList.filter((id) => !bossIds.includes(id)).slice(0, 5 - bossIds.length));
    }
  }
  const now = Date.now();
  spawnList.forEach((templateId, index) => {
    let mob = mobList.find((m) => m.slotIndex === index);
    const tpl = MOB_TEMPLATES[templateId];
    const scaled = scaledStats(tpl, realmId);
    const cached = RESPAWN_CACHE.get(respawnKey(realmId, zoneId, roomId, index));
    if (!mob) {
      if (cached && cached.respawnAt > now) {
        // 检查缓存的怪物类型是否匹配当前配置
        if (!cached.templateId || cached.templateId === templateId) {
          mob = {
            id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
            templateId,
            slotIndex: index,
            zoneId,
            roomId,
            name: tpl.name,
            level: tpl.level,
            hp: 0,
            max_hp: scaled.hp,
            atk: scaled.atk,
            def: scaled.def,
            mdef: scaled.mdef,
            dex: tpl.dex || 6,
            status: { baseStats: { atk: scaled.atk, def: scaled.def, mdef: scaled.mdef, max_hp: scaled.hp } },
            respawnAt: cached.respawnAt,
            justRespawned: false
          };
          mobList.push(mob);
          return;
        }
        // 缓存的怪物类型不匹配，清理旧缓存，直接创建新怪物
        RESPAWN_CACHE.delete(respawnKey(realmId, zoneId, roomId, index));
        if (respawnStore && respawnStore.clear) {
          respawnStore.clear(realmId, zoneId, roomId, index);
        }
      } else if (cached && cached.respawnAt <= now && cached.currentHp !== null && cached.currentHp !== undefined) {
        // 缓存已过期但有血量数据：恢复怪物血量（重启服务器加载）
        mob = {
          id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
          templateId,
          slotIndex: index,
          zoneId,
          roomId,
          name: tpl.name,
          level: tpl.level,
          hp: Math.max(1, Math.min(cached.currentHp, scaled.hp)),
          max_hp: scaled.hp,
          atk: scaled.atk,
          def: scaled.def,
          mdef: scaled.mdef,
          dex: tpl.dex || 6,
          status: cached.status || {},
          respawnAt: null,
          justRespawned: false
        };
        if (!mob.status.baseStats) {
          mob.status.baseStats = { atk: scaled.atk, def: scaled.def, mdef: scaled.mdef, max_hp: scaled.hp };
        }
        mobList.push(mob);
        return;
      } else if (cached && cached.respawnAt <= now) {
        // 缓存已过期，清理缓存记录
        RESPAWN_CACHE.delete(respawnKey(realmId, zoneId, roomId, index));
        if (respawnStore && respawnStore.clear) {
          respawnStore.clear(realmId, zoneId, roomId, index);
        }
      }
      mob = {
        id: `${templateId}-${Date.now()}-${randInt(100, 999)}`,
        templateId,
        slotIndex: index,
        zoneId,
        roomId,
        name: tpl.name,
        level: tpl.level,
        hp: scaled.hp,
        max_hp: scaled.hp,
        atk: scaled.atk,
        def: scaled.def,
        mdef: scaled.mdef,
        dex: tpl.dex || 6,
        status: { baseStats: { atk: scaled.atk, def: scaled.def, mdef: scaled.mdef, max_hp: scaled.hp } },
        respawnAt: null,
        justRespawned: Boolean(tpl.worldBoss || tpl.sabakBoss || tpl.respawnMs)
      };
      mobList.push(mob);
      return;
    }
    if (cached && cached.respawnAt > now && mob.hp > 0) {
      if (!cached.templateId || cached.templateId === templateId) {
        mob.id = `${templateId}-${Date.now()}-${randInt(100, 999)}`;
        mob.templateId = templateId;
        mob.zoneId = zoneId;
        mob.roomId = roomId;
        mob.name = tpl.name;
        mob.level = tpl.level;
        mob.hp = 0;
        mob.max_hp = scaled.hp;
        mob.atk = scaled.atk;
        mob.def = scaled.def;
        mob.mdef = scaled.mdef;
        mob.dex = tpl.dex || 6;
        mob.status = { baseStats: { atk: scaled.atk, def: scaled.def, mdef: scaled.mdef, max_hp: scaled.hp } };
        mob.respawnAt = cached.respawnAt;
        mob.justRespawned = false;
        return;
      }
      RESPAWN_CACHE.delete(respawnKey(realmId, zoneId, roomId, index));
      if (respawnStore && respawnStore.clear) {
        respawnStore.clear(realmId, zoneId, roomId, index);
      }
    }
    if (!mob.zoneId) mob.zoneId = zoneId;
    if (!mob.roomId) mob.roomId = roomId;
    if (mob.hp <= 0 && mob.respawnAt && now >= mob.respawnAt) {
      mob.id = `${templateId}-${Date.now()}-${randInt(100, 999)}`;
      mob.templateId = templateId;
      mob.zoneId = zoneId;
      mob.roomId = roomId;
      mob.name = tpl.name;
      mob.level = tpl.level;
      mob.hp = scaled.hp;
      mob.max_hp = scaled.hp;
      mob.atk = scaled.atk;
      mob.def = scaled.def;
      mob.mdef = scaled.mdef;
      mob.dex = tpl.dex || 6;
      mob.status = { baseStats: { atk: scaled.atk, def: scaled.def, mdef: scaled.mdef, max_hp: scaled.hp } };
      mob.respawnAt = null;
      mob.justRespawned = Boolean(tpl.worldBoss || tpl.sabakBoss || tpl.respawnMs);
      RESPAWN_CACHE.delete(respawnKey(realmId, zoneId, roomId, index));
      if (respawnStore && respawnStore.clear) {
        respawnStore.clear(realmId, zoneId, roomId, index);
      }
    }
  });
  return mobList;
}

export function incrementWorldBossKills(amount = 1, realmId = 1) {
  const delta = Number(amount) || 0;
  const current = worldBossKillCounts.get(realmId) || 0;
  const next = Math.max(0, current + delta);
  worldBossKillCounts.set(realmId, next);
  return next;
}

export function setWorldBossKillCount(count, realmId = 1) {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  worldBossKillCounts.set(realmId, next);
  return next;
}

export function removeMob(zoneId, roomId, mobId, realmId = 1) {
  const mobs = getRoomMobs(zoneId, roomId, realmId);
  const idx = mobs.findIndex((m) => m.id === mobId);
  if (idx >= 0) {
    const mob = mobs[idx];
    const tpl = MOB_TEMPLATES[mob.templateId];
    if (mob.summoned || mob.status?.summoned || tpl?.summoned) {
      mobs.splice(idx, 1);
      return mob;
    }
    mob.hp = 0;
    mob.status = {};
    const isSpecial = Boolean(tpl && (tpl.worldBoss || tpl.sabakBoss || tpl.specialBoss));
    const delayMs = tpl && tpl.respawnMs
      ? tpl.respawnMs
      : (isSpecial ? 60 * 60 * 1000 : 1 * 1000);
    mob.respawnAt = Date.now() + delayMs;
    if (delayMs > 0) {
      RESPAWN_CACHE.set(respawnKey(realmId, zoneId, roomId, mob.slotIndex), {
        templateId: mob.templateId,
        respawnAt: mob.respawnAt
      });
      if (respawnStore && respawnStore.set) {
        respawnStore.set(realmId, zoneId, roomId, mob.slotIndex, mob.templateId, mob.respawnAt);
      }
    } else {
      RESPAWN_CACHE.delete(respawnKey(realmId, zoneId, roomId, mob.slotIndex));
      if (respawnStore && respawnStore.clear) {
        respawnStore.clear(realmId, zoneId, roomId, mob.slotIndex);
      }
    }
    return mob;
  }
  return null;
}

export function resetRoom(zoneId, roomId, realmId = 1) {
  ROOM_MOBS.delete(roomKey(realmId, zoneId, roomId));
}

export function getAllAliveMobs(realmId = 1) {
  const aliveMobs = [];
  for (const [key, mobs] of ROOM_MOBS.entries()) {
    const [realmKey, zoneId, roomId] = key.split(':');
    const keyRealmId = Number(realmKey || 1) || 1;
    if (keyRealmId !== realmId) continue;
    for (const mob of mobs) {
      const tpl = MOB_TEMPLATES[mob.templateId];
      if (mob.summoned || mob.status?.summoned || tpl?.summoned) continue;
      if (mob.hp > 0 && mob.hp < mob.max_hp) {
        aliveMobs.push({
          realmId: keyRealmId,
          zoneId,
          roomId,
          slotIndex: mob.slotIndex,
          templateId: mob.templateId,
          currentHp: mob.hp,
          status: mob.status || {}
        });
      }
    }
  }
  return aliveMobs;
}

