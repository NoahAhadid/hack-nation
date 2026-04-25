import fs from 'node:fs/promises';
import postgres from 'postgres';
import { config, requireEnv } from './config.js';

requireEnv(['DATABASE_URL']);

const schema = await fs.readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const sql = postgres(config.databaseUrl, {
  max: 1,
  prepare: false,
  ssl: 'require'
});

try {
  await sql.unsafe(schema);
  console.log('Database schema is ready.');
} finally {
  await sql.end();
}
