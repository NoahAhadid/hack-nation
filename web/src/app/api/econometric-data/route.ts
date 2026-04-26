import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TopSkill = {
  concept_uri: string;
  preferred_label: string;
  user_count: number;
  total_occurrences: number;
  confidence_breakdown: {
    strong: number;
    medium: number;
    needs_review: number;
  };
  acceptance_rate: number;
};

type TopOpportunity = {
  opportunity_id: string;
  title: string;
  sector: string;
  isco_group: string;
  user_count: number;
  avg_match_score: number;
  total_matches: number;
};

type UserStats = {
  total_users: number;
  total_profiles: number;
  total_skills_identified: number;
  total_opportunities_matched: number;
  avg_skills_per_user: number;
  avg_opportunities_per_user: number;
};

type EconometricData = {
  stats: UserStats;
  top_skills: TopSkill[];
  top_opportunities: TopOpportunity[];
};

export async function GET() {
  try {
    const supabase = await createClient();

    // Get user stats
    const { count: sessionCount } = await supabase
      .from("user_sessions")
      .select("id", { count: "exact", head: true });

    const { count: profileCount } = await supabase
      .from("skill_profiles")
      .select("id", { count: "exact", head: true });

    const { count: skillCount } = await supabase
      .from("user_identified_skills")
      .select("id", { count: "exact", head: true });

    const { count: opportunityCount } = await supabase
      .from("user_opportunities")
      .select("id", { count: "exact", head: true });

    const totalUsers = sessionCount ?? 0;
    const totalProfiles = profileCount ?? 0;
    const totalSkills = skillCount ?? 0;
    const totalOpportunities = opportunityCount ?? 0;

    const stats: UserStats = {
      total_users: totalUsers,
      total_profiles: totalProfiles,
      total_skills_identified: totalSkills,
      total_opportunities_matched: totalOpportunities,
      avg_skills_per_user:
        totalUsers > 0 ? totalSkills / totalUsers : 0,
      avg_opportunities_per_user:
        totalUsers > 0 ? totalOpportunities / totalUsers : 0,
    };

    // Get top skills
    const { data: topSkillsData, error: skillsError } = await supabase.rpc(
      "get_top_skills",
      { limit_count: 20 }
    );

    if (skillsError) {
      console.error("Top skills error:", skillsError);
    }

    const top_skills: TopSkill[] = (topSkillsData || []).map((skill: any) => ({
      concept_uri: skill.concept_uri,
      preferred_label: skill.preferred_label,
      user_count: skill.user_count,
      total_occurrences: skill.total_occurrences,
      confidence_breakdown: {
        strong: skill.strong_count || 0,
        medium: skill.medium_count || 0,
        needs_review: skill.needs_review_count || 0,
      },
      acceptance_rate: skill.acceptance_rate || 0,
    }));

    // Get top opportunities
    const { data: topOpportunitiesData, error: opportunitiesError } =
      await supabase.rpc("get_top_opportunities", { limit_count: 20 });

    if (opportunitiesError) {
      console.error("Top opportunities error:", opportunitiesError);
    }

    const top_opportunities: TopOpportunity[] = (
      topOpportunitiesData || []
    ).map((opp: any) => ({
      opportunity_id: opp.opportunity_id,
      title: opp.title,
      sector: opp.sector,
      isco_group: opp.isco_group,
      user_count: opp.user_count,
      avg_match_score: opp.avg_match_score || 0,
      total_matches: opp.total_matches,
    }));

    const response: EconometricData = {
      stats,
      top_skills,
      top_opportunities,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Econometric data error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load econometric data",
      },
      { status: 500 }
    );
  }
}
