import type { IdentifiedSkill, SkillProfile } from "./types";
import { skillConfidenceFromSimilarity } from "./utils";

export function identifiedSkillsForProfile(
  currentProfile: SkillProfile,
): IdentifiedSkill[] {
  return (
    currentProfile.identified_skills ??
    currentProfile.grounding_trace.flatMap((trace) => {
      const topCandidates = trace.top_skill_candidates.slice(0, 2);
      if (topCandidates.length === 0) return [];

      return topCandidates.map((candidate) => ({
        concept_uri: candidate.concept_uri,
        preferred_label: candidate.preferred_label,
        user_skill: trace.extracted_skill || "Extracted skill",
        evidence_quote: trace.evidence_quote,
        database_query: trace.database_query,
        similarity: candidate.similarity,
        confidence: skillConfidenceFromSimilarity(candidate.similarity),
      }));
    })
  );
}
