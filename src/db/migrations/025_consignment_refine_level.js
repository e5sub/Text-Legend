export async function up(knex) {
  const hasConsign = await knex.schema.hasTable('consignments');
  if (hasConsign) {
    const hasRefine = await knex.schema.hasColumn('consignments', 'refine_level');
    if (!hasRefine) {
      await knex.schema.alterTable('consignments', (t) => {
        t.integer('refine_level');
      });
    }
  }

  const hasHistory = await knex.schema.hasTable('consignment_history');
  if (hasHistory) {
    const hasRefineHistory = await knex.schema.hasColumn('consignment_history', 'refine_level');
    if (!hasRefineHistory) {
      await knex.schema.alterTable('consignment_history', (t) => {
        t.integer('refine_level');
      });
    }
  }
}

export async function down(knex) {
  const hasConsign = await knex.schema.hasTable('consignments');
  if (hasConsign) {
    const hasRefine = await knex.schema.hasColumn('consignments', 'refine_level');
    if (hasRefine) {
      await knex.schema.alterTable('consignments', (t) => {
        t.dropColumn('refine_level');
      });
    }
  }

  const hasHistory = await knex.schema.hasTable('consignment_history');
  if (hasHistory) {
    const hasRefineHistory = await knex.schema.hasColumn('consignment_history', 'refine_level');
    if (hasRefineHistory) {
      await knex.schema.alterTable('consignment_history', (t) => {
        t.dropColumn('refine_level');
      });
    }
  }
}
