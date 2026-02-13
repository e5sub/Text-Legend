export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  if (!client.includes('mysql')) return;

  const hasTable = await knex.schema.hasTable('characters');
  if (!hasTable) return;
  const hasRealm = await knex.schema.hasColumn('characters', 'realm_id');
  if (!hasRealm) return;

  try {
    await knex.raw('ALTER TABLE `characters` DROP INDEX `characters_user_id_name_unique`');
  } catch (err) {
    const msg = String(err?.sqlMessage || err?.message || '');
    if (!msg.includes('check that column/key exists')) throw err;
  }

  try {
    await knex.raw('ALTER TABLE `characters` ADD CONSTRAINT `characters_user_id_name_realm_id_unique` UNIQUE (`user_id`, `name`, `realm_id`)');
  } catch (err) {
    const msg = String(err?.sqlMessage || err?.message || '');
    if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
  }
}

export async function down(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  if (!client.includes('mysql')) return;
  const hasTable = await knex.schema.hasTable('characters');
  if (!hasTable) return;

  try {
    await knex.raw('ALTER TABLE `characters` DROP INDEX `characters_user_id_name_realm_id_unique`');
  } catch {}
  try {
    await knex.raw('ALTER TABLE `characters` ADD CONSTRAINT `characters_user_id_name_unique` UNIQUE (`user_id`, `name`)');
  } catch {}
}

