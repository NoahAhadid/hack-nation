"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type SkillMatch = {
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

type SearchResponse = {
  error?: string;
  results?: SkillMatch[];
};

type SkillLabelMatch = {
  id: number;
  concept_uri: string;
  preferred_label: string;
  alt_labels: string[] | null;
  hidden_labels: string[] | null;
  skill_type: string | null;
  reuse_level: string | null;
  description: string | null;
  definition: string | null;
  matched_field: string;
  matched_label: string;
};

type OccupationMatch = {
  occupation_uri: string;
  preferred_label: string;
  code: string | null;
  isco_group: string | null;
  nace_code: string[] | null;
  alt_labels: string[] | null;
  regulated_profession_note: string | null;
  definition: string | null;
  description: string | null;
  relation_types: string[] | null;
  matched_skill_labels: string[] | null;
  relation_skill_types: string[] | null;
  relation_rank: number;
};

type SkillSuggestion = {
  concept_uri: string;
  preferred_label: string;
  matched_label: string;
  score: number;
};

type OccupationResponse = {
  error?: string;
  skillMatches?: SkillLabelMatch[];
  suggestions?: SkillSuggestion[];
  occupations?: OccupationMatch[];
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
  source?: {
    indicator: string;
    source: string;
    note: string;
    file: string;
  };
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

const initialQuery = "coordinate a team and communicate with customers";
const iscoMajorOptions = [
  ["0", "0 - Armed forces occupations"],
  ["1", "1 - Managers"],
  ["2", "2 - Professionals"],
  ["3", "3 - Technicians and associate professionals"],
  ["4", "4 - Clerical support workers"],
  ["5", "5 - Service and sales workers"],
  ["6", "6 - Skilled agricultural, forestry and fishery workers"],
  ["7", "7 - Craft and related trades workers"],
  ["8", "8 - Plant and machine operators, and assemblers"],
  ["9", "9 - Elementary occupations"],
] as const;

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

export function ToolsClient() {
  const [query, setQuery] = useState(initialQuery);
  const [matchCount, setMatchCount] = useState(10);
  const [results, setResults] = useState<SkillMatch[]>([]);
  const [occupationSkillName, setOccupationSkillName] = useState("");
  const [skillMatches, setSkillMatches] = useState<SkillLabelMatch[]>([]);
  const [occupationSuggestions, setOccupationSuggestions] = useState<
    SkillSuggestion[]
  >([]);
  const [occupations, setOccupations] = useState<OccupationMatch[]>([]);
  const [iscoLocation, setIscoLocation] = useState("Ghana");
  const [iscoSex, setIscoSex] = useState("Total");
  const [iscoMajorCode, setIscoMajorCode] = useState("5");
  const [iscoTrend, setIscoTrend] = useState<IscoTrendResponse | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFindingOccupations, setIsFindingOccupations] = useState(false);
  const [isLoadingIscoTrend, setIsLoadingIscoTrend] = useState(false);

  const highestSimilarity = useMemo(() => {
    return results.length > 0 ? results[0].similarity : null;
  }, [results]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSearching(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, matchCount }),
      });
      const payload = (await response.json()) as SearchResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Search failed.");
      }

      setResults(payload.results ?? []);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Search failed.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function findOccupations(skillName = occupationSkillName) {
    const trimmedSkillName = skillName.trim();
    setError("");
    setOccupationSkillName(trimmedSkillName);
    setIsFindingOccupations(true);

    try {
      const response = await fetch("/api/occupations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName: trimmedSkillName,
          maxSuggestions: 8,
        }),
      });
      const payload = (await response.json()) as OccupationResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Occupation lookup failed.");
      }

      setSkillMatches(payload.skillMatches ?? []);
      setOccupationSuggestions(payload.suggestions ?? []);
      setOccupations(payload.occupations ?? []);
    } catch (occupationError) {
      setSkillMatches([]);
      setOccupationSuggestions([]);
      setOccupations([]);
      setError(
        occupationError instanceof Error
          ? occupationError.message
          : "Occupation lookup failed.",
      );
    } finally {
      setIsFindingOccupations(false);
    }
  }

  function handleOccupationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void findOccupations();
  }

  async function findIscoTrend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setIsLoadingIscoTrend(true);

    try {
      const response = await fetch("/api/isco-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: iscoLocation,
          sex: iscoSex,
          majorCode: iscoMajorCode,
        }),
      });
      const payload = (await response.json()) as IscoTrendResponse;

      if (!response.ok || payload.error) {
        const suggestions = payload.suggestions?.length
          ? ` Try: ${payload.suggestions.join(", ")}.`
          : "";

        throw new Error(
          `${payload.error || "ISCO trend lookup failed."}${suggestions}`,
        );
      }

      setIscoTrend(payload);
    } catch (trendError) {
      setIscoTrend(null);
      setError(
        trendError instanceof Error
          ? trendError.message
          : "ISCO trend lookup failed.",
      );
    } finally {
      setIsLoadingIscoTrend(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-stone-950">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="border-b border-stone-300 pb-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              ESCO Tools
            </p>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
              ESCO search and occupation tools.
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-stone-600">
              Use these utilities to inspect semantic ESCO skill matches and
              lookup occupations, skills, and ISCO labor-market trends.
            </p>
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-stone-300 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-base font-semibold text-stone-950">
                ESCO semantic search
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Similarity means semantic closeness to ESCO skill text.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-3 border-b border-stone-200 p-3 lg:grid-cols-[minmax(0,1fr)_8rem_auto] lg:items-end"
            >
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-stone-700">
                  Query
                </span>
                <textarea
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-h-20 resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-base leading-6 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-stone-700">
                  Top rows
                </span>
                <input
                  value={matchCount}
                  onChange={(event) => setMatchCount(Number(event.target.value))}
                  min={1}
                  max={50}
                  type="number"
                  className="h-11 rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </label>

              <Button
                type="submit"
                className="h-11 rounded-md bg-stone-950 px-5 text-white hover:bg-teal-800"
                disabled={isSearching}
              >
                {isSearching ? "Searching" : "Search"}
              </Button>
            </form>

            <div className="border-b border-stone-200 px-4 py-3">
              <p className="text-sm font-medium text-stone-700">
                Best score:{" "}
                <span className="text-teal-800">
                  {highestSimilarity === null
                    ? "--"
                    : `${Math.round(highestSimilarity * 100)}%`}
                </span>
              </p>
            </div>

            {results.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-stone-500">
                No search results yet.
              </div>
            ) : (
              <ol className="divide-y divide-stone-200">
                {results.map((result) => (
                  <li key={result.id} className="grid gap-3 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-stone-950">
                          {result.preferred_label}
                        </h3>
                        <p className="break-all text-xs text-stone-500">
                          {result.concept_uri}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-teal-800">
                          {Math.round(result.similarity * 100)}%
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2 h-9 rounded-md border-stone-300 px-3 text-xs"
                          disabled={isFindingOccupations}
                          onClick={() =>
                            void findOccupations(result.preferred_label)
                          }
                        >
                          Occupations
                        </Button>
                      </div>
                    </div>

                    {result.definition || result.description ? (
                      <p className="text-sm leading-6 text-stone-700">
                        {result.definition || result.description}
                      </p>
                    ) : null}

                    {result.alt_labels?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {result.alt_labels.slice(0, 6).map((label) => (
                          <span
                            key={label}
                            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-950"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-md border border-stone-300 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-base font-semibold text-stone-950">
                Occupation lookup
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Fit is ESCO relation type: essential or optional.
              </p>
            </div>

            <form
              onSubmit={handleOccupationSubmit}
              className="grid gap-3 border-b border-stone-200 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
            >
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-stone-700">
                  Exact skill
                </span>
                <input
                  value={occupationSkillName}
                  onChange={(event) =>
                    setOccupationSkillName(event.target.value)
                  }
                  placeholder="use climbing equipment"
                  className="h-11 rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </label>

              <Button
                type="submit"
                className="h-11 rounded-md bg-teal-800 px-5 text-white hover:bg-stone-950"
                disabled={isFindingOccupations}
              >
                {isFindingOccupations ? "Finding" : "Find occupations"}
              </Button>
            </form>

            {occupationSuggestions.length > 0 ? (
              <div className="space-y-3 border-b border-stone-200 px-4 py-4">
                <p className="text-sm font-medium text-stone-700">
                  No exact skill was found. Similar skills:
                </p>
                <div className="flex flex-wrap gap-2">
                  {occupationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.concept_uri}
                      type="button"
                      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm font-medium text-amber-950 transition hover:border-teal-700"
                      onClick={() =>
                        void findOccupations(suggestion.preferred_label)
                      }
                    >
                      {suggestion.preferred_label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {skillMatches.length > 0 ? (
              <div className="border-b border-stone-200 px-4 py-3">
                <p className="text-sm font-medium text-stone-700">
                  Matched skill entries
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skillMatches.map((skill) => (
                    <span
                      key={skill.concept_uri}
                      className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-950"
                    >
                      {skill.preferred_label} via {skill.matched_field}:{" "}
                      {skill.matched_label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {occupations.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-stone-500">
                No occupation lookup results yet.
              </div>
            ) : (
              <ol className="divide-y divide-stone-200">
                {occupations.map((occupation, index) => (
                  <li key={occupation.occupation_uri} className="px-4 py-4">
                    <div className="grid gap-3 md:grid-cols-[2rem_minmax(0,1fr)_10rem]">
                      <p className="text-lg font-semibold text-teal-800">
                        {index + 1}
                      </p>
                      <div className="min-w-0 space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-stone-950">
                            {occupation.preferred_label}
                          </h3>
                          <p className="break-all text-xs text-stone-500">
                            {occupation.occupation_uri}
                          </p>
                        </div>

                        {occupation.definition || occupation.description ? (
                          <p className="text-sm leading-6 text-stone-700">
                            {occupation.definition || occupation.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm text-stone-600">
                        <p>
                          <span className="font-medium text-stone-800">
                            Fit:
                          </span>{" "}
                          {occupation.relation_types?.join(", ") || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-stone-800">
                            Code:
                          </span>{" "}
                          {occupation.code || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-stone-800">
                            ISCO:
                          </span>{" "}
                          {occupation.isco_group || "-"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="rounded-md border border-stone-300 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-4 py-3">
            <h2 className="text-base font-semibold text-stone-950">
              ISCO employment trend
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Uses the cleaned ILO occupation CSV. The trend is filtered to age
              group 15+ and shown in thousands of employed people.
            </p>
          </div>

          <form
            onSubmit={findIscoTrend}
            className="grid gap-3 border-b border-stone-200 p-3 lg:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1.4fr)_auto] lg:items-end"
          >
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">
                Location
              </span>
              <input
                value={iscoLocation}
                onChange={(event) => setIscoLocation(event.target.value)}
                placeholder="Ghana"
                className="h-11 rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">Sex</span>
              <select
                value={iscoSex}
                onChange={(event) => setIscoSex(event.target.value)}
                className="h-11 rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
              >
                <option value="Total">Total</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">
                ISCO-08 major code
              </span>
              <select
                value={iscoMajorCode}
                onChange={(event) => setIscoMajorCode(event.target.value)}
                className="h-11 rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
              >
                {iscoMajorOptions.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="submit"
              className="h-11 rounded-md bg-stone-950 px-5 text-white hover:bg-teal-800"
              disabled={isLoadingIscoTrend}
            >
              {isLoadingIscoTrend ? "Loading" : "Show trend"}
            </Button>
          </form>

          {!iscoTrend ? (
            <div className="px-4 py-10 text-center text-sm text-stone-500">
              Enter a location, sex, and ISCO major group to see the trend.
            </div>
          ) : (
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Latest
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-teal-800">
                      {formatTrendValue(iscoTrend.latest?.value)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {iscoTrend.latest?.year} · {iscoTrend.unit}
                    </p>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Latest change
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-teal-800">
                      {formatTrendPercent(iscoTrend.latestChange?.percent)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatTrendDelta(iscoTrend.latestChange?.absolute)} vs.
                      previous year
                    </p>
                  </div>
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Direction
                    </p>
                    <p className="mt-2 text-2xl font-semibold capitalize text-teal-800">
                      {iscoTrend.direction}
                    </p>
                    <p className="text-xs text-stone-500">
                      {iscoTrend.points?.[0]?.year}-{iscoTrend.latest?.year}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-stone-200">
                  <div className="border-b border-stone-200 px-3 py-2">
                    <h3 className="text-sm font-semibold text-stone-950">
                      {iscoTrend.majorGroup}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      {iscoTrend.location} · {iscoTrend.sex} ·{" "}
                      {iscoTrend.ageGroup}
                    </p>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-stone-950 text-xs uppercase tracking-[0.12em] text-white">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Year</th>
                          <th className="px-3 py-2 font-semibold">Value</th>
                          <th className="px-3 py-2 font-semibold">Bar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {(iscoTrend.points ?? []).map((point) => {
                          const maxValue = Math.max(
                            ...(iscoTrend.points ?? []).map((item) => item.value),
                          );
                          const width =
                            maxValue > 0
                              ? Math.max((point.value / maxValue) * 100, 3)
                              : 0;

                          return (
                            <tr key={point.year}>
                              <td className="px-3 py-2 font-medium text-stone-950">
                                {point.year}
                              </td>
                              <td className="px-3 py-2 text-stone-700">
                                {formatTrendValue(point.value)}
                              </td>
                              <td className="px-3 py-2">
                                <div className="h-2 rounded-full bg-stone-200">
                                  <div
                                    className="h-full rounded-full bg-teal-700"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <aside className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Source
                </p>
                <p className="mt-2 font-semibold text-stone-950">
                  {iscoTrend.source?.source || "ILO occupation CSV"}
                </p>
                <p className="mt-2 leading-6">{iscoTrend.source?.indicator}</p>
                <p className="mt-2 break-words text-xs leading-5 text-stone-500">
                  {iscoTrend.source?.note}
                </p>
                {iscoTrend.periodChange ? (
                  <div className="mt-3 border-t border-stone-200 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Full-period change
                    </p>
                    <p className="mt-2 text-lg font-semibold text-teal-800">
                      {formatTrendPercent(iscoTrend.periodChange.percent)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatTrendDelta(iscoTrend.periodChange.absolute)} over
                      available history
                    </p>
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
