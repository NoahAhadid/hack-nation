import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SkillProfile, SurveyData } from "@/app/search/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile,
      surveyData,
      sessionKey,
      skillDecisions,
    }: {
      profile: SkillProfile;
      surveyData: SurveyData;
      sessionKey?: string;
      skillDecisions?: Record<string, "accepted" | "declined">;
    } = body;

    const supabase = await createClient();

    // Create or update session
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .upsert(
        {
          session_key: sessionKey || crypto.randomUUID(),
          survey_data: surveyData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "session_key",
        }
      )
      .select()
      .single();

    if (sessionError || !session) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { error: "Failed to save session" },
        { status: 500 }
      );
    }

    // Save skill profile
    const { data: savedProfile, error: profileError } = await supabase
      .from("skill_profiles")
      .insert({
        session_id: session.id,
        person_summary: profile.person_summary,
        education: profile.education,
        languages: profile.languages,
        extracted_skills: profile.extracted_skills,
        experience_evidence: profile.experience_evidence,
        unmapped_evidence: profile.unmapped_evidence,
        grounding_trace: profile.grounding_trace,
        identified_skills: profile.identified_skills,
        occupation_paths: profile.occupation_paths,
        export_metadata: profile.export_metadata,
      })
      .select()
      .single();

    if (profileError || !savedProfile) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    // Save identified skills with decisions
    if (profile.identified_skills && profile.identified_skills.length > 0) {
      const skillsToInsert = profile.identified_skills.map((skill) => ({
        profile_id: savedProfile.id,
        session_id: session.id,
        concept_uri: skill.concept_uri,
        preferred_label: skill.preferred_label,
        user_skill: skill.user_skill,
        evidence_quote: skill.evidence_quote,
        confidence: skill.confidence,
        similarity: skill.similarity,
        decision: skillDecisions?.[skill.concept_uri] || null,
      }));

      const { error: skillsError } = await supabase
        .from("user_identified_skills")
        .insert(skillsToInsert);

      if (skillsError) {
        console.error("Skills error:", skillsError);
        // Don't fail the whole request if skills insert fails
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      profileId: savedProfile.id,
      sessionKey: session.session_key,
    });
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save profile",
      },
      { status: 500 }
    );
  }
}
