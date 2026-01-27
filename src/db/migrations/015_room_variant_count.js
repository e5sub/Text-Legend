export async function up(knex) {
  const exists = await knex('game_settings').where({ key: 'room_variant_count' }).first();
  if (!exists) {
    await knex('game_settings').insert([
      { key: 'room_variant_count', value: '5' }
    ]);
  }
}

export async function down(knex) {
  await knex('game_settings').where({ key: 'room_variant_count' }).del();
}
