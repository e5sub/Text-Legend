export async function up(knex) {
  // 为 characters 表添加生成列和索引，优化诛仙塔排行榜查询
  if (await knex.schema.hasTable('characters')) {
    try {
      // 检查是否已有该列
      const hasColumn = await knex.schema.hasColumn('characters', 'has_tower_data');
      if (!hasColumn) {
        // 添加生成列：标记是否有诛仙塔数据（基于 flags_json 是否包含 zxft）
        // 使用 LIKE 匹配更可靠，兼容各种 JSON 存储格式
        await knex.raw(`
          ALTER TABLE characters 
          ADD COLUMN has_tower_data TINYINT(1) AS (
            CASE 
              WHEN flags_json IS NULL THEN 0
              WHEN flags_json = '{}' THEN 0
              WHEN flags_json = 'null' THEN 0
              WHEN flags_json LIKE '%"zxft"%' THEN 1
              ELSE 0
            END
          ) STORED
        `);
      }
    } catch (err) {
      console.error('[migration] 添加生成列失败:', err.message);
    }

    try {
      // 创建复合索引：realm_id + has_tower_data（不包含 flags_json，因为 TEXT 不能索引）
      await knex.schema.alterTable('characters', (t) => {
        t.index(['realm_id', 'has_tower_data', 'name', 'class', 'level'], 'idx_characters_tower_ranking');
      });
    } catch {
      // 索引可能已存在
    }
  }
}

export async function down(knex) {
  if (await knex.schema.hasTable('characters')) {
    try {
      await knex.schema.alterTable('characters', (t) => {
        t.dropIndex(['realm_id', 'has_tower_data', 'name', 'class', 'level', 'flags_json'], 'idx_characters_tower_ranking');
      });
    } catch {
      // 忽略
    }

    try {
      const hasColumn = await knex.schema.hasColumn('characters', 'has_tower_data');
      if (hasColumn) {
        await knex.schema.alterTable('characters', (t) => {
          t.dropColumn('has_tower_data');
        });
      }
    } catch {
      // 忽略
    }
  }
}
