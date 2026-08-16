import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TbBell, TbCheck } from "react-icons/tb";
import { api } from "../api/client";
import type { NotificationItem, NotificationListResponse, UnreadCountResponse } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { fmtDate } from "../lib/format";
import { UserHover } from "./UserHoverCard";

const POLL_INTERVAL_MS = 45_000;

interface NotificationsContextValue {
  unreadCount: number;
  refresh: () => void;
}

const noop = () => {};

const NotificationsContext = createContext<NotificationsContextValue>({
  unreadCount: 0,
  refresh: noop,
});

export const useNotifications = (): NotificationsContextValue =>
  useContext(NotificationsContext);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const fetchCount = useCallback(() => {
    if (!user) return;
    if (document.visibilityState === "hidden") return;
    void api<UnreadCountResponse>("/api/notifications/unread-count")
      .then((res) => setUnreadCount(res.count))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchCount();
    timerRef.current = window.setInterval(fetchCount, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, fetchCount]);

  const value = useMemo(
    () => ({ unreadCount, refresh: fetchCount }),
    [unreadCount, fetchCount],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

const VERB: Record<NotificationItem["type"], string> = {
  like: "liked",
  comment: "commented on",
  reply: "replied to",
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setStatus("loading");
    void api<NotificationListResponse>("/api/notifications?limit=8")
      .then((res) => {
        setItems(res.notifications);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!user) return null;

  const openItem = (item: NotificationItem) => {
    setOpen(false);
    if (!item.read) {
      void api(`/api/notifications/${item._id}/read`, { method: "PATCH" }).then(refresh);
    }
    const writeupId =
      typeof item.writeup === "string" ? item.writeup : item.writeup._id;
    navigate(`/writeups/${writeupId}`);
  };

  const markAllRead = () => {
    void api("/api/notifications/read-all", { method: "PATCH" }).then(() => {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      refresh();
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="notifications"
        aria-label="notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-line-700 bg-core-800/50 text-ink-300 transition-colors hover:border-neon-500/40 hover:text-neon-400"
      >
        <TbBell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-blood-500 px-0.5 font-mono text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="notifications"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-4 z-[80] flex max-h-[70vh] flex-col border border-line-700 bg-core-900/95 font-mono shadow-[0_16px_40px_-16px_rgba(0,0,0,0.95)] backdrop-blur lg:absolute lg:inset-x-auto lg:inset-y-auto lg:bottom-full lg:left-0 lg:mb-2 lg:block lg:w-72 lg:max-h-none"
          >
            <div className="flex items-center justify-between border-b border-line-800 px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink-500">
                notifications
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-neon-400 hover:underline"
                >
                  <TbCheck size={12} /> mark all read
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-80 lg:flex-none">
              {status === "loading" && (
                <div className="space-y-2 p-3">
                  <div className="h-8 w-full animate-pulse bg-core-700/50" />
                  <div className="h-8 w-full animate-pulse bg-core-700/50" />
                </div>
              )}
              {status === "error" && (
                <p className="p-3 text-xs text-blood-400">
                  $ fetch notifications → failed
                </p>
              )}
              {status === "ready" && items.length === 0 && (
                <p className="p-3 text-xs text-ink-500">
                  // nothing yet — likes, comments and replies show up here
                </p>
              )}
              {status === "ready" &&
                items.map((item) => {
                  const title =
                    typeof item.writeup === "string" ? "a writeup" : item.writeup.title;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full flex-col gap-0.5 border-b border-line-800 px-3 py-2 text-left text-xs transition-colors last:border-b-0 hover:bg-core-800/60 ${
                        item.read ? "text-ink-400" : "text-ink-100"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {!item.read && (
                          <span className="h-1.5 w-1.5 shrink-0 bg-neon-500" />
                        )}
                        <UserHover username={item.actor.username}>
                          <span className="font-medium text-neon-400">
                            @{item.actor.username}
                          </span>
                        </UserHover>
                        <span>{VERB[item.type]}</span>
                      </span>
                      <span className="truncate text-ink-300">{title}</span>
                      <span className="text-[10px] text-ink-500">
                        {fmtDate(item.createdAt)}
                      </span>
                    </button>
                  );
                })}
            </div>

            <Link
              to="/me/notifications"
              className="block border-t border-line-800 px-3 py-2 text-center text-[11px] text-neon-400 hover:underline"
            >
              view all
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
