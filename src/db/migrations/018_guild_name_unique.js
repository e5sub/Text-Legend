export async function up(knex) {
  const hasUnique = await knex.schema.hasColumn('guilds', 'name');
  if (hasUnique) {
    try {
      // 检查是否存在重名行会
      const duplicates = await knex('guilds')
        .select('name')
        .groupBy('name')
        .havingRaw('COUNT(*) > 1');

      if (duplicates.length > 0) {
        console.warn('[Migration] 检测到重名行会，需要手动处理:', duplicates.map(d => d.name));
        // 不自动修改，让管理员手动处理
      }
    } catch (err) {
      console.error('[Migration] 检查重名行会时出错:', err.message);
    }
  }
}

export async function down(knex) {
  // 无需回滚
}
