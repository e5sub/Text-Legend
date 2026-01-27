export async function up(knex) {
  const exists = await knex('game_settings').where({ key: 'state_throttle_enabled' }).first();
  if (!exists) {
    await knex('game_settings').insert([
      { key: 'state_throttle_enabled', value: 'false' }
    ]);
  }
  const intervalExists = await knex('game_settings').where({ key: 'state_throttle_interval_sec' }).first();
  if (!intervalExists) {
    await knex('game_settings').insert([
      { key: 'state_throttle_interval_sec', value: '10' }
    ]);
  }
}

export async function down(knex) {
  await knex('game_settings').where({ key: 'state_throttle_enabled' }).del();
  await knex('game_settings').where({ key: 'state_throttle_interval_sec' }).del();
}
