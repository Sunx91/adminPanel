require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProd = process.env.NODE_ENV === 'production';

const pool = {
  max: Number(process.env.DB_POOL_MAX) || (isProd ? 10 : 5),
  min: Number(process.env.DB_POOL_MIN) || 0,
  acquire: Number(process.env.DB_POOL_ACQUIRE_MS) || 30000,
  idle: Number(process.env.DB_POOL_IDLE_MS) || 10000,
};

/**
 * SSL for hosted Postgres (Supabase, Neon, etc.). Disable for plain local Postgres with DB_SSL=false.
 */
function shouldUseSsl() {
  const url = process.env.DATABASE_URL || '';
  const host = process.env.DB_HOST || '';
  const isSupabase =
    /supabase\.co|pooler\.supabase\.com/i.test(url) ||
    /supabase\.co|pooler\.supabase\.com/i.test(host);
  if (isSupabase) {
    return true;
  }
  if (process.env.DB_SSL === 'true') {
    return true;
  }
  return false;
}

function sslDialectOptions() {
  if (!shouldUseSsl()) {
    return undefined;
  }
  return {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

let sequelize;

const commonOptions = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: sslDialectOptions(),
  pool,
};

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, commonOptions);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      ...commonOptions,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
    }
  );
}

module.exports = { sequelize };
