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
  // 1. consignments 表 - 寄售列表查询（按realm排序+分页）
  if (await knex.schema.hasTable('consignments')) {
    await addIndex(knex, 'consignments', ['realm_id', 'created_at'], 'idx_consignments_realm_created');
    await addIndex(knex, 'consignments', ['seller_name', 'realm_id', 'created_at'], 'idx_consignments_seller_realm_created');
  }

  // 2. consignment_history 表 - 历史记录查询
  if (await knex.schema.hasTable('consignment_history')) {
    await addIndex(knex, 'consignment_history', ['seller_name', 'realm_id', 'sold_at'], 'idx_consignment_history_seller_realm_sold');
    await addIndex(knex, 'consignment_history', ['realm_id', 'sold_at'], 'idx_consignment_history_realm_sold');
  }

  // 3. mails 表 - 收件箱/发件箱查询（按时间排序）
  if (await knex.schema.hasTable('mails')) {
    await addIndex(knex, 'mails', ['to_user_id', 'realm_id', 'created_at'], 'idx_mails_to_user_realm_created');
    await addIndex(knex, 'mails', ['from_user_id', 'realm_id', 'created_at'], 'idx_mails_from_user_realm_created');
  }

  // 4. sabak_registrations 表 - 沙巴克报名查询
  if (await knex.schema.hasTable('sabak_registrations')) {
    await addIndex(knex, 'sabak_registrations', ['realm_id', 'registered_at'], 'idx_sabak_registrations_realm_registered');
    await addIndex(knex, 'sabak_registrations', ['guild_id', 'realm_id', 'registered_at'], 'idx_sabak_registrations_guild_realm_registered');
  }

  // 5. recharge_cards 表 - 充值卡查询
  if (await knex.schema.hasTable('recharge_cards')) {
    await addIndex(knex, 'recharge_cards', ['created_at'], 'idx_recharge_cards_created_at');
    await addIndex(knex, 'recharge_cards', ['used_by_user_id', 'used_at'], 'idx_recharge_cards_used_by_user_used_at');
  }

  // 6. guild_applications 表 - 行会申请查询
  if (await knex.schema.hasTable('guild_applications')) {
    await addIndex(knex, 'guild_applications', ['guild_id', 'realm_id', 'applied_at'], 'idx_guild_applications_guild_realm_applied');
    await addIndex(knex, 'guild_applications', ['guild_id', 'user_id', 'realm_id'], 'idx_guild_applications_guild_user_realm');
  }

  // 7. password_reset_tokens 表 - 清理过期token
  if (await knex.schema.hasTable('password_reset_tokens')) {
    await addIndex(knex, 'password_reset_tokens', ['expires_at'], 'idx_password_reset_tokens_expires_at');
  }
}

export async function down(knex) {
  // 7. password_reset_tokens
  if (await knex.schema.hasTable('password_reset_tokens')) {
    await dropIndex(knex, 'password_reset_tokens', ['expires_at'], 'idx_password_reset_tokens_expires_at');
  }

  // 6. guild_applications
  if (await knex.schema.hasTable('guild_applications')) {
    await dropIndex(knex, 'guild_applications', ['guild_id', 'user_id', 'realm_id'], 'idx_guild_applications_guild_user_realm');
    await dropIndex(knex, 'guild_applications', ['guild_id', 'realm_id', 'applied_at'], 'idx_guild_applications_guild_realm_applied');
  }

  // 5. recharge_cards
  if (await knex.schema.hasTable('recharge_cards')) {
    await dropIndex(knex, 'recharge_cards', ['used_by_user_id', 'used_at'], 'idx_recharge_cards_used_by_user_used_at');
    await dropIndex(knex, 'recharge_cards', ['created_at'], 'idx_recharge_cards_created_at');
  }

  // 4. sabak_registrations
  if (await knex.schema.hasTable('sabak_registrations')) {
    await dropIndex(knex, 'sabak_registrations', ['guild_id', 'realm_id', 'registered_at'], 'idx_sabak_registrations_guild_realm_registered');
    await dropIndex(knex, 'sabak_registrations', ['realm_id', 'registered_at'], 'idx_sabak_registrations_realm_registered');
  }

  // 3. mails
  if (await knex.schema.hasTable('mails')) {
    await dropIndex(knex, 'mails', ['from_user_id', 'realm_id', 'created_at'], 'idx_mails_from_user_realm_created');
    await dropIndex(knex, 'mails', ['to_user_id', 'realm_id', 'created_at'], 'idx_mails_to_user_realm_created');
  }

  // 2. consignment_history
  if (await knex.schema.hasTable('consignment_history')) {
    await dropIndex(knex, 'consignment_history', ['realm_id', 'sold_at'], 'idx_consignment_history_realm_sold');
    await dropIndex(knex, 'consignment_history', ['seller_name', 'realm_id', 'sold_at'], 'idx_consignment_history_seller_realm_sold');
  }

  // 1. consignments
  if (await knex.schema.hasTable('consignments')) {
    await dropIndex(knex, 'consignments', ['seller_name', 'realm_id', 'created_at'], 'idx_consignments_seller_realm_created');
    await dropIndex(knex, 'consignments', ['realm_id', 'created_at'], 'idx_consignments_realm_created');
  }
}
