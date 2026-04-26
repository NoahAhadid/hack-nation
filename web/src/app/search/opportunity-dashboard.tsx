"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

import type {
  IdentifiedSkill,
  LocalOpportunityMatch,
  OccupationPath,
  OpportunityFinalConsiderations,
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
  finalConsiderations: OpportunityFinalConsiderations;
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
  finalConsiderations,
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
          Final YOUR occupation opportunities
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

      {/* Per-occupation verdict cards from final considerations */}
      <div className="grid gap-4 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Occupation analysis for your location
        </p>
        {[...finalConsiderations.occupationAnalyses]
          .sort((a, b) => {
            const order = { recommended: 0, possible: 1, not_recommended: 2 };
            return (order[a.verdict] ?? 3) - (order[b.verdict] ?? 3);
          })
          .map((analysis, idx) => {
          const verdictBorder =
            analysis.verdict === "recommended"
              ? "border-l-emerald-500"
              : analysis.verdict === "possible"
                ? "border-l-amber-500"
                : "border-l-red-500";
          const verdictBadge =
            analysis.verdict === "recommended"
              ? "bg-emerald-600 text-white"
              : analysis.verdict === "possible"
                ? "bg-amber-500 text-white"
                : "bg-red-500 text-white";
          const verdictIcon =
            analysis.verdict === "recommended"
              ? "✓"
              : analysis.verdict === "possible"
                ? "~"
                : "✗";
          const verdictLabel =
            analysis.verdict === "recommended"
              ? "Recommended"
              : analysis.verdict === "possible"
                ? "Possible"
                : "Not recommended";
          // Find the matching occupation path to get required skills
          const matchingJob = topJobs.find(
            (job) =>
              job.preferred_label.toLowerCase() ===
              analysis.occupationLabel.toLowerCase(),
          );
          const requiredSkills = matchingJob?.required_skills ?? [];
          const hasCount = requiredSkills.filter((s) => s.person_has).length;
          const coveragePct =
            requiredSkills.length > 0
              ? Math.round((hasCount / requiredSkills.length) * 100)
              : 0;
          const escoHref = matchingJob?.occupation_uri?.startsWith("http")
            ? matchingJob.occupation_uri
            : null;
          return (
            <article
              key={`${analysis.occupationLabel}-${analysis.iscoGroup}`}
              className={`overflow-hidden rounded-xl border border-l-4 border-zinc-200 bg-white shadow-md transition-shadow hover:shadow-lg ${verdictBorder}`}
            >
              {/* Card header with gradient */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-zinc-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-400">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-950">
                      {escoHref ? (
                        <a
                          href={escoHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 underline decoration-zinc-300 underline-offset-4 transition hover:text-cyan-700 hover:decoration-cyan-500"
                        >
                          {analysis.occupationLabel}
                          <ExternalLink
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                          />
                        </a>
                      ) : (
                        analysis.occupationLabel
                      )}
                    </h4>
                    {analysis.iscoGroup ? (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        ISCO {analysis.iscoGroup}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm ${verdictBadge}`}
                >
                  {verdictIcon} {verdictLabel}
                </span>
              </div>

              {/* Body */}
              <div className="px-5 pb-5 pt-3">
                <p className="text-sm leading-6 text-zinc-700">
                  {analysis.verdictReason}
                </p>

                {/* Info grid with icons */}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-100 bg-gradient-to-b from-white to-zinc-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-xs">
                        📍
                      </span>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                        Location
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-zinc-700">
                      {analysis.locationRelevance}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-100 bg-gradient-to-b from-white to-zinc-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-xs">
                        📈
                      </span>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                        Trend
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-zinc-700">
                      {analysis.trendSummary}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-100 bg-gradient-to-b from-white to-zinc-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-xs">
                        🎓
                      </span>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                        Education
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-zinc-700">
                      {analysis.educationFit}
                    </p>
                  </div>
                </div>

                {/* Skills coverage bar + pills */}
                {requiredSkills.length > 0 ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        Skill coverage
                      </p>
                      <p className="text-sm font-bold text-zinc-700">
                        {hasCount}
                        <span className="text-zinc-400">
                          /{requiredSkills.length}
                        </span>
                        <span className="ml-1.5 text-xs font-medium text-zinc-400">
                          ({coveragePct}%)
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          coveragePct >= 70
                            ? "bg-emerald-500"
                            : coveragePct >= 40
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{ width: `${coveragePct}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {requiredSkills
                        .slice()
                        .sort((a, b) =>
                          a.person_has === b.person_has
                            ? 0
                            : a.person_has
                              ? -1
                              : 1,
                        )
                        .map((skill) => (
                          <span
                            key={skill.skill_uri}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              skill.person_has
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-zinc-200 bg-zinc-50 text-zinc-500"
                            }`}
                          >
                            {skill.person_has ? "✓ " : "○ "}
                            {skill.skill_label}
                          </span>
                        ))}
                    </div>
                  </div>
                ) : null}

                {/* Next steps */}
                {analysis.actionableNextSteps.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-cyan-100 bg-gradient-to-r from-cyan-50 to-sky-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                      Next steps
                    </p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-cyan-950">
                      {analysis.actionableNextSteps.map((step, i) => (
                        <li key={step} className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-200 text-[10px] font-bold text-cyan-800">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
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
