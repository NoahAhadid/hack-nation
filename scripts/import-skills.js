import fs from 'node:fs';
import { parse } from 'csv-parse';
import OpenAI from 'openai';
import postgres from 'postgres';
import { config, requireEnv } from './config.js';

requireEnv(['OPENAI_API_KEY', 'DATABASE_URL']);

const openai = new OpenAI({ apiKey: config.openAiApiKey });
const sql = postgres(config.databaseUrl, {
  max: 1,
  prepare: false,
  ssl: 'require'
});

const columns = [
  'concept_uri',
  'concept_type',
  'skill_type',
  'reuse_level',
  'preferred_label',
  'alt_labels',
  'hidden_labels',
  'status',
  'modified_date',
  'scope_note',
  'definition',
  'in_scheme',
  'description',
  'embedding_text',
  'embedding',
  'raw'
];

function splitLabels(value) {
  if (!value) return [];

  return value
    .split(/\r?\n/)
    .map((label) => label.trim())
    .filter(Boolean);
}

function rowToSkill(row) {
  const altLabels = splitLabels(row.altLabels);
  const hiddenLabels = splitLabels(row.hiddenLabels);
  const embeddingText = [row.preferredLabel, ...altLabels].filter(Boolean).join('\n');

  return {
    concept_uri: row.conceptUri,
    concept_type: row.conceptType || null,
    skill_type: row.skillType || null,
    reuse_level: row.reuseLevel || null,
    preferred_label: row.preferredLabel,
    alt_labels: altLabels,
    hidden_labels: hiddenLabels,
    status: row.status || null,
    modified_date: row.modifiedDate || null,
    scope_note: row.scopeNote || null,
    definition: row.definition || null,
    in_scheme: row.inScheme || null,
    description: row.description || null,
    embedding_text: embeddingText,
    raw: row
  };
}

function dedupeByConceptUri(skills) {
  const deduped = new Map();

  for (const skill of skills) {
    deduped.set(skill.concept_uri, skill);
  }

  return [...deduped.values()];
}

async function filterExisting(skills) {
  if (!config.skipExisting || skills.length === 0) {
    return skills;
  }

  const uris = skills.map((skill) => skill.concept_uri);
  const existing = await sql`
    select concept_uri
    from public.esco_skills
    where embedding is not null
      and concept_uri in ${sql(uris)}
  `;
  const existingUris = new Set(existing.map((row) => row.concept_uri));

  return skills.filter((skill) => !existingUris.has(skill.concept_uri));
}

async function embedBatch(skills) {
  const response = await openai.embeddings.create({
    model: config.embeddingModel,
    input: skills.map((skill) => skill.embedding_text)
  });

  return skills.map((skill, index) => ({
    ...skill,
    embedding: response.data[index].embedding
  }));
}

async function upsertBatch(skills) {
  const rows = skills.map((skill) => ({
    ...skill,
    embedding: `[${skill.embedding.join(',')}]`
  }));

  await sql`
    insert into public.esco_skills ${sql(rows, columns)}
    on conflict (concept_uri) do update set
      concept_type = excluded.concept_type,
      skill_type = excluded.skill_type,
      reuse_level = excluded.reuse_level,
      preferred_label = excluded.preferred_label,
      alt_labels = excluded.alt_labels,
      hidden_labels = excluded.hidden_labels,
      status = excluded.status,
      modified_date = excluded.modified_date,
      scope_note = excluded.scope_note,
      definition = excluded.definition,
      in_scheme = excluded.in_scheme,
      description = excluded.description,
      embedding_text = excluded.embedding_text,
      embedding = excluded.embedding,
      raw = excluded.raw,
      updated_at = now()
  `;
}

async function flush(pending, state) {
  if (pending.length === 0) return;

  const uniquePending = dedupeByConceptUri(pending);
  state.skippedDuplicates += pending.length - uniquePending.length;

  const toImport = await filterExisting(uniquePending);
  state.skippedExisting += uniquePending.length - toImport.length;

  if (toImport.length === 0) {
    console.log(
      `Imported ${state.imported} skills, skipped ${state.skippedExisting} existing and ${state.skippedDuplicates} duplicate CSV rows`
    );
    return;
  }

  const withEmbeddings = await embedBatch(toImport);
  await upsertBatch(withEmbeddings);
  state.imported += withEmbeddings.length;
  console.log(
    `Imported ${state.imported} skills, skipped ${state.skippedExisting} existing and ${state.skippedDuplicates} duplicate CSV rows`
  );
}

const parser = fs.createReadStream(config.csvPath).pipe(
  parse({
    bom: true,
    columns: true,
    relax_quotes: true,
    skip_empty_lines: true
  })
);

const pending = [];
const state = { imported: 0, read: 0, skippedDuplicates: 0, skippedExisting: 0 };

for await (const row of parser) {
  if (config.importLimit && state.read >= config.importLimit) break;

  state.read += 1;
  const skill = rowToSkill(row);

  if (!skill.concept_uri || !skill.preferred_label || !skill.embedding_text) {
    continue;
  }

  pending.push(skill);

  if (pending.length >= Math.min(config.embeddingBatchSize, config.upsertBatchSize)) {
    const batch = pending.splice(0, pending.length);
    await flush(batch, state);
  }
}

await flush(pending, state);

console.log(
  `Done. Read ${state.read} CSV rows, imported ${state.imported} skills, skipped ${state.skippedExisting} existing and ${state.skippedDuplicates} duplicate CSV rows.`
);
await sql.end();
