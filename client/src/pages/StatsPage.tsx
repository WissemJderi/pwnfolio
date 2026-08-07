import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  TbChartBar,
  TbBookmark,
  TbEye,
  TbHeart,
  TbMessageCircle,
  TbWriting,
} from "react-icons/tb";
import { api } from "../api/client";
import type { Category, Difficulty, UserStats } from "../api/types";
import { Skeleton, SectionSkeleton } from "../components/Skeleton";

const CATEGORY_HEX: Record<Category, string> = {
  web: "#38bdf8",
  pwn: "#ff5470",
  crypto: "#ffd166",
  forensics: "#9d8cff",
  osint: "#9fef00",
  misc: "#7e8494",
};

const DIFFICULTY_HEX: Record<Difficulty, string> = {
  easy: "#9fef00",
  medium: "#ffd166",
  hard: "#fb923c",
  insane: "#ff5470",
};

const monthLabel = (key: string): string => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
};

const tickProps = {
  fill: "var(--pf-ink-500)",
  fontSize: 11,
  fontFamily: "JetBrains Mono, monospace",
};

interface ChartTipPayload {
  name?: string;
  value?: number;
}

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const value = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-sm border border-line-700 bg-core-800/95 px-2.5 py-1.5 font-mono text-xs shadow-lg">
      {label != null && <p className="mb-0.5 text-ink-500">{label}</p>}
      <p className="text-neon-400">
        {value.toLocaleString()} writeup{value === 1 ? "" : "s"}
      </p>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) => (
  <div className="panel flex items-center gap-3 p-4">
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${color}`}
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="font-mono text-xl font-bold leading-none">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-500">
        {label}
      </p>
    </div>
  </div>
);

const Empty = () => (
  <div className="flex h-40 items-center justify-center font-mono text-sm text-ink-500">
    // no data
  </div>
);

const DifficultyLegend = ({
  rows,
}: {
  rows: { name: string; count: number }[];
}) => {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {rows.map((r) => (
        <li
          key={r.name}
          className="flex items-center gap-1.5 font-mono text-[11px] text-ink-300"
        >
          <span
            className="inline-block h-2 w-2 rounded-[1px]"
            style={{ background: DIFFICULTY_HEX[r.name as Difficulty] ?? "#7e8494" }}
          />
          {r.name}
          <span className="text-ink-500">
            {total ? Math.round((r.count / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
};

export const StatsPage = () => {
  const { username } = useParams<{ username: string }>();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setStats(null);
    setError(null);
    api<UserStats>(`/api/users/${encodeURIComponent(username)}/stats`)
      .then(setStats)
      .catch((err) => setError((err as Error).message));
  }, [username]);

  if (!stats && !error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Skeleton className="mb-3 h-4 w-52" />
        <Skeleton className="mb-6 h-7 w-64" />
<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="panel p-4">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="mt-3 h-5 w-14" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
        <SectionSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="muted mb-4 truncate">
          $ cat ~/stats/<span className="text-neon-500">{username ?? "…"}</span>
          <span className="cursor" />
        </p>
        <p className="py-20 text-center font-mono text-ink-500">
          $ cat ~/stats/{username} → {error}
        </p>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "writeups",
      value: stats.totals.writeups,
      icon: <TbWriting size={19} className="text-neon-400" />,
      color: "border-neon-500/40 bg-neon-500/10",
    },
    {
      label: "likes",
      value: stats.totals.likes,
      icon: <TbHeart size={19} className="text-blood-400" />,
      color: "border-blood-400/40 bg-blood-400/10",
    },
    {
      label: "comments",
      value: stats.totals.comments,
      icon: <TbMessageCircle size={19} className="text-vio-400" />,
      color: "border-vio-400/40 bg-vio-400/10",
    },
    {
      label: "saves",
      value: stats.totals.saves,
      icon: <TbBookmark size={19} className="text-gold-400" />,
      color: "border-gold-400/40 bg-gold-400/10",
    },
    {
      label: "views",
      value: stats.totals.views,
      icon: <TbEye size={19} className="text-ink-300" />,
      color: "border-ink-400/40 bg-ink-400/10",
    },
  ];

  const totalActivity = stats.activity.reduce((s, a) => s + a.count, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="muted mb-4 truncate">
        $ cat ~/stats/<span className="text-neon-500">{stats.username}</span>
        <span className="cursor" />
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TbChartBar size={22} className="text-vio-400" /> utmp statistics
        </h1>
        <Link to={`/users/${stats.username}`} className="btn btn-outline px-2 py-1 text-xs">
          ← profile
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <section className="panel p-4">
          <h2 className="section-head">
            <span className="text-neon-500">##</span> activity — last 12 months
          </h2>
          {totalActivity === 0 ? (
            <Empty />
          ) : (
            <div className="h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.activity}
                  margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--pf-neon-400)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--pf-neon-400)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--pf-line-800)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    tick={tickProps}
                    tickLine={false}
                    axisLine={{ stroke: "var(--pf-line-800)" }}
                  />
                  <YAxis allowDecimals={false} tick={tickProps} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--pf-line-700)" }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--pf-neon-400)"
                    strokeWidth={2}
                    fill="url(#activityFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-4">
            <h2 className="section-head">
              <span className="text-neon-500">##</span> by category
            </h2>
            {stats.byCategory.length === 0 ? (
              <Empty />
            ) : (
              <div className="h-56 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.byCategory}
                    margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--pf-line-800)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={tickProps}
                      tickLine={false}
                      axisLine={{ stroke: "var(--pf-line-800)" }}
                    />
                    <YAxis allowDecimals={false} tick={tickProps} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--pf-core-700)" }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {stats.byCategory.map((b) => (
                        <Cell key={b.name} fill={CATEGORY_HEX[b.name as Category] ?? "#7e8494"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="panel p-4">
            <h2 className="section-head">
              <span className="text-neon-500">##</span> by difficulty
            </h2>
            {stats.byDifficulty.length === 0 ? (
              <Empty />
            ) : (
              <>
                <div className="h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byDifficulty}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="var(--pf-core-900)"
                      >
                        {stats.byDifficulty.map((d) => (
                          <Cell key={d.name} fill={DIFFICULTY_HEX[d.name as Difficulty] ?? "#7e8494"} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <DifficultyLegend rows={stats.byDifficulty} />
              </>
            )}
          </section>
        </div>

        <section className="panel p-4">
          <h2 className="section-head">
            <span className="text-neon-500">##</span> by platform
          </h2>
          {stats.byPlatform.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.byPlatform}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
                >
                  <CartesianGrid stroke="var(--pf-line-800)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={tickProps}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ ...tickProps, fill: "var(--pf-ink-300)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--pf-core-700)" }} />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]} fill="var(--pf-vio-400)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <p className="mt-8 flex items-center justify-between gap-3 font-mono text-xs text-ink-500">
        <span>/* stats are public */</span>
        <Link to={`/users/${stats.username}`} className="text-neon-400 hover:underline">
          ← @{stats.username}
        </Link>
      </p>
    </div>
  );
};