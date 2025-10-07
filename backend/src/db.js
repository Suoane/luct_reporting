import pg from 'pg';
import 'dotenv/config';
import config from './config/config.js';

const { Pool } = pg;

// 🔧 Adjust SSL setting for local development
const isLocal = config.database.host === 'localhost' || config.database.host === '127.0.0.1';
const dbConfig = {
  ...config.database,
  ssl: isLocal ? false : config.database.ssl
};

// 🕵️ Masked log for debugging
const maskedDb = {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  password: dbConfig.password ? '*****' : undefined,
  ssl: dbConfig.ssl ? 'enabled' : 'disabled'
};
console.log('DB config (masked):', maskedDb);

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// 🚀 Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

export default pool;