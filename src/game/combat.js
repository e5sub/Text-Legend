import { clamp, randInt } from './utils.js';

export function calcHitChance(attacker, defender) {
  const base = 0.75 + (attacker.dex - defender.dex) * 0.01;
  return clamp(base, 0.2, 0.95);
}

export function calcDamage(attacker, defender, power = 1) {
  const atk = attacker.atk + randInt(0, Math.max(1, attacker.atk / 2));
  let defBonus = 0;
  const buff = defender.status?.buffs?.defBuff;
  const debuffs = defender.status?.debuffs || {};
  const now = Date.now();
  let defMultiplier = 1;
  const poison = debuffs.poison;
  if (poison) {
    if (poison.expiresAt && poison.expiresAt < now) {
      delete debuffs.poison;
    } else {
      defMultiplier *= poison.defMultiplier || 1;
    }
  }
  const poisonEffect = debuffs.poisonEffect;
  if (poisonEffect) {
    if (poisonEffect.expiresAt && poisonEffect.expiresAt < now) {
      delete debuffs.poisonEffect;
    } else {
      defMultiplier *= poisonEffect.defMultiplier || 1;
    }
  }
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
  target.status.poison = { turns, tickDamage, sourceName };
}

export function tickStatus(target) {
  if (target.status.poison && target.status.poison.turns > 0) {
    applyDamage(target, target.status.poison.tickDamage);
    target.status.poison.turns -= 1;
    if (target.status.poison.turns <= 0) {
      delete target.status.poison;
    }
    return { type: 'poison', dmg: target.status.poison?.tickDamage || 0 };
  }
  return null;
}
