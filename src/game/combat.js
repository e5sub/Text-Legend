import { clamp, randInt } from './utils.js';
import { MOB_TEMPLATES } from './mobs.js';

export function calcHitChance(attacker, defender) {
  const base = 0.75 + (attacker.dex - defender.dex) * 0.01;
  return clamp(base, 0.2, 0.95);
}

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
  // 检查破防效果
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

export function calcDamage(attacker, defender, power = 1) {
  const atk = attacker.atk + randInt(0, Math.max(1, attacker.atk / 2));
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

export function applyDamage(target, dmg) {
  target.hp = clamp(target.hp - dmg, 0, target.max_hp);
}

export function applyHealing(target, amount) {
  target.hp = clamp(target.hp + amount, 0, target.max_hp);
}

export function applyPoison(target, turns, tickDamage, sourceName = null) {
  // 检查是否是特殊BOSS（魔龙教主、世界BOSS、沙巴克BOSS、暗之BOSS）
  const isSpecialBoss = Boolean(
    target.templateId &&
    MOB_TEMPLATES[target.templateId]?.specialBoss
  );

  if (isSpecialBoss) {
    // 特殊BOSS：每个玩家独立的毒效果，每玩家1分钟冷却
    const now = Date.now();
    if (!target.status.poisonsBySource) {
      target.status.poisonsBySource = {};
    }

    if (sourceName && target.status.poisonsBySource[sourceName]) {
      const cooldownUntil = target.status.poisonsBySource[sourceName];
      if (now < cooldownUntil) {
        // 该玩家的毒效果还在冷却中
        return false;
      }
    }

    // 设置该玩家的毒冷却时间为1分钟后
    if (sourceName) {
      target.status.poisonsBySource[sourceName] = now + 60000;
    }

    // 添加新的毒效果
    if (!target.status.activePoisons) {
      target.status.activePoisons = [];
    }
    target.status.activePoisons.push({ turns, tickDamage, sourceName });
    return true;
  }

  // 普通怪物：单一毒效果
  if (target.status.poison) {
    return false;
  }
  target.status.poison = { turns, tickDamage, sourceName };
  return true;
}

export function tickStatus(target) {
  const now = Date.now();

  // 检查是否处于无敌状态（免疫毒伤害）
  if (target.status?.invincible && target.status.invincible > now) {
    // 无敌状态，清除所有毒效果
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

  // 特殊BOSS的多个毒效果处理
  if (target.status.activePoisons && target.status.activePoisons.length > 0) {
    const isSpecialBoss = Boolean(
      target.templateId &&
      MOB_TEMPLATES[target.templateId]?.specialBoss
    );

    let totalDamage = 0;
    const remainingPoisons = [];
    const damageBySource = {}; // 记录每个玩家造成的伤害

    // 按玩家分组计算毒伤害总和，每个玩家上限1000
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

      // 特殊BOSS：同一玩家的毒效果总和上限为1000
      if (isSpecialBoss && totalDamageBySource[source] > 1000) {
        damage = Math.floor(damage * (1000 / totalDamageBySource[source]));
      }

      applyDamage(target, damage);
      totalDamage += damage;

      // 记录每个玩家造成的伤害
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

  // 普通怪物/玩家的单一毒效果处理
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

  // 清理过期的中毒冷却
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
