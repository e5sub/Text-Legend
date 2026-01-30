import knex from './index.js';
import { ITEM_TEMPLATES } from '../game/items.js';
import { MOB_TEMPLATES } from '../game/mobs.js';

/**
 * 获取所有装备列表
 */
export async function listItems(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const items = await knex('items')
    .orderBy('type')
    .orderByRaw("FIELD(rarity, 'common', 'uncommon', 'rare', 'epic', 'legendary', 'supreme')")
    .orderBy('item_id')
    .limit(limit)
    .offset(offset);

  const [{ count }] = await knex('items').count('* as count');
  return { items, total: parseInt(count), page, limit };
}

/**
 * 根据ID获取装备
 */
export async function getItemById(id) {
  return await knex('items').where({ id }).first();
}

/**
 * 根据item_id获取装备
 */
export async function getItemByItemId(itemId) {
  return await knex('items').where({ item_id: itemId }).first();
}

/**
 * 创建装备
 */
export async function createItem(data) {
  const item = {
    item_id: data.item_id,
    name: data.name,
    type: data.type,
    slot: data.slot || null,
    rarity: data.rarity || 'common',
    atk: data.atk || 0,
    def: data.def || 0,
    mag: data.mag || 0,
    spirit: data.spirit || 0,
    hp: data.hp || 0,
    mp: data.mp || 0,
    mdef: data.mdef || 0,
    dex: data.dex || 0,
    price: data.price || 0,
    untradable: data.untradable || false,
    unconsignable: data.unconsignable || false,
    boss_only: data.boss_only || false,
    world_boss_only: data.world_boss_only || false,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  };

  const [id] = await knex('items').insert(item);
  return { id, ...item };
}

/**
 * 更新装备
 */
export async function updateItem(id, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.slot !== undefined) updateData.slot = data.slot;
  if (data.rarity !== undefined) updateData.rarity = data.rarity;
  if (data.atk !== undefined) updateData.atk = data.atk;
  if (data.def !== undefined) updateData.def = data.def;
  if (data.mag !== undefined) updateData.mag = data.mag;
  if (data.spirit !== undefined) updateData.spirit = data.spirit;
  if (data.hp !== undefined) updateData.hp = data.hp;
  if (data.mp !== undefined) updateData.mp = data.mp;
  if (data.mdef !== undefined) updateData.mdef = data.mdef;
  if (data.dex !== undefined) updateData.dex = data.dex;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.untradable !== undefined) updateData.untradable = data.untradable;
  if (data.unconsignable !== undefined) updateData.unconsignable = data.unconsignable;
  if (data.boss_only !== undefined) updateData.boss_only = data.boss_only;
  if (data.world_boss_only !== undefined) updateData.world_boss_only = data.world_boss_only;
  updateData.updated_at = knex.fn.now();

  await knex('items').where({ id }).update(updateData);
  return await getItemById(id);
}

/**
 * 删除装备
 */
export async function deleteItem(id) {
  await knex('items').where({ id }).delete();
}

/**
 * 获取装备的掉落配置
 */
export async function getItemDrops(itemId) {
  const item = await getItemById(itemId);
  if (!item) return [];

  const drops = await knex('item_drops')
    .where({ item_id: itemId })
    .orderBy('drop_chance', 'desc');

  return drops.map(d => ({
    id: d.id,
    mob_id: d.mob_id,
    drop_chance: d.drop_chance
  }));
}

/**
 * 为装备添加掉落配置
 */
export async function addItemDrop(itemId, mobId, dropChance) {
  await knex('item_drops')
    .insert({
      item_id: itemId,
      mob_id: mobId,
      drop_chance: dropChance,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    })
    .onConflict(['item_id', 'mob_id'])
    .merge({ drop_chance: drop_chance, updated_at: knex.fn.now() });

  return await knex('item_drops')
    .where({ item_id: itemId, mob_id: mobId })
    .first();
}

/**
 * 删除装备的掉落配置
 */
export async function deleteItemDrop(dropId) {
  await knex('item_drops').where({ id: dropId }).delete();
}

/**
 * 获取所有可掉落该装备的怪物列表
 */
export async function getItemDropMobs(itemId) {
  return await knex('item_drops')
    .where({ item_id: itemId })
    .select('mob_id', 'drop_chance');
}

/**
 * 批量设置装备的掉落配置
 */
export async function setItemDrops(itemId, drops) {
  await knex('item_drops').where({ item_id: itemId }).delete();

  if (drops && drops.length > 0) {
    const insertData = drops.map(d => ({
      item_id: itemId,
      mob_id: d.mob_id,
      drop_chance: d.drop_chance,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }));

    await knex('item_drops').insert(insertData);
  }

  return await getItemDrops(itemId);
}

/**
 * 搜索装备
 */
export async function searchItems(keyword, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const items = await knex('items')
    .where(function() {
      this.where('name', 'like', `%${keyword}%`)
          .orWhere('item_id', 'like', `%${keyword}%`);
    })
    .orderBy('type')
    .orderByRaw("FIELD(rarity, 'common', 'uncommon', 'rare', 'epic', 'legendary', 'supreme')")
    .orderBy('item_id')
    .limit(limit)
    .offset(offset);

  const [{ count }] = await knex('items')
    .where(function() {
      this.where('name', 'like', `%${keyword}%`)
          .orWhere('item_id', 'like', `%${keyword}%`);
    })
    .count('* as count');

  return { items, total: parseInt(count), page, limit };
}

/**
 * 获取所有ITEM_TEMPLATES中的装备
 */
export function getItemTemplates() {
  return Object.entries(ITEM_TEMPLATES)
    .map(([key, template]) => ({
      item_id: key,
      name: template.name,
      type: template.type,
      slot: template.slot || null,
      rarity: template.rarity || 'common',
      atk: template.atk || 0,
      def: template.def || 0,
      mag: template.mag || 0,
      spirit: template.spirit || 0,
      hp: template.hp || 0,
      mp: template.mp || 0,
      mdef: template.mdef || 0,
      dex: template.dex || 0,
      price: template.price || 0,
      untradable: template.untradable || false,
      unconsignable: template.unconsignable || false,
      boss_only: template.bossOnly || false,
      world_boss_only: template.worldBossOnly || false
    }))
    .filter(item => item.type !== 'currency'); // 排除金币
}

/**
 * 检查装备是否已导入
 */
export async function checkImportedItems(itemIds) {
  const existingItems = await knex('items')
    .whereIn('item_id', itemIds)
    .select('item_id');

  const existingIds = new Set(existingItems.map(item => item.item_id));
  return {
    imported: Array.from(existingIds),
    notImported: itemIds.filter(id => !existingIds.has(id))
  };
}

/**
 * 导入装备（支持单个或批量）
 */
export async function importItems(itemIds) {
  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  for (const itemId of itemIds) {
    try {
      // 检查是否已存在
      const existing = await getItemByItemId(itemId);
      if (existing) {
        results.skipped.push({ itemId, reason: '已存在' });
        continue;
      }

      // 从ITEM_TEMPLATES获取装备数据
      const template = ITEM_TEMPLATES[itemId];
      if (!template) {
        results.failed.push({ itemId, reason: '装备不存在于ITEM_TEMPLATES' });
        continue;
      }

      // 创建装备
      const result = await createItem({
        item_id: itemId,
        name: template.name,
        type: template.type,
        slot: template.slot || null,
        rarity: template.rarity || 'common',
        atk: template.atk || 0,
        def: template.def || 0,
        mag: template.mag || 0,
        spirit: template.spirit || 0,
        hp: template.hp || 0,
        mp: template.mp || 0,
        mdef: template.mdef || 0,
        dex: template.dex || 0,
        price: template.price || 0,
        untradable: template.untradable || false,
        unconsignable: template.unconsignable || false,
        boss_only: template.bossOnly || false,
        world_boss_only: template.worldBossOnly || false
      });

      // 自动导入掉落配置（从MOB_TEMPLATES中查找）
      let dropsCount = 0;
      for (const [mobId, mob] of Object.entries(MOB_TEMPLATES)) {
        if (mob.drops) {
          const drop = mob.drops.find(d => d.id === itemId);
          if (drop) {
            await addItemDrop(result.id, mobId, drop.chance);
            dropsCount++;
          }
        }
      }

      results.success.push({ itemId, id: result.id, name: result.name, dropsCount });
    } catch (err) {
      results.failed.push({ itemId, reason: err.message });
    }
  }

  return results;
}

/**
 * 获取装备的所有掉落源（从MOB_TEMPLATES中）
 */
export function getItemDropSources(itemId) {
  const sources = [];
  for (const [mobId, mob] of Object.entries(MOB_TEMPLATES)) {
    if (mob.drops) {
      const drop = mob.drops.find(d => d.id === itemId);
      if (drop) {
        sources.push({
          mob_id: mobId,
          mob_name: mob.name,
          drop_chance: drop.chance
        });
      }
    }
  }
  return sources;
}
