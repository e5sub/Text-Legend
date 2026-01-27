export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'realm_id');
  if (!hasColumn) {
    const isSqlite = knex.client.config.client === 'sqlite3';
    await knex.schema.table('characters', (t) => {
      if (isSqlite) {
        t.integer('realm_id').notNullable().defaultTo(1);
      } else {
        t.integer('realm_id');
      }
    });
    if (!isSqlite) {
      await knex('characters').update({ realm_id: 1 });
      await knex.schema.alterTable('characters', (t) => {
        t.integer('realm_id').notNullable().alter();
      });
    }
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('characters', 'realm_id');
  if (hasColumn) {
    await knex.schema.table('characters', (t) => {
      t.dropColumn('realm_id');
    });
  }
}
