export async function up(knex) {
  const hasTable = await knex.schema.hasTable('consignments');
  if (hasTable) return;
  await knex.schema.createTable('consignments', (t) => {
    t.increments('id').primary();
    t.string('seller_name').notNullable();
    t.string('item_id').notNullable();
    t.integer('qty').notNullable();
    t.integer('price').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('consignments');
}
