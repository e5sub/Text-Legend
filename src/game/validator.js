/**
 * 服务端数据验证模块
 * 用于验证所有来自客户端的数据，防止篡改和作弊
 */

import { ITEM_TEMPLATES } from './items.js';

/**
 * 验证数字参数
 */
export function validateNumber(value, min = 0, max = Infinity, defaultValue = null) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return { ok: false, error: `无效的数字: ${value}`, value: defaultValue };
  }
  if (num < min || num > max) {
    return { ok: false, error: `数值超出范围 [${min}, ${max}]: ${num}`, value: defaultValue };
  }
  return { ok: true, value: num };
}

/**
 * 验证字符串参数
 */
export function validateString(value, minLength = 0, maxLength = 100, allowEmpty = false) {
  if (typeof value !== 'string') {
    return { ok: false, error: `不是字符串类型` };
  }
  if (!allowEmpty && value.trim().length === 0) {
    return { ok: false, error: `字符串不能为空` };
  }
  if (value.length < minLength || value.length > maxLength) {
    return { ok: false, error: `字符串长度超出范围 [${minLength}, ${maxLength}]` };
  }
  return { ok: true, value: value.trim() };
}

/**
 * 验证物品ID是否存在
 */
export function validateItemId(itemId) {
  if (!itemId || typeof itemId !== 'string') {
    return { ok: false, error: '无效的物品ID' };
  }
  if (!ITEM_TEMPLATES[itemId]) {
    return { ok: false, error: `物品不存在: ${itemId}` };
  }
  return { ok: true, value: itemId };
}

/**
 * 验证物品数量
 */
export function validateItemQty(qty, maxQty = 9999) {
  return validateNumber(qty, 1, maxQty);
}

/**
 * 验证金币数量
 */
export function validateGold(amount, maxAmount = 999999999) {
  return validateNumber(amount, 0, maxAmount);
}

/**
 * 验证玩家名称
 */
export function validatePlayerName(name) {
  return validateString(name, 1, 20);
}

/**
 * 验证effects对象（只允许特定的效果）
 */
const ALLOWED_EFFECTS = ['combo', 'fury', 'unbreakable', 'defense', 'dodge', 'poison', 'healblock'];

export function validateEffects(effects) {
  if (effects === null || effects === undefined) {
    return { ok: true, value: null };
  }
  if (typeof effects !== 'object' || Array.isArray(effects)) {
    return { ok: false, error: 'effects必须是对象' };
  }
  const normalized = {};
  for (const key of ALLOWED_EFFECTS) {
    if (effects[key]) {
      normalized[key] = true;
    }
  }
  return { ok: true, value: Object.keys(normalized).length > 0 ? normalized : null };
}

/**
 * 验证耐久度
 */
export function validateDurability(durability, maxDurability = 100) {
  if (durability === null || durability === undefined) {
    return { ok: true, value: null };
  }
  return validateNumber(durability, 0, maxDurability);
}

/**
 * 验证最大耐久度
 */
export function validateMaxDurability(maxDurability) {
  if (maxDurability === null || maxDurability === undefined) {
    return { ok: true, value: null };
  }
  return validateNumber(maxDurability, 1, 100);
}

/**
 * 验证玩家是否有足够的物品
 */
export function validatePlayerHasItem(player, itemId, qty, effects = null) {
  if (!player.inventory) {
    return { ok: false, error: '玩家没有背包' };
  }
  
  const { ok: validEffects, value: normalizedEffects } = validateEffects(effects);
  if (!validEffects) {
    return { ok: false, error: '无效的物品效果' };
  }
  
  // 查找物品（考虑effects）
  const slot = normalizedEffects
    ? player.inventory.find((i) => i.id === itemId && i.effects && 
        Object.keys(normalizedEffects).every(key => i.effects[key]))
    : player.inventory.find((i) => i.id === itemId);
  
  if (!slot) {
    return { ok: false, error: `背包里没有该物品: ${itemId}` };
  }
  
  if (slot.qty < qty) {
    return { ok: false, error: `物品数量不足，需要 ${qty}，拥有 ${slot.qty}` };
  }
  
  return { ok: true, slot };
}

/**
 * 验证玩家是否有足够的金币
 */
export function validatePlayerHasGold(player, amount) {
  const { ok, value, error } = validateGold(amount);
  if (!ok) {
    return { ok: false, error };
  }
  
  if (player.gold < value) {
    return { ok: false, error: `金币不足，需要 ${value}，拥有 ${player.gold}` };
  }
  
  return { ok: true, value };
}

/**
 * 清理和标准化客户端输入
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // 移除可能危险的特殊字符
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * 验证和标准化交易物品数据
 */
export function validateTradeItem(itemData) {
  if (!itemData || typeof itemData !== 'object') {
    return { ok: false, error: '物品数据格式错误' };
  }
  
  const idResult = validateItemId(itemData.id);
  if (!idResult.ok) {
    return idResult;
  }
  
  const qtyResult = validateItemQty(itemData.qty);
  if (!qtyResult.ok) {
    return qtyResult;
  }
  
  const effectsResult = validateEffects(itemData.effects);
  if (!effectsResult.ok) {
    return effectsResult;
  }
  
  const durabilityResult = validateDurability(itemData.durability);
  if (!durabilityResult.ok) {
    return durabilityResult;
  }
  
  const maxDurabilityResult = validateMaxDurability(itemData.max_durability);
  if (!maxDurabilityResult.ok) {
    return maxDurabilityResult;
  }
  
  return {
    ok: true,
    value: {
      id: idResult.value,
      qty: qtyResult.value,
      effects: effectsResult.value,
      durability: durabilityResult.value,
      max_durability: maxDurabilityResult.value
    }
  };
}

/**
 * 批量验证交易物品
 */
export function validateTradeItems(items) {
  if (!Array.isArray(items)) {
    return { ok: false, error: '物品列表必须是数组' };
  }
  
  const validatedItems = [];
  for (let i = 0; i < items.length; i++) {
    const result = validateTradeItem(items[i]);
    if (!result.ok) {
      return { ok: false, error: `物品 ${i + 1} 验证失败: ${result.error}` };
    }
    validatedItems.push(result.value);
  }
  
  return { ok: true, value: validatedItems };
}
