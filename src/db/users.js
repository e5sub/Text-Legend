import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import knex from './index.js';
import config from '../config.js';

export async function createUser(username, password) {
  const hash = await bcrypt.hash(password, 10);
  const [id] = await knex('users').insert({ username, password_hash: hash });
  return id;
}

export async function verifyUser(username, password) {
  const user = await knex('users').where({ username }).first();
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return user;
}

export async function createSession(userId) {
  const token = uuidv4().replace(/-/g, '');
  await knex('sessions').insert({ user_id: userId, token });
  return token;
}

export async function getSession(token) {
  const session = await knex('sessions').where({ token }).first();
  if (!session) return null;
  const ttlMin = Number(config.sessionTtlMin);
  const ttlMs = Number.isFinite(ttlMin) && ttlMin > 0 ? ttlMin * 60 * 1000 : 0;
  if (ttlMs > 0) {
    const lastSeen = new Date(session.last_seen).getTime();
    if (Date.now() - lastSeen > ttlMs) {
      await knex('sessions').where({ token }).del();
      return null;
    }
  }
  await knex('sessions').where({ token }).update({ last_seen: knex.fn.now() });
  return session;
}

export async function setAdminFlag(userId, isAdmin) {
  await knex('users').where({ id: userId }).update({ is_admin: isAdmin });
}

export async function getUserByName(username) {
  return knex('users').where({ username }).first();
}

export async function verifyUserPassword(userId, password) {
  const user = await knex('users').where({ id: userId }).first();
  if (!user) return false;
  return bcrypt.compare(password, user.password_hash);
}

export async function updateUserPassword(userId, newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  await knex('users').where({ id: userId }).update({ password_hash: hash });
}

export async function clearUserSessions(userId) {
  await knex('sessions').where({ user_id: userId }).del();
}

export async function clearAllSessions() {
  // 只清除玩家 session（token不以 'adm_' 开头），保留管理员 session
  await knex('sessions').whereNot('token', 'like', 'adm_%').del();
}
