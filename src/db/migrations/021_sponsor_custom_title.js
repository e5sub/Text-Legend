export async function up(knex) {
  await knex.schema.alterTable('sponsors', (t) => {
    t.string('custom_title', 10).defaultTo('赞助玩家');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('sponsors', (t) => {
    t.dropColumn('custom_title');
  });
}
