import { Route, Routes, Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { WriteupPage } from "./pages/WriteupPage";
import { EditorPage } from "./pages/EditorPage";
import { MyWriteupsPage } from "./pages/MyWriteupsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { NotFoundPage } from "./pages/NotFoundPage";

const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Outlet />
    </main>
    <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
      pwnfolio — writeups for hackers, by hackers
    </footer>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/writeups/:id" element={<WriteupPage />} />
        <Route
          path="/writeups/new"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/writeups/:id/edit"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/writeups"
          element={
            <ProtectedRoute>
              <MyWriteupsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:username" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
