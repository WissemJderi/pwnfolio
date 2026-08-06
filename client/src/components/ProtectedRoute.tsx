import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <p className="cursor py-20 text-center font-mono text-ink-400">
        verifying credentials…
      </p>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};
