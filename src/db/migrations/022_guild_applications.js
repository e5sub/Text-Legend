export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');
  const hasTable = await knex.schema.hasTable('guild_applications');

  if (!hasTable) {
    await knex.schema.createTable('guild_applications', (t) => {
      t.increments('id').primary();
      t.integer('guild_id').unsigned().notNullable().references('guilds.id').onDelete('CASCADE');
      t.integer('user_id').notNullable();
      t.string('char_name', 64).notNullable();
      t.integer('realm_id').notNullable().defaultTo(1);
      t.timestamp('applied_at').defaultTo(knex.fn.now());
      t.unique(['user_id', 'realm_id']);
    });
    return;
  }

  if (isMysql) {
    await knex.raw('ALTER TABLE `guild_applications` MODIFY COLUMN `guild_id` INT UNSIGNED NOT NULL');
    try {
      await knex.raw('ALTER TABLE `guild_applications` ADD CONSTRAINT `guild_applications_guild_id_foreign` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('guild_applications');
}
