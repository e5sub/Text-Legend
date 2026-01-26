import knex from './index.js';

export async function sendMail(toUserId, fromName, title, body, items = null, gold = 0) {
  const payload = {
    to_user_id: toUserId,
    from_name: fromName,
    title,
    body,
    items_json: items ? JSON.stringify(items) : null,
    gold: Number(gold) || 0
  };
  const [id] = await knex('mails').insert(payload);
  return id;
}

export async function listMail(userId) {
  return knex('mails').where({ to_user_id: userId }).orderBy('created_at', 'desc');
}

export async function markMailRead(userId, mailId) {
  await knex('mails').where({ id: mailId, to_user_id: userId }).update({ read_at: knex.fn.now() });
}

export async function markMailClaimed(userId, mailId) {
  await knex('mails').where({ id: mailId, to_user_id: userId }).update({ claimed_at: knex.fn.now() });
}
