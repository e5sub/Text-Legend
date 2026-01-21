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
import { QUESTS } from './quests.js';
import { addItem, removeItem, equipItem, unequipItem, bagLimit, gainExp, computeDerived, getDurabilityMax, getRepairCost, getItemKey } from './player.js';
import { CLASSES, expForLevel } from './constants.js';
import { getRoom, getAliveMobs, spawnMobs } from './state.js';
import { clamp } from './utils.js';
import { applyDamage } from './combat.js';

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
  down: '下'
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
  下: 'down'
};
const TRAINING_OPTIONS = {
  hp: { label: '生命', inc: 10 },
  mp: { label: '魔法值', inc: 10 },
  atk: { label: '攻击', inc: 1 },
  def: { label: '防御', inc: 1 },
  mag: { label: '魔法', inc: 1 },
  mdef: { label: '魔御', inc: 1 },
  spirit: { label: '道术', inc: 1 },
  dex: { label: '躲闪', inc: 1 }
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
  敏捷: 'dex',
  躲闪: 'dex'
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

function listMobs(zoneId, roomId) {
  spawnMobs(zoneId, roomId);
  const mobs = getAliveMobs(zoneId, roomId);
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

function formatInventory(player) {
  if (player.inventory.length === 0) return '背包为空。';
  return player.inventory
    .map((i) => {
      const item = ITEM_TEMPLATES[i.id];
      return `${item.name} x${i.qty}`;
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
    `生命: ${player.hp}/${player.max_hp}`,
    `魔法: ${player.mp}/${player.max_mp}`,
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
  const room = zone.rooms[player.position.room];
  const exits = Object.entries(room.exits)
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
      return `${name}`;
    })
    .join(', ');
  send(`当前位置: ${roomLabel(player)}`);
  send(room.desc);
  send(`出口: ${exits || '无'}`);
  if (room.npcs && room.npcs.length) {
    send(`NPC: ${room.npcs.map((id) => NPCS[id].name).join(', ')}`);
  }
  send(`怪物: ${listMobs(player.position.zone, player.position.room)}`);
}

function canShop(player) {
  return Boolean(shopForRoom(player.position.room));
}

function isSabakOwnerMember(player, guildApi) {
  return Boolean(
    player.guild && guildApi?.sabakState?.ownerGuildId && player.guild.id === guildApi.sabakState.ownerGuildId
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

function skillByName(player, name) {
  if (!name) return null;
  const list = getLearnedSkills(player);
  const target = name.toLowerCase();
  return list.find((s) => s.id === target || s.name.toLowerCase() === target);
}

function trainingCost(player, key) {
  const training = player.flags?.training || {};
  const current = Number(training[key] || 0);
  const base = 10000;
  const steps = Math.floor(current / TRAINING_OPTIONS[key].inc);
  return Math.max(1, Math.floor(base + steps * (base * 0.2)));
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

export function summonStats(player, skill, summonLevelOverride = null) {
  const base = skill.summon;
  const skillLevel = getSkillLevel(player, skill.id);
  const desiredLevel = summonLevelOverride ?? skillLevel ?? 1;
  const summonLevel = Math.max(1, Math.min(8, Math.floor(desiredLevel)));
  const level = summonLevel;
  const increase = Math.min((level - 1) * 1.25, 10);
  const multiplier = 1 + increase;
  const max_hp = Math.floor(base.baseHp * multiplier);
  const atk = Math.floor(base.baseAtk * multiplier);
  const def = Math.floor(base.baseDef * multiplier);
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

export async function handleCommand({ player, players, input, send, partyApi, guildApi, tradeApi, mailApi, consignApi }) {
  const [cmdRaw, ...rest] = input.trim().split(' ');
  const cmd = (cmdRaw || '').toLowerCase();
  const args = rest.join(' ').trim();

  if (!cmd) return;

  switch (cmd) {
    case 'help': {
      send('指令: help, look, go <方向/地点>, say <内容>, who, stats, bag, equip <物品>, unequip <部位>, use <物品>, attack <怪物/玩家>, pk <玩家>, cast <技能> <怪物>, autoskill <技能/off>, autopotion <hp%> <mp%>, shop, buy <物品>, buy list, sell <物品>, consign, train <属性>, quests, accept <id>, complete <id>, party, guild, guild kick <玩家>, gsay, sabak, vip, trade, mail, teleport。部位示例: ring_left, ring_right, bracelet_left, bracelet_right。');
      return;
    }
    case 'look': {
      sendRoomDescription(player, send);
      send(listPlayers(players, player));
      return;
    }
    case 'go':
    case 'move': {
      const room = getRoom(player.position.zone, player.position.room);
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
        const [zoneId, roomId] = dest.split(':');
        const targetRoom = WORLD[zoneId]?.rooms?.[roomId];
        if (targetRoom?.sabakOnly) {
          if (!player.guild || !guildApi?.sabakState?.ownerGuildId || player.guild.id !== guildApi.sabakState.ownerGuildId) {
            send('只有沙巴克城主行会成员可以进入该区域。');
            return;
          }
        }
        player.position.zone = zoneId;
        player.position.room = roomId;
      } else {
        const targetRoom = WORLD[player.position.zone]?.rooms?.[dest];
        if (targetRoom?.sabakOnly) {
          if (!player.guild || !guildApi?.sabakState?.ownerGuildId || player.guild.id !== guildApi.sabakState.ownerGuildId) {
            send('只有沙巴克城主行会成员可以进入该区域。');
            return;
          }
        }
        player.position.room = dest;
      }
      const zone = WORLD[player.position.zone];
      const roomName = zone?.rooms[player.position.room]?.name;
      send(`你前往 ${roomName || dirLabel(dir)}。`);
      sendRoomDescription(player, send);
      return;
    }
    case 'goto_room': {
      if (!args) return send('要前往哪个房间？');
      let zoneId = '';
      let roomId = '';
      if (args.includes(':')) {
        [zoneId, roomId] = args.split(':');
      } else {
        const parts = args.split(' ').filter(Boolean);
        zoneId = parts[0];
        roomId = parts[1];
      }
      if (!zoneId || !roomId || !WORLD[zoneId] || !WORLD[zoneId].rooms[roomId]) {
        return send('目标地点无效。');
      }
      if (!isWorldBossRoom(zoneId, roomId)) {
        return send('该地点无法直接前往。');
      }
      player.position.zone = zoneId;
      player.position.room = roomId;
      send('你已前往世界BOSS房间。');
      sendRoomDescription(player, send);
      return;
    }
    case 'goto': {
      if (!args) return send('要前往哪个玩家？');
      const target = players.find((p) => p.name === args);
      if (!target) return send('玩家不在线。');
      player.position.zone = target.position.zone;
      player.position.room = target.position.room;
      send(`你前往 ${target.name} 的位置。`);
      sendRoomDescription(player, send);
      return;
    }
    case 'say': {
      if (!args) return;
      players.forEach((p) => p.send(`[${player.name}] ${args}`));
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
    case 'bag': {
      send(`背包 (${player.inventory.length}/${bagLimit(player)}): ${formatInventory(player)}`);
      return;
    }
    case 'equip': {
      if (!args) return send('要装备哪件物品？');
      const resolved = resolveInventoryItem(player, args);
      if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
      const res = equipItem(player, resolved.slot.id, resolved.slot.effects || null);
      send(res.msg);
      return;
    }
    case 'unequip': {
      if (!args) return send('要卸下哪个部位？');
      const res = unequipItem(player, args);
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
        send(`学会技能: ${skill.name}。`);
        return;
      }
      if (!removeItem(player, item.id, 1, resolved.slot.effects)) return send('背包里没有该物品。');
      if (item.type !== 'consumable') {
        addItem(player, item.id, 1, resolved.slot.effects);
        return send('该物品无法使用。');
      }
      if (item.teleport && !item.hp && !item.mp) {
        player.position = { ...item.teleport };
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
        send(`使用了 ${item.name}，将持续恢复 5 秒。`);
        return;
      }
      return;
    }
    case 'attack':
    case 'kill': {
      if (!args) return send('要攻击哪个怪物？');
      const mobs = getAliveMobs(player.position.zone, player.position.room);
      const target = mobs.find((m) => m.name.toLowerCase() === args.toLowerCase() || m.id === args);
      if (!target) {
        const pvpTarget = players.find(
          (p) => p.name.toLowerCase() === args.toLowerCase() && p.name !== player.name &&
            p.position.zone === player.position.zone && p.position.room === player.position.room
        );
        if (!pvpTarget) return send('未找到目标。');
        if (
          isSabakZone(player.position.zone) &&
          player.guild &&
          pvpTarget.guild &&
          player.guild.id === pvpTarget.guild.id
        ) {
          return send('沙巴克内不能攻击同一行会成员。');
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
      if (
        isSabakZone(player.position.zone) &&
        player.guild &&
        pvpTarget.guild &&
        player.guild.id === pvpTarget.guild.id
      ) {
        return send('沙巴克内不能攻击同一行会成员。');
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
        const summon = player.summon ? { ...player.summon, isSummon: true } : null;
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
            const candidates = players.filter(
              (p) =>
                party.members.includes(p.name) &&
                p.position.zone === player.position.zone &&
                p.position.room === player.position.room
            );
            if (summon) candidates.push(summon);
            if (candidates.length) {
              candidates.sort((a, b) => (a.hp / a.max_hp) - (b.hp / b.max_hp));
              target = candidates[0];
            }
          } else if (summon) {
            target = summon;
          }
        }
        player.mp -= skill.mp;
        const baseHeal = Math.floor((player.spirit || 0) * 0.8 * power + player.level * 4);
        if (target.isSummon) {
          player.summon.hp = clamp(player.summon.hp + baseHeal, 1, player.summon.max_hp);
          send(`你为 ${player.summon.name} 施放了 ${skill.name}，恢复 ${baseHeal} 点生命。`);
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
      if (skill.type === 'summon') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const summon = summonStats(player, skill, skillLevel);
        player.summon = { ...summon, exp: 0 };
        send(`你召唤了 ${summon.name} (等级 ${summon.level})。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'buff_shield') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 120 + skillLevel * 60;
        applyBuff(player, {
          key: 'magicShield',
          expiresAt: Date.now() + duration * 1000,
          ratio: 0.6 + (skillLevel - 1) * 0.1
        });
        send(`你施放了 ${skill.name}，护盾持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'buff_def') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 120 + skillLevel * 60;
        const base = skill.id === 'ghost' ? 4 : 6;
        const defBonus = base + skillLevel * 2;
        const party = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
        const targets = party
          ? players.filter(
              (p) =>
                party.members.includes(p.name) &&
                p.position.zone === player.position.zone &&
                p.position.room === player.position.room
            )
          : [player];
        targets.forEach((p) => {
          applyBuff(p, { key: 'defBuff', expiresAt: Date.now() + duration * 1000, defBonus });
          p.send(`${player.name} 为你施放了 ${skill.name}。`);
        });
        send(`你施放了 ${skill.name}，持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'stealth' || skill.type === 'stealth_group') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const duration = 90 + skillLevel * 45;
        const party = partyApi?.getPartyByMember ? partyApi.getPartyByMember(player.name) : null;
        const targets = skill.type === 'stealth_group' && party
          ? players.filter(
              (p) =>
                party.members.includes(p.name) &&
                p.position.zone === player.position.zone &&
                p.position.room === player.position.room
            )
          : [player];
        targets.forEach((p) => {
          applyBuff(p, { key: 'invisible', expiresAt: Date.now() + duration * 1000 });
          p.send(`${player.name} 为你施放了 ${skill.name}。`);
        });
        send(`你施放了 ${skill.name}，持续 ${duration} 秒。`);
        notifyMastery(player, skill);
        return;
      }
      if (skill.type === 'repel') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const mobs = getAliveMobs(player.position.zone, player.position.room);
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
        const hasGreen = player.inventory.find((i) => i.id === 'powder_green' && i.qty > 0);
        const hasRed = player.inventory.find((i) => i.id === 'powder_red' && i.qty > 0);
        if (!hasGreen || !hasRed) return send('施毒术需要绿色药粉和红色药粉。');
      }
      const mobs = getAliveMobs(player.position.zone, player.position.room);
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
      if (Number.isNaN(hpPct) || Number.isNaN(mpPct)) return send('格式: autopotion <hp%> <mp%>');
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
      if (Number.isNaN(qty) || qty <= 0) return send('购买数量无效。');
      const name = parts.join(' ');
      const stock = getShopStock(player);
      const item = stock.find((i) => i.name.toLowerCase() === name.toLowerCase() || i.id === name);
      if (!item) return send('这里不卖该物品。');
        let totalPrice = item.price * qty;
        if (isSabakOwnerMember(player, guildApi) && item.type === 'consumable' && (item.hp || item.mp)) {
          totalPrice = Math.max(1, Math.floor(totalPrice * 0.8));
        }
        if (player.gold < totalPrice) return send('金币不足。');
      player.gold -= totalPrice;
      const unitQty = ['powder_green', 'powder_red'].includes(item.id) ? 100 : 1;
      const totalQty = unitQty * qty;
      addItem(player, item.id, totalQty);
      send(`购买了 ${item.name} x${totalQty}，花费 ${totalPrice} 金币。`);
      return;
    }
    case 'shop': {
      if (!canShop(player)) return send('这里没有商店。');
      const stock = getShopStock(player);
      if (!stock.length) return send('商店暂无商品。');
      send(`商店商品: ${stock.map((i) => `${i.name}(${i.price}金)`).join(', ')}`);
      send('购买指令: buy <物品名> [数量] 或 buy list 查看。');
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
      const name = parts.join(' ');
      const resolved = resolveInventoryItem(player, name);
      if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
      const item = resolved.item;
      if (item.type === 'currency') return send('金币无法出售。');
      if (!removeItem(player, item.id, qty, resolved.slot.effects)) return send('背包里没有足够数量。');
      const price = Math.max(1, Math.floor((item.price || 10) * 0.5));
      const total = price * qty;
      player.gold += total;
      send(`卖出 ${item.name} x${qty}，获得 ${total} 金币。`);
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
        if (sub === 'sell') {
          if (parts.length < 3) return send('格式: consign sell <物品> <数量> <单价>');
          const price = Number(parts.pop());
          const qty = Number(parts.pop());
          const name = parts.join(' ');
          if (!name || Number.isNaN(price) || Number.isNaN(qty)) {
            return send('格式: consign sell <物品> <数量> <单价>');
          }
          const resolved = resolveInventoryItem(player, name);
          if (!resolved.slot || !resolved.item) return send('背包里没有该物品。');
          const res = await consignApi.sell(player, resolved.slot.id, qty, price, resolved.slot.effects || null);
          send(res.msg);
          return;
        }
      if (sub === 'buy') {
        if (parts.length < 1) return send('格式: consign buy <编号> [数量]');
        const id = Number(parts[0]);
        const qty = parts.length > 1 ? Number(parts[1]) : 1;
        if (Number.isNaN(id) || Number.isNaN(qty)) return send('格式: consign buy <编号> [数量]');
        const res = await consignApi.buy(player, id, qty);
        send(res.msg);
        return;
      }
      if (sub === 'cancel') {
        if (parts.length < 1) return send('格式: consign cancel <编号>');
        const id = Number(parts[0]);
        if (Number.isNaN(id)) return send('格式: consign cancel <编号>');
        const res = await consignApi.cancel(player, id);
        send(res.msg);
        return;
      }
      send('寄售指令: consign list | consign my | consign sell <物品> <数量> <单价> | consign buy <编号> [数量] | consign cancel <编号>');
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
      send(`修理完成，花费 ${total} 金币。`);
      return;
    }
    case 'quests': {
      const list = Object.values(QUESTS).map((q) => `任务: ${q.name} - ${q.desc}`);
      send(list.join('\n'));
      return;
    }
    case 'train': {
      if (!player.flags) player.flags = {};
      if (!player.flags.training) {
        player.flags.training = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
      }
      if (!args) {
        send('修炼指令: train <属性>');
        Object.keys(TRAINING_OPTIONS).forEach((key) => {
          const info = TRAINING_OPTIONS[key];
          const cost = trainingCost(player, key);
          const current = player.flags.training[key] || 0;
          send(`${info.label}: 当前 +${current}, 消耗 ${cost} 金币, 提升 +${info.inc}`);
        });
        return;
      }
      const raw = args.trim();
      const key = TRAINING_ALIASES[raw] || TRAINING_ALIASES[raw.toLowerCase()];
      if (!key || !TRAINING_OPTIONS[key]) return send('可修炼属性: 生命, 魔法值, 攻击, 防御, 魔法, 魔御, 道术, 躲闪');
      const cost = trainingCost(player, key);
      if (player.gold < cost) return send('金币不足。');
      player.gold -= cost;
      player.flags.training[key] = (player.flags.training[key] || 0) + TRAINING_OPTIONS[key].inc;
      computeDerived(player);
      send(`修炼成功: ${TRAINING_OPTIONS[key].label} +${TRAINING_OPTIONS[key].inc} (累计 +${player.flags.training[key]})。`);
      send(`消耗 ${cost} 金币。`);
      return;
    }
    case 'accept': {
      if (!args) return send('要接受哪个任务？');
      const quest = Object.values(QUESTS).find((q) => q.id === args || q.name === args);
      if (!quest) return send('未找到任务。');
      if (player.quests[quest.id]) return send('任务已在进行中。');
      player.quests[quest.id] = { progress: {}, completed: false };
      send(`已接受任务: ${quest.name}`);
      return;
    }
    case 'complete': {
      if (!args) return send('要完成哪个任务？');
      const quest = Object.values(QUESTS).find((q) => q.id === args || q.name === args);
      const state = quest ? player.quests[quest.id] : null;
      if (!quest || !state) return send('该任务未接受。');
      if (state.completed) return send('任务已完成。');
      const goals = quest.goals.kill || {};
      const progress = state.progress.kill || {};
      const done = Object.keys(goals).every((k) => (progress[k] || 0) >= goals[k]);
      if (!done) return send('任务尚未完成。');
      state.completed = true;
      const expGain = quest.rewards.exp || 0;
      const goldGain = quest.rewards.gold || 0;
      const leveled = expGain ? gainExp(player, expGain) : false;
      player.gold += goldGain;
      const rewardItems = quest.rewards.items || [];
      rewardItems.forEach((id) => addItem(player, id, 1));
      send(`任务完成: ${quest.name}`);
      if (expGain || goldGain) {
        send(`获得奖励: 经验 ${expGain}，金币 ${goldGain}`);
      }
      if (rewardItems.length) {
        send(`获得物品: ${rewardItems.map((id) => ITEM_TEMPLATES[id]?.name || id).join(', ')}`);
      }
      if (leveled) send('你升级了！');
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
        partyApi.createParty(player.name);
        send('已创建队伍。');
        return;
      }
      if (sub === 'invite') {
        if (!targetName) return send('邀请谁加入队伍？');
        const target = players.find((p) => p.name === targetName);
        if (!target) return send('玩家不在线。');
        if (partyApi.getPartyByMember(target.name)) {
          return send('对方已有队伍，请先退出组队再邀请。');
        }
        const myParty = party || partyApi.createParty(player.name);
        if (myParty.members.length >= PARTY_LIMIT) return send('队伍已满。');
        if (myParty.members.includes(target.name)) return send('对方已在队伍中。');
        myParty.members.push(target.name);
        send(`${target.name} 已加入队伍。`);
        target.send(`你已加入 ${player.name} 的队伍。`);
        return;
      }
      if (sub === 'accept') {
        send('队伍邀请无需接受，邀请后会自动入队。');
        return;
      }
      if (sub === 'leave') {
        if (!party) return send('你不在队伍中。');
        partyApi.removeFromParty(player.name);
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
        const guildId = await guildApi.createGuild(nameArg, player.userId, player.name);
        player.guild = { id: guildId, name: nameArg, role: 'leader' };
        send(`行会创建成功: ${nameArg}`);
        return;
      }

      if (sub === 'invite') {
        if (!player.guild) return send('你不在行会中。');
        const target = players.find((p) => p.name === nameArg);
        if (!target) return send('玩家不在线。');
        if (target.guild) return send('对方已有行会，请先退出行会再邀请。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader) return send('只有会长可以邀请。');
        const members = await guildApi.listGuildMembers(player.guild.id);
        if (members.length >= 5) return send('行会人数已满(5人)。');
        await guildApi.addGuildMember(player.guild.id, target.userId, target.name);
        target.guild = { id: player.guild.id, name: player.guild.name, role: 'member' };
        send(`${target.name} 已加入行会。`);
        target.send(`你已加入行会 ${player.guild.name}。`);
        return;
      }

      if (sub === 'kick' || sub === 'remove') {
        if (!player.guild) return send('你不在行会中。');
        const target = players.find((p) => p.name === nameArg);
        if (!target) return send('玩家不在线。');
        if (!target.guild || target.guild.id !== player.guild.id) return send('对方不在你的行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader) return send('只有会长可以踢人。');
        if (target.guild.role === 'leader') return send('不能踢出会长。');
        await guildApi.removeGuildMember(player.guild.id, target.userId, target.name);
        target.guild = null;
        send(`已将 ${target.name} 移出行会。`);
        target.send('你已被移出行会。');
        return;
      }

      if (sub === 'accept') {
        send('行会邀请无需接受，邀请后会自动加入。');
        return;
      }

      if (sub === 'leave') {
        if (!player.guild) return send('你不在行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (isLeader) return send('会长不能直接退出行会。');
        await guildApi.removeGuildMember(player.guild.id, player.userId, player.name);
        player.guild = null;
        send('你已退出行会。');
        return;
      }

      if (sub === 'info') {
        if (!player.guild) return send('你不在行会中。');
        const members = await guildApi.listGuildMembers(player.guild.id);
        send(`行会: ${player.guild.name}`);
        send(`成员: ${members.map((m) => `${m.char_name}(${m.role})`).join(', ')}`);
        return;
      }

      send('行会指令: guild create <名>, guild invite <玩家>, guild kick <玩家>, guild accept <名>, guild leave, guild info');
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
        try {
          await guildApi.registerSabak(player.guild.id);
          send('已报名沙巴克攻城。');
        } catch {
          send('该行会已经报名。');
        }
        return;
      }
      send('沙巴克指令: sabak status | sabak register');
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
      send('VIP指令: vip status | vip activate <code>');
      return;
    }
    case 'teleport': {
      if (!player.equipment || !Object.values(player.equipment).some((e) => e && e.id === 'ring_teleport')) {
        return send('需要佩戴传送戒指。');
      }
      if (!args) return send('格式: teleport <区域:房间> 或 teleport <区域> <房间>');
      let zoneId = '';
      let roomId = '';
      if (args.includes(':')) {
        [zoneId, roomId] = args.split(':');
      } else {
        const parts = args.split(' ').filter(Boolean);
        zoneId = parts[0];
        roomId = parts[1];
      }
      if (!zoneId || !roomId || !WORLD[zoneId] || !WORLD[zoneId].rooms[roomId]) {
        return send('目标地点无效。');
      }
      const targetRoom = WORLD[zoneId].rooms[roomId];
      if (targetRoom?.sabakOnly) {
        if (!player.guild || !guildApi?.sabakState?.ownerGuildId || player.guild.id !== guildApi.sabakState.ownerGuildId) {
          return send('只有沙巴克城主行会成员可以进入该区域。');
        }
      }
      player.position.zone = zoneId;
      player.position.room = roomId;
      send(`你使用传送戒指前往 ${WORLD[zoneId].rooms[roomId].name}。`);
      sendRoomDescription(player, send);
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
      send('邮件指令: mail list | mail read <id>');
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
        if (!kind) return send('格式: trade add item <物品> <数量> | trade add gold <数量>');
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
        if (kind.toLowerCase() !== 'item') return send('格式: trade add item <物品> <数量>');
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
          send('双方已锁定，请输入 trade confirm 确认交易。');
          if (other) other.send('双方已锁定，请输入 trade confirm 确认交易。');
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

      send('交易指令: trade request <玩家> | trade accept <玩家> | trade add item <物品> <数量> | trade add gold <数量> | trade lock | trade confirm | trade cancel');
      return;
    }
    case 'rest': {
      player.hp = clamp(player.hp + 30, 1, player.max_hp);
      player.mp = clamp(player.mp + 20, 0, player.max_mp);
      send('你稍作休息，恢复了一些体力。');
      return;
    }
    default:
      send('未知指令，请输入 help。');
  }
}

export function awardKill(player, mobTemplateId) {
  for (const [questId, state] of Object.entries(player.quests)) {
    if (state.completed) continue;
    const quest = QUESTS[questId];
    if (!quest || !quest.goals.kill) continue;
    state.progress.kill = state.progress.kill || {};
    if (quest.goals.kill[mobTemplateId]) {
      state.progress.kill[mobTemplateId] = (state.progress.kill[mobTemplateId] || 0) + 1;
    }
  }
  computeDerived(player);
}
