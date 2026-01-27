import knex from './index.js';

export async function getGuildByName(name) {
  return knex('guilds').where({ name }).first();
}

export async function getGuildByNameInRealm(name, realmId = 1) {
  return knex('guilds').where({ name, realm_id: realmId }).first();
}

export async function getGuildById(id) {
  return knex('guilds').where({ id }).first();
}

export async function createGuild(name, leaderUserId, leaderCharName, realmId = 1) {
  const [id] = await knex('guilds').insert({
    name,
    leader_user_id: leaderUserId,
    leader_char_name: leaderCharName,
    realm_id: realmId
  });
  await knex('guild_members').insert({
    guild_id: id,
    user_id: leaderUserId,
    char_name: leaderCharName,
    role: 'leader',
    realm_id: realmId
  });
  return id;
}

export async function addGuildMember(guildId, userId, charName, realmId = 1) {
  await knex('guild_members').insert({
    guild_id: guildId,
    user_id: userId,
    char_name: charName,
    role: 'member',
    realm_id: realmId
  });
}

export async function removeGuildMember(guildId, userId, charName, realmId = 1) {
  await knex('guild_members').where({ guild_id: guildId, user_id: userId, char_name: charName, realm_id: realmId }).del();
}

export async function leaveGuild(userId, charName, realmId = 1) {
  const row = await knex('guild_members').where({ user_id: userId, char_name: charName, realm_id: realmId }).first();
  if (!row) return null;
  await knex('guild_members').where({ user_id: userId, char_name: charName, realm_id: realmId }).del();
  return row.guild_id;
}

export async function getGuildMember(userId, charName, realmId = 1) {
  const row = await knex('guild_members').where({ user_id: userId, char_name: charName, realm_id: realmId }).first();
  if (!row) return null;
  const guild = await getGuildById(row.guild_id);
  return { guild, role: row.role };
}

export async function listGuildMembers(guildId, realmId = 1) {
  return knex('guild_members').where({ guild_id: guildId, realm_id: realmId }).select('char_name', 'role', 'user_id');
}

export async function isGuildLeader(guildId, userId, charName, realmId = 1) {
  const row = await knex('guild_members').where({ guild_id: guildId, user_id: userId, char_name: charName, realm_id: realmId }).first();
  console.log('[isGuildLeader] guildId:', guildId, 'userId:', userId, 'charName:', charName, 'row:', row);
  return row && row.role === 'leader';
}

export async function transferGuildLeader(guildId, oldLeaderUserId, oldLeaderCharName, newLeaderUserId, newLeaderCharName, realmId = 1) {
  await knex.transaction(async (trx) => {
    const oldLeaderRows = await trx('guild_members')
      .where({ guild_id: guildId, user_id: oldLeaderUserId, char_name: oldLeaderCharName, realm_id: realmId })
      .update({ role: 'member' });
    if (oldLeaderRows === 0) {
      throw new Error('旧会长记录不存在或已更新');
    }
    const newLeaderRows = await trx('guild_members')
      .where({ guild_id: guildId, user_id: newLeaderUserId, char_name: newLeaderCharName, realm_id: realmId })
      .update({ role: 'leader' });
    if (newLeaderRows === 0) {
      throw new Error('新会长记录不存在');
    }
    await trx('guilds')
      .where({ id: guildId })
      .update({ leader_user_id: newLeaderUserId, leader_char_name: newLeaderCharName });
  });
}

export async function getSabakOwner(realmId = 1) {
  return knex('sabak_state').where({ realm_id: realmId }).first();
}

export async function setSabakOwner(realmId, guildId, guildName) {
  await knex('sabak_state')
    .where({ realm_id: realmId })
    .update({ owner_guild_id: guildId, owner_guild_name: guildName, updated_at: knex.fn.now() });
}

export async function ensureSabakState(realmId = 1) {
  const existing = await knex('sabak_state').where({ realm_id: realmId }).first();
  if (existing) return existing;
  await knex('sabak_state').insert({ realm_id: realmId, owner_guild_id: null, owner_guild_name: null });
  return knex('sabak_state').where({ realm_id: realmId }).first();
}

export async function registerSabak(guildId, realmId = 1) {
  await knex('sabak_registrations')
    .insert({ guild_id: guildId, registered_at: knex.fn.now(), realm_id: realmId })
    .onConflict(['guild_id', 'realm_id'])
    .merge({ registered_at: knex.fn.now() });
}

export async function listSabakRegistrations(realmId = 1) {
  return knex('sabak_registrations')
    .join('guilds', 'sabak_registrations.guild_id', 'guilds.id')
    .where('sabak_registrations.realm_id', realmId)
    .where('guilds.realm_id', realmId)
    .select('guilds.name as guild_name', 'sabak_registrations.guild_id', 'sabak_registrations.registered_at');
}

export async function hasSabakRegistrationToday(guildId, realmId = 1) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const row = await knex('sabak_registrations')
    .where({ guild_id: guildId, realm_id: realmId })
    .where('registered_at', '>=', start)
    .where('registered_at', '<', end)
    .first();
  return !!row;
}

export async function clearSabakRegistrations(realmId = 1) {
  await knex('sabak_registrations').where({ realm_id: realmId }).del();
}
