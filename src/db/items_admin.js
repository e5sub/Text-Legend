import knex from './index.js';
import { ITEM_TEMPLATES } from '../game/items.js';
import { MOB_TEMPLATES } from '../game/mobs.js';

/**
 * 获取所有装备列表
 */
export async function listItems(page = 1, limit = 20) {
  const [{ count }] = await knex('items').count('* as count');
  const total = parseInt(count);
  const totalPages = Math.ceil(total / limit);

  // 验证页码是否有效
  const validPage = Math.max(1, Math.min(page, totalPages));

  const offset = (validPage - 1) * limit;
  const items = await knex('items')
    .orderBy('type')
    .orderByRaw("CASE rarity " +
      "WHEN 'common' THEN 0 " +
      "WHEN 'uncommon' THEN 1 " +
      "WHEN 'rare' THEN 2 " +
      "WHEN 'epic' THEN 3 " +
      "WHEN 'legendary' THEN 4 " +
      "WHEN 'supreme' THEN 5 " +
      "ELSE 6 END")
    .orderBy('item_id')
    .limit(limit)
    .offset(offset);

  return { items, total, page: validPage, limit };
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
  
  // 同步该装备到 ITEM_TEMPLATES
  const item = await getItemById(id);
  if (item) {
    const { ITEM_TEMPLATES } = await import('../game/items.js');
    if (ITEM_TEMPLATES[item.item_id]) {
      ITEM_TEMPLATES[item.item_id].atk = item.atk;
      ITEM_TEMPLATES[item.item_id].mag = item.mag;
      ITEM_TEMPLATES[item.item_id].spirit = item.spirit;
      ITEM_TEMPLATES[item.item_id].def = item.def;
      ITEM_TEMPLATES[item.item_id].mdef = item.mdef;
      ITEM_TEMPLATES[item.item_id].dex = item.dex;
      ITEM_TEMPLATES[item.item_id].hp = item.hp;
      ITEM_TEMPLATES[item.item_id].mp = item.mp;
    }
  }
  
  return item;
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

  console.log(`getItemDrops called with itemId=${itemId}, found ${drops.length} drops`);
  drops.forEach(d => {
    console.log(`  - Drop ID: ${d.id}, mob_id: ${d.mob_id}, chance: ${d.drop_chance}`);
  });

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
  console.log(`addItemDrop called: itemId=${itemId}, mobId=${mobId}, dropChance=${dropChance}`);

  if (dropChance === undefined || dropChance === null || isNaN(dropChance)) {
    console.error(`Invalid dropChance for itemId=${itemId}, mobId=${mobId}: ${dropChance}`);
    throw new Error('drop_chance is not defined or invalid');
  }

  try {
    await knex('item_drops')
      .insert({
        item_id: itemId,
        mob_id: mobId,
        drop_chance: dropChance,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .onConflict(['item_id', 'mob_id'])
      .merge({ drop_chance: dropChance, updated_at: knex.fn.now() });

    const drop = await knex('item_drops')
      .where({ item_id: itemId, mob_id: mobId })
      .first();

    console.log(`Inserted/updated drop:`, drop);

    // 同步掉落到 MOB_TEMPLATES
    await syncMobDropFromDb(drop);

    return drop;
  } catch (err) {
    console.error(`Error adding drop for itemId=${itemId}, mobId=${mobId}:`, err);
    throw err;
  }
}

/**
 * 删除装备的掉落配置
 */
export async function deleteItemDrop(dropId) {
  // 先获取掉落记录
  const drop = await knex('item_drops').where({ id: dropId }).first();
  if (!drop) return;

  // 从数据库删除
  await knex('item_drops').where({ id: dropId }).delete();

  // 从 MOB_TEMPLATES 删除
  await removeMobDropFromDb(drop.item_id, drop.mob_id);
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

  // 同步所有掉落到 MOB_TEMPLATES
  await syncAllMobDropsForItem(itemId);

  return await getItemDrops(itemId);
}

/**
 * 搜索装备
 */
export async function searchItems(keyword, page = 1, limit = 20) {
  const [{ count }] = await knex('items')
    .where(function() {
      this.where('name', 'like', `%${keyword}%`)
          .orWhere('item_id', 'like', `%${keyword}%`);
    })
    .count('* as count');
  const total = parseInt(count);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  // 验证页码是否有效
  const validPage = Math.max(1, Math.min(page, totalPages));

  const offset = (validPage - 1) * limit;
  const items = await knex('items')
    .where(function() {
      this.where('name', 'like', `%${keyword}%`)
          .orWhere('item_id', 'like', `%${keyword}%`);
    })
    .orderBy('type')
    .orderByRaw("CASE rarity " +
      "WHEN 'common' THEN 0 " +
      "WHEN 'uncommon' THEN 1 " +
      "WHEN 'rare' THEN 2 " +
      "WHEN 'epic' THEN 3 " +
      "WHEN 'legendary' THEN 4 " +
      "WHEN 'supreme' THEN 5 " +
      "ELSE 6 END")
    .orderBy('item_id')
    .limit(limit)
    .offset(offset);

  return { items, total, page: validPage, limit };
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
    updated: [],
    failed: []
  };

  for (const itemId of itemIds) {
    try {
      // 从ITEM_TEMPLATES获取装备数据
      const template = ITEM_TEMPLATES[itemId];
      if (!template) {
        results.failed.push({ itemId, reason: '装备不存在于ITEM_TEMPLATES' });
        continue;
      }

      // 检查是否已存在
      const existing = await getItemByItemId(itemId);
      console.log(`Importing item ${itemId}, existing:`, existing ? `id=${existing.id}` : 'none');
      let result;

      if (existing) {
        // 已存在，更新装备属性
        await updateItem(existing.id, {
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
        result = await getItemByItemId(itemId);
        console.log(`Updated item, result.id=${result.id}`);

        // 清除旧的掉落配置（重新导入时）
        const oldDrops = await knex('item_drops').where({ item_id: existing.id }).select('mob_id');
        console.log(`Found ${oldDrops.length} old drops to clear`);
        for (const oldDrop of oldDrops) {
          await removeMobDropFromDb(existing.id, oldDrop.mob_id);
        }
        await knex('item_drops').where({ item_id: existing.id }).delete();
      } else {
        // 不存在，创建新装备
        result = await createItem({
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
        console.log(`Created new item, result.id=${result.id}`);
      }

      // 自动导入/更新掉落配置（从MOB_TEMPLATES中查找）
      let dropsCount = 0;
      for (const [mobId, mob] of Object.entries(MOB_TEMPLATES)) {
        if (mob.drops) {
          const drop = mob.drops.find(d => d.id === itemId);
          if (drop) {
            if (drop.chance === undefined || drop.chance === null || isNaN(drop.chance)) {
              console.warn(`Skipping invalid drop for item ${itemId} from mob ${mobId}: chance=${drop.chance}`);
              continue;
            }
            console.log(`Adding drop: item_id=${result.id}, mob_id=${mobId}, chance=${drop.chance}`);
            await addItemDrop(result.id, mobId, drop.chance);
            dropsCount++;
          }
        }
      }
      console.log(`Imported ${dropsCount} drops for item ${itemId}`);

      if (existing) {
        results.updated.push({ itemId, id: result.id, name: result.name, dropsCount });
      } else {
        results.success.push({ itemId, id: result.id, name: result.name, dropsCount });
      }
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

/**
 * 批量获取装备属性（用于计算玩家属性）
 */
export async function getItemsByItemIds(itemIds) {
  if (!itemIds || itemIds.length === 0) return [];
  return await knex('items')
    .whereIn('item_id', itemIds)
    .select('item_id', 'atk', 'mag', 'spirit', 'def', 'mdef', 'dex', 'hp', 'mp', 'type');
}

/**
 * 同步数据库中的装备属性到 ITEM_TEMPLATES
 * 用于更新内存中的装备属性
 */
export async function syncItemsToTemplates() {
  const { ITEM_TEMPLATES } = await import('../game/items.js');
  const dbItems = await knex('items').select('*');

  dbItems.forEach(dbItem => {
    if (ITEM_TEMPLATES[dbItem.item_id]) {
      // 更新已存在的装备模板
      ITEM_TEMPLATES[dbItem.item_id].atk = dbItem.atk;
      ITEM_TEMPLATES[dbItem.item_id].mag = dbItem.mag;
      ITEM_TEMPLATES[dbItem.item_id].spirit = dbItem.spirit;
      ITEM_TEMPLATES[dbItem.item_id].def = dbItem.def;
      ITEM_TEMPLATES[dbItem.item_id].mdef = dbItem.mdef;
      ITEM_TEMPLATES[dbItem.item_id].dex = dbItem.dex;
      ITEM_TEMPLATES[dbItem.item_id].hp = dbItem.hp;
      ITEM_TEMPLATES[dbItem.item_id].mp = dbItem.mp;
    }
  });

  return dbItems.length;
}

/**
 * 从数据库同步单个装备的掉落到 MOB_TEMPLATES
 */
async function syncMobDropFromDb(drop) {
  if (!drop) return;

  const { MOB_TEMPLATES } = await import('../game/mobs.js');

  // 首先获取装备的 item_id
  const item = await knex('items').where({ id: drop.item_id }).first();
  if (!item) return;

  const mob = MOB_TEMPLATES[drop.mob_id];
  if (!mob) return;

  // 初始化 drops 数组
  if (!mob.drops) {
    mob.drops = [];
  }

  // 查找是否已存在该掉落
  const existingDropIndex = mob.drops.findIndex(d => d.id === item.item_id);

  if (existingDropIndex >= 0) {
    // 更新现有掉落
    mob.drops[existingDropIndex].chance = parseFloat(drop.drop_chance);
  } else {
    // 添加新掉落
    mob.drops.push({
      id: item.item_id,
      chance: parseFloat(drop.drop_chance)
    });
  }
}

/**
 * 删除怪物在 MOB_TEMPLATES 中的掉落配置
 */
async function removeMobDropFromDb(itemId, mobId) {
  const { MOB_TEMPLATES } = await import('../game/mobs.js');

  const mob = MOB_TEMPLATES[mobId];
  if (!mob || !mob.drops) return;

  // 获取装备的 item_id
  const item = await knex('items').where({ id: itemId }).first();
  if (!item) return;

  // 删除对应的掉落
  mob.drops = mob.drops.filter(d => d.id !== item.item_id);
}

/**
 * 从数据库同步某个装备的所有掉落到 MOB_TEMPLATES
 */
async function syncAllMobDropsForItem(itemId) {
  const drops = await knex('item_drops').where({ item_id: itemId });

  for (const drop of drops) {
    await syncMobDropFromDb(drop);
  }
}

/**
 * 从数据库同步所有掉落配置到 MOB_TEMPLATES
 * 服务器启动时调用，确保内存中的掉落配置与数据库一致
 */
export async function syncMobDropsToTemplates() {
  const drops = await knex('item_drops').select('*');

  for (const drop of drops) {
    await syncMobDropFromDb(drop);
  }

  return drops.length;
}
