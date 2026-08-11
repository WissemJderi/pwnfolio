import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbBookmark, TbBookmarkOff, TbBooks } from "react-icons/tb";
import { api } from "../api/client";
import type { Writeup } from "../api/types";
import { CATEGORY_BADGE, CATEGORY_LABELS, fmtDate } from "../lib/format";
import { RowSkeleton } from "../components/Skeleton";
import { UserHover } from "../components/UserHoverCard";

export const SavedWriteupsPage = () => {
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setWriteups(await api<Writeup[]>("/api/users/me/saved"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const unsave = async (w: Writeup) => {
    try {
      await api(`/api/writeups/${w._id}/save`, { method: "DELETE" });
      setWriteups((list) => list.filter((item) => item._id !== w._id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TbBookmark size={22} className="text-gold-400" /> /me/saved
          <span className="text-xs font-normal text-ink-500">
            ({writeups.length})
          </span>
        </h1>
        <Link to="/" className="btn btn-outline text-xs">
          <TbBooks size={15} /> browse the index
        </Link>
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
          // nothing saved yet — press{" "}
          <span className="text-gold-400">save</span> on writeups you want to
          revisit.{" "}
          <Link to="/" className="text-neon-400 hover:underline">
            browse the index
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {writeups.map((w) => {
            const author = typeof w.author === "string" ? null : w.author;
            return (
              <li
                key={w._id}
                className="panel flex flex-wrap items-center gap-4 py-4 pl-4 pr-2"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/writeups/${w._id}`}
                    className="truncate font-mono text-sm font-medium text-ink-100 hover:text-neon-400"
                  >
                    {w.title}
                  </Link>
                  <p className="muted mt-1 flex flex-wrap items-center gap-2">
                    <span className={`badge ${CATEGORY_BADGE[w.category]}`}>
                      {CATEGORY_LABELS[w.category]}
                    </span>
                    {author ? (
                      <UserHover username={author.username}>
                        <Link
                          to={`/users/${author.username}`}
                          className="hover:text-neon-300"
                        >
                          @{author.username}
                        </Link>
                      </UserHover>
                    ) : (
                      "unknown author"
                    )}
                    <span>·</span>
                    <span>saved from the feed · {fmtDate(w.createdAt)}</span>
                  </p>
                </div>
                <button
                  className="btn btn-danger text-xs"
                  title="Remove from saved"
                  onClick={() => void unsave(w)}
                >
                  <TbBookmarkOff size={14} /> remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};