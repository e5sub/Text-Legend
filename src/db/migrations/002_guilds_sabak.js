export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');

  const hasGuilds = await knex.schema.hasTable('guilds');
  if (!hasGuilds) {
    await knex.schema.createTable('guilds', (t) => {
      t.increments('id').primary();
      t.string('name', 64).notNullable().unique();
      t.integer('leader_user_id').notNullable();
      t.string('leader_char_name', 64).notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasGuildMembers = await knex.schema.hasTable('guild_members');
  if (!hasGuildMembers) {
    await knex.schema.createTable('guild_members', (t) => {
      t.increments('id').primary();
      t.integer('guild_id').unsigned().notNullable().references('guilds.id').onDelete('CASCADE');
      t.integer('user_id').notNullable();
      t.string('char_name', 64).notNullable();
      t.string('role', 32).notNullable();
      t.unique(['guild_id', 'char_name']);
    });
  }

  const hasSabakState = await knex.schema.hasTable('sabak_state');
  if (!hasSabakState) {
    await knex.schema.createTable('sabak_state', (t) => {
      t.integer('id').primary();
      t.integer('owner_guild_id').nullable();
      t.string('owner_guild_name', 64).nullable();
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasSabakRegistrations = await knex.schema.hasTable('sabak_registrations');
  if (!hasSabakRegistrations) {
    await knex.schema.createTable('sabak_registrations', (t) => {
      t.increments('id').primary();
      t.integer('guild_id').unsigned().notNullable().references('guilds.id').onDelete('CASCADE');
      t.timestamp('registered_at').defaultTo(knex.fn.now());
      t.unique(['guild_id']);
    });
  }

  const sabakStateRow = await knex('sabak_state').where({ id: 1 }).first();
  if (!sabakStateRow) {
    await knex('sabak_state').insert({ id: 1, owner_guild_id: null, owner_guild_name: null });
  }

  if (isMysql) {
    await knex.raw('ALTER TABLE `guild_members` MODIFY COLUMN `guild_id` INT UNSIGNED NOT NULL');
    await knex.raw('ALTER TABLE `sabak_registrations` MODIFY COLUMN `guild_id` INT UNSIGNED NOT NULL');

    try {
      await knex.raw('ALTER TABLE `guild_members` ADD CONSTRAINT `guild_members_guild_id_foreign` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
    try {
      await knex.raw('ALTER TABLE `sabak_registrations` ADD CONSTRAINT `sabak_registrations_guild_id_foreign` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sabak_registrations');
  await knex.schema.dropTableIfExists('sabak_state');
  await knex.schema.dropTableIfExists('guild_members');
  await knex.schema.dropTableIfExists('guilds');
}
