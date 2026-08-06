import { Link } from "react-router-dom";
import type { Writeup } from "../api/types";
import {
  CATEGORY_BADGE,
  CATEGORY_LABELS,
  DIFFICULTY_BADGE,
  fmtDate,
} from "../lib/format";

export const WriteupCard = ({ writeup }: { writeup: Writeup }) => {
  const author =
    typeof writeup.author === "string" ? null : writeup.author;

  return (
    <article className="card flex flex-col gap-2 transition-colors hover:border-slate-700">
      <div className="flex items-center gap-2 text-xs">
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
        {writeup.status === "draft" && (
          <span className="badge bg-yellow-500/15 text-yellow-300">draft</span>
        )}
      </div>

      <h2 className="text-lg font-semibold leading-snug">
        <Link
          to={`/writeups/${writeup._id}`}
          className="hover:text-emerald-300"
        >
          {writeup.title}
        </Link>
      </h2>

      {writeup.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {writeup.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-1 text-xs text-slate-500">
        <span>
          {author ? (
            <Link
              to={`/users/${author.username}`}
              className="text-slate-400 hover:text-emerald-300"
            >
              @{author.username}
            </Link>
          ) : (
            "unknown author"
          )}{" "}
          · {fmtDate(writeup.createdAt)}
        </span>
        <span className="flex items-center gap-3">
          <span>♥ {writeup.likesCount ?? 0}</span>
          <span>💬 {writeup.commentCount ?? 0}</span>
        </span>
      </div>
    </article>
  );
};
