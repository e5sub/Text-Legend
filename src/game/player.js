import { CLASSES, getStartPosition, expForLevel, maxBagSlots } from './constants.js';
import { ITEM_TEMPLATES } from './items.js';
import { DEFAULT_SKILLS } from './skills.js';
import { clamp } from './utils.js';
import { getClassLevelBonusConfig as getClassLevelBonusFromConfig, getRefineBonusPerLevel } from './settings.js';

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
    baseKey += `@${dur}/${maxDur}/+${refineLevel}`;
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
    skills: [DEFAULT_SKILLS[classId]].filter(Boolean),
    flags: {
      tutorial: true,
      pkValue: 0,
      vip: false,
      offlineAt: null,
      autoSkillId: null,
      autoHpPct: null,
      autoMpPct: null,
      training: { hp: 0, mp: 0, atk: 0, mag: 0, spirit: 0, dex: 0 },
      cultivationLevel: -1
    },
    status: {}
  };
}

import { getTrainingFruitCoefficient, getTrainingPerLevelConfig } from './settings.js';

export function computeDerived(player) {
  if (!player.flags) player.flags = {};
  if (!player.flags.training) {
    player.flags.training = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  }
  if (!player.flags.trainingFruit) {
    // 修炼果记录：存储的是修炼果数量，每次计算时乘以系数
    player.flags.trainingFruit = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, mdef: 0, spirit: 0, dex: 0 };
  }
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
        setDef.head,
        setDef.waist,
        setDef.feet,
        setDef.neck,
        setDef.ring,
        setDef.bracelet
      ].forEach((id) => {
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
  player.flags.setBonusActive = activeSetIds.size > 0;
  const bonus = Object.values(player.equipment)
    .filter((equipped) => equipped && equipped.id && (equipped.durability == null || equipped.durability > 0))
    .map((equipped) => ({
      item: ITEM_TEMPLATES[equipped.id],
      effects: equipped.effects || null,
      refine_level: equipped.refine_level || 0
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
  let dodgeEffectCount = 0;
  let poisonEffectCount = 0;
  let comboEffectCount = 0;
  let healblockEffectCount = 0;
  for (const entry of bonus) {
    const item = entry.item;
    const setBonus = activeSetIds.has(item.id) ? activeSetBonusRates.get(item.id) : null;
    const baseAtk = item.atk || 0;
    const baseMag = item.mag || 0;
    const baseSpirit = item.spirit || 0;
    const baseDef = item.def || 0;
    const baseMdef = item.mdef || 0;
    const baseDex = item.dex || 0;
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
    atk += refineBonus;
    mag += refineBonus;
    spirit += refineBonus;
    def += refineBonus;
    mdef += refineBonus;
    stats.hp += refineBonus;
    stats.mp += refineBonus;
    stats.dex += refineBonus;
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

  player.max_hp = base.con * 10 + cls.hpPerLevel * level + stats.con * 2 + trainingBonus.hp + trainingFruitBonus.hp + bonusHp;
  player.max_mp = base.spirit * 8 + cls.mpPerLevel * level + stats.spirit * 2 + trainingBonus.mp + trainingFruitBonus.mp + bonusMp;

  player.atk = stats.str + trainingBonus.atk + trainingFruitBonus.atk + bonusAtk;
  player.def = stats.con + trainingBonus.def + trainingFruitBonus.def + bonusDef;
  const bonusDex = levelBonus.dexPerLevel * levelUp;
  player.dex = stats.dex + trainingBonus.dex + trainingFruitBonus.dex + bonusDex;
  player.mag = stats.int + trainingBonus.mag + trainingFruitBonus.mag + bonusMag;
  player.spirit = stats.spirit + trainingBonus.spirit + trainingFruitBonus.spirit + bonusSpirit;
  player.mdef = stats.spirit + trainingBonus.mdef + trainingFruitBonus.mdef + mdefBonus + bonusMdef;
  player.elementAtk = elementAtk;
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
  player.evadeChance = evadeChance + (player.dex || 0) * 0.0001; // 1点敏捷增加0.0001闪避

  const dailyLucky = player.flags?.dailyLucky;
  if (dailyLucky && dailyLucky.attr && Number(dailyLucky.multiplier) > 1) {
    const mult = Number(dailyLucky.multiplier);
    switch (dailyLucky.attr) {
      case 'atk':
        player.atk = Math.floor(player.atk * mult);
        break;
      case 'def':
        player.def = Math.floor(player.def * mult);
        break;
      case 'mag':
        player.mag = Math.floor(player.mag * mult);
        break;
      case 'mdef':
        player.mdef = Math.floor(player.mdef * mult);
        break;
      case 'spirit':
        player.spirit = Math.floor(player.spirit * mult);
        break;
      case 'dex':
        player.dex = Math.floor(player.dex * mult);
        break;
      case 'max_hp':
        player.max_hp = Math.floor(player.max_hp * mult);
        break;
      case 'max_mp':
        player.max_mp = Math.floor(player.max_mp * mult);
        break;
      default:
        break;
    }
  }

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

export function addItem(player, itemId, qty = 1, effects = null, durability = null, max_durability = null, refine_level = null) {
  if (!player.inventory) player.inventory = [];
  const normalized = normalizeEffects(effects);
  const itemTemplate = ITEM_TEMPLATES[itemId];
  const isEquipment = itemTemplate && itemTemplate.slot;
  
  // 装备类型根据耐久度和锻造等级分开存储，不堆叠
  if (isEquipment) {
    const maxDur = 100;
    const finalDur = durability !== null ? durability : maxDur;
    const finalMaxDur = max_durability !== null ? max_durability : maxDur;
    const finalRefineLevel = refine_level !== null ? refine_level : 0;
    
    // 尝试找到耐久度和锻造等级完全相同的装备进行堆叠
    const slot = player.inventory.find((i) => 
      i.id === itemId && 
      sameEffects(i.effects, normalized) &&
      i.durability === finalDur &&
      i.max_durability === finalMaxDur &&
      (i.refine_level ?? 0) === finalRefineLevel
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
        refine_level: finalRefineLevel
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
      player.inventory.push(item);
    }
  }
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

    // 只为装备添加默认耐久度和锻造等级
    if (isEquipment) {
      finalDur = slot.durability !== null ? slot.durability : 100;
      finalMaxDur = slot.max_durability !== null ? slot.max_durability : 100;
      finalRefineLevel = slot.refine_level !== null ? slot.refine_level : 0;
    }

    const key = `${id}|${effectsKey(effects)}|${finalDur}|${finalMaxDur}|${finalRefineLevel}`;
    const cur = merged.get(key) || { id, qty: 0, effects };
    if (isEquipment) {
      cur.durability = finalDur;
      cur.max_durability = finalMaxDur;
      cur.refine_level = finalRefineLevel;
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

export function removeItem(player, itemId, qty = 1, effects = null, durability = null, max_durability = null, refine_level = null) {
  if (!player || !player.inventory) return false;
  const normalized = normalizeEffects(effects);
  const needsMeta = durability != null || max_durability != null || refine_level != null;
  const slot = player.inventory.find((i) => {
    if (!i || i.id !== itemId) return false;
    if (normalized && !sameEffects(i.effects, normalized)) return false;
    if (needsMeta) {
      if (durability != null && i.durability !== durability) return false;
      if (max_durability != null && i.max_durability !== max_durability) return false;
      if (refine_level != null && (i.refine_level ?? 0) !== refine_level) return false;
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

export function equipItem(player, itemId, effects = null, durability = null, max_durability = null, refine_level = null) {
  const item = ITEM_TEMPLATES[itemId];
  if (!item || !item.slot) return { ok: false, msg: '\u8BE5\u7269\u54C1\u65E0\u6CD5\u88C5\u5907\u3002' };
  const normalized = normalizeEffects(effects);
  const needsMeta = durability != null || max_durability != null || refine_level != null;
  let has = player.inventory.find((i) => {
    if (!i || i.id !== itemId) return false;
    if (normalized && !sameEffects(i.effects, normalized)) return false;
    if (needsMeta) {
      if (durability != null && i.durability !== durability) return false;
      if (max_durability != null && i.max_durability !== max_durability) return false;
      if (refine_level != null && (i.refine_level ?? 0) !== refine_level) return false;
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
    addItem(player, player.equipment[slot].id, 1, player.equipment[slot].effects, player.equipment[slot].durability, player.equipment[slot].max_durability, player.equipment[slot].refine_level);
  }

  const maxDur = 100;
  // 保留背包中物品的耐久度，如果没有则初始化为满值
  const itemDur = has.durability != null ? has.durability : maxDur;
  const itemMaxDur = has.max_durability != null ? has.max_durability : maxDur;
  const itemRefineLevel = has.refine_level != null ? has.refine_level : 0;
  player.equipment[slot] = { id: itemId, durability: itemDur, max_durability: itemMaxDur, effects: has.effects || null, refine_level: itemRefineLevel };
  removeItem(player, itemId, 1, has.effects, itemDur, itemMaxDur, itemRefineLevel);
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
  addItem(player, current.id, 1, current.effects, current.durability, current.max_durability, current.refine_level);
  player.equipment[slot] = null;
  computeDerived(player);
  return { ok: true, msg: `\u5DF2\u5378\u4E0B${ITEM_TEMPLATES[current.id].name}\u3002` };
}
