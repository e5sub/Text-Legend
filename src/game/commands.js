import knex from '../db/index.js';
import { WORLD, NPCS } from './world.js';
import { ITEM_TEMPLATES, SHOP_STOCKS } from './items.js';
import { MOB_TEMPLATES } from './mobs.js';
import {
  BOOK_SKILLS,
  getSkill,
  getLearnedSkills,
  getSkillLevel,
  gainSkillMastery,
  scaledSkillPower,
  hasSkill,
  ensurePlayerSkills
} from './skills.js';
import { addItem, removeItem, equipItem, unequipItem, bagLimit, gainExp, computeDerived, getDurabilityMax, getRepairCost, getItemKey, sameEffects } from './player.js';
import { CLASSES, expForLevel, getStartPosition, ROOM_VARIANT_COUNT } from './constants.js';
import { getRoom, getAliveMobs, spawnMobs } from './state.js';
import { clamp, randInt } from './utils.js';
import { applyDamage } from './combat.js';
import {
  getTrainingPerLevelConfig,
  getTrainingFruitCoefficient,
  getRefineBaseSuccessRate,
  getRefineDecayRate,
  getRefineMaterialCount,
  getEffectResetSuccessRate,
  getEffectResetDoubleRate,
  getEffectResetTripleRate,
  getEffectResetQuadrupleRate,
  getEffectResetQuintupleRate
} from './settings.js';
import { getRealmById } from '../db/realms.js';

// 特效重置：生成随机特效（不包含elementAtk，因为元素攻击只能通过装备合成获得）
const ALLOWED_EFFECTS = ['combo', 'fury', 'unbreakable', 'defense', 'dodge', 'poison', 'healblock'];

function generateRandomEffects(count) {
  const effects = {};
  const available = [...ALLOWED_EFFECTS];
  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    const effectName = available[randomIndex];
    effects[effectName] = true;
    available.splice(randomIndex, 1);
  }
  return Object.keys(effects).length > 0 ? effects : null;
}

function getSummons(player) {
  if (!player) return [];
  const list = [];
  if (Array.isArray(player.summons)) {
    list.push(...player.summons.filter(Boolean));
  }
  if (player.summon) {
    list.push(player.summon);
  }
  if (!list.length) return [];
  const seen = new Set();
  return list.filter((summon) => {
    if (!summon || seen.has(summon.id)) return false;
    seen.add(summon.id);
    return true;
  });
}

function setSummons(player, summons) {
  if (!player) return;
  const next = Array.isArray(summons) ? summons.filter(Boolean) : [];
  player.summons = next;
  player.summon = next[0] || null;
}

function getAliveSummons(player) {
  return getSummons(player).filter((summon) => summon.hp > 0);
}

function addOrReplaceSummon(player, summon) {
  if (!player || !summon) return;
  const summons = getSummons(player).filter((entry) => entry.id !== summon.id);
  summons.unshift(summon);
  setSummons(player, summons);
}

function hasAliveSummon(player, summonId) {
  return getAliveSummons(player).some((entry) => entry.id === summonId);
}

// 负载均衡：选择玩家最少的房间
// 当目标房间有多个变体时（如 plains, plains1, plains2, plains3），自动分配到人最少的那个
function selectLeastPopulatedRoom(zoneId, roomId, onlinePlayers, currentPlayer = null, partyApi = null) {
  const baseRoomId = roomId.replace(/\d+$/, '');
  const roomOptions = [];

  // 获取当前玩家的队伍成员
  let partyMembers = new Set();
  if (currentPlayer && partyApi) {
    const party = partyApi.getPartyByMember(currentPlayer.name);
    if (party) {
      party.members.forEach(member => partyMembers.add(member));
    }
  }

  // 检查基础房间是否存在
  if (WORLD[zoneId]?.rooms?.[baseRoomId]) {
    const playerCount = onlinePlayers.filter(
      p => p.position.zone === zoneId && p.position.room === baseRoomId
    ).length;
    // 计算队伍成员数量
    const partyCount = onlinePlayers.filter(
      p => p.position.zone === zoneId && p.position.room === baseRoomId && partyMembers.has(p.name)
    ).length;
    roomOptions.push({ roomId: baseRoomId, playerCount, partyCount });
  }

  // 查找所有带数字后缀的房间变体（1, 2, 3）
  for (let i = 1; i <= ROOM_VARIANT_COUNT; i++) {
    const candidateRoomId = `${baseRoomId}${i}`;
    if (WORLD[zoneId]?.rooms?.[candidateRoomId]) {
      const playerCount = onlinePlayers.filter(
        p => p.position.zone === zoneId && p.position.room === candidateRoomId
      ).length;
      // 计算队伍成员数量
      const partyCount = onlinePlayers.filter(
        p => p.position.zone === zoneId && p.position.room === candidateRoomId && partyMembers.has(p.name)
      ).length;
      roomOptions.push({ roomId: candidateRoomId, playerCount, partyCount });
    }
  }

  if (roomOptions.length === 0) {
    return roomId;
  }

  // 优先选择有队伍成员的房间
  roomOptions.sort((a, b) => {
    // 先按队伍成员数量降序排序（有队伍成员的优先）
    if (a.partyCount > 0 || b.partyCount > 0) {
      return b.partyCount - a.partyCount;
    }
    // 如果都没有队伍成员，按玩家数量升序排序
    return a.playerCount - b.playerCount;
  });
  return roomOptions[0].roomId;
}
import {
  validateNumber,
  validateItemId,
  validateItemQty,
  validateGold,
  validateEffects,
  validatePlayerHasItem,
  validatePlayerHasGold
} from './validator.js';

const PARTY_LIMIT = 5;
const DIR_LABELS = {
  north: '北',
  south: '南',
  east: '东',
  west: '西',
  northeast: '东北',
  northwest: '西北',
  southeast: '东南',
  southwest: '西南',
  up: '上',
  down: '下',
  north1: '北1',
  south1: '南1',
  east1: '东1',
  west1: '西1',
  northeast1: '东北1',
  northwest1: '西北1',
  north2: '北2',
  south2: '南2',
  east2: '东2',
  west2: '西2',
  northeast2: '东北2',
  northwest2: '西北2',
  north3: '北3',
  south3: '南3',
  east3: '东3',
  west3: '西3',
  northeast3: '东北3',
  northwest3: '西北3'
};
const DIR_ALIASES = {
  北: 'north',
  南: 'south',
  东: 'east',
  西: 'west',
  东北: 'northeast',
  西北: 'northwest',
  东南: 'southeast',
  西南: 'southwest',
  上: 'up',
  下: 'down',
  北1: 'north1',
  南1: 'south1',
  东1: 'east1',
  西1: 'west1',
  东北1: 'northeast1',
  西北1: 'northwest1',
  北2: 'north2',
  南2: 'south2',
  东2: 'east2',
  西2: 'west2',
  东北2: 'northeast2',
  西北2: 'northwest2',
  北3: 'north3',
  南3: 'south3',
  东3: 'east3',
  西3: 'west3',
  东北3: 'northeast3',
  西北3: 'northwest3'
};
const TRAINING_OPTIONS = {
  hp: { label: '生命', inc: 1, perLevel: 0.1 },
  mp: { label: '魔法值', inc: 1, perLevel: 0.1 },
  atk: { label: '攻击', inc: 1, perLevel: 0.01 },
  def: { label: '防御', inc: 1, perLevel: 0.01 },
  mag: { label: '魔法', inc: 1, perLevel: 0.01 },
  mdef: { label: '魔御', inc: 1, perLevel: 0.01 },
  spirit: { label: '道术', inc: 1, perLevel: 0.01 },
  dex: { label: '敏捷', inc: 1, perLevel: 0.01 }
};
const TRAINING_ALIASES = {
  hp: 'hp',
  生命: 'hp',
  mp: 'mp',
  魔法值: 'mp',
  魔法: 'mag',
  防御: 'def',
  def: 'def',
  攻击: 'atk',
  atk: 'atk',
  mag: 'mag',
  法术: 'mag',
  魔御: 'mdef',
  mdef: 'mdef',
  道术: 'spirit',
  spirit: 'spirit',
  dex: 'dex',
  敏捷: 'dex'
};

function dirLabel(dir) {
  return DIR_LABELS[dir] || dir;
}

function normalizeDirection(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  return DIR_ALIASES[trimmed] || trimmed.toLowerCase();
}

function roomLabel(player) {
  const zone = WORLD[player.position.zone];
  const room = zone.rooms[player.position.room];
  return `${zone.name} - ${room.name}`;
}

function listMobs(zoneId, roomId, realmId) {
      spawnMobs(zoneId, roomId, realmId || 1);
      const mobs = getAliveMobs(zoneId, roomId, realmId || 1);
  if (mobs.length === 0) return '这里没有怪物。';
  return mobs.map((m) => `${m.name} (生命 ${m.hp}/${m.max_hp})`).join(', ');
}

function listPlayers(players, player) {
  const here = players.filter(
    (p) => p.name !== player.name && p.position.zone === player.position.zone && p.position.room === player.position.room
  );
  if (here.length === 0) return '附近没有其他玩家。';
  return `附近玩家: ${here.map((p) => p.name).join(', ')}`;
}

function shopForRoom(roomId) {
  if (roomId === 'market') return 'bq_shop';
  if (roomId === 'blacksmith') return 'bq_blacksmith';
  if (roomId === 'temple') return 'bq_tao';
  if (roomId === 'magehall') return 'bq_mage';
  if (roomId === 'mg_market') return 'mg_shop';
  if (roomId === 'mg_blacksmith') return 'mg_blacksmith';
  if (roomId === 'mg_magic') return 'mg_magic';
  if (roomId === 'mg_tao') return 'mg_tao';
  return null;
}

function isWorldBossRoom(zoneId, roomId) {
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (!room || !room.spawns) return false;
  return room.spawns.some((mobId) => MOB_TEMPLATES[mobId]?.worldBoss);
}

function isSabakBossRoom(zoneId, roomId) {
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (!room || !room.spawns) return false;
  return room.spawns.some((mobId) => MOB_TEMPLATES[mobId]?.sabakBoss);
}

function isMolongBossRoom(zoneId, roomId) {
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (!room || !room.spawns) return false;
  return room.spawns.some((mobId) => MOB_TEMPLATES[mobId]?.id === 'molong_boss');
}

function isBossRoom(zoneId, roomId) {
  const zone = WORLD[zoneId];
  const room = zone?.rooms?.[roomId];
  if (!room || !room.spawns) return false;
  return room.spawns.some((mobId) => {
    const tpl = MOB_TEMPLATES[mobId];
    if (!tpl) return false;
    return tpl.worldBoss || tpl.sabakBoss || tpl.id.includes('boss') ||
           tpl.id.includes('leader') || tpl.id === 'chiyue_demon' ||
           tpl.id === 'tree_demon' || tpl.id === 'fmg_demon' ||
           tpl.id === 'huangquan' || tpl.id === 'nm_boss' ||
           tpl.id === 'chiyue_guard' || tpl.id === 'chiyue_blood' ||
           tpl.id === 'bug_queen' || tpl.id === 'evil_snake' ||
           tpl.id === 'pig_white';
  });
}

function formatInventory(player) {
  if (player.inventory.length === 0) return '背包为空。';
  return player.inventory
    .map((i) => {
      const item = ITEM_TEMPLATES[i.id];
      const isEquipment = item && item.slot;
      const durStr = (isEquipment && i.durability != null && i.max_durability != null)
        ? ` [${i.durability}/${i.max_durability}]`
        : '';
      return `${item.name} x${i.qty}${durStr}`;
    })
    .join(', ');
}

function formatEquipment(player) {
  const labels = {
    weapon: '武器',
    chest: '衣服',
    head: '头盔',
    waist: '腰带',
    feet: '靴子',
    ring_left: '戒指(左)',
    ring_right: '戒指(右)',
    bracelet_left: '手镯(左)',
    bracelet_right: '手镯(右)',
    neck: '项链'
  };
  const entries = Object.entries(player.equipment);
  return entries
    .map(([slot, item]) => `${labels[slot] || slot}: ${item ? ITEM_TEMPLATES[item.id].name : '空'}`)
    .join(', ');
}

function isRedName(player) {
  return (player.flags?.pkValue || 0) >= 100;
}

function isSabakZone(zoneId) {
  return typeof zoneId === 'string' && zoneId.startsWith('sb_');
}

function formatStats(player, partyApi) {
  const className = CLASSES[player.classId]?.name || player.classId;
  let partyInfo = '无';
  if (partyApi && partyApi.getPartyByMember) {
    const party = partyApi.getPartyByMember(player.name);
    if (party) partyInfo = `${party.members.length} 人队伍`;
  }
  const pkValue = player.flags?.pkValue || 0;
  const vip = player.flags?.vip ? '是' : '否';
  return [
    `职业: ${className}`,
    `等级: ${player.level} (${player.exp}/${expForLevel(player.level)} EXP)`,
    `生命: ${Math.floor(player.hp)}/${Math.floor(player.max_hp)}`,
    `魔法: ${Math.floor(player.mp)}/${Math.floor(player.max_mp)}`,
    `攻击: ${Math.floor(player.atk)} 防御: ${Math.floor(player.def)} 魔法: ${Math.floor(player.mag)}`,
    `金币: ${player.gold}`,
    `PK值: ${pkValue} (${isRedName(player) ? '红名' : '正常'})`,
    `VIP: ${vip}`,
    `行会: ${player.guild ? player.guild.name : '无'}`,
    `队伍: ${partyInfo}`,
    `装备: ${formatEquipment(player)}`
  ].join('\n');
}

function sendRoomDescription(player, send) {
  const zone = WORLD[player.position.zone];
  if (!zone) {
    send('你所在的区域不存在。');
    return;
  }
  const room = zone.rooms[player.position.room];
  if (!room) {
    send('你所在的房间不存在。');
    return;
  }
  const allExits = Object.entries(room.exits)
    .map(([dir, dest]) => {
      let zoneId = player.position.zone;
      let roomId = dest;
      if (dest.includes(':')) {
        [zoneId, roomId] = dest.split(':');
      }
      const destZone = WORLD[zoneId];
      const destRoom = destZone?.rooms[roomId];
      const name = destRoom
        ? (zoneId === player.position.zone ? destRoom.name : `${destZone.name} - ${destRoom.name}`)
        : dest;
      return { dir, name };
    });

  // 合并带数字后缀的方向，只显示一个入口
  const filteredExits = [];
  allExits.forEach(exit => {
    const dir = exit.dir;
    const baseDir = dir.replace(/[0-9]+$/, '');

    // 检查是否有数字后缀的变体
    const hasVariants = allExits.some(e =>
      e.dir !== dir && e.dir.startsWith(baseDir) && /[0-9]+$/.test(e.dir)
    );

    if (hasVariants) {
      // 只添加基础方向，不添加数字后缀的
      if (!/[0-9]+$/.test(dir) && !filteredExits.some(e => e.name === exit.name.replace(/[0-9]+$/, ''))) {
        filteredExits.push({ name: exit.name.replace(/[0-9]+$/, '') });
      }
    } else {
      // 没有变体，正常添加
      filteredExits.push({ name: exit.name });
    }
  });

  const exits = filteredExits.map(e => e.name).join(', ');
  send(`当前位置: ${roomLabel(player)}`);
  send(room.desc);
  send(`出口: ${exits || '无'}`);
  if (room.npcs && room.npcs.length) {
    send(`NPC: ${room.npcs.map((id) => NPCS[id].name).join(', ')}`);
  }
  send(`怪物: ${listMobs(player.position.zone, player.position.room, player.realmId)}`);
}

function canShop(player) {
  return Boolean(shopForRoom(player.position.room));
}

function isSabakOwnerMember(player, guildApi) {
  return Boolean(
    player.guild && guildApi?.sabakState?.ownerGuildId && String(player.guild.id) === String(guildApi.sabakState.ownerGuildId)
  );
}

function resolveInventoryItem(player, raw) {
  if (!raw || !player || !player.inventory) return { slot: null, item: null, keyMatch: false };
  const trimmed = raw.trim();
  const byKey = player.inventory.find((slot) => getItemKey(slot) === trimmed);
  if (byKey) {
    return { slot: byKey, item: ITEM_TEMPLATES[byKey.id], keyMatch: true };
  }
  const byId = player.inventory.find((slot) => slot.id === trimmed);
  if (byId) {
    return { slot: byId, item: ITEM_TEMPLATES[byId.id], keyMatch: false };
  }
  const lower = trimmed.toLowerCase();
  const byName = player.inventory.find((slot) => {
    const tmpl = ITEM_TEMPLATES[slot.id];
    return tmpl && tmpl.name.toLowerCase() === lower;
  });
  if (byName) {
    return { slot: byName, item: ITEM_TEMPLATES[byName.id], keyMatch: false };
  }
  return { slot: null, item: null, keyMatch: false };
}

function getShopStock(player) {
  const shopId = shopForRoom(player.position.room);
  if (!shopId) return [];
  return SHOP_STOCKS[shopId]
    .map((id) => ITEM_TEMPLATES[id])
    .filter((item) => {
      if (!item) return false;
      if (['weapon', 'armor', 'accessory'].includes(item.type)) {
        return rarityByPrice(item) === 'common';
      }
      return true;
    });
}

function rarityByPrice(item) {
  if (item.rarity) return item.rarity;
  const price = Number(item.price || 0);
  if (price >= 80000) return 'legendary';
  if (price >= 30000) return 'epic';
  if (price >= 10000) return 'rare';
  if (price >= 2000) return 'uncommon';
  return 'common';
}

function isEquipmentItem(item) {
  return Boolean(item && ['weapon', 'armor', 'accessory'].includes(item.type));
}

function hasSpecialEffects(effects) {
  return effects && Object.keys(effects).length > 0;
}

function isBelowEpic(rarity) {
  return ['common', 'uncommon', 'rare'].includes(rarity);
}

function skillByName(player, name) {
  if (!name) return null;
  const list = getLearnedSkills(player);
  const target = name.toLowerCase();
  return list.find((s) => s.id === target || s.name.toLowerCase() === target);
}

function trainingCost(player, key) {
  const training = player.flags?.training || {};
  const currentLevel = Number(training[key] || 0);
  const base = 10000;
  return Math.max(1, Math.floor(base + currentLevel * (base * 0.2)));
}

function getHealMultiplier(target) {
  const debuff = target.status?.debuffs?.healBlock;
  if (!debuff) return 1;
  if (debuff.expiresAt && debuff.expiresAt < Date.now()) {
    delete target.status.debuffs.healBlock;
    return 1;
  }
  return debuff.healMultiplier || 1;
}

function getSpiritValue(target) {
  if (!target) return 0;
  const base = Number(target.spirit ?? target.atk ?? 0) || 0;
  const buff = target.status?.buffs?.spiritBoost;
  if (!buff) return base;
  const now = Date.now();
  if (buff.expiresAt && buff.expiresAt < now) {
    if (target.status?.buffs) delete target.status.buffs.spiritBoost;
    return base;
  }
  return Math.floor(base * (buff.multiplier || 1));
}

export function summonStats(player, skill, summonLevelOverride = null) {
  const base = skill.summon;
  const skillLevel = getSkillLevel(player, skill.id);
  const desiredLevel = summonLevelOverride ?? skillLevel ?? 1;
  const summonLevel = Math.max(1, Math.min(8, Math.floor(desiredLevel)));
  const level = summonLevel;
  let max_hp;
  let atk;
  let def;
  let mdef;
    const summonFactor = 0.1 + ((level - 1) * (0.9 / 7));
    if (skill.id === 'skeleton' || skill.id === 'summon' || skill.id === 'white_tiger') {
      const maxRatio = skill.id === 'white_tiger' ? 2.0 : (skill.id === 'summon' ? 1.0 : 0.6);
      const factor = summonFactor * maxRatio;
      max_hp = Math.floor((player.max_hp || 0) * factor);
      atk = Math.floor((player.spirit || 0) * factor);
      def = Math.floor((player.def || 0) * factor);
      mdef = Math.floor((player.mdef || 0) * factor);
    } else {
      const factor = summonFactor * 0.6;
      max_hp = Math.floor(base.baseHp * factor);
      atk = Math.floor((player.spirit || 0) * factor);
      def = Math.floor(base.baseDef * factor);
      mdef = 0;
    }
  const dex = 8 + skillLevel;
  return {
    id: skill.id,
    name: base.name,
    level,
    summonLevel,
    skillLevel,
    hp: max_hp,
    max_hp,
    atk,
    def,
    mdef,
    dex
  };
}

function applyBuff(target, buff) {
  if (!target.status) target.status = {};
  if (!target.status.buffs) target.status.buffs = {};
  target.status.buffs[buff.key] = buff;
}

function recordMobDamage(mob, attackerName, dmg) {
  if (!mob) return;
  if (!mob.status) mob.status = {};
  if (!mob.status.damageBy) mob.status.damageBy = {};
  if (!mob.status.firstHitBy) mob.status.firstHitBy = attackerName;
  if (!attackerName) return;
  mob.status.damageBy[attackerName] = (mob.status.damageBy[attackerName] || 0) + dmg;
  const damageBy = mob.status.damageBy;
  let maxName = attackerName;
  let maxDamage = -1;
  Object.entries(damageBy).forEach(([name, total]) => {
    if (total > maxDamage) {
      maxDamage = total;
      maxName = name;
    }
  });
  mob.status.aggroTarget = maxName;
}

function notifyMastery(player, skill) {
  const levelUp = gainSkillMastery(player, skill.id, 1);
  if (levelUp) {
    const level = getSkillLevel(player, skill.id);
    player.send(`技能熟练度提升: ${skill.name} Lv${level}`);
  }
}

function partyStatus(party) {
  if (!party) return '你不在队伍中。';
  return `队伍成员: ${party.members.join(', ')}`;
}

export async function handleCommand({ player, players, allCharacters, playersByName, input, source, send, partyApi, guildApi, tradeApi, mailApi, consignApi, onMove, logLoot, realmId, emitAnnouncement }) {
  const [cmdRaw, ...rest] = input.trim().split(' ');
  const cmd = (cmdRaw || '').toLowerCase();
  const args = rest.join(' ').trim();

  if (!cmd) return;
  if (source !== 'ui' && cmd !== 'say') return;

  switch (cmd) {
    case 'help': {
      return;
    }
    case 'look': {
      sendRoomDescription(player, send);
      send(listPlayers(players, player));
      return;
    }
    case 'go':
    case 'move': {
      const fromRoom = { zone: player.position.zone, room: player.position.room };
      const room = getRoom(player.position.zone, player.position.room);
      if (!room) {
        send('你所在的房间不存在。');
        return;
      }
      let dir = normalizeDirection(args);
      if (!dir || !room.exits[dir]) {
        const targetName = (args || '').trim();
        if (targetName) {
          const entry = Object.entries(room.exits).find(([exitDir, dest]) => {
            let zoneId = player.position.zone;
            let roomId = dest;
            if (dest.includes(':')) {
              [zoneId, roomId] = dest.split(':');
            }
            const destZone = WORLD[zoneId];
            const destRoom = destZone?.rooms[roomId];
            if (!destRoom) return false;
            const fullName = `${destZone.name} - ${destRoom.name}`;
            return targetName === destRoom.name || targetName === fullName;
          });
          if (entry) dir = entry[0];
        }
      }
      if (!dir || !room.exits[dir]) {
        send('方向无效。');
        return;
      }
      const dest = room.exits[dir];
      if (dest.includes(':')) {
        let [zoneId, roomId] = dest.split(':');

        // 检查目标房间是否为指定了数字后缀的房间（如 plains1, plains2, plains3）
        // 如果已经指定了数字后缀，则直接使用该房间，不进行负载均衡
        const hasNumberSuffix = /\d$/.test(roomId);
        if (!hasNumberSuffix) {
          // 如果目标房间是基础房间（如 plains），检查是否有数字后缀的变体
          // 如果有，则根据队伍优先和负载均衡选择合适的房间
          const baseRoomId = roomId.replace(/\d+$/, '');
          const hasRoomVariants = (() => {
            for (let i = 1; i <= ROOM_VARIANT_COUNT; i++) {
              if (WORLD[zoneId]?.rooms?.[`${baseRoomId}${i}`]) {
                return true;
              }
            }
            return false;
          })();

          if (hasRoomVariants) {
            roomId = selectLeastPopulatedRoom(zoneId, roomId, players, player, partyApi);
          }
        }

        const targetRoom = WORLD[zoneId]?.rooms?.[roomId];
        if (targetRoom?.sabakOnly) {
          if (!player.guild || !guildApi?.sabakState?.ownerGuildId || String(player.guild.id) !== String(guildApi.sabakState.ownerGuildId)) {
            send('只有沙巴克城主行会成员可以进入该区域。');
            return;
          }
        }
        player.position.zone = zoneId;
        player.position.room = roomId;
      } else {
        let roomId = dest;
        const zoneId = player.position.zone;
        const hasNumberSuffix = /\d$/.test(roomId);
        if (!hasNumberSuffix) {
          const baseRoomId = roomId.replace(/\d+$/, '');
          const hasRoomVariants = (() => {
            for (let i = 1; i <= ROOM_VARIANT_COUNT; i++) {
              if (WORLD[zoneId]?.rooms?.[`${baseRoomId}${i}`]) {
                return true;
              }
            }
            return false;
          })();
          if (hasRoomVariants) {
            roomId = selectLeastPopulatedRoom(zoneId, roomId, players, player, partyApi);
          }
        }
        const targetRoom = WORLD[zoneId]?.rooms?.[roomId];
        if (targetRoom?.sabakOnly) {
          if (!player.guild || !guildApi?.sabakState?.ownerGuildId || String(player.guild.id) !== String(guildApi.sabakState.ownerGuildId)) {
            send('只有沙巴克城主行会成员可以进入该区域。');
            return;
          }
        }
        player.position.room = roomId;
      }
      const zone = WORLD[player.position.zone];
      const roomName = zone?.rooms[player.position.room]?.name;
      send(`你前往 ${roomName || dirLabel(dir)}。`);
      sendRoomDescription(player, send);
      if (onMove) {
        const toRoom = { zone: player.position.zone, room: player.position.room };
        onMove({ from: fromRoom, to: toRoom });
      }
      return;
    }
    case 'goto_room': {
      if (!args) return send('要前往哪个房间？');
      console.log('goto_room command received, args:', args);
      const fromRoom = { zone: player.position.zone, room: player.position.room };
      let zoneId = '';
      let roomId = '';
      if (args.includes(':')) {
        [zoneId, roomId] = args.split(':');
      } else {
        const parts = args.split(' ').filter(Boolean);
        zoneId = parts[0];
        roomId = parts[1];
      }
      console.log('Parsed zoneId:', zoneId, 'roomId:', roomId);
      if (!zoneId || !roomId || !WORLD[zoneId]) return send('目标地点无效。');

      // 检查房间是否存在，如果不存在则查找变种房间
      let targetRoomId = roomId;
      if (!WORLD[zoneId].rooms[roomId]) {
        // 检查是否是变种房间（带数字后缀）
        const match = roomId.match(/^(.*?)(\d+)$/);
        if (match) {
          const baseId = match[1];
          const suffix = match[2];
          // 检查基础房间是否存在
          if (WORLD[zoneId].rooms[baseId]) {
            targetRoomId = baseId;
          } else {
            return send('目标地点无效。');
          }
        } else {
          return send('目标地点无效。');
        }
      }

      if (isSabakBossRoom(zoneId, targetRoomId)) {
        // 检查是否是沙巴克行会成员
        const sabakOwner = guildApi.sabakState.ownerGuildId;
        const playerGuild = player.guild?.id;
        if (playerGuild !== sabakOwner) {
          return send('只有沙巴克行会成员才能前往沙巴克BOSS房间。');
        }
      }
      // 移除限制，允许跳转到任何有效的房间
      // 这样玩家发送位置信息后，其他玩家可以跳转到该房间

      // 如果是变种房间请求，尝试选择玩家最少的变种房间
      if (roomId !== targetRoomId) {
        // 获取所有变种房间
        const variantRooms = Object.keys(WORLD[zoneId].rooms).filter(r => r.startsWith(targetRoomId) && r !== targetRoomId);
        if (variantRooms.length > 0) {
          // 选择玩家最少的变种房间
          const roomPlayerCounts = variantRooms.map(r => ({
            roomId: r,
            count: players.filter(p => p.position.zone === zoneId && p.position.room === r).length
          }));
          roomPlayerCounts.sort((a, b) => a.count - b.count);
          targetRoomId = roomPlayerCounts[0].roomId;
        }
      }

      player.position.zone = zoneId;
      player.position.room = targetRoomId;
      player.forceStateRefresh = true;

      // 根据不同的房间类型发送不同的消息
      const room = WORLD[zoneId].rooms[targetRoomId];
      const bossName = room.spawns?.map(id => MOB_TEMPLATES[id]?.name).filter(Boolean).join('、') || 'BOSS';
      send(`你已前往 ${bossName} 的房间。`);
      sendRoomDescription(player, send);
      if (onMove) {
        const toRoom = { zone: player.position.zone, room: player.position.room };
        onMove({ from: fromRoom, to: toRoom });
      }
      return;
    }
    case 'goto': {
      if (!args) return send('要前往哪个玩家？');
      console.log('goto command received, args:', args);
      console.log('Players online:', players.map(p => p.name));
      const fromRoom = { zone: player.position.zone, room: player.position.room };
      const target = players.find((p) => p.name === args);
      console.log('Target player found:', target ? target.name : 'null');
      if (!target) return send('玩家不在线。');
      player.position.zone = target.position.zone;
      player.position.room = target.position.room;
      player.forceStateRefresh = true;
      send(`你前往 ${target.name} 的位置。`);
      sendRoomDescription(player, send);
      console.log('Player moved to:', player.position);
      if (onMove) {
        const toRoom = { zone: player.position.zone, room: player.position.room };
        onMove({ from: fromRoom, to: toRoom });
      }
      return;
    }
    case 'say': {
      if (!args) return;
      const message = `[${player.name}] ${args}`;
      const locationMatch = args.match(/^我在\s+(.+?)\s+-\s+(.+)$/);
      const payload = { text: message };
      if (locationMatch) {
        // 检查是否是已知的位置，发送位置ID信息
        const locationName = `${locationMatch[1]} - ${locationMatch[2]}`;
        const staticLocation = {
          '盟重省 - 盟重入口': { zoneId: 'mg_plains', roomId: 'gate' },
          '土城集市': { zoneId: 'mg_town', roomId: 'mg_market' },
          '沃玛寺庙 - 寺庙入口': { zoneId: 'wms', roomId: 'entrance' },
          '祖玛寺庙 - 祖玛大厅': { zoneId: 'zm', roomId: 'hall' },
          '赤月峡谷 - 赤月入口': { zoneId: 'cr', roomId: 'valley' },
          '世界BOSS领域 - 炎龙巢穴': { zoneId: 'wb', roomId: 'lair' },
          '魔龙城 - 魔龙深处': { zoneId: 'molong', roomId: 'deep' },
          '沙巴克宫殿 - 皇宫大门': { zoneId: 'sabak', roomId: 'palace' },
          '沙巴克宫殿 - 皇宫大厅': { zoneId: 'sabak', roomId: 'hall' },
          '沙巴克宫殿 - 皇宫内殿': { zoneId: 'sabak', roomId: 'throne' }
        }[locationName];
        if (staticLocation) {
          payload.location = {
            label: locationName,
            ...staticLocation
          };
        } else {
          // 尝试从当前玩家位置获取
          const zone = WORLD[player.position.zone];
          const room = zone?.rooms[player.position.room];
          if (zone && room) {
            payload.location = {
              label: locationName,
              zoneId: player.position.zone,
              roomId: player.position.room
            };
          }
        }
      }
      players.forEach((p) => {
        if (p.socket) {
          p.socket.emit('output', payload);
        }
      });
      return;
    }
    case 'who': {
      const list = players.map((p) => {
        const className = CLASSES[p.classId]?.name || p.classId;
        return `${p.name} (Lv ${p.level} ${className})`;
      });
      send(list.join(', ') || '当前无人在线。');
      return;
    }
    case 'stats': {
      send(formatStats(player, partyApi));
      return;
    }
    case 'observe':
    case 'inspect': {
      if (!args) return send('观察谁？');
      const targetName = args.trim();
      const target = players.find((p) => p.name === targetName);
      if (!target) return send('该玩家不在线或不存在。');
      
      // 构建玩家信息对象
      const className = CLASSES[target.classId]?.name || target.classId;
      const observeData = {
        name: target.name,
        level: target.level,
        class: className,
        hp: target.hp,
        maxHp: target.max_hp,
        mp: target.mp,
        maxMp: target.max_mp,
        atk: Math.floor(target.atk),
        def: Math.floor(target.def),
        matk: Math.floor(target.matk || target.mag || 0),
        mdef: Math.floor(target.mdef || 0),
        spirit: Math.floor(target.spirit || 0),
        evade: Math.round((target.evadeChance || 0) * 100),
        equipment: [],
        summons: []
      };
      
      // 装备信息
      if (target.equipment && Object.keys(target.equipment).length > 0) {
        const slots = ['weapon', 'chest', 'head', 'waist', 'feet', 'ring_left', 'ring_right', 'bracelet_left', 'bracelet_right', 'neck'];
        const slotNames = { 
          weapon: '武器', 
          chest: '护甲', 
          head: '头盔', 
          waist: '腰带',
          feet: '靴子',
          ring_left: '戒指(左)', 
          ring_right: '戒指(右)',
          bracelet_left: '手镯(左)',
          bracelet_right: '手镯(右)',
          neck: '项链'
        };
        slots.forEach((slot) => {
          const item = target.equipment[slot];
          if (item) {
            const template = ITEM_TEMPLATES[item.id];
            if (template) {
              observeData.equipment.push({
                slot: slotNames[slot] || slot,
                name: template.name,
                durability: item.durability,
                maxDurability: item.max_durability || getDurabilityMax(item.id)
              });
            }
          }
        });
      }
      
      // 召唤物信息
      const targetSummons = getAliveSummons(target);
      targetSummons.forEach((summon) => {
        observeData.summons.push({
          name: summon.name,
          level: summon.level,
          hp: summon.hp,
          maxHp: summon.max_hp
        });
      });
      
      // 通过socket发送observe事件给玩家
      if (player.socket) {
        player.socket.emit('observe_data', observeData);
      }
      return;
    }
    case 'bag': {
      send(`背包 (${player.inventory.length}/${bagLimit(player)}): ${formatInventory(player)}`);
      return;
    }
    case 'equip': {
      if (!args) return send('要装备哪件物品？');
      const resolved = resolveInventoryItem(player, args);
      if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
      const res = equipItem(player, resolved.slot.id, resolved.slot.effects || null);
      if (res.ok) player.forceStateRefresh = true;
      send(res.msg);
      return;
    }
    case 'unequip': {
      if (!args) return send('要卸下哪个部位？');
      const res = unequipItem(player, args);
      if (res.ok) player.forceStateRefresh = true;
      send(res.msg);
      return;
    }
    case 'use': {
      if (!args) return send('要使用什么？');
      const resolved = resolveInventoryItem(player, args);
      if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
      const item = resolved.item;
      if (item.type === 'book') {
        const mapping = BOOK_SKILLS[item.id];
        if (!mapping) return send('该技能书暂未开放。');
        if (mapping.classId !== player.classId) return send('你的职业无法学习该技能。');
        const skill = getSkill(mapping.classId, mapping.skillId);
        if (!skill) return send('该技能暂未开放。');
        ensurePlayerSkills(player);
        if (hasSkill(player, skill.id)) return send('你已学会该技能。');
        if (!removeItem(player, item.id, 1, resolved.slot.effects)) return send('背包里没有该物品。');
        player.skills.push(skill.id);
        player.forceStateRefresh = true;
        send(`学会技能: ${skill.name}。`);
        return;
      }
      // 修炼果：随机增加属性（支持批量使用）
      if (item.id === 'training_fruit') {
        // 解析数量参数，格式如 "修炼果 10" 或 "修炼果 5"
        // 如果没有指定数量，默认使用全部
        const parts = args.split(' ').filter(Boolean);
        let useCount = null;

        if (parts.length > 1) {
          const countStr = parts[parts.length - 1];
          const parsedCount = parseInt(countStr, 10);
          if (!isNaN(parsedCount) && parsedCount > 0) {
            useCount = parsedCount;
          }
        }

        // 检查背包中是否有足够数量
        const inventoryItem = player.inventory.find(i => i.id === item.id && sameEffects(i.effects, resolved.slot.effects));
        if (!inventoryItem || inventoryItem.qty === 0) {
          return send('背包里没有修炼果。');
        }

        // 如果没有指定数量，使用全部；否则使用指定数量
        if (useCount === null) {
          useCount = inventoryItem.qty;
        } else if (useCount > inventoryItem.qty) {
          return send(`背包里只有 ${inventoryItem.qty} 个修炼果。`);
        }

        const attrOptions = [
          { name: '攻击', attr: 'atk' },
          { name: '魔法', attr: 'mag' },
          { name: '道术', attr: 'spirit' },
          { name: '防御', attr: 'def' },
          { name: '魔御', attr: 'mdef' },
          { name: '敏捷', attr: 'dex' },
          { name: '生命上限', attr: 'hp' },
          { name: '魔法上限', attr: 'mp' }
        ];

        // 统计每个属性的提升次数，并累加到player.flags.trainingFruit
        const attrStats = {};
        if (!player.flags.trainingFruit) {
          player.flags.trainingFruit = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
        }

        for (let i = 0; i < useCount; i++) {
          const selected = attrOptions[Math.floor(Math.random() * attrOptions.length)];
          // 记录修炼果数量，不乘以系数（系数在computeDerived中统一应用）
          player.flags.trainingFruit[selected.attr] += 1;

          if (!attrStats[selected.name]) {
            attrStats[selected.name] = 0;
          }
          attrStats[selected.name] += 1;
        }

        // 扣除物品
        if (!removeItem(player, item.id, useCount, resolved.slot.effects)) {
          return send('背包里没有该物品。');
        }

        // 获取修炼果系数
        const coefficient = getTrainingFruitCoefficient();

        // 构建结果消息，显示加成后的属性值而不是次数
        const resultParts = Object.entries(attrStats)
          .map(([name, count]) => {
            const attrKey = attrOptions.find(opt => opt.name === name)?.attr;
            if (attrKey) {
              const bonus = count * coefficient;
              return `${name}+${bonus.toFixed(1)}`;
            }
            return `${name}+${count}`;
          });
        if (useCount === 1) {
          send(`使用了修炼果，${resultParts[0]}。`);
        } else {
          send(`使用了 ${useCount} 个修炼果，${resultParts.join('、')}。`);
        }
        computeDerived(player);
        player.forceStateRefresh = true;
        return;
      }
      if (!removeItem(player, item.id, 1, resolved.slot.effects)) return send('背包里没有该物品。');
      if (item.type !== 'consumable') {
        addItem(player, item.id, 1, resolved.slot.effects);
        return send('该物品无法使用。');
      }
      if (item.teleport && !item.hp && !item.mp) {
        // 如果回城到比奇城，改为随机传送到平原变体
        if (item.teleport.zone === 'bq_town' && item.teleport.room === 'gate') {
          player.position = { ...getStartPosition() };
        } else {
          player.position = { ...item.teleport };
        }
        player.forceStateRefresh = true;
        send(`使用了 ${item.name}。`);
        return;
      }
      if (!player.status) player.status = {};
      const now = Date.now();
      const instantIds = new Set(['sun_water', 'snow_frost']);
      const isInstant = instantIds.has(item.id);
      if (item.hp || item.mp) {
        const isHpPotion = Boolean(item.hp);
        const lockKey = isHpPotion ? 'hp' : 'mp';
        const potionLocks = player.status.potionLock || {};
        if (!isInstant && potionLocks[lockKey] && potionLocks[lockKey] > now) {
          addItem(player, item.id, 1);
          return send('药效持续中，暂时无法再次使用同类药品。');
        }
        if (isInstant) {
          if (item.hp) {
            const hpGain = Math.max(1, Math.floor(item.hp * getHealMultiplier(player)));
            player.hp = clamp(player.hp + hpGain, 1, player.max_hp);
          }
          if (item.mp) player.mp = clamp(player.mp + item.mp, 0, player.max_mp);
          player.forceStateRefresh = true;
          send(`使用了 ${item.name}。`);
          return;
        }
        const ticks = 5;
        player.status.regen = {
          ticksRemaining: ticks,
          hpRemaining: item.hp || 0,
          mpRemaining: item.mp || 0
        };
        if (!player.status.potionLock) player.status.potionLock = {};
        player.status.potionLock[lockKey] = now + ticks * 1000;
        player.forceStateRefresh = true;
        send(`使用了 ${item.name}，将持续恢复 5 秒。`);
        return;
      }
      return;
    }
    case 'attack':
    case 'kill': {
      if (!args) return send('要攻击哪个怪物？');
      const mobs = getAliveMobs(player.position.zone, player.position.room, player.realmId || 1);
      const target = mobs.find((m) => m.name.toLowerCase() === args.toLowerCase() || m.id === args);
      if (!target) {
        const pvpTarget = players.find(
          (p) => p.name.toLowerCase() === args.toLowerCase() && p.name !== player.name &&
            p.position.zone === player.position.zone && p.position.room === player.position.room
        );
        if (!pvpTarget) return send('未找到目标。');
        const myParty = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
        const sameParty = myParty && myParty.members.includes(pvpTarget.name);
        const sameGuild = player.guild && pvpTarget.guild && String(player.guild.id) === String(pvpTarget.guild.id);
        if (isSabakZone(player.position.zone) && sameGuild) {
          return send('不能攻击同一行会成员。');
        }
        if (sameParty) {
          return send('不能攻击同一队伍成员。');
        }
        player.combat = { targetId: pvpTarget.name, targetType: 'player', skillId: 'slash' };
        send(`你开始攻击 ${pvpTarget.name}。`);
        return;
      }
      player.combat = { targetId: target.id, targetType: 'mob', skillId: 'slash' };
      send(`你开始攻击 ${target.name}。`);
      return;
    }
    case 'pk': {
      if (!args) return send('要攻击哪个玩家？');
      const pvpTarget = players.find(
        (p) => p.name.toLowerCase() === args.toLowerCase() && p.name !== player.name &&
          p.position.zone === player.position.zone && p.position.room === player.position.room
      );
      if (!pvpTarget) return send('未找到目标。');
      const myParty = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
      const sameParty = myParty && myParty.members.includes(pvpTarget.name);
      const sameGuild = player.guild && pvpTarget.guild && String(player.guild.id) === String(pvpTarget.guild.id);
      if (isSabakZone(player.position.zone) && sameGuild) {
        return send('不能攻击同一行会成员。');
      }
      if (sameParty) {
        return send('不能攻击同一队伍成员。');
      }
      player.combat = { targetId: pvpTarget.name, targetType: 'player', skillId: 'slash' };
      send(`你开始攻击 ${pvpTarget.name}。`);
      return;
    }
    case 'cast': {
      const parts = args.split(' ').filter(Boolean);
      if (parts.length < 1) return send('要施放哪个技能？');
      const skillName = parts[0];
      const targetName = parts.slice(1).join(' ');
      const skill = skillByName(player, skillName);
      if (!skill) return send('未找到技能。');
      const skillLevel = getSkillLevel(player, skill.id);
      const power = scaledSkillPower(skill, skillLevel);
      if (skill.type === 'heal') {
        if (player.mp < skill.mp) return send('魔法不足。');
        let target = player;
        let targetIsSummon = false;
        const summonCandidates = getAliveSummons(player).map((summon) => ({ target: summon, isSummon: true }));
        if (targetName) {
          const nameLower = targetName.toLowerCase();
          const candidate = players.find(
            (p) => p.name.toLowerCase() === nameLower &&
              p.position.zone === player.position.zone &&
              p.position.room === player.position.room
          );
          if (!candidate) return send('未找到目标。');
          const myParty = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
          const sameParty = myParty && myParty.members.includes(candidate.name);
          if (candidate.name !== player.name && !sameParty) return send('只能治疗自己或队友。');
          target = candidate;
        } else if (partyApi?.getPartyByMember) {
          const party = partyApi.getPartyByMember(player.name);
          if (party && party.members.length) {
            const candidates = players
              .filter(
                (p) =>
                  party.members.includes(p.name) &&
                  p.position.zone === player.position.zone &&
                  p.position.room === player.position.room
              )
              .map((entry) => ({ target: entry, isSummon: false }));
            candidates.push(...summonCandidates);
            if (candidates.length) {
              candidates.sort((a, b) => (a.target.hp / a.target.max_hp) - (b.target.hp / b.target.max_hp));
              target = candidates[0].target;
              targetIsSummon = candidates[0].isSummon;
            }
          } else if (summonCandidates.length) {
            target = summonCandidates[0].target;
            targetIsSummon = true;
          }
        }
        player.mp -= skill.mp;
        const baseHeal = Math.floor(getSpiritValue(player) * 0.8 * power + player.level * 4);
        if (targetIsSummon) {
          target.hp = clamp(target.hp + baseHeal, 1, target.max_hp);
          send(`你为 ${target.name} 施放了 ${skill.name}，恢复 ${baseHeal} 点生命。`);
        } else {
          const heal = Math.max(1, Math.floor(baseHeal * getHealMultiplier(target)));
          target.hp = clamp(target.hp + heal, 1, target.max_hp);
          if (target.name === player.name) {
          send(`你施放了 ${skill.name}，恢复 ${heal} 点生命。`);
          } else {
            send(`你为 ${target.name} 施放了 ${skill.name}，恢复 ${heal} 点生命。`);
            target.send(`${player.name} 为你施放了 ${skill.name}，恢复 ${heal} 点生命。`);
          }
        }
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'heal_group') {
        if (player.mp < skill.mp) return send('魔法不足。');
        const party = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
        const members = party
          ? players.filter(
              (p) =>
                party.members.includes(p.name) &&
                p.position.zone === player.position.zone &&
                p.position.room === player.position.room
            )
          : [player];
        if (!members.length) return send('未找到队伍成员。');
        const summonTargets = [];
        members.forEach((member) => {
          const memberSummons = getAliveSummons(member);
          memberSummons.forEach((summon) => {
            summonTargets.push({ summon, owner: member });
          });
        });
        player.mp -= skill.mp;
        const baseHeal = Math.floor(getSpiritValue(player) * 0.8 * power + player.level * 4);
        const groupHeal = Math.max(1, Math.floor(baseHeal * 0.3));
        members.forEach((member) => {
          const heal = Math.max(1, Math.floor(groupHeal * getHealMultiplier(member)));
          member.hp = clamp(member.hp + heal, 1, member.max_hp);
          if (member.name !== player.name) {
            member.send(`${player.name} 为你施放了 ${skill.name}，恢复 ${heal} 点生命。`);
          }
        });
        summonTargets.forEach(({ summon }) => {
          summon.hp = clamp(summon.hp + groupHeal, 1, summon.max_hp);
        });
        send(`你施放了 ${skill.name}，为队伍成员恢复生命。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'summon') {
        if (player.mp < skill.mp) return send('魔法不足。');
        if (hasAliveSummon(player, skill.id)) return send('该召唤物已存在。');
        player.mp -= skill.mp;
        const summon = summonStats(player, skill, skillLevel);
        addOrReplaceSummon(player, { ...summon, exp: 0 });
        if (!player.flags) player.flags = {};
        player.flags.lastSummonSkill = skill.id;
        send(`你召唤了 ${summon.name} (等级 ${summon.level})。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'buff_shield') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 60;
        applyBuff(player, {
          key: 'magicShield',
          expiresAt: Date.now() + duration * 1000,
          ratio: 0.2
        });
        send(`你施放了 ${skill.name}，护盾持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'buff_def') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 60;
        const defMultiplier = 1.1;
        const party = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
        const members = party
          ? players.filter(
              (p) =>
                party.members.includes(p.name) &&
                p.position.zone === player.position.zone &&
                p.position.room === player.position.room
            )
          : [player];
        const targets = members.slice();
        members.forEach((p) => {
          const summons = getAliveSummons(p);
          summons.forEach((summon) => targets.push(summon));
        });
        targets.forEach((p) => {
          applyBuff(p, { key: 'defBuff', expiresAt: Date.now() + duration * 1000, defMultiplier });
          if (p.send) {
            p.send(`${player.name} 为你施放了 ${skill.name}。`);
          }
        });
        send(`你施放了 ${skill.name}，持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'buff_mdef') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 60;
        const mdefMultiplier = 1.1;
        const party = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
        const members = party
          ? players.filter(
              (p) =>
                party.members.includes(p.name) &&
                p.position.zone === player.position.zone &&
                p.position.room === player.position.room
            )
          : [player];
        const targets = members.slice();
        members.forEach((p) => {
          const summons = getAliveSummons(p);
          summons.forEach((summon) => targets.push(summon));
        });
        targets.forEach((p) => {
          applyBuff(p, { key: 'mdefBuff', expiresAt: Date.now() + duration * 1000, mdefMultiplier });
          if (p.send) {
            p.send(`${player.name} 为你施放了 ${skill.name}。`);
          }
        });
        send(`你施放了 ${skill.name}，持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'stealth') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 90 + skillLevel * 45;
        const targets = [player];
        targets.forEach((p) => {
          applyBuff(p, { key: 'invisible', expiresAt: Date.now() + duration * 1000 });
          p.send(`${player.name} 为你施放了 ${skill.name}。`);
        });
        send(`你施放了 ${skill.name}，持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'stealth_group') {
        if (player.mp < skill.mp) return send('魔法不足。');
        if (skill.cooldown) {
          if (!player.status) player.status = {};
          if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
          const now = Date.now();
          const lastUse = player.status.skillCooldowns[skill.id] || 0;
          const cooldownRemaining = Math.max(0, lastUse + skill.cooldown - now);
          if (cooldownRemaining > 0) {
            send(`${skill.name} 冷却中，还需 ${Math.ceil(cooldownRemaining / 1000)} 秒。`);
            return;
          }
        }
        player.mp -= skill.mp;
        const duration = 5;
        const now = Date.now();
        const targets = [player, ...getAliveSummons(player)];
        targets.forEach((p) => {
          if (!p.status) p.status = {};
          if (!p.status.buffs) p.status.buffs = {};
          p.status.invincible = now + duration * 1000;
          applyBuff(p, { key: 'spiritBoost', expiresAt: now + duration * 1000, multiplier: 2 });
        });
        if (skill.cooldown) {
          if (!player.status) player.status = {};
          if (!player.status.skillCooldowns) player.status.skillCooldowns = {};
          player.status.skillCooldowns[skill.id] = Date.now();
        }
        send(`你施放了 ${skill.name}，自己和召唤物 ${duration} 秒内免疫所有伤害，道术提升100%。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'repel') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const mobs = getAliveMobs(player.position.zone, player.position.room, player.realmId || 1);
        if (!mobs.length) return send('这里没有怪物。');
        mobs.forEach((mob) => {
          const dmg = Math.max(1, Math.floor(player.mag * 0.6 * power));
          recordMobDamage(mob, player.name, dmg);
          applyDamage(mob, dmg);
          mob.status.stunTurns = Math.max(mob.status.stunTurns || 0, 1);
        });
        send(`你施放了 ${skill.name}，震退了怪物。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'dot') {
        // 施毒术不再消耗药粉
      }
      const mobs = getAliveMobs(player.position.zone, player.position.room, player.realmId || 1);
      const target = mobs.find((m) => m.name.toLowerCase() === targetName.toLowerCase() || m.id === targetName);
      if (!target) return send('未找到怪物。');
      player.combat = { targetId: target.id, targetType: 'mob', skillId: skill.id };
      send(`你对 ${target.name} 施放了 ${skill.name}。`);
      return;
    }
    case 'autoskill': {
      if (!args) {
        const current = player.flags?.autoSkillId || 'off';
        send(`自动技能: ${current}`);
        return;
      }
      const lower = args.toLowerCase();
      if (lower === 'off') {
        if (player.flags) {
          player.flags.autoSkillId = null;
          player.flags.autoHpPct = null;
          player.flags.autoMpPct = null;
        }
        send('已关闭自动技能与自动喝药。');
        return;
      }
      if (lower === 'all') {
        if (!player.flags) player.flags = {};
        player.flags.autoSkillId = 'all';
        if (player.flags.autoHpPct == null) player.flags.autoHpPct = 50;
        if (player.flags.autoMpPct == null) player.flags.autoMpPct = 50;
        send(`已设置自动技能: 全部技能。自动喝药阈值: HP ${player.flags.autoHpPct}% / MP ${player.flags.autoMpPct}%`);
        return;
      }
      const listText = lower.startsWith('set ') ? args.slice(4) : args;
      if (listText.includes(',')) {
        const parts = listText.split(',').map((s) => s.trim()).filter(Boolean);
        const skills = parts.map((name) => skillByName(player, name)).filter(Boolean);
        if (skills.length !== parts.length) return send('未找到部分技能。');
        if (!player.flags) player.flags = {};
        player.flags.autoSkillId = skills.map((s) => s.id);
        if (player.flags.autoHpPct == null) player.flags.autoHpPct = 50;
        if (player.flags.autoMpPct == null) player.flags.autoMpPct = 50;
        send(`已设置自动技能: ${skills.map((s) => s.name).join('、')}。`);
        return;
      }
      const skill = skillByName(player, listText);
      if (!skill) return send('未找到技能。');
      if (!player.flags) player.flags = {};
      player.flags.autoSkillId = skill.id;
      if (player.flags.autoHpPct == null) player.flags.autoHpPct = 50;
      if (player.flags.autoMpPct == null) player.flags.autoMpPct = 50;
      send(`已设置自动技能: ${skill.name}。`);
      return;
    }
    case 'autopotion': {
      if (!args) {
        const hp = player.flags?.autoHpPct;
        const mp = player.flags?.autoMpPct;
        send(`自动喝药: HP ${hp ?? 'off'}% / MP ${mp ?? 'off'}%`);
        return;
      }
      if (args.toLowerCase() === 'off') {
        if (player.flags) {
          player.flags.autoHpPct = null;
          player.flags.autoMpPct = null;
        }
        send('已关闭自动喝药。');
        return;
      }
      const parts = args.split(' ').filter(Boolean);
      const hpPct = Number(parts[0]);
      const mpPct = Number(parts[1]);
      if (Number.isNaN(hpPct) || Number.isNaN(mpPct)) return;
      if (hpPct < 5 || hpPct > 95 || mpPct < 5 || mpPct > 95) return send('阈值范围: 5-95');
      if (!player.flags) player.flags = {};
      player.flags.autoHpPct = hpPct;
      player.flags.autoMpPct = mpPct;
      send(`已设置自动喝药: HP ${hpPct}% / MP ${mpPct}%`);
      return;
    }
    case 'buy': {
      if (!canShop(player)) return send('这里没有商店。');
      if (!args) return send('要买什么？');
      if (args.toLowerCase() === 'list') {
        const stock = getShopStock(player);
        if (!stock.length) return send('商店暂无商品。');
        send(`商店商品: ${stock.map((i) => `${i.name}(${i.price}金)`).join(', ')}`);
        return;
      }
      const parts = args.split(' ').filter(Boolean);
      let qty = 1;
      if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
        qty = Math.max(1, Number(parts.pop()));
      }
      
      // 验证数量
      const qtyResult = validateItemQty(qty);
      if (!qtyResult.ok) return send(qtyResult.error);
      
      const name = parts.join(' ');
      const stock = getShopStock(player);
      const item = stock.find((i) => i.name.toLowerCase() === name.toLowerCase() || i.id === name);
      if (!item) return send('这里不卖该物品。');
      
      // 服务端重新计算总价，防止客户端篡改
      let totalPrice = item.price * qtyResult.value;
      if (isSabakOwnerMember(player, guildApi) && item.type === 'consumable' && (item.hp || item.mp)) {
        totalPrice = Math.max(1, Math.floor(totalPrice * 0.8));
      }
      
      // 验证玩家金币
      const goldResult = validatePlayerHasGold(player, totalPrice);
      if (!goldResult.ok) return send(goldResult.error);
      
      player.gold -= goldResult.value;
      addItem(player, item.id, qtyResult.value);
      player.forceStateRefresh = true;
      send(`购买了 ${item.name} x${qtyResult.value}，花费 ${goldResult.value} 金币。`);
      return;
    }
    case 'shop': {
      if (!canShop(player)) return send('这里没有商店。');
      const stock = getShopStock(player);
      if (!stock.length) return send('商店暂无商品。');
      send(`商店商品: ${stock.map((i) => `${i.name}(${i.price}金)`).join(', ')}`);
      return;
    }
    case 'sell_bulk': {
      if (!canShop(player)) return send('这里没有商店。');
      const inventory = Array.isArray(player.inventory) ? player.inventory.slice() : [];
      let soldCount = 0;
      let totalGold = 0;
      const soldItems = [];
      inventory.forEach((slot) => {
        if (!slot || !slot.id) return;
        const item = ITEM_TEMPLATES[slot.id];
        if (!item) return;
        if (item.type === 'currency') return;
        if (!isEquipmentItem(item)) return;
        const rarity = rarityByPrice(item);
        const effectless = !hasSpecialEffects(slot.effects);
        if (!effectless || !isBelowEpic(rarity)) return;
        const qty = Math.max(0, Number(slot.qty || 0));
        if (qty <= 0) return;
        if (!removeItem(player, item.id, qty, slot.effects)) return;
        const price = Math.max(1, Math.floor((item.price || 10) * 0.5));
        const itemTotal = price * qty;
        totalGold += itemTotal;
        soldCount += qty;
        soldItems.push({ name: item.name, qty, gold: itemTotal });
      });
      if (soldCount <= 0) return send('没有可一键售卖的装备。');
      player.gold += totalGold;
      player.forceStateRefresh = true;

      // 系统日志
      if (logLoot) {
        const itemsStr = soldItems.map(i => `${i.name} x${i.qty}`).join(', ');
        logLoot(`[shop] ${player.name} 一键售卖：${itemsStr}，总共获得 ${totalGold} 金币`);
      }

      send(`一键售卖完成：售出 ${soldCount} 件装备，获得 ${totalGold} 金币。`);
      return;
    }
    case 'sell': {
      if (!canShop(player)) return send('这里没有商店。');
      if (!args) return send('要卖什么？');
      const parts = args.split(' ').filter(Boolean);
      let qty = 1;
      if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
        qty = Math.max(1, Number(parts.pop()));
      }
      
      // 验证数量
      const qtyResult = validateItemQty(qty);
      if (!qtyResult.ok) return send(qtyResult.error);
      
      const name = parts.join(' ');
      const resolved = resolveInventoryItem(player, name);
      if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
      const item = resolved.item;
      if (item.type === 'currency') return send('金币无法出售。');
      
      // 验证玩家拥有该物品
      const hasItemResult = validatePlayerHasItem(player, item.id, qtyResult.value, resolved.slot.effects);
      if (!hasItemResult.ok) return send(hasItemResult.error);
      
      if (!removeItem(player, item.id, qtyResult.value, resolved.slot.effects)) return send('背包里没有足够数量。');

      // 服务端重新计算总价
      const price = Math.max(1, Math.floor((item.price || 10) * 0.5));
      const total = price * qtyResult.value;
      player.gold += total;
      player.forceStateRefresh = true;

      // 系统日志
      if (logLoot) {
        logLoot(`[shop] ${player.name} 卖出 ${item.name} x${qtyResult.value}，获得 ${total} 金币`);
      }

      send(`卖出 ${item.name} x${qtyResult.value}，获得 ${total} 金币。`);
      return;
    }
    case 'consign': {
      if (!consignApi) return send('寄售系统不可用。');
      const parts = args.split(' ').filter(Boolean);
      const sub = (parts.shift() || 'list').toLowerCase();
      if (sub === 'list') {
        const items = await consignApi.listMarket(player);
        if (!items.length) send('寄售市场暂无商品。');
        return;
      }
      if (sub === 'my') {
        const items = await consignApi.listMine(player);
        if (!items.length) send('你没有寄售物品。');
        return;
      }
      if (sub === 'history') {
        const items = await consignApi.listHistory(player);
        if (!items.length) send('暂无寄售记录。');
        return;
      }
        if (sub === 'sell') {
          if (parts.length < 3) return;
          const price = Number(parts.pop());
          const qty = Number(parts.pop());
          const name = parts.join(' ');
          if (!name || Number.isNaN(price) || Number.isNaN(qty)) {
            return;
          }
          const resolved = resolveInventoryItem(player, name);
          if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
          const res = await consignApi.sell(player, resolved.slot.id, qty, price, resolved.slot.effects || null);
          if (res && res.ok) player.forceStateRefresh = true;
          send(res.msg);
          return;
        }
      if (sub === 'buy') {
        if (parts.length < 1) return;
        const id = Number(parts[0]);
        const qty = parts.length > 1 ? Number(parts[1]) : 1;
        if (Number.isNaN(id) || Number.isNaN(qty)) return;
        const res = await consignApi.buy(player, id, qty);
        if (res && res.ok) player.forceStateRefresh = true;
        send(res.msg);
        return;
      }
      if (sub === 'cancel') {
        if (parts.length < 1) return;
        const id = Number(parts[0]);
        if (Number.isNaN(id)) return;
        const res = await consignApi.cancel(player, id);
        if (res && res.ok) player.forceStateRefresh = true;
        send(res.msg);
        return;
      }
      return;
    }
    case 'forge': {
      if (source !== 'ui') return;
      if (!args) return;
      const [mainRaw, secondaryRaw] = args
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);
      if (!mainRaw || !secondaryRaw) return;
      let mainResolved = null;
      let mainEquippedSlot = null;
      if (mainRaw.startsWith('equip:')) {
        const slotName = mainRaw.slice('equip:'.length).trim();
        const equipped = player.equipment?.[slotName];
        if (!equipped || !equipped.id) return send('身上没有该主件装备。');
        const item = ITEM_TEMPLATES[equipped.id];
        if (!item) return send('主件装备无效。');
        mainResolved = { slot: equipped, item };
        mainEquippedSlot = slotName;
      } else {
        mainResolved = resolveInventoryItem(player, mainRaw);
        if (!mainResolved.slot || !mainResolved.item) return send('背包里没有主件装备。');
      }
      const secondaryResolved = resolveInventoryItem(player, secondaryRaw);
      if (!secondaryResolved.slot || !secondaryResolved.item) return send('背包里没有副件装备。');
      if (mainResolved.slot.id !== secondaryResolved.slot.id) {
        return send('只能使用两件相同装备合成。');
      }
      const item = mainResolved.item;
      if (!item.slot || !['weapon', 'armor', 'accessory'].includes(item.type)) {
        return send('只能合成装备。');
      }
      const rarity = rarityByPrice(item);
      if (!['legendary', 'supreme'].includes(rarity)) {
        return send('仅支持传说及以上装备合成。');
      }
      if (mainEquippedSlot) {
        secondaryResolved.slot.qty -= 1;
      } else if (mainResolved.slot === secondaryResolved.slot) {
        if ((mainResolved.slot.qty || 0) < 2) {
          return send('需要两件相同装备才能合成。');
        }
        mainResolved.slot.qty -= 2;
      } else {
        mainResolved.slot.qty -= 1;
        secondaryResolved.slot.qty -= 1;
      }
      player.inventory = player.inventory.filter((slot) => slot.qty > 0);

      const effects = { ...(mainResolved.slot.effects || {}) };
      const mainElement = Number(effects.elementAtk || 0);
      const secondaryElement = Number((secondaryResolved.slot.effects || {}).elementAtk || 0);
      effects.elementAtk = Math.max(1, Math.floor(mainElement + secondaryElement + 1));

      // 保留主件的锻造等级
      const mainRefineLevel = mainResolved.slot.refine_level || 0;
      const secondaryRefineLevel = secondaryResolved.slot.refine_level || 0;
      const finalRefineLevel = Math.max(mainRefineLevel, secondaryRefineLevel);

      if (mainEquippedSlot) {
        player.equipment[mainEquippedSlot] = {
          id: item.id,
          effects,
          durability: mainResolved.slot.durability ?? null,
          max_durability: mainResolved.slot.max_durability ?? null,
          refine_level: finalRefineLevel
        };
      } else {
        addItem(
          player,
          item.id,
          1,
          effects,
          mainResolved.slot.durability ?? null,
          mainResolved.slot.max_durability ?? null,
          finalRefineLevel
        );
      }
      computeDerived(player);
      player.forceStateRefresh = true;
      send(`合成成功：${item.name} 元素攻击+${effects.elementAtk}。`);
      return;
    }
    case 'refine': {
      if (source !== 'ui') return;
      if (!args) return send('要锻造什么装备？');
      const itemRaw = args.trim();

      // 解析主件装备
      let mainResolved = null;
      let mainEquippedSlot = null;
      if (itemRaw.startsWith('equip:')) {
        const slotName = itemRaw.slice('equip:'.length).trim();
        const equipped = player.equipment?.[slotName];
        if (!equipped || !equipped.id) return send('身上没有该装备。');
        const item = ITEM_TEMPLATES[equipped.id];
        if (!item) return send('装备无效。');
        mainResolved = { slot: equipped, item };
        mainEquippedSlot = slotName;
      } else {
        mainResolved = resolveInventoryItem(player, itemRaw);
        if (!mainResolved.slot || !mainResolved.item) return send('背包里没有该装备。');
      }

      const item = mainResolved.item;
      if (!item.slot || !['weapon', 'armor', 'accessory'].includes(item.type)) {
        return send('只能锻造装备。');
      }

      const currentRefineLevel = mainResolved.slot.refine_level || 0;
      const nextRefineLevel = currentRefineLevel + 1;

      // 计算成功率：从配置读取
      const tier = Math.floor((nextRefineLevel - 2) / 10);
      const baseSuccessRate = Math.max(1, getRefineBaseSuccessRate() - tier * getRefineDecayRate());
      const successRate = nextRefineLevel === 1 ? 100 : baseSuccessRate;

      // 保段检查：每10级保段
      const isProtected = currentRefineLevel > 0 && currentRefineLevel % 10 === 0;

      // 收集所有商店销售的装备ID
      const allShopItems = new Set();
      Object.values(SHOP_STOCKS).forEach(stockList => {
        stockList.forEach(itemId => allShopItems.add(itemId));
      });

      // 收集并消耗材料（从配置读取数量）
      const materialCount = getRefineMaterialCount();
      const materials = [];
      const inventory = Array.isArray(player.inventory) ? player.inventory.slice() : [];
      for (const slot of inventory) {
        if (!slot || !slot.id) continue;
        const matItem = ITEM_TEMPLATES[slot.id];
        if (!matItem) continue;
        if (!isEquipmentItem(matItem)) continue;
        if (allShopItems.has(slot.id)) continue; // 排除商店装备
        // 优先使用装备模板中手动设置的 rarity，如果没有才使用价格计算
        const rarity = matItem.rarity || rarityByPrice(matItem);
        if (!isBelowEpic(rarity)) continue; // 只能史诗（不含）以下
        if (hasSpecialEffects(slot.effects)) continue; // 不能有特效
        const qty = Math.max(0, Number(slot.qty || 0));
        if (qty <= 0) continue;

        const takeQty = Math.min(qty, materialCount - materials.length);
        for (let i = 0; i < takeQty; i++) {
          materials.push({ slot, item: matItem });
        }

        if (materials.length >= materialCount) break;
      }

      if (materials.length < materialCount) {
        return send(`需要${materialCount}件史诗（不含）以下的无特效装备才能锻造，当前只有${materials.length}件。`);
      }

      // 消耗材料
      materials.forEach(({ slot }) => {
        if (slot.qty) {
          slot.qty -= 1;
        } else {
          // 如果没有qty属性，从背包中移除
          const index = player.inventory.indexOf(slot);
          if (index > -1) {
            player.inventory.splice(index, 1);
          }
        }
      });
      player.inventory = player.inventory.filter((slot) => !slot.qty || slot.qty > 0);

      // 执行锻造
      const success = Math.random() * 100 < successRate;
      const newRefineLevel = success ? nextRefineLevel : (isProtected ? currentRefineLevel : Math.max(0, currentRefineLevel - 1));

      // 应用锻造等级
      if (mainEquippedSlot) {
        player.equipment[mainEquippedSlot].refine_level = newRefineLevel;
      } else {
        mainResolved.slot.refine_level = newRefineLevel;
      }

      computeDerived(player);
      player.forceStateRefresh = true;

      if (success) {
        const bonus = newRefineLevel;
        send(`锻造成功！${item.name} 提升到锻造+${newRefineLevel}，所有属性+${bonus}。`);
        // 每20级全服通知
        if (newRefineLevel > 0 && newRefineLevel % 20 === 0) {
          emitAnnouncement(`恭喜玩家 ${player.name} 将 ${item.name} 锻造至+${newRefineLevel}！`, 'announce', null);
        }
        // 系统日志
        if (logLoot) {
          logLoot(`[refine] ${player.name} 锻造成功 ${item.name} +${newRefineLevel}`);
        }
      } else {
        if (isProtected) {
          send(`锻造失败，但在保段位，${item.name} 锻造等级保持在+${currentRefineLevel}。`);
        } else {
          send(`锻造失败，${item.name} 锻造等级降低到+${newRefineLevel}。`);
          // 系统日志
          if (logLoot) {
            logLoot(`[refine] ${player.name} 锻造失败 ${item.name} +${newRefineLevel}`);
          }
        }
      }
      return;
    }
    case 'effect': {
      if (source !== 'ui') return;
      if (!args) return send('要重置什么装备的特效？');
      const parts = args.trim().split(/\s+/);
      if (parts.length < 2) return send('格式：effect <主件> <副件>');

      const mainRaw = parts[0];
      const secondaryRaw = parts[1];

      // 解析主件装备（必须是已穿戴的装备）
      let mainResolved = null;
      let mainEquippedSlot = null;
      if (mainRaw.startsWith('equip:')) {
        const slotName = mainRaw.slice('equip:'.length).trim();
        const equipped = player.equipment?.[slotName];
        if (!equipped || !equipped.id) return send('身上没有该装备。');
        const item = ITEM_TEMPLATES[equipped.id];
        if (!item) return send('装备无效。');
        mainResolved = { slot: equipped, item };
        mainEquippedSlot = slotName;
      } else {
        return send('只能给已穿戴的主件装备重置特效。');
      }

      const mainItem = mainResolved.item;

      // 检查主件是否有特效
      if (!mainResolved.slot.effects || Object.keys(mainResolved.slot.effects).length === 0) {
        return send('主件必须要有特效。');
      }

      // 解析副件装备
      const secondaryResolved = resolveInventoryItem(player, secondaryRaw);
      if (!secondaryResolved.slot || !secondaryResolved.item) return send('背包里没有该副件装备。');

      // 检查副件是否有特效
      if (!secondaryResolved.slot.effects || Object.keys(secondaryResolved.slot.effects).length === 0) {
        return send('副件必须要有特效。');
      }

      // 消耗副件装备
      const secondarySlot = secondaryResolved.slot;
      if (secondarySlot.qty && secondarySlot.qty > 1) {
        secondarySlot.qty -= 1;
      } else {
        const index = player.inventory.indexOf(secondarySlot);
        if (index > -1) {
          player.inventory.splice(index, 1);
        }
      }
      player.inventory = player.inventory.filter((slot) => !slot.qty || slot.qty > 0);

      // 执行特效重置：从配置读取成功率和多特效概率
      const success = Math.random() * 100 < getEffectResetSuccessRate();

      // 判断获得几条特效（从高到低依次判断，避免重复触发）
      let effectCount = 0;
      if (success) {
        const quintupleEffect = Math.random() * 100 < getEffectResetQuintupleRate();
        const quadrupleEffect = Math.random() * 100 < getEffectResetQuadrupleRate();
        const tripleEffect = Math.random() * 100 < getEffectResetTripleRate();
        const doubleEffect = Math.random() * 100 < getEffectResetDoubleRate();

        if (quintupleEffect) {
          effectCount = 5;
        } else if (quadrupleEffect) {
          effectCount = 4;
        } else if (tripleEffect) {
          effectCount = 3;
        } else if (doubleEffect) {
          effectCount = 2;
        } else {
          effectCount = 1;
        }
      }

      // 保存主件原有特效（失败时保留）
      const originalEffects = mainResolved.slot.effects;

      // 保存原有的元素攻击值(通过装备合成获得)
      const originalElementAtk = Number(originalEffects?.elementAtk || 0);

      let newEffects = null;

      if (success) {
        newEffects = generateRandomEffects(effectCount);

        // 如果原有装备有元素攻击,特效重置后继续保留(因为元素攻击只能通过装备合成获得)
        if (originalElementAtk > 0) {
          newEffects.elementAtk = originalElementAtk;
        }
        if (effectCount === 5) {
          send(`特效重置成功！${mainItem.name} 获得5条新特效！`);
          emitAnnouncement(`恭喜玩家 ${player.name} 的 ${mainItem.name} 特效重置成功，获得5条新特效！`, 'announce', null);
        } else if (effectCount === 4) {
          send(`特效重置成功！${mainItem.name} 获得4条新特效！`);
          emitAnnouncement(`恭喜玩家 ${player.name} 的 ${mainItem.name} 特效重置成功，获得4条新特效！`, 'announce', null);
        } else if (effectCount === 3) {
          send(`特效重置成功！${mainItem.name} 获得3条新特效！`);
          emitAnnouncement(`恭喜玩家 ${player.name} 的 ${mainItem.name} 特效重置成功，获得3条新特效！`, 'announce', null);
        } else if (effectCount === 2) {
          send(`特效重置成功！${mainItem.name} 获得2条新特效！`);
          emitAnnouncement(`恭喜玩家 ${player.name} 的 ${mainItem.name} 特效重置成功，获得2条新特效！`, 'announce', null);
        } else {
          send(`特效重置成功！${mainItem.name} 获得1条新特效。`);
          emitAnnouncement(`恭喜玩家 ${player.name} 的 ${mainItem.name} 特效重置成功，获得1条新特效！`, 'announce', null);
        }
      } else {
        send(`特效重置失败，副件装备已消耗，但主件特效保留。`);
        newEffects = originalEffects;
      }

      // 应用新特效,保留锻造等级
      if (mainEquippedSlot) {
        player.equipment[mainEquippedSlot].effects = newEffects;
        // 确保保留锻造等级
        if (player.equipment[mainEquippedSlot].refine_level == null) {
          player.equipment[mainEquippedSlot].refine_level = 0;
        }
      } else {
        mainResolved.slot.effects = newEffects;
        // 确保保留锻造等级
        if (mainResolved.slot.refine_level == null) {
          mainResolved.slot.refine_level = 0;
        }
      }

      computeDerived(player);
      player.forceStateRefresh = true;

      // 系统日志
      if (logLoot) {
        if (success) {
          logLoot(`[effect] ${player.name} 特效重置成功 ${mainItem.name} ${effectCount}条`);
        } else {
          logLoot(`[effect] ${player.name} 特效重置失败 ${mainItem.name}`);
        }
      }
      return;
    }
    case 'repair': {
      if (!player.equipment) return send('没有可修理的装备。');
      const slots = Object.keys(player.equipment || {});
      if (!args.trim() || args.trim() === 'list') {
        const list = slots
          .map((slot) => {
            const equipped = player.equipment[slot];
            if (!equipped || !equipped.id) return null;
            const item = ITEM_TEMPLATES[equipped.id];
            if (!item) return null;
            const maxDur = equipped.max_durability || getDurabilityMax(item);
            const cur = equipped.durability == null ? maxDur : equipped.durability;
            const missing = Math.max(0, maxDur - cur);
            let cost = missing > 0 ? getRepairCost(item, missing, player) : 0;
            if (cost > 0 && isSabakOwnerMember(player, guildApi)) {
              cost = Math.max(1, Math.floor(cost * 0.8));
            }
            return `${slot}: ${item.name} (${cur}/${maxDur}) 费用 ${cost}`;
          })
          .filter(Boolean);
        if (!list.length) send('没有可修理的装备。');
        else send(list.join('\n'));
        return;
      }
      let total = 0;
      const targets = [];
      slots.forEach((slot) => {
        const equipped = player.equipment[slot];
        if (!equipped || !equipped.id) return;
        const item = ITEM_TEMPLATES[equipped.id];
        if (!item) return;
        const maxDur = equipped.max_durability || getDurabilityMax(item);
        const cur = equipped.durability == null ? maxDur : equipped.durability;
        const missing = Math.max(0, maxDur - cur);
        if (missing <= 0) return;
        let cost = getRepairCost(item, missing, player);
        if (cost > 0 && isSabakOwnerMember(player, guildApi)) {
          cost = Math.max(1, Math.floor(cost * 0.8));
        }
        total += cost;
        targets.push({ slot, item, maxDur });
      });
      if (!targets.length) return send('无需修理。');
      if (player.gold < total) return send('金币不足。');
      player.gold -= total;
      targets.forEach((t) => {
        const equipped = player.equipment[t.slot];
        if (!equipped) return;
        equipped.max_durability = t.maxDur;
        equipped.durability = t.maxDur;
      });
      computeDerived(player);
      player.forceStateRefresh = true;
      send(`修理完成，花费 ${total} 金币。`);
      return;
    }
    case 'train': {
      console.log('[DEBUG] Train command received, args:', args);

      if (!player.flags) player.flags = {};
      if (!player.flags.training) {
        player.flags.training = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
      }
      if (!args) {
        Object.keys(TRAINING_OPTIONS).forEach((key) => {
          const info = TRAINING_OPTIONS[key];
          const cost = trainingCost(player, key);
          const currentLevel = player.flags.training[key] || 0;
          const perLevel = getTrainingPerLevelConfig()[key];
          const totalBonus = currentLevel * perLevel;
          send(`${info.label}: Lv${currentLevel} (属性+${totalBonus.toFixed(2)}), 消耗 ${cost} 金币, 升至 Lv${currentLevel + 1}`);
        });
        return;
      }

      // 检查是否为批量修炼模式，格式如 "train 攻击 10" 或 "train atk 10"
      const parts = args.trim().split(/\s+/).filter(Boolean);
      let key = null;
      let trainCount = 1;

      console.log('[DEBUG] Parts:', parts);

      if (parts.length >= 2) {
        const countStr = parts[parts.length - 1];
        const parsedCount = parseInt(countStr, 10);
        console.log('[DEBUG] countStr:', countStr, 'parsedCount:', parsedCount);
        if (!isNaN(parsedCount) && parsedCount > 0) {
          // 最后一个参数是数字，认为是修炼次数
          trainCount = parsedCount;
          const keyStr = parts.slice(0, -1).join('');
          key = TRAINING_ALIASES[keyStr] || TRAINING_ALIASES[keyStr.toLowerCase()];
          console.log('[DEBUG] Batch mode: keyStr=', keyStr, 'key=', key, 'trainCount=', trainCount);
        } else {
          // 不是数字，整个参数是修炼属性
          const keyStr = parts.join('');
          key = TRAINING_ALIASES[keyStr] || TRAINING_ALIASES[keyStr.toLowerCase()];
          console.log('[DEBUG] Single mode (not number): keyStr=', keyStr, 'key=', key);
        }
      } else {
        // 只有一个参数
        const keyStr = parts[0];
        key = TRAINING_ALIASES[keyStr] || TRAINING_ALIASES[keyStr.toLowerCase()];
        console.log('[DEBUG] Single mode: keyStr=', keyStr, 'key=', key);
      }

      if (!key || !TRAINING_OPTIONS[key]) {
        console.log('[DEBUG] Invalid key:', key);
        send('可修炼属性: 生命, 魔法值, 攻击, 防御, 魔法, 魔御, 道术, 敏捷');
        send('批量修炼格式: train 属性 次数 (例如: train 攻击 10)');
        return;
      }

      console.log('[DEBUG] Final: key=', key, 'trainCount=', trainCount);

      // 单次修炼
      if (trainCount === 1) {
        const cost = trainingCost(player, key);
        if (player.gold < cost) return send('金币不足。');
        player.gold -= cost;
        player.flags.training[key] = (player.flags.training[key] || 0) + TRAINING_OPTIONS[key].inc;
        const newLevel = player.flags.training[key];
        const perLevel = getTrainingPerLevelConfig()[key];
        const totalBonus = newLevel * perLevel;
        computeDerived(player);
        player.forceStateRefresh = true;
        send(`修炼成功: ${TRAINING_OPTIONS[key].label} 升至 Lv${newLevel} (属性+${totalBonus.toFixed(2)})。`);
        send(`消耗 ${cost} 金币。`);
        return;
      }

      // 批量修炼
      // 计算多次修炼的总费用
      let totalCost = 0;
      const costs = [];
      let currentLevel = player.flags.training[key] || 0;

      for (let i = 0; i < trainCount; i++) {
        const cost = trainingCost(player, key);
        costs.push(cost);
        totalCost += cost;
        // 临时增加等级以计算下一次的费用
        player.flags.training[key] = currentLevel + (i + 1);
      }

      // 恢复原始等级
      player.flags.training[key] = currentLevel;

      // 检查金币是否足够
      if (player.gold < totalCost) {
        send(`金币不足。需要 ${totalCost} 金币进行 ${trainCount} 次修炼，当前只有 ${player.gold} 金币。`);
        const perLevel = getTrainingPerLevelConfig()[key];
        send(`预计修炼至 Lv${currentLevel + trainCount} (属性+${((currentLevel + trainCount) * perLevel).toFixed(2)})`);
        return;
      }

      // 执行批量修炼
      player.gold -= totalCost;
      const newLevel = currentLevel + trainCount;
      player.flags.training[key] = newLevel;
      const perLevel = getTrainingPerLevelConfig()[key];
      const totalBonus = newLevel * perLevel;
      computeDerived(player);
      player.forceStateRefresh = true;

      send(`批量修炼成功: ${TRAINING_OPTIONS[key].label} 从 Lv${currentLevel} 升至 Lv${newLevel} (属性+${totalBonus.toFixed(2)})。`);
      send(`共 ${trainCount} 次修炼，消耗 ${totalCost} 金币。`);
      return;
    }
    case 'party': {
      if (!partyApi) return send('队伍系统不可用。');
      const [subCmd, ...restArgs] = args.split(' ').filter(Boolean);
      const sub = (subCmd || '').toLowerCase();
      const targetName = restArgs.join(' ');
      const party = partyApi.getPartyByMember(player.name);
      if (sub === 'create') {
        if (party) return send('你已经在队伍中。');
        const created = partyApi.createParty(player.name);
        if (partyApi.persistParty) {
          await partyApi.persistParty(created);
        }
        send('已创建队伍。');
        return;
      }
      if (sub === 'invite') {
        if (!targetName) return send('邀请谁加入队伍？');
        const target = players.find((p) => p.name === targetName);
        if (!target) return send('玩家不在线。');
        const targetParty = partyApi.getPartyByMember(target.name);
        if (party && party.leader && party.leader !== player.name) {
          return send('只有队长可以邀请队友。');
        }
        // 如果目标有队伍且队伍未满员，且玩家没有队伍，直接加入目标的队伍
        if (targetParty && targetParty.members.length < PARTY_LIMIT && !party) {
          if (targetParty.members.includes(player.name)) {
            send('你已在队伍中。');
            send(partyStatus(targetParty));
            return;
          }
          targetParty.members.push(player.name);
          if (partyApi.persistParty) {
            await partyApi.persistParty(targetParty);
          }
          send(`你已加入 ${target.name} 的队伍。`);
          send(partyStatus(targetParty));
          target.send(`${player.name} 已加入你的队伍。`);
          target.send(partyStatus(targetParty));
          return;
        }
        // 如果目标已有队伍且队伍已满员，或者玩家已有队伍，按原逻辑处理
        if (targetParty) {
          if (targetParty.members.length >= PARTY_LIMIT) {
            return send('对方队伍已满。');
          }
          return send('对方已有队伍，请先退出组队再邀请。');
        }
        const myParty = party || partyApi.createParty(player.name);
        if (myParty.members.length >= PARTY_LIMIT) return send('队伍已满。');
        if (myParty.members.includes(target.name)) return send('对方已在队伍中。');
        myParty.members.push(target.name);
        if (!myParty.leader) myParty.leader = player.name;
        if (partyApi.persistParty) {
          await partyApi.persistParty(myParty);
        }
        send(`${target.name} 已加入队伍。`);
        target.send(`你已加入 ${player.name} 的队伍。`);
        return;
      }
      if (sub === 'kick') {
        if (!party) return send('你不在队伍中。');
        if (!party.leader || party.leader !== player.name) return send('只有队长可以踢出队友。');
        if (!targetName) return send('要踢出谁？');
        if (!party.members.includes(targetName)) return send('对方不在队伍中。');
        const updated = partyApi.removeFromParty(targetName);
        if (partyApi.clearPartyFlags) {
          await partyApi.clearPartyFlags(targetName);
        }
        if (updated && partyApi.persistParty) {
          await partyApi.persistParty(updated);
        }
        send(`已将 ${targetName} 踢出队伍。`);
        const target = players.find((p) => p.name === targetName);
        if (target) target.send('你已被队长踢出队伍。');
        return;
      }
      if (sub === 'transfer') {
        if (!party) return send('你不在队伍中。');
        if (!party.leader || party.leader !== player.name) return send('只有队长可以转让队长职位。');
        if (!targetName) return send('转让给谁？');
        if (!party.members.includes(targetName)) return send('对方不在队伍中。');
        if (targetName === player.name) return send('不能转让给自己。');
        party.leader = targetName;
        if (partyApi.persistParty) {
          await partyApi.persistParty(party);
        }
        send(`你已将队长职位转让给 ${targetName}。`);
        const target = players.find((p) => p.name === targetName);
        if (target) target.send(`${player.name} 已将队长职位转让给你。`);
        return;
      }

      if (sub === 'follow') {
        const mode = restArgs[0] ? restArgs[0].toLowerCase() : '';
        if (mode === 'accept') {
          const leaderName = restArgs.slice(1).join(' ') || (partyApi.followInvites?.get(player.name)?.from || '');
          const invite = partyApi.followInvites?.get(player.name);
          if (!invite || (leaderName && invite.from !== leaderName)) return send('没有跟随邀请。');
          const leader = players.find((p) => p.name === invite.from);
          if (!leader) return send('队长不在线。');
          player.position.zone = leader.position.zone;
          player.position.room = leader.position.room;
          send(`已跟随队长前往 ${leader.name} 的位置。`);
          leader.send(`${player.name} 已跟随你。`);
          partyApi.followInvites?.delete(player.name);
          return;
        }
        // 队员主动跟随队长（不需要确认）
        if (targetName && party && party.leader && party.leader === targetName) {
          const leader = players.find((p) => p.name === targetName);
          if (!leader) return send('队长不在线。');
          if (!party.members.includes(player.name)) return send('你不在队伍中。');
          player.position.zone = leader.position.zone;
          player.position.room = leader.position.room;
          send(`已跟随队长前往 ${leader.name} 的位置。`);
          leader.send(`${player.name} 已跟随你。`);
          return;
        }
        // 队长邀请队员跟随（需要队员确认）
        if (!party) return send('你不在队伍中。');
        if (!party.leader || party.leader !== player.name) return send('只有队长可以邀请跟随。');
        if (!targetName) return send('邀请谁跟随？');
        if (!party.members.includes(targetName)) return send('对方不在队伍中。');
        const target = players.find((p) => p.name === targetName);
        if (!target) return send('玩家不在线。');
        if (partyApi.followInvites) {
          partyApi.followInvites.set(target.name, { from: player.name, at: Date.now() });
        }
        target.send(`${player.name} 邀请你跟随。`);
        send(`已发送跟随邀请给 ${target.name}。`);
        return;
      }
      if (sub === 'accept') {
        send('队伍邀请无需接受，邀请后会自动入队。');
        return;
      }
      if (sub === 'leave') {
        if (!party) return send('你不在队伍中。');
        const updated = partyApi.removeFromParty(player.name);
        if (partyApi.clearPartyFlags) {
          await partyApi.clearPartyFlags(player.name);
        }
        if (updated && partyApi.persistParty) {
          await partyApi.persistParty(updated);
        }
        send('你已离开队伍。');
        return;
      }
      send(partyStatus(party));
      return;
    }
    case 'guild': {
      if (!guildApi) return send('行会系统不可用。');
      const [subCmd, ...restArgs] = args.split(' ').filter(Boolean);
      const sub = (subCmd || '').toLowerCase();
      const nameArg = restArgs.join(' ');

      if (sub === 'create') {
        if (player.guild) return send('你已经加入行会。');
        if (!nameArg) return send('请输入行会名称。');
        const exists = await guildApi.getGuildByName(nameArg);
        if (exists) return send('行会名已存在。');
        const hasHorn = player.inventory.find((i) => i.id === 'woma_horn' && i.qty >= 1);
        if (!hasHorn) return send('创建行会需要沃玛号角。');
        removeItem(player, 'woma_horn', 1);
        try {
          const guildId = await guildApi.createGuild(nameArg, player.userId, player.name);
          player.guild = { id: guildId, name: nameArg, role: 'leader' };
          send(`行会创建成功: ${nameArg}`);
        } catch (err) {
          if (err.code === 'VALIDATION_ERROR') {
            send(err.message);
          } else {
            throw err;
          }
        }
        return;
      }

      if (sub === 'invite') {
        if (!player.guild) return send('你不在行会中。');
        const target = players.find((p) => p.name === nameArg);
        if (!target) return send('玩家不在线。');
        if (target.guild) return send('对方已有行会，请先退出行会再邀请。');
        const isLeaderOrVice = await guildApi.isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
        if (!isLeaderOrVice) return send('只有会长或副会长可以邀请。');
        await guildApi.listGuildMembers(player.guild.id, player.realmId || 1);
        await guildApi.addGuildMember(player.guild.id, target.userId, target.name);
        target.guild = { id: player.guild.id, name: player.guild.name, role: 'member' };
        send(`${target.name} 已加入行会。`);
        target.send(`你已加入行会 ${player.guild.name}。`);
        return;
      }

      if (sub === 'kick' || sub === 'remove') {
        if (!player.guild) return send('你不在行会中。');
        if (!nameArg) return send('要踢出谁？');

        const isLeaderOrVice = await guildApi.isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
        if (!isLeaderOrVice) return send('只有会长或副会长可以踢人。');

        // 从数据库中获取行会成员列表
        const members = await guildApi.listGuildMembers(player.guild.id, player.realmId || 1);
        const targetMember = members.find((m) => m.char_name === nameArg);

        if (!targetMember) return send('该玩家不在你的行会中。');
        if (targetMember.role === 'leader') return send('不能踢出会长。');

        // 如果操作者是副会长，则不能踢其他副会长
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader && targetMember.role === 'vice_leader') return send('副会长不能踢其他副会长。');

        // 从数据库中移除行会成员
        await guildApi.removeGuildMember(player.guild.id, targetMember.user_id, nameArg);

        // 如果玩家在线，清除其行会信息并发送通知
        const onlineTarget = players.find((p) => p.name === nameArg);
        if (onlineTarget) {
          onlineTarget.guild = null;
          onlineTarget.send('你已被移出行会。');
        }

        send(`已将 ${nameArg} 移出行会。`);
        return;
      }

      if (sub === 'transfer') {
        if (!player.guild) return send('你不在行会中。');
        const target = players.find((p) => p.name === nameArg);
        if (!target) return send('玩家不在线。');
        if (!target.guild || target.guild.id !== player.guild.id) return send('对方不在你的行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader) return send('只有会长可以转让会长职位。');
        if (target.guild.role === 'leader') return send('对方已经是会长。');
        try {
          await guildApi.transferGuildLeader(
            player.guild.id,
            player.userId,
            player.name,
            target.userId,
            target.name
          );
          player.guild.role = 'member';
          target.guild.role = 'leader';
          send(`你已将会长职位转让给 ${target.name}。`);
          target.send(`${player.name} 已将会长职位转让给你。`);
        } catch (err) {
          send(`转让会长失败: ${err.message}`);
        }
        return;
      }

      if (sub === 'vice') {
        if (!player.guild) return send('你不在行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader) return send('只有会长可以任命副会长。');
        const members = await guildApi.listGuildMembers(player.guild.id, player.realmId || 1);
        const targetMember = members.find((m) => m.char_name === nameArg);
        if (!targetMember) return send('该玩家不在你的行会中。');
        if (targetMember.role === 'leader') return send('不能任命会长为副会长。');
        const newRole = targetMember.role === 'vice_leader' ? 'member' : 'vice_leader';
        try {
          await guildApi.setGuildMemberRole(player.guild.id, targetMember.user_id, nameArg, newRole);
          const action = newRole === 'vice_leader' ? '任命为副会长' : '取消副会长';
          send(`已将 ${nameArg} ${action}。`);
          const onlineTarget = players.find((p) => p.name === nameArg);
          if (onlineTarget) {
            onlineTarget.guild.role = newRole;
            onlineTarget.send(`${player.name} ${action === '任命为副会长' ? '任命你为' : '取消了你的'}副会长职位。`);
          }
        } catch (err) {
          send(`操作失败: ${err.message}`);
        }
        return;
      }

      if (sub === 'apply') {
        if (player.guild) return send('你已经有行会了，请先退出行会。');
        const [subCmd2, ...restArgs] = args.split(' ').filter(Boolean);
        if (!subCmd2) return send('用法: guild apply <行会名>');
        const guildName = restArgs.join(' ');
        if (!guildName) return send('请输入行会名。');
        const guild = await guildApi.getGuildByNameInRealm(guildName);
        if (!guild) return send('行会不存在。');
        // 检查是否已有申请
        const existingApp = await guildApi.getApplicationByUser();
        if (existingApp) return send('你已经申请了行会，请等待处理。');
        await guildApi.applyToGuild(guild.id);
        send(`已申请加入行会 ${guildName}，请等待会长或副会长批准。`);
        // 通知在线的会长和副会长
        const members = await guildApi.listGuildMembers(guild.id, player.realmId || 1);
        members.forEach((m) => {
          if (m.role === 'leader' || m.role === 'vice_leader') {
            const onlineMember = players.find((p) => p.name === m.char_name);
            if (onlineMember) {
              onlineMember.send(`${player.name} 申请加入行会，请在行会管理中查看申请。`);
            }
          }
        });
        return;
      }

      if (sub === 'list') {
        const guilds = await guildApi.listAllGuilds();
        if (guilds.length === 0) return send('当前没有行会。');
        send('行会列表:');
        guilds.forEach((g) => {
          send(`  ${g.name} (会长: ${g.leader_char_name})`);
        });
        return;
      }

      if (sub === 'applications') {
        if (!player.guild) return send('你不在行会中。');
        const isLeaderOrVice = await guildApi.isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
        if (!isLeaderOrVice) return send('只有会长或副会长可以查看申请。');
        const applications = await guildApi.listGuildApplications(player.guild.id);
        if (applications.length === 0) return send('当前没有待处理的申请。');
        send('待处理申请:');
        applications.forEach((app) => {
          const time = new Date(app.applied_at).toLocaleString('zh-CN', { hour12: false });
          send(`  ${app.char_name} (${time})`);
        });
        return;
      }

      if (sub === 'approve') {
        if (!player.guild) return send('你不在行会中。');
        const isLeaderOrVice = await guildApi.isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
        if (!isLeaderOrVice) return send('只有会长或副会长可以批准申请。');
        const members = await guildApi.listGuildMembers(player.guild.id, player.realmId || 1);
        const applications = await guildApi.listGuildApplications(player.guild.id);
        const targetApp = applications.find((a) => a.char_name === nameArg);
        if (!targetApp) return send('该玩家没有申请加入你的行会。');
        try {
          await guildApi.approveGuildApplication(player.guild.id, targetApp.user_id, nameArg);
          send(`已批准 ${nameArg} 加入行会。`);
          const onlineTarget = players.find((p) => p.name === nameArg);
          if (onlineTarget) {
            onlineTarget.guild = { id: player.guild.id, name: player.guild.name, role: 'member' };
            onlineTarget.send(`你的申请已被批准，已加入行会 ${player.guild.name}。`);
          }
        } catch (err) {
          if (err.message.includes('已经在行会')) {
            send(err.message);
          } else {
            console.error('[guild approve] Error:', err);
            send('批准申请失败。');
          }
        }
        return;
      }

      if (sub === 'reject') {
        if (!player.guild) return send('你不在行会中。');
        const isLeaderOrVice = await guildApi.isGuildLeaderOrVice(player.guild.id, player.userId, player.name);
        if (!isLeaderOrVice) return send('只有会长或副会长可以拒绝申请。');
        const applications = await guildApi.listGuildApplications(player.guild.id);
        const targetApp = applications.find((a) => a.char_name === nameArg);
        if (!targetApp) return send('该玩家没有申请加入你的行会。');
        await guildApi.removeGuildApplication(player.guild.id, targetApp.user_id);
        send(`已拒绝 ${nameArg} 的申请。`);
        const onlineTarget = players.find((p) => p.name === nameArg);
        if (onlineTarget) {
          onlineTarget.send(`你的加入行会申请已被拒绝。`);
        }
        return;
      }






      if (sub === 'accept') {
        send('行会邀请无需接受，邀请后会自动加入。');
        return;
      }

      if (sub === 'leave') {
        if (!player.guild) return send('你不在行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        console.log('[GUILD LEAVE CHECK] player:', player.name, 'userId:', player.userId, 'guildId:', player.guild.id, 'isLeader:', isLeader);
        if (isLeader) return send('会长不能直接退出行会，请先转让会长职位。');
        const guildId = await guildApi.leaveGuild(player.userId, player.name);
        player.guild = null;
        send('你已退出行会。');
        return;
      }

      if (sub === 'info') {
        if (!player.guild) return send('你不在行会中。');
        const members = await guildApi.listGuildMembers(player.guild.id, player.realmId || 1);
        send(`行会: ${player.guild.name}`);
        send(`成员: ${members.map((m) => `${m.char_name}(${m.role})`).join(', ')}`);
        return;
      }

      return;
    }
    case 'gsay': {
      if (!player.guild) return send('你不在行会中。');
      if (!args) return;
      players
        .filter((p) => p.guild && p.guild.id === player.guild.id)
        .forEach((p) => p.send(`[行会][${player.name}] ${args}`));

      return;
    }
    case 'sabak': {
      const [subCmd] = args.split(' ').filter(Boolean);
      const sub = (subCmd || 'status').toLowerCase();
      if (sub === 'status') {
        const owner = guildApi.sabakState.ownerGuildName || '无';
        const state = guildApi.sabakState.active ? '攻城中' : '未开始';
        send(`沙巴克: ${state}, 当前城主: ${owner}`);
        send(`攻城时间: ${guildApi.sabakWindowInfo()}`);
        return;
      }
      if (sub === 'register') {
        if (!player.guild) return send('你不在行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader) return send('只有会长可以报名。');
        const isOwner = guildApi.sabakState.ownerGuildId === player.guild.id;
        if (isOwner) return send('守城行会无需报名。');
        const hasRegisteredToday = await guildApi.hasSabakRegistrationToday(player.guild.id);
        if (hasRegisteredToday) return send('该行会今天已经报名过了。');
        const registrations = await guildApi.listSabakRegistrations();
        const todayRegistrations = registrations.filter(r => {
          if (!r.registered_at) return false;
          const regDate = new Date(r.registered_at);
          const today = new Date();
          return regDate.toDateString() === today.toDateString();
        });
        if (todayRegistrations.length >= 1) return send('今天已经有行会报名了，每天只能有一个行会申请攻城。');
        if (player.gold < 5000000) return send('报名需要500万金币。');
        player.gold -= 5000000;
        try {
          await guildApi.registerSabak(player.guild.id);
          send('已报名沙巴克攻城，支付500万金币。');
        } catch {
          send('该行会已经报名。');
          player.gold += 5000000;
        }
        return;
      }
      return;
    }
    case 'vip': {
      const [subCmd, ...restArgs] = args.split(' ').filter(Boolean);
      const sub = (subCmd || 'status').toLowerCase();
      if (sub === 'status') {
        send(`VIP: ${player.flags?.vip ? '已开通' : '未开通'}`);
        return;
      }
      if (sub === 'activate') {
        const code = restArgs.join('').trim();
        if (!code) return send('请输入 VIP 激活码。');
        if (!guildApi?.useVipCode) return send('VIP系统不可用。');
        const used = await guildApi.useVipCode(code, player.userId);
        if (!used) return send('激活码无效或已使用。');
        player.flags.vip = true;
        send('VIP 已开通。');
        return;
      }
      if (sub === 'claim') {
        // VIP自助领取
        if (!guildApi?.getVipSelfClaimEnabled || !(await guildApi.getVipSelfClaimEnabled())) {
          return send('VIP自助领取功能已关闭。');
        }
        if (player.flags.vip) {
          return send('你已经是VIP了。');
        }
        if (!guildApi?.canUserClaimVip || !(await guildApi.canUserClaimVip(player.name))) {
          return send('每个角色只能领取一次VIP激活码。');
        }
        const codes = await guildApi?.createVipCodes?.(1);
        if (!codes || codes.length === 0) {
          return send('领取失败，请稍后重试。');
        }
        const used = await guildApi.useVipCode(codes[0], player.userId);
        if (!used) return send('激活失败，请稍后重试。');
        await guildApi.incrementCharacterVipClaimCount(player.name);
        player.flags.vip = true;
        send(`VIP 激活码领取成功！激活码: ${codes[0]}，已自动激活。`);
        return;
      }
      return;
    }
    case 'mail': {
      if (!mailApi) return send('邮件系统不可用。');
      const [subCmd, ...restArgs] = args.split(' ').filter(Boolean);
      const sub = (subCmd || 'list').toLowerCase();
      if (sub === 'list') {
        const mails = await mailApi.listMail(player.userId);
        if (!mails.length) return send('暂无邮件。');
        mails.slice(0, 10).forEach((m) => {
          const flag = m.read_at ? '已读' : '未读';
          send(`[${m.id}] ${m.title} (${flag})`);
        });
        return;
      }
      if (sub === 'read') {
        const mailId = Number(restArgs[0]);
        if (!mailId) return send('请输入邮件ID。');
        const mails = await mailApi.listMail(player.userId);
        const mail = mails.find((m) => m.id === mailId);
        if (!mail) return send('邮件不存在。');
        send(`标题: ${mail.title}`);
        send(`来自: ${mail.from_name}`);
        send(mail.body);
        await mailApi.markMailRead(player.userId, mailId);
        return;
      }
      return;
    }
    case 'trade': {
      if (!tradeApi) return send('交易系统不可用。');
      const [subCmd, ...restArgs] = args.split(' ').filter(Boolean);
      const sub = (subCmd || '').toLowerCase();
      const rest = restArgs.join(' ').trim();
      const target = rest;
      const trade = tradeApi.getTrade(player.name);

      if (!sub || sub === 'request') {
        if (!target) return send('请输入交易对象。');
        const res = tradeApi.requestTrade(player, target);
        send(res.msg);
        return;
      }

      if (sub === 'accept') {
        if (!target) return send('请输入交易对象。');
        const res = tradeApi.acceptTrade(player, target);
        if (!res.ok) send(res.msg);
        return;
      }

      if (sub === 'add') {
        if (!trade) return send('你不在交易中。');
        const [kind, ...restOffer] = restArgs;
        if (!kind) return;
        if (kind.toLowerCase() === 'gold') {
          const amount = Number(restOffer[0]);
          if (!amount || amount <= 0) return send('请输入金币数量。');
          const res = tradeApi.addGold(player, amount);
          if (!res.ok) return send(res.msg);
          const offer = trade.offers[player.name];
          const otherName = trade.a.name === player.name ? trade.b.name : trade.a.name;
          const other = players.find((p) => p.name === otherName);
          send(`你放入金币: ${amount} (总计 ${offer.gold})`);
          if (other) other.send(`${player.name} 放入金币: ${amount}`);
          return;
        }
        if (kind.toLowerCase() !== 'item') return;
        const offerParts = restOffer.slice();
        if (offerParts.length === 0) return send('请输入物品名称或ID。');
        let qty = 1;
        const last = offerParts[offerParts.length - 1];
        if (/^\d+$/.test(last)) {
          qty = Number(last);
          offerParts.pop();
        }
        const itemName = offerParts.join(' ');
        const resolved = resolveInventoryItem(player, itemName);
        if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
        const res = tradeApi.addItem(player, resolved.slot.id, qty, resolved.slot.effects || null);
        if (!res.ok) return send(res.msg);
        const otherName = trade.a.name === player.name ? trade.b.name : trade.a.name;
        const other = players.find((p) => p.name === otherName);
        const tags = [];
        if (resolved.slot.effects?.combo) tags.push('连击');
        if (resolved.slot.effects?.fury) tags.push('狂攻');
        if (resolved.slot.effects?.unbreakable) tags.push('不磨');
        const label = tags.length ? `${resolved.item.name}·${tags.join('·')}` : resolved.item.name;
        send(`你放入: ${label} x${qty}`);
        if (other) other.send(`${player.name} 放入: ${label} x${qty}`);
        return;
      }

      if (sub === 'lock') {
        if (!trade) return send('你不在交易中。');
        const res = tradeApi.lock(player);
        if (!res.ok) return send(res.msg);
        const otherName = trade.a.name === player.name ? trade.b.name : trade.a.name;
        const other = players.find((p) => p.name === otherName);
        send('你已锁定交易。');
        if (other) other.send(`${player.name} 已锁定交易。`);
        if (trade.locked[trade.a.name] && trade.locked[trade.b.name]) {
          send('双方已锁定。');
          if (other) other.send('双方已锁定。');
        }
        return;
      }

      if (sub === 'confirm') {
        if (!trade) return send('你不在交易中。');
        const res = tradeApi.confirm(player);
        if (!res.ok) return send(res.msg);
        const otherName = trade.a.name === player.name ? trade.b.name : trade.a.name;
        const other = players.find((p) => p.name === otherName);
        send('你已确认交易。');
        if (other) other.send(`${player.name} 已确认交易。`);
        if (trade.confirmed[trade.a.name] && trade.confirmed[trade.b.name]) {
          tradeApi.finalize(trade);
        }
        return;
      }

      if (sub === 'cancel') {
        const res = tradeApi.cancel(player);
        send(res.msg || '已取消交易。');
        return;
      }

      send('交易指令不可用。');
      return;
    }
    case 'vipclaim': {
      // 管理员控制VIP自助领取开关
      if (!guildApi?.setVipSelfClaimEnabled) return send('VIP设置功能不可用。');
      if (args === 'on' || args === 'open' || args === '启用') {
        await guildApi.setVipSelfClaimEnabled(true);
        send('VIP自助领取功能已开启。');
        return;
      }
      if (args === 'off' || args === 'close' || args === '关闭') {
        await guildApi.setVipSelfClaimEnabled(false);
        send('VIP自助领取功能已关闭。');
        return;
      }
      const enabled = await guildApi.getVipSelfClaimEnabled();
      send(`VIP自助领取功能状态: ${enabled ? '开启' : '关闭'}。`);
      return;
    }
    case 'rest': {
      player.hp = clamp(player.hp + 30, 1, player.max_hp);
      player.mp = clamp(player.mp + 20, 0, player.max_mp);
      send('你稍作休息，恢复了一些体力。');
      return;
    }
    case 'rank': {
      const subCmd = args.toLowerCase();
      let classId = '';
      let className = '';
      let attrName = '';

      if (subCmd === 'warrior') {
        classId = 'warrior';
        className = '战士';
        attrName = '攻击';
      } else if (subCmd === 'mage') {
        classId = 'mage';
        className = '法师';
        attrName = '魔法';
      } else if (subCmd === 'taoist') {
        classId = 'taoist';
        className = '道士';
        attrName = '道术';
      } else {
        send('用法: rank <职业> (warrior/mage/taoist)');
        return;
      }

      // 获取该服务器该职业的玩家（包括离线）
      const allClassPlayers = await allCharacters;
      const rankedPlayers = allClassPlayers
        .filter(p => p.classId === classId)
        .map(p => {
          // 计算派生属性
          computeDerived(p);
          return {
            name: p.name,
            level: p.level,
            atk: Math.floor(p.atk || 0),
            mag: Math.floor(p.mag || 0),
            spirit: Math.floor(p.spirit || 0)
          };
        })
        .sort((a, b) => {
          if (classId === 'warrior') return b.atk - a.atk;
          if (classId === 'mage') return b.mag - a.mag;
          return b.spirit - a.spirit;
        })
        .slice(0, 10);

      if (rankedPlayers.length === 0) {
        send(`${className}排行榜: 暂无数据`);
        return;
      }

      const rankText = rankedPlayers.map((p, idx) => {
        const attrValue = classId === 'warrior' ? p.atk :
                         classId === 'mage' ? p.mag : p.spirit;
        return `${idx + 1}.${p.name}(${attrValue})`;
      }).join(' ');

      send(`${className}排行榜: ${rankText}`);

      return;
    }
    case 'update_rank': {
      // 手动更新排行榜称号（仅管理员或测试用）
      // 不对外开放，只用于调试
      const currentRealmId = realmId || player.realmId || 1;

      const classes = [
        { id: 'warrior', name: '战士' },
        { id: 'mage', name: '法师' },
        { id: 'taoist', name: '道士' }
      ];

      for (const cls of classes) {
        try {
          const allClassPlayers = allCharacters.filter(p => p.classId === cls.id);

          const rankedPlayers = allClassPlayers
            .map(p => {
              computeDerived(p);
              return {
                name: p.name,
                atk: Math.floor(p.atk || 0),
                mag: Math.floor(p.mag || 0),
                spirit: Math.floor(p.spirit || 0)
              };
            })
            .sort((a, b) => {
              if (cls.id === 'warrior') return b.atk - a.atk;
              if (cls.id === 'mage') return b.mag - a.mag;
              return b.spirit - a.spirit;
            });

          // 清除该职业所有玩家的排行榜称号
          await knex('characters')
            .where({ class: cls.id, realm_id: currentRealmId })
            .update({ rank_title: null });

          // 为第一名设置称号
          if (rankedPlayers.length > 0) {
            const topPlayer = rankedPlayers[0];
            const rankTitle = `天下第一${cls.name}`;
            await knex('characters')
              .where({ name: topPlayer.name, realm_id: currentRealmId })
              .update({ rank_title: rankTitle });

            // 如果第一名在线，通知玩家
            const topPlayerObj = playersByName ? playersByName(topPlayer.name, currentRealmId) : null;
            if (topPlayerObj) {
              topPlayerObj.send(`恭喜！你已成为${cls.name}排行榜第一名，获得称号：${rankTitle}`);
              topPlayerObj.rankTitle = rankTitle;
            }

            // 通知该职业其他在线玩家称号被清除
            for (const p of allClassPlayers) {
              if (p.name !== topPlayer.name) {
                const playerObj = playersByName ? playersByName(p.name, currentRealmId) : null;
                if (playerObj && playerObj.rankTitle) {
                  playerObj.send(`你已不再是${cls.name}排行榜第一名，称号已被收回`);
                  playerObj.rankTitle = null;
                }
              }
            }
          }
        } catch (err) {
          console.error(`[Rank] 更新${cls.name}排行榜失败:`, err);
        }
      }

      send('排行榜称号已更新');
      return;
    }
    default:
      return;
  }
}

export function awardKill(player, mobTemplateId) {
  computeDerived(player);
}
