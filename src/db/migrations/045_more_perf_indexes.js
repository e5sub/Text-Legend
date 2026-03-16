async function hasColumns(knex, tableName, columns) {
  if (!(await knex.schema.hasTable(tableName))) return false;
  for (const col of columns) {
    if (!(await knex.schema.hasColumn(tableName, col))) return false;
  }
  return true;
}

async function addIndex(knex, tableName, columns, indexName) {
  if (!(await hasColumns(knex, tableName, columns))) return;
  try {
    await knex.schema.alterTable(tableName, (t) => {
      t.index(columns, indexName);
    });
    console.log(`[migration] Created index ${indexName} on ${tableName}`);
  } catch (err) {
    const msg = String(err?.sqlMessage || err?.message || '');
    if (msg.includes('Duplicate') || msg.includes('already exists')) {
      console.log(`[migration] Index ${indexName} already exists on ${tableName}`);
    } else {
      console.warn(`[migration] Failed to create index ${indexName} on ${tableName}:`, msg);
    }
  }
}

async function dropIndex(knex, tableName, columns, indexName) {
  if (!(await knex.schema.hasTable(tableName))) return;
  try {
    await knex.schema.alterTable(tableName, (t) => {
      t.dropIndex(columns, indexName);
    });
  } catch {
    // ignore
  }
}

export async function up(knex) {
  // game_settings: key lookup
  await addIndex(knex, 'game_settings', ['key'], 'idx_game_settings_key');

  // users: admin lookup + pagination ordering
  await addIndex(knex, 'users', ['is_admin'], 'idx_users_is_admin');
  await addIndex(knex, 'users', ['created_at'], 'idx_users_created_at');

  // characters: name lookup + recent activity
  await addIndex(knex, 'characters', ['name'], 'idx_characters_name');
  await addIndex(knex, 'characters', ['updated_at'], 'idx_characters_updated_at');

  // guilds: name lookup and realm list ordering
  await addIndex(knex, 'guilds', ['name'], 'idx_guilds_name');
  await addIndex(knex, 'guilds', ['realm_id', 'name'], 'idx_guilds_realm_name');

  // consignment_history: cleanup by sold_at
  await addIndex(knex, 'consignment_history', ['sold_at'], 'idx_consignment_history_sold_at');

  // sponsors: exact lookup/update by player name
  await addIndex(knex, 'sponsors', ['player_name'], 'idx_sponsors_player_name');
}

export async function down(knex) {
  await dropIndex(knex, 'sponsors', ['player_name'], 'idx_sponsors_player_name');
  await dropIndex(knex, 'consignment_history', ['sold_at'], 'idx_consignment_history_sold_at');
  await dropIndex(knex, 'guilds', ['realm_id', 'name'], 'idx_guilds_realm_name');
  await dropIndex(knex, 'guilds', ['name'], 'idx_guilds_name');
  await dropIndex(knex, 'characters', ['updated_at'], 'idx_characters_updated_at');
  await dropIndex(knex, 'characters', ['name'], 'idx_characters_name');
  await dropIndex(knex, 'users', ['created_at'], 'idx_users_created_at');
  await dropIndex(knex, 'users', ['is_admin'], 'idx_users_is_admin');
  await dropIndex(knex, 'game_settings', ['key'], 'idx_game_settings_key');
}
