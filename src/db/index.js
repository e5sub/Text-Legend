import knexModule from 'knex';
import config from '../config.js';

const isSqlite = config.db.client === 'sqlite';

const knex = knexModule({
  client: isSqlite ? 'sqlite3' : 'mysql2',
  connection: isSqlite
    ? {
        filename: config.db.filename,
        busyTimeout: 5000 // SQLite: 等待5秒获取数据库锁
      }
    : {
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        // MySQL 连接超时设置
        connectTimeout: 10000,
        // 启用压缩
        compress: true
      },
  useNullAsDefault: isSqlite,
  pool: isSqlite
    ? { min: 0, max: config.db.poolMax }
    : {
        min: 2,
        max: Math.max(20, config.db.poolMax || 20),
        // 连接在 pool 中的最大空闲时间
        idleTimeoutMillis: 30000,
        // 获取连接的最大等待时间
        acquireTimeoutMillis: 60000,
        // 连接创建超时
        createTimeoutMillis: 30000,
        // 连接销毁超时
        destroyTimeoutMillis: 5000,
        // 定期 reap 空闲连接
        reapIntervalMillis: 1000
      }
});

if (isSqlite) {
  // 启用 WAL 模式以提高并发性能
  knex.raw('PRAGMA journal_mode = WAL;').catch(() => {});
  // 设置同步模式为 NORMAL（平衡安全性和性能）
  knex.raw('PRAGMA synchronous = NORMAL;').catch(() => {});
  // 增加 WAL 文件大小限制，避免频繁 checkpoint
  knex.raw('PRAGMA wal_autocheckpoint = 1000;').catch(() => {});
  // 设置 busy timeout 为 10 秒，避免锁定等待过短
  knex.raw('PRAGMA busy_timeout = 10000;').catch(() => {});
}

function toCompactSql(sqlText) {
  return String(sqlText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

if (config.db.slowQueryLog && Number.isFinite(config.db.slowQueryMs) && config.db.slowQueryMs > 0) {
  const slowThresholdMs = Math.max(1, Math.floor(config.db.slowQueryMs));
  const queryStartAt = new Map();

  const begin = (query) => {
    if (!query || query.__knexQueryUid === undefined || query.__knexQueryUid === null) return;
    queryStartAt.set(query.__knexQueryUid, Date.now());
  };

  const finish = (query, error = null) => {
    if (!query || query.__knexQueryUid === undefined || query.__knexQueryUid === null) return;
    const startedAt = queryStartAt.get(query.__knexQueryUid);
    queryStartAt.delete(query.__knexQueryUid);
    if (!startedAt) return;

    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs < slowThresholdMs) return;

    const sql = toCompactSql(query.sql).slice(0, 300);
    const bindingsCount = Array.isArray(query.bindings) ? query.bindings.length : 0;
    const tag = error ? '[db][slow][error]' : '[db][slow]';
    const suffix = error ? ` err=${String(error?.message || error)}` : '';
    console.warn(`${tag} ${elapsedMs}ms bindings=${bindingsCount} sql="${sql}"${suffix}`);
  };

  knex.on('query', begin);
  knex.on('query-response', (_response, query) => {
    finish(query, null);
  });
  knex.on('query-error', (error, query) => {
    finish(query, error);
  });
}

export default knex;
