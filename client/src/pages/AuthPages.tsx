import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

const useRedirectAfterLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return () => {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
  };
};

const AuthCard = ({
  title,
  submitLabel,
  onSubmit,
  footer,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: React.ReactNode;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const redirect = useRedirectAfterLogin();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(email, password);
      redirect();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm pt-16">
      <h1 className="text-2xl font-bold">{title}</h1>
      <form className="card mt-6 space-y-4" onSubmit={(e) => void submit(e)}>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Password</label>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "…" : submitLabel}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">{footer}</p>
    </div>
  );
};

export const LoginPage = () => {
  const { login } = useAuth();
  return (
    <AuthCard
      title="Log in"
      submitLabel="Log in"
      onSubmit={login}
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-emerald-300 hover:underline">
            Create an account
          </Link>
        </>
      }
    />
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  return (
    <AuthCard
      title="Create an account"
      submitLabel="Register"
      onSubmit={register}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-300 hover:underline">
            Log in
          </Link>
        </>
      }
    />
  );
};
