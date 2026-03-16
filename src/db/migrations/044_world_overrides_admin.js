export async function up(knex) {
  const hasZones = await knex.schema.hasTable('world_zones');
  if (!hasZones) {
    await knex.schema.createTable('world_zones', (t) => {
      t.string('zone_id', 64).notNullable().primary();
      t.text('data_json').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasRooms = await knex.schema.hasTable('world_rooms');
  if (!hasRooms) {
    await knex.schema.createTable('world_rooms', (t) => {
      t.string('zone_id', 64).notNullable();
      t.string('room_id', 64).notNullable();
      t.text('data_json').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
      t.primary(['zone_id', 'room_id']);
    });

    await knex.schema.alterTable('world_rooms', (t) => {
      t.index('zone_id');
      t.index('room_id');
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('world_rooms');
  await knex.schema.dropTableIfExists('world_zones');
}
