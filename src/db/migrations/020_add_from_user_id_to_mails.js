export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');
  const hasColumn = await knex.schema.hasColumn('mails', 'from_user_id');

  if (!hasColumn) {
    await knex.schema.table('mails', (t) => {
      t.integer('from_user_id').unsigned().nullable().references('users.id');
      t.index('from_user_id');
    });
    return;
  }

  if (isMysql) {
    await knex.raw('ALTER TABLE `mails` MODIFY COLUMN `from_user_id` INT UNSIGNED NULL');
    try {
      await knex.raw('ALTER TABLE `mails` ADD CONSTRAINT `mails_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`)');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('mails', 'from_user_id');
  if (!hasColumn) return;
  await knex.schema.table('mails', (t) => {
    t.dropColumn('from_user_id');
  });
}
