export async function up(knex) {
  await knex.schema.table('characters', (t) => {
    t.integer('yuanbao').notNullable().defaultTo(0);
  });

  await knex.schema.table('consignments', (t) => {
    t.string('currency', 16).notNullable().defaultTo('gold');
  });

  await knex.schema.table('consignment_history', (t) => {
    t.string('currency', 16).notNullable().defaultTo('gold');
  });

  await knex.schema.createTable('recharge_cards', (t) => {
    t.increments('id').primary();
    t.string('code', 32).notNullable().unique();
    t.integer('amount').notNullable();
    t.integer('created_by_user_id').nullable();
    t.integer('used_by_user_id').nullable();
    t.string('used_by_char_name', 64).nullable();
    t.timestamp('used_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('recharge_cards');
  await knex.schema.table('consignment_history', (t) => {
    t.dropColumn('currency');
  });
  await knex.schema.table('consignments', (t) => {
    t.dropColumn('currency');
  });
  await knex.schema.table('characters', (t) => {
    t.dropColumn('yuanbao');
  });
}
