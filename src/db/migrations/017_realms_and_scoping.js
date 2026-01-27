export async function up(knex) {
  const isSqlite = knex.client.config.client === 'sqlite3';

  const hasRealms = await knex.schema.hasTable('realms');
  if (!hasRealms) {
    await knex.schema.createTable('realms', (t) => {
      t.increments('id').primary();
      t.string('name', 64).notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const realm1 = await knex('realms').where({ id: 1 }).first();
  if (!realm1) {
    await knex('realms').insert({ id: 1, name: '新区1' });
  }

  const addRealmColumn = async (tableName) => {
    const hasColumn = await knex.schema.hasColumn(tableName, 'realm_id');
    if (hasColumn) return;
    if (isSqlite) {
      await knex.schema.table(tableName, (t) => {
        t.integer('realm_id').notNullable().defaultTo(1);
      });
    } else {
      await knex.schema.table(tableName, (t) => {
        t.integer('realm_id');
      });
      await knex(tableName).update({ realm_id: 1 });
      await knex.schema.alterTable(tableName, (t) => {
        t.integer('realm_id').notNullable().alter();
      });
    }
  };

  const tables = [
    'guilds',
    'guild_members',
    'sabak_state',
    'sabak_registrations',
    'mails',
    'mob_respawns',
    'consignments',
    'consignment_history'
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) {
      await addRealmColumn(table);
    }
  }

  // Ensure existing rows default to realm 1 in sqlite (where default won't backfill).
  if (isSqlite) {
    for (const table of tables) {
      if (await knex.schema.hasTable(table)) {
        await knex(table).whereNull('realm_id').update({ realm_id: 1 });
      }
    }
  }

  // Add unique index for sabak_state per realm if possible.
  if (await knex.schema.hasTable('sabak_state')) {
    const hasIndex = await knex.schema.hasColumn('sabak_state', 'realm_id');
    if (hasIndex) {
      try {
        await knex.schema.alterTable('sabak_state', (t) => {
          t.unique(['realm_id']);
        });
      } catch {
        // ignore if already exists
      }
    }
  }

  // Add composite index for mob_respawns realm scoping if possible.
  if (await knex.schema.hasTable('mob_respawns')) {
    try {
      await knex.schema.alterTable('mob_respawns', (t) => {
        t.index(['realm_id', 'zone_id', 'room_id', 'slot_index']);
      });
    } catch {
      // ignore if already exists
    }
  }
}

export async function down(knex) {
  const hasRealms = await knex.schema.hasTable('realms');
  if (hasRealms) {
    await knex.schema.dropTableIfExists('realms');
  }

  const tables = [
    'guilds',
    'guild_members',
    'sabak_state',
    'sabak_registrations',
    'mails',
    'mob_respawns',
    'consignments',
    'consignment_history'
  ];

  for (const table of tables) {
    const hasColumn = await knex.schema.hasColumn(table, 'realm_id');
    if (hasColumn) {
      await knex.schema.table(table, (t) => {
        t.dropColumn('realm_id');
      });
    }
  }
}
