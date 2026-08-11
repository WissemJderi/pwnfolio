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
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  TbCalendar,
  TbExternalLink,
  TbEye,
  TbHeart,
  TbMessageCircle,
} from "react-icons/tb";
import { api } from "../api/client";
import type { UserCard } from "../api/types";
import { fmtDate } from "../lib/format";

const INTENT_DELAY = 260;
const GRACE_DELAY = 160;
const CARD_WIDTH = 264;
const CARD_GAP = 8;
const VIEWPORT_MARGIN = 8;

interface CardState {
  username: string;
  rect: DOMRect;
}

interface UserHoverContextValue {
  hover: (rect: DOMRect | null, username: string) => void;
  leave: () => void;
  show: (rect: DOMRect | null, username: string) => void;
  hide: () => void;
  enterCard: () => void;
}

const noop = () => {};

const UserHoverContext = createContext<UserHoverContextValue>({
  hover: noop,
  leave: noop,
  show: noop,
  hide: noop,
  enterCard: noop,
});

const useUserHover = (): UserHoverContextValue => useContext(UserHoverContext);

export const UserHover = ({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const { hover, leave, show, hide } = useUserHover();

  return (
    <span
      ref={ref}
      onMouseEnter={() => hover(ref.current?.getBoundingClientRect() ?? null, username)}
      onMouseLeave={leave}
      onFocusCapture={() => show(ref.current?.getBoundingClientRect() ?? null, username)}
      onBlurCapture={hide}
      className="inline-flex items-center gap-1.5"
    >
      {children}
    </span>
  );
};

export const UserHoverCardProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [card, setCard] = useState<CardState | null>(null);
  const [data, setData] = useState<UserCard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const intentTimer = useRef<number | null>(null);
  const graceTimer = useRef<number | null>(null);
  const insideRef = useRef(false);
  const cacheRef = useRef(new Map<string, UserCard>());
  const cardElRef = useRef<HTMLDivElement | null>(null);
  const pendingUserRef = useRef<string | null>(null);

  const canHover = useMemo(
    () => typeof window === "undefined" || !window.matchMedia ||
      window.matchMedia("(hover: hover)").matches,
    [],
  );

  const clearTimers = useCallback(() => {
    if (intentTimer.current !== null) {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = null;
    }
    if (graceTimer.current !== null) {
      window.clearTimeout(graceTimer.current);
      graceTimer.current = null;
    }
  }, []);

  const open = useCallback((rect: DOMRect | null, username: string) => {
    if (!rect) return;
    pendingUserRef.current = username;
    setCard({ username, rect });
    setStatus("loading");
    const cached = cacheRef.current.get(username);
    if (cached) {
      setData(cached);
      setStatus("ready");
      return;
    }
    void api<UserCard>(`/api/users/${encodeURIComponent(username)}/card`)
      .then((res) => {
        cacheRef.current.set(res.username, res);
        if (pendingUserRef.current === username) {
          setData(res);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (pendingUserRef.current === username) setStatus("error");
      });
  }, []);

  const hover = useCallback(
    (rect: DOMRect | null, username: string) => {
      if (!canHover) return;
      insideRef.current = true;
      if (graceTimer.current !== null) {
        window.clearTimeout(graceTimer.current);
        graceTimer.current = null;
      }
      if (intentTimer.current !== null) {
        window.clearTimeout(intentTimer.current);
      }
      intentTimer.current = window.setTimeout(() => open(rect, username), INTENT_DELAY);
    },
    [canHover, open],
  );

  const leave = useCallback(() => {
    insideRef.current = false;
    if (intentTimer.current !== null) {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = null;
    }
    if (graceTimer.current !== null) {
      window.clearTimeout(graceTimer.current);
    }
    graceTimer.current = window.setTimeout(() => {
      if (!insideRef.current) setCard(null);
    }, GRACE_DELAY);
  }, []);

  const show = useCallback(
    (rect: DOMRect | null, username: string) => {
      insideRef.current = true;
      clearTimers();
      open(rect, username);
    },
    [clearTimers, open],
  );

  const hide = useCallback(() => {
    insideRef.current = false;
    clearTimers();
    setCard(null);
  }, [clearTimers]);

  const enterCard = useCallback(() => {
    insideRef.current = true;
    if (graceTimer.current !== null) {
      window.clearTimeout(graceTimer.current);
      graceTimer.current = null;
    }
  }, []);

  useEffect(() => {
    hide();
  }, [pathname, hide]);

  useEffect(
    () => () => {
      if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
      if (graceTimer.current !== null) window.clearTimeout(graceTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!card) return;
    const el = cardElRef.current;
    const width = el?.offsetWidth ?? CARD_WIDTH;
    const height = el?.offsetHeight ?? 180;
    const gap = CARD_GAP;
    const { innerWidth, innerHeight } = window;
    let top = card.rect.bottom + gap;
    if (top + height > innerHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, card.rect.top - height - gap);
    }
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(card.rect.left, innerWidth - width - VIEWPORT_MARGIN),
    );
    setPos({ top, left });
  }, [card]);

  const value = useMemo(
    () => ({ hover, leave, show, hide, enterCard }),
    [hover, leave, show, hide, enterCard],
  );

  return (
    <UserHoverContext.Provider value={value}>
      {children}      <AnimatePresence>
        {card && (
          <motion.div
            key={card.username}
            ref={cardElRef}
            role="dialog"
            aria-label={`profile preview for ${card.username}`}
            onMouseEnter={enterCard}
            onMouseLeave={leave}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ top: pos.top, left: pos.left, width: CARD_WIDTH }}
            className="fixed z-[80] border border-line-700 bg-core-900/95 p-3 font-mono shadow-[0_16px_40px_-16px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur"
          >
            {status === "loading" && (
              <div className="space-y-2.5 py-1">
                <div className="h-4 w-24 animate-pulse bg-core-700/60" />
                <div className="h-3 w-full animate-pulse bg-core-700/50" />
                <div className="h-3 w-2/3 animate-pulse bg-core-700/50" />
              </div>
            )}
            {status === "error" && (
              <p className="py-2 text-xs text-blood-400">
                $ whoami {card.username} → fetch failed
              </p>
            )}
            {status === "ready" && data && (
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-neon-500/40 bg-neon-500/10 text-sm font-semibold text-neon-400">
                    {data.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neon-400">
                      @{data.username}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-ink-500">
                      <TbCalendar size={11} /> joined {fmtDate(data.createdAt)}
                    </p>
                  </div>
                </div>

                <dl className="mt-2.5 grid grid-cols-4 gap-px border border-line-800 bg-line-800 text-center">
                  <div className="bg-core-900/80 px-1 py-1.5">
                    <dt className="text-[9px] uppercase tracking-wider text-ink-500">writeups</dt>
                    <dd className="text-xs text-ink-200">{data.stats.writeups}</dd>
                  </div>
                  <div className="bg-core-900/80 px-1 py-1.5">
                    <dt className="text-[9px] uppercase tracking-wider text-ink-500">likes</dt>
                    <dd className="flex items-center justify-center gap-0.5 text-xs text-ink-200">
                      <TbHeart size={10} className="text-neon-500" /> {data.stats.likes}
                    </dd>
                  </div>
                  <div className="bg-core-900/80 px-1 py-1.5">
                    <dt className="text-[9px] uppercase tracking-wider text-ink-500">comments</dt>
                    <dd className="flex items-center justify-center gap-0.5 text-xs text-ink-200">
                      <TbMessageCircle size={10} /> {data.stats.comments}
                    </dd>
                  </div>
                  <div className="bg-core-900/80 px-1 py-1.5">
                    <dt className="text-[9px] uppercase tracking-wider text-ink-500">views</dt>
                    <dd className="flex items-center justify-center gap-0.5 text-xs text-ink-200">
                      <TbEye size={10} /> {data.stats.views}
                    </dd>
                  </div>
                </dl>

                {data.bio && (
                  <p className="mt-2.5 line-clamp-3 text-[11px] leading-relaxed text-ink-400">
                    {data.bio}
                  </p>
                )}

                {data.interests && data.interests.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {data.interests.slice(0, 4).map((interest) => (
                      <span key={interest} className="tag text-[9px]">
                        {interest}
                      </span>
                    ))}
                    {data.interests.length > 4 && (
                      <span className="tag text-[9px]">+{data.interests.length - 4}</span>
                    )}
                  </div>
                )}

                <Link
                  to={`/users/${data.username}`}
                  className="mt-3 flex items-center gap-1 border-t border-line-800 pt-2 text-[11px] text-ink-400 transition-colors hover:text-neon-400"
                >
                  <TbExternalLink size={12} className="text-neon-500" /> view full profile
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </UserHoverContext.Provider>
  );
};
