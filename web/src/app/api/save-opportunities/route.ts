import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LocalOpportunityMatch } from "@/app/search/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      opportunities,
      sessionId,
      profileId,
    }: {
      opportunities: LocalOpportunityMatch[];
      sessionId: string;
      profileId: string;
    } = body;

    if (!sessionId || !profileId) {
      return NextResponse.json(
        { error: "Session ID and Profile ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete existing opportunities for this profile
    await supabase
      .from("user_opportunities")
      .delete()
      .eq("profile_id", profileId);

    // Save new opportunities
    const opportunitiesToInsert = opportunities.map((opp) => ({
      session_id: sessionId,
      profile_id: profileId,
      opportunity_id: opp.id,
      title: opp.title,
      sector: opp.sector,
      opportunity_type: opp.opportunityType,
      isco_group: opp.iscoGroup,
      location_fit: opp.locationFit,
      required_education: opp.requiredEducation,
      skill_keywords: opp.skillKeywords,
      matched_keywords: opp.matchedKeywords,
      related_occupation_labels: opp.relatedOccupationLabels,
      demand_level: opp.demandLevel,
      wage_floor_signal: opp.wageFloorSignal,
      wage_floor: opp.wageFloor,
      growth_outlook: opp.growthOutlook,
      automation_exposure: opp.automationExposure,
      training_access: opp.trainingAccess,
      training_pathway: opp.trainingPathway,
      match_score: opp.score,
      score_parts: opp.scoreParts,
      source_ids: opp.sourceIds,
    }));

    const { error: opportunitiesError } = await supabase
      .from("user_opportunities")
      .insert(opportunitiesToInsert);

    if (opportunitiesError) {
      console.error("Opportunities error:", opportunitiesError);
      return NextResponse.json(
        { error: "Failed to save opportunities" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: opportunities.length,
    });
  } catch (error) {
    console.error("Save opportunities error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save opportunities",
      },
      { status: 500 }
    );
  }
}
