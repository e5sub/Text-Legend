import { CLASSES, getStartPosition, expForLevel, maxBagSlots } from './constants.js';
import { ITEM_TEMPLATES } from './items.js';
import { getInitialSkillsForClass } from './skills.js';
import { clamp } from './utils.js';
import {
  getClassLevelBonusConfig as getClassLevelBonusFromConfig,
  getRefineBonusPerLevel,
  calcUltimateGrowthBonusPct
} from './settings.js';
import { getTreasureBonus, getTreasureRandomAttrBonus, normalizeTreasureState } from './treasure.js';

const EQUIP_BASE_ROLL_MIN_PCT = 100;
const EQUIP_BASE_ROLL_MAX_PCT = 200;

export const SPECIALIZATION_DEFS = {
  warrior: [
    {
      id: 'berserker',
      name: '狂战专精',
      desc: '偏输出，适合长线挂机清怪',
      nodes: [
        { level: 30, label: '猛攻', bonuses: { atkPct: 0.08 } },
        { level: 80, label: '续战', bonuses: { maxHpPct: 0.06 } },
        { level: 140, label: '压制', bonuses: { atkPct: 0.1 } },
        { level: 180, label: '狂怒', bonuses: { atkPct: 0.12, defPct: 0.05 } }
      ]
    },
    {
      id: 'guardian',
      name: '守御专精',
      desc: '偏生存，适合扛线与托管稳定',
      nodes: [
        { level: 30, label: '铁壁', bonuses: { defPct: 0.08, mdefPct: 0.08 } },
        { level: 80, label: '厚甲', bonuses: { maxHpPct: 0.08 } },
        { level: 140, label: '稳阵', bonuses: { defPct: 0.1, mdefPct: 0.1 } },
        { level: 180, label: '镇岳', bonuses: { defPct: 0.12, maxHpPct: 0.08 } }
      ]
    }
  ],
  mage: [
    {
      id: 'burst',
      name: '爆发专精',
      desc: '偏法术爆发，适合速刷',
      nodes: [
        { level: 30, label: '蓄势', bonuses: { magPct: 0.08 } },
        { level: 80, label: '聚能', bonuses: { maxMpPct: 0.08 } },
        { level: 140, label: '雷鸣', bonuses: { magPct: 0.1 } },
        { level: 180, label: '焚天', bonuses: { magPct: 0.12, mdefPct: 0.05 } }
      ]
    },
    {
      id: 'focus',
      name: '凝神专精',
      desc: '偏续航与稳态挂机',
      nodes: [
        { level: 30, label: '明心', bonuses: { maxMpPct: 0.1 } },
        { level: 80, label: '法盾', bonuses: { mdefPct: 0.08, defPct: 0.05 } },
        { level: 140, label: '静观', bonuses: { magPct: 0.08, dexPct: 0.08 } },
        { level: 180, label: '归一', bonuses: { magPct: 0.1, maxMpPct: 0.1 } }
      ]
    }
  ],
  taoist: [
    {
      id: 'summoner',
      name: '御灵专精',
      desc: '偏道术与召唤协同',
      nodes: [
        { level: 30, label: '聚灵', bonuses: { spiritPct: 0.08 } },
        { level: 80, label: '养神', bonuses: { maxMpPct: 0.08 } },
        { level: 140, label: '通玄', bonuses: { spiritPct: 0.1, mdefPct: 0.05 } },
        { level: 180, label: '御兽', bonuses: { spiritPct: 0.12, maxHpPct: 0.06 } }
      ]
    },
    {
      id: 'ward',
      name: '护持专精',
      desc: '偏生存与辅助稳态',
      nodes: [
        { level: 30, label: '护体', bonuses: { defPct: 0.06, mdefPct: 0.08 } },
        { level: 80, label: '养息', bonuses: { maxHpPct: 0.08 } },
        { level: 140, label: '清心', bonuses: { spiritPct: 0.08, dexPct: 0.08 } },
        { level: 180, label: '镇灵', bonuses: { defPct: 0.08, mdefPct: 0.1, maxHpPct: 0.08 } }
      ]
    }
  ]
};

function randomEquipBaseRollPct() {
  return Math.floor(Math.random() * (EQUIP_BASE_ROLL_MAX_PCT - EQUIP_BASE_ROLL_MIN_PCT + 1)) + EQUIP_BASE_ROLL_MIN_PCT;
}

export function normalizeSpecializationState(player) {
  if (!player?.flags) player.flags = {};
  const defs = SPECIALIZATION_DEFS[player.classId] || [];
  const byId = new Set(defs.map((entry) => entry.id));
  if (!player.flags.specialization || typeof player.flags.specialization !== 'object') {
    player.flags.specialization = { trackId: '' };
  }
  const current = String(player.flags.specialization.trackId || '').trim();
  if (current && !byId.has(current)) {
    player.flags.specialization.trackId = '';
  }
  return player.flags.specialization;
}

function getSpecializationTrackDef(player) {
  const state = normalizeSpecializationState(player);
  const defs = SPECIALIZATION_DEFS[player?.classId] || [];
  return defs.find((entry) => entry.id === state.trackId) || null;
}

function getUnlockedSpecializationNodes(player, trackDef = null) {
  const level = Math.max(1, Math.floor(Number(player?.level || 1)));
  const track = trackDef || getSpecializationTrackDef(player);
  if (!track) return [];
  return (track.nodes || []).filter((node) => level >= Math.max(1, Math.floor(Number(node.level || 1))));
}

function getSpecializationBonusTotals(player) {
  const track = getSpecializationTrackDef(player);
  const totals = {
    atkPct: 0,
    defPct: 0,
    magPct: 0,
    spiritPct: 0,
    mdefPct: 0,
    dexPct: 0,
    maxHpPct: 0,
    maxMpPct: 0
  };
  getUnlockedSpecializationNodes(player, track).forEach((node) => {
    const bonuses = node?.bonuses || {};
    Object.keys(totals).forEach((key) => {
      totals[key] += Math.max(0, Number(bonuses[key] || 0));
    });
  });
  return { track, totals };
}

export function buildSpecializationPayload(player) {
  const defs = SPECIALIZATION_DEFS[player?.classId] || [];
  const state = normalizeSpecializationState(player);
  return {
    activeTrackId: String(state.trackId || '').trim(),
    tracks: defs.map((track) => ({
      id: track.id,
      name: track.name,
      desc: track.desc,
      active: track.id === state.trackId,
      nodes: (track.nodes || []).map((node) => ({
        level: node.level,
        label: node.label,
        unlocked: Math.max(1, Math.floor(Number(player?.level || 1))) >= Math.max(1, Math.floor(Number(node.level || 1))),
        bonuses: { ...(node.bonuses || {}) }
      }))
    }))
  };
}

function normalizeEquipBaseRollPct(item, value, fallback = 100) {
  if (!item?.slot) return null;
  const raw = Number(value);
  // Treat 0/negative persisted values as invalid legacy data instead of forcing min roll (100%).
  const next = (Number.isFinite(raw) && raw > 0)
    ? Math.floor(raw)
    : Math.floor(Number(fallback) || 100);
  return clamp(next, EQUIP_BASE_ROLL_MIN_PCT, EQUIP_BASE_ROLL_MAX_PCT);
}

function scaleEquipBaseStat(value, baseRollPct) {
  const base = Number(value || 0);
  if (base <= 0) return 0;
  const pct = clamp(Math.floor(Number(baseRollPct || 100)), EQUIP_BASE_ROLL_MIN_PCT, EQUIP_BASE_ROLL_MAX_PCT);
  return Math.max(1, Math.floor(base * pct / 100));
}

function normalizeGrowthLevel(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

function normalizeGrowthFailStack(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

function getActivePetSkillSet(player) {
  const petState = player?.flags?.pet;
  if (!petState || !Array.isArray(petState.pets) || !petState.activePetId) return new Set();
  const active = petState.pets.find((pet) => pet && pet.id === petState.activePetId);
  if (!active || !Array.isArray(active.skills)) return new Set();
  return new Set(
    active.skills
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  );
}

function getActivePetAgilityBonus(player) {
  const petState = player?.flags?.pet;
  if (!petState || !Array.isArray(petState.pets) || !petState.activePetId) return 0;
  const active = petState.pets.find((pet) => pet && pet.id === petState.activePetId);
  if (!active || !active.aptitude) return 0;
  // 敏捷资质每100点提供1%的闪避和命中加成
  const agility = Number(active.aptitude.agility || 0);
  return agility / 100;
}

function getActivePetEquipmentEntries(player) {
  const petState = player?.flags?.pet;
  if (!petState || !Array.isArray(petState.pets) || !petState.activePetId) return [];
  const active = petState.pets.find((pet) => pet && pet.id === petState.activePetId);
  const equipped = active?.equipment;
  if (!equipped || typeof equipped !== 'object') return [];
  return Object.values(equipped)
    .filter((entry) => entry && entry.id && (entry.durability == null || entry.durability > 0))
    .map((entry) => {
      ensureDurability(entry);
      const item = ITEM_TEMPLATES[entry.id];
      if (!item || !item.slot) return null;
      return {
        item,
        effects: entry.effects || null,
        refine_level: entry.refine_level || 0,
        base_roll_pct: normalizeEquipBaseRollPct(item, entry.base_roll_pct, 100)
      };
    })
    .filter(Boolean);
}

function rarityByPrice(item) {
  if (!item) return 'common';
  if (item.rarity) return item.rarity;
  const price = Number(item.price || 0);
  if (price >= 80000) return 'legendary';
  if (price >= 30000) return 'epic';
  if (price >= 10000) return 'rare';
  if (price >= 2000) return 'uncommon';
  return 'common';
}

function normalizeEffects(effects) {
  if (!effects || typeof effects !== 'object') return null;
  const normalized = {};
  if (effects.combo) normalized.combo = true;
  if (effects.fury) normalized.fury = true;
  if (effects.unbreakable) normalized.unbreakable = true;
  if (effects.defense) normalized.defense = true;
  if (effects.dodge) normalized.dodge = true;
  if (effects.poison) normalized.poison = true;
  if (effects.healblock) normalized.healblock = true;
  if (typeof effects.skill === 'string' && effects.skill.trim()) {
    normalized.skill = effects.skill.trim();
  }
  if (Number(effects.elementAtk || 0) > 0) {
    normalized.elementAtk = Math.max(1, Math.floor(Number(effects.elementAtk)));
  }
  return Object.keys(normalized).length ? normalized : null;
}

function effectsKey(effects) {
  if (!effects) return '';
  const parts = [];
  if (effects.combo) parts.push('combo');
  if (effects.fury) parts.push('fury');
  if (effects.unbreakable) parts.push('unbreakable');
  if (effects.defense) parts.push('defense');
  if (effects.dodge) parts.push('dodge');
  if (effects.poison) parts.push('poison');
  if (effects.healblock) parts.push('healblock');
  if (effects.skill) parts.push(`skill:${effects.skill}`);
  if (Number(effects.elementAtk || 0) > 0) parts.push(`elementAtk:${Math.floor(Number(effects.elementAtk))}`);
  return parts.join('+');
}

export function getItemKey(slot) {
  if (!slot || !slot.id) return '';
  const item = ITEM_TEMPLATES[slot.id];
  const isEquipment = item && item.slot;
  const key = effectsKey(slot.effects);
  let baseKey = key ? `${slot.id}#${key}` : slot.id;
  // 装备类型需要包含耐久度信息，避免不同耐久度的装备被合并
  if (isEquipment && (slot.durability != null || slot.max_durability != null || slot.refine_level != null)) {
    const dur = slot.durability ?? 100;
    const maxDur = slot.max_durability ?? 100;
    const refineLevel = slot.refine_level ?? 0;
    const baseRollPct = normalizeEquipBaseRollPct(item, slot.base_roll_pct, 100);
    const growthLevel = normalizeGrowthLevel(slot.growth_level);
    const growthFailStack = normalizeGrowthFailStack(slot.growth_fail_stack);
    baseKey += `@${dur}/${maxDur}/+${refineLevel}/r${baseRollPct}/g${growthLevel}/gf${growthFailStack}`;
  }
  return baseKey;
}

export function sameEffects(a, b) {
  const na = normalizeEffects(a);
  const nb = normalizeEffects(b);
  return effectsKey(na) === effectsKey(nb);
}

function ensureDurability(equipped) {
  if (!equipped || !equipped.id) return;
  const item = ITEM_TEMPLATES[equipped.id];
  if (!item) return;
  if (item.slot) {
    equipped.base_roll_pct = normalizeEquipBaseRollPct(item, equipped.base_roll_pct, 100);
    equipped.growth_level = normalizeGrowthLevel(equipped.growth_level);
    equipped.growth_fail_stack = normalizeGrowthFailStack(equipped.growth_fail_stack);
  }
  if (!equipped.max_durability) {
    equipped.max_durability = 100;
  }
  if (equipped.durability == null) {
    equipped.durability = equipped.max_durability;
  }
  equipped.durability = clamp(equipped.durability, 0, equipped.max_durability);
}

export function getDurabilityMax(item) {
  if (!item) return 0;
  return 100;
}

export function getRepairCost(item, missing, player = null) {
  if (!item || missing <= 0) return 0;
  const base = item.type === 'weapon' ? 200 : item.type === 'armor' ? 180 : 160;
  const rarity = rarityByPrice(item);
  const mult = rarity === 'ultimate'
    ? 7.0
    : rarity === 'supreme'
      ? 6.0
      : rarity === 'legendary'
        ? 5.0
        : rarity === 'epic'
          ? 4.2
          : rarity === 'rare'
            ? 3.4
            : rarity === 'uncommon'
              ? 2.6
              : 2.0;
  let cost = Math.min(50000, Math.max(1, Math.floor(base * mult * missing)));
  const vipExpiresAt = Number(player?.flags?.vipExpiresAt || 0);
  const vipActive = Boolean(player?.flags?.vip) && (!vipExpiresAt || vipExpiresAt > Date.now());
  if (vipActive) {
    cost = Math.max(1, Math.floor(cost * 0.5));
  }
  return cost;
}

export function newCharacter(name, classId) {
  const cls = CLASSES[classId];
  const level = 1;
  const stats = { ...cls.base, vit: cls.base.con };
  const maxHp = cls.base.con * 10 + cls.hpPerLevel;
  const maxMp = cls.base.spirit * 8 + cls.mpPerLevel;

  return {
    name,
    classId,
    level,
    exp: 0,
    gold: 100,
    yuanbao: 0,
    hp: maxHp,
    mp: maxMp,
    max_hp: maxHp,
    max_mp: maxMp,
    stats,
    position: { ...getStartPosition() },
    inventory: [
      { id: 'potion_small', qty: 3 },
      { id: 'potion_mana', qty: 2 }
    ],
    warehouse: [],
    equipment: {
      weapon: null,
      chest: null,
      feet: null,
      ring_left: null,
      ring_right: null,
      neck: null,
      head: null,
      waist: null,
      bracelet_left: null,
      bracelet_right: null
    },
    quests: {},
    skills: getInitialSkillsForClass(classId),
    flags: {
      tutorial: true,
      pkValue: 0,
      vip: false,
      svip: false,
      svipExpiresAt: null,
      offlineAt: null,
      autoSkillId: null,
      autoFullEnabled: false,
      autoHpPct: null,
      autoMpPct: null,
      training: { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0, dex: 0 },
      cultivationLevel: -1,
      treasure: {
        equipped: [],
        levels: {}
      }
    },
    status: {}
  };
}

import { getTrainingFruitCoefficient, getTrainingPerLevelConfig } from './settings.js';

export function computeDerived(player) {
  if (!player.flags) player.flags = {};
  player.flags.hasPoisonEffect = false;
  player.flags.hasComboEffect = false;
  player.flags.hasHealblockEffect = false;
  player.flags.petHitBonusPct = 0;
  player.flags.petDamageReductionPct = 0;
  player.flags.petLowHpDamageReductionPct = 0;
  player.flags.petLowHpThresholdPct = 0;
  player.flags.petReflectChancePct = 0;
  player.flags.petReflectPct = 0;
  player.flags.petCritChancePct = 0;
  player.flags.petCritDamagePct = 0;
  player.flags.petLifestealPct = 0;
  player.flags.petCounterChancePct = 0;
  player.flags.petCounterDamagePct = 0;
  player.flags.petComboChancePct = 0;
  player.flags.petComboDamagePct = 0;
  player.flags.petArmorBreakChancePct = 0;
  player.flags.petArmorBreakPct = 0;
  player.flags.petArmorBreakMs = 0;
  player.flags.petMagicBreakChancePct = 0;
  player.flags.petMagicBreakPct = 0;
  player.flags.petMagicBreakMs = 0;
  player.flags.petWeakChancePct = 0;
  player.flags.petWeakPct = 0;
  player.flags.petWeakMs = 0;
  player.flags.petSpellEchoChancePct = 0;
  player.flags.petSpellEchoPct = 0;
  player.flags.petOverloadChancePct = 0;
  player.flags.petOverloadPct = 0;
  player.flags.petExecuteThresholdPct = 0;
  player.flags.petExecuteBonusPct = 0;
  player.flags.petRebirthChancePct = 0;
  player.flags.petRebirthHpPct = 0;
  player.flags.petDivineGuardChancePct = 0;
  player.flags.petDamageBonusPct = 0;
  player.flags.petSpellBonusPct = 0;
  if (!player.flags.training) {
    player.flags.training = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  }
  if (!player.flags.trainingFruit) {
    // 修炼果记录：存储的是修炼果数量，每次计算时乘以系数
    player.flags.trainingFruit = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  }
  normalizeTreasureState(player);
  normalizeSpecializationState(player);
  // 修炼果系数：从后台配置读取
  const TRAINING_FRUIT_COEFFICIENT = getTrainingFruitCoefficient();
  const SET_BONUS_RATE = 1.2;
  const SET_DEFS = [
    {
      id: 'holy',
      bonusRate: SET_BONUS_RATE,
      head: 'helm_holy',
      waist: 'belt_holy',
      feet: 'boots_holy',
      neck: 'necklace_soldier',
      ring: 'ring_holy',
      bracelet: 'bracelet_soldier'
    },
    {
      id: 'fashen',
      bonusRate: SET_BONUS_RATE,
      head: 'helm_mage',
      waist: 'belt_mage',
      feet: 'boots_mage',
      neck: 'necklace_fashen',
      ring: 'ring_fashen',
      bracelet: 'bracelet_fashen'
    },
    {
      id: 'tianzun',
      bonusRate: SET_BONUS_RATE,
      head: 'helm_tao',
      waist: 'belt_tao',
      feet: 'boots_tao',
      neck: 'necklace_tianzun',
      ring: 'ring_tianzun',
      bracelet: 'bracelet_tianzun'
    },
    {
      id: 'thunder',
      bonusRate: 1.4,
      head: 'helm_wargod',
      waist: 'belt_wargod',
      feet: 'boots_wargod',
      neck: 'necklace_wargod',
      ring: 'ring_wargod',
      bracelet: 'bracelet_wargod'
    },
    {
      id: 'holyflame',
      bonusRate: 1.4,
      head: 'helm_sacred',
      waist: 'belt_sacred',
      feet: 'boots_sacred',
      neck: 'necklace_sacred',
      ring: 'ring_sacred',
      bracelet: 'bracelet_sacred'
    },
    {
      id: 'soultrue',
      bonusRate: 1.4,
      head: 'helm_true',
      waist: 'belt_true',
      feet: 'boots_true',
      neck: 'necklace_true',
      ring: 'ring_true',
      bracelet: 'bracelet_true'
    },
    {
      id: 'rochie_war',
      bonusRate: 2.0,
      weapon: 'sword_rochie',
      chest: 'armor_rochie_war',
      head: 'helm_rochie_war',
      waist: 'belt_rochie_war',
      feet: 'boots_rochie_war',
      neck: 'necklace_rochie_war',
      ring: 'ring_rochie_war',
      bracelet: 'bracelet_rochie_war'
    },
    {
      id: 'rochie_mage',
      bonusRate: 2.0,
      weapon: 'staff_rochie',
      chest: 'armor_rochie_mage',
      head: 'helm_rochie_mage',
      waist: 'belt_rochie_mage',
      feet: 'boots_rochie_mage',
      neck: 'necklace_rochie_mage',
      ring: 'ring_rochie_mage',
      bracelet: 'bracelet_rochie_mage'
    },
    {
      id: 'rochie_tao',
      bonusRate: 2.0,
      weapon: 'sword_rochie_tao',
      chest: 'armor_rochie_tao',
      head: 'helm_rochie_tao',
      waist: 'belt_rochie_tao',
      feet: 'boots_rochie_tao',
      neck: 'necklace_rochie_tao',
      ring: 'ring_rochie_tao',
      bracelet: 'bracelet_rochie_tao'
    },
    {
      id: 'caiya_war',
      bonusRate: 4.0,
      weapon: 'sword_caiya',
      chest: 'armor_caiya_war',
      head: 'helm_caiya_war',
      waist: 'belt_caiya_war',
      feet: 'boots_caiya_war',
      neck: 'necklace_caiya_war',
      ring: 'ring_caiya_war',
      bracelet: 'bracelet_caiya_war'
    },
    {
      id: 'caiya_mage',
      bonusRate: 4.0,
      weapon: 'staff_caiya',
      chest: 'armor_caiya_mage',
      head: 'helm_caiya_mage',
      waist: 'belt_caiya_mage',
      feet: 'boots_caiya_mage',
      neck: 'necklace_caiya_mage',
      ring: 'ring_caiya_mage',
      bracelet: 'bracelet_caiya_mage'
    },
    {
      id: 'caiya_tao',
      bonusRate: 4.0,
      weapon: 'sword_caiya_tao',
      chest: 'armor_caiya_tao',
      head: 'helm_caiya_tao',
      waist: 'belt_caiya_tao',
      feet: 'boots_caiya_tao',
      neck: 'necklace_caiya_tao',
      ring: 'ring_caiya_tao',
      bracelet: 'bracelet_caiya_tao'
    }
  ];
  const cls = CLASSES[player.classId];
  const base = cls.base;
  const level = player.level;
  const equipped = player.equipment || {};
  const activeSetIds = new Set();
  const activeSetBonusRates = new Map();
  const activeSets = [];
  let caiyaSetActive = false;
  SET_DEFS.forEach((setDef) => {
    const partialSet =
      (!setDef.weapon || equipped.weapon?.id === setDef.weapon) &&
      (!setDef.chest || equipped.chest?.id === setDef.chest) &&
      equipped.head?.id === setDef.head &&
      equipped.waist?.id === setDef.waist &&
      equipped.feet?.id === setDef.feet &&
      equipped.neck?.id === setDef.neck &&
      (equipped.ring_left?.id === setDef.ring || equipped.ring_right?.id === setDef.ring) &&
      equipped.bracelet_left?.id === setDef.bracelet &&
      equipped.bracelet_right?.id === setDef.bracelet;
    if (partialSet) {
      const bonusRate = setDef.bonusRate || SET_BONUS_RATE;
      [
        setDef.weapon,
        setDef.chest,
        setDef.head,
        setDef.waist,
        setDef.feet,
        setDef.neck,
        setDef.ring,
        setDef.bracelet
      ].forEach((id) => {
        if (!id) return;
        activeSetIds.add(id);
        activeSetBonusRates.set(id, {
          rate: bonusRate,
          mode: setDef.bonusMode || 'all',
          mainStat: setDef.mainStat || null
        });
      });
      activeSets.push(setDef);
      if (setDef.id && setDef.id.startsWith('caiya')) {
        caiyaSetActive = true;
      }
    }
  });
  if (caiyaSetActive) {
    player.flags.caiyaTitle = '雄霸天下';
  } else if (player.flags.caiyaTitle) {
    delete player.flags.caiyaTitle;
  }
  if (activeSets.length > 0) {
    const maxBonusRate = Math.max(...activeSets.map((setDef) => setDef.bonusRate || SET_BONUS_RATE));
    if (equipped.weapon?.id) {
      activeSetIds.add(equipped.weapon.id);
      activeSetBonusRates.set(equipped.weapon.id, {
        rate: maxBonusRate,
        mode: 'all',
        mainStat: null
      });
    }
  }
  player.flags.setBonusActive = activeSetIds.size > 0;
  const bonus = Object.values(player.equipment)
    .filter((equipped) => equipped && equipped.id && (equipped.durability == null || equipped.durability > 0))
    .map((equipped) => ({
      item: ITEM_TEMPLATES[equipped.id],
      effects: equipped.effects || null,
      refine_level: equipped.refine_level || 0,
      base_roll_pct: normalizeEquipBaseRollPct(ITEM_TEMPLATES[equipped.id], equipped.base_roll_pct, 100),
      growth_level: normalizeGrowthLevel(equipped.growth_level),
      growth_fail_stack: normalizeGrowthFailStack(equipped.growth_fail_stack)
    }))
    .filter((entry) => entry.item);

  const stats = { ...base };
  const cultivationLevel = Math.floor(Number(player.flags?.cultivationLevel ?? -1));
  const cultivationBonus = cultivationLevel >= 0 ? (cultivationLevel + 1) * 100 : 0;
  if (cultivationBonus > 0) {
    stats.str += cultivationBonus;
    stats.dex += cultivationBonus;
    stats.int += cultivationBonus;
    stats.con += cultivationBonus;
    stats.spirit += cultivationBonus;
  }
  let mdefBonus = 0;
  let evadeChance = 0;
  let elementAtk = 0;
  let petAtkPct = 0;
  let petDefPct = 0;
  let petMagPct = 0;
  let petSpiritPct = 0;
  let petDexPct = 0;
  let petMaxHpPct = 0;
  let petMaxMpPct = 0;
  let dodgeEffectCount = 0;
  let poisonEffectCount = 0;
  let comboEffectCount = 0;
  let healblockEffectCount = 0;
  const refineAttrBonus = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  const growthAttrBonus = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  // 宠物大部分属性加成对人物关闭；仅保留少数明确设计的专属护主技能。
  const petSkills = new Set();
  const activePetSkills = getActivePetSkillSet(player);
  const petAgilityBonus = 0;
  if (activePetSkills.has('pet_beast_rat_swiftness')) {
    petDexPct += 0.12;
    evadeChance += 0.04;
    player.flags.petHitBonusPct += 10;
  }
  if (activePetSkills.has('pet_beast_ox_bulwark')) {
    petDefPct += 0.25;
    petMaxHpPct += 0.2;
  }
  if (activePetSkills.has('pet_beast_tiger_fang')) {
    petAtkPct += 0.22;
  }
  if (activePetSkills.has('pet_beast_rabbit_moonstep')) {
    petDexPct += 0.18;
    evadeChance += 0.06;
  }
  if (activePetSkills.has('pet_beast_dragon_might')) {
    petAtkPct += 0.16;
    petMagPct += 0.16;
    petSpiritPct += 0.16;
  }
  if (activePetSkills.has('pet_beast_snake_scale')) {
    petDefPct += 0.18;
    petMagPct += 0.12;
    petSpiritPct += 0.12;
  }
  if (activePetSkills.has('pet_beast_aegis')) {
    petDefPct += 0.4; // 神兽专属：人物防御/魔御提升40%
  }
  if (activePetSkills.has('pet_beast_goat_bless')) {
    petDefPct += 0.12;
    petMaxHpPct += 0.15;
    petMaxMpPct += 0.15;
  }
  if (activePetSkills.has('pet_beast_monkey_edge')) {
    petAtkPct += 0.15;
    petDexPct += 0.15;
    evadeChance += 0.05;
  }
  if (activePetSkills.has('pet_beast_rooster_warcry')) {
    petAtkPct += 0.14;
    petMagPct += 0.14;
    petSpiritPct += 0.14;
    player.flags.petHitBonusPct += 10;
  }
  if (activePetSkills.has('pet_beast_dog_guard')) {
    petDefPct += 0.2;
    petMaxHpPct += 0.12;
    player.flags.petDamageReductionPct += 0.05;
  }
  if (activePetSkills.has('pet_beast_pig_fortune')) {
    petDefPct += 0.15;
    petMaxHpPct += 0.28;
  }
  if (petSkills.has('pet_bash')) petAtkPct += 0.08;
  if (petSkills.has('pet_guard')) {
    petDefPct += 0.12;
    player.flags.petDamageReductionPct += 0.04;
  }
  if (petSkills.has('pet_dodge')) evadeChance += 0.06;
  if (petSkills.has('pet_focus')) player.flags.petHitBonusPct += 8;
  // 宠物敏捷资质对闪避和命中的加成
  if (petAgilityBonus > 0) {
    evadeChance += petAgilityBonus * 0.01;
    player.flags.petHitBonusPct += petAgilityBonus;
  }
  if (petSkills.has('pet_spirit')) {
    petMagPct += 0.1;
    petSpiritPct += 0.1;
  }
  if (petSkills.has('pet_spirit_adv')) {
    petMagPct += 0.2;
    petSpiritPct += 0.2;
  }
  if (petSkills.has('pet_fury')) {
    petAtkPct += 0.075;
    petMagPct += 0.075;
    petSpiritPct += 0.075;
  }
  if (petSkills.has('pet_fury_adv')) {
    petAtkPct += 0.15;
    petMagPct += 0.15;
    petSpiritPct += 0.15;
  }
  if (petSkills.has('pet_bloodline')) {
    petMaxHpPct += 0.06;
    petMaxMpPct += 0.06;
  }
  if (petSkills.has('pet_bloodline_adv')) {
    petMaxHpPct += 0.12;
    petMaxMpPct += 0.12;
  }
  if (petSkills.has('pet_quick_step')) {
    petDexPct += 0.075;
    evadeChance += 0.02;
  }
  if (petSkills.has('pet_quick_step_adv')) {
    petDexPct += 0.15;
    evadeChance += 0.04;
  }
  if (petSkills.has('pet_war_horn')) {
    petAtkPct += 0.05;
    petDefPct += 0.05;
    petMagPct += 0.05;
    petSpiritPct += 0.05;
    petDexPct += 0.05;
    petMaxHpPct += 0.05;
    petMaxMpPct += 0.05;
  }

  if (petSkills.has('pet_crit')) {
    player.flags.petCritChancePct += 10;
    player.flags.petCritDamagePct += 35;
  }
  if (petSkills.has('pet_crit_adv')) {
    player.flags.petCritChancePct += 15;
    player.flags.petCritDamagePct += 52.5;
  }
  if (petSkills.has('pet_lifesteal')) player.flags.petLifestealPct += 8;
  if (petSkills.has('pet_lifesteal_adv')) player.flags.petLifestealPct += 12;
  if (petSkills.has('pet_counter')) {
    player.flags.petCounterChancePct += 10;
    player.flags.petCounterDamagePct += 60;
  }
  if (petSkills.has('pet_counter_adv')) {
    player.flags.petCounterChancePct += 15;
    player.flags.petCounterDamagePct += 90;
  }
  if (petSkills.has('pet_combo')) {
    player.flags.petComboChancePct += 10;
    player.flags.petComboDamagePct += 70;
  }
  if (petSkills.has('pet_combo_adv')) {
    player.flags.petComboChancePct += 15;
    player.flags.petComboDamagePct += 105;
  }
  if (petSkills.has('pet_tough_skin')) player.flags.petDamageReductionPct += 0.08;
  if (petSkills.has('pet_tough_skin_adv')) player.flags.petDamageReductionPct += 0.12;
  if (petSkills.has('pet_break')) {
    player.flags.petArmorBreakChancePct += 7.5;
    player.flags.petArmorBreakPct += 7.5;
    player.flags.petArmorBreakMs = Math.max(player.flags.petArmorBreakMs, 3000);
  }
  if (petSkills.has('pet_break_adv')) {
    player.flags.petArmorBreakChancePct += 11.25;
    player.flags.petArmorBreakPct += 11.25;
    player.flags.petArmorBreakMs = Math.max(player.flags.petArmorBreakMs, 3000);
  }
  if (petSkills.has('pet_magic_break')) {
    player.flags.petMagicBreakChancePct += 7.5;
    player.flags.petMagicBreakPct += 12.5;
    player.flags.petMagicBreakMs = Math.max(player.flags.petMagicBreakMs, 3000);
  }
  if (petSkills.has('pet_magic_break_adv')) {
    player.flags.petMagicBreakChancePct += 11.25;
    player.flags.petMagicBreakPct += 18.75;
    player.flags.petMagicBreakMs = Math.max(player.flags.petMagicBreakMs, 3000);
  }
  if (petSkills.has('pet_resolve')) {
    player.flags.petLowHpThresholdPct = Math.max(player.flags.petLowHpThresholdPct, 30);
    player.flags.petLowHpDamageReductionPct += 0.15;
  }
  if (petSkills.has('pet_resolve_adv')) {
    player.flags.petLowHpThresholdPct = Math.max(player.flags.petLowHpThresholdPct, 30);
    player.flags.petLowHpDamageReductionPct += 0.225;
  }
  if (petSkills.has('pet_sunder')) {
    player.flags.petWeakChancePct += 7.5;
    player.flags.petWeakPct += 10;
    player.flags.petWeakMs = Math.max(player.flags.petWeakMs, 3000);
  }
  if (petSkills.has('pet_sunder_adv')) {
    player.flags.petWeakChancePct += 11.25;
    player.flags.petWeakPct += 15;
    player.flags.petWeakMs = Math.max(player.flags.petWeakMs, 3000);
  }
  if (petSkills.has('pet_arcane_echo')) {
    player.flags.petSpellBonusPct += 10;
    player.flags.petSpellEchoChancePct += 10;
    player.flags.petSpellEchoPct += 17.5;
  }
  if (petSkills.has('pet_arcane_echo_adv')) {
    player.flags.petSpellBonusPct += 15;
    player.flags.petSpellEchoChancePct += 15;
    player.flags.petSpellEchoPct += 26.25;
  }
  if (petSkills.has('pet_divine_guard')) {
    player.flags.petDamageReductionPct += 0.12;
    player.flags.petDivineGuardChancePct = Math.max(player.flags.petDivineGuardChancePct, 10);
  }
  if (petSkills.has('pet_kill_soul')) {
    player.flags.petExecuteThresholdPct = Math.max(player.flags.petExecuteThresholdPct, 40);
    player.flags.petExecuteBonusPct += 25;
    player.flags.petLifestealPct += 5;
  }
  if (petSkills.has('pet_soul_chain')) {
    player.flags.petReflectChancePct += 9;
    player.flags.petReflectPct += 10;
  }
  if (petSkills.has('pet_soul_chain_adv')) {
    player.flags.petReflectChancePct += 13.5;
    player.flags.petReflectPct += 15;
  }
  if (petSkills.has('pet_overload')) {
    player.flags.petOverloadChancePct += 18;
    player.flags.petOverloadPct += 35;
  }
  if (petSkills.has('pet_overload_adv')) {
    player.flags.petOverloadChancePct += 27;
    player.flags.petOverloadPct += 52.5;
  }
  if (petSkills.has('pet_rebirth')) {
    player.flags.petRebirthChancePct = Math.max(player.flags.petRebirthChancePct, 9);
    player.flags.petRebirthHpPct = Math.max(player.flags.petRebirthHpPct, 12.5);
  }
  if (petSkills.has('pet_rebirth_adv')) {
    player.flags.petRebirthChancePct = Math.max(player.flags.petRebirthChancePct, 13.5);
    player.flags.petRebirthHpPct = Math.max(player.flags.petRebirthHpPct, 18.75);
  }
  if (petSkills.has('pet_bash') || petSkills.has('pet_fury') || petSkills.has('pet_war_horn')) {
    player.flags.petDamageBonusPct += 8;
  }
  for (const entry of bonus) {
    const item = entry.item;
    const setBonus = activeSetIds.has(item.id) ? activeSetBonusRates.get(item.id) : null;
    const baseAtk = scaleEquipBaseStat(item.atk || 0, entry.base_roll_pct);
    const baseMag = scaleEquipBaseStat(item.mag || 0, entry.base_roll_pct);
    const baseSpirit = scaleEquipBaseStat(item.spirit || 0, entry.base_roll_pct);
    const baseDef = scaleEquipBaseStat(item.def || 0, entry.base_roll_pct);
    const baseMdef = scaleEquipBaseStat(item.mdef || 0, entry.base_roll_pct);
    const baseDex = scaleEquipBaseStat(item.dex || 0, entry.base_roll_pct);
    let atk = baseAtk;
    let mag = baseMag;
    let spirit = baseSpirit;
    let def = baseDef;
    let mdef = baseMdef;
    let dex = baseDex;
    if (setBonus) {
      if (setBonus.mode === 'mainOnly' && setBonus.mainStat) {
        const rate = setBonus.rate || SET_BONUS_RATE;
        if (setBonus.mainStat === 'atk') atk = Math.floor(baseAtk * rate);
        if (setBonus.mainStat === 'mag') mag = Math.floor(baseMag * rate);
        if (setBonus.mainStat === 'spirit') spirit = Math.floor(baseSpirit * rate);
        def = Math.floor(baseDef * rate);
        mdef = Math.floor(baseMdef * rate);
        dex = Math.floor(baseDex * rate);
      } else {
        const rate = setBonus.rate || SET_BONUS_RATE;
        atk = Math.floor(baseAtk * rate);
        mag = Math.floor(baseMag * rate);
        spirit = Math.floor(baseSpirit * rate);
        def = Math.floor(baseDef * rate);
        mdef = Math.floor(baseMdef * rate);
        dex = Math.floor(baseDex * rate);
      }
    }

    // 锻造等级加成：每级锻造提升所有属性（可配置，默认1点）
    const refineBonus = (entry.refine_level || 0) * getRefineBonusPerLevel();
    refineAttrBonus.atk += refineBonus;
    refineAttrBonus.mag += refineBonus;
    refineAttrBonus.spirit += refineBonus;
    refineAttrBonus.def += refineBonus;
    refineAttrBonus.mdef += refineBonus;
    refineAttrBonus.hp += refineBonus;
    refineAttrBonus.mp += refineBonus;
    refineAttrBonus.dex += refineBonus;
    const growthPct = calcUltimateGrowthBonusPct(entry.growth_level || 0);
    if (growthPct > 0) {
      growthAttrBonus.atk += Math.floor(baseAtk * growthPct);
      growthAttrBonus.mag += Math.floor(baseMag * growthPct);
      growthAttrBonus.spirit += Math.floor(baseSpirit * growthPct);
      growthAttrBonus.def += Math.floor(baseDef * growthPct);
      growthAttrBonus.mdef += Math.floor(baseMdef * growthPct);
      growthAttrBonus.dex += Math.floor(baseDex * growthPct);
      growthAttrBonus.hp += Math.floor(scaleEquipBaseStat(item.hp || 0, entry.base_roll_pct) * growthPct);
      growthAttrBonus.mp += Math.floor(scaleEquipBaseStat(item.mp || 0, entry.base_roll_pct) * growthPct);
    }
    if (entry.effects?.fury) {
      atk = Math.floor(atk * 1.25);
      mag = Math.floor(mag * 1.25);
      spirit = Math.floor(spirit * 1.25);
    }
    if (entry.effects?.defense && item.type !== 'weapon') {
      def = Math.floor(def * 1.5);
      mdef = Math.floor(mdef * 1.5);
    }
    // 闪避特效只生效一个，不叠加
    if (entry.effects?.dodge && dodgeEffectCount === 0) {
      evadeChance = 0.2;
      dodgeEffectCount++;
    }
    // 毒特效只生效一个，不叠加
    if (entry.effects?.poison && poisonEffectCount === 0) {
      player.flags.hasPoisonEffect = true;
      poisonEffectCount++;
    }
    // 连击特效只生效一个，不叠加
    if (entry.effects?.combo && comboEffectCount === 0) {
      player.flags.hasComboEffect = true;
      comboEffectCount++;
    }
    // 禁疗特效只生效一个，不叠加
    if (entry.effects?.healblock && healblockEffectCount === 0) {
      player.flags.hasHealblockEffect = true;
      healblockEffectCount++;
    }
    if (entry.effects?.elementAtk) {
      elementAtk += Math.max(0, Math.floor(entry.effects.elementAtk));
    }
    stats.str += atk || 0;
    stats.dex += dex || 0;
    stats.int += mag || 0;
    stats.con += def || 0;
    stats.spirit += spirit || 0;
    mdefBonus += mdef || 0;
  }
  const training = player.flags.training;
  const trainingFruit = player.flags.trainingFruit;

  // 修炼系统每级效果：从后台配置读取
  const TRAINING_PER_LEVEL = getTrainingPerLevelConfig();

  // 修炼加成：等级×每级增长值
  const trainingBonus = {
    hp: (training.hp || 0) * TRAINING_PER_LEVEL.hp,
    mp: (training.mp || 0) * TRAINING_PER_LEVEL.mp,
    atk: (training.atk || 0) * TRAINING_PER_LEVEL.atk,
    def: (training.def || 0) * TRAINING_PER_LEVEL.def,
    mag: (training.mag || 0) * TRAINING_PER_LEVEL.mag,
    mdef: (training.mdef || 0) * TRAINING_PER_LEVEL.mdef,
    spirit: (training.spirit || 0) * TRAINING_PER_LEVEL.spirit,
    dex: (training.dex || 0) * TRAINING_PER_LEVEL.dex
  };

  // 修炼果加成：修炼果数量×系数
  const trainingFruitBonus = {
    hp: (trainingFruit.hp || 0) * TRAINING_FRUIT_COEFFICIENT,
    mp: (trainingFruit.mp || 0) * TRAINING_FRUIT_COEFFICIENT,
    atk: (trainingFruit.atk || 0) * TRAINING_FRUIT_COEFFICIENT,
    def: (trainingFruit.def || 0) * TRAINING_FRUIT_COEFFICIENT,
    mag: (trainingFruit.mag || 0) * TRAINING_FRUIT_COEFFICIENT,
    mdef: (trainingFruit.mdef || 0) * TRAINING_FRUIT_COEFFICIENT,
    spirit: (trainingFruit.spirit || 0) * TRAINING_FRUIT_COEFFICIENT,
    dex: (trainingFruit.dex || 0) * TRAINING_FRUIT_COEFFICIENT
  };

  // Note: keep training bonuses applied at final stat calculation (atk/mag style),
  // so don't add them to base stats here.

  player.stats = stats;
  const levelUp = Math.max(0, level - 1);
  const levelBonus = getClassLevelBonusFromConfig(player.classId);
  const bonusHp = levelBonus.hpPerLevel * levelUp;
  const bonusMp = levelBonus.mpPerLevel * levelUp;
  const bonusAtk = levelBonus.atkPerLevel * levelUp;
  const bonusDef = levelBonus.defPerLevel * levelUp;
  const bonusMag = levelBonus.magPerLevel * levelUp;
  const bonusSpirit = levelBonus.spiritPerLevel * levelUp;
  const bonusMdef = levelBonus.mdefPerLevel * levelUp;

  const baseDerivedStats = {
    max_hp: base.con * 10 + cls.hpPerLevel * level + stats.con * 2 + bonusHp,
    max_mp: base.spirit * 8 + cls.mpPerLevel * level + stats.spirit * 2 + bonusMp,
    atk: stats.str + bonusAtk,
    def: stats.con + bonusDef,
    dex: 0,
    mag: 0,
    spirit: 0,
    mdef: 0
  };
  const bonusDex = levelBonus.dexPerLevel * levelUp;
  baseDerivedStats.dex = stats.dex + bonusDex;
  baseDerivedStats.mag = stats.int + bonusMag;
  baseDerivedStats.spirit = stats.spirit + bonusSpirit;
  baseDerivedStats.mdef = mdefBonus + bonusMdef;
  player.atk = Math.floor(baseDerivedStats.atk * (1 + petAtkPct));
  player.def = Math.floor(baseDerivedStats.def * (1 + petDefPct));
  player.dex = Math.floor(baseDerivedStats.dex * (1 + petDexPct));
  player.mag = Math.floor(baseDerivedStats.mag * (1 + petMagPct));
  player.spirit = Math.floor(baseDerivedStats.spirit * (1 + petSpiritPct));
  player.mdef = Math.floor(baseDerivedStats.mdef * (1 + petDefPct));
  player.max_hp = Math.floor(baseDerivedStats.max_hp * (1 + petMaxHpPct));
  player.max_mp = Math.floor(baseDerivedStats.max_mp * (1 + petMaxMpPct));
  player.elementAtk = elementAtk;
  const treasureBonus = getTreasureBonus(player);
  const treasureRandomAttr = getTreasureRandomAttrBonus(player);
  const treasureSharedAtkPct = Math.max(0, Number(treasureBonus.atkPct) || 0);
  player.atk += Math.floor(baseDerivedStats.atk * treasureSharedAtkPct);
  player.def += Math.floor(baseDerivedStats.def * Math.max(0, Number(treasureBonus.defPct) || 0));
  player.mdef += Math.floor(baseDerivedStats.mdef * Math.max(0, Number(treasureBonus.mdefPct) || 0));
  player.mag += Math.floor(baseDerivedStats.mag * treasureSharedAtkPct);
  player.spirit += Math.floor(baseDerivedStats.spirit * treasureSharedAtkPct);
  player.dex += Math.floor(baseDerivedStats.dex * Math.max(0, Number(treasureBonus.dexPct) || 0));
  player.max_hp += Math.floor(baseDerivedStats.max_hp * Math.max(0, Number(treasureBonus.maxHpPct) || 0));
  player.max_mp += Math.floor(baseDerivedStats.max_mp * Math.max(0, Number(treasureBonus.maxMpPct) || 0));
  player.max_hp += Math.max(0, treasureRandomAttr.hp || 0);
  player.max_mp += Math.max(0, treasureRandomAttr.mp || 0);
  player.atk += Math.max(0, treasureRandomAttr.atk || 0);
  player.def += Math.max(0, treasureRandomAttr.def || 0);
  player.mag += Math.max(0, treasureRandomAttr.mag || 0);
  player.mdef += Math.max(0, treasureRandomAttr.mdef || 0);
  player.spirit += Math.max(0, treasureRandomAttr.spirit || 0);
  player.dex += Math.max(0, treasureRandomAttr.dex || 0);
  player.elementAtk = Math.floor((player.elementAtk || 0) + (treasureBonus.elementAtkFlat || 0));
  player.flags.treasureExpBonusPct = Math.max(0, Math.floor((treasureBonus.expPct || 0) * 100));
  player.flags.treasureHitBonusPct = Math.max(0, Math.floor((treasureBonus.hitPct || 0) * 100));
  // 装备附加技能：激活条件与套装一致
  let equipSkillId = '';
  for (const setDef of activeSets) {
    if (equipSkillId) break;
    const needed = [];
    if (setDef.weapon) needed.push(equipped.weapon?.id === setDef.weapon ? equipped.weapon : null);
    needed.push(equipped.head?.id === setDef.head ? equipped.head : null);
    needed.push(equipped.waist?.id === setDef.waist ? equipped.waist : null);
    needed.push(equipped.feet?.id === setDef.feet ? equipped.feet : null);
    needed.push(equipped.neck?.id === setDef.neck ? equipped.neck : null);
    const ringEntry = equipped.ring_left?.id === setDef.ring
      ? equipped.ring_left
      : (equipped.ring_right?.id === setDef.ring ? equipped.ring_right : null);
    needed.push(ringEntry);
    needed.push(equipped.bracelet_left?.id === setDef.bracelet ? equipped.bracelet_left : null);
    needed.push(equipped.bracelet_right?.id === setDef.bracelet ? equipped.bracelet_right : null);
    if (needed.some((entry) => !entry || !entry.id || !entry.effects?.skill)) {
      continue;
    }
    const skillIds = needed.map((entry) => entry.effects.skill);
    if (skillIds.length && skillIds.every((id) => id === skillIds[0])) {
      equipSkillId = skillIds[0];
      break;
    }
  }
  if (equipSkillId) {
    player.flags.equipSkillId = equipSkillId;
  } else {
    delete player.flags.equipSkillId;
  }
  const dailyLucky = player.flags?.dailyLucky;
  if (dailyLucky && dailyLucky.attr && Number(dailyLucky.multiplier) > 1) {
    const extraPct = Number(dailyLucky.multiplier) - 1;
    switch (dailyLucky.attr) {
      case 'atk':
        player.atk += Math.floor(baseDerivedStats.atk * extraPct);
        break;
      case 'def':
        player.def += Math.floor(baseDerivedStats.def * extraPct);
        break;
      case 'mag':
        player.mag += Math.floor(baseDerivedStats.mag * extraPct);
        break;
      case 'mdef':
        player.mdef += Math.floor(baseDerivedStats.mdef * extraPct);
        break;
      case 'spirit':
        player.spirit += Math.floor(baseDerivedStats.spirit * extraPct);
        break;
      case 'dex':
        player.dex += Math.floor(baseDerivedStats.dex * extraPct);
        break;
      case 'max_hp':
        player.max_hp += Math.floor(baseDerivedStats.max_hp * extraPct);
        break;
      case 'max_mp':
        player.max_mp += Math.floor(baseDerivedStats.max_mp * extraPct);
        break;
      default:
        break;
    }
  }
  const specializationBonus = getSpecializationBonusTotals(player).totals;
  player.atk += Math.floor(baseDerivedStats.atk * specializationBonus.atkPct);
  player.def += Math.floor(baseDerivedStats.def * specializationBonus.defPct);
  player.mag += Math.floor(baseDerivedStats.mag * specializationBonus.magPct);
  player.spirit += Math.floor(baseDerivedStats.spirit * specializationBonus.spiritPct);
  player.mdef += Math.floor(baseDerivedStats.mdef * specializationBonus.mdefPct);
  player.dex += Math.floor(baseDerivedStats.dex * specializationBonus.dexPct);
  player.max_hp += Math.floor(baseDerivedStats.max_hp * specializationBonus.maxHpPct);
  player.max_mp += Math.floor(baseDerivedStats.max_mp * specializationBonus.maxMpPct);
  const guildAtkBonusPct = Math.max(0, Number(player?.guild?.buildAtkBonusPct || 0)) / 100;
  const guildMagBonusPct = Math.max(0, Number(player?.guild?.buildMagBonusPct || 0)) / 100;
  const guildSpiritBonusPct = Math.max(0, Number(player?.guild?.buildSpiritBonusPct || 0)) / 100;
  const guildDefBonusPct = Math.max(0, Number(player?.guild?.buildDefBonusPct || 0)) / 100;
  const guildMdefBonusPct = Math.max(0, Number(player?.guild?.buildMdefBonusPct || 0)) / 100;
  const guildHpBonusPct = Math.max(0, Number(player?.guild?.buildHpBonusPct || 0)) / 100;
  const guildBattleBonusPct = Math.max(0, Number(player?.guild?.buildBattleBonusPct || 0)) / 100;
  if (guildHpBonusPct > 0) {
    player.max_hp += Math.floor(baseDerivedStats.max_hp * guildHpBonusPct);
  }
  if (guildAtkBonusPct > 0) {
    player.atk += Math.floor(baseDerivedStats.atk * guildAtkBonusPct);
  }
  if (guildMagBonusPct > 0) {
    player.mag += Math.floor(baseDerivedStats.mag * guildMagBonusPct);
  }
  if (guildSpiritBonusPct > 0) {
    player.spirit += Math.floor(baseDerivedStats.spirit * guildSpiritBonusPct);
  }
  if (guildDefBonusPct > 0) {
    player.def += Math.floor(baseDerivedStats.def * guildDefBonusPct);
  }
  if (guildMdefBonusPct > 0) {
    player.mdef += Math.floor(baseDerivedStats.mdef * guildMdefBonusPct);
  }
  if (
    guildBattleBonusPct > 0 &&
    guildAtkBonusPct <= 0 &&
    guildMagBonusPct <= 0 &&
    guildSpiritBonusPct <= 0 &&
    guildDefBonusPct <= 0 &&
    guildMdefBonusPct <= 0 &&
    guildHpBonusPct <= 0
  ) {
    player.atk += Math.floor(baseDerivedStats.atk * guildBattleBonusPct);
    player.def += Math.floor(baseDerivedStats.def * guildBattleBonusPct);
    player.mag += Math.floor(baseDerivedStats.mag * guildBattleBonusPct);
    player.spirit += Math.floor(baseDerivedStats.spirit * guildBattleBonusPct);
    player.mdef += Math.floor(baseDerivedStats.mdef * guildBattleBonusPct);
    player.dex += Math.floor(baseDerivedStats.dex * guildBattleBonusPct);
    player.max_hp += Math.floor(baseDerivedStats.max_hp * (guildBattleBonusPct * 0.8));
    player.max_mp += Math.floor(baseDerivedStats.max_mp * (guildBattleBonusPct * 0.8));
  }

  // 锻造/修炼/修炼果属性最后加入，不参与其他百分比加成
  player.max_hp += refineAttrBonus.hp;
  player.max_mp += refineAttrBonus.mp;
  player.atk += refineAttrBonus.atk;
  player.def += refineAttrBonus.def;
  player.mag += refineAttrBonus.mag;
  player.spirit += refineAttrBonus.spirit;
  player.mdef += refineAttrBonus.mdef;
  player.dex += refineAttrBonus.dex;
  player.max_hp += growthAttrBonus.hp;
  player.max_mp += growthAttrBonus.mp;
  player.atk += growthAttrBonus.atk;
  player.def += growthAttrBonus.def;
  player.mag += growthAttrBonus.mag;
  player.spirit += growthAttrBonus.spirit;
  player.mdef += growthAttrBonus.mdef;
  player.dex += growthAttrBonus.dex;
  player.max_hp += trainingBonus.hp + trainingFruitBonus.hp;
  player.max_mp += trainingBonus.mp + trainingFruitBonus.mp;
  player.atk += trainingBonus.atk + trainingFruitBonus.atk;
  player.def += trainingBonus.def + trainingFruitBonus.def;
  player.mag += trainingBonus.mag + trainingFruitBonus.mag;
  player.spirit += trainingBonus.spirit + trainingFruitBonus.spirit;
  player.mdef += trainingBonus.mdef + trainingFruitBonus.mdef;
  player.dex += trainingBonus.dex + trainingFruitBonus.dex;

  player.evadeChance = evadeChance + (player.dex || 0) * 0.0001 + Math.max(0, treasureBonus.evadePct || 0); // 1点敏捷增加0.0001闪避

  player.hp = clamp(player.hp, 1, player.max_hp);
  player.mp = clamp(player.mp, 0, player.max_mp);
}

export function gainExp(player, amount) {
  player.exp += amount;
  let leveled = false;
  while (player.exp >= expForLevel(player.level, player.flags?.cultivationLevel)) {
    player.exp -= expForLevel(player.level, player.flags?.cultivationLevel);
    player.level += 1;
    leveled = true;
  }
  if (leveled) {
    computeDerived(player);
    player.hp = player.max_hp;
    player.mp = player.max_mp;
  }
  return leveled;
}

export function bagLimit(player) {
  return maxBagSlots(player.level);
}

export function addItem(player, itemId, qty = 1, effects = null, durability = null, max_durability = null, refine_level = null, base_roll_pct = null, growth_level = null, growth_fail_stack = null) {
  if (!player.inventory) player.inventory = [];
  const normalized = normalizeEffects(effects);
  const itemTemplate = ITEM_TEMPLATES[itemId];
  
  // 检查物品模板是否存在
  if (!itemTemplate) {
    return { ok: false, error: `无效的物品：${itemId}` };
  }
  
  const isEquipment = itemTemplate && itemTemplate.slot;
  
  // 装备类型根据耐久度和锻造等级分开存储，不堆叠
  if (isEquipment) {
    const maxDur = 100;
    const finalDur = durability !== null ? durability : maxDur;
    const finalMaxDur = max_durability !== null ? max_durability : maxDur;
    const finalRefineLevel = refine_level !== null ? refine_level : 0;
    const finalBaseRollPct = normalizeEquipBaseRollPct(itemTemplate, base_roll_pct, randomEquipBaseRollPct());
    const finalGrowthLevel = growth_level !== null ? normalizeGrowthLevel(growth_level) : 0;
    const finalGrowthFailStack = growth_fail_stack !== null ? normalizeGrowthFailStack(growth_fail_stack) : 0;
    
    // 尝试找到耐久度和锻造等级完全相同的装备进行堆叠
    const slot = player.inventory.find((i) => 
      i.id === itemId && 
      sameEffects(i.effects, normalized) &&
      i.durability === finalDur &&
      i.max_durability === finalMaxDur &&
      (i.refine_level ?? 0) === finalRefineLevel &&
      normalizeEquipBaseRollPct(itemTemplate, i.base_roll_pct, 100) === finalBaseRollPct &&
      normalizeGrowthLevel(i.growth_level) === finalGrowthLevel &&
      normalizeGrowthFailStack(i.growth_fail_stack) === finalGrowthFailStack
    );
    
    if (slot) {
      slot.qty += qty;
    } else {
      player.inventory.push({ 
        id: itemId, 
        qty, 
        effects: normalized,
        durability: finalDur,
        max_durability: finalMaxDur,
        refine_level: finalRefineLevel,
        base_roll_pct: finalBaseRollPct,
        growth_level: finalGrowthLevel,
        growth_fail_stack: finalGrowthFailStack
      });
    }
  } else {
    // 非装备类型物品正常堆叠
    const slot = player.inventory.find((i) => i.id === itemId && sameEffects(i.effects, normalized));
    if (slot) {
      slot.qty += qty;
    } else {
      const item = { id: itemId, qty, effects: normalized };
      if (durability !== null) item.durability = durability;
      if (max_durability !== null) item.max_durability = max_durability;
      if (refine_level !== null) item.refine_level = refine_level;
      if (growth_level !== null) item.growth_level = normalizeGrowthLevel(growth_level);
      if (growth_fail_stack !== null) item.growth_fail_stack = normalizeGrowthFailStack(growth_fail_stack);
      player.inventory.push(item);
    }
  }
  
  return { ok: true };
}


export function addItemToList(list, itemId, qty = 1, effects = null, durability = null, max_durability = null, refine_level = null, base_roll_pct = null, growth_level = null, growth_fail_stack = null) {
  const target = Array.isArray(list) ? list : [];
  const normalized = normalizeEffects(effects);
  const itemTemplate = ITEM_TEMPLATES[itemId];
  const isEquipment = itemTemplate && itemTemplate.slot;

  if (isEquipment) {
    const maxDur = 100;
    const finalDur = durability !== null ? durability : maxDur;
    const finalMaxDur = max_durability !== null ? max_durability : maxDur;
    const finalRefineLevel = refine_level !== null ? refine_level : 0;
    const finalBaseRollPct = normalizeEquipBaseRollPct(itemTemplate, base_roll_pct, randomEquipBaseRollPct());
    const finalGrowthLevel = growth_level !== null ? normalizeGrowthLevel(growth_level) : 0;
    const finalGrowthFailStack = growth_fail_stack !== null ? normalizeGrowthFailStack(growth_fail_stack) : 0;

    const slot = target.find((i) =>
      i.id === itemId &&
      sameEffects(i.effects, normalized) &&
      i.durability === finalDur &&
      i.max_durability === finalMaxDur &&
      (i.refine_level ?? 0) === finalRefineLevel &&
      normalizeEquipBaseRollPct(itemTemplate, i.base_roll_pct, 100) === finalBaseRollPct &&
      normalizeGrowthLevel(i.growth_level) === finalGrowthLevel &&
      normalizeGrowthFailStack(i.growth_fail_stack) === finalGrowthFailStack
    );

    if (slot) {
      slot.qty += qty;
    } else {
      target.push({
        id: itemId,
        qty,
        effects: normalized,
        durability: finalDur,
        max_durability: finalMaxDur,
        refine_level: finalRefineLevel,
        base_roll_pct: finalBaseRollPct,
        growth_level: finalGrowthLevel,
        growth_fail_stack: finalGrowthFailStack
      });
    }
  } else {
    const slot = target.find((i) => i.id === itemId && sameEffects(i.effects, normalized));
    if (slot) {
      slot.qty += qty;
    } else {
      const item = { id: itemId, qty, effects: normalized };
      if (durability !== null) item.durability = durability;
      if (max_durability !== null) item.max_durability = max_durability;
      if (refine_level !== null) item.refine_level = refine_level;
      if (growth_level !== null) item.growth_level = normalizeGrowthLevel(growth_level);
      if (growth_fail_stack !== null) item.growth_fail_stack = normalizeGrowthFailStack(growth_fail_stack);
      target.push(item);
    }
  }
  return target;
}

export function normalizeItemList(items) {
  const merged = new Map();
  (items || []).forEach((slot) => {
    if (!slot || !slot.id) return;
    const id = slot.id;
    const qty = Number(slot.qty || 0);
    if (qty <= 0) return;
    const effects = normalizeEffects(slot.effects);
    const itemTemplate = ITEM_TEMPLATES[id];
    const isEquipment = itemTemplate && itemTemplate.slot;

    let finalDur = slot.durability;
    let finalMaxDur = slot.max_durability;
    let finalRefineLevel = slot.refine_level;
    let finalBaseRollPct = slot.base_roll_pct;
    let finalGrowthLevel = normalizeGrowthLevel(slot.growth_level);
    let finalGrowthFailStack = normalizeGrowthFailStack(slot.growth_fail_stack);

    if (isEquipment) {
      finalDur = slot.durability !== null ? slot.durability : 100;
      finalMaxDur = slot.max_durability !== null ? slot.max_durability : 100;
      finalRefineLevel = slot.refine_level !== null ? slot.refine_level : 0;
      finalBaseRollPct = normalizeEquipBaseRollPct(itemTemplate, slot.base_roll_pct, 100);
      finalGrowthLevel = normalizeGrowthLevel(slot.growth_level);
      finalGrowthFailStack = normalizeGrowthFailStack(slot.growth_fail_stack);
    }

    const key = `${id}|${effectsKey(effects)}|${finalDur}|${finalMaxDur}|${finalRefineLevel}|${finalBaseRollPct ?? ''}|${finalGrowthLevel}|${finalGrowthFailStack}`;
    const cur = merged.get(key) || { id, qty: 0, effects };
    if (isEquipment) {
      cur.durability = finalDur;
      cur.max_durability = finalMaxDur;
      cur.refine_level = finalRefineLevel;
      cur.base_roll_pct = finalBaseRollPct;
      cur.growth_level = finalGrowthLevel;
      cur.growth_fail_stack = finalGrowthFailStack;
    }
    cur.qty += qty;
    merged.set(key, cur);
  });
  return Array.from(merged.values());
}

export function normalizeWarehouse(player) {
  player.warehouse = normalizeItemList(player.warehouse);
}

export function removeItemFromList(list, itemId, qty = 1, effects = null, durability = null, max_durability = null, refine_level = null, base_roll_pct = null, growth_level = null, growth_fail_stack = null) {
  if (!Array.isArray(list)) return { ok: false, list: [] };
  const normalized = normalizeEffects(effects);
  const needsMeta = durability != null || max_durability != null || refine_level != null || base_roll_pct != null || growth_level != null || growth_fail_stack != null;
  const itemTemplate = ITEM_TEMPLATES[itemId];
  const slot = list.find((i) => {
    if (!i || i.id !== itemId) return false;
    if (normalized && !sameEffects(i.effects, normalized)) return false;
    if (needsMeta) {
      if (durability != null && i.durability !== durability) return false;
      if (max_durability != null && i.max_durability !== max_durability) return false;
      if (refine_level != null && (i.refine_level ?? 0) !== refine_level) return false;
      if (base_roll_pct != null && normalizeEquipBaseRollPct(itemTemplate, i.base_roll_pct, 100) !== normalizeEquipBaseRollPct(itemTemplate, base_roll_pct, 100)) return false;
      if (growth_level != null && normalizeGrowthLevel(i.growth_level) !== normalizeGrowthLevel(growth_level)) return false;
      if (growth_fail_stack != null && normalizeGrowthFailStack(i.growth_fail_stack) !== normalizeGrowthFailStack(growth_fail_stack)) return false;
    }
    return true;
  });
  if (!slot) return { ok: false, list };
  if (slot.qty < qty) return { ok: false, list };
  slot.qty -= qty;
  if (slot.qty <= 0) {
    const next = list.filter((i) => i !== slot);
    return { ok: true, list: next };
  }
  return { ok: true, list };
}
export function normalizeInventory(player) {
  const merged = new Map();
  (player.inventory || []).forEach((slot) => {
    if (!slot || !slot.id) return;
    const id = slot.id;
    const qty = Number(slot.qty || 0);
    if (qty <= 0) return;
    const effects = normalizeEffects(slot.effects);
    const itemTemplate = ITEM_TEMPLATES[id];
    const isEquipment = itemTemplate && itemTemplate.slot;
    
    let finalDur = slot.durability;
    let finalMaxDur = slot.max_durability;
    let finalRefineLevel = slot.refine_level;
    let finalBaseRollPct = slot.base_roll_pct;
    let finalGrowthLevel = normalizeGrowthLevel(slot.growth_level);
    let finalGrowthFailStack = normalizeGrowthFailStack(slot.growth_fail_stack);

    // 只为装备添加默认耐久度和锻造等级
    if (isEquipment) {
      finalDur = slot.durability !== null ? slot.durability : 100;
      finalMaxDur = slot.max_durability !== null ? slot.max_durability : 100;
      finalRefineLevel = slot.refine_level !== null ? slot.refine_level : 0;
      finalBaseRollPct = normalizeEquipBaseRollPct(itemTemplate, slot.base_roll_pct, 100);
      finalGrowthLevel = normalizeGrowthLevel(slot.growth_level);
      finalGrowthFailStack = normalizeGrowthFailStack(slot.growth_fail_stack);
    }

    const key = `${id}|${effectsKey(effects)}|${finalDur}|${finalMaxDur}|${finalRefineLevel}|${finalBaseRollPct ?? ''}|${finalGrowthLevel}|${finalGrowthFailStack}`;
    const cur = merged.get(key) || { id, qty: 0, effects };
    if (isEquipment) {
      cur.durability = finalDur;
      cur.max_durability = finalMaxDur;
      cur.refine_level = finalRefineLevel;
      cur.base_roll_pct = finalBaseRollPct;
      cur.growth_level = finalGrowthLevel;
      cur.growth_fail_stack = finalGrowthFailStack;
    }
    cur.qty += qty;
    merged.set(key, cur);
  });
  player.inventory = Array.from(merged.values());
}
export function normalizeEquipment(player) {
  if (!player.equipment) player.equipment = {};
  if (player.equipment.ring && !player.equipment.ring_left && !player.equipment.ring_right) {
    player.equipment.ring_left = player.equipment.ring;
  }
  if (player.equipment.bracelet && !player.equipment.bracelet_left && !player.equipment.bracelet_right) {
    player.equipment.bracelet_left = player.equipment.bracelet;
  }
  delete player.equipment.ring;
  delete player.equipment.bracelet;
  player.equipment.ring_left = player.equipment.ring_left || null;
  player.equipment.ring_right = player.equipment.ring_right || null;
  player.equipment.bracelet_left = player.equipment.bracelet_left || null;
  player.equipment.bracelet_right = player.equipment.bracelet_right || null;
  Object.values(player.equipment).forEach((equipped) => ensureDurability(equipped));
}

function resolveEquipSlot(player, item) {
  const slot = item.slot;
  if (slot === 'ring') {
    if (!player.equipment.ring_left) return 'ring_left';
    if (!player.equipment.ring_right) return 'ring_right';
    return 'ring_left';
  }
  if (slot === 'bracelet') {
    if (!player.equipment.bracelet_left) return 'bracelet_left';
    if (!player.equipment.bracelet_right) return 'bracelet_right';
    return 'bracelet_left';
  }
  return slot;
}

export function removeItem(player, itemId, qty = 1, effects = null, durability = null, max_durability = null, refine_level = null, base_roll_pct = null, growth_level = null, growth_fail_stack = null) {
  if (!player || !player.inventory) return false;
  const normalized = normalizeEffects(effects);
  const needsMeta = durability != null || max_durability != null || refine_level != null || base_roll_pct != null || growth_level != null || growth_fail_stack != null;
  const itemTemplate = ITEM_TEMPLATES[itemId];
  const slot = player.inventory.find((i) => {
    if (!i || i.id !== itemId) return false;
    if (normalized && !sameEffects(i.effects, normalized)) return false;
    if (needsMeta) {
      if (durability != null && i.durability !== durability) return false;
      if (max_durability != null && i.max_durability !== max_durability) return false;
      if (refine_level != null && (i.refine_level ?? 0) !== refine_level) return false;
      if (base_roll_pct != null && normalizeEquipBaseRollPct(itemTemplate, i.base_roll_pct, 100) !== normalizeEquipBaseRollPct(itemTemplate, base_roll_pct, 100)) return false;
      if (growth_level != null && normalizeGrowthLevel(i.growth_level) !== normalizeGrowthLevel(growth_level)) return false;
      if (growth_fail_stack != null && normalizeGrowthFailStack(i.growth_fail_stack) !== normalizeGrowthFailStack(growth_fail_stack)) return false;
    }
    return true;
  });
  if (!slot) return false;
  if (slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) {
    player.inventory = player.inventory.filter((i) => i !== slot);
  }
  return true;
}

export function equipItem(player, itemId, effects = null, durability = null, max_durability = null, refine_level = null, base_roll_pct = null, growth_level = null, growth_fail_stack = null) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !item.slot) return { ok: false, msg: '\u8BE5\u7269\u54C1\u65E0\u6CD5\u88C5\u5907\u3002' };
  const normalized = normalizeEffects(effects);
  const needsMeta = durability != null || max_durability != null || refine_level != null || base_roll_pct != null || growth_level != null || growth_fail_stack != null;
  let has = player.inventory.find((i) => {
    if (!i || i.id !== itemId) return false;
    if (normalized && !sameEffects(i.effects, normalized)) return false;
    if (needsMeta) {
      if (durability != null && i.durability !== durability) return false;
      if (max_durability != null && i.max_durability !== max_durability) return false;
      if (refine_level != null && (i.refine_level ?? 0) !== refine_level) return false;
      if (base_roll_pct != null && normalizeEquipBaseRollPct(item, i.base_roll_pct, 100) !== normalizeEquipBaseRollPct(item, base_roll_pct, 100)) return false;
      if (growth_level != null && normalizeGrowthLevel(i.growth_level) !== normalizeGrowthLevel(growth_level)) return false;
      if (growth_fail_stack != null && normalizeGrowthFailStack(i.growth_fail_stack) !== normalizeGrowthFailStack(growth_fail_stack)) return false;
    }
    return true;
  });
  if (!has && !normalized && !needsMeta) {
    has = player.inventory.find((i) => i.id === itemId);
  }
  if (!has) return { ok: false, msg: '\u80CC\u5305\u91CC\u6CA1\u6709\u8BE5\u7269\u54C1\u3002' };

  normalizeEquipment(player);
  const slot = resolveEquipSlot(player, item);
  if (player.equipment[slot]) {
    addItem(player, player.equipment[slot].id, 1, player.equipment[slot].effects, player.equipment[slot].durability, player.equipment[slot].max_durability, player.equipment[slot].refine_level, player.equipment[slot].base_roll_pct, player.equipment[slot].growth_level, player.equipment[slot].growth_fail_stack);
  }

  const maxDur = 100;
  // 保留背包中物品的耐久度，如果没有则初始化为满值
  const itemDur = has.durability != null ? has.durability : maxDur;
  const itemMaxDur = has.max_durability != null ? has.max_durability : maxDur;
  const itemRefineLevel = has.refine_level != null ? has.refine_level : 0;
  const itemBaseRollPct = normalizeEquipBaseRollPct(item, has.base_roll_pct, 100);
  const itemGrowthLevel = normalizeGrowthLevel(has.growth_level);
  const itemGrowthFailStack = normalizeGrowthFailStack(has.growth_fail_stack);
  player.equipment[slot] = { id: itemId, durability: itemDur, max_durability: itemMaxDur, effects: has.effects || null, refine_level: itemRefineLevel, base_roll_pct: itemBaseRollPct, growth_level: itemGrowthLevel, growth_fail_stack: itemGrowthFailStack };
  removeItem(player, itemId, 1, has.effects, itemDur, itemMaxDur, itemRefineLevel, itemBaseRollPct, itemGrowthLevel, itemGrowthFailStack);
  computeDerived(player);
  return { ok: true, msg: `\u5DF2\u88C5\u5907${item.name}\u3002` };
}

export function unequipItem(player, slot) {
  normalizeEquipment(player);
  if (slot === 'ring') {
    slot = player.equipment.ring_left ? 'ring_left' : 'ring_right';
  }
  if (slot === 'bracelet') {
    slot = player.equipment.bracelet_left ? 'bracelet_left' : 'bracelet_right';
  }
  const current = player.equipment[slot];
  if (!current) return { ok: false, msg: '\u8BE5\u90E8\u4F4D\u6CA1\u6709\u88C5\u5907\u3002' };
  addItem(player, current.id, 1, current.effects, current.durability, current.max_durability, current.refine_level, current.base_roll_pct, current.growth_level, current.growth_fail_stack);
  player.equipment[slot] = null;
  computeDerived(player);
  return { ok: true, msg: `\u5DF2\u5378\u4E0B${ITEM_TEMPLATES[current.id].name}\u3002` };
}


