"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Briefcase,
  Loader2,
  Target,
} from "lucide-react";

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

export default function EconometricDashboard() {
  const [data, setData] = useState<EconometricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/econometric-data");
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to load data");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-zinc-950">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="border-b border-zinc-300 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                User Analytics
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
                Econometric Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                Analyze aggregated skills and opportunities across all SkillRoute users
                to identify trends and patterns.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-cyan-700" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        {data && !loading && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-cyan-100">
                    <Users className="size-5 text-cyan-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Total Users
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {data.stats.total_users}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-cyan-100">
                    <Award className="size-5 text-cyan-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Skills Identified
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {data.stats.total_skills_identified}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-cyan-100">
                    <Briefcase className="size-5 text-cyan-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Opportunities
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {data.stats.total_opportunities_matched}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-cyan-100">
                    <BarChart3 className="size-5 text-cyan-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Avg Skills/User
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {data.stats.avg_skills_per_user.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-cyan-100">
                    <Target className="size-5 text-cyan-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Avg Opps/User
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {data.stats.avg_opportunities_per_user.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-cyan-100">
                    <Users className="size-5 text-cyan-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Profiles Created
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-950">
                      {data.stats.total_profiles}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Top Skills */}
            {data.top_skills.length > 0 && (
              <section className="rounded-md border border-zinc-300 bg-white shadow-sm">
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Award className="size-5 text-cyan-700" />
                    <h3 className="text-xl font-semibold text-zinc-950">
                      Most Occurring Skills Across All Users
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    Top {data.top_skills.length} skills identified in user profiles
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Skill
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Users
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_skills.map((skill, index) => {
                        const totalConfidence =
                          skill.confidence_breakdown.strong +
                          skill.confidence_breakdown.medium +
                          skill.confidence_breakdown.needs_review;
                        const strongPercent =
                          totalConfidence > 0
                            ? (skill.confidence_breakdown.strong / totalConfidence) * 100
                            : 0;
                        return (
                          <tr
                            key={skill.concept_uri}
                            className="border-b border-zinc-100 transition hover:bg-zinc-50"
                          >
                            <td className="px-4 py-3 text-center text-sm font-semibold text-zinc-950">
                              #{index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-zinc-950">
                                  {skill.preferred_label}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-zinc-500">
                                  {skill.concept_uri.split("/").pop()}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-cyan-700">
                              {skill.user_count}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex gap-1">
                                  <div
                                    className="h-6 w-2 rounded-sm bg-green-600"
                                    style={{
                                      opacity:
                                        skill.confidence_breakdown.strong > 0
                                          ? 1
                                          : 0.1,
                                    }}
                                    title={`Strong: ${skill.confidence_breakdown.strong}`}
                                  />
                                  <div
                                    className="h-6 w-2 rounded-sm bg-yellow-600"
                                    style={{
                                      opacity:
                                        skill.confidence_breakdown.medium > 0
                                          ? 1
                                          : 0.1,
                                    }}
                                    title={`Medium: ${skill.confidence_breakdown.medium}`}
                                  />
                                  <div
                                    className="h-6 w-2 rounded-sm bg-orange-600"
                                    style={{
                                      opacity:
                                        skill.confidence_breakdown.needs_review > 0
                                          ? 1
                                          : 0.1,
                                    }}
                                    title={`Needs Review: ${skill.confidence_breakdown.needs_review}`}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-zinc-600">
                                  {strongPercent.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Top Opportunities */}
            {data.top_opportunities.length > 0 && (
              <section className="rounded-md border border-zinc-300 bg-white shadow-sm">
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-5 text-cyan-700" />
                    <h3 className="text-xl font-semibold text-zinc-950">
                      Most Recommended Opportunities
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    Top {data.top_opportunities.length} job opportunities matched to users
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Opportunity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Sector
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          ISCO
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Users
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
                          Avg Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_opportunities.map((opp, index) => (
                        <tr
                          key={opp.opportunity_id}
                          className="border-b border-zinc-100 transition hover:bg-zinc-50"
                        >
                          <td className="px-4 py-3 text-center text-sm font-semibold text-zinc-950">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-zinc-950">
                              {opp.title}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-600">
                            {opp.sector}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex rounded-md bg-cyan-100 px-2 py-1 font-mono text-xs font-semibold text-cyan-800">
                              {opp.isco_group}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-cyan-700">
                            {opp.user_count}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-6 w-16 rounded-md bg-zinc-100">
                                <div
                                  className="h-full rounded-md bg-cyan-600"
                                  style={{
                                    width: `${opp.avg_match_score}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-zinc-950">
                                {opp.avg_match_score.toFixed(0)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Empty State */}
            {data.top_skills.length === 0 && data.top_opportunities.length === 0 && (
              <div className="rounded-md border border-zinc-300 bg-white p-12 text-center">
                <TrendingUp className="mx-auto size-12 text-zinc-400" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-950">
                  No Data Yet
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  User data will appear here once profiles are created and
                  opportunities are matched.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
