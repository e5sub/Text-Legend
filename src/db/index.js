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
        database: config.db.database
      },
  useNullAsDefault: isSqlite,
  pool: { min: 0, max: 10 }
});

export default knex;
