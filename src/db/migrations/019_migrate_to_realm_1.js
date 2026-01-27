/**
 * 将所有现有数据迁移到新区1
 * 这个迁移确保升级后原有数据不会丢失
 */
export async function up(knex) {
  await knex.transaction(async (trx) => {
    // 确保新区1存在
    const existingRealm = await trx('realms').where('id', 1).first();
    if (!existingRealm) {
      await trx('realms').insert({
        id: 1,
        name: '玛法大陆',
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    // 将所有角色迁移到新区1（使用 OR 条件的正确语法）
    await trx('characters')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有行会迁移到新区1
    await trx('guilds')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有行会成员迁移到新区1
    await trx('guild_members')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有邮件迁移到新区1
    await trx('mails')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有寄售迁移到新区1
    await trx('consignments')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有寄售历史迁移到新区1
    await trx('consignment_history')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有沙巴克报名迁移到新区1
    await trx('sabak_registrations')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 将所有怪物刷新记录迁移到新区1
    await trx('mob_respawns')
      .whereNull('realm_id')
      .orWhere('realm_id', 0)
      .orWhereRaw('realm_id NOT IN (SELECT id FROM realms)')
      .update({ realm_id: 1 });

    // 确保沙巴克状态表中有新区1的记录
    const existingSabak = await trx('sabak_state').where('realm_id', 1).first();
    if (!existingSabak) {
      await trx('sabak_state').insert({
        realm_id: 1,
        owner_guild_id: null,
        owner_guild_name: null,
        updated_at: trx.fn.now()
      });
    }

    // 清理无效的realm_id数据（如果realms表中不存在的realm_id）
    await trx('characters').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('guilds').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('guild_members').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('mails').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('consignments').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('consignment_history').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('sabak_registrations').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('mob_respawns').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
    await trx('sabak_state').whereRaw('realm_id NOT IN (SELECT id FROM realms)').del();
  });
}

export async function down(knex) {
  // 这个迁移是单向的，不支持回滚
  // 因为回滚会导致数据丢失
}
