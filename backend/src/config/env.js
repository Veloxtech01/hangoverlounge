import 'dotenv/config';

const required = ['MONGODB_URI', 'ADMIN_PASSWORD', 'JWT_SECRET', 'MAX_TABLES'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const maxTables = Number(process.env.MAX_TABLES);
if (!Number.isInteger(maxTables) || maxTables < 1) {
  throw new Error('MAX_TABLES must be a positive integer.');
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI,
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  maxTables,
};
