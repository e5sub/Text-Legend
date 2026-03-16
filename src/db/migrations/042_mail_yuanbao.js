export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('mails', 'yuanbao');
  if (!hasColumn) {
    await knex.schema.alterTable('mails', (t) => {
      t.integer('yuanbao').notNullable().defaultTo(0);
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('mails', 'yuanbao');
  if (hasColumn) {
    await knex.schema.alterTable('mails', (t) => {
      t.dropColumn('yuanbao');
    });
  }
}
