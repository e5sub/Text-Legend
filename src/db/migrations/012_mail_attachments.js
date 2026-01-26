export async function up(knex) {
  const hasItems = await knex.schema.hasColumn('mails', 'items_json');
  if (!hasItems) {
    await knex.schema.alterTable('mails', (t) => {
      t.text('items_json').nullable();
      t.integer('gold').notNullable().defaultTo(0);
      t.timestamp('claimed_at').nullable();
    });
  }
}

export async function down(knex) {
  const hasItems = await knex.schema.hasColumn('mails', 'items_json');
  if (hasItems) {
    await knex.schema.alterTable('mails', (t) => {
      t.dropColumn('items_json');
      t.dropColumn('gold');
      t.dropColumn('claimed_at');
    });
  }
}
