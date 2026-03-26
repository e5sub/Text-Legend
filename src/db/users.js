import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import knex from './index.js';
import config from '../config.js';

function normalizeUsernameLookup(username) {
  return String(username || '').trim().toLowerCase();
}

function queryUserByUsername(username) {
  const normalized = normalizeUsernameLookup(username);
  if (!normalized) return knex('users').whereRaw('1 = 0');
  return knex('users').whereRaw('LOWER(username) = ?', [normalized]);
}

export async function createUser(username, password, email = null) {
  const trimmedUsername = String(username || '').trim();
  if (!trimmedUsername) {
    throw new Error('账号不能为空。');
  }
  const exists = await queryUserByUsername(trimmedUsername).first();
  if (exists) {
    throw new Error('账号已存在。');
  }
  const hash = await bcrypt.hash(password, 10);
  const [id] = await knex('users').insert({ username: trimmedUsername, password_hash: hash, email });
  return id;
}

export async function verifyUser(username, password) {
  const user = await queryUserByUsername(username).first();
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
  return queryUserByUsername(username).first();
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

export async function clearRealmSessions(realmIds = []) {
  const ids = Array.from(new Set(realmIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));
  if (ids.length === 0) return;
  const rows = await knex('characters').whereIn('realm_id', ids).distinct('user_id');
  const userIds = rows.map((row) => row.user_id).filter((id) => id !== null && id !== undefined);
  if (userIds.length === 0) return;
  await knex('sessions')
    .whereIn('user_id', userIds)
    .whereNot('token', 'like', 'adm_%')
    .del();
}

export async function getUserByEmail(email) {
  return knex('users').where({ email }).first();
}

export async function updateUserEmail(userId, email) {
  await knex('users').where({ id: userId }).update({ email });
}

export async function createPasswordResetToken(userId, expiresMinutes = 30) {
  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  await knex('password_reset_tokens').insert({ user_id: userId, token, expires_at: expiresAt });
  return token;
}

export async function getPasswordResetToken(token) {
  const resetToken = await knex('password_reset_tokens').where({ token, used_at: null }).first();
  if (!resetToken) return null;
  const now = new Date();
  if (new Date(resetToken.expires_at) < now) {
    await knex('password_reset_tokens').where({ token }).del();
    return null;
  }
  return resetToken;
}

export async function markPasswordResetTokenUsed(token) {
  await knex('password_reset_tokens').where({ token }).update({ used_at: knex.fn.now() });
}

export async function cleanupExpiredPasswordResetTokens() {
  await knex('password_reset_tokens').where('expires_at', '<', new Date()).del();
}
