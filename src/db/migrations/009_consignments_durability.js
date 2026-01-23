export async function up(knex) {
  const hasTable = await knex.schema.hasTable('consignments');
  if (!hasTable) return;

  const hasDurability = await knex.schema.hasColumn('consignments', 'durability');
  if (!hasDurability) {
    await knex.schema.alterTable('consignments', (t) => {
      t.integer('durability');
    });
  }

  const hasMaxDurability = await knex.schema.hasColumn('consignments', 'max_durability');
  if (!hasMaxDurability) {
    await knex.schema.alterTable('consignments', (t) => {
      t.integer('max_durability');
    });
  }
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable('consignments');
  if (!hasTable) return;

  const hasDurability = await knex.schema.hasColumn('consignments', 'durability');
  if (hasDurability) {
    await knex.schema.alterTable('consignments', (t) => {
      t.dropColumn('durability');
    });
  }

  const hasMaxDurability = await knex.schema.hasColumn('consignments', 'max_durability');
  if (hasMaxDurability) {
    await knex.schema.alterTable('consignments', (t) => {
      t.dropColumn('max_durability');
    });
  }
}
