export async function up(knex) {
  // 为 mob_respawns 的 realm_id 单列查询添加索引（用于范围清理）
  if (await knex.schema.hasTable('mob_respawns')) {
    try {
      await knex.schema.alterTable('mob_respawns', (t) => {
        t.index(['realm_id'], 'idx_mob_respawns_realm_id');
      });
    } catch {
      // 索引可能已存在
    }
  }

  // 为 characters 表创建覆盖索引（覆盖 realm_id 查询的常用字段）
  if (await knex.schema.hasTable('characters')) {
    try {
      await knex.schema.alterTable('characters', (t) => {
        // 覆盖索引：包含查询条件和返回字段，避免回表
        t.index(['realm_id', 'name', 'class', 'level', 'flags_json'], 'idx_characters_realm_covering');
      });
    } catch {
      // 索引可能已存在
    }
  }

  // 为 saveCharacter 的 WHERE 子句添加复合索引
  if (await knex.schema.hasTable('characters')) {
    try {
      await knex.schema.alterTable('characters', (t) => {
        // user_id + name + realm_id 复合索引，用于快速定位角色
        t.index(['user_id', 'name', 'realm_id'], 'idx_characters_user_name_realm');
      });
    } catch {
      // 索引可能已存在
    }
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('mob_respawns')) {
    try {
      await knex.schema.alterTable('mob_respawns', (t) => {
        t.dropIndex(['realm_id'], 'idx_mob_respawns_realm_id');
      });
    } catch {
      // 忽略
    }
  }

  if (await knex.schema.hasTable('characters')) {
    try {
      await knex.schema.alterTable('characters', (t) => {
        t.dropIndex(['realm_id', 'name', 'class', 'level', 'flags_json'], 'idx_characters_realm_covering');
      });
    } catch {
      // 忽略
    }
  }

  if (await knex.schema.hasTable('characters')) {
    try {
      await knex.schema.alterTable('characters', (t) => {
        t.dropIndex(['user_id', 'name', 'realm_id'], 'idx_characters_user_name_realm');
      });
    } catch {
      // 忽略
    }
  }
}
