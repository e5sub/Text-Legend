export async function up(knex) {
  const hasTable = await knex.schema.hasTable('item_drops');
  if (!hasTable) {
    console.log('item_drops table does not exist, skipping migration');
    return;
  }

  const hasColumn = await knex.schema.hasColumn('item_drops', 'mob_id');
  if (!hasColumn) {
    console.log('mob_id column does not exist in item_drops table, skipping migration');
    return;
  }

  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');
  const columnInfo = await knex('item_drops').columnInfo();
  const currentMobIdType = String(columnInfo?.mob_id?.type || '').toLowerCase();
  console.log('Current mob_id type:', currentMobIdType);

  if (!currentMobIdType.includes('int')) {
    console.log('mob_id is already varchar type, no migration needed');
    return;
  }

  if (isMysql) {
    await knex.raw('ALTER TABLE `item_drops` MODIFY COLUMN `mob_id` VARCHAR(64) NOT NULL');
    console.log('MySQL migration completed successfully');
    return;
  }

  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.renameTable('item_drops', 'item_drops_old');

  await knex.schema.createTable('item_drops', (t) => {
    t.increments('id').primary();
    t.integer('item_id').notNullable();
    t.string('mob_id', 64).notNullable();
    t.decimal('drop_chance', 5, 4).notNullable().defaultTo(0.0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['item_id', 'mob_id']);
  });

  await knex('item_drops').insert(knex('item_drops_old').select('*'));
  await knex.schema.dropTable('item_drops_old');

  await knex.schema.alterTable('item_drops', (t) => {
    t.index('mob_id');
    t.index('drop_chance');
  });

  await knex.schema.alterTable('item_drops', (t) => {
    t.foreign('item_id').references('items.id').onDelete('CASCADE');
  });

  await knex.raw('PRAGMA foreign_keys = ON');
  console.log('SQLite migration completed successfully');
}

export async function down(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  if (client.includes('mysql')) {
    return;
  }

  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.renameTable('item_drops', 'item_drops_old');

  await knex.schema.createTable('item_drops', (t) => {
    t.increments('id').primary();
    t.integer('item_id').notNullable();
    t.integer('mob_id').notNullable();
    t.decimal('drop_chance', 5, 4).notNullable().defaultTo(0.0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['item_id', 'mob_id']);
  });

  await knex('item_drops').insert(
    knex.raw(`
      SELECT id, item_id,
             CAST(mob_id AS INTEGER) as mob_id,
             drop_chance, created_at, updated_at
      FROM item_drops_old
      WHERE mob_id GLOB '[0-9]*'
    `)
  );

  await knex.schema.dropTable('item_drops_old');

  await knex.schema.alterTable('item_drops', (t) => {
    t.index('mob_id');
    t.index('drop_chance');
    t.foreign('item_id').references('items.id').onDelete('CASCADE');
  });

  await knex.raw('PRAGMA foreign_keys = ON');
}
