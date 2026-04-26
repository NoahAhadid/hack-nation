"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { OpportunityDashboard } from "./opportunity-dashboard";
import { identifiedSkillsForProfile } from "./profile-view-utils";
import type {
  OpportunityFinalConsiderations,
  OpportunityProtocolConfig,
  SkillDecision,
  SkillProfile,
  SurveyData,
} from "./types";
import {
  buildLocalOpportunityMatches,
  formatCoveragePercent,
  formatCoverageValue,
  formatScoreValue,
} from "./utils";

type SkillOpportunitiesViewProps = {
  currentProfile: SkillProfile;
  selectedOpportunityConfig: OpportunityProtocolConfig;
  skillDecisions: Record<string, SkillDecision>;
  surveyData: SurveyData;
  onSaveOpportunities?: (opportunities: any[]) => void;
};

type IscoTrendPoint = {
  year: number;
  value: number;
};

type IscoTrendResponse = {
  error?: string;
  suggestions?: string[];
  location?: string;
  sex?: string;
  ageGroup?: string;
  majorGroup?: string;
  unit?: string;
  points?: IscoTrendPoint[];
  latest?: IscoTrendPoint;
  latestChange?: {
    absolute: number;
    percent: number | null;
  } | null;
  periodChange?: {
    absolute: number;
    percent: number;
  } | null;
  direction?: string;
};

type IscoTrendLookup = {
  majorCode: string;
  path: SkillProfile["occupation_paths"][number];
  status: "loading" | "ready" | "error";
  trend?: IscoTrendResponse;
  error?: string;
  suggestions?: string[];
};

type IscoTrendLookupState = {
  key: string;
  lookups: IscoTrendLookup[];
};

type LocalTrendLookup = {
  majorCode: string;
  matchLabel: string;
  status: "loading" | "ready" | "error";
  data?: IscoEducationResponse;
  error?: string;
  suggestions?: string[];
};

type LocalTrendLookupState = {
  key: string;
  lookups: LocalTrendLookup[];
};

type IscoEducationLevelTrend = {
  level: string;
  points: { year: number; value: number }[];
  latest: { year: number; value: number } | null;
  latestChange: { absolute: number; percent: number | null } | null;
  periodChange: { absolute: number; percent: number } | null;
};

type IscoEducationDistribution = {
  level: string;
  value: number;
  percent: number;
};

type IscoEducationResponse = {
  error?: string;
  suggestions?: string[];
  location?: string;
  sex?: string;
  majorCode?: string;
  majorGroup?: string;
  unit?: string;
  levels?: IscoEducationLevelTrend[];
  distribution?: IscoEducationDistribution[];
  latestYear?: number | null;
};

type FinalConsiderationsStatus = "idle" | "loading" | "ready" | "error";

function iscoMajorCodeFromGroup(iscoGroup: string) {
  const match = iscoGroup?.trim().match(/^\D*(\d)/);
  return match?.[1] ?? null;
}

function externalHref(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : null;
}

function iscoMajorCodeForPath(path: SkillProfile["occupation_paths"][number]) {
  if (path.isco_08_major_code) return path.isco_08_major_code;

  const iscoGroup = path.iscoGroup ?? path.isco_group;
  const match = iscoGroup?.trim().match(/^\D*(\d)/);

  return match?.[1] ?? null;
}

function formatTrendValue(value: number | undefined) {
  return typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : "-";
}

function formatTrendPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "-";

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatTrendDelta(value: number | undefined) {
  if (typeof value !== "number") return "-";

  return `${value > 0 ? "+" : ""}${value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })}`;
}

function formatRealismLevel(level: string) {
  return level.replace(/_/g, " ");
}

export function SkillOpportunitiesView({
  currentProfile,
  selectedOpportunityConfig,
  skillDecisions,
  surveyData,
  onSaveOpportunities,
}: SkillOpportunitiesViewProps) {
  const identifiedSkills = useMemo(
    () => identifiedSkillsForProfile(currentProfile),
    [currentProfile],
  );
  const acceptedSkills = useMemo(
    () =>
      identifiedSkills.filter(
        (skill) => skillDecisions[skill.concept_uri] !== "declined",
      ),
    [identifiedSkills, skillDecisions],
  );
  const topJobs = currentProfile.occupation_paths;
  const normalizedSex = surveyData.sex.trim().toLowerCase();
  const trendSex =
    normalizedSex === "female"
      ? "Female"
      : normalizedSex === "male"
        ? "Male"
        : "Total";
  const trendLocationParts = surveyData.location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const trendLocation =
    trendLocationParts[trendLocationParts.length - 1] ?? "";
  const localMatches = useMemo(
    () =>
      buildLocalOpportunityMatches(
        selectedOpportunityConfig,
        surveyData,
        acceptedSkills,
        topJobs,
      ).slice(0, 4),
    [acceptedSkills, selectedOpportunityConfig, surveyData, topJobs],
  );
  const topTrendJobs = useMemo(
    () =>
      topJobs
        .slice(0, 3)
        .map((path) => ({
          path,
          majorCode: iscoMajorCodeForPath(path),
        }))
        .filter(
          (item): item is {
            path: SkillProfile["occupation_paths"][number];
            majorCode: string;
          } => Boolean(item.majorCode),
        ),
    [topJobs],
  );
  const trendLookupKey = useMemo(
    () =>
      [
        trendLocation,
        trendSex,
        ...topTrendJobs.map(
          ({ path, majorCode }) => `${majorCode}:${path.occupation_uri}`,
        ),
      ].join("|"),
    [topTrendJobs, trendLocation, trendSex],
  );
  const loadingTrendLookups = useMemo<IscoTrendLookup[]>(
    () =>
      topTrendJobs.map(({ path, majorCode }) => ({
        path,
        majorCode,
        status: "loading" as const,
      })),
    [topTrendJobs],
  );
  const [trendLookupState, setTrendLookupState] =
    useState<IscoTrendLookupState>({
      key: "",
      lookups: [],
    });
  const trendLookups = useMemo<IscoTrendLookup[]>(() => {
    if (!trendLocation || topTrendJobs.length === 0) return [];

    return trendLookupState.key === trendLookupKey
      ? trendLookupState.lookups
      : loadingTrendLookups;
  }, [
    loadingTrendLookups,
    topTrendJobs.length,
    trendLocation,
    trendLookupKey,
    trendLookupState.key,
    trendLookupState.lookups,
  ]);

  // Education level lookups per Step 1 ISCO major code (Step 3)
  const eduTrendJobs = useMemo(() => {
    const seen = new Set<string>();
    return topTrendJobs.filter(({ majorCode }) => {
      if (seen.has(majorCode)) return false;
      seen.add(majorCode);
      return true;
    });
  }, [topTrendJobs]);
  const eduTrendLookupKey = useMemo(
    () =>
      [
        trendLocation,
        trendSex,
        ...eduTrendJobs.map(
          ({ path, majorCode }) => `edu:${majorCode}:${path.occupation_uri}`,
        ),
      ].join("|"),
    [eduTrendJobs, trendLocation, trendSex],
  );
  const loadingEduTrendLookups = useMemo<LocalTrendLookup[]>(
    () =>
      eduTrendJobs.map(({ path, majorCode }) => ({
        matchLabel: path.preferred_label,
        majorCode,
        status: "loading" as const,
      })),
    [eduTrendJobs],
  );
  const [eduTrendLookupState, setEduTrendLookupState] =
    useState<LocalTrendLookupState>({
      key: "",
      lookups: [],
    });
  const eduTrendLookups = useMemo<LocalTrendLookup[]>(() => {
    if (!trendLocation || eduTrendJobs.length === 0) return [];

    return eduTrendLookupState.key === eduTrendLookupKey
      ? eduTrendLookupState.lookups
      : loadingEduTrendLookups;
  }, [
    loadingEduTrendLookups,
    eduTrendJobs.length,
    trendLocation,
    eduTrendLookupKey,
    eduTrendLookupState.key,
    eduTrendLookupState.lookups,
  ]);

  const [finalConsiderationsStatus, setFinalConsiderationsStatus] =
    useState<FinalConsiderationsStatus>("idle");
  const [finalConsiderations, setFinalConsiderations] =
    useState<OpportunityFinalConsiderations | null>(null);
  const [finalConsiderationsError, setFinalConsiderationsError] = useState("");

  // Auto-save opportunities when they are computed
  useEffect(() => {
    if (localMatches.length > 0 && onSaveOpportunities) {
      onSaveOpportunities(localMatches);
    }
  }, [localMatches, onSaveOpportunities]);

  useEffect(() => {
    let isCurrent = true;

    if (!trendLocation || topTrendJobs.length === 0) {
      return;
    }

    void Promise.all(
      topTrendJobs.map(async ({ path, majorCode }) => {
        try {
          const response = await fetch("/api/isco-trend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: trendLocation,
              sex: trendSex,
              majorCode,
            }),
          });
          const payload = (await response.json()) as IscoTrendResponse;

          if (!response.ok || payload.error) {
            return {
              path,
              majorCode,
              status: "error" as const,
              error: payload.error || "Trend lookup failed.",
              suggestions: payload.suggestions,
            };
          }

          return {
            path,
            majorCode,
            status: "ready" as const,
            trend: payload,
          };
        } catch (error) {
          return {
            path,
            majorCode,
            status: "error" as const,
            error:
              error instanceof Error ? error.message : "Trend lookup failed.",
          };
        }
      }),
    ).then((lookups) => {
      if (isCurrent) {
        setTrendLookupState({
          key: trendLookupKey,
          lookups,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [topTrendJobs, trendLocation, trendLookupKey, trendSex]);

  // Fetch education level data per ISCO major code (Step 3)
  useEffect(() => {
    let isCurrent = true;

    if (!trendLocation || eduTrendJobs.length === 0) {
      return;
    }

    void Promise.all(
      eduTrendJobs.map(async ({ path, majorCode }) => {
        try {
          const response = await fetch("/api/isco-education", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: trendLocation,
              sex: trendSex,
              majorCode,
            }),
          });
          const payload = (await response.json()) as IscoEducationResponse;

          if (!response.ok || payload.error) {
            return {
              matchLabel: path.preferred_label,
              majorCode,
              status: "error" as const,
              error: payload.error || "Education lookup failed.",
              suggestions: payload.suggestions,
            };
          }

          return {
            matchLabel: path.preferred_label,
            majorCode,
            status: "ready" as const,
            data: payload,
          };
        } catch (error) {
          return {
            matchLabel: path.preferred_label,
            majorCode,
            status: "error" as const,
            error:
              error instanceof Error
                ? error.message
                : "Education lookup failed.",
          };
        }
      }),
    ).then((lookups) => {
      if (isCurrent) {
        setEduTrendLookupState({
          key: eduTrendLookupKey,
          lookups,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [eduTrendJobs, trendLocation, eduTrendLookupKey, trendSex]);

  useEffect(() => {
    let isCurrent = true;
    const resetFinalConsiderations = () => {
      queueMicrotask(() => {
        if (!isCurrent) return;
        setFinalConsiderationsStatus("idle");
        setFinalConsiderations(null);
        setFinalConsiderationsError("");
      });
    };

    if (localMatches.length === 0) {
      resetFinalConsiderations();
      return () => {
        isCurrent = false;
      };
    }

    const trendLookupExpected = Boolean(trendLocation && topTrendJobs.length > 0);
    const trendStillLoading =
      (trendLookupExpected && trendLookups.length !== topTrendJobs.length) ||
      trendLookups.some((lookup) => lookup.status === "loading");

    const eduLookupExpected = Boolean(trendLocation && eduTrendJobs.length > 0);
    const eduStillLoading =
      (eduLookupExpected && eduTrendLookups.length !== eduTrendJobs.length) ||
      eduTrendLookups.some((lookup) => lookup.status === "loading");

    if (trendStillLoading || eduStillLoading) {
      resetFinalConsiderations();
      return () => {
        isCurrent = false;
      };
    }

    queueMicrotask(() => {
      if (!isCurrent) return;
      setFinalConsiderationsStatus("loading");
      setFinalConsiderations(null);
      setFinalConsiderationsError("");
    });

    void fetch("/api/opportunity-final-considerations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surveyData,
        currentProfile,
        selectedOpportunityConfig,
        localOpportunities: localMatches,
        trendLookups,
        educationLookups: eduTrendLookups,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | OpportunityFinalConsiderations
          | { error?: string };

        if (!response.ok || "error" in payload) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Final considerations failed.",
          );
        }

        return payload as OpportunityFinalConsiderations;
      })
      .then((payload) => {
        if (!isCurrent) return;
        setFinalConsiderations(payload);
        setFinalConsiderationsStatus("ready");
      })
      .catch((error) => {
        if (!isCurrent) return;
        setFinalConsiderationsError(
          error instanceof Error
            ? error.message
            : "Final considerations failed.",
        );
        setFinalConsiderationsStatus("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [
    currentProfile,
    eduTrendJobs.length,
    eduTrendLookups,
    localMatches,
    selectedOpportunityConfig,
    surveyData,
    topTrendJobs.length,
    trendLocation,
    trendLookups,
  ]);

  return (
    <section className="grid gap-5">
      <div className="rounded-md border border-cyan-200 bg-cyan-50 shadow-sm">
        <div className="px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              How this view works
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
              Turning the accepted skill profile into opportunity routes
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-cyan-950">
              This view takes only the ESCO skills the user accepted, compares
              them with the active local opportunity protocol, and shows why
              each route may fit. The first section blends local labor-market
              signals, training pathways, and stakeholder weights; the second
              section shows the ESCO jobs whose required skills overlap with the
              accepted profile.
            </p>
          </div>
        </div>
      </div>

      <details className="rounded-md border border-zinc-300 bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-950">
          See the system work
        </summary>
        <section className="grid gap-3 border-t border-zinc-200 bg-zinc-50 p-3">
          <details className="rounded-md border border-zinc-300 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-950">
              Step 1: opportunity matches
            </summary>
            {topJobs.length === 0 ? (
              <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                No occupation paths found from the current ESCO matches.
              </div>
            ) : (
              <ol className="divide-y divide-zinc-200 border-t border-zinc-200">
                {topJobs.map((path, index) => {
                  const occupationHref = externalHref(path.occupation_uri);
                  const iscoMajorCode = iscoMajorCodeForPath(path);
                  const matchedSkillCount =
                    path.matched_skill_count ??
                    path.matched_skill_labels.length;
                  const matchedEssentialSkillCount =
                    path.matched_essential_skill_count ?? 0;
                  const matchedSkillScore = matchedSkillCount * 100;
                  const matchedEssentialScore =
                    matchedEssentialSkillCount * 25;
                  const coverageScore =
                    typeof path.skill_coverage === "number"
                      ? path.skill_coverage * 10
                      : undefined;

                  return (
                    <li
                      key={path.occupation_uri}
                      className="grid gap-4 px-4 py-4 lg:grid-cols-[3rem_minmax(0,1fr)_18rem]"
                    >
                      <p className="text-2xl font-semibold text-cyan-800">
                        {index + 1}
                      </p>
                      <div className="min-w-0">
                        <h4 className="text-lg font-semibold text-zinc-950">
                          {occupationHref ? (
                            <a
                              href={occupationHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-600"
                            >
                              {path.preferred_label}
                              <ExternalLink
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0"
                              />
                            </a>
                          ) : (
                            path.preferred_label
                          )}
                        </h4>
                        <p className="mt-1 break-all text-xs text-zinc-500">
                          {occupationHref ? (
                            <a
                              href={occupationHref}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-zinc-300 underline-offset-2 transition hover:text-cyan-800 hover:decoration-cyan-600"
                            >
                              {path.occupation_uri}
                            </a>
                          ) : (
                            path.occupation_uri
                          )}
                        </p>
                        {iscoMajorCode ? (
                          <p className="mt-2 inline-flex rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-900">
                            ISCO-08 major code {iscoMajorCode}
                          </p>
                        ) : null}
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                          {path.explanation}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {path.matched_skill_labels.map((label) => (
                            <span
                              key={`${path.occupation_uri}-${label}`}
                              className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-950"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        <details className="mt-4 rounded-md border border-zinc-200 bg-zinc-50">
                          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-zinc-950">
                            Show full occupation skill list
                          </summary>
                          {path.required_skills?.length ? (
                            <div className="grid max-h-72 gap-2 overflow-auto border-t border-zinc-200 p-2 sm:grid-cols-2">
                              {path.required_skills.map((skill) => (
                                <div
                                  key={skill.skill_uri}
                                  className={`rounded border px-3 py-2 text-sm ${
                                    skill.person_has
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                                      : "border-zinc-200 bg-white text-zinc-700"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-medium">
                                      {skill.skill_label}
                                    </span>
                                    <span
                                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                                        skill.person_has
                                          ? "bg-emerald-800 text-white"
                                          : "bg-zinc-200 text-zinc-700"
                                      }`}
                                    >
                                      {skill.person_has ? "Has" : "Gap"}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs opacity-80">
                                    {skill.relation_types.join(", ") ||
                                      "relation not specified"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="border-t border-zinc-200 p-3 text-sm text-zinc-500">
                              Full skill list was not returned for this
                              occupation.
                            </p>
                          )}
                        </details>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Fit score
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-cyan-800">
                          {matchedSkillCount}/{path.required_skill_count ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          skills matched
                        </p>
                        <div className="mt-3 space-y-1 text-xs leading-5">
                          <p>
                            Matched skills: {matchedSkillCount} * 100 ={" "}
                            {formatScoreValue(matchedSkillScore, 0)}
                          </p>
                          <p>
                            Essential skills: {matchedEssentialSkillCount} * 25
                            = {formatScoreValue(matchedEssentialScore, 0)}
                          </p>
                          <p>
                            Coverage: {formatCoverageValue(path.skill_coverage)}{" "}
                            * 10 = {formatScoreValue(coverageScore)}
                          </p>
                          <p>
                            Matched similarity:{" "}
                            {formatScoreValue(path.matched_similarity)}
                          </p>
                          <p>
                            Relation penalty: -
                            {formatScoreValue(path.relation_rank, 0)}
                          </p>
                        </div>
                        <p className="mt-3 border-t border-zinc-200 pt-2 text-sm font-semibold text-zinc-950">
                          Final rank score: {formatScoreValue(path.rank_score)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Coverage: {formatCoveragePercent(path.skill_coverage)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </details>

          <details className="rounded-md border border-zinc-300 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-950">
              Step 2: ISCO Market trend analysis
            </summary>
            {!trendLocation ? (
              <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                No location is available for the trend lookup.
              </div>
            ) : topTrendJobs.length === 0 ? (
              <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                No ISCO-08 major codes are available for the top opportunity
                matches.
              </div>
            ) : (
              <div className="grid gap-4 border-t border-zinc-200 px-4 py-4">
                <div className="flex items-center gap-3 rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 px-4 py-3 text-sm text-cyan-950">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
                    {topTrendJobs.length}
                  </span>
                  <span>
                    Top Step 1 matches for <strong>{trendLocation}</strong>{" "}
                    ({trendSex})
                  </span>
                </div>
                <div className="grid gap-4">
                  {trendLookups.map((lookup, index) => {
                    const trend = lookup.trend;
                    const points = trend?.points ?? [];
                    const maxVal = Math.max(...points.map((p) => p.value), 1);
                    const directionColor =
                      trend?.direction === "increasing"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : trend?.direction === "decreasing"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : trend?.direction === "stable"
                            ? "bg-sky-100 text-sky-800 border-sky-300"
                            : "bg-zinc-100 text-zinc-700 border-zinc-300";
                    const directionIcon =
                      trend?.direction === "increasing"
                        ? "\u2197"
                        : trend?.direction === "decreasing"
                          ? "\u2198"
                          : trend?.direction === "stable"
                            ? "\u2192"
                            : "\u2022";
                    const latestPct = trend?.latestChange?.percent;
                    const periodPct = trend?.periodChange?.percent;

                    return (
                      <article
                        key={`${lookup.path.occupation_uri}-${lookup.majorCode}`}
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                      >
                        {/* Header band */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-700 text-sm font-bold text-white">
                              {lookup.majorCode}
                            </span>
                            <div>
                              <h4 className="font-semibold leading-tight text-zinc-950">
                                {lookup.path.preferred_label}
                              </h4>
                              {trend?.majorGroup ? (
                                <p className="text-xs text-zinc-500">
                                  {trend.majorGroup}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {lookup.status === "ready" ? (
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${directionColor}`}
                            >
                              {directionIcon}{" "}
                              {trend?.direction || "ready"}
                            </span>
                          ) : (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500">
                              {lookup.status}
                            </span>
                          )}
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4">
                          {lookup.status === "loading" ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-cyan-600" />
                              Checking employment trend data&hellip;
                            </div>
                          ) : lookup.status === "error" ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                              <p>{lookup.error}</p>
                              {lookup.suggestions?.length ? (
                                <p className="mt-1 text-xs">
                                  Try:{" "}
                                  {lookup.suggestions.join(", ")}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* KPI row */}
                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 py-3 text-center">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                    Latest employment
                                  </p>
                                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                                    {formatTrendValue(trend?.latest?.value)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-zinc-500">
                                    {trend?.latest?.year ?? "-"} &middot;{" "}
                                    {trend?.unit ?? "employment"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 py-3 text-center">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                    Year-over-year
                                  </p>
                                  <p
                                    className={`mt-1 text-2xl font-bold ${
                                      typeof latestPct === "number"
                                        ? latestPct > 0
                                          ? "text-emerald-600"
                                          : latestPct < 0
                                            ? "text-red-600"
                                            : "text-zinc-700"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    {formatTrendPercent(latestPct)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-zinc-500">
                                    {formatTrendDelta(
                                      trend?.latestChange?.absolute,
                                    )}{" "}
                                    vs. previous year
                                  </p>
                                </div>
                                <div className="rounded-lg border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-4 py-3 text-center">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                    Full-period change
                                  </p>
                                  <p
                                    className={`mt-1 text-2xl font-bold ${
                                      typeof periodPct === "number"
                                        ? periodPct > 0
                                          ? "text-emerald-600"
                                          : periodPct < 0
                                            ? "text-red-600"
                                            : "text-zinc-700"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    {formatTrendPercent(periodPct)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-zinc-500">
                                    {points[0]?.year ?? "-"} &ndash;{" "}
                                    {trend?.latest?.year ?? "-"}
                                  </p>
                                </div>
                              </div>

                              {/* Sparkline bar chart */}
                              {points.length > 1 ? (
                                <div>
                                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                    Employment trend ({points[0].year}&ndash;
                                    {points[points.length - 1].year})
                                  </p>
                                  <div className="flex items-end gap-[3px]" style={{ height: 64 }}>
                                    {points.map((point, pointIndex) => {
                                      const height = Math.max(
                                        (point.value / maxVal) * 100,
                                        2,
                                      );
                                      const isLatest =
                                        pointIndex === points.length - 1;
                                      return (
                                        <div
                                          key={point.year}
                                          className="group relative flex-1"
                                          style={{ height: "100%" }}
                                        >
                                          <div
                                            className={`absolute bottom-0 w-full rounded-t transition-colors ${
                                              isLatest
                                                ? "bg-cyan-500"
                                                : "bg-cyan-200 group-hover:bg-cyan-400"
                                            }`}
                                            style={{
                                              height: `${height}%`,
                                            }}
                                          />
                                          <div className="pointer-events-none absolute -top-5 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                                            {point.year}:{" "}
                                            {formatTrendValue(point.value)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
                                    <span>{points[0].year}</span>
                                    <span>
                                      {points[points.length - 1].year}
                                    </span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </details>

          <details className="rounded-md border border-zinc-300 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-950">
              Step 3: Education level analysis by ISCO major code
            </summary>
            {!trendLocation ? (
              <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                No location is available for the education lookup.
              </div>
            ) : eduTrendJobs.length === 0 ? (
              <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                No ISCO-08 major codes are available from the Step 1 matches.
              </div>
            ) : (
              <div className="grid gap-3 border-t border-zinc-200 px-4 py-4">
                <div className="rounded border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-950">
                  Location: {trendLocation} - Sex: {trendSex} - Education
                  breakdown for {eduTrendJobs.length} ISCO-08 major
                  code{eduTrendJobs.length === 1 ? "" : "s"} from Step 1
                </div>
                <div className="grid gap-3">
                  {eduTrendLookups.map((lookup, index) => {
                    const edu = lookup.data;

                    return (
                      <article
                        key={`edu-${lookup.majorCode}`}
                        className="rounded-md border border-zinc-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                              Match {index + 1} - ISCO-08 major code{" "}
                              {lookup.majorCode}
                            </p>
                            <h4 className="mt-1 font-semibold text-zinc-950">
                              {lookup.matchLabel}
                            </h4>
                            {edu?.majorGroup ? (
                              <p className="mt-1 text-sm text-zinc-600">
                                {edu.majorGroup}
                              </p>
                            ) : null}
                          </div>
                          <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
                            {lookup.status === "ready"
                              ? `${edu?.latestYear ?? "-"} data`
                              : lookup.status}
                          </span>
                        </div>

                        {lookup.status === "loading" ? (
                          <p className="mt-3 text-sm text-zinc-500">
                            Loading education level data.
                          </p>
                        ) : lookup.status === "error" ? (
                          <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                            <p>{lookup.error}</p>
                            {lookup.suggestions?.length ? (
                              <p className="mt-1">
                                Possible locations:{" "}
                                {lookup.suggestions.join(", ")}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-3 space-y-4">
                            {/* Distribution bar */}
                            {edu?.distribution && edu.distribution.length > 0 ? (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                                  Education distribution ({edu.latestYear})
                                </p>
                                <div className="flex h-6 w-full overflow-hidden rounded">
                                  {edu.distribution.map((d) => {
                                    const colors: Record<string, string> = {
                                      "Less than basic": "bg-red-300",
                                      Basic: "bg-amber-300",
                                      Intermediate: "bg-cyan-400",
                                      Advanced: "bg-emerald-400",
                                    };
                                    return d.percent > 0 ? (
                                      <div
                                        key={d.level}
                                        className={`${colors[d.level] ?? "bg-zinc-300"} flex items-center justify-center text-[10px] font-semibold text-zinc-900`}
                                        style={{ width: `${d.percent}%` }}
                                        title={`${d.level}: ${d.percent.toFixed(1)}%`}
                                      >
                                        {d.percent >= 8
                                          ? `${d.percent.toFixed(0)}%`
                                          : ""}
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                                  {edu.distribution.map((d) => {
                                    const dots: Record<string, string> = {
                                      "Less than basic": "bg-red-300",
                                      Basic: "bg-amber-300",
                                      Intermediate: "bg-cyan-400",
                                      Advanced: "bg-emerald-400",
                                    };
                                    return (
                                      <span
                                        key={d.level}
                                        className="flex items-center gap-1"
                                      >
                                        <span
                                          className={`inline-block h-2 w-2 rounded-full ${dots[d.level] ?? "bg-zinc-300"}`}
                                        />
                                        {d.level}:{" "}
                                        {formatTrendValue(d.value)}{" "}
                                        ({d.percent.toFixed(1)}%)
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}

                            {/* Per-level trend cards */}
                            {edu?.levels && edu.levels.length > 0 ? (
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                {edu.levels.map((level) => (
                                  <div
                                    key={level.level}
                                    className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                                      {level.level}
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-cyan-800">
                                      {formatTrendValue(
                                        level.latest?.value,
                                      )}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                      {level.latest?.year ?? "-"} -{" "}
                                      {edu.unit ?? "thousands"}
                                    </p>
                                    <div className="mt-2 space-y-0.5 text-xs text-zinc-600">
                                      <p>
                                        vs prev year:{" "}
                                        {formatTrendPercent(
                                          level.latestChange?.percent,
                                        )}
                                      </p>
                                      <p>
                                        Full period:{" "}
                                        {formatTrendPercent(
                                          level.periodChange?.percent,
                                        )}
                                        {level.points.length >= 2
                                          ? ` (${level.points[0].year}-${level.points[level.points.length - 1].year})`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </details>

          <details className="rounded-md border border-zinc-300 bg-white shadow-sm">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-950">
              Step 4: final considerations
            </summary>
            <div className="grid gap-3 border-t border-zinc-200 px-4 py-4">
              <div className="rounded border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm leading-6 text-cyan-950">
                The Conversational Skill Discovery Engine sends the accepted
                user profile, Step 1 local matches, Step 2 & 3 ISCO trend data
                to an LLM for a realism check. The reviewer is prompted to
                consider LMIC constraints such as connectivity, transport,
                informal hiring, training access, startup costs, credentials,
                and thin local data.
              </div>

              {finalConsiderationsStatus === "loading" ? (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
                  Asking the LLM to review opportunity realism.
                </div>
              ) : finalConsiderationsStatus === "error" ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  {finalConsiderationsError}
                </div>
              ) : finalConsiderations ? (
                <div className="grid gap-3">
                  <article className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Overall realism check
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      {finalConsiderations.overallAssessment}
                    </p>
                  </article>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <article className="rounded-md border border-zinc-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        LMIC cautions
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
                        {finalConsiderations.lmicsCautions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                    <article className="rounded-md border border-zinc-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Data gaps to verify
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
                        {finalConsiderations.dataGaps.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  </div>

                  <div className="grid gap-3">
                    {finalConsiderations.reviews.map((review) => (
                      <article
                        key={review.opportunityId}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                              Opportunity realism
                            </p>
                            <h4 className="mt-1 font-semibold text-zinc-950">
                              {review.title}
                            </h4>
                          </div>
                          <span className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold capitalize text-cyan-900">
                            {formatRealismLevel(review.realismLevel)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-700">
                          {review.summary}
                        </p>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900">
                              Supporting signals
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950">
                              {review.supportingSignals.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
                              Risks and location challenges
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-950">
                              {[...review.risks, ...review.locationChallenges].map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Next checks
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
                            {review.nextChecks.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
                  Final considerations will run after the opportunity matches
                  and trend analysis are ready.
                </div>
              )}
            </div>
          </details>
        </section>
      </details>

      <OpportunityDashboard
        identifiedSkills={acceptedSkills}
        localMatches={localMatches}
        selectedOpportunityConfig={selectedOpportunityConfig}
        surveyData={surveyData}
        topJobs={topJobs}
      />
    </section>
  );
}
