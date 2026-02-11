import knex from './index.js';

export async function listConsignmentHistory(sellerName, realmId = 1, limit = 50) {
  return knex('consignment_history')
    .where({ seller_name: sellerName, realm_id: realmId })
    .orderBy('sold_at', 'desc')
    .limit(limit);
}

export async function createConsignmentHistory({
  sellerName,
  buyerName,
  itemId,
  qty,
  price,
  currency = 'gold',
  effectsJson,
  durability = null,
  maxDurability = null,
  refineLevel = null,
  realmId = 1
}) {
  const [id] = await knex('consignment_history').insert({
    seller_name: sellerName,
    buyer_name: buyerName,
    item_id: itemId,
    qty,
    price,
    currency,
    effects_json: effectsJson || null,
    durability,
    max_durability: maxDurability,
    refine_level: refineLevel,
    realm_id: realmId
  });
  return id;
}
