# Skills Signal Engine Implementation Plan

## Summary

Build a chat-based Skills Signal Engine on top of the existing ESCO search system. A youth user describes education, informal work, languages, tools, and demonstrated competencies; the system extracts evidence-backed skill signals, grounds them against ESCO, explains each match in plain language, and produces a portable profile export without requiring accounts.

Use the LLM as an evidence extractor and explainer, not as the source of truth. Final skill matches must come from ESCO embedding retrieval/RPCs and show: user evidence snippet, ESCO skill label/URI, match score, confidence, and why the match was made.

## Plan File

Create a new folder and Markdown file:

`plans/skill-engine-implementation.md`

Save this plan there before implementation starts.

## Key Changes

- Add a new "Build skills profile" mode to the existing Next.js UI.
- Keep the current semantic search and occupation lookup, but make them secondary tools under the broader Skills Signal Engine.
- Add a chat-style intake flow for:
  - education level
  - informal/work experience
  - languages
  - tools and technologies used
  - demonstrated competencies
  - goals or sectors of interest
- Add server-side profile generation:
  - LLM extracts structured evidence from the chat.
  - Each evidence item is embedded and matched against ESCO skills.
  - Final profile only includes ESCO-grounded skills.
  - Low-confidence matches are marked `needs_review`, not silently accepted.
- Add a portable profile output:
  - human-readable profile
  - JSON export/copy
  - printable view
  - visible explanation for every mapped skill.

## API And Data Flow

- Add `POST /api/skill-profile/generate`.
- Request body:
  - `messages[]`: chat/intake history
  - `locale`: default `en`
  - `context`: optional local configuration such as country, education taxonomy, and target sectors.
- Response body:
  - `person_summary`
  - `education`
  - `languages`
  - `experience_evidence[]`
  - `skills[]`
  - `occupation_paths[]`
  - `export_metadata`
- Each `skills[]` item includes:
  - `concept_uri`
  - `preferred_label`
  - `plain_language_label`
  - `evidence_quote`
  - `similarity`
  - `confidence`: `strong`, `medium`, or `needs_review`
  - `explanation`
  - `sources`: ESCO URI, ESCO definition/description, embedding search, LLM extraction.
- Reuse existing Supabase ESCO tables and RPCs where possible.
- If batching is needed, implement it in the API route first rather than adding schema complexity.

## Grounding Rules

- The LLM may extract user evidence and write plain-language explanations.
- The LLM must not invent ESCO skills.
- ESCO candidates must be retrieved through embedding search before any final skill is selected.
- Every accepted skill must show:
  - "You said..." user evidence
  - "Mapped to..." ESCO skill
  - "Because..." explanation
  - "Source..." ESCO URI and match score
- Confidence defaults:
  - `strong`: similarity >= `0.78`
  - `medium`: `0.65` to `0.77`
  - `needs_review`: below `0.65` but still plausible.
- If no ESCO candidate is plausible, keep the user evidence as unmapped evidence rather than forcing a match.
- Do not persist personal profile data in v1 unless the user exports it.

## UI Changes

- Replace the current single-purpose page with a structured work surface:
  - left/main: chat intake and profile generation
  - right/secondary: generated portable profile
  - lower/secondary: ESCO search and occupation lookup tools
- Profile display should be non-technical first:
  - "Skills Amara can show"
  - "Evidence from her experience"
  - "Portable ESCO skill IDs"
  - "Possible occupation paths"
- Keep technical details visible but explain them plainly:
  - similarity means semantic closeness to ESCO text
  - confidence means how strong the evidence-to-taxonomy match is
  - ESCO URI makes the skill portable across systems and borders.

## Acceptance Checks

- No automated tests required.
- Manual acceptance scenarios:
  - A phone repair + informal coding narrative produces grounded ESCO skill matches.
  - The UI shows evidence quotes and explanations for each skill.
  - The profile can be copied/exported as JSON.
  - Low-confidence mappings are visibly marked `needs_review`.
  - Existing semantic search and occupation lookup still work.
- Run `npm run lint` and `npm run build` only as implementation sanity checks.

## Assumptions

- v1 prioritizes chat interview intake.
- v1 uses portable export first and does not require login or saved profiles.
- English is the first UI language.
- Localization is handled through configurable labels/examples, not hardcoded country logic.
- Existing Supabase ESCO skills, occupations, and relations remain the canonical taxonomy layer.
- OpenAI keys stay server-only.
