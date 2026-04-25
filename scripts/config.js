import dotenv from 'dotenv';

dotenv.config();

export const config = {
  csvPath:
    process.env.ESCO_CSV_PATH ||
    'ESCO dataset - v1.2.1 - classification - en - csv/skills_en.csv',
  databaseUrl: process.env.DATABASE_URL,
  embeddingBatchSize: Number(process.env.EMBEDDING_BATCH_SIZE || 100),
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  importLimit: process.env.IMPORT_LIMIT ? Number(process.env.IMPORT_LIMIT) : null,
  openAiApiKey: process.env.OPENAI_API_KEY,
  skipExisting: process.env.SKIP_EXISTING !== 'false',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  upsertBatchSize: Number(process.env.UPSERT_BATCH_SIZE || 100)
};

export function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
