create extension if not exists vector;
create extension if not exists pg_trgm;

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

create table if not exists public.esco_occupations (
  id bigserial primary key,
  concept_uri text not null unique,
  concept_type text,
  isco_group text,
  preferred_label text not null,
  alt_labels text[] not null default '{}',
  hidden_labels text[] not null default '{}',
  status text,
  modified_date date,
  regulated_profession_note text,
  scope_note text,
  definition text,
  in_scheme text,
  description text,
  code text,
  nace_code text[] not null default '{}',
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.esco_occupation_skill_relations (
  id bigserial primary key,
  occupation_uri text not null,
  occupation_label text,
  relation_type text,
  skill_type text,
  skill_uri text not null,
  skill_label text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (occupation_uri, skill_uri, relation_type)
);

create index if not exists esco_occupations_preferred_label_idx
  on public.esco_occupations (preferred_label);

create index if not exists esco_occupation_skill_relations_skill_uri_idx
  on public.esco_occupation_skill_relations (skill_uri);

create index if not exists esco_occupation_skill_relations_occupation_uri_idx
  on public.esco_occupation_skill_relations (occupation_uri);

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

create or replace function public.esco_clean_label(value text)
returns text
language sql
immutable
as $$
  select lower(btrim(regexp_replace(coalesce(value, ''), '[[:space:]]+', ' ', 'g')));
$$;

create or replace function public.find_esco_skills_by_label(skill_label text)
returns table (
  id bigint,
  concept_uri text,
  preferred_label text,
  alt_labels text[],
  hidden_labels text[],
  skill_type text,
  reuse_level text,
  description text,
  definition text,
  matched_field text,
  matched_label text
)
language sql
stable
as $$
  with labels as (
    select
      s.id,
      s.concept_uri,
      s.preferred_label,
      s.alt_labels,
      s.hidden_labels,
      s.skill_type,
      s.reuse_level,
      s.description,
      s.definition,
      'preferredLabel'::text as matched_field,
      s.preferred_label as matched_label,
      0 as priority
    from public.esco_skills s
    where public.esco_clean_label(s.preferred_label) = public.esco_clean_label(skill_label)

    union all

    select
      s.id,
      s.concept_uri,
      s.preferred_label,
      s.alt_labels,
      s.hidden_labels,
      s.skill_type,
      s.reuse_level,
      s.description,
      s.definition,
      'altLabels'::text as matched_field,
      label as matched_label,
      1 as priority
    from public.esco_skills s
    cross join unnest(s.alt_labels) as label
    where public.esco_clean_label(label) = public.esco_clean_label(skill_label)

    union all

    select
      s.id,
      s.concept_uri,
      s.preferred_label,
      s.alt_labels,
      s.hidden_labels,
      s.skill_type,
      s.reuse_level,
      s.description,
      s.definition,
      'hiddenLabels'::text as matched_field,
      label as matched_label,
      2 as priority
    from public.esco_skills s
    cross join unnest(s.hidden_labels) as label
    where public.esco_clean_label(label) = public.esco_clean_label(skill_label)
  ),
  ranked as (
    select labels.*, row_number() over (partition by labels.id order by labels.priority) as match_rank
    from labels
  )
  select
    ranked.id,
    ranked.concept_uri,
    ranked.preferred_label,
    ranked.alt_labels,
    ranked.hidden_labels,
    ranked.skill_type,
    ranked.reuse_level,
    ranked.description,
    ranked.definition,
    ranked.matched_field,
    ranked.matched_label
  from ranked
  where ranked.match_rank = 1
  order by ranked.preferred_label;
$$;

create or replace function public.suggest_esco_skills_by_label(
  skill_label text,
  match_count int default 8
)
returns table (
  concept_uri text,
  preferred_label text,
  matched_label text,
  score double precision
)
language sql
stable
as $$
  with labels as (
    select
      s.concept_uri,
      s.preferred_label,
      s.preferred_label as matched_label
    from public.esco_skills s

    union all

    select
      s.concept_uri,
      s.preferred_label,
      label as matched_label
    from public.esco_skills s
    cross join unnest(s.alt_labels || s.hidden_labels) as label
  ),
  scored as (
    select
      labels.concept_uri,
      labels.preferred_label,
      labels.matched_label,
      greatest(
        similarity(public.esco_clean_label(skill_label), public.esco_clean_label(labels.matched_label)),
        case
          when public.esco_clean_label(labels.matched_label) like '%' || public.esco_clean_label(skill_label) || '%'
            or public.esco_clean_label(skill_label) like '%' || public.esco_clean_label(labels.matched_label) || '%'
          then 0.72
          else 0
        end
      ) as score
    from labels
    where public.esco_clean_label(labels.matched_label) <> ''
  ),
  ranked as (
    select scored.*, row_number() over (partition by scored.concept_uri order by scored.score desc) as match_rank
    from scored
    where scored.score >= 0.35
  )
  select
    ranked.concept_uri,
    ranked.preferred_label,
    ranked.matched_label,
    ranked.score
  from ranked
  where ranked.match_rank = 1
  order by ranked.score desc, ranked.preferred_label
  limit least(greatest(match_count, 1), 25);
$$;

create or replace function public.get_esco_occupations_for_skills(skill_uris text[])
returns table (
  occupation_uri text,
  preferred_label text,
  code text,
  isco_group text,
  nace_code text[],
  alt_labels text[],
  regulated_profession_note text,
  definition text,
  description text,
  relation_types text[],
  matched_skill_labels text[],
  relation_skill_types text[],
  relation_rank int
)
language sql
stable
as $$
  select
    r.occupation_uri,
    coalesce(o.preferred_label, max(r.occupation_label), r.occupation_uri) as preferred_label,
    o.code,
    o.isco_group,
    coalesce(o.nace_code, '{}') as nace_code,
    coalesce(o.alt_labels, '{}') as alt_labels,
    o.regulated_profession_note,
    o.definition,
    o.description,
    array_agg(distinct r.relation_type) filter (where r.relation_type is not null and r.relation_type <> '') as relation_types,
    array_agg(distinct r.skill_label) filter (where r.skill_label is not null and r.skill_label <> '') as matched_skill_labels,
    array_agg(distinct r.skill_type) filter (where r.skill_type is not null and r.skill_type <> '') as relation_skill_types,
    case
      when bool_or(public.esco_clean_label(r.relation_type) = 'essential') then 0
      when bool_or(public.esco_clean_label(r.relation_type) = 'optional') then 1
      else 2
    end as relation_rank
  from public.esco_occupation_skill_relations r
  left join public.esco_occupations o
    on o.concept_uri = r.occupation_uri
  where r.skill_uri = any(skill_uris)
  group by
    r.occupation_uri,
    o.preferred_label,
    o.code,
    o.isco_group,
    o.nace_code,
    o.alt_labels,
    o.regulated_profession_note,
    o.definition,
    o.description
  order by relation_rank, preferred_label;
$$;

-- User sessions and skill profiles
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text unique,
  user_identifier text,
  survey_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_sessions_session_key_idx
  on public.user_sessions (session_key);

create index if not exists user_sessions_created_at_idx
  on public.user_sessions (created_at desc);

-- Skill profiles linked to sessions
create table if not exists public.skill_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.user_sessions(id) on delete cascade,
  person_summary text,
  education text,
  languages text[] not null default '{}',
  extracted_skills jsonb,
  experience_evidence jsonb,
  unmapped_evidence jsonb,
  grounding_trace jsonb,
  identified_skills jsonb,
  occupation_paths jsonb,
  export_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skill_profiles_session_id_idx
  on public.skill_profiles (session_id);

create index if not exists skill_profiles_created_at_idx
  on public.skill_profiles (created_at desc);

-- Identified skills (normalized for querying)
create table if not exists public.user_identified_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.skill_profiles(id) on delete cascade,
  session_id uuid references public.user_sessions(id) on delete cascade,
  concept_uri text not null,
  preferred_label text not null,
  user_skill text,
  evidence_quote text,
  confidence text,
  similarity double precision,
  decision text check (decision in ('accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists user_identified_skills_profile_id_idx
  on public.user_identified_skills (profile_id);

create index if not exists user_identified_skills_session_id_idx
  on public.user_identified_skills (session_id);

create index if not exists user_identified_skills_concept_uri_idx
  on public.user_identified_skills (concept_uri);

-- Matched opportunities for users
create table if not exists public.user_opportunities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.user_sessions(id) on delete cascade,
  profile_id uuid references public.skill_profiles(id) on delete cascade,
  opportunity_id text not null,
  title text not null,
  sector text,
  opportunity_type text,
  isco_group text,
  location_fit text,
  required_education text,
  skill_keywords text[] not null default '{}',
  matched_keywords text[] not null default '{}',
  related_occupation_labels text[] not null default '{}',
  demand_level double precision,
  wage_floor_signal double precision,
  wage_floor text,
  growth_outlook double precision,
  automation_exposure double precision,
  training_access double precision,
  training_pathway text,
  match_score double precision,
  score_parts jsonb,
  source_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists user_opportunities_session_id_idx
  on public.user_opportunities (session_id);

create index if not exists user_opportunities_profile_id_idx
  on public.user_opportunities (profile_id);

create index if not exists user_opportunities_match_score_idx
  on public.user_opportunities (match_score desc);

create index if not exists user_opportunities_isco_group_idx
  on public.user_opportunities (isco_group);

-- Analytics functions for econometric dashboard

-- Get top skills across all users
create or replace function public.get_top_skills(limit_count int default 20)
returns table (
  concept_uri text,
  preferred_label text,
  user_count bigint,
  total_occurrences bigint,
  strong_count bigint,
  medium_count bigint,
  needs_review_count bigint,
  accepted_count bigint,
  declined_count bigint,
  acceptance_rate numeric
)
language sql
stable
as $$
  select
    concept_uri,
    preferred_label,
    count(distinct session_id) as user_count,
    count(*) as total_occurrences,
    count(*) filter (where confidence = 'strong') as strong_count,
    count(*) filter (where confidence = 'medium') as medium_count,
    count(*) filter (where confidence = 'needs_review') as needs_review_count,
    count(*) filter (where decision = 'accepted') as accepted_count,
    count(*) filter (where decision = 'declined') as declined_count,
    case
      when count(*) filter (where decision is not null) > 0
      then round(
        count(*) filter (where decision = 'accepted')::numeric /
        count(*) filter (where decision is not null)::numeric * 100,
        2
      )
      else 0
    end as acceptance_rate
  from public.user_identified_skills
  group by concept_uri, preferred_label
  order by total_occurrences desc, user_count desc
  limit limit_count;
$$;

-- Get top opportunities across all users
create or replace function public.get_top_opportunities(limit_count int default 20)
returns table (
  opportunity_id text,
  title text,
  sector text,
  isco_group text,
  user_count bigint,
  total_matches bigint,
  avg_match_score numeric,
  avg_demand_level numeric,
  avg_wage_floor_signal numeric,
  avg_growth_outlook numeric
)
language sql
stable
as $$
  select
    opportunity_id,
    max(title) as title,
    max(sector) as sector,
    max(isco_group) as isco_group,
    count(distinct session_id) as user_count,
    count(*) as total_matches,
    round(avg(match_score)::numeric, 2) as avg_match_score,
    round(avg(demand_level)::numeric, 2) as avg_demand_level,
    round(avg(wage_floor_signal)::numeric, 2) as avg_wage_floor_signal,
    round(avg(growth_outlook)::numeric, 2) as avg_growth_outlook
  from public.user_opportunities
  group by opportunity_id
  order by total_matches desc, user_count desc, avg_match_score desc
  limit limit_count;
$$;
