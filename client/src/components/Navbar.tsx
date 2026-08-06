import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-slate-800 text-emerald-300"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight">
          pwn<span className="text-emerald-400">folio</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            Writeups
          </NavLink>
          {user && (
            <>
              <NavLink to="/writeups/new" className={navLinkClass}>
                New writeup
              </NavLink>
              <NavLink to="/me/writeups" className={navLinkClass}>
                My writeups
              </NavLink>
            </>
          )}
        </nav>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              to={`/users/${user.username}`}
              className="text-sm text-emerald-300 hover:underline"
            >
              @{user.username}
            </Link>
            <button className="btn-outline" onClick={() => void logout()}>
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
