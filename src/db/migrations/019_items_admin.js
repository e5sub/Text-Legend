export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');

  const hasItems = await knex.schema.hasTable('items');
  if (!hasItems) {
    await knex.schema.createTable('items', (t) => {
      t.increments('id').primary();
      t.string('item_id', 64).notNullable().unique();
      t.string('name', 128).notNullable();
      t.string('type', 32).notNullable();
      t.string('slot', 32).nullable();
      t.string('rarity', 32).defaultTo('common');
      t.integer('atk').defaultTo(0);
      t.integer('def').defaultTo(0);
      t.integer('mag').defaultTo(0);
      t.integer('spirit').defaultTo(0);
      t.integer('hp').defaultTo(0);
      t.integer('mp').defaultTo(0);
      t.integer('mdef').defaultTo(0);
      t.integer('dex').defaultTo(0);
      t.integer('price').defaultTo(0);
      t.boolean('untradable').defaultTo(false);
      t.boolean('unconsignable').defaultTo(false);
      t.boolean('boss_only').defaultTo(false);
      t.boolean('world_boss_only').defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable('items', (t) => {
      t.index('type');
      t.index('rarity');
      t.index('slot');
    });
  }

  const hasItemDrops = await knex.schema.hasTable('item_drops');
  if (!hasItemDrops) {
    await knex.schema.createTable('item_drops', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable().references('items.id').onDelete('CASCADE');
      t.string('mob_id', 64).notNullable();
      t.decimal('drop_chance', 5, 4).notNullable().defaultTo(0.0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.unique(['item_id', 'mob_id']);
    });

    await knex.schema.alterTable('item_drops', (t) => {
      t.index('mob_id');
      t.index('drop_chance');
    });
  }

  if (isMysql && await knex.schema.hasTable('item_drops')) {
    await knex.raw('ALTER TABLE `item_drops` MODIFY COLUMN `item_id` INT UNSIGNED NOT NULL');
    try {
      await knex.raw('ALTER TABLE `item_drops` ADD CONSTRAINT `item_drops_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE');
    } catch (err) {
      const msg = String(err?.sqlMessage || err?.message || '');
      if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
    }
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('item_drops');
  await knex.schema.dropTableIfExists('items');
}
