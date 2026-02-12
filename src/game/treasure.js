import { ITEM_TEMPLATES } from './items.js';

export const TREASURE_EXP_ITEM_ID = 'treasure_exp_material';
export let TREASURE_SLOT_COUNT = 6;
export let TREASURE_MAX_LEVEL = 999999;
export let TREASURE_UPGRADE_CONSUME = 2;
export let TREASURE_ADVANCE_CONSUME = 1;
export let TREASURE_ADVANCE_EFFECT_BONUS_PER_STACK = 0.001; // 每次升段 +0.1%
export let TREASURE_ADVANCE_PER_STAGE = 10;
export let TREASURE_WORLD_BOSS_DROP_MULTIPLIER = 1;
export let TREASURE_CROSS_WORLD_BOSS_DROP_MULTIPLIER = 1;
export let TREASURE_TOWER_XUANMING_DROP_CHANCE = 0.2;

const TREASURE_EFFECTS = {
  treasure_fentian_mark: { atkPctPerLevel: 0.008, elementAtkPerLevel: 3 },
  treasure_blood_blade: { atkPctPerLevel: 0.006, maxHpPctPerLevel: 0.004 },
  treasure_chixiao_talisman: { atkPctPerLevel: 0.005, magPctPerLevel: 0.005, spiritPctPerLevel: 0.005 },
  treasure_cangyan_flag: { atkPctPerLevel: 0.006, elementAtkPerLevel: 5 },
  treasure_fenyu_wheel: { atkPctPerLevel: 0.007, elementAtkPerLevel: 4 },
  treasure_jiehuo_token: { atkPctPerLevel: 0.006, hitPctPerLevel: 0.004 },

  treasure_xuanwu_core: { defPctPerLevel: 0.01, mdefPctPerLevel: 0.01 },
  treasure_taiyin_mirror: { maxHpPctPerLevel: 0.012, defPctPerLevel: 0.004 },
  treasure_guiyuan_bead: { maxHpPctPerLevel: 0.01, maxMpPctPerLevel: 0.008 },
  treasure_xuanshuang_wall: { maxHpPctPerLevel: 0.008, defPctPerLevel: 0.008, mdefPctPerLevel: 0.008 },
  treasure_beiming_armor: { maxHpPctPerLevel: 0.01, defPctPerLevel: 0.006, mdefPctPerLevel: 0.006 },
  treasure_hanyuan_stone: { maxHpPctPerLevel: 0.008, evadePctPerLevel: 0.004 },

  treasure_youluo_lamp: { hitPctPerLevel: 0.005, spiritPctPerLevel: 0.005 },
  treasure_shigou_nail: { elementAtkPerLevel: 4, atkPctPerLevel: 0.004 },
  treasure_shehun_banner: { evadePctPerLevel: 0.004, dexPctPerLevel: 0.008 },
  treasure_shiling_chain: { hitPctPerLevel: 0.006, evadePctPerLevel: 0.003, dexPctPerLevel: 0.004 },
  treasure_duanpo_bell: { hitPctPerLevel: 0.006, dexPctPerLevel: 0.006 },
  treasure_fushen_lu: { hitPctPerLevel: 0.005, evadePctPerLevel: 0.004, atkPctPerLevel: 0.003 },

  treasure_taiyi_disc: { expPctPerLevel: 0.01, maxMpPctPerLevel: 0.008 },
  treasure_zhoutian_jade: { magPctPerLevel: 0.008, spiritPctPerLevel: 0.008 },
  treasure_hongmeng_seal: { atkPctPerLevel: 0.004, defPctPerLevel: 0.004, mdefPctPerLevel: 0.004, maxHpPctPerLevel: 0.004 },
  treasure_taichu_scroll: { expPctPerLevel: 0.008, maxMpPctPerLevel: 0.01, spiritPctPerLevel: 0.004 },
  treasure_ziwei_disc: { expPctPerLevel: 0.01, maxMpPctPerLevel: 0.01 },
  treasure_taixu_script: { expPctPerLevel: 0.008, atkPctPerLevel: 0.004, maxMpPctPerLevel: 0.006 }
};

export const TREASURE_IDS = Object.keys(TREASURE_EFFECTS);

export function isTreasureItemId(itemId) {
  return Boolean(itemId && TREASURE_EFFECTS[itemId]);
}

export function getTreasureDef(itemId) {
  if (!isTreasureItemId(itemId)) return null;
  const tmpl = ITEM_TEMPLATES[itemId] || null;
  return {
    id: itemId,
    name: tmpl?.name || itemId,
    effects: TREASURE_EFFECTS[itemId]
  };
}

export function normalizeTreasureState(player) {
  if (!player.flags) player.flags = {};
  if (!player.flags.treasure || typeof player.flags.treasure !== 'object') {
    player.flags.treasure = {};
  }
  const state = player.flags.treasure;
  const equippedRaw = Array.isArray(state.equipped) ? state.equipped : [];
  const levelsRaw = state.levels && typeof state.levels === 'object' ? state.levels : {};
  const advancesRaw = state.advances && typeof state.advances === 'object' ? state.advances : {};
  const randomAttrByIdRaw = state.randomAttrById && typeof state.randomAttrById === 'object' ? state.randomAttrById : {};
  const legacyRandomAttrRaw = state.randomAttr && typeof state.randomAttr === 'object' ? state.randomAttr : null;

  const seen = new Set();
  const equipped = [];
  equippedRaw.forEach((id) => {
    const key = String(id || '').trim();
    if (!isTreasureItemId(key) || seen.has(key)) return;
    seen.add(key);
    equipped.push(key);
  });
  state.equipped = equipped.slice(0, TREASURE_SLOT_COUNT);

  const levels = {};
  Object.entries(levelsRaw).forEach(([id, lv]) => {
    if (!isTreasureItemId(id)) return;
    const parsed = Math.floor(Number(lv || 1));
    levels[id] = Math.max(1, Math.min(TREASURE_MAX_LEVEL, Number.isFinite(parsed) ? parsed : 1));
  });
  state.equipped.forEach((id) => {
    if (!levels[id]) levels[id] = 1;
  });
  state.levels = levels;

  const advances = {};
  Object.entries(advancesRaw).forEach(([id, count]) => {
    if (!isTreasureItemId(id)) return;
    const parsed = Math.max(0, Math.floor(Number(count || 0)));
    advances[id] = Number.isFinite(parsed) ? parsed : 0;
  });
  state.equipped.forEach((id) => {
    if (!Number.isFinite(advances[id])) advances[id] = 0;
  });
  state.advances = advances;

  const emptyAttrs = () => ({ hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 });
  const normalizeAttrObject = (raw) => {
    const out = emptyAttrs();
    Object.keys(out).forEach((key) => {
      const parsed = Math.max(0, Math.floor(Number(raw?.[key] || 0)));
      out[key] = Number.isFinite(parsed) ? parsed : 0;
    });
    return out;
  };
  const randomAttrById = {};
  Object.entries(randomAttrByIdRaw).forEach(([id, raw]) => {
    if (!isTreasureItemId(id)) return;
    randomAttrById[id] = normalizeAttrObject(raw);
  });
  // 兼容历史全局随机属性：合并到当前第一个已装备法宝，避免已有数值丢失
  if (legacyRandomAttrRaw && state.equipped.length > 0) {
    const firstId = state.equipped[0];
    if (!randomAttrById[firstId]) randomAttrById[firstId] = emptyAttrs();
    const legacy = normalizeAttrObject(legacyRandomAttrRaw);
    Object.keys(legacy).forEach((key) => {
      randomAttrById[firstId][key] += legacy[key];
    });
  }
  state.randomAttrById = randomAttrById;
  if (state.randomAttr) delete state.randomAttr;
  return state;
}

export function getTreasureLevel(player, itemId) {
  const state = normalizeTreasureState(player);
  const lv = Math.floor(Number(state.levels?.[itemId] || 1));
  if (!Number.isFinite(lv)) return 1;
  return Math.max(1, Math.min(TREASURE_MAX_LEVEL, lv));
}

export function getTreasureUpgradeCost(level) {
  return TREASURE_UPGRADE_CONSUME;
}

export function getTreasureAdvanceCount(player, itemId) {
  const state = normalizeTreasureState(player);
  const count = Math.max(0, Math.floor(Number(state.advances?.[itemId] || 0)));
  return Number.isFinite(count) ? count : 0;
}

export function getTreasureStageByAdvanceCount(advanceCount) {
  const count = Math.max(0, Math.floor(Number(advanceCount || 0)));
  return Math.floor(count / TREASURE_ADVANCE_PER_STAGE);
}

export function getTreasureRandomAttrBonus(player) {
  const state = normalizeTreasureState(player);
  const result = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  (state.equipped || []).forEach((id) => {
    const attrs = state.randomAttrById?.[id];
    if (!attrs) return;
    Object.keys(result).forEach((key) => {
      result[key] += Math.max(0, Math.floor(Number(attrs[key] || 0)));
    });
  });
  return result;
}

export function getTreasureRandomAttrById(player, itemId) {
  const state = normalizeTreasureState(player);
  const attrs = state.randomAttrById?.[itemId] || {};
  return {
    hp: Math.max(0, Math.floor(Number(attrs.hp || 0))),
    mp: Math.max(0, Math.floor(Number(attrs.mp || 0))),
    atk: Math.max(0, Math.floor(Number(attrs.atk || 0))),
    def: Math.max(0, Math.floor(Number(attrs.def || 0))),
    mag: Math.max(0, Math.floor(Number(attrs.mag || 0))),
    mdef: Math.max(0, Math.floor(Number(attrs.mdef || 0))),
    spirit: Math.max(0, Math.floor(Number(attrs.spirit || 0))),
    dex: Math.max(0, Math.floor(Number(attrs.dex || 0)))
  };
}

export function getTreasureBonus(player) {
  const state = normalizeTreasureState(player);
  const totals = {
    atkPct: 0,
    defPct: 0,
    mdefPct: 0,
    magPct: 0,
    spiritPct: 0,
    dexPct: 0,
    maxHpPct: 0,
    maxMpPct: 0,
    evadePct: 0,
    hitPct: 0,
    expPct: 0,
    elementAtkFlat: 0
  };
  state.equipped.forEach((id) => {
    const def = TREASURE_EFFECTS[id];
    if (!def) return;
    const advanceCount = getTreasureAdvanceCount(player, id);
    const effectMult = 1 + advanceCount * TREASURE_ADVANCE_EFFECT_BONUS_PER_STACK;
    totals.atkPct += (def.atkPctPerLevel || 0) * effectMult;
    totals.defPct += (def.defPctPerLevel || 0) * effectMult;
    totals.mdefPct += (def.mdefPctPerLevel || 0) * effectMult;
    totals.magPct += (def.magPctPerLevel || 0) * effectMult;
    totals.spiritPct += (def.spiritPctPerLevel || 0) * effectMult;
    totals.dexPct += (def.dexPctPerLevel || 0) * effectMult;
    totals.maxHpPct += (def.maxHpPctPerLevel || 0) * effectMult;
    totals.maxMpPct += (def.maxMpPctPerLevel || 0) * effectMult;
    totals.evadePct += (def.evadePctPerLevel || 0) * effectMult;
    totals.hitPct += (def.hitPctPerLevel || 0) * effectMult;
    totals.expPct += (def.expPctPerLevel || 0) * effectMult;
    totals.elementAtkFlat += Math.floor((def.elementAtkPerLevel || 0) * effectMult);
  });
  return totals;
}


export function setTreasureSlotCount(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return;
  TREASURE_SLOT_COUNT = Math.max(1, parsed);
}

export function setTreasureMaxLevel(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return;
  TREASURE_MAX_LEVEL = Math.max(1, parsed);
}

export function setTreasureUpgradeConsume(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return;
  TREASURE_UPGRADE_CONSUME = Math.max(1, parsed);
}

export function setTreasureAdvanceConsume(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return;
  TREASURE_ADVANCE_CONSUME = Math.max(1, parsed);
}

export function setTreasureAdvancePerStage(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return;
  TREASURE_ADVANCE_PER_STAGE = Math.max(1, parsed);
}

export function setTreasureAdvanceEffectBonusPerStack(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  TREASURE_ADVANCE_EFFECT_BONUS_PER_STACK = Math.max(0, parsed);
}

export function setTreasureWorldBossDropMultiplier(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  TREASURE_WORLD_BOSS_DROP_MULTIPLIER = Math.max(0, parsed);
}

export function setTreasureCrossWorldBossDropMultiplier(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  TREASURE_CROSS_WORLD_BOSS_DROP_MULTIPLIER = Math.max(0, parsed);
}

export function setTreasureTowerXuanmingDropChance(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  TREASURE_TOWER_XUANMING_DROP_CHANCE = Math.max(0, Math.min(1, parsed));
}
