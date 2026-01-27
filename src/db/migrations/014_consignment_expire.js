export async function up(knex) {
  const exists = await knex('game_settings').where({ key: 'consign_expire_hours' }).first();
  if (!exists) {
    await knex('game_settings').insert([
      { key: 'consign_expire_hours', value: '48' }
    ]);
  }
}

export async function down(knex) {
  await knex('game_settings').where({ key: 'consign_expire_hours' }).del();
}
