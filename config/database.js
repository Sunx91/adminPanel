require('dotenv').config();
const { Sequelize } = require('sequelize');

function sslDialectOptions() {
  const url = process.env.DATABASE_URL || '';
  const host = process.env.DB_HOST || '';
  const useSsl =
    /supabase\.co|pooler\.supabase\.com/i.test(url) ||
    /supabase\.co|pooler\.supabase\.com/i.test(host) ||
    process.env.DB_SSL === 'true';
  if (!useSsl) return undefined;
  return { ssl: { require: true, rejectUnauthorized: false } };
}

const base = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: sslDialectOptions(),
};

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, base);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      ...base,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
    }
  );
}

module.exports = { sequelize };
