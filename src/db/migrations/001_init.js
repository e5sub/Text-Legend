export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');

  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('username', 64).notNullable().unique();
      t.string('password_hash', 255).notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasSessions = await knex.schema.hasTable('sessions');
  if (!hasSessions) {
    await knex.schema.createTable('sessions', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
      t.string('token', 64).notNullable().unique();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('last_seen').defaultTo(knex.fn.now());
    });
  }

  const hasCharacters = await knex.schema.hasTable('characters');
  if (!hasCharacters) {
    await knex.schema.createTable('characters', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
      t.string('name', 64).notNullable();
      t.string('class', 32).notNullable();
      t.integer('level').notNullable();
      t.integer('exp').notNullable();
      t.integer('gold').notNullable();
      t.integer('hp').notNullable();
      t.integer('mp').notNullable();
      t.integer('max_hp').notNullable();
      t.integer('max_mp').notNullable();
      t.text('stats_json').notNullable();
      t.text('position_json').notNullable();
      t.text('inventory_json').notNullable();
      t.text('equipment_json').notNullable();
      t.text('quests_json').notNullable();
      t.text('flags_json').notNullable();
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['user_id', 'name']);
    });
  }

  if (isMysql) {
    // Keep SQLite-like case-sensitive uniqueness for usernames on MySQL.
    await knex.raw('ALTER TABLE `users` MODIFY COLUMN `username` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');

    // Normalize FK column type for old/partial schemas created before this migration fix.
    await knex.raw('ALTER TABLE `sessions` MODIFY COLUMN `user_id` INT UNSIGNED NOT NULL');
    await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `user_id` INT UNSIGNED NOT NULL');

    try {
      await knex.raw('ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
    try {
      await knex.raw('ALTER TABLE `characters` ADD CONSTRAINT `characters_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('characters');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
}
