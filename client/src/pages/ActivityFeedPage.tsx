import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbBooks, TbChevronLeft, TbChevronRight, TbUsers } from "react-icons/tb";
import { api } from "../api/client";
import type { WriteupListResponse } from "../api/types";
import { WriteupCard } from "../components/WriteupCard";
import { Stagger, StaggerItem } from "../components/Stagger";
import { GridSkeleton } from "../components/Skeleton";

export const ActivityFeedPage = () => {
  const [writeups, setWriteups] = useState<WriteupListResponse["writeups"]>([]);
  const [pagination, setPagination] = useState<WriteupListResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api<WriteupListResponse>(`/api/writeups/feed?page=${page}`)
      .then((res) => {
        setWriteups(res.writeups);
        setPagination(res.pagination);
      })
      .catch(() => setWriteups([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TbUsers size={22} className="text-neon-400" /> /me/activity
          <span className="cursor" />
        </h1>
        <p className="muted hidden sm:block">
          {pagination ? `${pagination.total}` : "…"} result
          {pagination && pagination.total !== 1 ? "s" : ""} from authors you follow
        </p>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : writeups.length === 0 ? (
        <p className="py-20 text-center font-mono text-ink-500">
          // nobody you follow has published yet —{" "}
          <Link to="/" className="text-neon-400 hover:underline">
            browse the index
          </Link>{" "}
          and follow some authors.
        </p>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {writeups.map((w) => (
            <StaggerItem key={w._id}>
              <WriteupCard
                writeup={w}
                onLikedChange={(id, next) =>
                  setWriteups((list) =>
                    list.map((item) =>
                      item._id === id ? { ...item, ...next } : item,
                    ),
                  )
                }
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 font-mono">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <TbChevronLeft size={16} /> prev
          </button>
          <span className="text-sm text-ink-500">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            next <TbChevronRight size={16} />
          </button>
        </div>
      )}

      {writeups.length > 0 && (
        <p className="mt-6 font-mono text-xs text-ink-500">
          looking for more?{" "}
          <span className="inline-flex items-center gap-1">
            <TbBooks size={13} />
            <Link to="/" className="text-neon-400 hover:underline">
              browse the full index
            </Link>
          </span>
          .
        </p>
      )}
    </div>
  );
};
