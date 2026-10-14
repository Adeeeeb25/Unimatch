import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const isRemoteDb = Boolean(
  connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1')
);

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isRemoteDb ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'unimatch'
      }
);

export const USERS_TABLE = 'unimatch_users';
export const MESSAGES_TABLE = 'unimatch_messages';
export const SUPPORT_TABLE = 'unimatch_support_requests';
export const DOMAINS_TABLE = 'unimatch_campus_domains';
export const OTP_TABLE = 'unimatch_email_otps';

const createUsersTable = `
CREATE TABLE IF NOT EXISTS ${USERS_TABLE} (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const createMessagesTable = `
CREATE TABLE IF NOT EXISTS ${MESSAGES_TABLE} (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES ${USERS_TABLE}(id) ON DELETE CASCADE,
  recipient_id BIGINT NOT NULL REFERENCES ${USERS_TABLE}(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_unimatch_messages_conv
  ON ${MESSAGES_TABLE}(sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_unimatch_messages_recipient
  ON ${MESSAGES_TABLE}(recipient_id, is_read);
`;

const createSupportTable = `
CREATE TABLE IF NOT EXISTS ${SUPPORT_TABLE} (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'General question',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_unimatch_support_status ON ${SUPPORT_TABLE}(status, submitted_at DESC);
`;

const createDomainsTable = `
CREATE TABLE IF NOT EXISTS ${DOMAINS_TABLE} (
  id BIGSERIAL PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  institution TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);
`;

const createOtpTable = `
CREATE TABLE IF NOT EXISTS ${OTP_TABLE} (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_unimatch_otps_email ON ${OTP_TABLE}(email);
`;

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      await pool.query(createUsersTable);
      await pool.query(createMessagesTable);
      await pool.query(createSupportTable);
      await pool.query(createDomainsTable);
      await pool.query(createOtpTable);
      console.log('PostgreSQL connected and schema ready');
      return true;
    } catch (error) {
      console.error(`PostgreSQL connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('Exhausted PostgreSQL connection retries. Server running in degraded mode.');
        return false;
      }
    }
  }
};

export default connectDB;
