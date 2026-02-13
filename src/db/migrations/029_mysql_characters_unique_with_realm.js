export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  if (!client.includes('mysql')) return;

  const hasTable = await knex.schema.hasTable('characters');
  if (!hasTable) return;
  const hasRealm = await knex.schema.hasColumn('characters', 'realm_id');
  if (!hasRealm) return;

  // MySQL may currently use `characters_user_id_name_unique` to satisfy
  // FK index requirement on characters.user_id -> users.id.
  // Create a dedicated index first so the unique index can be dropped safely.
  try {
    await knex.raw('ALTER TABLE `characters` ADD INDEX `characters_user_id_idx` (`user_id`)');
  } catch (err) {
    const msg = String(err?.sqlMessage || err?.message || '');
    if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
  }

  const dropOldUniqueIndex = async () => {
    await knex.raw('ALTER TABLE `characters` DROP INDEX `characters_user_id_name_unique`');
  };

  try {
    await dropOldUniqueIndex();
  } catch (err) {
    const msg = String(err?.sqlMessage || err?.message || '');
    if (msg.includes('check that column/key exists')) {
      // index already dropped
    } else if (msg.includes('needed in a foreign key constraint')) {
      // Drop FKs that still reference characters(user_id, name), then retry.
      const fkRows = await knex('information_schema.KEY_COLUMN_USAGE as k')
        .join('information_schema.REFERENTIAL_CONSTRAINTS as r', function () {
          this.on('k.CONSTRAINT_SCHEMA', '=', 'r.CONSTRAINT_SCHEMA')
            .andOn('k.CONSTRAINT_NAME', '=', 'r.CONSTRAINT_NAME')
            .andOn('k.TABLE_NAME', '=', 'r.TABLE_NAME');
        })
        .whereRaw('k.CONSTRAINT_SCHEMA = DATABASE()')
        .where('k.REFERENCED_TABLE_NAME', 'characters')
        .groupBy('k.TABLE_NAME', 'k.CONSTRAINT_NAME')
        .select('k.TABLE_NAME as tableName', 'k.CONSTRAINT_NAME as constraintName');

      for (const row of fkRows) {
        const tableName = String(row.tableName || '').replace(/`/g, '``');
        const constraintName = String(row.constraintName || '').replace(/`/g, '``');
        if (!tableName || !constraintName) continue;
        await knex.raw(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``);
      }
      await dropOldUniqueIndex();
    } else {
      throw err;
    }
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
