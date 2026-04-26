"use client";

import { useMemo } from "react";

import type {
  IdentifiedSkill,
  LocalOpportunityMatch,
  OccupationPath,
  OpportunityProtocolConfig,
  SurveyData,
} from "./types";
import { buildLocalOpportunityMatches } from "./utils";

type OpportunityDashboardProps = {
  identifiedSkills: IdentifiedSkill[];
  localMatches?: LocalOpportunityMatch[];
  selectedOpportunityConfig: OpportunityProtocolConfig;
  surveyData: SurveyData;
  topJobs: OccupationPath[];
};

function signalLabel(key: string) {
  const labels: Record<string, string> = {
    skillFit: "Skill fit",
    localDemand: "Local demand",
    wageFloor: "Wage floor",
    growth: "Growth outlook",
    automationResilience: "Automation resilience",
    trainingAccess: "Training access",
  };
  return labels[key] ?? key;
}

function strengthWord(value: number) {
  if (value >= 0.8) return "Strong";
  if (value >= 0.5) return "Moderate";
  return "Low";
}

function strengthColor(value: number) {
  if (value >= 0.8) return "text-emerald-700";
  if (value >= 0.5) return "text-cyan-700";
  return "text-amber-700";
}

function barPercent(value: number) {
  return `${Math.min(Math.round(value * 100), 100)}%`;
}

function barColor(value: number) {
  if (value >= 0.8) return "bg-emerald-400";
  if (value >= 0.5) return "bg-cyan-400";
  return "bg-amber-400";
}

export function OpportunityDashboard({
  identifiedSkills,
  localMatches: providedLocalMatches,
  selectedOpportunityConfig,
  surveyData,
  topJobs,
}: OpportunityDashboardProps) {
  const localMatches =
    providedLocalMatches ??
    buildLocalOpportunityMatches(
      selectedOpportunityConfig,
      surveyData,
      identifiedSkills,
      topJobs,
    ).slice(0, 4);

  const userSkillLabels = useMemo(
    () =>
      new Set(
        identifiedSkills.map((s) => s.preferred_label.toLowerCase()),
      ),
    [identifiedSkills],
  );

  return (
    <section className="rounded-md border border-zinc-300 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
          Recommended opportunities
        </p>
        <h3 className="mt-1 text-xl font-semibold text-zinc-950">
          Final recommendations for {selectedOpportunityConfig.region}
        </h3>
        {identifiedSkills.length > 0 ? (
          <p className="mt-2 text-sm text-zinc-600">
            Based on your {identifiedSkills.length} verified skills
            {topJobs.length > 0
              ? ` and ${topJobs.length} matched ESCO occupations (${topJobs.slice(0, 3).map((j) => j.preferred_label).join(", ")}${topJobs.length > 3 ? "…" : ""})`
              : ""}
            {surveyData.educational_level
              ? `, education: ${surveyData.educational_level}`
              : ""}
            {surveyData.location ? `, location: ${surveyData.location}` : ""}
          </p>
        ) : null}
      </div>

      <ol className="divide-y divide-zinc-200">
        {localMatches.map((match, index) => {
          const missingKeywords = match.skillKeywords.filter(
            (kw) => !match.matchedKeywords.includes(kw),
          );

          // Find user's ESCO skills that relate to this opportunity's keywords
          const relevantUserSkills = identifiedSkills.filter((skill) => {
            const label = skill.preferred_label.toLowerCase();
            return match.skillKeywords.some(
              (kw) =>
                label.includes(kw.toLowerCase()) ||
                kw.toLowerCase().includes(label) ||
                kw
                  .toLowerCase()
                  .split(/\s+/)
                  .filter((w) => w.length > 3)
                  .some((w) => label.includes(w)),
            );
          });

          // Find user's ESCO occupations that relate to this opportunity
          const relatedUserOccupations = topJobs.filter((job) => {
            const jobLabel = job.preferred_label.toLowerCase();
            const sector = match.sector.toLowerCase();
            return (
              jobLabel.includes(sector) ||
              sector.includes(jobLabel) ||
              match.skillKeywords.some((kw) =>
                job.matched_skill_labels
                  .join(" ")
                  .toLowerCase()
                  .includes(kw.toLowerCase()),
              )
            );
          });

          const whyReasons: string[] = [];
          if (relevantUserSkills.length > 0)
            whyReasons.push(
              `Your ESCO-verified skills (${relevantUserSkills.map((s) => s.preferred_label).join(", ")}) directly apply to this role`,
            );
          if (match.scoreParts.skillFit >= 0.5)
            whyReasons.push(
              `Your skills already cover ${Math.round(match.scoreParts.skillFit * 100)}% of what this role needs`,
            );
          if (relatedUserOccupations.length > 0)
            whyReasons.push(
              `Your profile matches ESCO occupations: ${relatedUserOccupations.slice(0, 2).map((j) => j.preferred_label).join(", ")}`,
            );
          if (match.scoreParts.localDemand >= 0.6)
            whyReasons.push(
              `Local demand is strong (${match.demandLevel}/5) in ${selectedOpportunityConfig.region}`,
            );
          if (match.scoreParts.growth >= 0.6)
            whyReasons.push(
              `Growth outlook is positive (${match.growthOutlook}/5)`,
            );
          if (match.scoreParts.automationResilience >= 0.6)
            whyReasons.push(
              `Low automation risk makes this role more sustainable`,
            );
          if (match.scoreParts.trainingAccess >= 0.6)
            whyReasons.push(
              `Training pathways are accessible in your area`,
            );
          if (match.scoreParts.wageFloor >= 0.6)
            whyReasons.push(
              `Wage floor signal is promising (${match.wageFloor})`,
            );
          if (surveyData.educational_level && match.requiredEducation)
            whyReasons.push(
              `Your education (${surveyData.educational_level}) vs. required: ${match.requiredEducation}`,
            );
          if (whyReasons.length === 0)
            whyReasons.push(
              "This opportunity was the best available match across all signals.",
            );

          return (
            <li key={match.id} className="px-4 py-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-950">
                      {match.title}
                    </h4>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {match.sector} · {match.opportunityType} · ISCO{" "}
                      {match.iscoGroup}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-center">
                  <p className="text-2xl font-bold text-cyan-800">
                    {Math.round(match.score * 100)}%
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600">
                    Fit score
                  </p>
                </div>
              </div>

              {/* Signal breakdown bar */}
              <div className="mt-4 grid gap-1.5">
                {Object.entries(match.scoreParts).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-[7.5rem] shrink-0 text-zinc-500">
                      {signalLabel(key)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${barColor(value)}`}
                        style={{ width: barPercent(value) }}
                      />
                    </div>
                    <span
                      className={`w-16 text-right font-medium ${strengthColor(value)}`}
                    >
                      {strengthWord(value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Skills section */}
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {/* Skills you have */}
                <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                    Skills you have ({match.matchedKeywords.length}/
                    {match.skillKeywords.length})
                  </p>
                  {match.matchedKeywords.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {match.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-emerald-700">
                      No direct keyword matches yet — your broader experience
                      may still transfer.
                    </p>
                  )}
                </div>

                {/* Skills you still need */}
                <div className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                    Skills to develop ({missingKeywords.length})
                  </p>
                  {missingKeywords.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {missingKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                        >
                          ○ {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-amber-700">
                      You already cover all identified skill keywords!
                    </p>
                  )}
                </div>
              </div>

              {/* Your ESCO skills relevant to this opportunity */}
              {relevantUserSkills.length > 0 ? (
                <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50/50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-800">
                    Your verified ESCO skills for this role ({relevantUserSkills.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {relevantUserSkills.map((skill) => (
                      <span
                        key={skill.concept_uri}
                        className="rounded-full border border-indigo-300 bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-900"
                      >
                        {skill.preferred_label}
                        <span className="ml-1 text-indigo-600">
                          ({skill.confidence})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Why this is good for you */}
              <div className="mt-4 rounded-md border border-cyan-200 bg-cyan-50/50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                  Why this opportunity fits you
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-cyan-950">
                  {whyReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {match.relatedOccupationLabels.length > 0 ? (
                  <p className="mt-2 text-xs text-cyan-700">
                    Related ESCO occupations:{" "}
                    {match.relatedOccupationLabels.join(", ")}
                  </p>
                ) : null}
              </div>

              {/* How to get missing skills */}
              {missingKeywords.length > 0 ? (
                <div className="mt-4 rounded-md border border-violet-200 bg-violet-50/50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-800">
                    How to close the skill gap
                  </p>
                  <div className="mt-2 space-y-2 text-sm leading-6 text-violet-950">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-violet-500">
                        📋
                      </span>
                      <p>
                        <span className="font-semibold">Entry pathway:</span>{" "}
                        {match.trainingPathway}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-violet-500">
                        🎓
                      </span>
                      <p>
                        <span className="font-semibold">Education needed:</span>{" "}
                        {match.requiredEducation}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-violet-500">
                        📍
                      </span>
                      <p>
                        <span className="font-semibold">
                          Local training access:
                        </span>{" "}
                        {match.trainingAccess}/5 —{" "}
                        {match.trainingAccess >= 4
                          ? "Good availability in your area"
                          : match.trainingAccess >= 3
                            ? "Some options available locally"
                            : "Limited local options — online or travel may be needed"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-violet-500">
                        🔧
                      </span>
                      <p>
                        <span className="font-semibold">
                          Skills to focus on:
                        </span>{" "}
                        {missingKeywords.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                    Ready to apply
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    Your profile covers all skill keywords for this opportunity.
                    Entry pathway: {match.trainingPathway}
                  </p>
                </div>
              )}

              {/* Location context */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">
                  📍 {match.locationFit}
                </span>
                <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">
                  💰 {match.wageFloor}
                </span>
                <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">
                  📊 Demand {match.demandLevel}/5
                </span>
                <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">
                  🤖 Automation {match.automationExposure}/5
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
