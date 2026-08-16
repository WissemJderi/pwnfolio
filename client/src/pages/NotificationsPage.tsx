import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TbBell, TbBooks, TbCheck, TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { api } from "../api/client";
import type { NotificationItem, NotificationListResponse } from "../api/types";
import { useNotifications } from "../components/NotificationBell";
import { UserHover } from "../components/UserHoverCard";
import { RowSkeleton } from "../components/Skeleton";
import { fmtDate } from "../lib/format";

const VERB: Record<NotificationItem["type"], string> = {
  like: "liked",
  comment: "commented on",
  reply: "replied to",
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { refresh } = useNotifications();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<NotificationListResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<NotificationListResponse>(`/api/notifications?page=${page}`);
      setItems(res.notifications);
      setPagination(res.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const openItem = async (item: NotificationItem) => {
    if (!item.read) {
      await api(`/api/notifications/${item._id}/read`, { method: "PATCH" });
      setItems((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)),
      );
      refresh();
    }
    const writeupId = typeof item.writeup === "string" ? item.writeup : item.writeup._id;
    navigate(`/writeups/${writeupId}`);
  };

  const markAllRead = async () => {
    await api("/api/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
          <TbBell size={22} className="text-neon-400" /> /me/notifications
          <span className="text-xs font-normal text-ink-500">
            ({pagination?.total ?? 0})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button className="btn btn-outline text-xs" onClick={() => void markAllRead()}>
              <TbCheck size={14} /> mark all read
            </button>
          )}
          <Link to="/" className="btn btn-outline text-xs">
            <TbBooks size={15} /> browse the index
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 font-mono text-sm text-blood-400">{error}</p>}

      {loading ? (
        <ul className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="py-20 text-center font-mono text-ink-500">
          // nothing yet — likes, comments and replies on your writeups show
          up here.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => {
            const title = typeof item.writeup === "string" ? "a writeup" : item.writeup.title;
            return (
              <li
                key={item._id}
                className={`panel flex flex-wrap items-center gap-4 py-4 pl-4 pr-4 ${
                  item.read ? "" : "border-neon-500/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void openItem(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="flex flex-wrap items-center gap-1.5 font-mono text-sm">
                    {!item.read && <span className="h-1.5 w-1.5 shrink-0 bg-neon-500" />}
                    <UserHover username={item.actor.username}>
                      <span className="font-medium text-neon-400">
                        @{item.actor.username}
                      </span>
                    </UserHover>
                    <span className="text-ink-400">{VERB[item.type]}</span>
                  </p>
                  <p className="muted mt-1 flex flex-wrap items-center gap-2">
                    <span className="truncate">{title}</span>
                    <span>·</span>
                    <span>{fmtDate(item.createdAt)}</span>
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
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
    </div>
  );
};
