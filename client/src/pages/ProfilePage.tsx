import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TbChartBar, TbEdit, TbWorld, TbX } from "react-icons/tb";
import { SiGithub } from "react-icons/si";
import { api } from "../api/client";
import type {
  Category,
  ProfileLinks,
  PublicProfile,
  Writeup,
} from "../api/types";
import { useAuth } from "../context/AuthContext";
import { WriteupCard } from "../components/WriteupCard";
import { Markdown } from "../components/Markdown";
import { Stagger, StaggerItem } from "../components/Stagger";
import { Skeleton, GridSkeleton } from "../components/Skeleton";
import { CATEGORY_LABELS, fmtDate } from "../lib/format";

const LINK_KEYS: (keyof ProfileLinks)[] = [
  "github",
  "medium",
  "website",
  "discord",
  "x",
  "htb",
  "tryhackme",
];

const LINK_LABELS: Record<keyof ProfileLinks, string> = {
  github: "github",
  medium: "medium",
  website: "website",
  discord: "discord",
  x: "x",
  htb: "htb",
  tryhackme: "tryhackme",
};

const LINK_SHORT: Record<keyof ProfileLinks, string> = {
  github: "gh",
  medium: "md",
  website: "web",
  discord: "dc",
  x: "x",
  htb: "htb",
  tryhackme: "thm",
};

const CATEGORY_BAR: Record<Category, string> = {
  web: "bg-sky-400/80",
  pwn: "bg-blood-400/80",
  crypto: "bg-gold-400/80",
  forensics: "bg-vio-400/80",
  osint: "bg-neon-500/80",
  misc: "bg-line-700",
};

const toHref = (value: string): string =>
  /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;

const sanitize = (links: ProfileLinks | undefined): ProfileLinks => {
  const out: ProfileLinks = {};
  for (const key of LINK_KEYS) {
    const value = links?.[key];
    if (value && value.trim()) out[key] = value.trim();
  }
  return out;
};

const StatsStrip = ({
  writeups,
  joined,
}: {
  writeups: Writeup[];
  joined: string;
}) => {
  const likes = writeups.reduce((sum, w) => sum + (w.likesCount ?? 0), 0);
  const comments = writeups.reduce((sum, w) => sum + (w.commentCount ?? 0), 0);
  const days = Math.max(
    0,
    Math.round((Date.now() - new Date(joined).getTime()) / 86400000),
  );

  const stats: { label: string; value: number | string }[] = [
    { label: "published", value: writeups.length },
    { label: "likes", value: likes },
    { label: "comments", value: comments },
    { label: "age", value: `${days}d` },
  ];

  return (
    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden  border border-line-800 bg-line-800 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-core-900/70 p-3 text-center">
          <p className="font-mono text-lg font-bold text-ink-100">{value}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

const CategoryBar = ({ writeups }: { writeups: Writeup[] }) => {
  const counts = new Map<Category, number>();
  for (const w of writeups) {
    counts.set(w.category, (counts.get(w.category) ?? 0) + 1);
  }
  const total = writeups.length || 1;

  return (
    <div className="mt-4">
      <div className="flex h-1.5 w-full overflow-hidden  bg-core-800">
        {Array.from(counts.entries()).map(([category, count]) => (
          <div
            key={category}
            className={CATEGORY_BAR[category]}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${CATEGORY_LABELS[category]}: ${count}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => (
            <span
              key={category}
              className="muted inline-flex items-center gap-1.5"
            >
              <span
                className={`h-2 w-2 ${CATEGORY_BAR[category]}`}
              />
              {CATEGORY_LABELS[category]} · {count}
            </span>
          ))}
      </div>
    </div>
  );
};

const LinksRow = ({ links }: { links: ProfileLinks }) => {
  const filled = LINK_KEYS.filter((key) => links[key]);
  if (filled.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {filled.map((key) => {
        const value = links[key] as string;
        const isGithub = key === "github";
        const isWebsite = key === "website";
        return (
          <a
            key={String(key)}
            href={toHref(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5  border border-line-700 bg-core-800/50 px-2.5 py-1 font-mono text-xs text-ink-400 transition-colors hover:border-neon-500/40 hover:text-neon-300"
          >
            {isGithub ? (
              <SiGithub size={13} />
            ) : isWebsite ? (
              <TbWorld size={13} />
            ) : (
              <span className="w-4 text-center text-[10px] font-bold text-ink-500">
                {LINK_SHORT[key]}
              </span>
            )}
            {LINK_LABELS[key]}
          </a>
        );
      })}
    </div>
  );
};

export const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [uname, setUname] = useState("");
  const [bio, setBio] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [links, setLinks] = useState<ProfileLinks>({});

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setProfile(null);
    setEditing(false);
    api<PublicProfile>(`/api/users/${username}`)
      .then(setProfile)
      .catch((err) => {
        if ((err as { status?: number }).status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div>
        <div className="panel grid-bg p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="mt-4 h-16 w-full" />
          <div className="mt-4 flex gap-1.5">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-11" />
          </div>
        </div>
        <h2 className="mt-8 mb-1 flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
        </h2>
        <GridSkeleton count={2} />
      </div>
    );
  }

  if (notFound) {
    return (
      <p className="py-20 text-center font-mono text-ink-500">
        $ whoami /users/{username} → 404: operator not found
      </p>
    );
  }

  if (!profile) return null;

  const isMine = !!user && profile.user.username === user.username;
  const writtenLinks = sanitize(profile.user.links);

  const openEditor = () => {
    setUname(profile.user.username);
    setBio(profile.user.bio ?? "");
    setInterests(profile.user.interests ?? []);
    setLinks({ ...writtenLinks });
    setSaveError(null);
    setEditing(true);
    setPwError(null);
    setPwOk(false);
  };

  const addInterest = () => {
    const tag = interestInput.trim().toLowerCase();
    if (!tag) return;
    setInterests((prev) =>
      prev.includes(tag) ? prev : [...prev, tag].slice(0, 12),
    );
    setInterestInput("");
  };

  const removeInterest = (tag: string) =>
    setInterests((prev) => prev.filter((t) => t !== tag));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveBusy(true);
    setSaveError(null);
    try {
      const next = await api<{
        username: string;
        email: string;
        bio?: string;
        interests: string[];
        links?: ProfileLinks;
      }>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ username: uname, bio, interests, links }),
      });
      if (user)
        updateUser({
          id: user.id,
          email: next.email,
          username: next.username,
          links: next.links,
        });
      setEditing(false);
      if (next.username !== username) {
        navigate(`/users/${next.username}`, { replace: true });
      } else {
        void api<PublicProfile>(`/api/users/${username}`).then(setProfile);
      }
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaveBusy(false);
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    setPwError(null);
    setPwOk(false);
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match");
      setPwBusy(false);
      return;
    }
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: pwCurrent,
          newPassword: pwNew,
        }),
      });
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setPwOk(true);
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div>
      <div className="panel grid-bg p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center  border border-neon-500/40 bg-neon-500/10 font-mono text-3xl font-bold text-neon-400 shadow-[0_0_20px_-6px_rgba(var(--pf-glow),0.35)]">
            {profile.user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-mono text-2xl font-bold text-neon-400">
                @{profile.user.username}
              </h1>
              {isMine && (
                <button
                  className="btn btn-outline px-2 py-1 text-xs"
                  onClick={() => (editing ? setEditing(false) : openEditor())}
                >
                  {editing ? (
                    <>
                      <TbX size={13} /> close
                    </>
                  ) : (
                    <>
                      <TbEdit size={13} /> edit
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="muted mt-1">
              operator · joined {fmtDate(profile.user.createdAt)} ·{" "}
              {profile.writeups.length} published writeup
              {profile.writeups.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {profile.user.bio && (
          <div className="mt-4  border border-line-800 bg-core-900/70 p-3">
            <Markdown source={profile.user.bio} />
          </div>
        )}

        {profile.user.interests && profile.user.interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.user.interests.map((i) => (
              <span key={i} className="tag">
                #{i}
              </span>
            ))}
          </div>
        )}

        <StatsStrip
          writeups={profile.writeups}
          joined={profile.user.createdAt}
        />
        {profile.writeups.length > 0 && (
          <CategoryBar writeups={profile.writeups} />
        )}
        <LinksRow links={writtenLinks} />
      </div>

      {isMine && editing && (
        <form
          onSubmit={(e) => void saveProfile(e)}
          className="panel mt-6 space-y-5 p-6"
        >
          <p className="section-head">
            <span className="text-neon-500">##</span> edit operator record
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">username</label>
              <input
                className="input"
                value={uname}
                minLength={3}
                maxLength={24}
                required
                pattern="[a-z0-9_]+"
                onChange={(e) => setUname(e.target.value)}
              />
            </div>
            <div>
              <label className="label">interests</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="e.g. buffer-overflow"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline shrink-0"
                  onClick={addInterest}
                >
                  add
                </button>
              </div>
              {interests.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {interests.map((tag) => (
                    <span
                      key={tag}
                      className="tag inline-flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        type="button"
                        title="remove"
                        className="text-ink-400 hover:text-blood-400"
                        onClick={() => removeInterest(tag)}
                      >
                        <TbX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">bio</label>
            <textarea
              className="input min-h-24 resize-y"
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="mt-1 text-right font-mono text-[10px] text-ink-500">
              {bio.length}/300
            </p>
          </div>

          <div>
            <label className="label">links</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {LINK_KEYS.map((key) => (
                <div key={String(key)}>
                  <label className="label">{LINK_LABELS[key]}</label>
                  <input
                    className="input"
                    placeholder={`${LINK_LABELS[key]} handle or url`}
                    value={links[key] ?? ""}
                    onChange={(e) =>
                      setLinks((prev: ProfileLinks) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <p className="font-mono text-xs text-blood-400">$ {saveError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveBusy}
            >
              {saveBusy ? "saving…" : "save record"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setEditing(false)}
            >
              cancel
            </button>
          </div>
        </form>
      )}

      {isMine && editing && (
        <form
          onSubmit={(e) => void changePw(e)}
          className="panel mt-6 space-y-5 p-6"
        >
          <p className="section-head">
            <span className="text-neon-500">##</span> change password
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">current pw</label>
              <input
                className="input"
                type="password"
                required
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="label">new pw</label>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
              />
            </div>
            <div>
              <label className="label">confirm new</label>
              <input
                className="input"
                type="password"
                required
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
              />
            </div>
          </div>
          {pwError && (
            <p className="font-mono text-xs text-blood-400">$ {pwError}</p>
          )}
          {pwOk && (
            <p className="font-mono text-xs text-neon-400">
              $ password updated — keep the new one safe
            </p>
          )}
          <button type="submit" className="btn btn-outline" disabled={pwBusy}>
            {pwBusy ? "hashing…" : "update password"}
          </button>
        </form>
      )}

      <div className="mt-8 mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-lg font-semibold">
          <span className="text-neon-500">##</span> writeups
          <span className="text-xs font-normal text-ink-500">
            ({profile.writeups.length})
          </span>
        </h2>
        <Link
          to={`/users/${profile.user.username}/stats`}
          className="btn btn-outline px-2 py-1 text-xs"
        >
          <TbChartBar size={14} /> stats
        </Link>
      </div>
      <p className="muted mb-4">// knowledge shared is power multiplied</p>

      {profile.writeups.length === 0 ? (
        <p className="py-10 text-center font-mono text-ink-500">
          // no published writeups yet
        </p>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {profile.writeups.map((w) => (
            <StaggerItem key={w._id}>
              <WriteupCard writeup={w} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {profile.writeups.length > 0 && (
        <p className="mt-6 font-mono text-xs text-ink-500">
          view all on{" "}
          <Link to="/" className="text-neon-400 hover:underline">
            the writeup list
          </Link>
          .
        </p>
      )}
    </div>
  );
};

