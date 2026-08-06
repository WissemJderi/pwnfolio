import { useLocation, Route, Routes, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { PageTransition } from "./components/PageTransition";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { WriteupPage } from "./pages/WriteupPage";
import { EditorPage } from "./pages/EditorPage";
import { MyWriteupsPage } from "./pages/MyWriteupsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { NotFoundPage } from "./pages/NotFoundPage";

const Layout = () => (
  <div className="min-h-screen">
    <Sidebar />
    <div className="flex min-h-screen flex-col lg:pl-72">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
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
                <LoginPage />
              </PageTransition>
            }
          />
          <Route
            path="/register"
            element={
              <PageTransition>
                <RegisterPage />
              </PageTransition>
            }
          />
          <Route
            path="/writeups/:id"
            element={
              <PageTransition>
                <WriteupPage />
              </PageTransition>
            }
          />
          <Route
            path="/writeups/new"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <EditorPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/writeups/:id/edit"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <EditorPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/writeups"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <MyWriteupsPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:username"
            element={
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
