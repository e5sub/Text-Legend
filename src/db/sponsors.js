import knex from './index.js';

export async function listSponsors(limit = 5) {
  const sponsors = await knex('sponsors')
    .orderBy('id', 'desc')
    .select('player_name', 'amount');

  // 按玩家名分组，合并金额
  const merged = {};
  sponsors.forEach(s => {
    if (!merged[s.player_name]) {
      merged[s.player_name] = {
        player_name: s.player_name,
        amount: s.amount
      };
    } else {
      merged[s.player_name].amount += s.amount;
    }
  });

  // 转换为数组并按总金额降序排序，然后取前limit个
  return Object.values(merged)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export async function addSponsor(playerName, amount) {
  // 检查是否已存在该玩家
  const existing = await knex('sponsors')
    .where({ player_name: playerName })
    .first();

  if (existing) {
    // 已存在，累加金额
    return knex('sponsors')
      .where({ player_name: playerName })
      .update({
        amount: knex.raw('amount + ?', [amount])
      });
  } else {
    // 不存在，新增记录
    return knex('sponsors')
      .insert({
        player_name: playerName,
        amount: amount
      });
  }
}

export async function updateSponsor(id, playerName, amount) {
  return knex('sponsors')
    .where({ id })
    .update({
      player_name: playerName,
      amount: amount
    });
}

export async function updateSponsorCustomTitle(playerName, customTitle) {
  return knex('sponsors')
    .where({ player_name: playerName })
    .update({ custom_title: customTitle || '赞助玩家' });
}

export async function getSponsorByPlayerName(playerName) {
  return knex('sponsors')
    .where({ player_name: playerName })
    .first();
}

export async function deleteSponsor(id) {
  return knex('sponsors')
    .where({ id })
    .del();
}

export async function getSponsorById(id) {
  return knex('sponsors')
    .where({ id })
    .first();
}

export async function listAllSponsors() {
  const sponsors = await knex('sponsors')
    .orderBy('id', 'desc')
    .select('id', 'player_name', 'amount', 'created_at', 'custom_title');

  // 按玩家名分组，合并金额
  const merged = {};
  sponsors.forEach(s => {
    if (!merged[s.player_name]) {
      // 保留最早的记录信息，但更新金额和自定义称号
      merged[s.player_name] = {
        id: s.id,
        player_name: s.player_name,
        amount: s.amount,
        created_at: s.created_at,
        custom_title: s.custom_title || null
      };
    } else {
      // 累加金额，如果有自定义称号则使用最新的
      merged[s.player_name].amount += s.amount;
      if (s.custom_title && s.custom_title !== '赞助玩家') {
        merged[s.player_name].custom_title = s.custom_title;
      }
    }
  });

  // 转换为数组并按总金额降序排序
  return Object.values(merged)
    .sort((a, b) => b.amount - a.amount)
    .map(s => ({
      ...s,
      custom_title: s.custom_title || '赞助玩家'
    }));
}
