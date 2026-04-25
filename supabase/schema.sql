create extension if not exists vector;

create table if not exists public.esco_skills (
  id bigserial primary key,
  concept_uri text not null unique,
  concept_type text,
  skill_type text,
  reuse_level text,
  preferred_label text not null,
  alt_labels text[] not null default '{}',
  hidden_labels text[] not null default '{}',
  status text,
  modified_date date,
  scope_note text,
  definition text,
  in_scheme text,
  description text,
  embedding_text text not null,
  embedding vector(1536),
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists esco_skills_embedding_hnsw_idx
  on public.esco_skills
  using hnsw (embedding vector_cosine_ops);

create index if not exists esco_skills_preferred_label_idx
  on public.esco_skills (preferred_label);

create or replace function public.match_esco_skills(
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  id bigint,
  concept_uri text,
  preferred_label text,
  alt_labels text[],
  skill_type text,
  reuse_level text,
  description text,
  definition text,
  similarity double precision
)
language sql
stable
as $$
  select
    esco_skills.id,
    esco_skills.concept_uri,
    esco_skills.preferred_label,
    esco_skills.alt_labels,
    esco_skills.skill_type,
    esco_skills.reuse_level,
    esco_skills.description,
    esco_skills.definition,
    1 - (esco_skills.embedding <=> query_embedding) as similarity
  from public.esco_skills
  where esco_skills.embedding is not null
  order by esco_skills.embedding <=> query_embedding
  limit match_count;
$$;
