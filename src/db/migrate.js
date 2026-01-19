import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import knex from './index.js';

export async function runMigrations({ destroy = false } = {}) {
  const dir = new URL('./migrations/', import.meta.url);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.js')).sort();

  const hasTable = await knex.schema.hasTable('knex_migrations_custom');
  if (!hasTable) {
    await knex.schema.createTable('knex_migrations_custom', (t) => {
      t.string('name').primary();
      t.timestamp('run_at').defaultTo(knex.fn.now());
    });
  }

  const ranRows = await knex('knex_migrations_custom').select('name');
  const ran = new Set(ranRows.map((r) => r.name));

  for (const file of files) {
    if (ran.has(file)) continue;
    const mod = await import(pathToFileURL(join(dir.pathname, file)).href);
    if (mod.up) {
      await mod.up(knex);
      await knex('knex_migrations_custom').insert({ name: file });
      console.log(`migrated ${file}`);
    }
  }

  if (destroy) {
    await knex.destroy();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations({ destroy: true }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
