export async function up(knex) {
  await knex.schema.table('characters', (t) => {
    t.text('warehouse_json');
  });
  await knex('characters').update({ warehouse_json: '[]' });
}

export async function down(knex) {
  await knex.schema.table('characters', (t) => {
    t.dropColumn('warehouse_json');
  });
}
