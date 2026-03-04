export async function up(knex) {
  const hasTable = await knex.schema.hasTable('mob_respawns');
  if (!hasTable) return;

  try {
    await knex.schema.alterTable('mob_respawns', (t) => {
      t.index(['respawn_at', 'current_hp'], 'idx_mob_respawns_expire');
    });
  } catch {
    // Ignore if the index already exists or the backend cannot add it safely.
  }
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable('mob_respawns');
  if (!hasTable) return;

  try {
    await knex.schema.alterTable('mob_respawns', (t) => {
      t.dropIndex(['respawn_at', 'current_hp'], 'idx_mob_respawns_expire');
    });
  } catch {
    // Ignore if the index does not exist.
  }
}
