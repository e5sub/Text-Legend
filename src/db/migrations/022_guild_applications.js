export async function up(knex) {
  await knex.schema.createTable('guild_applications', (t) => {
    t.increments('id').primary();
    t.integer('guild_id').notNullable().references('guilds.id').onDelete('CASCADE');
    t.integer('user_id').notNullable();
    t.string('char_name', 64).notNullable();
    t.integer('realm_id').notNullable().defaultTo(1);
    t.timestamp('applied_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'realm_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('guild_applications');
}
