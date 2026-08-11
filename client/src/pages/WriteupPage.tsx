import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  TbBookmark,
  TbChevronRight,
  TbClock,
  TbEdit,
  TbEye,
  TbHeart,
  TbMessageCircle,
} from "react-icons/tb";
import { api } from "../api/client";
import type { Writeup } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { Comments } from "../components/Comments";
import { Markdown } from "../components/Markdown";
import { ReadingProgress } from "../components/ReadingProgress";
import { Skeleton, SectionSkeleton } from "../components/Skeleton";
import { UserHover } from "../components/UserHoverCard";
import {
  CATEGORY_BADGE,
  CATEGORY_LABELS,
  DIFFICULTY_BADGE,
  fmtDate,
  getAuthorId,
  readTime,
} from "../lib/format";

const SECTIONS = [
  { key: "recon", label: "recon", title: "Recon" },
  { key: "approach", label: "approach", title: "Approach" },
  { key: "exploitChain", label: "exploit-chain", title: "Exploit chain" },
  { key: "takeaway", label: "takeaway", title: "Takeaway" },
] as const;

export const WriteupPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [writeup, setWriteup] = useState<Writeup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    setCollapsed({});
  }, [id]);

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandAll = useCallback(() => setCollapsed({}), []);

  const collapseAll = useCallback(() => {
    setCollapsed(Object.fromEntries(SECTIONS.map((s) => [s.key, true])));
  }, []);

  const setCommentCount = useCallback((count: number) => {
    setWriteup((w) => (w ? { ...w, commentCount: count } : w));
  }, []);

  if (notFound) {
    return (
      <p className="py-20 text-center font-mono text-ink-500">
        $ open /writeups/{id} → 404: writeup not found or still in draft
      </p>
    );
  }
  if (!writeup) {
    return (
      <article>
        <Skeleton className="h-3 w-44" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="mt-4 h-9 w-2/3" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-y border-line-800 py-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0 space-y-9">
            {Array.from({ length: 4 }).map((_, i) => (
              <SectionSkeleton key={i} />
            ))}
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-5">
              <div className="panel space-y-3 p-4">
                <Skeleton className="h-4 w-20" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-3.5 w-full" />
                ))}
              </div>
              <div className="panel space-y-3 p-4">
                <Skeleton className="h-4 w-16" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-full" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    );
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
      <ReadingProgress />
      <p className="muted mb-4 truncate">
        <Link to="/" className="text-ink-400 hover:text-neon-400">
          ~/writeups
        </Link>
        /[{writeup._id.slice(-4)}]/
        <span className="text-neon-500">{writeup.status}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className={`badge ${CATEGORY_BADGE[writeup.category]}`}>
          {CATEGORY_LABELS[writeup.category]}
        </span>
        {writeup.difficulty && (
          <span className={`badge ${DIFFICULTY_BADGE[writeup.difficulty]}`}>
            {writeup.difficulty}
          </span>
        )}
        {writeup.platform && (
          <span className="badge border-line-700 bg-core-700/60 text-ink-400">
            {writeup.platform}
          </span>
        )}
        {isDraft && (
          <span className="badge border-gold-400/40 bg-gold-400/10 text-gold-300">
            draft — only you can see this
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-bold leading-tight">{writeup.title}</h1>

      <p className="mt-3 flex flex-wrap items-center gap-3 font-mono text-sm text-ink-500">
        <span className="flex items-center gap-1.5">
          {author ? (
            <UserHover username={author.username}>
              <span className="flex h-6 w-6 items-center justify-center border border-line-700 bg-core-700/60 text-[11px] text-neon-400">
                {author.username.slice(0, 1).toUpperCase()}
              </span>
              by{" "}
              <Link
                to={`/users/${author.username}`}
                className="text-ink-300 hover:text-neon-400"
              >
                @{author.username}
              </Link>
            </UserHover>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center border border-line-700 bg-core-700/60 text-[11px] text-neon-400">
              ?
            </span>
          )}
        </span>
        <span className="text-ink-500/60">·</span>
        <span>{fmtDate(writeup.createdAt)}</span>
        <span className="text-ink-500/60">·</span>
        <span className="flex items-center gap-1">
          <TbClock size={13} /> ~{readTime(writeup)} min read
        </span>
        <span className="text-ink-500/60">·</span>
        <span className="flex items-center gap-1">
          <TbEye size={13} /> {writeup.views ?? 0} views
        </span>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-y border-line-800 py-3">
        <button
          onClick={() => void toggleLike()}
          className={`btn ${writeup.isLikedByMe ? "btn-primary" : "btn-outline"} text-xs`}
        >
          <TbHeart size={15} fill={writeup.isLikedByMe ? "currentColor" : "none"} />
          {writeup.likesCount ?? 0}
        </button>
        <button
          onClick={() => void toggleSave()}
          className={`btn ${writeup.isSavedByMe ? "btn-primary" : "btn-outline"} text-xs`}
        >
          <TbBookmark size={15} fill={writeup.isSavedByMe ? "currentColor" : "none"} />
          {writeup.isSavedByMe ? "saved" : "save"}
        </button>
        {isMine && (
          <Link to={`/writeups/${writeup._id}/edit`} className="btn btn-outline text-xs">
            <TbEdit size={14} /> edit
          </Link>
        )}
        {actionError && (
          <span className="font-mono text-xs text-blood-400">{actionError}</span>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="min-w-0 space-y-9">
          {SECTIONS.map(({ key, label, title }) => (
            <CollapsibleSection
              key={key}
              id={label}
              title={title}
              collapsed={!!collapsed[key]}
              onToggle={() => toggleSection(key)}
            >
              <Markdown source={writeup.sections[key]} />
            </CollapsibleSection>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-5">
            <nav className="panel p-4">
              <p className="muted mb-2 uppercase tracking-[0.2em]">contents</p>
              <ul className="space-y-1.5 font-mono text-sm">
                {SECTIONS.map(({ key, label, title }) => (
                  <li key={key}>
                    <a
                      href={`#${label}`}
                      onClick={() => toggleSection(key)}
                      className="inline-flex items-center gap-1 text-ink-400 hover:text-neon-400"
                    >
                      <TbChevronRight size={14} className="text-neon-500" /> {title}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-1.5 border-t border-line-800 pt-3">
                <button
                  type="button"
                  onClick={expandAll}
                  className="chip flex-1 justify-center px-2 text-[11px]"
                >
                  expand all
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="chip flex-1 justify-center px-2 text-[11px]"
                >
                  collapse all
                </button>
              </div>
            </nav>

            <div className="panel p-4">
              <p className="muted mb-2 uppercase tracking-[0.2em]">meta</p>
              <dl className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <dt className="text-ink-500">category</dt>
                  <dd className="text-ink-300">
                    {CATEGORY_LABELS[writeup.category]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">difficulty</dt>
                  <dd className="text-ink-300">{writeup.difficulty ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">platform</dt>
                  <dd className="text-ink-300">{writeup.platform ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">likes</dt>
                  <dd className="flex items-center gap-1 text-neon-500">
                    <TbHeart size={13} fill="currentColor" /> {writeup.likesCount ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">comments</dt>
                  <dd className="flex items-center gap-1 text-ink-300">
                    <TbMessageCircle size={13} /> {writeup.commentCount ?? 0}
                  </dd>
                </div>
              </dl>
            </div>

            {writeup.tags.length > 0 && (
              <div className="panel p-4">
                <p className="muted mb-2 uppercase tracking-[0.2em]">tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {writeup.tags.map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {writeup.cveRefs.length > 0 && (
              <div className="panel p-4">
                <p className="muted mb-2 uppercase tracking-[0.2em]">cve refs</p>
                <div className="flex flex-wrap gap-1.5">
                  {writeup.cveRefs.map((cve) => (
                    <span
                      key={cve}
                      className="badge border-blood-400/40 bg-blood-400/10 text-blood-300"
                    >
                      {cve}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <Comments writeupId={writeup._id} onCountChange={setCommentCount} />
    </article>
  );
};