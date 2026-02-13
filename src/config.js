const port = Number(process.env.PORT || 3000);
const dbClient = process.env.DB_CLIENT || 'sqlite';

const config = {
  port,
  db: {
    client: dbClient,
    filename: process.env.DB_FILENAME || './data/game.sqlite',
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'legend',
    poolMax: Number(process.env.DB_POOL_MAX || (dbClient === 'sqlite' ? 4 : 10)),
    sqlite: {
      wal: process.env.SQLITE_WAL !== 'false',
      synchronous: process.env.SQLITE_SYNCHRONOUS || 'NORMAL'
    }
  },
  sessionTtlMin: Number(process.env.SESSION_TTL_MIN || 120),
  adminPath: process.env.ADMIN_PATH || 'admin',
  adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET || '',
  adminBootstrapUser: process.env.ADMIN_BOOTSTRAP_USER || ''
};

export default config;
