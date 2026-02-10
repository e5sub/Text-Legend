// 游戏运行时配置管理（从后台加载的配置）
// 这个模块用于存储从数据库加载的配置，避免游戏逻辑直接依赖数据库

import { CLASS_LEVEL_BONUS as DEFAULT_CLASS_LEVEL_BONUS } from './constants.js';

// 职业升级属性配置（可由后台动态配置）
let classLevelBonusConfig = {
  warrior: null, // null 表示使用默认配置
  mage: null,
  taoist: null
};

// 修炼果系数配置（可由后台动态配置）
let trainingFruitCoefficient = 0.5;

// 修炼果爆率配置（可由后台动态配置，0.01 = 1%）
let trainingFruitDropRate = 0.01;

// 修炼系统每级效果配置（可由后台动态配置）
let trainingPerLevelConfig = {
  hp: 1,
  mp: 1,
  atk: 0.1,
  def: 0.1,
  mag: 0.1,
  mdef: 0.1,
  spirit: 0.1,
  dex: 0.1
};

/**
 * 设置职业升级属性配置
 * @param {string} classId - 职业ID (warrior, mage, taoist)
 * @param {object} config - 配置对象
 */
export function setClassLevelBonusConfig(classId, config) {
  if (classId && config) {
    classLevelBonusConfig[classId] = config;
  }
}

/**
 * 获取职业升级属性配置
 * @param {string} classId - 职业ID
 * @returns {object} 配置对象
 */
export function getClassLevelBonusConfig(classId) {
  // 如果有自定义配置，使用自定义；否则使用默认配置
  const customConfig = classLevelBonusConfig[classId];
  if (customConfig) {
    return customConfig;
  }
  return DEFAULT_CLASS_LEVEL_BONUS[classId] || DEFAULT_CLASS_LEVEL_BONUS.warrior;
}

/**
 * 批量设置职业升级属性配置
 * @param {object} configs - 配置对象 { warrior: {...}, mage: {...}, taoist: {...} }
 */
export function setAllClassLevelBonusConfigs(configs) {
  if (configs && typeof configs === 'object') {
    if (configs.warrior) classLevelBonusConfig.warrior = configs.warrior;
    if (configs.mage) classLevelBonusConfig.mage = configs.mage;
    if (configs.taoist) classLevelBonusConfig.taoist = configs.taoist;
  }
}

/**
 * 重置职业升级属性配置为默认值
 * @param {string} classId - 职业ID，如果为空则重置所有职业
 */
export function resetClassLevelBonusConfig(classId = null) {
  if (classId) {
    classLevelBonusConfig[classId] = null;
  } else {
    classLevelBonusConfig = {
      warrior: null,
      mage: null,
      taoist: null
    };
  }
}

/**
 * 设置修炼果系数
 * @param {number} coefficient - 系数值
 */
export function setTrainingFruitCoefficient(coefficient) {
  if (typeof coefficient === 'number' && coefficient >= 0) {
    trainingFruitCoefficient = coefficient;
  }
}

/**
 * 获取修炼果系数
 * @returns {number} 系数值
 */
export function getTrainingFruitCoefficient() {
  return trainingFruitCoefficient;
}

/**
 * 设置修炼果爆率
 * @param {number} rate - 爆率（0.01 = 1%）
 */
export function setTrainingFruitDropRate(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 1) {
    trainingFruitDropRate = rate;
  }
}

/**
 * 获取修炼果爆率
 * @returns {number} 爆率（0.01 = 1%）
 */
export function getTrainingFruitDropRate() {
  return trainingFruitDropRate;
}

/**
 * 设置修炼系统每级效果配置
 * @param {object} config - 配置对象 { hp: 1, mp: 1, atk: 0.1, def: 0.1, mag: 0.1, mdef: 0.1, spirit: 0.1, dex: 0.1 }
 */
export function setTrainingPerLevelConfig(config) {
  if (config && typeof config === 'object') {
    if (typeof config.hp === 'number') trainingPerLevelConfig.hp = config.hp;
    if (typeof config.mp === 'number') trainingPerLevelConfig.mp = config.mp;
    if (typeof config.atk === 'number') trainingPerLevelConfig.atk = config.atk;
    if (typeof config.def === 'number') trainingPerLevelConfig.def = config.def;
    if (typeof config.mag === 'number') trainingPerLevelConfig.mag = config.mag;
    if (typeof config.mdef === 'number') trainingPerLevelConfig.mdef = config.mdef;
    if (typeof config.spirit === 'number') trainingPerLevelConfig.spirit = config.spirit;
    if (typeof config.dex === 'number') trainingPerLevelConfig.dex = config.dex;
  }
}

/**
 * 获取修炼系统每级效果配置
 * @returns {object} 配置对象
 */
export function getTrainingPerLevelConfig() {
  return trainingPerLevelConfig;
}

/**
 * 重置修炼系统每级效果配置为默认值
 */
export function resetTrainingPerLevelConfig() {
  trainingPerLevelConfig = {
    hp: 1,
    mp: 1,
    atk: 0.1,
    def: 0.1,
    mag: 0.1,
    mdef: 0.1,
    spirit: 0.1,
    dex: 0.1
  };
}

// 锻造系统配置（可由后台动态配置）
let refineBaseSuccessRate = 50; // 基础成功率(%)
let refineDecayRate = 3; // 每10级降低的百分比
let refineMaterialCount = 20; // 所需材料数量
let refineBonusPerLevel = 1; // 每级锻造加成值

// 特效装备掉落配置（可由后台动态配置）
let effectDropSingleChance = 0.009; // 单特效掉落概率(%)
let effectDropDoubleChance = 0.001; // 双特效掉落概率(%)
let equipSkillDropChance = 0.5; // 装备附加技能掉落概率(%)

// 特效重置配置（可由后台动态配置）
let effectResetSuccessRate = 0.1; // 成功率(%)
let effectResetDoubleRate = 0.01; // 双特效概率(%)
let effectResetTripleRate = 0.001; // 3特效概率(%)
let effectResetQuadrupleRate = 0.0001; // 4特效概率(%)
let effectResetQuintupleRate = 0.00001; // 5特效概率(%)

/**
 * 设置锻造基础成功率
 * @param {number} rate - 成功率(%)
 */
export function setRefineBaseSuccessRate(rate) {
  if (typeof rate === 'number' && rate >= 1 && rate <= 100) {
    refineBaseSuccessRate = rate;
  }
}

/**
 * 获取锻造基础成功率
 * @returns {number} 成功率(%)
 */
export function getRefineBaseSuccessRate() {
  return refineBaseSuccessRate;
}

/**
 * 设置锻造成功率衰减率
 * @param {number} rate - 衰减率(%)
 */
export function setRefineDecayRate(rate) {
  if (typeof rate === 'number' && rate >= 0) {
    refineDecayRate = rate;
  }
}

/**
 * 获取锻造成功率衰减率
 * @returns {number} 衰减率(%)
 */
export function getRefineDecayRate() {
  return refineDecayRate;
}

/**
 * 设置锻造所需材料数量
 * @param {number} count - 材料数量
 */
export function setRefineMaterialCount(count) {
  if (typeof count === 'number' && count >= 1) {
    refineMaterialCount = count;
  }
}

/**
 * 获取锻造所需材料数量
 * @returns {number} 材料数量
 */
export function getRefineMaterialCount() {
  return refineMaterialCount;
}

/**
 * 设置锻造每级加成值
 * @param {number} bonus - 加成值
 */
export function setRefineBonusPerLevel(bonus) {
  if (typeof bonus === 'number' && bonus >= 0) {
    refineBonusPerLevel = bonus;
  }
}

/**
 * 获取锻造每级加成值
 * @returns {number} 加成值
 */
export function getRefineBonusPerLevel() {
  return refineBonusPerLevel;
}

/**
 * 设置特效重置成功率
 * @param {number} rate - 成功率(%)
 */
export function setEffectResetSuccessRate(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectResetSuccessRate = rate;
  }
}

/**
 * 获取特效重置成功率
 * @returns {number} 成功率(%)
 */
export function getEffectResetSuccessRate() {
  return effectResetSuccessRate;
}

/**
 * 设置特效重置双特效概率
 * @param {number} rate - 双特效概率(%)
 */
export function setEffectResetDoubleRate(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectResetDoubleRate = rate;
  }
}

/**
 * 获取特效重置双特效概率
 * @returns {number} 双特效概率(%)
 */
export function getEffectResetDoubleRate() {
  return effectResetDoubleRate;
}

/**
 * 设置特效重置3特效概率
 * @param {number} rate - 3特效概率(%)
 */
export function setEffectResetTripleRate(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectResetTripleRate = rate;
  }
}

/**
 * 获取特效重置3特效概率
 * @returns {number} 3特效概率(%)
 */
export function getEffectResetTripleRate() {
  return effectResetTripleRate;
}

/**
 * 设置特效重置4特效概率
 * @param {number} rate - 4特效概率(%)
 */
export function setEffectResetQuadrupleRate(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectResetQuadrupleRate = rate;
  }
}

/**
 * 获取特效重置4特效概率
 * @returns {number} 4特效概率(%)
 */
export function getEffectResetQuadrupleRate() {
  return effectResetQuadrupleRate;
}

/**
 * 设置特效重置5特效概率
 * @param {number} rate - 5特效概率(%)
 */
export function setEffectResetQuintupleRate(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectResetQuintupleRate = rate;
  }
}

/**
 * 获取特效重置5特效概率
 * @returns {number} 5特效概率(%)
 */
export function getEffectResetQuintupleRate() {
  return effectResetQuintupleRate;
}

/**
 * 设置特效装备单特效掉落概率
 * @param {number} rate - 单特效掉落概率(%)
 */
export function setEffectDropSingleChance(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectDropSingleChance = rate;
  }
}

/**
 * 获取特效装备单特效掉落概率
 * @returns {number} 单特效掉落概率(%)
 */
export function getEffectDropSingleChance() {
  return effectDropSingleChance;
}

/**
 * 设置特效装备双特效掉落概率
 * @param {number} rate - 双特效掉落概率(%)
 */
export function setEffectDropDoubleChance(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    effectDropDoubleChance = rate;
  }
}

/**
 * 获取特效装备双特效掉落概率
 * @returns {number} 双特效掉落概率(%)
 */
export function getEffectDropDoubleChance() {
  return effectDropDoubleChance;
}

/**
 * 设置装备附加技能掉落概率
 * @param {number} rate - 附加技能掉落概率(%)
 */
export function setEquipSkillDropChance(rate) {
  if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
    equipSkillDropChance = rate;
  }
}

/**
 * 获取装备附加技能掉落概率
 * @returns {number} 附加技能掉落概率(%)
 */
export function getEquipSkillDropChance() {
  return equipSkillDropChance;
}


