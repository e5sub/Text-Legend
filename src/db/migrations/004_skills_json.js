export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'skills_json');
  if (!hasColumn) {
    const isSqlite = knex.client.config.client === 'sqlite3';
    const isMysql = String(knex.client.config.client || '').toLowerCase().includes('mysql');
    await knex.schema.table('characters', (t) => {
      if (isSqlite) {
        t.text('skills_json').notNullable().defaultTo('[]');
      } else if (isMysql) {
        t.specificType('skills_json', 'LONGTEXT');
      } else {
        t.text('skills_json');
      }
    });
    if (!isSqlite) {
      await knex('characters').update({ skills_json: '[]' });
      if (isMysql) {
        await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `skills_json` LONGTEXT NOT NULL');
      } else {
        await knex.schema.alterTable('characters', (t) => {
          t.text('skills_json').notNullable().alter();
        });
      }
    }
  } else if (String(knex.client.config.client || '').toLowerCase().includes('mysql')) {
    await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `skills_json` LONGTEXT NOT NULL');
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'skills_json');
  if (hasColumn) {
    await knex.schema.table('characters', (t) => {
      t.dropColumn('skills_json');
    });
  }
}
