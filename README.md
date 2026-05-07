# Analytical Dataplane for skill and opportunity discovery (SkillRoute)
<img width="2873" height="1655" alt="grafik" src="https://github.com/user-attachments/assets/fbe216a1-340b-42ae-bdb9-d97df006f4a2" />

SkillRoute is a hackathon prototype for converting informal, real-life
experience into structured skill profiles and practical opportunity matches.

Built for the **UNMAPPED** challenge, it helps surface skills that may not be
represented by certificates, formal employment history, or a traditional CV.

## Project Structure

This repository is now organized into three main directories:

- **backend/**: Backend services, database schema, and data pipeline scripts
  - `supabase/`: Postgres schema with pgvector, tables, indexes, and RPCs
  - Database setup and import scripts

- **data/**: All data files and datasets
  - ESCO/ISCO employment classification CSVs
  - Labor market and occupation data

- **frontend/**: Next.js web application and pitch deck
  - Main SkillRoute web app for skill discovery and opportunity matching
  - Pitch deck presentation

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- OpenAI models and embeddings
- Supabase Postgres with pgvector
- ESCO taxonomy data
- ISCO occupation classification data
- Tailwind CSS and shadcn-style UI components

## Main Features

The main app includes:

- Chat-based skill discovery with Milo
- Skill profile generation from user intake conversations
- ESCO semantic skill search
- ISCO occupation mapping
- Opportunity matching for jobs, training, and self-employment pathways
- Youth-facing profile and opportunity views
- Admin/program-facing protocol and aggregate views
- Econometric and labor-market dashboards

## Database

Main tables:

- `public.esco_skills`
- `public.esco_occupations`
- `public.esco_occupation_skill_relations`
- `public.user_sessions`
- `public.skill_profiles`
- `public.user_identified_skills`
- `public.user_opportunities`

Search RPCs:

```sql
public.match_esco_skills(query_embedding vector(1536), match_count int)
public.find_esco_skills_by_label(skill_label text)
public.suggest_esco_skills_by_label(skill_label text, match_count int)
public.get_esco_occupations_for_skills(skill_uris text[])
```

Analytics RPCs:

```sql
public.get_top_skills(limit_count int)
public.get_top_opportunities(limit_count int)
```

## Getting Started

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Set required environment variables:
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `ESCO_CSV_PATH`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Database

```bash
npm run db:setup
npm run import:skills
npm run import:occupations
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY`

Open `http://localhost:3000`.

## Data Pipeline

The data flow is:

1. A user talks to Milo about their background, experience, education, country,
   language, work authorization, and confidence.
2. The backend extracts skills and evidence from the conversation.
3. Extracted skills are embedded and matched against ESCO skills in Supabase.
4. Related occupations are mapped through ISCO data.
5. The app generates a skill profile and suggests relevant local pathways.

## Useful Commands

```bash
cd backend
npm run db:setup
npm run import:skills
npm run import:occupations
npm run search -- "your skill query"

cd frontend
npm run dev
npm run build
npm run lint
```

Optional settings:

- `IMPORT_LIMIT=1000` imports a smaller dataset sample
- `MATCH_COUNT=20` returns more semantic search results
- `EMBEDDING_BATCH_SIZE=50` lowers OpenAI embedding batch size
- `UPSERT_BATCH_SIZE=50` lowers Supabase write batch size
