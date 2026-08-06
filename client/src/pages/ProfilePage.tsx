import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { PublicProfile } from "../api/types";
import { WriteupCard } from "../components/WriteupCard";
import { fmtDate } from "../lib/format";

export const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setProfile(null);
    api<PublicProfile>(`/api/users/${username}`)
      .then(setProfile)
      .catch((err) => {
        if ((err as { status?: number }).status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <p className="cursor py-20 text-center font-mono text-ink-400">Loading…</p>
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

  return (
    <div>
      <div className="panel grid-bg p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-neon-500/40 bg-neon-500/10 font-mono text-3xl font-bold text-neon-400 shadow-[0_0_20px_-6px_rgba(158,239,0,0.5)]">
            {profile.user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-mono text-2xl font-bold text-neon-400">
              @{profile.user.username}
            </h1>
            <p className="muted mt-1">
              operator · joined {fmtDate(profile.user.createdAt)} ·{" "}
              {profile.writeups.length} published writeup
              {profile.writeups.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {profile.user.bio && (
          <p className="mt-4 whitespace-pre-wrap rounded-md border border-line-800 bg-core-900/70 p-3 text-sm leading-relaxed text-ink-300">
            {profile.user.bio}
          </p>
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
      </div>

      <h2 className="mt-8 mb-1 flex items-center gap-2 font-mono text-lg font-semibold">
        <span className="text-neon-500">##</span> writeups
        <span className="text-xs font-normal text-ink-500">
          ({profile.writeups.length})
        </span>
      </h2>
      <p className="muted mb-4">// knowledge shared is power multiplied</p>

      {profile.writeups.length === 0 ? (
        <p className="py-10 text-center font-mono text-ink-500">
          // no published writeups yet
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.writeups.map((w) => (
            <WriteupCard key={w._id} writeup={w} />
          ))}
        </div>
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
