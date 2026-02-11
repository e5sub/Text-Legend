import knex from './index.js';

function resolveVipDuration(durationType, durationDays) {
  const normalizedType = String(durationType || '').trim().toLowerCase();
  if (normalizedType === 'permanent') {
    return { durationType: 'permanent', durationDays: null };
  }
  if (Number.isFinite(Number(durationDays)) && Number(durationDays) > 0) {
    return { durationType: normalizedType || 'custom', durationDays: Math.floor(Number(durationDays)) };
  }
  switch (normalizedType) {
    case 'year':
      return { durationType: 'year', durationDays: 365 };
    case 'quarter':
      return { durationType: 'quarter', durationDays: 90 };
    case 'month':
    default:
      return { durationType: 'month', durationDays: 30 };
  }
}

export async function createVipCodes(count, durationType = 'month', durationDays = null) {
  const codes = [];
  const resolved = resolveVipDuration(durationType, durationDays);
  for (let i = 0; i < count; i += 1) {
    const code = `VIP${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
    codes.push(code);
  }
  for (const code of codes) {
    await knex('vip_codes').insert({
      code,
      duration_type: resolved.durationType,
      duration_days: resolved.durationDays
    });
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

export async function listVipCodes(limit = 50, offset = 0) {
  return knex('vip_codes')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function countVipCodes() {
  const row = await knex('vip_codes').count({ total: '*' }).first();
  return Number(row?.total || 0);
}
