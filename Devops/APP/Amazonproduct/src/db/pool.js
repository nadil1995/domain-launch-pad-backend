require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'affiliate_pipeline',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('railway') ? { rejectUnauthorized: false } : false
});

// Connection error handler
pool.on('error', (error, client) => {
  logger.error('Unexpected error on idle client', {
    code: error.code,
    message: error.message,
    context: error.context
  });
  process.exit(-1);
});

// Startup connection test
pool.query('SELECT NOW()')
  .then(() => {
    logger.info('Database connection pool initialized successfully');
  })
  .catch((error) => {
    logger.error('Failed to initialize database connection pool', {
      message: error.message,
      code: error.code
    });
    process.exit(1);
  });

module.exports = pool;
