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

  if (loading) return <p className="py-16 text-center text-slate-400">Loading…</p>;

  if (notFound) {
    return <p className="py-16 text-center text-slate-500">User not found.</p>;
  }

  if (!profile) return null;

  return (
    <div>
      <div className="card">
        <h1 className="text-2xl font-bold text-emerald-300">
          @{profile.user.username}
        </h1>
        {profile.user.bio && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
            {profile.user.bio}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          joined {fmtDate(profile.user.createdAt)}
        </p>
        {profile.user.interests && profile.user.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {profile.user.interests.map((i) => (
              <span
                key={i}
                className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
              >
                {i}
              </span>
            ))}
          </div>
        )}
      </div>

      <h2 className="mt-8 text-xl font-semibold">Writeups</h2>
      {profile.writeups.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No published writeups yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {profile.writeups.map((w) => (
            <WriteupCard key={w._id} writeup={w} />
          ))}
        </div>
      )}

      {profile.writeups.length > 0 && (
        <p className="mt-6 text-sm text-slate-500">
          View all on{" "}
          <Link
            to="/"
            className="text-emerald-300 hover:underline"
          >
            the writeup list
          </Link>
          .
        </p>
      )}
    </div>
  );
};
