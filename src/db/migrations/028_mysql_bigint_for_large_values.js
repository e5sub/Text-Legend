export async function up(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  const isMysql = client.includes('mysql');
  if (!isMysql) return;

  const hasCharacters = await knex.schema.hasTable('characters');
  if (hasCharacters) {
    const cols = await knex('characters').columnInfo();
    if (cols.exp) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `exp` BIGINT NOT NULL');
    if (cols.gold) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `gold` BIGINT NOT NULL');
    if (cols.hp) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `hp` BIGINT NOT NULL');
    if (cols.mp) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `mp` BIGINT NOT NULL');
    if (cols.max_hp) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `max_hp` BIGINT NOT NULL');
    if (cols.max_mp) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `max_mp` BIGINT NOT NULL');
    if (cols.yuanbao) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `yuanbao` BIGINT NOT NULL DEFAULT 0');
    if (cols.level) await knex.raw('ALTER TABLE `characters` MODIFY COLUMN `level` INT NOT NULL');
  }

  const hasConsignments = await knex.schema.hasTable('consignments');
  if (hasConsignments) {
    const cols = await knex('consignments').columnInfo();
    if (cols.price) await knex.raw('ALTER TABLE `consignments` MODIFY COLUMN `price` BIGINT NOT NULL');
    if (cols.qty) await knex.raw('ALTER TABLE `consignments` MODIFY COLUMN `qty` BIGINT NOT NULL');
  }

  const hasHistory = await knex.schema.hasTable('consignment_history');
  if (hasHistory) {
    const cols = await knex('consignment_history').columnInfo();
    if (cols.price) await knex.raw('ALTER TABLE `consignment_history` MODIFY COLUMN `price` BIGINT NOT NULL');
    if (cols.qty) await knex.raw('ALTER TABLE `consignment_history` MODIFY COLUMN `qty` BIGINT NOT NULL');
  }

  const hasMails = await knex.schema.hasTable('mails');
  if (hasMails) {
    const cols = await knex('mails').columnInfo();
    if (cols.gold) await knex.raw('ALTER TABLE `mails` MODIFY COLUMN `gold` BIGINT NOT NULL DEFAULT 0');
    if (cols.yuanbao) await knex.raw('ALTER TABLE `mails` MODIFY COLUMN `yuanbao` BIGINT NOT NULL DEFAULT 0');
  }

  const hasRechargeCards = await knex.schema.hasTable('recharge_cards');
  if (hasRechargeCards) {
    const cols = await knex('recharge_cards').columnInfo();
    if (cols.amount) await knex.raw('ALTER TABLE `recharge_cards` MODIFY COLUMN `amount` BIGINT NOT NULL');
  }
}

export async function down(knex) {
  const client = String(knex?.client?.config?.client || '').toLowerCase();
  if (!client.includes('mysql')) return;
  // no-op: avoid down migration data loss risk.
}
