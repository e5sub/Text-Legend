export async function up(knex) {
  if (await knex.schema.hasTable('characters')) {
    try {
      // 检查是否已有该列
      const hasColumn = await knex.schema.hasColumn('characters', 'zhuxian_tower_best_floor');
      if (!hasColumn) {
        // 添加 zhuxian_tower_best_floor 列
        await knex.schema.alterTable('characters', (t) => {
          t.integer('zhuxian_tower_best_floor').notNullable().defaultTo(0);
        });
      }
    } catch (err) {
      console.error('[migration] 添加 zhuxian_tower_best_floor 列失败:', err.message);
    }

    try {
      // 创建复合索引：realm_id + zhuxian_tower_best_floor + level + name
      await knex.schema.alterTable('characters', (t) => {
        t.index(['realm_id', 'zhuxian_tower_best_floor', 'level', 'name'], 'idx_characters_zhuxian_rank');
      });
    } catch (err) {
      // 索引可能已存在
      console.error('[migration] 创建索引失败:', err.message);
    }
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('characters')) {
    try {
      // 删除索引
      await knex.schema.alterTable('characters', (t) => {
        t.dropIndex(['realm_id', 'zhuxian_tower_best_floor', 'level', 'name'], 'idx_characters_zhuxian_rank');
      });
    } catch (err) {
      // 忽略
    }

    try {
      // 删除列
      const hasColumn = await knex.schema.hasColumn('characters', 'zhuxian_tower_best_floor');
      if (hasColumn) {
        await knex.schema.alterTable('characters', (t) => {
          t.dropColumn('zhuxian_tower_best_floor');
        });
      }
    } catch (err) {
      console.error('[migration] 删除 zhuxian_tower_best_floor 列失败:', err.message);
    }
  }
}