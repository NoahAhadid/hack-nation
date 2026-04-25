import OpenAI from 'openai';
import postgres from 'postgres';
import { config, requireEnv } from './config.js';

requireEnv(['OPENAI_API_KEY', 'DATABASE_URL']);

const query = process.argv.slice(2).join(' ').trim();

if (!query) {
  console.error('Usage: npm run search -- "your text query"');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: config.openAiApiKey });
const sql = postgres(config.databaseUrl, {
  max: 1,
  prepare: false,
  ssl: 'require'
});

const embeddingResponse = await openai.embeddings.create({
  model: config.embeddingModel,
  input: query
});

const [{ embedding }] = embeddingResponse.data;
const vector = `[${embedding.join(',')}]`;
const matchCount = Number(process.env.MATCH_COUNT || 10);

const data = await sql`
  select *
  from public.match_esco_skills(${vector}::vector, ${matchCount})
`;

for (const match of data) {
  console.log(`${match.similarity.toFixed(3)}  ${match.preferred_label}`);
  console.log(`       ${match.concept_uri}`);

  if (match.alt_labels?.length) {
    console.log(`       alt: ${match.alt_labels.slice(0, 5).join(', ')}`);
  }
}

await sql.end();
