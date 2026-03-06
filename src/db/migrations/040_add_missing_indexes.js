async function addIndex(knex, tableName, columns, indexName) {
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
  try {
    await knex.schema.alterTable(tableName, (t) => {
      t.dropIndex(columns, indexName);
    });
  } catch {
    // ignore
  }
}

export async function up(knex) {
  // 1. mails 表 - 收件箱和发件箱查询
  if (await knex.schema.hasTable('mails')) {
    await addIndex(knex, 'mails', ['to_user_id', 'realm_id'], 'idx_mails_to_user_realm');
    await addIndex(knex, 'mails', ['from_user_id', 'realm_id'], 'idx_mails_from_user_realm');
  }

  // 2. consignments 表 - 寄售查询
  if (await knex.schema.hasTable('consignments')) {
    await addIndex(knex, 'consignments', ['seller_name', 'realm_id'], 'idx_consignments_seller_realm');
    await addIndex(knex, 'consignments', ['realm_id'], 'idx_consignments_realm_id');
  }

  // 3. guild_members 表 - 角色查行会
  if (await knex.schema.hasTable('guild_members')) {
    await addIndex(knex, 'guild_members', ['user_id', 'char_name', 'realm_id'], 'idx_guild_members_user_char_realm');
    await addIndex(knex, 'guild_members', ['guild_id', 'realm_id'], 'idx_guild_members_guild_realm');
  }

  // 4. consignment_history 表 - 历史记录查询
  if (await knex.schema.hasTable('consignment_history')) {
    await addIndex(knex, 'consignment_history', ['seller_name', 'realm_id'], 'idx_consignment_history_seller_realm');
    await addIndex(knex, 'consignment_history', ['realm_id'], 'idx_consignment_history_realm_id');
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('consignment_history')) {
    await dropIndex(knex, 'consignment_history', ['realm_id'], 'idx_consignment_history_realm_id');
    await dropIndex(knex, 'consignment_history', ['seller_name', 'realm_id'], 'idx_consignment_history_seller_realm');
  }

  if (await knex.schema.hasTable('guild_members')) {
    await dropIndex(knex, 'guild_members', ['guild_id', 'realm_id'], 'idx_guild_members_guild_realm');
    await dropIndex(knex, 'guild_members', ['user_id', 'char_name', 'realm_id'], 'idx_guild_members_user_char_realm');
  }

  if (await knex.schema.hasTable('consignments')) {
    await dropIndex(knex, 'consignments', ['realm_id'], 'idx_consignments_realm_id');
    await dropIndex(knex, 'consignments', ['seller_name', 'realm_id'], 'idx_consignments_seller_realm');
  }

  if (await knex.schema.hasTable('mails')) {
    await dropIndex(knex, 'mails', ['from_user_id', 'realm_id'], 'idx_mails_from_user_realm');
    await dropIndex(knex, 'mails', ['to_user_id', 'realm_id'], 'idx_mails_to_user_realm');
  }
}
