import { lazy, Suspense, type ReactNode } from "react";
import { useLocation, Route, Routes, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { PageTransition } from "./components/PageTransition";
import { ScrollRestoration } from "./components/ScrollRestoration";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";

const WriteupPage = lazy(() =>
  import("./pages/WriteupPage").then((m) => ({ default: m.WriteupPage })),
);
const EditorPage = lazy(() =>
  import("./pages/EditorPage").then((m) => ({ default: m.EditorPage })),
);
const MyWriteupsPage = lazy(() =>
  import("./pages/MyWriteupsPage").then((m) => ({ default: m.MyWriteupsPage })),
);
const SavedWriteupsPage = lazy(() =>
  import("./pages/SavedWriteupsPage").then((m) => ({ default: m.SavedWriteupsPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const StatsPage = lazy(() =>
  import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })),
);
const LoginPage = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.RegisterPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

const PageLoader = () => (
  <div className="py-24 text-center font-mono text-sm text-ink-500">
    <span className="text-neon-400">$</span> cat ./page.bundle…
    <span className="cursor" />
  </div>
);

const Lazy = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const Layout = () => (
  <div className="min-h-screen">
    <Sidebar />
    <div className="flex min-h-screen flex-col lg:pl-60 xl:pl-72">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 md:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-line-800 px-6 py-6 text-center font-mono text-xs text-ink-500">
        pwnfolio — writeups for hackers, by hackers [ act like you belong ]
      </footer>
    </div>
  </div>
);

export default function App() {
  const location = useLocation();
  return (
    <>
      <ScrollRestoration />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <HomePage />
              </PageTransition>
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <Lazy>
                  <LoginPage />
                </Lazy>
              </PageTransition>
            }
          />
          <Route
            path="/register"
            element={
              <PageTransition>
                <Lazy>
                  <RegisterPage />
                </Lazy>
              </PageTransition>
            }
          />
          <Route
            path="/writeups/:id"
            element={
              <PageTransition>
                <Lazy>
                  <WriteupPage />
                </Lazy>
              </PageTransition>
            }
          />
          <Route
            path="/writeups/new"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Lazy>
                    <EditorPage />
                  </Lazy>
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/writeups/:id/edit"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Lazy>
                    <EditorPage />
                  </Lazy>
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/writeups"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Lazy>
                    <MyWriteupsPage />
                  </Lazy>
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/saved"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Lazy>
                    <SavedWriteupsPage />
                  </Lazy>
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:username"
            element={
              <PageTransition>
                <Lazy>
                  <ProfilePage />
                </Lazy>
              </PageTransition>
            }
          />
          <Route
            path="/users/:username/stats"
            element={
              <PageTransition>
                <Lazy>
                  <StatsPage />
                </Lazy>
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <Lazy>
                  <NotFoundPage />
                </Lazy>
              </PageTransition>
            }
          />
        </Route>
      </Routes>
      </AnimatePresence>
    </>
  );
}
