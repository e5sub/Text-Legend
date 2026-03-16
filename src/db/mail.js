import knex from './index.js';

export async function sendMail(toUserId, toName, fromName, fromUserId, title, body, items = null, gold = 0, realmId = 1, yuanbao = 0) {
  const payload = {
    to_user_id: toUserId,
    to_name: toName,
    from_user_id: fromUserId || null,
    from_name: fromName,
    title,
    body,
    items_json: items ? JSON.stringify(items) : null,
    gold: Number(gold) || 0,
    yuanbao: Number(yuanbao) || 0,
    realm_id: realmId
  };
  const [id] = await knex('mails').insert(payload);
  return id;
}

export async function listMail(userId, realmId = 1) {
  return knex('mails').where({ to_user_id: userId, realm_id: realmId }).orderBy('created_at', 'desc');
}

export async function listSentMail(userId, realmId = 1) {
  return knex('mails').where({ from_user_id: userId, realm_id: realmId }).orderBy('created_at', 'desc');
}

export async function markMailRead(userId, mailId, realmId = 1) {
  await knex('mails').where({ id: mailId, to_user_id: userId, realm_id: realmId }).update({ read_at: knex.fn.now() });
}

export async function markMailClaimed(userId, mailId, realmId = 1) {
  await knex('mails').where({ id: mailId, to_user_id: userId, realm_id: realmId }).update({ claimed_at: knex.fn.now() });
}

export async function deleteMail(userId, mailId, realmId = 1, folder = 'inbox') {
  if (folder === 'inbox') {
    await knex('mails').where({ id: mailId, to_user_id: userId, realm_id: realmId }).del();
  } else if (folder === 'sent') {
    await knex('mails').where({ id: mailId, from_user_id: userId, realm_id: realmId }).del();
  }
}
