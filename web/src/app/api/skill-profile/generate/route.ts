import OpenAI from "openai";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type ProfileContext = {
  country?: string;
  educationTaxonomy?: string;
  targetSectors?: string[];
};

type EvidenceCategory =
  | "education"
  | "experience"
  | "language"
  | "tool"
  | "competency"
  | "goal";

type ExtractedEvidence = {
  id: string;
  category: EvidenceCategory;
  evidence_quote: string;
  competency: string;
  plain_language_label: string;
};

type ExtractedProfile = {
  person_summary: string;
  education: string;
  languages: string[];
  experience_evidence: ExtractedEvidence[];
};

type SkillCandidate = {
  id: number;
  concept_uri: string;
  preferred_label: string;
  alt_labels: string[] | null;
  skill_type: string | null;
  reuse_level: string | null;
  description: string | null;
  definition: string | null;
  similarity: number;
};

type SkillCandidateSummary = {
  concept_uri: string;
  preferred_label: string;
  similarity: number;
};

type GroundingTrace = {
  evidence_id: string;
  evidence_quote: string;
  database_query: string;
  top_skill_candidates: SkillCandidateSummary[];
};

type GroundedSkill = {
  concept_uri: string;
  preferred_label: string;
  plain_language_label: string;
  evidence_quote: string;
  database_query: string;
  top_skill_candidates: SkillCandidateSummary[];
  similarity: number;
  confidence: "strong" | "medium" | "needs_review";
  explanation: string;
  sources: {
    esco_uri: string;
    esco_text: string;
    embedding_search: string;
    llm_evidence_extraction: string;
  };
};

type OccupationPath = {
  occupation_uri: string;
  preferred_label: string;
  relation_types: string[];
  matched_skill_labels: string[];
  explanation: string;
};

type ExplanationItem = {
  concept_uri: string;
  plain_language_label: string;
  explanation: string;
};

type ExplanationResponse = {
  explanations: ExplanationItem[];
};

const extractionSchema = {
  name: "skill_signal_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "person_summary",
      "education",
      "languages",
      "experience_evidence",
    ],
    properties: {
      person_summary: {
        type: "string",
        description:
          "A short, plain-language summary of the person based only on the interview.",
      },
      education: {
        type: "string",
        description:
          "The education level or training described by the person. Use an empty string if absent.",
      },
      languages: {
        type: "array",
        items: { type: "string" },
      },
      experience_evidence: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "category",
            "evidence_quote",
            "competency",
            "plain_language_label",
          ],
          properties: {
            id: { type: "string" },
            category: {
              type: "string",
              enum: [
                "education",
                "experience",
                "language",
                "tool",
                "competency",
                "goal",
              ],
            },
            evidence_quote: {
              type: "string",
              description:
                "A short exact or near-exact user statement that supports this evidence item.",
            },
            competency: {
              type: "string",
              description:
                "The inferred ability, action, or competency to ground against ESCO.",
            },
            plain_language_label: {
              type: "string",
              description: "A non-technical label the user can understand.",
            },
          },
        },
      },
    },
  },
} as const;

const explanationSchema = {
  name: "skill_signal_explanations",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["explanations"],
    properties: {
      explanations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["concept_uri", "plain_language_label", "explanation"],
          properties: {
            concept_uri: { type: "string" },
            plain_language_label: { type: "string" },
            explanation: {
              type: "string",
              description:
                "One sentence explaining why the user evidence maps to the ESCO skill. Mention the user evidence and ESCO wording, but do not invent facts.",
            },
          },
        },
      },
    },
  },
} as const;

function confidenceFor(similarity: number): GroundedSkill["confidence"] {
  if (similarity >= 0.78) return "strong";
  if (similarity >= 0.65) return "medium";
  return "needs_review";
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((message) => {
      if (
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        "content" in message
      ) {
        const role = message.role === "assistant" ? "assistant" : "user";
        const content =
          typeof message.content === "string" ? message.content.trim() : "";

        return content ? { role, content } : null;
      }

      return null;
    })
    .filter((message): message is ChatMessage => message !== null)
    .slice(-20);
}

function transcriptFrom(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

function escoText(candidate: SkillCandidate) {
  return candidate.definition || candidate.description || candidate.preferred_label;
}

function fallbackExplanation(skill: GroundedSkill) {
  return `Your evidence says "${skill.evidence_quote}", which is close to the ESCO skill "${skill.preferred_label}".`;
}

async function extractEvidence(openai: OpenAI, messages: ChatMessage[]) {
  const model = process.env.SKILL_PROFILE_MODEL || "gpt-4o-mini";
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You extract portable skill evidence for youth employment profiles. Use only the interview text. Do not invent credentials, employers, places, or skills. Return JSON that matches the schema.",
      },
      {
        role: "user",
        content: `Extract skill evidence from this interview transcript.\n\n${transcriptFrom(messages)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: extractionSchema,
    },
  });

  return parseJson<ExtractedProfile>(
    completion.choices[0]?.message.content,
    {
      person_summary:
        "The interview did not include enough detail to build a full profile.",
      education: "",
      languages: [],
      experience_evidence: [],
    },
  );
}

async function explainSkills(openai: OpenAI, skills: GroundedSkill[]) {
  if (skills.length === 0) return new Map<string, ExplanationItem>();

  const model = process.env.SKILL_PROFILE_MODEL || "gpt-4o-mini";
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Explain ESCO skill mappings for a non-expert youth user. Use only the supplied evidence and ESCO text. Do not add new claims.",
      },
      {
        role: "user",
        content: JSON.stringify(
          skills.map((skill) => ({
            concept_uri: skill.concept_uri,
            user_evidence: skill.evidence_quote,
            esco_skill: skill.preferred_label,
            esco_text: skill.sources.esco_text,
            similarity: skill.similarity,
          })),
        ),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: explanationSchema,
    },
  });

  const payload = parseJson<ExplanationResponse>(
    completion.choices[0]?.message.content,
    { explanations: [] },
  );

  return new Map(
    payload.explanations.map((explanation) => [
      explanation.concept_uri,
      explanation,
    ]),
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
    locale?: unknown;
    context?: ProfileContext;
  } | null;

  const messages = normalizeMessages(body?.messages);
  const locale = typeof body?.locale === "string" ? body.locale : "en";
  const context = body?.context ?? {};

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Add interview messages before generating a profile." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY in web/.env.local." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = await createClient();
  const extracted = await extractEvidence(openai, messages);
  const evidenceItems = extracted.experience_evidence.slice(0, 10);

  const embeddingInputs = evidenceItems.map(
    (item) =>
      [
        extracted.person_summary,
        item.plain_language_label,
        item.competency,
        item.evidence_quote,
      ].join("\n"),
  );
  const embeddingResponse =
    embeddingInputs.length > 0
      ? await openai.embeddings.create({
          model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
          input: embeddingInputs,
        })
      : null;

  const groundedSkills: GroundedSkill[] = [];
  const unmappedEvidence: ExtractedEvidence[] = [];
  const groundingTrace: GroundingTrace[] = [];
  const seenSkillUris = new Set<string>();

  for (const [index, item] of evidenceItems.entries()) {
    const embedding = embeddingResponse?.data[index]?.embedding;

    if (!embedding) {
      unmappedEvidence.push(item);
      continue;
    }

    const { data, error } = await supabase.rpc("match_esco_skills", {
      query_embedding: `[${embedding.join(",")}]`,
      match_count: 3,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const candidates = (data ?? []) as SkillCandidate[];
    const topSkillCandidates = candidates.map((candidate) => ({
      concept_uri: candidate.concept_uri,
      preferred_label: candidate.preferred_label,
      similarity: candidate.similarity,
    }));

    groundingTrace.push({
      evidence_id: item.id,
      evidence_quote: item.evidence_quote,
      database_query: embeddingInputs[index],
      top_skill_candidates: topSkillCandidates,
    });

    const candidate = candidates[0];

    if (!candidate || candidate.similarity < 0.45) {
      unmappedEvidence.push(item);
      continue;
    }

    if (seenSkillUris.has(candidate.concept_uri)) {
      continue;
    }

    seenSkillUris.add(candidate.concept_uri);
    groundedSkills.push({
      concept_uri: candidate.concept_uri,
      preferred_label: candidate.preferred_label,
      plain_language_label: item.plain_language_label,
      evidence_quote: item.evidence_quote,
      database_query: embeddingInputs[index],
      top_skill_candidates: topSkillCandidates,
      similarity: candidate.similarity,
      confidence: confidenceFor(candidate.similarity),
      explanation: "",
      sources: {
        esco_uri: candidate.concept_uri,
        esco_text: escoText(candidate),
        embedding_search: `Embedded this query and sent it to the ESCO skills vector database: ${embeddingInputs[index]}`,
        llm_evidence_extraction:
          "The LLM extracted this evidence from the interview transcript; ESCO matching was done separately by embedding search.",
      },
    });
  }

  const explanations = await explainSkills(openai, groundedSkills);
  const skills = groundedSkills.map((skill) => {
    const explanation = explanations.get(skill.concept_uri);

    return {
      ...skill,
      plain_language_label:
        explanation?.plain_language_label || skill.plain_language_label,
      explanation: explanation?.explanation || fallbackExplanation(skill),
    };
  });

  const acceptedSkillUris = skills
    .slice(0, 8)
    .map((skill) => skill.concept_uri);

  const occupationPaths: OccupationPath[] = [];

  if (acceptedSkillUris.length > 0) {
    const { data, error } = await supabase.rpc("get_esco_occupations_for_skills", {
      skill_uris: acceptedSkillUris,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    occupationPaths.push(
      ...((data ?? []) as Array<{
        occupation_uri: string;
        preferred_label: string;
        relation_types: string[] | null;
        matched_skill_labels: string[] | null;
      }>)
        .slice(0, 6)
        .map((occupation) => ({
          occupation_uri: occupation.occupation_uri,
          preferred_label: occupation.preferred_label,
          relation_types: occupation.relation_types ?? [],
          matched_skill_labels: occupation.matched_skill_labels ?? [],
          explanation: `This path appears because ESCO links it to ${(
            occupation.matched_skill_labels ?? []
          ).join(", ") || "one or more matched skills"}.`,
        })),
    );
  }

  return NextResponse.json({
    person_summary: extracted.person_summary,
    education: extracted.education,
    languages: extracted.languages,
    experience_evidence: evidenceItems.map((item) => ({
      ...item,
      mapped: skills.some((skill) => skill.evidence_quote === item.evidence_quote),
    })),
    unmapped_evidence: unmappedEvidence,
    grounding_trace: groundingTrace,
    skills,
    occupation_paths: occupationPaths,
    export_metadata: {
      generated_at: new Date().toISOString(),
      locale,
      context,
      engine_version: "skill-engine-v1",
      grounding:
        "LLM extracts evidence and explanations; ESCO skill IDs are selected through embedding search against the local Supabase taxonomy.",
    },
  });
}
