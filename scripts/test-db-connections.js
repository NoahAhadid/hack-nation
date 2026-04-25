import postgres from 'postgres';
import { config } from './config.js';

const direct = new URL(config.databaseUrl);
const password = direct.password;
const projectRef = 'fwlyvpoxhzzkrcmfxarl';
const regions = ['eu-central-1', 'eu-west-1', 'us-east-1'];

for (const region of regions) {
  for (const port of ['5432', '6543']) {
    const url = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:${port}/postgres`;
    const sql = postgres(url, { max: 1, ssl: 'require', connect_timeout: 5 });

    try {
      await sql`select current_database()`;
      console.log(`OK ${region}:${port}`);
    } catch (error) {
      console.log(`NO ${region}:${port} ${error.code || error.message}`);
    } finally {
      await sql.end({ timeout: 1 }).catch(() => {});
    }
  }
}
