export async function up(knex) {
  const hasConsign = await knex.schema.hasTable('consignments');
  if (hasConsign) {
    const hasBaseRoll = await knex.schema.hasColumn('consignments', 'base_roll_pct');
    if (!hasBaseRoll) {
      await knex.schema.alterTable('consignments', (t) => {
        t.integer('base_roll_pct').nullable();
      });
    }
  }

  const hasHistory = await knex.schema.hasTable('consignment_history');
  if (hasHistory) {
    const hasBaseRollHistory = await knex.schema.hasColumn('consignment_history', 'base_roll_pct');
    if (!hasBaseRollHistory) {
      await knex.schema.alterTable('consignment_history', (t) => {
        t.integer('base_roll_pct').nullable();
      });
    }
  }
}

export async function down(knex) {
  const hasConsign = await knex.schema.hasTable('consignments');
  if (hasConsign) {
    const hasBaseRoll = await knex.schema.hasColumn('consignments', 'base_roll_pct');
    if (hasBaseRoll) {
      await knex.schema.alterTable('consignments', (t) => {
        t.dropColumn('base_roll_pct');
      });
    }
  }

  const hasHistory = await knex.schema.hasTable('consignment_history');
  if (hasHistory) {
    const hasBaseRollHistory = await knex.schema.hasColumn('consignment_history', 'base_roll_pct');
    if (hasBaseRollHistory) {
      await knex.schema.alterTable('consignment_history', (t) => {
        t.dropColumn('base_roll_pct');
      });
    }
  }
}
