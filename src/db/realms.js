import knex from './index.js';

export async function listRealms() {
  return knex('realms').select('id', 'name').orderBy('id', 'asc');
}

export async function getRealmById(id) {
  return knex('realms').where({ id }).first();
}

export async function updateRealmName(id, name) {
  return knex('realms').where({ id }).update({ name, updated_at: knex.fn.now() });
}

export async function createRealm(name) {
  const [id] = await knex('realms').insert({ name });
  return id;
}
