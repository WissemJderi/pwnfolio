import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-sm transition-colors ${
    isActive
      ? "border-neon-500/30 bg-neon-500/10 text-neon-400"
      : "border-transparent text-ink-400 hover:bg-core-800/60 hover:text-ink-100"
  }`;

const prompt = "❯";

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const links = (
    <>
      {user && (
        <NavLink to="/writeups/new" className={linkClass}>
          <span className="text-ink-500 group-hover:text-neon-400">+</span>
          new-writeup
        </NavLink>
      )}
      {user && (
        <NavLink to="/me/writeups" className={linkClass}>
          <span className="text-ink-500 group-hover:text-neon-400">≡</span>
          my-writeups
        </NavLink>
      )}
      <NavLink to="/" end className={linkClass}>
        <span className="text-ink-500 group-hover:text-neon-400">⌘</span>
        all-writeups
      </NavLink>
    </>
  );

  return (
    <>
      {/* ----- desktop sidebar ----- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line-800 bg-core-900/80 backdrop-blur lg:flex">
        <div className="px-5 pb-4 pt-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-neon-500/40 bg-neon-500/10 font-mono text-lg text-neon-400 shadow-[0_0_14px_-4px_rgba(158,239,0,0.6)]">
              ❯
            </span>
            <span className="font-mono text-xl font-semibold tracking-tight">
              pwn<span className="text-neon-400">folio</span>
            </span>
          </Link>
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
          {user ? (
            <div className="flex items-center gap-3 rounded-md border border-line-700 bg-core-800/50 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neon-500/40 bg-neon-500/10 font-mono font-semibold text-neon-400">
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
              <button
                title="Logout"
                className="btn btn-ghost px-2 py-1 text-xs"
                onClick={() => void logout()}
              >
                ↪
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
          )}

          <p className="flex items-center justify-between font-mono text-[10px] text-ink-500">
            <span>ne0n-core v1.0.0</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-500 shadow-[0_0_6px_rgba(158,239,0,0.9)]" />
              online
            </span>
          </p>
        </div>
      </aside>

      {/* ----- mobile topbar ----- */}
      <header className="sticky top-0 z-40 border-b border-line-800 bg-core-900/85 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-neon-500/40 bg-neon-500/10 font-mono text-sm text-neon-400">
              {prompt}
            </span>
            <span className="font-mono text-base font-semibold">
              pwn<span className="text-neon-400">folio</span>
            </span>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={`/users/${user.username}`}
                className="font-mono text-sm text-neon-400"
              >
                @{user.username}
              </Link>
              <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => void logout()}>
                ↪
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-outline px-3 py-1.5 text-xs">
                login
              </Link>
              <Link to="/register" className="btn btn-primary px-3 py-1.5 text-xs">
                register
              </Link>
            </div>
          )}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {links}
        </nav>
      </header>
    </>
  );
};
