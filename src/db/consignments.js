import knex from './index.js';

export async function listConsignments(realmId = 1) {
  return knex('consignments').where({ realm_id: realmId }).orderBy('created_at', 'desc');
}

export async function listConsignmentsBySeller(sellerName, realmId = 1) {
  return knex('consignments').where({ seller_name: sellerName, realm_id: realmId }).orderBy('created_at', 'desc');
}

export async function listExpiredConsignments(cutoff, realmId = 1) {
  return knex('consignments')
    .where({ realm_id: realmId })
    .where('created_at', '<', cutoff)
    .orderBy('created_at', 'asc');
}

export async function getConsignment(id, realmId = 1) {
  return knex('consignments').where({ id, realm_id: realmId }).first();
}

export async function createConsignment({ sellerName, itemId, qty, price, effectsJson, durability = null, maxDurability = null, realmId = 1 }) {
  const [id] = await knex('consignments').insert({
    seller_name: sellerName,
    item_id: itemId,
    qty,
    price,
    effects_json: effectsJson || null,
    durability,
    max_durability: maxDurability,
    realm_id: realmId
  });
  return id;
}

export async function updateConsignmentQty(id, qty, realmId = 1) {
  return knex('consignments').where({ id, realm_id: realmId }).update({ qty });
}

export async function deleteConsignment(id, realmId = 1) {
  return knex('consignments').where({ id, realm_id: realmId }).del();
}
