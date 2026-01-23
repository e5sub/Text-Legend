import knex from './index.js';

export async function createAdminSession(userId) {
  const token = `adm_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  await knex('sessions').insert({ user_id: userId, token });
  return token;
}

export async function verifyAdminSession(token) {
  if (!token || !token.startsWith('adm_')) return null;
  const session = await knex('sessions').where({ token }).first();
  if (!session) return null;
  const user = await knex('users').where({ id: session.user_id }).first();
  if (!user || !user.is_admin) return null;
  return { session, user };
}

export async function listUsers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const users = await knex('users')
    .select('id', 'username', 'is_admin', 'created_at')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const countResult = await knex('users').count('* as count').first();
  const total = countResult.count;
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteUser(userId) {
  // 删除用户相关数据
  await knex('characters').where({ user_id: userId }).delete();
  await knex('sessions').where({ user_id: userId }).delete();
  await knex('guild_members').where({ user_id: userId }).delete();
  await knex('mail').where({ to_user_id: userId }).delete();
  await knex('users').where({ id: userId }).delete();
}
