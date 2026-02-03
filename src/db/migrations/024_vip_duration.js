export async function up(knex) {
  await knex.schema.table('vip_codes', (t) => {
    t.string('duration_type', 16).nullable();
    t.integer('duration_days').nullable();
  });
}

export async function down(knex) {
  await knex.schema.table('vip_codes', (t) => {
    t.dropColumn('duration_type');
    t.dropColumn('duration_days');
  });
}
