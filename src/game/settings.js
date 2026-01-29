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
