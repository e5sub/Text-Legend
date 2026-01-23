export async function up(knex) {
  const hasTable = await knex.schema.hasTable('consignment_history');
  if (!hasTable) return;

  const hasDurability = await knex.schema.hasColumn('consignment_history', 'durability');
  if (!hasDurability) {
    await knex.schema.alterTable('consignment_history', (t) => {
      t.integer('durability');
    });
  }

  const hasMaxDurability = await knex.schema.hasColumn('consignment_history', 'max_durability');
  if (!hasMaxDurability) {
    await knex.schema.alterTable('consignment_history', (t) => {
      t.integer('max_durability');
    });
  }
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable('consignment_history');
  if (!hasTable) return;

  const hasDurability = await knex.schema.hasColumn('consignment_history', 'durability');
  if (hasDurability) {
    await knex.schema.alterTable('consignment_history', (t) => {
      t.dropColumn('durability');
    });
  }

  const hasMaxDurability = await knex.schema.hasColumn('consignment_history', 'max_durability');
  if (hasMaxDurability) {
    await knex.schema.alterTable('consignment_history', (t) => {
      t.dropColumn('max_durability');
    });
  }
}
