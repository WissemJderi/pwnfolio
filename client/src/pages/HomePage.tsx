import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Category, Difficulty, WriteupListResponse } from "../api/types";
import { CATEGORY_LABELS } from "../lib/format";
import { WriteupCard } from "../components/WriteupCard";

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
      className={`rounded-full px-3 py-1 text-xs transition-colors ${
        current === key
          ? "bg-emerald-500 text-slate-950"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Latest writeups</h1>

      <form onSubmit={applySearch} className="mt-4 flex gap-2">
        <input
          className="input max-w-md"
          placeholder="Search title or sections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Category:</span>
        {CATEGORIES.map((c) => filterBtn(c, CATEGORY_LABELS[c], category, setCategory))}
        <span className="ml-4 text-xs text-slate-500">Difficulty:</span>
        {DIFFICULTIES.map((d) => filterBtn(d, d, difficulty, setDifficulty))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-slate-400">Loading…</p>
      ) : writeups.length === 0 ? (
        <p className="py-16 text-center text-slate-500">
          No writeups found. Try clearing the filters.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {writeups.map((w) => (
            <WriteupCard key={w._id} writeup={w} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn-outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
