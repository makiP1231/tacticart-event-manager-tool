const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: 'db',  // Docker Composeで定義されたサービス名をホストとして使用
  database: process.env.POSTGRES_DB || 'tacticart',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432,  // Docker内のPostgresのデフォルトポート
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Database connection established.');
});

const query = (text, params) => pool.query(text, params);

module.exports = { query };
