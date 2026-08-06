import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, TriangleAlert } from "lucide-react";
import { api } from "../api/client";
import type { Category, Difficulty, WriteupListResponse } from "../api/types";
import { CATEGORY_LABELS } from "../lib/format";
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
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (appliedSearch) params.set("search", appliedSearch);
    params.set("page", String(page));

    setLoading(true);
    api<WriteupListResponse>(`/api/writeups?${params.toString()}`)
      .then((res) => {
        setWriteups(res.writeups);
        setPagination(res.pagination);
      })
      .catch(() => setWriteups([]))
      .finally(() => setLoading(false));
  }, [page, category, difficulty, appliedSearch]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
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
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TriangleAlert size={20} className="text-blood-400" /> /writeups
          <span className="cursor" />
        </h1>
        <p className="muted hidden sm:block">
          {pagination ? `${pagination.total}` : "…"} result
          {pagination && pagination.total !== 1 ? "s" : ""} · sorted by recency
        </p>
      </div>

      <section className="panel grid-bg overflow-hidden p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="font-mono text-sm font-bold text-neon-400">
            invariant❯
          </span>
          <form onSubmit={applySearch} className="flex flex-1 gap-2">
            <input
              className="input"
              placeholder="search index… (title / sections)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary shrink-0">
              <Search size={14} /> run
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="muted">category:</span>
          {CATEGORIES.map((c) => filterBtn(c, CATEGORY_LABELS[c], category, setCategory))}
          <span className="muted ml-1">difficulty:</span>
          {DIFFICULTIES.map((d) => filterBtn(d, d, difficulty, setDifficulty))}
        </div>
        <p className="mt-4 hidden font-mono text-[10px] text-ink-500/70 md:block">
          $ index --format=pwnfolio --tail --follow
        </p>
      </section>

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
              <WriteupCard writeup={w} />
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
            <ChevronLeft size={15} /> prev
          </button>
          <span className="text-sm text-ink-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
