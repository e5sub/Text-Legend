import knex from './index.js';

export async function createVipCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    const code = `VIP${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
    codes.push(code);
  }
  for (const code of codes) {
    await knex('vip_codes').insert({ code });
  }
  return codes;
}

export async function useVipCode(code, userId) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return null;
  const row = await knex('vip_codes').where({ code: normalized }).first();
  if (!row || row.used_at) return null;
  await knex('vip_codes').where({ id: row.id }).update({ used_by_user_id: userId, used_at: knex.fn.now() });
  return row;
}

export async function listVipCodes(limit = 50) {
  return knex('vip_codes').orderBy('created_at', 'desc').limit(limit);
}
