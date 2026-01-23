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
  // 检查是否是特殊BOSS（魔龙教主、世界BOSS、沙巴克BOSS）
  const isSpecialBoss = Boolean(
    target.templateId &&
    (MOB_TEMPLATES[target.templateId]?.id === 'molong_boss' ||
     MOB_TEMPLATES[target.templateId]?.worldBoss ||
     MOB_TEMPLATES[target.templateId]?.sabakBoss)
  );

  if (isSpecialBoss) {
    // 特殊BOSS中毒冷却检查：1分钟内不能再次中毒
    const now = Date.now();
    if (target.status.poisonCooldown && target.status.poisonCooldown > now) {
      return false;
    }
    // 设置冷却时间为1分钟后
    target.status.poisonCooldown = now + 60000;
  }

  // 如果已经有中毒效果，不叠加（直接替换或保持）
  if (target.status.poison) {
    return false;
  }

  target.status.poison = { turns, tickDamage, sourceName };
  return true;
}

export function tickStatus(target) {
  if (target.status.poison && target.status.poison.turns > 0) {
    let damage = target.status.poison.tickDamage;

    // 特殊BOSS（魔龙教主、世界BOSS、沙巴克BOSS）中毒伤害上限为1000
    const isSpecialBoss = Boolean(
      target.templateId &&
      (MOB_TEMPLATES[target.templateId]?.id === 'molong_boss' ||
       MOB_TEMPLATES[target.templateId]?.worldBoss ||
       MOB_TEMPLATES[target.templateId]?.sabakBoss)
    );
    if (isSpecialBoss && damage > 1000) {
      damage = 1000;
    }

    applyDamage(target, damage);
    target.status.poison.turns -= 1;
    if (target.status.poison.turns <= 0) {
      delete target.status.poison;
    }
    return { type: 'poison', dmg: damage };
  }

  // 清理过期的中毒冷却
  const now = Date.now();
  if (target.status.poisonCooldown && target.status.poisonCooldown <= now) {
    delete target.status.poisonCooldown;
  }

  return null;
}
