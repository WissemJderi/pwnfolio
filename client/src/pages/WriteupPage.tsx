import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Writeup } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Comments } from "../components/Comments";
import {
  CATEGORY_BADGE,
  CATEGORY_LABELS,
  DIFFICULTY_BADGE,
  fmtDate,
  getAuthorId,
} from "../lib/format";

const SECTIONS = [
  { key: "recon", label: "Recon" },
  { key: "approach", label: "Approach" },
  { key: "exploitChain", label: "Exploit chain" },
  { key: "takeaway", label: "Takeaway" },
] as const;

export const WriteupPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [writeup, setWriteup] = useState<Writeup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setWriteup(await api<Writeup>(`/api/writeups/${id}`));
    } catch (err) {
      if ((err as { status?: number }).status === 404) setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const setCommentCount = useCallback((count: number) => {
    setWriteup((w) => (w ? { ...w, commentCount: count } : w));
  }, []);

  if (notFound) {
    return (
      <p className="py-16 text-center text-slate-500">
        Writeup not found or still in draft.
      </p>
    );
  }
  if (!writeup) {
    return <p className="py-16 text-center text-slate-400">Loading…</p>;
  }

  const author = typeof writeup.author === "string" ? null : writeup.author;
  const isMine = !!user && getAuthorId(writeup) === user.id;
  const isDraft = writeup.status === "draft";

  const requireAuth = () => {
    if (!user) {
      navigate("/login", { state: { from: window.location.pathname } });
    }
    return !!user;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    const prev = writeup;
    const next = !writeup.isLikedByMe;
    setWriteup({
      ...writeup,
      isLikedByMe: next,
      likesCount: (writeup.likesCount ?? 0) + (next ? 1 : -1),
    });
    setActionError(null);
    try {
      await api(`/api/writeups/${writeup._id}/like`, {
        method: next ? "POST" : "DELETE",
      });
    } catch (err) {
      setWriteup(prev);
      setActionError((err as Error).message);
    }
  };

  const toggleSave = async () => {
    if (!requireAuth()) return;
    const prev = writeup;
    const next = !writeup.isSavedByMe;
    setWriteup({ ...writeup, isSavedByMe: next });
    setActionError(null);
    try {
      await api(`/api/writeups/${writeup._id}/save`, {
        method: next ? "POST" : "DELETE",
      });
    } catch (err) {
      setWriteup(prev);
      setActionError((err as Error).message);
    }
  };

  return (
    <article>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`badge ${CATEGORY_BADGE[writeup.category]}`}>
          {CATEGORY_LABELS[writeup.category]}
        </span>
        {writeup.difficulty && (
          <span className={`badge ${DIFFICULTY_BADGE[writeup.difficulty]}`}>
            {writeup.difficulty}
          </span>
        )}
        {writeup.platform && (
          <span className="badge bg-slate-700/40 text-slate-300">
            {writeup.platform}
          </span>
        )}
        {isDraft && (
          <span className="badge bg-yellow-500/15 text-yellow-300">
            draft — only you can see this
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-bold">{writeup.title}</h1>

      <p className="mt-2 text-sm text-slate-500">
        by{" "}
        {author ? (
          <Link
            to={`/users/${author.username}`}
            className="text-slate-300 hover:text-emerald-300"
          >
            @{author.username}
          </Link>
        ) : (
          "unknown"
        )}{" "}
        · {fmtDate(writeup.createdAt)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => void toggleLike()}
          className={`btn ${writeup.isLikedByMe ? "btn-primary" : "btn-outline"}`}
        >
          ♥ {writeup.likesCount ?? 0}
        </button>
        <button
          onClick={() => void toggleSave()}
          className={`btn ${writeup.isSavedByMe ? "btn-primary" : "btn-outline"}`}
        >
          {writeup.isSavedByMe ? "Saved ✓" : "Save"}
        </button>
        {isMine && (
          <Link to={`/writeups/${writeup._id}/edit`} className="btn-outline">
            Edit
          </Link>
        )}
        {actionError && (
          <span className="text-sm text-red-400">{actionError}</span>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {SECTIONS.map(({ key, label }) => (
          <section key={key}>
            <h2 className="mb-2 text-xl font-semibold text-emerald-300">
              {label}
            </h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {writeup.sections[key]}
            </div>
          </section>
        ))}
      </div>

      {writeup.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1">
          {writeup.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {writeup.cveRefs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {writeup.cveRefs.map((cve) => (
            <span
              key={cve}
              className="rounded bg-red-950/40 px-2 py-0.5 text-xs text-red-300"
            >
              {cve}
            </span>
          ))}
        </div>
      )}

      <Comments
        writeupId={writeup._id}
        onCountChange={setCommentCount}
      />
    </article>
  );
};
