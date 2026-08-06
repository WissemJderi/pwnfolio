import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setAccessToken } from "../api/client";
import type { AuthResponse, User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "pwnfolio:auth";

const AuthContext = createContext<AuthContextValue | null>(null);

const readStored = (): { user: User; accessToken: string } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { user: User; accessToken: string }) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      setInitializing(false);
      return;
    }
    setUser(stored.user);
    setAccessToken(stored.accessToken);
    api("/api/users/me/writeups")
      .catch(() => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setInitializing(false));
  }, []);

  const saveSession = (res: AuthResponse) => {
    setAccessToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: res.user, accessToken: res.accessToken }),
    );
  };

  const login = async (email: string, password: string) => {
    const res = await api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveSession(res);
  };

  const register = async (email: string, password: string) => {
    const res = await api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveSession(res);
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // the refresh cookie is cleared on the server even if this fails
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
