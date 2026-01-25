export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'skills_json');
  if (!hasColumn) {
    const isSqlite = knex.client.config.client === 'sqlite3';
    await knex.schema.table('characters', (t) => {
      if (isSqlite) {
        t.text('skills_json').notNullable().defaultTo('[]');
      } else {
        t.text('skills_json');
      }
    });
    if (!isSqlite) {
      await knex('characters').update({ skills_json: '[]' });
      await knex.schema.alterTable('characters', (t) => {
        t.text('skills_json').notNullable().alter();
      });
    }
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
