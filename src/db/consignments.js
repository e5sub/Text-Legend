import knex from './index.js';

export async function listConsignments() {
  return knex('consignments').orderBy('created_at', 'desc');
}

export async function listConsignmentsBySeller(sellerName) {
  return knex('consignments').where({ seller_name: sellerName }).orderBy('created_at', 'desc');
}

export async function getConsignment(id) {
  return knex('consignments').where({ id }).first();
}

export async function createConsignment({ sellerName, itemId, qty, price }) {
  const [id] = await knex('consignments').insert({
    seller_name: sellerName,
    item_id: itemId,
    qty,
    price
  });
  return id;
}

export async function updateConsignmentQty(id, qty) {
  return knex('consignments').where({ id }).update({ qty });
}

export async function deleteConsignment(id) {
  return knex('consignments').where({ id }).del();
}
