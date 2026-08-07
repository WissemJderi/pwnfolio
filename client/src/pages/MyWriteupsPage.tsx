import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TbEdit,
  TbEye,
  TbPlus,
  TbRocket,
  TbTrash,
  TbArticle,
} from "react-icons/tb";
import { api } from "../api/client";
import type { Writeup, WriteupStatus } from "../api/types";
import { fmtDate } from "../lib/format";
import { RowSkeleton } from "../components/Skeleton";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TbArticle size={22} className="text-vio-400" /> /me/writeups
        </h1>
        <Link to="/writeups/new" className="btn btn-primary text-xs">
          <TbPlus size={15} /> new writeup
        </Link>
      </div>

      <div className="mt-5 flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`chip ${filter === key ? "chip-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 font-mono text-sm text-blood-400">{error}</p>}

      {loading ? (
        <ul className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </ul>
      ) : writeups.length === 0 ? (
        <p className="py-20 text-center font-mono text-ink-500">
          // nothing here yet.{" "}
          <Link to="/writeups/new" className="text-neon-400 hover:underline">
            write your first writeup
          </Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {writeups.map((w) => (
            <li key={w._id} className="panel flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-medium text-ink-100">
                  {w.title}
                </p>
                <p className="muted mt-1">
                  [{w._id.slice(-4)}] · updated {fmtDate(w.updatedAt)}
                </p>
              </div>
              <span
                className={`badge ${
                  w.status === "draft"
                    ? "border-gold-400/40 bg-gold-400/10 text-gold-300"
                    : "border-neon-500/40 bg-neon-500/10 text-neon-400"
                }`}
              >
                {w.status}
              </span>
              <div className="flex flex-wrap gap-2">
                {w.status === "published" && (
                  <Link to={`/writeups/${w._id}`} className="btn btn-outline text-xs">
                    <TbEye size={14} /> view
                  </Link>
                )}
                <Link to={`/writeups/${w._id}/edit`} className="btn btn-outline text-xs">
                  <TbEdit size={14} /> edit
                </Link>
                {w.status === "draft" && (
                  <button
                    className="btn btn-primary text-xs"
                    onClick={() => void publish(w)}
                  >
                    <TbRocket size={14} /> publish
                  </button>
                )}
                <button className="btn btn-danger text-xs" onClick={() => void remove(w)}>
                  <TbTrash size={14} /> rm
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
