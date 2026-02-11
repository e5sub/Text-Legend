import knex from './index.js';

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

export async function createRechargeCards(count, amount, createdByUserId = null) {
  const total = Math.max(1, Math.min(200, Math.floor(Number(count) || 1)));
  const value = Math.max(1, Math.floor(Number(amount) || 0));
  const codes = [];
  for (let i = 0; i < total; i += 1) {
    const code = `YB${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
    codes.push(code);
  }
  for (const code of codes) {
    await knex('recharge_cards').insert({
      code,
      amount: value,
      created_by_user_id: createdByUserId
    });
  }
  return codes;
}

export async function useRechargeCard(code, userId, charName) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  return knex.transaction(async (trx) => {
    const row = await trx('recharge_cards').where({ code: normalized }).first();
    if (!row || row.used_at) return null;
    await trx('recharge_cards')
      .where({ id: row.id })
      .update({
        used_by_user_id: userId,
        used_by_char_name: charName || null,
        used_at: trx.fn.now()
      });
    return row;
  });
}

export async function listRechargeCards(limit = 50, offset = 0) {
  return knex('recharge_cards')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function countRechargeCards() {
  const row = await knex('recharge_cards').count({ total: '*' }).first();
  return Number(row?.total || 0);
}
