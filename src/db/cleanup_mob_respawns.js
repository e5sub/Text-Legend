import knex from './index.js';
import { cleanupExpiredMobRespawnsBatch } from './mobs.js';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const options = {
    execute: false,
    batchSize: 1000,
    maxRounds: 300,
    sleepMs: 80,
    maxDelete: 0
  };

  for (const raw of argv) {
    const arg = String(raw || '').trim();
    if (!arg) continue;
    if (arg === '--execute') {
      options.execute = true;
      continue;
    }
    if (arg.startsWith('--batch-size=')) {
      options.batchSize = Math.max(50, Math.floor(Number(arg.split('=')[1]) || 1000));
      continue;
    }
    if (arg.startsWith('--max-rounds=')) {
      options.maxRounds = Math.max(1, Math.floor(Number(arg.split('=')[1]) || 300));
      continue;
    }
    if (arg.startsWith('--sleep-ms=')) {
      options.sleepMs = Math.max(0, Math.floor(Number(arg.split('=')[1]) || 80));
      continue;
    }
    if (arg.startsWith('--max-delete=')) {
      options.maxDelete = Math.max(0, Math.floor(Number(arg.split('=')[1]) || 0));
      continue;
    }
  }

  return options;
}

async function countExpiredRows(nowMs) {
  const row = await knex('mob_respawns')
    .where('respawn_at', '<=', nowMs)
    .andWhere((q) => q.whereNull('current_hp').orWhere('current_hp', '<=', 0))
    .count({ total: '*' })
    .first();
  return Math.max(0, Math.floor(Number(row?.total ?? row?.['count(*)'] ?? 0)));
}

async function sleep(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMobRespawnCleanupCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  let stopRequested = false;
  process.on('SIGINT', () => {
    stopRequested = true;
    console.log('[mob-cleanup] SIGINT received, stopping after current batch...');
  });

  const now = Date.now();
  const before = await countExpiredRows(now);
  console.log(
    `[mob-cleanup] candidates=${before} batchSize=${options.batchSize} maxRounds=${options.maxRounds} sleepMs=${options.sleepMs} maxDelete=${options.maxDelete || 'unlimited'}`
  );

  if (!options.execute) {
    console.log('[mob-cleanup] dry-run only. Add --execute to start deletion.');
    return;
  }

  let totalDeleted = 0;
  let rounds = 0;

  while (!stopRequested && rounds < options.maxRounds) {
    const remainingCap = options.maxDelete > 0 ? (options.maxDelete - totalDeleted) : options.batchSize;
    if (remainingCap <= 0) break;
    const currentBatchSize = Math.max(1, Math.min(options.batchSize, remainingCap));
    const deleted = Number(await cleanupExpiredMobRespawnsBatch(Date.now(), currentBatchSize) || 0);
    rounds += 1;
    totalDeleted += Math.max(0, deleted);
    console.log(`[mob-cleanup] round=${rounds} deleted=${deleted} total=${totalDeleted}`);

    if (deleted < currentBatchSize) break;
    if (options.maxDelete > 0 && totalDeleted >= options.maxDelete) break;
    await sleep(options.sleepMs);
  }

  const after = await countExpiredRows(Date.now());
  console.log(`[mob-cleanup] done rounds=${rounds} deleted=${totalDeleted} remaining=${after}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMobRespawnCleanupCli()
    .catch((err) => {
      console.error('[mob-cleanup] failed:', err?.message || err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await knex.destroy().catch(() => {});
    });
}
