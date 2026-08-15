import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TbAlertTriangle,
  TbBrandGithub,
  TbChevronLeft,
  TbChevronRight,
  TbCrown,
  TbHeart,
  TbSearch,
} from "react-icons/tb";
import { api } from "../api/client";
import type {
  Category,
  Difficulty,
  FeaturedResponse,
  WriteupListResponse,
} from "../api/types";
import { CATEGORY_BADGE, CATEGORY_LABELS } from "../lib/format";
import { WriteupCard } from "../components/WriteupCard";
import { Stagger, StaggerItem } from "../components/Stagger";
import { GridSkeleton } from "../components/Skeleton";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "insane"];

export const HomePage = () => {
  const [writeups, setWriteups] = useState<WriteupListResponse["writeups"]>([]);
  const [pagination, setPagination] = useState<WriteupListResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [appliedPlatform, setAppliedPlatform] = useState("");
  const [tag, setTag] = useState("");
  const [appliedTag, setAppliedTag] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState<FeaturedResponse["writeup"]>(null);

  useEffect(() => {
    api<FeaturedResponse>("/api/writeups/featured")
      .then((res) => setFeatured(res.writeup))
      .catch(() => setFeatured(null));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (appliedSearch) params.set("search", appliedSearch);
    if (appliedPlatform) params.set("platform", appliedPlatform);
    if (appliedTag) params.set("tag", appliedTag);
    if (sort === "oldest") params.set("sort", "oldest");
    params.set("page", String(page));

    setLoading(true);
    api<WriteupListResponse>(`/api/writeups?${params.toString()}`)
      .then((res) => {
        setWriteups(res.writeups);
        setPagination(res.pagination);
      })
      .catch(() => setWriteups([]))
      .finally(() => setLoading(false));
  }, [page, category, difficulty, appliedSearch, appliedPlatform, appliedTag, sort]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
    setAppliedPlatform(platform.trim().toLowerCase());
    setAppliedTag(tag.trim().toLowerCase().replace(/^#/, ""));
  };

  const filterBtn = (
    key: string,
    label: string,
    current: string,
    set: (v: string) => void,
  ) => (
    <button
      key={key}
      onClick={() => {
        setPage(1);
        set(current === key ? "" : key);
      }}
      className={`chip ${current === key ? "chip-active" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-500">
        <span className="select-none text-ink-600">//</span>
        <span>writeups for hackers, by hackers</span>
        <span className="select-none text-ink-600">·</span>
        <a
          href="https://github.com/WissemJderi"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-ink-400 transition-colors hover:text-neon-400"
        >
          @WissemJderi
          <TbBrandGithub size={13} />
        </a>
      </p>

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TbAlertTriangle size={22} className="text-blood-400" /> /writeups
          <span className="cursor" />
        </h1>
        <p className="muted hidden sm:block">
          {pagination ? `${pagination.total}` : "…"} result
          {pagination && pagination.total !== 1 ? "s" : ""} · sorted{" "}
          {sort === "oldest" ? "oldest-first" : "newest-first"}
        </p>
      </div>

      <section className="panel grid-bg overflow-hidden p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="font-mono text-sm font-bold text-neon-400">
            invariant❯
          </span>
          <form onSubmit={applySearch} className="flex flex-1 flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="search index… (title / sections)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary shrink-0">
                <TbSearch size={15} /> run
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input sm:max-w-60"
                placeholder="platform (e.g. hackthebox, tryhackme)"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
              <input
                className="input sm:max-w-44"
                placeholder="#tag (e.g. sqli, lfi)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="muted">category:</span>
          {CATEGORIES.map((c) => filterBtn(c, CATEGORY_LABELS[c], category, setCategory))}
          <span className="muted ml-1">difficulty:</span>
          {DIFFICULTIES.map((d) => filterBtn(d, d, difficulty, setDifficulty))}
          <div className="ml-auto flex items-center gap-2">
            <span className="muted">sort:</span>
            {(["newest", "oldest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setPage(1);
                  setSort(s);
                }}
                className={`chip ${sort === s ? "chip-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 hidden font-mono text-[10px] text-ink-500/70 md:block">
          $ index --format=pwnfolio --tail --follow
        </p>
      </section>

      {featured && (
        <section className="panel mt-5 flex flex-col gap-3 border-neon-500/30 bg-gradient-to-r from-neon-500/[0.07] to-transparent p-4 sm:flex-row sm:items-center sm:gap-5">
          <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-neon-400">
            <TbCrown size={16} /> featured this week
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-mono text-base font-semibold text-ink-100">
              <Link
                to={`/writeups/${featured._id}`}
                className="hover:text-neon-400"
              >
                {featured.title}
              </Link>
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-500">
              <span className={`badge ${CATEGORY_BADGE[featured.category]}`}>
                {CATEGORY_LABELS[featured.category]}
              </span>
              {typeof featured.author !== "string" && (
                <span>@ {featured.author.username}</span>
              )}
              <span className="text-ink-500/60">·</span>
              <span className="flex items-center gap-1 text-neon-500">
                <TbHeart size={13} fill="currentColor" /> {featured.likesCount}
              </span>
            </div>
          </div>
          <Link to={`/writeups/${featured._id}`} className="btn btn-outline shrink-0 text-xs">
            read→
          </Link>
        </section>
      )}

      {loading ? (
        <GridSkeleton />
      ) : writeups.length === 0 ? (
        <p className="py-20 text-center font-mono text-ink-500">
          no matches in index — try clearing the filters
        </p>
      ) : (
        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2">
          {writeups.map((w) => (
            <StaggerItem key={w._id}>
              <WriteupCard
                writeup={w}
                onLikedChange={(id, next) =>
                  setWriteups((list) =>
                    list.map((item) =>
                      item._id === id ? { ...item, ...next } : item,
                    ),
                  )
                }
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 font-mono">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <TbChevronLeft size={16} /> prev
          </button>
          <span className="text-sm text-ink-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            next <TbChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
