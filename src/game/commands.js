import { WORLD, NPCS } from './world.js';
import { ITEM_TEMPLATES, SHOP_STOCKS } from './items.js';
import { SKILLS } from './skills.js';
import { QUESTS } from './quests.js';
import { addItem, removeItem, equipItem, unequipItem, bagLimit, gainExp, computeDerived } from './player.js';
import { CLASSES, expForLevel } from './constants.js';
import { getRoom, getRoomMobs, spawnMobs } from './state.js';
import { clamp } from './utils.js';

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
  const mobs = spawnMobs(zoneId, roomId);
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
    ring: '戒指',
    bracelet: '手镯',
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
  const exits = Object.keys(room.exits).map((dir) => dirLabel(dir)).join(', ');
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

function getShopStock(player) {
  const shopId = shopForRoom(player.position.room);
  if (!shopId) return [];
  return SHOP_STOCKS[shopId].map((id) => ITEM_TEMPLATES[id]);
}

function skillByName(classId, name) {
  const list = Object.values(SKILLS[classId] || {});
  return list.find((s) => s.id === name || s.name.toLowerCase() === name.toLowerCase());
}

function partyStatus(party) {
  if (!party) return '你不在队伍中。';
  return `队伍成员: ${party.members.join(', ')}`;
}

export async function handleCommand({ player, players, input, send, partyApi, guildApi, mailApi }) {
  const [cmdRaw, ...rest] = input.trim().split(' ');
  const cmd = (cmdRaw || '').toLowerCase();
  const args = rest.join(' ').trim();

  if (!cmd) return;

  switch (cmd) {
    case 'help': {
      send('指令: help, look, go <方向>, say <内容>, who, stats, bag, equip <物品>, unequip <部位>, use <物品>, attack <怪物/玩家>, pk <玩家>, cast <技能> <怪物>, autoskill <技能/off>, autopotion <hp%> <mp%>, buy <物品>, sell <物品>, quests, accept <id>, complete <id>, party, guild, gsay, sabak, vip, mail, teleport。');
      return;
    }
    case 'look': {
      sendRoomDescription(player, send);
      send(listPlayers(players, player));
      return;
    }
    case 'go':
    case 'move': {
      const dir = normalizeDirection(args);
      const room = getRoom(player.position.zone, player.position.room);
      if (!dir || !room.exits[dir]) {
        send('方向无效。');
        return;
      }
      const dest = room.exits[dir];
      if (dest.includes(':')) {
        const [zoneId, roomId] = dest.split(':');
        player.position.zone = zoneId;
        player.position.room = roomId;
      } else {
        player.position.room = dest;
      }
      send(`你向 ${dirLabel(dir)} 移动。`);
      sendRoomDescription(player, send);
      return;
    }
    case 'say': {
      if (!args) return;
      players
        .filter((p) => p.position.zone === player.position.zone && p.position.room === player.position.room)
        .forEach((p) => p.send(`[${player.name}] ${args}`));
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
      const item = Object.values(ITEM_TEMPLATES).find((i) => i.name.toLowerCase() === args.toLowerCase() || i.id === args);
      if (!item) return send('未找到物品。');
      const res = equipItem(player, item.id);
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
      const item = Object.values(ITEM_TEMPLATES).find((i) => i.name.toLowerCase() === args.toLowerCase() || i.id === args);
      if (!item) return send('未找到物品。');
      if (!removeItem(player, item.id, 1)) return send('背包里没有该物品。');
      if (item.type !== 'consumable') {
        addItem(player, item.id, 1);
        return send('该物品无法使用。');
      }
      if (item.hp) player.hp = clamp(player.hp + item.hp, 1, player.max_hp);
      if (item.mp) player.mp = clamp(player.mp + item.mp, 0, player.max_mp);
      if (item.teleport) {
        player.position = { ...item.teleport };
      }
      send(`使用了 ${item.name}。`);
      return;
    }
    case 'attack':
    case 'kill': {
      if (!args) return send('要攻击哪个怪物？');
      const mobs = getRoomMobs(player.position.zone, player.position.room);
      const target = mobs.find((m) => m.name.toLowerCase() === args.toLowerCase() || m.id === args);
      if (!target) {
        const pvpTarget = players.find(
          (p) => p.name.toLowerCase() === args.toLowerCase() && p.name !== player.name &&
            p.position.zone === player.position.zone && p.position.room === player.position.room
        );
        if (!pvpTarget) return send('未找到目标。');
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
      player.combat = { targetId: pvpTarget.name, targetType: 'player', skillId: 'slash' };
      send(`你开始攻击 ${pvpTarget.name}。`);
      return;
    }
    case 'cast': {
      const parts = args.split(' ').filter(Boolean);
      if (parts.length < 1) return send('要施放哪个技能？');
      const skillName = parts[0];
      const targetName = parts.slice(1).join(' ');
      const skill = skillByName(player.classId, skillName);
      if (!skill) return send('未找到技能。');
      if (skill.type === 'heal') {
        if (player.mp < skill.mp) return send('魔法不足。');
        player.mp -= skill.mp;
        const heal = Math.floor(player.mag * 0.8 * skill.power + player.level * 4);
        player.hp = clamp(player.hp + heal, 1, player.max_hp);
        send(`你施放了 ${skill.name}，恢复 ${heal} 点生命。`);
        return;
      }
      const mobs = getRoomMobs(player.position.zone, player.position.room);
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
      if (args.toLowerCase() === 'off') {
        if (player.flags) player.flags.autoSkillId = null;
        send('已关闭自动技能。');
        return;
      }
      const skill = skillByName(player.classId, args);
      if (!skill) return send('未找到技能。');
      if (!player.flags) player.flags = {};
      player.flags.autoSkillId = skill.id;
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
      const stock = getShopStock(player);
      const item = stock.find((i) => i.name.toLowerCase() === args.toLowerCase() || i.id === args);
      if (!item) return send('这里不卖该物品。');
      if (player.gold < item.price) return send('金币不足。');
      player.gold -= item.price;
      addItem(player, item.id, 1);
      send(`购买了 ${item.name}，花费 ${item.price} 金币。`);
      return;
    }
    case 'sell': {
      if (!canShop(player)) return send('这里没有商店。');
      if (!args) return send('要卖什么？');
      const item = Object.values(ITEM_TEMPLATES).find((i) => i.name.toLowerCase() === args.toLowerCase() || i.id === args);
      if (!item) return send('未找到物品。');
      if (!removeItem(player, item.id, 1)) return send('背包里没有该物品。');
      const price = Math.max(1, Math.floor((item.price || 10) * 0.5));
      player.gold += price;
      send(`卖出 ${item.name}，获得 ${price} 金币。`);
      return;
    }
    case 'quests': {
      const list = Object.values(QUESTS).map((q) => `任务: ${q.name} - ${q.desc}`);
      send(list.join('\n'));
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
      const goals = quest.goals.kill || {};
      const progress = state.progress.kill || {};
      const done = Object.keys(goals).every((k) => (progress[k] || 0) >= goals[k]);
      if (!done) return send('任务尚未完成。');
      state.completed = true;
      gainExp(player, quest.rewards.exp || 0);
      player.gold += quest.rewards.gold || 0;
      if (quest.rewards.items) quest.rewards.items.forEach((id) => addItem(player, id, 1));
      send(`任务完成: ${quest.name}`);
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
        const myParty = party || partyApi.createParty(player.name);
        if (myParty.members.length >= PARTY_LIMIT) return send('队伍已满。');
        if (myParty.members.includes(target.name)) return send('对方已在队伍中。');
        partyApi.invites.set(target.name, player.name);
        send(`已邀请 ${target.name} 加入队伍。`);
        target.send(`${player.name} 邀请你加入队伍，输入 party accept ${player.name} 接受。`);
        return;
      }
      if (sub === 'accept') {
        const inviterName = targetName;
        if (!inviterName) return send('请输入邀请者名字。');
        const inviteFrom = partyApi.invites.get(player.name);
        if (inviteFrom !== inviterName) return send('没有该邀请。');
        const inviterParty = partyApi.getPartyByMember(inviterName) || partyApi.createParty(inviterName);
        if (inviterParty.members.length >= PARTY_LIMIT) return send('队伍已满。');
        inviterParty.members.push(player.name);
        partyApi.invites.delete(player.name);
        send(`已加入 ${inviterName} 的队伍。`);
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
        const hasBar = player.inventory.find((i) => i.id === 'gold_bar' && i.qty >= 1);
        if (!hasHorn || !hasBar) return send('创建行会需要沃玛号角和金条。');
        removeItem(player, 'woma_horn', 1);
        removeItem(player, 'gold_bar', 1);
        const guildId = await guildApi.createGuild(nameArg, player.userId, player.name);
        player.guild = { id: guildId, name: nameArg, role: 'leader' };
        send(`行会创建成功: ${nameArg}`);
        return;
      }

      if (sub === 'invite') {
        if (!player.guild) return send('你不在行会中。');
        const target = players.find((p) => p.name === nameArg);
        if (!target) return send('玩家不在线。');
        if (target.guild) return send('对方已在行会中。');
        const isLeader = await guildApi.isGuildLeader(player.guild.id, player.userId, player.name);
        if (!isLeader) return send('只有会长可以邀请。');
        guildApi.invites.set(target.name, { guildId: player.guild.id, guildName: player.guild.name, from: player.name });
        send(`已邀请 ${target.name} 加入行会。`);
        target.send(`${player.name} 邀请你加入行会 ${player.guild.name}，输入 guild accept ${player.guild.name} 接受。`);
        return;
      }

      if (sub === 'accept') {
        const invite = guildApi.invites.get(player.name);
        if (!invite || invite.guildName !== nameArg) return send('没有该行会邀请。');
        await guildApi.addGuildMember(invite.guildId, player.userId, player.name);
        player.guild = { id: invite.guildId, name: invite.guildName, role: 'member' };
        guildApi.invites.delete(player.name);
        send(`已加入行会: ${invite.guildName}`);
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

      send('行会指令: guild create <名>, guild invite <玩家>, guild accept <名>, guild leave, guild info');
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
