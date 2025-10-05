import pg from 'pg';
import 'dotenv/config';
import config from './config/config.js';

const { Pool } = pg;

// Log the DB connection config (mask password) for dev troubleshooting
const maskedDb = {
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  port: config.database.port,
  password: config.database.password ? '*****' : undefined,
  ssl: config.database.ssl ? 'enabled' : 'disabled'
};
console.log('DB config (masked):', maskedDb);

const pool = new Pool(config.database);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

export default pool;