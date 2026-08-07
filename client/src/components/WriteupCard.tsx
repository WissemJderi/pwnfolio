import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TbClock, TbEye, TbHeart, TbMessageCircle } from "react-icons/tb";
import type { Writeup } from "../api/types";
import {
  CATEGORY_BADGE,
  CATEGORY_LABELS,
  DIFFICULTY_BADGE,
  fmtDate,
  readTime,
} from "../lib/format";

export const WriteupCard = ({ writeup }: { writeup: Writeup }) => {
  const author =
    typeof writeup.author === "string" ? null : writeup.author;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      className="panel group flex flex-col gap-3 p-4 transition-[border-color,box-shadow] duration-150 hover:border-neon-500/40 hover:shadow-[0_0_24px_-8px_rgba(var(--pf-glow),0.22)]"
    >
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
        {writeup.status === "draft" && (
          <span className="badge border-gold-400/40 bg-gold-400/10 text-gold-300">
            draft
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] text-ink-500/70">
          [{writeup._id.slice(-4)}]
        </span>
      </div>

      <h2 className="font-mono text-base font-semibold leading-snug text-ink-100">
        <Link
          to={`/writeups/${writeup._id}`}
          className="hover:text-neon-400"
        >
          {writeup.title}
        </Link>
      </h2>

      {writeup.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {writeup.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line-800 pt-2.5 font-mono text-xs text-ink-500">
        <span className="flex min-w-0 items-center gap-1.5">
          {author ? (
            <>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line-700 bg-core-700/60 text-[10px] text-neon-400">
                {author.username.slice(0, 1).toUpperCase()}
              </span>
              <Link
                to={`/users/${author.username}`}
                className="truncate text-ink-400 hover:text-neon-400"
              >
                @{author.username}
              </Link>
            </>
          ) : (
            "unknown author"
          )}
          <span className="text-ink-500/60">·</span>
          <span className="shrink-0">{fmtDate(writeup.createdAt)}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-ink-500">
            <TbEye size={14} /> {writeup.views ?? 0}
          </span>
          <span className="flex items-center gap-1 text-ink-500">
            <TbClock size={14} /> ~{readTime(writeup)} min
          </span>
          <span className="flex items-center gap-1 text-neon-500">
            <TbHeart size={14} fill="currentColor" /> {writeup.likesCount ?? 0}
          </span>
          <span className="flex items-center gap-1 text-ink-400">
            <TbMessageCircle size={14} /> {writeup.commentCount ?? 0}
          </span>
        </span>
      </div>
    </motion.article>
  );
};
