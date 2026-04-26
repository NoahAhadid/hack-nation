import Link from "next/link";
import {
  BriefcaseBusiness,
  Settings2,
  TrendingUp,
} from "lucide-react";

const tiles = [
  {
    href: "/skillroute",
    label: "SkillRoute",
    description:
      "Identify skills from unstructured profiles and match them to ESCO occupations and opportunities.",
    icon: BriefcaseBusiness,
    color: "bg-[#d9e7d3]",
    border: "ring-green-800/20",
  },
  {
    href: "/admin",
    label: "Manage Dataplane",
    description:
      "Admin setup — configure protocols, manage data sources and system settings.",
    icon: Settings2,
    color: "bg-[#dcedf2]",
    border: "ring-sky-800/20",
  },
  {
    href: "/econometric",
    label: "Econometric Dashboard",
    description:
      "Explore labor market analytics, employment trends and aggregated skill intelligence.",
    icon: TrendingUp,
    color: "bg-[#f2e2d9]",
    border: "ring-orange-800/20",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          Welcome to SkillRoute
        </h1>
        <p className="mt-3 text-base text-stone-600">
          Unmapped Skill Engine — choose a workspace to get started.
        </p>
      </div>

      <div className="mx-auto mt-12 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`group flex flex-col items-center gap-4 rounded-xl ${tile.color} p-8 ring-1 ${tile.border} transition hover:scale-[1.03] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700/40`}
            >
              <span className="flex size-14 items-center justify-center rounded-lg bg-white/60 shadow-sm ring-1 ring-black/5">
                <Icon className="size-7 text-stone-800" />
              </span>
              <span className="text-lg font-semibold text-stone-950">
                {tile.label}
              </span>
              <span className="text-center text-sm leading-relaxed text-stone-600">
                {tile.description}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
