// 游戏运行时配置管理（从后台加载的配置）
// 这个模块用于存储从数据库加载的配置，避免游戏逻辑直接依赖数据库

import { CLASS_LEVEL_BONUS as DEFAULT_CLASS_LEVEL_BONUS } from './constants.js';

// 职业升级属性配置（可由后台动态配置）
let classLevelBonusConfig = {
  warrior: null, // null 表示使用默认配置
  mage: null,
  taoist: null
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
