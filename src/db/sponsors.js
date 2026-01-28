import knex from './index.js';

export async function listSponsors(limit = 5) {
  return knex('sponsors')
    .orderBy('amount', 'desc')
    .limit(limit)
    .select('player_name', 'amount');
}

export async function addSponsor(playerName, amount) {
  return knex('sponsors')
    .insert({
      player_name: playerName,
      amount: amount
    });
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
  return knex('sponsors')
    .orderBy('amount', 'desc')
    .select('id', 'player_name', 'amount', 'created_at', 'custom_title');
}
