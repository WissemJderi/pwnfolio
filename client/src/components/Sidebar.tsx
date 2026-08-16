import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { version } from "../../package.json";
import {
  TbBookmark,
  TbBooks,
  TbLogout,
  TbMenu2,
  TbSquareRoundedPlus,
  TbUsers,
  TbWriting,
  TbX,
} from "react-icons/tb";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2  border px-3 py-2 font-mono text-sm transition-colors ${
    isActive
      ? "border-neon-500/30 bg-neon-500/10 text-neon-400"
      : "border-transparent text-ink-400 hover:bg-core-800/60 hover:text-ink-100"
  }`;

const iconClass = "text-ink-500 group-hover:text-neon-400";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = (
    <>
      {user && (
        <NavLink to="/writeups/new" className={linkClass}>
          <TbSquareRoundedPlus size={15} className={iconClass} />
          new-writeup
        </NavLink>
      )}
      {user && (
        <NavLink to="/me/writeups" className={linkClass}>
          <TbWriting size={15} className={iconClass} />
          my-writeups
        </NavLink>
      )}
      {user && (
        <NavLink to="/me/saved" className={linkClass}>
          <TbBookmark size={15} className={iconClass} />
          my-saved
        </NavLink>
      )}
      {user && (
        <NavLink to="/me/activity" className={linkClass}>
          <TbUsers size={15} className={iconClass} />
          activity-feed
        </NavLink>
      )}
      <NavLink to="/" end className={linkClass}>
        <TbBooks size={15} className={iconClass} />
        all-writeups
      </NavLink>
    </>
  );

  const accountBlock = user ? (
    <div className="flex items-center gap-3  border border-line-700 bg-core-800/50 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center  border border-neon-500/40 bg-neon-500/10 font-mono font-semibold text-neon-400">
        {user.username.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={`/users/${user.username}`}
          className="block truncate font-mono text-sm text-neon-400 hover:underline"
        >
          @{user.username}
        </Link>
        <p className="truncate font-mono text-[11px] text-ink-500">
          {user.email}
        </p>
      </div>
      <NotificationBell />
      <button
        title="Logout"
        className="btn btn-ghost px-2 py-1 text-xs"
        onClick={() => void logout()}
      >
        <TbLogout size={15} />
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      <Link to="/login" className="btn btn-outline justify-center text-xs">
        login
      </Link>
      <Link to="/register" className="btn btn-primary justify-center text-xs">
        register
      </Link>
    </div>
  );

  const statusLine = (
    <p className="flex items-center justify-between font-mono text-[10px] text-ink-500">
      <span>pwnfolio v{version}</span>
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping bg-neon-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 bg-neon-500 shadow-[0_0_6px_rgba(var(--pf-glow),0.6)]" />
        </span>
        online
      </span>
    </p>
  );

  const brand = (fs?: string) => (
    <Link to="/" className="flex items-center gap-2.5">
      <span className={`font-mono font-semibold tracking-tight ${fs ?? "text-xl"}`}>
        pwn<span className="text-neon-400">folio</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* ----- desktop sidebar ----- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line-800 bg-core-900/80 backdrop-blur lg:flex xl:w-72">
        <div className="px-5 pb-4 pt-6">
          {brand()}
          <p className="mt-2 font-mono text-[11px] text-ink-500">
            // writeups for hackers, by hackers
          </p>
        </div>

        <div className="mx-5 border-t border-line-800" />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
            fs://writeups
          </p>
          <div className="flex flex-col gap-1">{links}</div>
        </nav>

        <div className="space-y-3 border-t border-line-800 px-4 py-4">
          {accountBlock}
          <ThemeToggle />
          {statusLine}
        </div>
      </aside>

      {/* ----- mobile topbar + drawer nav ----- */}
      <header className="sticky top-0 z-40 border-b border-line-800 bg-core-900/85 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {brand("text-base")}
          <button
            type="button"
            title={open ? "close menu" : "open menu"}
            aria-label="toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center  border border-line-700 bg-core-800/60 text-ink-300 transition-colors hover:border-neon-500/40 hover:text-neon-400"
          >
            {open ? <TbX size={18} /> : <TbMenu2 size={18} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="site navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-[70] flex w-64 max-w-[85vw] flex-col border-r border-line-800 bg-core-900/95 backdrop-blur lg:hidden"
            >
              <div className="flex items-center justify-between px-4 pb-4 pt-5">
                {brand("text-base")}
                <button
                  type="button"
                  title="close menu"
                  aria-label="close navigation"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center  border border-line-700 bg-core-800/60 text-ink-300 transition-colors hover:border-neon-500/40 hover:text-neon-400"
                >
                  <TbX size={16} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto border-t border-line-800 px-3 py-4">
                <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
                  fs://writeups
                </p>
                <div className="flex flex-col gap-1">{links}</div>
              </nav>

              <div className="space-y-3 border-t border-line-800 px-4 py-4">
                {accountBlock}
                <ThemeToggle />
                {statusLine}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};