export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');

  // 为 characters 表添加生成列和索引，优化诛仙塔排行榜查询
  if (await knex.schema.hasTable('characters')) {
    try {
      // 检查是否已有该列
      const hasColumn = await knex.schema.hasColumn('characters', 'has_tower_data');
      if (!hasColumn) {
        if (isMysql) {
          // MySQL: 使用生成列
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
        } else {
          // SQLite: 添加普通列，默认值为 0（稍后通过应用层更新）
          await knex.schema.alterTable('characters', (t) => {
            t.integer('has_tower_data').notNullable().defaultTo(0);
          });
        }
      }
    } catch (err) {
      console.error('[migration] 添加 has_tower_data 列失败:', err.message);
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
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');

  if (await knex.schema.hasTable('characters')) {
    try {
      if (isMysql) {
        // MySQL: dropIndex 包含 flags_json（虽然实际上索引中没有，但保持一致）
        await knex.schema.alterTable('characters', (t) => {
          t.dropIndex(['realm_id', 'has_tower_data', 'name', 'class', 'level', 'flags_json'], 'idx_characters_tower_ranking');
        });
      } else {
        // SQLite: dropIndex 不包含 flags_json
        await knex.schema.alterTable('characters', (t) => {
          t.dropIndex(['realm_id', 'has_tower_data', 'name', 'class', 'level'], 'idx_characters_tower_ranking');
        });
      }
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
    } catch (err) {
      console.error('[migration] 删除 has_tower_data 列失败:', err.message);
    }
  }
}
        await knex.schema.alterTable('characters', (t) => {
          t.dropColumn('has_tower_data');
        });
      }
    } catch {
      // 忽略
    }
  }
}
