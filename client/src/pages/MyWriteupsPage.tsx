import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Writeup, WriteupStatus } from "../api/types";
import { fmtDate } from "../lib/format";

type Filter = "all" | WriteupStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
];

export const MyWriteupsPage = () => {
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const query = filter === "all" ? "" : `?status=${filter}`;
      const res = await api<Writeup[]>(`/api/users/me/writeups${query}`);
      setWriteups(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const publish = async (w: Writeup) => {
    try {
      await api(`/api/writeups/${w._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "published" }),
      });
      void load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (w: Writeup) => {
    if (!window.confirm(`Delete "${w.title}" permanently?`)) return;
    try {
      await api(`/api/writeups/${w._id}`, { method: "DELETE" });
      void load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My writeups</h1>
        <Link to="/writeups/new" className="btn-primary">
          + New writeup
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              filter === key
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="py-16 text-center text-slate-400">Loading…</p>
      ) : writeups.length === 0 ? (
        <p className="py-16 text-center text-slate-500">
          Nothing here yet.{" "}
          <Link to="/writeups/new" className="text-emerald-300 hover:underline">
            Write your first writeup
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {writeups.map((w) => (
            <li key={w._id} className="card flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{w.title}</p>
                <p className="text-xs text-slate-500">
                  updated {fmtDate(w.updatedAt)}
                </p>
              </div>
              <span
                className={`badge ${
                  w.status === "draft"
                    ? "bg-yellow-500/15 text-yellow-300"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {w.status}
              </span>
              <div className="flex gap-2">
                {w.status === "published" && (
                  <Link to={`/writeups/${w._id}`} className="btn-outline">
                    View
                  </Link>
                )}
                <Link to={`/writeups/${w._id}/edit`} className="btn-outline">
                  Edit
                </Link>
                {w.status === "draft" && (
                  <button
                    className="btn-primary"
                    onClick={() => void publish(w)}
                  >
                    Publish
                  </button>
                )}
                <button className="btn-danger" onClick={() => void remove(w)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
