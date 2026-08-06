import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <p className="py-16 text-center text-slate-400">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};
