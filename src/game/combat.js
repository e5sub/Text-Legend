import { clamp, randInt } from './utils.js';
import { MOB_TEMPLATES } from './mobs.js';

// 命中率：基于敏捷差的线性区间
export function calcHitChance(attacker, defender) {
  const base = 0.75 + (attacker.dex - defender.dex) * 0.01;
  return clamp(base, 0.2, 0.95);
}

// 防御系数：叠加防御增益/减益（破防、毒等）
export function getDefenseMultiplier(target) {
  const debuffs = target.status?.debuffs || {};
  const now = Date.now();
  let multiplier = 1;
  const buff = target.status?.buffs?.defBuff;
  if (buff) {
    if (buff.expiresAt && buff.expiresAt < now) {
      delete target.status.buffs.defBuff;
    } else {
      multiplier *= buff.defMultiplier || 1;
    }
  }
  const poison = debuffs.poison;
  if (poison) {
    if (poison.expiresAt && poison.expiresAt < now) {
      delete debuffs.poison;
    } else {
      multiplier *= poison.defMultiplier || 1;
    }
  }
  const poisonEffect = debuffs.poisonEffect;
  if (poisonEffect) {
    if (poisonEffect.expiresAt && poisonEffect.expiresAt < now) {
      delete debuffs.poisonEffect;
    } else {
      multiplier *= poisonEffect.defMultiplier || 1;
    }
  }
  const armorBreak = debuffs.armorBreak;
  if (armorBreak) {
    if (armorBreak.expiresAt && armorBreak.expiresAt < now) {
      delete debuffs.armorBreak;
    } else {
      multiplier *= armorBreak.defMultiplier || 1;
    }
  }
  return multiplier;
}

// 物理伤害：攻击浮动 + 防御减免 + 技能倍率
export function calcDamage(attacker, defender, power = 1) {
  let atk = Math.floor(attacker.atk * randInt(70, 100) / 100);
  const atkBuff = attacker.status?.buffs?.atkBuff;
  if (atkBuff) {
    if (atkBuff.expiresAt && atkBuff.expiresAt < Date.now()) {
      delete attacker.status.buffs.atkBuff;
    } else {
      atk = Math.floor(atk * (atkBuff.multiplier || 1));
    }
  }
  let defBonus = 0;
  const buff = defender.status?.buffs?.defBuff;
  const defMultiplier = getDefenseMultiplier(defender);
  if (buff) {
    if (buff.expiresAt && buff.expiresAt < Date.now()) {
      delete defender.status.buffs.defBuff;
    } else {
      defBonus = buff.defBonus || 0;
    }
  }
  const baseDef = (defender.def || 0) + defBonus;
  const def = Math.floor(baseDef * defMultiplier) + randInt(0, Math.max(0, baseDef / 2));
  const dmg = Math.max(1, Math.floor((atk - def) * power));
  return dmg;
}

// 直接扣血（带下限）
export function applyDamage(target, dmg) {
  target.hp = clamp(target.hp - dmg, 0, target.max_hp);
}

// 直接回血（带上限）
export function applyHealing(target, amount) {
  target.hp = clamp(target.hp + amount, 0, target.max_hp);
}

// 施加中毒：特殊BOSS允许多层叠加并按玩家分别冷却
export function applyPoison(target, turns, tickDamage, sourceName = null) {
  if (!target) return false;
  if (!target.status) target.status = {};
  // 处理毒效果（特殊BOSS可叠多层，普通怪只保留一层）
  const isSpecialBoss = Boolean(
    target.templateId &&
    MOB_TEMPLATES[target.templateId]?.specialBoss
  );

  // 特殊BOSS：每个玩家单独冷却，允许多条毒同时存在
  if (isSpecialBoss) {
    const now = Date.now();
    if (!target.status.poisonsBySource) {
      target.status.poisonsBySource = {};
    }

    if (sourceName && target.status.poisonsBySource[sourceName]) {
      const cooldownUntil = target.status.poisonsBySource[sourceName];
      if (now < cooldownUntil) {
        return false;
      }
    }

    if (sourceName) {
      target.status.poisonsBySource[sourceName] = now + 60000;
    }

    if (!target.status.activePoisons) {
      target.status.activePoisons = [];
    }
    target.status.activePoisons.push({ turns, tickDamage, sourceName });
    return true;
  }

  // 普通目标：只允许单条毒
  if (target.status.poison) {
    return false;
  }
  target.status.poison = { turns, tickDamage, sourceName };
  return true;
}

// 状态Tick：处理中毒、无敌等持续效果
export function tickStatus(target) {
  const now = Date.now();

  // 无敌状态：清除毒相关效果
  if (target.status?.invincible && target.status.invincible > now) {
    if (target.status.activePoisons) {
      delete target.status.activePoisons;
    }
    if (target.status.poison) {
      delete target.status.poison;
    }
    if (target.status.debuffs) {
      delete target.status.debuffs.poison;
      delete target.status.debuffs.poisonEffect;
    }
    return null;
  }

  // 多层毒（特殊BOSS）
  if (target.status.activePoisons && target.status.activePoisons.length > 0) {
    const isSpecialBoss = Boolean(
      target.templateId &&
      MOB_TEMPLATES[target.templateId]?.specialBoss
    );

    let totalDamage = 0;
    const remainingPoisons = [];
    const damageBySource = {}; // 记录每个玩家造成的伤害

    // 按来源汇总，用于单来源伤害上限
    const totalDamageBySource = {};
    for (const poison of target.status.activePoisons) {
      const source = poison.sourceName || 'unknown';
      if (!totalDamageBySource[source]) {
        totalDamageBySource[source] = 0;
      }
      totalDamageBySource[source] += poison.tickDamage;
    }

    for (const poison of target.status.activePoisons) {
      const source = poison.sourceName || 'unknown';
      let damage = poison.tickDamage;

      // 特殊BOSS：同一来源每跳总伤害上限 1000
      if (isSpecialBoss && totalDamageBySource[source] > 1000) {
        damage = Math.floor(damage * (1000 / totalDamageBySource[source]));
      }

      applyDamage(target, damage);
      totalDamage += damage;

      if (!damageBySource[source]) {
        damageBySource[source] = 0;
      }
      damageBySource[source] += damage;

      poison.turns -= 1;

      if (poison.turns > 0) {
        remainingPoisons.push(poison);
      }
    }

    target.status.activePoisons = remainingPoisons;

    if (target.status.activePoisons.length === 0) {
      delete target.status.activePoisons;
    }

    return { type: 'poison', dmg: totalDamage, damageBySource };
  }

  // 单层毒（普通目标）
  if (target.status.poison && target.status.poison.turns > 0) {
    const damage = target.status.poison.tickDamage;
    const sourceName = target.status.poison.sourceName;
    applyDamage(target, damage);
    target.status.poison.turns -= 1;
    if (target.status.poison.turns <= 0) {
      delete target.status.poison;
    }
    return {
      type: 'poison',
      dmg: damage,
      damageBySource: sourceName ? { [sourceName]: damage } : {}
    };
  }

  // 清理毒冷却记录
  if (target.status.poisonsBySource) {
    for (const [sourceName, cooldownUntil] of Object.entries(target.status.poisonsBySource)) {
      if (now >= cooldownUntil) {
        delete target.status.poisonsBySource[sourceName];
      }
    }
    if (Object.keys(target.status.poisonsBySource).length === 0) {
      delete target.status.poisonsBySource;
    }
  }

  return null;
}
