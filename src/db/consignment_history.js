import knex from './index.js';

export async function listConsignmentHistory(sellerName, limit = 50) {
  return knex('consignment_history')
    .where({ seller_name: sellerName })
    .orderBy('sold_at', 'desc')
    .limit(limit);
}

export async function createConsignmentHistory({ sellerName, buyerName, itemId, qty, price, effectsJson, durability = null, maxDurability = null }) {
  const [id] = await knex('consignment_history').insert({
    seller_name: sellerName,
    buyer_name: buyerName,
    item_id: itemId,
    qty,
    price,
    effects_json: effectsJson || null,
    durability,
    max_durability: maxDurability
  });
  return id;
}
