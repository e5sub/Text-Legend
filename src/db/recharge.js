import knex from './index.js';

function normalizeCode(code) {
  return String(code || '').replace(/\s+/g, '').trim().toUpperCase();
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

export async function countUsedRechargeCardsByUser(userId) {
  const uid = Math.floor(Number(userId || 0));
  if (!Number.isFinite(uid) || uid <= 0) return 0;
  const row = await knex('recharge_cards')
    .where({ used_by_user_id: uid })
    .whereNotNull('used_at')
    .count({ total: '*' })
    .first();
  return Number(row?.total || 0);
}

export async function listUsedRechargeUserIds() {
  const rows = await knex('recharge_cards')
    .whereNotNull('used_at')
    .whereNotNull('used_by_user_id')
    .where('used_by_user_id', '>', 0)
    .distinct('used_by_user_id as userId');
  return rows
    .map((row) => Math.floor(Number(row?.userId || 0)))
    .filter((uid, idx, arr) => Number.isFinite(uid) && uid > 0 && arr.indexOf(uid) === idx);
}

export async function listUsedRechargeCharacters() {
  const rows = await knex('recharge_cards')
    .whereNotNull('used_at')
    .whereNotNull('used_by_user_id')
    .where('used_by_user_id', '>', 0)
    .whereNotNull('used_by_char_name')
    .distinct('used_by_user_id as userId', 'used_by_char_name as charName');
  return rows
    .map((row) => ({
      userId: Math.floor(Number(row?.userId || 0)),
      charName: String(row?.charName || '').trim()
    }))
    .filter((row, idx, arr) => row.userId > 0 && row.charName && arr.findIndex((x) => x.userId === row.userId && x.charName === row.charName) === idx);
}
