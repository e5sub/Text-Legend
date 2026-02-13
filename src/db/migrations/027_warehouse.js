export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'warehouse_json');
  const isMysql = String(knex.client.config.client || '').toLowerCase().includes('mysql');
  if (!hasColumn) {
    await knex.schema.table('characters', (t) => {
      if (isMysql) t.specificType('warehouse_json', 'LONGTEXT');
      else t.text('warehouse_json');
    });
    await knex('characters').update({ warehouse_json: '[]' });
  }
  if (isMysql) {
    await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `warehouse_json` LONGTEXT NULL');
  }
}

export async function down(knex) {
  await knex.schema.table('characters', (t) => {
    t.dropColumn('warehouse_json');
  });
}
